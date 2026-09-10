// Magnets game engine
// Mechanics:
// - N x M grid (5x6 .. 9x10)
// - Each cell holds: 0 (empty), 1 (+ pole), -1 (- pole)
// - Pre-marked fixed cells (given)
// - X markers between cells (must be different)
// - Row/column clues: count of + poles
// - Goal: fill all cells satisfying all constraints

(function() {
  'use strict';

  const SAVE_KEY = 'magnets_save_v1';
  const HINT_LIMIT = 3;

  // State
  let currentLevel = 0;
  let n = 0, m = 0;
  let grid = [];              // 2D array of 0/1/-1 (current user state)
  let originalFixed = [];     // immutable fixed poles
  let originalX = [];         // immutable X markers [[r1,c1,r2,c2],...]
  let rowClues = [];
  let colClues = [];
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
      currentLevel = Math.min(currentLevel + 1, MAGNETS_LEVELS.levels.length - 1);
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
    document.addEventListener('keydown', (e) => {
      if (!dom.screens.game.classList.contains('active')) return;
      if (e.key === 'h' || e.key === 'H') useHint();
      else if (e.key === 'r' || e.key === 'R') restartLevel();
      else if (e.key === 'Enter') onCheckWin();
      else if (e.key === 'Escape') {
        if (!dom.modalConfirm.classList.contains('hidden')) {
          dom.modalConfirm.classList.add('hidden');
        } else {
          dom.modalConfirm.classList.remove('hidden');
        }
      }
      else if (e.key === '+' || e.key === '=') applyPole(1);
      else if (e.key === '-' || e.key === '_') applyPole(-1);
      else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') applyPole(0);
    });
    dom.canvas.addEventListener('click', handleCanvasClick);
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

  function renderLevels() {
    const tiers = [
      { name: 'Beginner', label: '⭐ Beginner (5×6)' },
      { name: 'Easy', label: '⭐⭐ Easy (6×7)' },
      { name: 'Medium', label: '⭐⭐⭐ Medium (7×8)' },
      { name: 'Hard', label: '⭐⭐⭐⭐ Hard (8×9)' },
      { name: 'Expert', label: '⭐⭐⭐⭐⭐ Expert (9×10)' },
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
      const tierLevels = MAGNETS_LEVELS.levels.filter(l => l.tier === t.name);
      tierLevels.forEach((lvl) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const idx = MAGNETS_LEVELS.levels.indexOf(lvl);
        const lvlCompleted = completed[idx];
        if (lvlCompleted) btn.classList.add('completed');
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
    const lvl = MAGNETS_LEVELS.levels[idx];
    n = lvl.n;
    m = lvl.m;
    // Copy fixed + grid
    originalFixed = lvl.fixed.map(row => row.slice());
    grid = lvl.fixed.map(row => row.slice());
    originalX = lvl.x.slice();
    rowClues = lvl.row_clues.slice();
    colClues = lvl.col_clues.slice();
    hintsUsed = 0;
    timer = 0;
    dom.hudLevel.textContent = String(idx + 1);
    dom.hudTime.textContent = '0:00';
    showScreen('game');
    drawBoard();
    startTimer();
  }

  function restartLevel() {
    grid = originalFixed.map(row => row.slice());
    hintsUsed = 0;
    timer = 0;
    dom.hudTime.textContent = '0:00';
    drawBoard();
    playSfx('click');
  }

  function applyPole(p) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (originalFixed[r][c] === 0) {
          grid[r][c] = p;
          drawBoard();
          if (p === 0) playSfx('erase');
          else playSfx('place');
          return;
        }
      }
    }
  }

  function getCellRCFromXY(x, y) {
    const dpr = window.devicePixelRatio || 1;
    const cw = dom.canvas.width / dpr;
    const ch = dom.canvas.height / dpr;
    const padding = 18;
    const headerH = 22; // row clue strip
    const sideW = 22; // col clue strip
    const gridSize = Math.min(cw - sideW - padding, ch - headerH - padding);
    const cellSize = gridSize / Math.max(n, m);
    const offsetX = sideW + padding / 2;
    const offsetY = headerH + padding / 2;
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (row < 0 || row >= n || col < 0 || col >= m) return null;
    return [row, col];
  }

  function handleCanvasClick(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = getCellRCFromXY(x, y);
    if (!cell) return;
    const [r, c] = cell;
    if (originalFixed[r][c] !== 0) {
      playSfx('error');
      return;
    }
    const cur = grid[r][c];
    let next;
    if (cur === 0) next = 1;
    else if (cur === 1) next = -1;
    else next = 0;
    grid[r][c] = next;
    drawBoard();
    if (next === 0) playSfx('erase');
    else playSfx('place');
  }

  function checkSolution(levelData, gridToCheck) {
    if (!levelData) {
      levelData = MAGNETS_LEVELS.levels[currentLevel];
      gridToCheck = grid;
    }
    const nn = levelData.n;
    const mm = levelData.m;
    const fixed = levelData.fixed;
    const x = levelData.x;
    const rc = levelData.row_clues;
    const cc = levelData.col_clues;
    // Check all cells filled
    for (let r = 0; r < nn; r++) {
      for (let c = 0; c < mm; c++) {
        if (gridToCheck[r][c] === 0) {
          playSfx('error');
          flashError(`Incomplete — cell (${r+1},${c+1}) is empty`);
          return false;
        }
      }
    }
    // Check fixed
    for (let r = 0; r < nn; r++) {
      for (let c = 0; c < mm; c++) {
        if (fixed[r][c] !== 0 && gridToCheck[r][c] !== fixed[r][c]) {
          playSfx('error');
          flashError(`Fixed cell (${r+1},${c+1}) is wrong`);
          return false;
        }
      }
    }
    // Check X markers
    for (const [r1, c1, r2, c2] of x) {
      if (gridToCheck[r1][c1] === gridToCheck[r2][c2]) {
        playSfx('error');
        flashError(`X marker at (${r1+1},${c1+1})-(${r2+1},${c2+1}) violated`);
        return false;
      }
    }
    // Check row clues
    for (let r = 0; r < nn; r++) {
      const cnt = gridToCheck[r].filter(v => v === 1).length;
      if (cnt !== rc[r]) {
        playSfx('error');
        flashError(`Row ${r+1} has ${cnt} + but clue is ${rc[r]}`);
        return false;
      }
    }
    // Check col clues
    for (let c = 0; c < mm; c++) {
      const cnt = gridToCheck.reduce((acc, row) => acc + (row[c] === 1 ? 1 : 0), 0);
      if (cnt !== cc[c]) {
        playSfx('error');
        flashError(`Column ${c+1} has ${cnt} + but clue is ${cc[c]}`);
        return false;
      }
    }
    playSfx('win');
    return true;
  }

  function onCheckWin() {
    const ok = checkSolution();
    if (!ok) return;
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
    if (hints === 0 && time < 60) return 3;
    if (hints <= 1 && time < 180) return 2;
    return 1;
  }

  function showWinOverlay(stars) {
    dom.winStars.textContent = '⭐'.repeat(stars) + (stars < 3 ? '☆'.repeat(3 - stars) : '');
    dom.winTime.textContent = `Solved in ${formatTime(timer)}`;
    dom.winOverlay.classList.remove('hidden');
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function useHint() {
    if (hintsUsed >= HINT_LIMIT) {
      flashError(`No hints remaining`);
      return;
    }
    const lvl = MAGNETS_LEVELS.levels[currentLevel];
    const sol = lvl.solution;
    let target = null;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (originalFixed[r][c] === 0 && grid[r][c] !== sol[r][c]) {
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
    flashError(`Hint: cell (${r+1},${c+1}) = ${sol[r][c] === 1 ? '+' : '−'} (${HINT_LIMIT - hintsUsed} left)`);
  }

  function flashError(msg) {
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
    const hAvail = Math.max(220, window.innerHeight - 220);
    const cw = Math.min(620, dom.canvas.parentElement.clientWidth - 8, hAvail);
    dom.canvas.style.width = cw + 'px';
    dom.canvas.style.height = cw + 'px';
    dom.canvas.width = cw * dpr;
    dom.canvas.height = cw * dpr;
    const ctx = dom.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = 12;
    const sideW = 28;
    const headerH = 24;
    const maxDim = Math.max(n, m);
    const avail = cw - sideW - padding * 2;
    const cellSize = avail / maxDim;
    const offsetX = sideW;
    const offsetY = headerH;
    const gridW = cellSize * m;
    const gridH = cellSize * n;

    // Background
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, cw, cw);

    // Column clues (top)
    ctx.fillStyle = '#94a3c4';
    ctx.font = `bold ${Math.floor(cellSize * 0.32)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < m; c++) {
      const x = offsetX + c * cellSize + cellSize / 2;
      const y = headerH / 2;
      ctx.fillText(String(colClues[c]), x, y);
    }
    // Row clues (left)
    ctx.textAlign = 'center';
    for (let r = 0; r < n; r++) {
      const x = sideW / 2;
      const y = offsetY + r * cellSize + cellSize / 2;
      ctx.fillText(String(rowClues[r]), x, y);
    }

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const v = grid[r][c];
        // Cell bg
        if (originalFixed[r][c] !== 0) {
          ctx.fillStyle = '#1a2a4a';
        } else {
          ctx.fillStyle = v === 0 ? '#101e3a' : '#162648';
        }
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        // Pole
        if (v === 1) {
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.floor(cellSize * 0.5)}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', x + cellSize / 2, y + cellSize / 2);
        } else if (v === -1) {
          ctx.fillStyle = '#5fa8ff';
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.floor(cellSize * 0.5)}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('−', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // X markers between cells
    for (const [r1, c1, r2, c2] of originalX) {
      const cx = offsetX + Math.min(c1, c2) * cellSize + cellSize;
      const cy = offsetY + Math.min(r1, r2) * cellSize + cellSize / 2;
      if (r1 === r2) {
        // horizontal between two cells
        drawXMarker(ctx, cx, cy, cellSize * 0.18);
      } else {
        // vertical
        const cx2 = offsetX + Math.min(c1, c2) * cellSize + cellSize / 2;
        const cy2 = offsetY + Math.min(r1, r2) * cellSize + cellSize;
        drawXMarker(ctx, cx2, cy2, cellSize * 0.18);
      }
    }

    // Grid lines (light)
    ctx.strokeStyle = '#2a3d6a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      const yy = offsetY + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, yy);
      ctx.lineTo(offsetX + gridW, yy);
      ctx.stroke();
    }
    for (let j = 0; j <= m; j++) {
      const xx = offsetX + j * cellSize;
      ctx.beginPath();
      ctx.moveTo(xx, offsetY);
      ctx.lineTo(xx, offsetY + gridH);
      ctx.stroke();
    }
  }

  function drawXMarker(ctx, cx, cy, size) {
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = Math.max(2, size * 0.4);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
    ctx.lineCap = 'butt';
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
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  }

  // ============================================================
  // Audio
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

  function playBgMusic() {
    if (!musicEnabled) return;
    try {
      getAudioCtx();
      const ctx = audioCtx;
      const chords = [
        [261.6, 329.6, 392.0],
        [293.7, 349.2, 440.0],
        [261.6, 311.1, 392.0],
        [196.0, 246.9, 293.7],
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
  // Persistence
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
  // Confetti
  // ============================================================

  function confetti() {
    try {
      const c = document.createElement('canvas');
      c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:200';
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      document.body.appendChild(c);
      const ctx = c.getContext('2d');
      const colors = ['#ffd54f', '#64ffda', '#ff8a65', '#ff6b6b', '#5fa8ff', '#3ee07f'];
      const N = 80;
      const parts = [];
      for (let i = 0; i < N; i++) {
        parts.push({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
          y: window.innerHeight / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * -10 - 2,
          g: 0.25,
          size: Math.random() * 6 + 4,
          color: colors[i % colors.length],
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.2,
        });
      }
      let frame = 0;
      function tick() {
        ctx.clearRect(0, 0, c.width, c.height);
        parts.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.g;
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
        frame++;
        if (frame < 120) {
          requestAnimationFrame(tick);
        } else {
          document.body.removeChild(c);
        }
      }
      tick();
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for tests
  window.MAGNETS = {
    init,
    loadLevel,
    checkSolution: checkSolution,
    grid: () => grid,
    n: () => n,
    m: () => m,
  };
})();