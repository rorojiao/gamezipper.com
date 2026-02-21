// GameAudio Auto v3 - BGM triggered on first user interaction (fixes autoplay policy)
// 修复：不再依赖 setTimeout 自动播放，改为等待用户首次交互后启动 BGM

(function() {
  if (typeof GameAudio === 'undefined') {
    console.warn('GameAudio not loaded');
    return;
  }

  const gameName = window.location.pathname.split('/').filter(Boolean)[0] || '2048';

  // ── BGM 启动（首次用户交互时触发）──────────────────────────────
  let bgmStarted = false;
  const tryStartBGM = () => {
    if (bgmStarted) return;
    if (GameAudio.isMuted()) return;
    bgmStarted = true;
    GameAudio.playBGM(gameName);
  };

  // 监听首次点击或触摸 → 启动 BGM
  document.addEventListener('click',    tryStartBGM, { once: true, capture: true });
  document.addEventListener('touchend', tryStartBGM, { once: true, capture: true });
  document.addEventListener('keydown',  tryStartBGM, { once: true, capture: true });

  // ── 通用点击音效 ────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && !e.target.id?.includes('tutorial') && !e.target.id?.includes('sound')) {
      GameAudio.play('tap', 0.4);
    }
    if (e.target.tagName === 'A') {
      GameAudio.play('tap', 0.3);
    }
  }, true);

  // ── 游戏特定自动音效触发器 ───────────────────────────────────────
  const autoSoundTriggers = {
    '2048': () => {
      let lastScore = 0;
      setInterval(() => {
        const scoreEl = document.getElementById('score') || document.querySelector('[class*=score]');
        if (scoreEl) {
          const currentScore = parseInt(scoreEl.textContent) || 0;
          if (currentScore > lastScore) {
            GameAudio.play('merge');
            lastScore = currentScore;
          }
        }
      }, 300);
    },
    'typing-speed': () => {
      const inp = document.getElementById('inputArea');
      if (inp) {
        inp.addEventListener('input', () => GameAudio.play('keytype', 0.2));
      }
    },
    'flappy-wings': () => {
      let lastScore = 0;
      setInterval(() => {
        const scoreEl = document.querySelector('[class*=score]');
        if (scoreEl) {
          const current = parseInt(scoreEl.textContent) || 0;
          if (current > lastScore) {
            GameAudio.play('coin', 0.6);
            lastScore = current;
          }
        }
      }, 100);
    },
    'whack-a-mole': () => {
      const canvas = document.querySelector('canvas');
      if (canvas) canvas.addEventListener('click', () => GameAudio.play('hit', 0.7), true);
    },
  };

  // 页面加载完成后设置游戏特定触发器
  const setupTriggers = () => {
    if (autoSoundTriggers[gameName]) {
      try { autoSoundTriggers[gameName](); } catch(e) {}
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTriggers);
  } else {
    setTimeout(setupTriggers, 200);
  }

  // 暴露给 sound-toggle.js 调用
  window._gameAudioAutoState = { gameName, get started() { return bgmStarted; }, markStarted() { bgmStarted = true; } };

})();
