// Strimko game engine
// Mechanics:
// - N x N grid (n=4..6)
// - N streams (regions of N cells each, 4-connected)
// - Player fills 1..N with row/col/stream uniqueness constraints
// - Click a cell -> cycle 1..N, then back to 0 (empty)

(function() {
  'use strict';

  const SAVE_KEY = 'strimko_save_v1';
  const HINT_LIMIT = 3;

  // State
  let currentLevel = 0;
  let grid = [];          // 2D array of 1..N or 0 (empty)
  let originalClues = []; // immutable clues
  let n = 0;
  let streams = [];
  let hintsUsed = 0;
  let timer = 0;
  let timerHandle = null;
  let audioCtx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicEnabled = true;
  let sfxEnabled = true;
  let bestTimes = {}; // {levelIdx: seconds}

  // DOM refs (populated in init)
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    loadSettings();
    showScreen('title');
    playBgMusic();
    // Touch gz-ad-empty click-through
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
    dom.btnRestart.addEventListener('click', () => restartLevel());
    dom.btnCheck.addEventListener('click', onCheckWin);
    dom.btnMute.addEventListener('click', () => toggleMute());
    dom.btnMenu.addEventListener('click', () => {
      if (timer > 0) dom.modalConfirm.classList.remove('hidden');
      else showScreen('levels');
    });
    dom.btnConfirmYes.addEventListener('click', () => {
      dom.modalConfirm.classList.add('hidden');
      stopTimer();
      showScreen('levels');
    });
    dom.btnConfirmNo.addEventListener('click', () => dom.modalConfirm.classList.add('hidden'));
    dom.btnNext.addEventListener('click', () => {
      dom.winOverlay.classList.add('hidden');
      currentLevel = Math.min(currentLevel + 1, STRIMKO_LEVELS.levels.length - 1);
      loadLevel(currentLevel);
    });
    dom.btnReplay.addEventListener('click', () => {
      dom.winOverlay.classList.add('hidden');
      restartLevel();
    });
    if (dom.btnSettings) {
      dom.btnSettings.addEventListener('click', () => dom.modalSettings.classList.remove('hidden'));
      dom.btnCloseSettings.addEventListener('click', () => dom.modalSettings.classList.add('hidden'));
      dom.setMusic.addEventListener('change', () => { musicEnabled = dom.setMusic.checked; saveSettings(); updateMuteIcon(); playBgMusic(); });
      dom.setSfx.addEventListener('change', () => { sfxEnabled = dom.setSfx.checked; saveSettings(); });
    }
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (dom.screens.game.classList.contains('active')) {
        if (e.key === 'h' || e.key === 'H') useHint();
        else if (e.key === 'r' || e.key === 'R') restartLevel();
        else if (e.key === 'Enter') checkSolution();
        else if (e.key === 'Escape') {
          if (!dom.modalConfirm.classList.contains('hidden')) {
            dom.modalConfirm.classList.add('hidden');
          } else {
            dom.modalConfirm.classList.remove('hidden');
          }
        }
        else if (/^[1-9]$/.test(e.key)) {
          // Number key — apply to currently selected cell or first empty cell
          applyNumber(parseInt(e.key));
        }
        else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
          applyNumber(0);
        }
      }
    });

    // Canvas
    dom.canvas.addEventListener('click', handleCanvasClick);

    // Cleanup audio on unload
    window.addEventListener('beforeunload', cleanupAudio);
    window.addEventListener('pagehide', cleanupAudio);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (musicGain) musicGain.gain.value = 0;
      } else {
        if (musicGain && musicEnabled) musicGain.gain.value = 0.08;
      }
    });
  }

  function showScreen(name) {
    Object.values(dom.screens).forEach(s => s.classList.remove('active'));
    dom.screens[name].classList.add('active');
    if (name !== 'game') stopTimer();
  }

  // ============================================================
  // Levels
  // ============================================================

  function renderLevels() {
    const tiers = [
      { name: 'Beginner', label: '⭐ Beginner (4×4)' },
      { name: 'Easy', label: '⭐⭐ Easy (5×5)' },
      { name: 'Medium', label: '⭐⭐⭐ Medium (5×5)' },
      { name: 'Hard', label: '⭐⭐⭐⭐ Hard (6×6)' },
      { name: 'Expert', label: '⭐⭐⭐⭐⭐ Expert (6×6)' },
    ];
    dom.tiersContainer.innerHTML = '';
    const completed = loadCompleted();
    tiers.forEach(t => {
      const section = document.createElement('div');
      section.className = 'tier-section';
      const title = document.createElement('div');
      title.className = 'tier-title';
      title.textContent = t.label;
      section.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'level-grid';
      const tierLevels = STRIMKO_LEVELS.levels.filter(l => l.tier === t.name);
      tierLevels.forEach((lvl, i) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const idx = STRIMKO_LEVELS.levels.indexOf(lvl);
        const lvlCompleted = completed[idx];
        if (lvlCompleted) {
          btn.classList.add('completed');
        }
        btn.textContent = String(idx + 1);
        if (lvlCompleted && lvlCompleted.stars) {
          const stars = document.createElement('span');
          stars.className = 'level-stars';
          stars.textContent = '⭐'.repeat(lvlCompleted.stars);
          btn.appendChild(stars);
        }
        btn.addEventListener('click', () => {
          currentLevel = idx;
          loadLevel(currentLevel);
        });
        grid.appendChild(btn);
      });
      section.appendChild(grid);
      dom.tiersContainer.appendChild(section);
    });
  }

  function loadLevel(idx) {
    const lvl = STRIMKO_LEVELS.levels[idx];
    n = lvl.n;
    streams = lvl.streams.map(s => s.slice());
    originalClues = lvl.clues.map(row => row.slice());
    grid = lvl.clues.map(row => row.slice());
    hintsUsed = 0;
    timer = 0;
    rebuildCellToStream();
    dom.hudLevel.textContent = String(idx + 1);
    dom.hudTime.textContent = '0:00';
    showScreen('game');
    drawBoard();
    startTimer();
  }

  function restartLevel() {
    const lvl = STRIMKO_LEVELS.levels[currentLevel];
    grid = lvl.clues.map(row => row.slice());
    hintsUsed = 0;
    timer = 0;
    dom.hudTime.textContent = '0:00';
    drawBoard();
    playSfx('click');
  }

  // ============================================================
  // Game logic
  // ============================================================

  // Cell-to-stream mapping
  let cellToStream = {};
  function rebuildCellToStream() {
    cellToStream = {};
    streams.forEach((s, idx) => {
      s.forEach(([r, c]) => {
        cellToStream[`${r},${c}`] = idx;
      });
    });
  }

  function getCellRCFromXY(x, y) {
    // Reverse-engineered from drawBoard; cell size depends on n
    const dpr = window.devicePixelRatio || 1;
    const cw = dom.canvas.width / dpr;
    const ch = dom.canvas.height / dpr;
    const padding = 14;
    const gridSize = Math.min(cw, ch) - padding * 2;
    const cellSize = gridSize / n;
    const offsetX = (cw - gridSize) / 2;
    const offsetY = (ch - gridSize) / 2;
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (row < 0 || row >= n || col < 0 || col >= n) return null;
    return [row, col];
  }

  function handleCanvasClick(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = getCellRCFromXY(x, y);
    if (!cell) return;
    const [r, c] = cell;
    if (originalClues[r][c] !== 0) {
      // It's a clue, can't change
      playSfx('error');
      return;
    }
    // Cycle 1..N, then back to 0
    const cur = grid[r][c];
    let next = cur + 1;
    if (next > n) next = 0;
    grid[r][c] = next;
    drawBoard();
    if (next === 0) playSfx('erase');
    else playSfx('place');
  }

  function applyNumber(num) {
    // Find first empty non-clue cell and apply
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (originalClues[r][c] === 0) {
          grid[r][c] = num;
          drawBoard();
          if (num === 0) playSfx('erase');
          else playSfx('place');
          return;
        }
      }
    }
  }

  function checkSolution(levelData, gridToCheck) {
    // If called without args, use current state
    if (!levelData) {
      levelData = STRIMKO_LEVELS.levels[currentLevel];
      gridToCheck = grid;
    }
    const n = levelData.n;
    const streams = levelData.streams;
    rebuildCellToStream();
    // Check all cells filled
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (gridToCheck[r][c] === 0) {
          playSfx('error');
          flashError(`Incomplete — cell (${r+1},${c+1}) is empty`);
          return false;
        }
      }
    }
    // Check row
    for (let r = 0; r < n; r++) {
      const seen = new Set();
      for (let c = 0; c < n; c++) {
        if (seen.has(gridToCheck[r][c])) {
          playSfx('error');
          flashError(`Duplicate ${gridToCheck[r][c]} in row ${r+1}`);
          return false;
        }
        seen.add(gridToCheck[r][c]);
      }
    }
    // Check col
    for (let c = 0; c < n; c++) {
      const seen = new Set();
      for (let r = 0; r < n; r++) {
        if (seen.has(gridToCheck[r][c])) {
          playSfx('error');
          flashError(`Duplicate ${gridToCheck[r][c]} in column ${c+1}`);
          return false;
        }
        seen.add(gridToCheck[r][c]);
      }
    }
    // Check stream
    for (let s = 0; s < streams.length; s++) {
      const seen = new Set();
      for (const [r, c] of streams[s]) {
        const v = gridToCheck[r][c];
        if (seen.has(v)) {
          playSfx('error');
          flashError(`Duplicate ${v} in stream ${s+1}`);
          return false;
        }
        seen.add(v);
      }
    }
    // All checks passed
    playSfx('win');
    return true;
  }

  function onCheckWin() {
    const ok = checkSolution();
    if (!ok) return;
    // Save completion + stars
    const stars = calculateStars(timer, hintsUsed);
    const completed = loadCompleted();
    completed[currentLevel] = { stars, time: timer, hints: hintsUsed };
    saveCompleted(completed);
    if (!bestTimes[currentLevel] || timer < bestTimes[currentLevel]) {
      bestTimes[currentLevel] = timer;
      saveBestTimes();
    }
    stopTimer();
    showWinOverlay(stars);
    confetti();
  }

  function calculateStars(time, hints) {
    const lvl = STRIMKO_LEVELS.levels[currentLevel];
    const n = lvl.n;
    // 3 stars: solved without hints in reasonable time
    // 2 stars: solved with 1 hint or slower
    // 1 star: solved with more hints
    if (hints === 0 && time < 60) return 3;
    if (hints <= 1 && time < 180) return 2;
    return 1;
  }

  function showWinOverlay(stars) {
    dom.winStars.textContent = '⭐'.repeat(stars) + (stars < 3 ? '☆'.repeat(3 - stars) : '');
    dom.winTime.textContent = `Solved in ${formatTime(timer)}`;
    dom.winOverlay.classList.remove('hidden');
  }

  function useHint() {
    if (hintsUsed >= HINT_LIMIT) {
      flashError(`No hints remaining`);
      return;
    }
    // Find a non-clue, empty or wrong cell and reveal solution value
    const lvl = STRIMKO_LEVELS.levels[currentLevel];
    const sol = lvl.solution;
    let target = null;
    // Prefer empty cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (originalClues[r][c] === 0 && grid[r][c] !== sol[r][c]) {
          target = [r, c];
          break;
        }
      }
      if (target) break;
    }
    if (!target) {
      flashError('No cells need hints!');
      return;
    }
    const [r, c] = target;
    grid[r][c] = sol[r][c];
    hintsUsed++;
    playSfx('hint');
    drawBoard();
    flashError(`Hint: cell (${r+1},${c+1}) = ${sol[r][c]} (${HINT_LIMIT - hintsUsed} left)`);
  }

  function flashError(msg) {
    // Quick banner
    let banner = document.getElementById('flash-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'flash-banner';
      banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--bad);color:#fff;padding:10px 18px;border-radius:10px;font-weight:700;z-index:60;max-width:90%;text-align:center;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.5)';
      document.body.appendChild(banner);
    }
    banner.textContent = msg;
    banner.style.opacity = '1';
    setTimeout(() => { banner.style.opacity = '0'; }, 2500);
  }

  // ============================================================
  // Drawing
  // ============================================================

  function drawBoard() {
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.min(540, dom.canvas.parentElement.clientWidth - 8);
    dom.canvas.style.width = cw + 'px';
    dom.canvas.style.height = cw + 'px';
    dom.canvas.width = cw * dpr;
    dom.canvas.height = cw * dpr;
    const ctx = dom.canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const padding = 14;
    const gridSize = cw - padding * 2;
    const cellSize = gridSize / n;
    const offsetX = padding;
    const offsetY = padding;

    // Background
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, cw, cw);

    // Stream colors (consistent per stream index)
    const streamColors = [
      'rgba(255, 138, 101, 0.15)',  // orange
      'rgba(100, 255, 218, 0.15)',  // cyan
      'rgba(255, 213, 79, 0.15)',   // gold
      'rgba(187, 107, 255, 0.15)',  // purple
      'rgba( 62, 224, 127, 0.15)',  // green
      'rgba(255, 107, 107, 0.15)',  // red
    ];

    // Draw stream-tinted cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const sIdx = cellToStream[`${r},${c}`] ?? 0;
        ctx.fillStyle = streamColors[sIdx % streamColors.length];
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Draw grid lines (light)
    ctx.strokeStyle = '#2a3d6a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      const x = offsetX + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + gridSize);
      ctx.stroke();
      const y = offsetY + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + gridSize, y);
      ctx.stroke();
    }

    // Draw stream boundaries (thicker)
    ctx.strokeStyle = '#64ffda';
    ctx.lineWidth = 2.5;
    for (let s = 0; s < streams.length; s++) {
      const cells = streams[s];
      // For each cell, draw the boundaries that don't border another cell in the same stream
      for (const [r, c] of cells) {
        const x1 = offsetX + c * cellSize;
        const y1 = offsetY + r * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;
        // Top: is the cell above in the same stream?
        const above = cells.find(([rr, cc]) => rr === r - 1 && cc === c);
        if (!above) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y1);
          ctx.stroke();
        }
        // Bottom
        const below = cells.find(([rr, cc]) => rr === r + 1 && cc === c);
        if (!below) {
          ctx.beginPath();
          ctx.moveTo(x1, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        // Left
        const left = cells.find(([rr, cc]) => rr === r && cc === c - 1);
        if (!left) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, y2);
          ctx.stroke();
        }
        // Right
        const right = cells.find(([rr, cc]) => rr === r && cc === c + 1);
        if (!right) {
          ctx.beginPath();
          ctx.moveTo(x2, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw cell content (numbers)
    ctx.font = `bold ${Math.floor(cellSize * 0.55)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = grid[r][c];
        if (v === 0) continue;
        const x = offsetX + c * cellSize + cellSize / 2;
        const y = offsetY + r * cellSize + cellSize / 2;
        if (originalClues[r][c] !== 0) {
          // Clue
          ctx.fillStyle = '#ffd54f';
        } else {
          // Player
          ctx.fillStyle = '#64ffda';
        }
        ctx.fillText(String(v), x, y);
      }
    }
  }

  // ============================================================
  // Confetti
  // ============================================================

  function confetti() {
    const colors = ['#ff5252', '#ffd54f', '#64ffda', '#3ee07f', '#bb6bff', '#ff8a65'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:100;overflow:hidden';
    document.body.appendChild(container);
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.style.cssText = `position:absolute;width:8px;height:14px;background:${colors[i%colors.length]};left:${Math.random()*100}%;top:-20px;transform:rotate(${Math.random()*360}deg);opacity:1;transition:top 2s ease-out, opacity 2s ease-out, transform 2s ease-out`;
      container.appendChild(piece);
      setTimeout(() => {
        piece.style.top = (100 + Math.random() * 30) + '%';
        piece.style.opacity = '0';
        piece.style.transform = `rotate(${Math.random()*720}deg)`;
      }, 30 + Math.random() * 100);
    }
    setTimeout(() => container.remove(), 3000);
  }

  // ============================================================
  // Timer
  // ============================================================

  function startTimer() {
    stopTimer();
    timerHandle = setInterval(() => {
      timer++;
      dom.hudTime.textContent = formatTime(timer);
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  // ============================================================
  // Audio (Web Audio API)
  // ============================================================

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = musicEnabled ? 0.08 : 0;
      musicGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = sfxEnabled ? 0.18 : 0;
      sfxGain.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function playSfx(type) {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(sfxGain);
      if (type === 'click') {
        osc.frequency.value = 660;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t); osc.stop(t + 0.08);
      } else if (type === 'place') {
        osc.frequency.value = 880;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
      } else if (type === 'erase') {
        osc.frequency.value = 440;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
      } else if (type === 'hint') {
        osc.frequency.value = 1100;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.15);
      } else if (type === 'win') {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator();
          const gg = ctx.createGain();
          o.connect(gg); gg.connect(sfxGain);
          o.frequency.value = f;
          gg.gain.setValueAtTime(0, t + i * 0.1);
          gg.gain.linearRampToValueAtTime(0.25, t + i * 0.1 + 0.02);
          gg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
          o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.3);
        });
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.value = 200;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.2);
      }
    } catch (e) {}
  }

  let musicTimer = null;
  function playBgMusic() {
    if (!musicEnabled) return;
    try {
      getAudioCtx();
      const ctx = audioCtx;
      const chords = [
        [261.6, 329.6, 392.0], // Cmaj7
        [293.7, 349.2, 440.0], // Dm7
        [261.6, 311.1, 392.0], // Am7
        [196.0, 246.9, 293.7], // G
      ];
      let i = 0;
      function playChord() {
        if (!musicEnabled) return;
        const t = ctx.currentTime;
        const chord = chords[i % chords.length];
        chord.forEach(f => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.04, t + 0.5);
          g.gain.exponentialRampToValueAtTime(0.001, t + 4);
          o.connect(g); g.connect(musicGain);
          o.start(t); o.stop(t + 4);
        });
        i++;
      }
      playChord();
      musicTimer = setInterval(playChord, 4000);
    } catch (e) {}
  }

  function cleanupAudio() {
    try {
      stopTimer();
      if (musicTimer) clearInterval(musicTimer);
      if (audioCtx) audioCtx.close();
    } catch (e) {}
  }

  function toggleMute() {
    musicEnabled = !musicEnabled;
    sfxEnabled = musicEnabled;
    saveSettings();
    updateMuteIcon();
    if (musicGain) musicGain.gain.value = musicEnabled ? 0.08 : 0;
    if (sfxGain) sfxGain.gain.value = sfxEnabled ? 0.18 : 0;
    if (musicEnabled) playBgMusic();
    else if (musicTimer) clearInterval(musicTimer);
  }

  function updateMuteIcon() {
    dom.btnMute.textContent = musicEnabled ? '🔊' : '🔇';
  }

  // ============================================================
  // Settings / Persistence
  // ============================================================

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY + '_settings') || '{}');
      if (typeof s.music === 'boolean') musicEnabled = s.music;
      if (typeof s.sfx === 'boolean') sfxEnabled = s.sfx;
    } catch (e) {}
    if (dom.setMusic) dom.setMusic.checked = musicEnabled;
    if (dom.setSfx) dom.setSfx.checked = sfxEnabled;
    updateMuteIcon();
  }

  function saveSettings() {
    try {
      localStorage.setItem(SAVE_KEY + '_settings', JSON.stringify({ music: musicEnabled, sfx: sfxEnabled }));
    } catch (e) {}
  }

  function loadCompleted() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY + '_completed') || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveCompleted(c) {
    try {
      localStorage.setItem(SAVE_KEY + '_completed', JSON.stringify(c));
    } catch (e) {}
  }

  function loadBestTimes() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY + '_best') || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveBestTimes() {
    try {
      localStorage.setItem(SAVE_KEY + '_best', JSON.stringify(bestTimes));
    } catch (e) {}
  }

  // ============================================================
  // Win handler hook (called by Check button)
  // ============================================================
  // checkSolution is called via the bound event listener on btnCheck
  // (which calls onCheckWin, defined above as a function declaration)

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for tests
  window.STRIMKO = {
    init,
    loadLevel,
    checkSolution: checkSolution,
    grid: () => grid,
    n: () => n,
    streams: () => streams,
  };
})();
