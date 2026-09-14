// Arrowsmith game engine
//
// Rules:
// - N x N grid where each cell has an arrow pointing N/S/E/W
// - Some cells are pre-filled with arrows (anchors, visible)
// - Each cell shows a number 0-4 = count of arrows in its 4 cardinal neighbors pointing AT it
// - Player fills remaining cells with arrows (N/S/E/W)
// - Win: every count is satisfied
//
// Controls:
// - Click an empty cell to cycle through arrows: N -> E -> S -> W -> empty
// - H: hint (3 per level, reveals one correct arrow)
// - Enter: check solution
// - R: restart level

(function() {
  'use strict';

  const SAVE_KEY = 'arrowsmith_save_v1';
  const HINT_LIMIT = 3;
  const TIER_COLORS = {
    'Beginner': '#5fa8ff',
    'Easy':     '#3ee07f',
    'Medium':   '#ffd54f',
    'Hard':     '#ff8a65',
    'Expert':   '#c792ea',
  };

  // 0=N, 1=E, 2=S, 3=W (arrow points to that direction)
  const DIR_NAMES = ['N', 'E', 'S', 'W'];
  const DIR_DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const OPPOSITE = [2, 3, 0, 1]; // N<->S, E<->W

  // State
  let currentLevel = 0;
  let n = 0;
  let grid = [];          // -1=empty, 0/1/2/3 = arrow
  let counts = [];        // puzzle counts (target values)
  let anchors = [];       // boolean n x n — true if pre-filled
  let hintsUsed = 0;
  let timer = 0;
  let timerHandle = null;
  let audioCtx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicEnabled = true;
  let sfxEnabled = true;
  let bestTimes = {};
  let musicTimer = null;
  let hoverCell = null;

  // DOM
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    loadSettings();
    showScreen('title');
    playBgMusic();
    try {
      const adAbove = document.getElementById('gz-ad-above-game');
      const adBelow = document.getElementById('gz-ad-below-canvas');
      if (adAbove) adAbove.style.minHeight = '90px';
      if (adBelow) adBelow.style.minHeight = '90px';
    } catch (e) {}
  }

  function cacheDom() {
    dom = {
      screens: {
        title: document.getElementById('screen-title'),
        levels: document.getElementById('screen-levels'),
        game: document.getElementById('screen-game'),
      },
      btnPlay: document.getElementById('btn-play'),
      btnHowto: document.getElementById('btn-howto'),
      btnBackTitle: document.getElementById('btn-back-title'),
      tiersContainer: document.getElementById('tiers-container'),
      hudLevel: document.getElementById('hud-level'),
      hudTime: document.getElementById('hud-time'),
      btnHint: document.getElementById('btn-hint'),
      btnRestart: document.getElementById('btn-restart'),
      btnCheck: document.getElementById('btn-check'),
      btnMute: document.getElementById('btn-mute'),
      btnMenu: document.getElementById('btn-menu'),
      canvas: document.getElementById('board'),
      winOverlay: document.getElementById('win-overlay'),
      winStars: document.getElementById('win-stars'),
      winTime: document.getElementById('win-time'),
      btnNext: document.getElementById('btn-next'),
      btnReplay: document.getElementById('btn-replay'),
      modalHowto: document.getElementById('modal-howto'),
      btnCloseHowto: document.getElementById('btn-close-howto'),
      modalConfirm: document.getElementById('modal-confirm'),
      btnConfirmYes: document.getElementById('btn-confirm-yes'),
      btnConfirmNo: document.getElementById('btn-confirm-no'),
      btnSettings: document.getElementById('btn-settings'),
      modalSettings: document.getElementById('modal-settings'),
      btnCloseSettings: document.getElementById('btn-close-settings'),
      setMusic: document.getElementById('set-music'),
      setSfx: document.getElementById('set-sfx'),
    };
  }

  function bindEvents() {
    dom.btnPlay.addEventListener('click', () => { showScreen('levels'); renderLevels(); });
    dom.btnHowto.addEventListener('click', () => dom.modalHowto.classList.remove('hidden'));
    dom.btnCloseHowto.addEventListener('click', () => dom.modalHowto.classList.add('hidden'));
    dom.btnBackTitle.addEventListener('click', () => showScreen('title'));
    dom.btnHint.addEventListener('click', () => useHint());
    dom.btnRestart.addEventListener('click', () => { resetLevel(); playSfx('click'); });
    dom.btnCheck.addEventListener('click', () => { checkSolution(); playSfx('click'); });
    dom.btnMute.addEventListener('click', toggleMute);
    dom.btnMenu.addEventListener('click', () => {
      if (timer > 0) {
        dom.modalConfirm.classList.remove('hidden');
      } else {
        showScreen('levels');
      }
    });
    dom.btnNext.addEventListener('click', () => { nextLevel(); playSfx('click'); });
    dom.btnReplay.addEventListener('click', () => { resetLevel(); playSfx('click'); });
    dom.btnConfirmYes.addEventListener('click', () => {
      dom.modalConfirm.classList.add('hidden');
      stopTimer();
      showScreen('levels');
    });
    dom.btnConfirmNo.addEventListener('click', () => dom.modalConfirm.classList.add('hidden'));
    dom.btnSettings.addEventListener('click', () => dom.modalSettings.classList.remove('hidden'));
    dom.btnCloseSettings.addEventListener('click', () => dom.modalSettings.classList.add('hidden'));
    dom.setMusic.addEventListener('change', () => { musicEnabled = dom.setMusic.checked; saveSettings(); if (musicEnabled) playBgMusic(); else stopBgMusic(); });
    dom.setSfx.addEventListener('change', () => { sfxEnabled = dom.setSfx.checked; saveSettings(); });

    // Canvas events
    dom.canvas.addEventListener('click', onCanvasClick);
    dom.canvas.addEventListener('touchstart', onCanvasTouch, {passive: false});
    dom.canvas.addEventListener('mousemove', onCanvasHover);

    // Keyboard
    document.addEventListener('keydown', onKey);

    // Cleanup audio on unload
    window.addEventListener('beforeunload', cleanupAudio);
    window.addEventListener('pagehide', cleanupAudio);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cleanupAudio();
    });
  }

  function showScreen(name) {
    for (const k in dom.screens) {
      dom.screens[k].classList.toggle('active', k === name);
    }
  }

  function renderLevels() {
    const data = window.ARROWSMITH_LEVELS;
    if (!data) return;
    const levels = data.levels;
    const completed = getCompleted();

    const tiers = {};
    for (const lvl of levels) {
      if (!tiers[lvl.tier]) tiers[lvl.tier] = [];
      tiers[lvl.tier].push(lvl);
    }

    let html = '';
    for (const tierName of ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']) {
      if (!tiers[tierName]) continue;
      html += `<div class="tier-section"><div class="tier-title" style="color:${TIER_COLORS[tierName]}">${tierName}</div><div class="level-grid">`;
      for (const lvl of tiers[tierName]) {
        const isDone = completed[lvl.id];
        html += `<button class="level-btn ${isDone ? 'completed' : ''}" data-id="${lvl.id}">${lvl.id + 1}${isDone ? `<div class="level-stars">${getStars(lvl.id)}</div>` : ''}</button>`;
      }
      html += '</div></div>';
    }
    dom.tiersContainer.innerHTML = html;

    for (const btn of dom.tiersContainer.querySelectorAll('.level-btn')) {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        startLevel(id);
        playSfx('click');
      });
    }
  }

  function startLevel(id) {
    currentLevel = id;
    const lvl = window.ARROWSMITH_LEVELS.levels[id];
    n = lvl.n;
    counts = lvl.counts.map(r => r.slice());
    grid = [];
    anchors = [];
    for (let r = 0; r < n; r++) {
      grid.push(new Array(n).fill(-1));
      anchors.push(new Array(n).fill(false));
    }
    for (const [r, c, a] of lvl.anchors) {
      grid[r][c] = a;
      anchors[r][c] = true;
    }

    // Restore saved state if any
    const saved = getSavedLevel(id);
    if (saved) {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (!anchors[r][c] && saved[r] && saved[r][c] != null && saved[r][c] !== -1) {
            grid[r][c] = saved[r][c];
          }
        }
      }
      hintsUsed = saved.hintsUsed || 0;
    } else {
      hintsUsed = 0;
    }

    timer = 0;
    startTimer();
    dom.hudLevel.textContent = (id + 1).toString();
    showScreen('game');
    requestAnimationFrame(draw);
  }

  function resetLevel() {
    const lvl = window.ARROWSMITH_LEVELS.levels[currentLevel];
    grid = [];
    anchors = [];
    for (let r = 0; r < n; r++) {
      grid.push(new Array(n).fill(-1));
      anchors.push(new Array(n).fill(false));
    }
    for (const [r, c, a] of lvl.anchors) {
      grid[r][c] = a;
      anchors[r][c] = true;
    }
    hintsUsed = 0;
    timer = 0;
    saveCurrentLevel();
    draw();
  }

  function nextLevel() {
    dom.winOverlay.classList.add('hidden');
    if (currentLevel + 1 < window.ARROWSMITH_LEVELS.levels.length) {
      startLevel(currentLevel + 1);
    } else {
      showScreen('levels');
    }
  }

  function draw() {
    const ctx = dom.canvas.getContext('2d');
    const W = dom.canvas.width;
    const H = dom.canvas.height;
    const cellSize = Math.min(W, H) / n;
    const padding = 4;

    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, W, H);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = c * cellSize + padding;
        const y = r * cellSize + padding;
        const sz = cellSize - padding * 2;

        // Background
        ctx.fillStyle = '#162648';
        roundRect(ctx, x, y, sz, sz, 4);
        ctx.fill();

        // Border for hover
        if (hoverCell && hoverCell[0] === r && hoverCell[1] === c && grid[r][c] === -1 && !anchors[r][c]) {
          ctx.strokeStyle = '#3d5a8c';
          ctx.lineWidth = 2;
          roundRect(ctx, x, y, sz, sz, 4);
          ctx.stroke();
        }

        // Anchor marker (subtle cyan border)
        if (anchors[r][c]) {
          ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
          ctx.lineWidth = 1;
          roundRect(ctx, x, y, sz, sz, 4);
          ctx.stroke();
        }

        // Arrow
        if (grid[r][c] >= 0) {
          drawArrow(ctx, x + sz / 2, y + sz / 2, sz * 0.4, grid[r][c], anchors[r][c] ? '#94a3c4' : '#64ffda');
        }

        // Count (only on empty cells — count is always shown)
        if (grid[r][c] === -1 || anchors[r][c]) {
          const countStr = counts[r][c].toString();
          ctx.fillStyle = '#ffd54f';
          ctx.font = `bold ${Math.floor(sz * 0.35)}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(countStr, x + sz / 2, y + sz / 2 + sz * 0.3);
        }

        // Cell border
        ctx.strokeStyle = '#2a3d6a';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, sz, sz, 4);
        ctx.stroke();
      }
    }
  }

  function drawArrow(ctx, cx, cy, size, dir, color) {
    ctx.save();
    ctx.translate(cx, cy);
    // Map dir to canvas direction: 0=N=up, 1=E=right, 2=S=down, 3=W=left
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    ctx.rotate(angles[dir]);

    // Arrow shape: triangular head + small shaft
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0);          // tip
    ctx.lineTo(-size * 0.3, -size * 0.4); // top-back
    ctx.lineTo(-size * 0.1, 0);         // notch
    ctx.lineTo(-size * 0.3, size * 0.4);  // bottom-back
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function canvasToCell(x, y) {
    const rect = dom.canvas.getBoundingClientRect();
    const cx = (x - rect.left) * (dom.canvas.width / rect.width);
    const cy = (y - rect.top) * (dom.canvas.height / rect.height);
    const cellSize = dom.canvas.width / n;
    const c = Math.floor(cx / cellSize);
    const r = Math.floor(cy / cellSize);
    if (r < 0 || r >= n || c < 0 || c >= n) return null;
    return [r, c];
  }

  function onCanvasClick(ev) {
    const cell = canvasToCell(ev.clientX, ev.clientY);
    if (!cell) return;
    const [r, c] = cell;
    if (anchors[r][c]) return; // can't change anchor
    // Cycle: -1 -> 0 -> 1 -> 2 -> 3 -> -1
    grid[r][c] = (grid[r][c] + 1) % 5;
    if (grid[r][c] === 4) grid[r][c] = -1;
    saveCurrentLevel();
    playSfx('click');
    draw();
  }

  function onCanvasTouch(ev) {
    ev.preventDefault();
    const touch = ev.touches[0];
    if (!touch) return;
    const cell = canvasToCell(touch.clientX, touch.clientY);
    if (!cell) return;
    const [r, c] = cell;
    if (anchors[r][c]) return;
    grid[r][c] = (grid[r][c] + 1) % 5;
    if (grid[r][c] === 4) grid[r][c] = -1;
    saveCurrentLevel();
    playSfx('click');
    draw();
  }

  function onCanvasHover(ev) {
    const cell = canvasToCell(ev.clientX, ev.clientY);
    hoverCell = cell;
    draw();
  }

  function onKey(ev) {
    if (ev.key === 'Enter') { checkSolution(); ev.preventDefault(); }
    else if (ev.key === 'r' || ev.key === 'R') { resetLevel(); ev.preventDefault(); }
    else if (ev.key === 'h' || ev.key === 'H') { useHint(); ev.preventDefault(); }
    else if (ev.key === 'Escape') {
      if (!dom.modalConfirm.classList.contains('hidden')) {
        dom.modalConfirm.classList.add('hidden');
      } else if (!dom.modalHowto.classList.contains('hidden')) {
        dom.modalHowto.classList.add('hidden');
      } else if (!dom.modalSettings.classList.contains('hidden')) {
        dom.modalSettings.classList.add('hidden');
      } else {
        dom.btnMenu.click();
      }
      ev.preventDefault();
    }
  }

  function checkSolution() {
    // Check that every count is satisfied
    let ok = true;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!cellSatisfied(r, c)) { ok = false; break; }
      }
      if (!ok) break;
    }

    if (ok) {
      // Also ensure all empty cells are filled
      let allFilled = true;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === -1) { allFilled = false; break; }
        }
        if (!allFilled) break;
      }
      if (allFilled) {
        win();
        return;
      }
    }

    // Flash wrong cells red
    flashErrors();
    playSfx('error');
  }

  function cellSatisfied(r, c) {
    let count = 0;
    for (let d = 0; d < 4; d++) {
      const [dr, dc] = DIR_DELTAS[d];
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        if (grid[nr][nc] === OPPOSITE[d]) count++;
      }
    }
    return count === counts[r][c];
  }

  function flashErrors() {
    // Briefly highlight cells that don't match
    const ctx = dom.canvas.getContext('2d');
    const W = dom.canvas.width;
    const cellSize = W / n;
    const padding = 4;
    let delay = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!cellSatisfied(r, c)) {
          const x = c * cellSize + padding;
          const y = r * cellSize + padding;
          const sz = cellSize - padding * 2;
          ctx.fillStyle = 'rgba(255, 82, 82, 0.4)';
          roundRect(ctx, x, y, sz, sz, 4);
          ctx.fill();
        }
      }
    }
    setTimeout(() => draw(), 600);
  }

  function useHint() {
    if (hintsUsed >= HINT_LIMIT) {
      playSfx('error');
      return;
    }
    // Find an empty cell that needs an arrow and reveal it
    const lvl = window.ARROWSMITH_LEVELS.levels[currentLevel];
    const solution = lvl.arrows;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === -1) {
          grid[r][c] = solution[r][c];
          hintsUsed++;
          saveCurrentLevel();
          playSfx('hint');
          draw();
          // Check if solved
          if (allFilled() && allSatisfied()) {
            setTimeout(win, 300);
          }
          return;
        }
      }
    }
  }

  function allFilled() {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === -1) return false;
      }
    }
    return true;
  }

  function allSatisfied() {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!cellSatisfied(r, c)) return false;
      }
    }
    return true;
  }

  function win() {
    stopTimer();
    saveCompleted(currentLevel, timer, hintsUsed);
    const stars = computeStars(timer, hintsUsed);
    dom.winStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    dom.winTime.textContent = `Solved in ${formatTime(timer)}`;
    dom.winOverlay.classList.remove('hidden');
    playSfx('win');
    showConfetti();
  }

  function computeStars(time, hints) {
    if (hints === 0 && time < 30) return 3;
    if (hints <= 1 && time < 90) return 3;
    if (hints <= 2 && time < 180) return 2;
    return 1;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function showConfetti() {
    // Simple confetti burst using emoji
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.textContent = ['🎉', '🎊', '⭐', '✨'][i % 4];
      el.style.cssText = `position:fixed;font-size:24px;left:${50 + (Math.random() - 0.5) * 30}%;top:40%;z-index:100;pointer-events:none;transition:all 1s ease-out`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.transform = `translate(${(Math.random() - 0.5) * 600}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`;
        el.style.opacity = '0';
      }, 50);
      setTimeout(() => el.remove(), 1500);
    }
  }

  // Timer
  function startTimer() {
    stopTimer();
    timer = 0;
    dom.hudTime.textContent = '0:00';
    timerHandle = setInterval(() => {
      timer++;
      dom.hudTime.textContent = formatTime(timer);
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  // Save/load
  function getCompleted() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY + '_completed') || '{}');
    } catch (e) { return {}; }
  }

  function saveCompleted(id, time, hints) {
    const c = getCompleted();
    const prev = c[id];
    const stars = computeStars(time, hints);
    if (!prev || prev.time > time || prev.stars < stars) {
      c[id] = { time, hints, stars };
    }
    localStorage.setItem(SAVE_KEY + '_completed', JSON.stringify(c));
  }

  function getStars(id) {
    const c = getCompleted();
    return c[id] ? '★'.repeat(c[id].stars) + '☆'.repeat(3 - c[id].stars) : '';
  }

  function saveCurrentLevel() {
    if (currentLevel == null) return;
    try {
      const saved = {
        level: currentLevel,
        grid: grid.map(r => r.slice()),
        hintsUsed,
      };
      localStorage.setItem(SAVE_KEY + '_current', JSON.stringify(saved));
    } catch (e) {}
  }

  function getSavedLevel(id) {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY + '_current') || '{}');
      if (saved.level !== id) return null;
      return saved.grid;
    } catch (e) { return null; }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SAVE_KEY + '_settings', JSON.stringify({ musicEnabled, sfxEnabled }));
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY + '_settings') || '{}');
      if (s.musicEnabled != null) { musicEnabled = s.musicEnabled; dom.setMusic.checked = musicEnabled; }
      if (s.sfxEnabled != null) { sfxEnabled = s.sfxEnabled; dom.setSfx.checked = sfxEnabled; }
    } catch (e) {}
  }

  function toggleMute() {
    musicEnabled = !musicEnabled;
    sfxEnabled = !sfxEnabled;
    dom.setMusic.checked = musicEnabled;
    dom.setSfx.checked = sfxEnabled;
    if (musicEnabled) playBgMusic(); else stopBgMusic();
    saveSettings();
  }

  // Audio
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0.15;
      musicGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = 0.3;
      sfxGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, duration, type, gainNode) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(gainNode || sfxGain);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playSfx(name) {
    if (!sfxEnabled) return;
    switch (name) {
      case 'click': playTone(440, 0.05, 'square'); break;
      case 'hint': playTone(660, 0.15, 'sine'); playTone(880, 0.1, 'sine'); break;
      case 'win':
        playTone(523, 0.12, 'sine');
        setTimeout(() => playTone(659, 0.12, 'sine'), 100);
        setTimeout(() => playTone(784, 0.2, 'sine'), 200);
        break;
      case 'error': playTone(220, 0.2, 'sawtooth'); break;
    }
  }

  function playBgMusic() {
    if (!musicEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    stopBgMusic();
    const chord = [261.63, 329.63, 392.00]; // C major
    let step = 0;
    const chords = [chord, [293.66, 369.99, 440.00], [349.23, 440.00, 523.25], [392.00, 493.88, 587.33]];
    musicTimer = setInterval(() => {
      if (!musicEnabled) { stopBgMusic(); return; }
      const c = chords[step % chords.length];
      for (const f of c) playTone(f, 0.5, 'sine', musicGain);
      step++;
    }, 2000);
  }

  function stopBgMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  function cleanupAudio() {
    stopBgMusic();
    stopTimer();
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
  }

  // Resize canvas on window resize
  function resizeCanvas() {
    if (!dom || !dom.canvas) return;
    const maxW = Math.min(window.innerWidth - 28, 600);
    const size = Math.min(maxW, window.innerHeight * 0.7);
    dom.canvas.width = size;
    dom.canvas.height = size;
    if (currentLevel != null) draw();
  }

  window.addEventListener('resize', resizeCanvas);

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); resizeCanvas(); });
  } else {
    init();
    resizeCanvas();
  }
})();
