// GameAudio - 游戏音效和背景音乐库
// 使用Web Audio API合成SFX + MusicGen生成的BGM

const GameAudio = (() => {
  let ctx;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  let bgm = null;
  let bgmPlaying = false;
  let muted = false;

  // BGM文件映射
  const bgmMap = {
    '2048': '/audio/2048_galaxy.mp3',
    'typing-speed': '/audio/typing_cyber.mp3',
    'color-sort': '/audio/color_crystal.mp3',
    'word-puzzle': '/audio/word_parchment.mp3',
    'dessert-blast': '/audio/dessert_candy.mp3',
    'catch-turkey': '/audio/turkey_farm.mp3',
    'flappy-wings': '/audio/flappy_cyber.mp3',
    'whack-a-mole': '/audio/whack_steam.mp3',
    'memory-match': '/audio/memory_circus.mp3',
    'idle-clicker': '/audio/alchemy_magic.mp3',
  };

  // SFX合成器
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
  const noise = (dur, vol = 0.3, lpFreq = null, hpFreq = null) => {
    try {
      const ac = getCtx();
      const now = ac.currentTime;
      const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * vol;
      const src = ac.createBufferSource();
      src.buffer = buf;
      let node = src;
      if (lpFreq) {
        const lp = ac.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = lpFreq;
        node.connect(lp); node = lp;
      }
      if (hpFreq) {
        const hp = ac.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = hpFreq;
        node.connect(hp); node = hp;
      }
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      node.connect(g);
      g.connect(ac.destination);
      src.start(now);
    } catch(e) {}
  };

  // 预定义音效
  const sfxDefs = {
    tap:       () => synth(1200, 0.05, 'sine', 0.4),
    click:     () => synth(800, 0.06, 'square', 0.25),
    coin:      () => { synth(1320, 0.15, 'sine', 0.5); setTimeout(() => synth(1760, 0.15, 'sine', 0.4), 70); },
    error:     () => synth(200, 0.3, 'square', 0.5),
    win:       () => { synth(523, 0.15, 'sine', 0.5); setTimeout(() => synth(659, 0.15, 'sine', 0.45), 100); setTimeout(() => synth(784, 0.15, 'sine', 0.4), 200); setTimeout(() => synth(1047, 0.3, 'sine', 0.5), 300); },
    explosion: () => noise(0.6, 0.7, 800),
    match:     () => { synth(660, 0.12, 'sine', 0.5); setTimeout(() => synth(880, 0.12, 'sine', 0.45), 80); setTimeout(() => synth(1100, 0.2, 'sine', 0.4), 160); },
    merge:     () => synth(440, 0.2, 'sine', 0.5),
    supernova: () => { noise(0.8, 0.6, 3000); synth(200, 0.8, 'sine', 0.3); },
    upgrade:   () => { synth(523, 0.1, 'sine', 0.5); setTimeout(() => synth(659, 0.1, 'sine', 0.45), 80); setTimeout(() => synth(784, 0.2, 'sine', 0.5), 160); },
    magic:     () => { synth(528, 0.5, 'sine', 0.4); synth(1056, 0.5, 'sine', 0.2); },
    death:     () => synth(400, 0.5, 'sawtooth', 0.4),
    turkey:    () => noise(0.2, 0.4, 600, 200),
    flap:      () => noise(0.06, 0.35, null, 600),
    whack:     () => noise(0.15, 0.7, 500),
    flip:      () => synth(800, 0.12, 'sine', 0.35),
    crystal:   () => synth(2093, 0.4, 'sine', 0.4),
    whoosh:    () => noise(0.12, 0.3, null, 2000),
    keytype:   () => noise(0.04, 0.3, 4000, 2000),
    glitch:    () => synth(60, 0.2, 'square', 0.5),
    pour:      () => noise(0.3, 0.3, 1500, 300),
    combo:     () => { for(let i=0;i<5;i++) setTimeout(() => synth(440+i*110, 0.1, 'sine', 0.4), i*50); },
    levelup:   () => { for(let i=0;i<4;i++) setTimeout(() => synth(523*(1+i*0.25), 0.15, 'sine', 0.5), i*100); },
    swoosh:    () => { noise(0.15, 0.25, 2000, 500); synth(600, 0.15, 'sine', 0.2); },
  };

  return {
    play: (name, vol) => {
      if (muted) return;
      const fn = sfxDefs[name];
      if (fn) fn();
    },

    playBGM: (gameName) => {
      if (bgmPlaying || muted) return;
      const url = bgmMap[gameName];
      if (!url) return;
      bgm = new Audio(url);
      bgm.loop = true;
      bgm.volume = 0.25;
      bgm.play().catch(() => {});
      bgmPlaying = true;
    },

    stopBGM: () => {
      if (bgm) { bgm.pause(); bgm.currentTime = 0; }
      bgmPlaying = false;
    },

    toggleMute: () => {
      muted = !muted;
      if (muted && bgm) bgm.pause();
      else if (!muted && bgmPlaying && bgm) bgm.play().catch(() => {});
      return muted;
    },

    isMuted: () => muted,
  };
})();

// 自动启动BGM（第一次交互后）
document.addEventListener('click', function _startBGM() {
  const path = window.location.pathname.split('/').filter(Boolean)[0] || '2048';
  GameAudio.playBGM(path);
  document.removeEventListener('click', _startBGM);
}, { once: true });
