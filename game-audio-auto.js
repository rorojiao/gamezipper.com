// GameAudio Auto v4 - BGM starts when user interacts WITH THE GAME, not the website
// 正确逻辑：进入游戏主画面（点击 canvas / 教程按钮 / 键盘输入）时开始播放 BGM
// 不在点击导航栏、返回链接等非游戏元素时触发

(function() {
  if (typeof GameAudio === 'undefined') {
    console.warn('GameAudio not loaded');
    return;
  }

  const gameName = window.location.pathname.split('/').filter(Boolean)[0] || '';
  if (!gameName) return; // 主页不播放

  // ── BGM 启动 ────────────────────────────────────────────────────
  let bgmStarted = false;

  const startBGM = () => {
    if (bgmStarted) return;
    if (GameAudio.isMuted()) return;
    bgmStarted = true;
    GameAudio.playBGM(gameName);
    // 暴露给 sound-toggle.js 知道 BGM 已启动
    if (window._gameAudioAutoState) window._gameAudioAutoState.markStarted();
  };

  // 判断点击目标是否属于「游戏交互」（排除导航栏、返回链接、声音按钮）
  const isGameInteraction = (e) => {
    const t = e.target;
    // 排除：顶部导航返回链接
    if (t.tagName === 'A') return false;
    if (t.closest && t.closest('a')) return false;
    // 排除：声音开关按钮
    if (t.id === 'gz-sound-toggle') return false;
    // 排除：顶部 nav bar 区域（top: 0-28px 的固定元素，根据坐标排除）
    if (e.clientY < 30 && e.clientX > window.innerWidth - 50) return false;
    return true;
  };

  // 监听 canvas 点击（所有 canvas 游戏）
  const watchCanvas = () => {
    document.querySelectorAll('canvas').forEach(c => {
      // 排除背景装饰 canvas（pointer-events:none）
      if (getComputedStyle(c).pointerEvents !== 'none') {
        c.addEventListener('pointerdown', startBGM, { once: true });
        c.addEventListener('touchend',    startBGM, { once: true });
      }
    });
  };

  // 监听教程「Got it」按钮（常见选择器）
  const watchTutorialBtn = () => {
    const selectors = [
      '#tutorial-overlay button',
      '.tutorial-btn',
      '#tutorial button',
      '[class*=tutorial] button',
      '[id*=tutorial] button',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        btn.addEventListener('click', startBGM, { once: true });
      });
    });
  };

  // 监听键盘输入（word-puzzle、typing-speed 等文字游戏）
  const watchKeyboard = () => {
    const textGames = ['word-puzzle', 'typing-speed', 'idiom-wordle'];
    if (!textGames.includes(gameName)) return;

    // 键盘按钮点击
    document.addEventListener('click', (e) => {
      if (bgmStarted) return;
      const t = e.target;
      // 游戏键盘按钮（letter keys）
      if (t.classList && (t.classList.contains('key') || t.classList.contains('letter') || t.dataset.key)) {
        startBGM();
      }
    }, { once: false });

    // 物理键盘输入
    document.addEventListener('keydown', (e) => {
      if (bgmStarted) return;
      if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
        startBGM();
      }
    }, { once: true });
  };

  // 游戏内任意非导航点击（兜底，比 canvas 更宽泛）
  const watchGameClick = () => {
    document.addEventListener('click', (e) => {
      if (bgmStarted) return;
      if (isGameInteraction(e)) {
        startBGM();
      }
    }, { capture: true });
  };

  // 等 DOM 加载完再挂事件
  const init = () => {
    watchCanvas();
    watchTutorialBtn();
    watchKeyboard();
    watchGameClick(); // 兜底

    // 动态等待 canvas（有些游戏 canvas 是 JS 创建的）
    let watchAttempts = 0;
    const retryWatch = setInterval(() => {
      watchCanvas();
      watchTutorialBtn();
      if (++watchAttempts >= 5) clearInterval(retryWatch);
    }, 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── 游戏特定 SFX 触发器 ────────────────────────────────────────
  const setupSFX = () => {
    if (gameName === 'typing-speed') {
      const inp = document.getElementById('inputArea');
      if (inp) inp.addEventListener('input', () => GameAudio.play('keytype', 0.2));
    }
    if (gameName === 'whack-a-mole') {
      const c = document.querySelector('canvas');
      if (c) c.addEventListener('click', () => GameAudio.play('hit', 0.7), true);
    }
    if (gameName === 'flappy-wings') {
      let lastScore = 0;
      setInterval(() => {
        const el = document.querySelector('[class*=score]');
        if (el) { const s = parseInt(el.textContent) || 0; if (s > lastScore) { GameAudio.play('coin', 0.6); lastScore = s; } }
      }, 150);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(setupSFX, 300));
  } else {
    setTimeout(setupSFX, 300);
  }

  // 通用按钮 SFX（排除导航和声音按钮）
  document.addEventListener('click', (e) => {
    if (!isGameInteraction(e)) return;
    if (e.target.tagName === 'BUTTON') GameAudio.play('tap', 0.35);
  }, true);

  // 暴露状态
  window._gameAudioAutoState = {
    gameName,
    get started() { return bgmStarted; },
    markStarted() { bgmStarted = true; },
  };

})();
