// GameAudio v4 - BGM via HTML5 Audio, SFX via Web Audio API
// BGM: HTML5 <audio> element (most reliable, no signal chain artifacts)
// SFX: oscillator/noise synthesis (Web Audio API, unchanged)
// v4 fixes: removed WaveShaper+EQ chain that caused clipping distortion on 0dBFS files

const GameAudio = (() => {
  let ctx;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // BGM via HTML5 Audio (simple, reliable, no DSP artifacts)
  let bgmAudio = null;
  let bgmPlaying = false;
  let bgmCurrentName = '';
  let muted = false;
  const BGM_VOL = 0.28;

  // BGM文件映射
  const bgmMap = {
    '2048':          '/audio/2048_galaxy.mp3?v=6',
    'typing-speed':  '/audio/typing_cyber.mp3?v=6',
    'color-sort':    '/audio/color_crystal.mp3?v=6',
    'word-puzzle':   '/audio/word_parchment.mp3?v=6',
    'dessert-blast': '/audio/dessert_candy.mp3?v=6',
    'kitty-cafe':    '/audio/kitty_cafe.mp3?v=6',
    'paint-splash':  '/audio/paint_splash.mp3?v=6',
    'catch-turkey':  '/audio/turkey_farm.mp3?v=6',
    'flappy-wings':  '/audio/flappy_cyber.mp3?v=6',
    'whack-a-mole':  '/audio/whack_steam.mp3?v=6',
    'memory-match':  '/audio/memory_circus.mp3?v=6',
    'idle-clicker':  '/audio/alchemy_magic.mp3?v=6',
  };

  // SFX合成器 (Web Audio API, 独立于BGM)
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

  // SFX定义 (全部保留)
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

  const stopBGMInternal = (fade = false) => {
    if (!bgmAudio) return;
    if (fade) {
      // 150ms 淡出防爆音
      const a = bgmAudio;
      const startVol = a.volume;
      const step = startVol / 15;
      let v = startVol;
      const t = setInterval(() => {
        v -= step;
        if (v <= 0) { a.pause(); a.currentTime = 0; clearInterval(t); }
        else a.volume = v;
      }, 10);
    } else {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
    bgmAudio = null;
    bgmPlaying = false;
    bgmCurrentName = '';
  };

  return {
    play: (name) => {
      if (muted) return;
      const fn = sfxDefs[name];
      if (fn) fn();
    },

    playBGM: (gameName) => {
      if (muted) return;
      if (bgmPlaying && bgmCurrentName === gameName) return;
      stopBGMInternal(false);

      const url = bgmMap[gameName];
      if (!url) return;

      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0;  // 先静音，淡入
      bgmAudio = audio;
      bgmPlaying = true;
      bgmCurrentName = gameName;

      // 1秒淡入
      audio.play().then(() => {
        let v = 0;
        const target = BGM_VOL;
        const step = target / 40;
        const t = setInterval(() => {
          v = Math.min(v + step, target);
          if (bgmAudio === audio) audio.volume = v;
          if (v >= target) clearInterval(t);
        }, 25);
      }).catch(() => {
        bgmPlaying = false;
        bgmCurrentName = '';
        bgmAudio = null;
      });
    },

    stopBGM: () => stopBGMInternal(true),

    switchBGM: (gameName) => {
      if (bgmCurrentName === gameName) return;
      GameAudio.stopBGM();
      setTimeout(() => GameAudio.playBGM(gameName), 200);
    },

    toggleMute: () => {
      muted = !muted;
      if (muted) {
        if (bgmAudio) bgmAudio.volume = 0;
        if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      } else {
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        if (bgmAudio) bgmAudio.volume = BGM_VOL;
      }
      return muted;
    },

    resumeContext: () => {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },

    isMuted: () => muted,
    isPlaying: () => bgmPlaying,

    // 兼容旧接口（game-audio-auto.js 调用 playBGM）
    bgmBuffer: null,
  };
})();

// 离开页面时停止 BGM
window.addEventListener('pagehide', () => { try { GameAudio.stopBGM(); } catch(e) {} });
window.addEventListener('beforeunload', () => { try { GameAudio.stopBGM(); } catch(e) {} });
