// GameAudio Auto v4 - BGM starts when user interacts WITH THE GAME, not the website
// Correct logic: start BGM when entering game main screen (click canvas / tutorial button / keyboard input)
// Do NOT trigger on navbar clicks, back links, or non-game elements

(function() {
  if (typeof GameAudio === 'undefined') {
    console.warn('GameAudio not loaded');
    return;
  }

  const gameName = window.location.pathname.split('/').filter(Boolean)[0] || '';
  if (!gameName) return; // Skip on homepage

  // ── BGM Startup ────────────────────────────────────────────────────
  let bgmStarted = false;

  const startBGM = () => {
    if (bgmStarted) return;
    if (GameAudio.isMuted()) return;
    bgmStarted = true;
    GameAudio.playBGM(gameName);
    // Expose to sound-toggle.js that BGM has started
    if (window._gameAudioAutoState) window._gameAudioAutoState.markStarted();
  };

  // Check if click target is a "game interaction" (exclude navbar, back links, sound button)
  const isGameInteraction = (e) => {
    const t = e.target;
    // Exclude: top nav back link
    if (t.tagName === 'A') return false;
    if (t.closest && t.closest('a')) return false;
    // Exclude: sound toggle button
    if (t.id === 'gz-sound-toggle') return false;
    // Exclude: top nav bar area (fixed elements at top 0-28px, excluded by coordinates)
    if (e.clientY < 30 && e.clientX > window.innerWidth - 50) return false;
    return true;
  };

  // Listen for canvas clicks (all canvas games)
  const watchCanvas = () => {
    document.querySelectorAll('canvas').forEach(c => {
      // Exclude background decoration canvases (pointer-events:none)
      if (getComputedStyle(c).pointerEvents !== 'none') {
        c.addEventListener('pointerdown', startBGM, { once: true });
        c.addEventListener('touchend',    startBGM, { once: true });
      }
    });
  };

  // Listen for tutorial "Got it" buttons (common selectors)
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

  // Listen for keyboard input (word-puzzle, typing-speed, etc.)
  const watchKeyboard = () => {
    const textGames = ['word-puzzle', 'typing-speed', 'idiom-wordle'];
    if (!textGames.includes(gameName)) return;

    // On-screen keyboard button click
    document.addEventListener('click', (e) => {
      if (bgmStarted) return;
      const t = e.target;
      // Game keyboard buttons (letter keys)
      if (t.classList && (t.classList.contains('key') || t.classList.contains('letter') || t.dataset.key)) {
        startBGM();
      }
    }, { once: false });

    // Physical keyboard input
    document.addEventListener('keydown', (e) => {
      if (bgmStarted) return;
      if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
        startBGM();
      }
    }, { once: true });
  };

  // Any non-nav click inside game (fallback, broader than canvas)
  const watchGameClick = () => {
    document.addEventListener('click', (e) => {
      if (bgmStarted) return;
      if (isGameInteraction(e)) {
        startBGM();
      }
    }, { capture: true });
  };

  // Wait for DOM to load before attaching events
  const init = () => {
    watchCanvas();
    watchTutorialBtn();
    watchKeyboard();
    watchGameClick(); // Fallback

    // Dynamically wait for canvas (some games create canvas via JS)
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

  // ── Game-specific SFX triggers ────────────────────────────────────────
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

  // Generic button SFX (exclude nav and sound buttons)
  document.addEventListener('click', (e) => {
    if (!isGameInteraction(e)) return;
    if (e.target.tagName === 'BUTTON') GameAudio.play('tap', 0.35);
  }, true);

  // Expose state
  window._gameAudioAutoState = {
    gameName,
    get started() { return bgmStarted; },
    markStarted() { bgmStarted = true; },
  };

})();
