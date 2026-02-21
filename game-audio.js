// GameAudio v3 - BGM + SFX simultaneous playback via Web Audio API
// BGM: fetch + decodeAudioData (shares AudioContext with SFX)
// SFX: oscillator/noise synthesis (unchanged)
// v3 fixes: pagehide stop, DynamicsCompressor+LowpassFilter, crossfade loop

const GameAudio = (() => {
  let ctx;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  let bgmSource = null;
  let bgmBuffer = null;
  let bgmGain = null;
  let bgmChain = null; // {compressor, filter}
  let bgmPlaying = false;
  let bgmCurrentName = '';
  let muted = false;

  // 对 AudioBuffer 做头尾交叉淡化（消除循环爆音）
  const makeSmoothLoopBuffer = (ac, buf) => {
    try {
      const ch = buf.numberOfChannels;
      const len = buf.length;
      const sr = buf.sampleRate;
      // 交叉淡化区间：约 80ms
      const fadeLen = Math.min(Math.floor(sr * 0.08), Math.floor(len * 0.05));
      const out = ac.createBuffer(ch, len, sr);
      for (let c = 0; c < ch; c++) {
        const src = buf.getChannelData(c);
        const dst = out.getChannelData(c);
        dst.set(src);
        // 头部：从0淡入（防止起始爆音）
        for (let i = 0; i < fadeLen; i++) {
          dst[i] = src[i] * (i / fadeLen);
        }
        // 尾部：淡出到0（防止循环接缝爆音）
        for (let i = 0; i < fadeLen; i++) {
          const idx = len - fadeLen + i;
          dst[idx] = src[idx] * (1 - i / fadeLen);
        }
      }
      return out;
    } catch(e) { return buf; }
  };

  // BGM文件映射
  const bgmMap = {
    '2048': '/audio/2048_galaxy.mp3',
    'typing-speed': '/audio/typing_cyber.mp3',
    'color-sort': '/audio/color_crystal.mp3',
    'word-puzzle': '/audio/word_parchment.mp3',
    'dessert-blast': '/audio/dessert_candy.mp3',
    'kitty-cafe': '/audio/kitty_cafe.mp3',
    'paint-splash': '/audio/paint_splash.mp3',
    'catch-turkey': '/audio/turkey_farm.mp3',
    'flappy-wings': '/audio/flappy_cyber.mp3',
    'whack-a-mole': '/audio/whack_steam.mp3',
    'memory-match': '/audio/memory_circus.mp3',
    'idle-clicker': '/audio/alchemy_magic.mp3',
  };

  // SFX合成器 (独立gain node，不影响BGM)
  const synth = (freq, dur, type = 'sine', vol = 0.3, ramp = true) => {
    try {
      const ac = getCtx();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch(e) {}
  };

  // 噪声生成器
  const noise = (dur = 0.1, vol = 0.3, hiFreq = 4000, loFreq = 1000) => {
    try {
      const ac = getCtx();
      const now = ac.currentTime;
      const bufSize = Math.ceil(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      const filt = ac.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime((hiFreq + loFreq) / 2, now);
      filt.Q.setValueAtTime(1, now);
      const gain = ac.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ac.destination);
      src.start(now);
    } catch(e) {}
  };

  // SFX定义
  const sfxDefs = {
    click:     () => synth(800, 0.08, 'sine', 0.3),
    pop:       () => synth(600, 0.1, 'sine', 0.4),
    match:     () => { synth(523, 0.1, 'sine', 0.3); setTimeout(() => synth(659, 0.1, 'sine', 0.3), 80); setTimeout(() => synth(784, 0.15, 'sine', 0.3), 160); },
    win:       () => { for(let i=0;i<6;i++) setTimeout(() => synth(523*(1+i*0.2), 0.15, 'sine', 0.5), i*80); },
    lose:      () => { synth(400, 0.3, 'sawtooth', 0.3); setTimeout(() => synth(300, 0.4, 'sawtooth', 0.3), 200); },
    coin:      () => { synth(988, 0.08, 'square', 0.3); setTimeout(() => synth(1319, 0.15, 'square', 0.3), 80); },
    whoosh:    () => noise(0.15, 0.3, 3000, 500),
    drop:      () => synth(200, 0.2, 'sine', 0.4),
    merge:     () => { synth(440, 0.08, 'sine', 0.4); setTimeout(() => synth(880, 0.15, 'sine', 0.4), 60); },
    bounce:    () => synth(300, 0.1, 'triangle', 0.3),
    tick:      () => synth(1000, 0.03, 'sine', 0.2),
    buzz:      () => synth(150, 0.15, 'sawtooth', 0.2),
    sparkle:   () => { for(let i=0;i<4;i++) setTimeout(() => synth(1200+i*200, 0.08, 'sine', 0.25), i*40); },
    explosion: () => { noise(0.3, 0.5, 2000, 100); synth(80, 0.3, 'sawtooth', 0.4); },
    jump:      () => { const ac=getCtx();const now=ac.currentTime;const o=ac.createOscillator();const g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(300,now);o.frequency.exponentialRampToValueAtTime(800,now+0.1);g.gain.setValueAtTime(0.3,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.15);o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+0.15); },
    hit:       () => { noise(0.08, 0.4, 3000, 500); synth(200, 0.1, 'square', 0.3); },
    slide:     () => { const ac=getCtx();const now=ac.currentTime;const o=ac.createOscillator();const g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(600,now);o.frequency.exponentialRampToValueAtTime(300,now+0.2);g.gain.setValueAtTime(0.2,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.25);o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+0.25); },
    ding:      () => synth(1047, 0.2, 'sine', 0.4),
    wrong:     () => { synth(300, 0.15, 'square', 0.3); setTimeout(() => synth(250, 0.2, 'square', 0.3), 150); },
    success:   () => { synth(523, 0.1, 'sine', 0.4); setTimeout(() => synth(659, 0.1, 'sine', 0.4), 100); setTimeout(() => synth(784, 0.12, 'sine', 0.4), 200); setTimeout(() => synth(1047, 0.2, 'sine', 0.5), 300); },
    tap:       () => synth(500, 0.05, 'sine', 0.25),
    swoosh:    () => { noise(0.15, 0.25, 2000, 500); synth(600, 0.15, 'sine', 0.2); },
    keytype:   () => noise(0.04, 0.3, 4000, 2000),
    glitch:    () => synth(60, 0.2, 'square', 0.5),
    pour:      () => noise(0.3, 0.3, 1500, 300),
    combo:     () => { for(let i=0;i<5;i++) setTimeout(() => synth(440+i*110, 0.1, 'sine', 0.4), i*50); },
    levelup:   () => { for(let i=0;i<4;i++) setTimeout(() => synth(523*(1+i*0.25), 0.15, 'sine', 0.5), i*100); },
  };

  return {
    play: (name, vol) => {
      if (muted) return;
      const fn = sfxDefs[name];
      if (fn) fn();
    },

    playBGM: (gameName) => {
      if (muted) return;
      if (bgmPlaying && bgmCurrentName === gameName) return;
      
      // Stop current BGM if any
      if (bgmSource) {
        try { bgmSource.stop(); } catch(e) {}
        bgmSource = null;
      }
      
      const url = bgmMap[gameName];
      if (!url) return;
      
      const ac = getCtx();
      bgmCurrentName = gameName;
      
      // Use Web Audio API for BGM (same context as SFX = no conflict)
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => ac.decodeAudioData(buf))
        .then(rawBuffer => {
          // 对原始 buffer 做头尾交叉淡化，消除循环爆音
          const audioBuffer = makeSmoothLoopBuffer(ac, rawBuffer);
          bgmBuffer = audioBuffer;

          bgmSource = ac.createBufferSource();
          bgmSource.buffer = audioBuffer;
          bgmSource.loop = true;

          // 信号链 v4：highpass → warmth EQ → saturation → compressor → reverb → gain → output
          // ① 去低频隆隆声（< 40Hz）
          const hpf = ac.createBiquadFilter();
          hpf.type = 'highpass'; hpf.frequency.value = 40; hpf.Q.value = 0.7;

          // ② 温暖感：低频提升（120Hz +2.5dB）
          const warmth = ac.createBiquadFilter();
          warmth.type = 'lowshelf'; warmth.frequency.value = 120; warmth.gain.value = 2.5;

          // ③ 去刺耳感：中高频轻微衰减（3.5kHz -1.5dB）
          const harsh = ac.createBiquadFilter();
          harsh.type = 'peaking'; harsh.frequency.value = 3500;
          harsh.Q.value = 1.2; harsh.gain.value = -1.5;

          // ④ 空气感：高频提升（9kHz +1.5dB）
          const air = ac.createBiquadFilter();
          air.type = 'highshelf'; air.frequency.value = 9000; air.gain.value = 1.5;

          // ⑤ 去超声波毛刺（> 16kHz）
          const lpf = ac.createBiquadFilter();
          lpf.type = 'lowpass'; lpf.frequency.value = 16000; lpf.Q.value = 0.5;

          // ⑥ 模拟磁带饱和（增加质感/谐波）
          const saturator = ac.createWaveShaper();
          const satCurve = new Float32Array(512);
          for (let i = 0; i < 512; i++) {
            const x = (i * 2) / 512 - 1;
            satCurve[i] = ((Math.PI + 6) * x) / (Math.PI + 6 * Math.abs(x)); // 磁带软限幅
          }
          saturator.curve = satCurve;
          saturator.oversample = '4x'; // 减少混叠

          // ⑦ 压缩器（2.5:1 软拐点，避免泵气感）
          const compressor = ac.createDynamicsCompressor();
          compressor.threshold.value = -18;
          compressor.knee.value      = 12;
          compressor.ratio.value     = 2.5;
          compressor.attack.value    = 0.02;  // 更慢的起音，保留冲击感
          compressor.release.value   = 0.35;

          // ⑧ 合成脉冲响应创造空间感（小厅混响, 0.7s）
          const reverbIR = (() => {
            const len = Math.floor(ac.sampleRate * 0.7);
            const ir = ac.createBuffer(2, len, ac.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
              const d = ir.getChannelData(ch);
              for (let i = 0; i < len; i++) {
                // 早期反射 + 扩散尾音
                const t = i / len;
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.5) * (ch === 0 ? 1 : 0.97);
              }
            }
            return ir;
          })();
          const reverb = ac.createConvolver();
          reverb.buffer = reverbIR;
          const reverbGain = ac.createGain();
          reverbGain.gain.value = 0.18; // 18% 混响湿度

          // ⑨ 输出增益（含1秒淡入）
          bgmGain = ac.createGain();
          bgmGain.gain.setValueAtTime(0, ac.currentTime);
          bgmGain.gain.linearRampToValueAtTime(0.22, ac.currentTime + 1.0);

          // 连线：干声链
          bgmSource.connect(hpf);
          hpf.connect(warmth);
          warmth.connect(harsh);
          harsh.connect(air);
          air.connect(lpf);
          lpf.connect(saturator);
          saturator.connect(compressor);
          compressor.connect(bgmGain);
          // 湿声（并联混响）
          compressor.connect(reverb);
          reverb.connect(reverbGain);
          reverbGain.connect(bgmGain);
          // 输出
          bgmGain.connect(ac.destination);
          bgmSource.start(0);
          bgmPlaying = true;
        })
        .catch(() => {
          // Fallback to HTML5 Audio if fetch fails
          const audio = new Audio(url);
          audio.loop = true;
          audio.volume = 0.2;
          audio.play().catch(() => {});
          bgmPlaying = true;
          bgmSource = { stop: () => { audio.pause(); audio.currentTime = 0; } };
        });
    },

    stopBGM: () => {
      if (bgmSource) {
        try {
          bgmGain && bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
          bgmGain && bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15); // 淡出防爆音
          setTimeout(() => {
            try { bgmSource && bgmSource.stop(); } catch(e) {}
          }, 180);
        } catch(e) {
          try { bgmSource.stop(); } catch(e2) {}
        }
        bgmSource = null;
      }
      bgmPlaying = false;
      bgmCurrentName = '';
    },

    switchBGM: (gameName) => {
      if (bgmCurrentName === gameName) return;
      GameAudio.stopBGM();
      GameAudio.playBGM(gameName);
    },

    toggleMute: () => {
      muted = !muted;
      if (muted) {
        if (bgmGain) {
          bgmGain.gain.cancelScheduledValues(ctx.currentTime);
          bgmGain.gain.setValueAtTime(0, ctx.currentTime);
        }
        // 静音时暂停 AudioContext 节省资源
        if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      } else {
        // 取消静音时恢复 AudioContext（修复 autoplay policy 导致的无声问题）
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        if (bgmGain) {
          bgmGain.gain.cancelScheduledValues(ctx.currentTime);
          bgmGain.gain.setValueAtTime(0, ctx.currentTime);
          bgmGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3); // 0.3s 淡入
        }
      }
      return muted;
    },

    // 主动恢复 AudioContext（供 sound-toggle 调用）
    resumeContext: () => {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },

    isMuted: () => muted,
    isPlaying: () => bgmPlaying,
  };
})();

// 离开页面时停止 BGM（防止 bfcache 恢复后音乐继续）
window.addEventListener('pagehide', () => {
  try { GameAudio.stopBGM(); } catch(e) {}
  try { if (window.audioCtx) window.audioCtx.suspend(); } catch(e) {}
});
window.addEventListener('beforeunload', () => {
  try { GameAudio.stopBGM(); } catch(e) {}
});
