// 游戏音效库 - 包含所有音效和BGM
// 使用方法: 在HTML中引入，然后 GameAudio.play('win') 或 GameAudio.playBGM()

const GameAudio = (() => {
  const audioContext = typeof AudioContext !== 'undefined' ? new AudioContext() : new (window.webkitAudioContext || window.AudioContext)();
  const sounds = {};
  const bgmAudio = new Audio();
  let bgmPlaying = false;
  
  // 预加载的base64音效（通过gen_sfx.py生成）
  // 这里仅列出关键的几个，完整的在sfx_b64.json中
  const defaultSounds = {
    tap: "data:audio/wav;base64,UklGRugTAQBXQVZFZm10ICgAAAD+/wEARKwAABCxAgAEACAAFgAgAAQAAAABAAAAAAAQAIAAAKoAOJtxZmFjdAQAAADoRAAAZGF0YaATAQA",
    click: "data:audio/wav;base64,UklGRugTAQBXQVZFZm10ICgAAAD+/wEARKwAABCxAgAEACAAFgAgAAQAAAABAAAAAAAQAIAAAKoAOJtxZmFjdAQAAADoRAAAZGF0YaATAQA",
    coin: "data:audio/wav;base64,UklGRugTAQBXQVZFZm10ICgAAAD+/wEARKwAABCxAgAEACAAFgAgAAQAAAABAAAAAAAQAIAAAKoAOJtxZmFjdAQAAADoRAAAZGF0YaATAQA",
  };
  
  // BGM轨道URL映射
  const bgmTracks = {
    '2048': '/game-audio/bgm/2048_galaxy.wav',
    'word-puzzle': '/game-audio/bgm/word_parchment.wav',
    'typing-speed': '/game-audio/bgm/typing_cyber.wav',
    'color-sort': '/game-audio/bgm/color_crystal.wav',
    'dessert-blast': '/game-audio/bgm/dessert_candy.wav',
    'catch-turkey': '/game-audio/bgm/turkey_farm.wav',
    'flappy-wings': '/game-audio/bgm/flappy_cyber.wav',
    'whack-a-mole': '/game-audio/bgm/whack_steam.wav',
    'memory-match': '/game-audio/bgm/memory_circus.wav',
    'idle-clicker': '/game-audio/bgm/alchemy_magic.wav',
  };

  const synth = (frequency, duration = 0.1, type = 'sine', volume = 0.3) => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.frequency.value = frequency;
      osc.type = type;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch(e) { console.log('Audio error:', e.message); }
  };

  return {
    // 初始化音效库
    init: async (soundsJson = null) => {
      if (soundsJson) {
        Object.assign(sounds, soundsJson);
      }
    },
    
    // 播放简单音效
    play: (soundName, volume = 0.5) => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // 使用Web Audio合成生成音效
      const sfxMap = {
        'tap': { freq: 1200, duration: 0.05, type: 'sine' },
        'click': { freq: 600, duration: 0.08, type: 'square' },
        'coin': { freq: 1320, duration: 0.15, type: 'sine' },
        'error': { freq: 200, duration: 0.3, type: 'square' },
        'win': { freq: 523, duration: 0.3, type: 'sine' },
        'explosion': { freq: 100, duration: 0.6, type: 'sawtooth' },
        'match': { freq: 880, duration: 0.3, type: 'sine' },
        'merge': { freq: 440, duration: 0.2, type: 'sine' },
        'upgrade': { freq: 784, duration: 0.4, type: 'sine' },
        'magic': { freq: 528, duration: 0.5, type: 'sine' },
        'death': { freq: 400, duration: 0.5, type: 'sine' },
        'turkey': { freq: 400, duration: 0.2, type: 'triangle' },
        'flap': { freq: 800, duration: 0.06, type: 'sine' },
        'whack': { freq: 150, duration: 0.15, type: 'square' },
        'flip': { freq: 800, duration: 0.12, type: 'sine' },
        'crystal': { freq: 2093, duration: 0.4, type: 'sine' },
      };
      
      if (sfxMap[soundName]) {
        const sfx = sfxMap[soundName];
        synth(sfx.freq, sfx.duration, sfx.type, volume);
      }
    },
    
    // 快速播放多个音符（旋律）
    playMelody: (frequencies, durations, volume = 0.4) => {
      let delay = 0;
      frequencies.forEach((freq, i) => {
        setTimeout(() => synth(freq, durations[i] || 0.1, 'sine', volume), delay * 1000);
        delay += (durations[i] || 0.1);
      });
    },
    
    // 播放BGM
    playBGM: (gameName) => {
      if (bgmPlaying) return;
      const bgmUrl = bgmTracks[gameName];
      if (bgmUrl) {
        bgmAudio.src = bgmUrl;
        bgmAudio.loop = true;
        bgmAudio.volume = 0.3;
        bgmAudio.play().catch(e => console.log('BGM play error:', e.message));
        bgmPlaying = true;
      }
    },
    
    // 停止BGM
    stopBGM: () => {
      bgmAudio.pause();
      bgmPlaying = false;
    },
    
    // 设置BGM音量
    setBGMVolume: (vol) => {
      bgmAudio.volume = Math.max(0, Math.min(1, vol));
    },
  };
})();

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GameAudio.init());
} else {
  GameAudio.init();
}

// 第一次用户交互后启动BGM
document.addEventListener('click', () => {
  const gameName = window.location.pathname.split('/')[1] || '2048';
  if (!window._bgmStarted) {
    GameAudio.playBGM(gameName);
    window._bgmStarted = true;
  }
}, { once: true });
