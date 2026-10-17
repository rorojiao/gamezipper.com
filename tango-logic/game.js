// Tango Logic game engine
//
// Rules:
// - Fill N x N grid with SUN (S) or MOON (M).
// - Each row and column has exactly N/2 of each symbol.
// - No three identical symbols in a row (horizontally or vertically).
// - "=" between two adjacent cells forces them to be EQUAL.
// - "X" between two adjacent cells forces them to be DIFFERENT.
// - Some cells are pre-filled as clues.
//
// Controls:
// - Tap any empty cell to cycle: SUN -> MOON -> empty.
// - Tap a pre-filled clue cell to view explanation (no change).
// - Press H for hint, R for restart, Enter for check, Esc for menu.

(function() {
  'use strict';

  const SAVE_KEY = 'tangologic_save_v1';
  const HINT_LIMIT = 3;

  const TIER_COLORS = {
    Beginner: '#10b981',
    Easy:     '#22d3ee',
    Medium:   '#fbbf24',
    Hard:     '#f97316',
    Expert:   '#ef4444',
  };

  const SAVE_KEY_BEST = 'tangologic_best_v1';
  const SAVE_KEY_SETTINGS = 'tangologic_settings_v1';

  // State
  let _levels = null;
  let _currentLevel = 0;
  let _grid = [];        // 2D array of null | 'S' | 'M'
  let _givens = [];      // 2D bool array
  let _errors = [];      // 2D bool array for marking wrong cells
  let _hintsLeft = 3;
  let _timerStart = 0;
  let _timerInterval = null;
  let _won = false;
  let _paused = false;
  let _saveData = {};
  let _settings = { music: true, sfx: true };
  let _audioCtx = null;
  let _hintCells = [];   // cells currently shown as hint highlights

  // DOM helpers
  const $ = (id) => document.getElementById(id);
  const sleep2 = (ms) => new Promise(r => setTimeout(r, ms));

  function showScreen(id) {
    ['title', 'levels', 'game'].forEach(s => {
      const el = $('screen-' + s);
      if (el) el.classList.toggle('active', s === id);
    });
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }

  function showModal(id) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    $(id).classList.remove('hidden');
  }

  function closeModal(id) { $(id).classList.add('hidden'); }

  function loadSave() {
    try {
      const txt = localStorage.getItem(SAVE_KEY);
      _saveData = txt ? JSON.parse(txt) : {};
    } catch (e) { _saveData = {}; }
  }

  function persistSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(_saveData)); } catch (e) {}
  }

  function loadSettings() {
    try {
      const txt = localStorage.getItem(SAVE_KEY_SETTINGS);
      if (txt) _settings = JSON.parse(txt);
    } catch (e) {}
  }

  function persistSettings() {
    try { localStorage.setItem(SAVE_KEY_SETTINGS, JSON.stringify(_settings)); } catch (e) {}
  }

  // Audio
  function getAudio() {
    if (!_audioCtx) {
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (C) _audioCtx = new C();
      } catch (e) { return null; }
    }
    return _audioCtx;
  }

  function playTone(freq, dur, type='sine', vol=0.1) {
    if (!_settings.sfx) return;
    const ctx = getAudio();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function playClick() { playTone(660, 0.05, 'square', 0.05); }
  function playError() { playTone(220, 0.2, 'sawtooth', 0.08); }
  function playHint() { playTone(880, 0.15, 'triangle', 0.08); playTone(1100, 0.15, 'triangle', 0.08); }
  function playWin() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'triangle', 0.1), i * 120));
  }

  let _bgmInterval = null;
  let _bgmStep = 0;
  function startBGM() {
    if (!_settings.music) return;
    stopBGM();
    const ctx = getAudio();
    if (!ctx) return;
    _bgmStep = 0;
    const chord = [261.63, 311.13, 392.00, 466.16]; // Cmaj7
    const seq = [0, 2, 1, 3, 0, 3, 2, 1];
    _bgmInterval = setInterval(() => {
      if (!_settings.music) return;
      try {
        const note = chord[seq[_bgmStep % seq.length]];
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = note;
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 1.6);
        _bgmStep++;
      } catch (e) {}
    }, 1800);
  }

  function stopBGM() {
    if (_bgmInterval) { clearInterval(_bgmInterval); _bgmInterval = null; }
  }

  // Rendering
  const canvas = () => $('canvas');
  const ctx2d = () => canvas().getContext('2d');

  function setupCanvas(n) {
    const c = canvas();
    const W = 540;
    const cellSize = Math.floor((W - 24) / n);
    const W2 = cellSize * n + 24;
    const dpr = window.devicePixelRatio || 1;
    c.width = W2 * dpr;
    c.height = W2 * dpr;
    c.style.width = W2 + 'px';
    c.style.height = W2 + 'px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { cellSize, totalSize: W2 };
  }

  function drawGrid() {
    const c = canvas();
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = c.width / dpr, h = c.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const n = _grid.length;
    const { cellSize, totalSize } = setupCanvas(n);
    const padX = (w - cellSize * n) / 2;
    const padY = (h - cellSize * n) / 2;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(padX - 8, padY - 8, cellSize * n + 16, cellSize * n + 16);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c2 = 0; c2 < n; c2++) {
        const x = padX + c2 * cellSize;
        const y = padY + r * cellSize;
        // Cell background
        if (_errors[r][c2]) {
          ctx.fillStyle = '#3a1a1a';
        } else if (_hintCells.some(h => h[0] === r && h[1] === c2)) {
          ctx.fillStyle = '#3a2a1a';
        } else {
          ctx.fillStyle = '#1a1a2e';
        }
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        // Symbol
        const sym = _grid[r][c2];
        if (sym === 'S' || sym === 'M') {
          // Sun: bright yellow circle; Moon: light gray crescent
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const radius = cellSize * 0.32;
          if (sym === 'S') {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Moon: light blue-gray crescent
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            // Carve out the crescent
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(cx + radius * 0.4, cy - radius * 0.1, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
          if (_givens[r][c2]) {
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
          }
        } else if (_givens[r][c2]) {
          // Should not happen but safety
          ctx.fillStyle = '#3a3a4e';
          ctx.fillRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
        }
      }
    }

    // Constraints
    const n2 = _levels;
    for (const cn of (n2 && n2[_currentLevel] ? n2[_currentLevel].constraints : [])) {
      const [r, c2] = cn.cell;
      const [dr, dc] = cn.dir;
      const x = padX + c2 * cellSize + (dc === 1 ? cellSize : dc === 0 ? cellSize / 2 : 0);
      const y = padY + r * cellSize + (dr === 1 ? cellSize : dr === 0 ? cellSize / 2 : 0);
      ctx.fillStyle = '#67e8f9';
      ctx.font = `${Math.floor(cellSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cn.rel === '=' ? '=' : '×', x, y);
    }

    // Grid lines
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(padX + i * cellSize, padY);
      ctx.lineTo(padX + i * cellSize, padY + cellSize * n);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padX, padY + i * cellSize);
      ctx.lineTo(padX + cellSize * n, padY + i * cellSize);
      ctx.stroke();
    }
  }

  function startTimer() {
    _timerStart = Date.now();
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - _timerStart) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      $('hudTime').textContent = m + ':' + (s < 10 ? '0' + s : s);
    }, 250);
  }

  function stopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  }

  function getTime() {
    return Math.floor((Date.now() - _timerStart) / 1000);
  }

  function startLevel(idx) {
    _currentLevel = idx;
    const L = _levels[idx];
    _grid = Array.from({length: L.n}, () => Array(L.n).fill(null));
    _givens = Array.from({length: L.n}, () => Array(L.n).fill(false));
    _errors = Array.from({length: L.n}, () => Array(L.n).fill(false));
    _hintCells = [];
    for (const g of L.givens) {
      _grid[g[0]][g[1]] = g[2];
      _givens[g[0]][g[1]] = true;
    }
    const saved = _saveData['lvl' + idx] || {};
    _hintsLeft = (saved.hintsLeft !== undefined) ? saved.hintsLeft : HINT_LIMIT;
    _won = false;
    $('hudLevel').textContent = (idx + 1) + ' / ' + _levels.length;
    $('winOverlay').classList.add('hidden');
    showScreen('game');
    startTimer();
    drawGrid();
  }

  function restartLevel() {
    startLevel(_currentLevel);
    playClick();
  }

  function checkSolution() {
    const n = _grid.length;
    let valid = true;
    _errors = Array.from({length: n}, () => Array(n).fill(false));
    // Check all cells filled
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (_grid[r][c] === null) {
          _errors[r][c] = true;
          valid = false;
        }
      }
    }
    if (!valid) {
      drawGrid();
      playError();
      return false;
    }
    // Check row/col balance
    for (let r = 0; r < n; r++) {
      const cnt = _grid[r].filter(x => x === 'S').length;
      if (cnt !== n / 2) { for (let c = 0; c < n; c++) _errors[r][c] = true; valid = false; }
    }
    for (let c = 0; c < n; c++) {
      let cnt = 0;
      for (let r = 0; r < n; r++) if (_grid[r][c] === 'S') cnt++;
      if (cnt !== n / 2) { for (let r = 0; r < n; r++) _errors[r][c] = true; valid = false; }
    }
    // Check 3-in-a-row
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n - 2; c++) {
        if (_grid[r][c] === _grid[r][c+1] && _grid[r][c] === _grid[r][c+2]) {
          _errors[r][c] = _errors[r][c+1] = _errors[r][c+2] = true;
          valid = false;
        }
      }
    }
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n - 2; r++) {
        if (_grid[r][c] === _grid[r+1][c] && _grid[r][c] === _grid[r+2][c]) {
          _errors[r][c] = _errors[r+1][c] = _errors[r+2][c] = true;
          valid = false;
        }
      }
    }
    // Check =/X constraints
    const L = _levels[_currentLevel];
    for (const cn of L.constraints) {
      const [r, c] = cn.cell;
      const [dr, dc] = cn.dir;
      const nr = r + dr, nc = c + dc;
      if (cn.rel === '=' && _grid[r][c] !== _grid[nr][nc]) {
        _errors[r][c] = _errors[nr][nc] = true;
        valid = false;
      }
      if (cn.rel === 'X' && _grid[r][c] === _grid[nr][nc]) {
        _errors[r][c] = _errors[nr][nc] = true;
        valid = false;
      }
    }
    drawGrid();
    if (valid) {
      winLevel();
      return true;
    }
    playError();
    return false;
  }

  function winLevel() {
    _won = true;
    stopTimer();
    const time = getTime();
    const hintsUsed = HINT_LIMIT - _hintsLeft;
    let stars = 3;
    if (hintsUsed >= 2) stars = 1;
    else if (hintsUsed >= 1) stars = 2;
    const prev = _saveData['lvl' + _currentLevel] || {};
    const prevBest = prev.bestTime || null;
    if (!prevBest || time < prevBest) {
      _saveData['lvl' + _currentLevel] = {
        completed: true,
        bestTime: time,
        stars: Math.max(stars, prev.stars || 0),
        hintsLeft: _hintsLeft,
      };
      persistSave();
    } else {
      _saveData['lvl' + _currentLevel] = {
        completed: true,
        bestTime: prevBest,
        stars: Math.max(stars, prev.stars || 0),
        hintsLeft: _hintsLeft,
      };
      persistSave();
    }
    $('winStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('winTime').textContent = 'Solved in ' + Math.floor(time / 60) + ':' + (time % 60 < 10 ? '0' + (time % 60) : time % 60);
    $('winMoves').textContent = hintsUsed === 0 ? 'No hints · 3 stars!' : (hintsUsed + ' hint' + (hintsUsed > 1 ? 's' : '') + ' used');
    $('winOverlay').classList.remove('hidden');
    playWin();
    // Confetti
    confetti();
  }

  function next() {
    if (_currentLevel + 1 < _levels.length) {
      startLevel(_currentLevel + 1);
    } else {
      showLevels();
    }
  }

  function showHint() {
    if (_won) return;
    if (_hintsLeft <= 0) {
      playError();
      return;
    }
    const L = _levels[_currentLevel];
    const n = _grid.length;
    // Find an empty cell and fill with solution
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (_grid[r][c] === null) {
          _grid[r][c] = L.solution[r][c];
          _hintCells.push([r, c]);
          _hintsLeft--;
          _saveData['lvl' + _currentLevel] = _saveData['lvl' + _currentLevel] || {};
          _saveData['lvl' + _currentLevel].hintsLeft = _hintsLeft;
          persistSave();
          drawGrid();
          playHint();
          // Remove hint highlight after 2s
          setTimeout(() => {
            _hintCells = _hintCells.filter(h => !(h[0] === r && h[1] === c));
            drawGrid();
          }, 2000);
          return;
        }
      }
    }
  }

  function onCellClick(r, c) {
    if (_won) return;
    if (_givens[r][c]) {
      playClick();
      return;
    }
    // Cycle: null -> S -> M -> null
    const cur = _grid[r][c];
    let next;
    if (cur === null) next = 'S';
    else if (cur === 'S') next = 'M';
    else next = null;
    _grid[r][c] = next;
    _errors[r][c] = false;
    playClick();
    drawGrid();
    // Auto-check if all filled
    let allFilled = true;
    for (let r2 = 0; r2 < _grid.length; r2++) {
      for (let c2 = 0; c2 < _grid.length; c2++) {
        if (_grid[r2][c2] === null) { allFilled = false; break; }
      }
      if (!allFilled) break;
    }
    if (allFilled) {
      checkSolution();
    }
  }

  function confetti() {
    const c = canvas();
    if (!c) return;
    const ctx = c.getContext('2d');
    const colors = ['#fbbf24', '#22d3ee', '#10b981', '#a78bfa', '#ef4444'];
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: c.width / 2 + (Math.random() - 0.5) * 100,
        y: c.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 8 - 2,
        g: 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        life: 60,
      });
    }
    function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      drawGrid();
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      if (particles.length > 0) requestAnimationFrame(frame);
    }
    frame();
  }

  function showLevels() {
    showScreen('levels');
    const list = $('levels-list');
    list.innerHTML = '';
    const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    tiers.forEach(t => {
      const sec = document.createElement('div');
      sec.className = 'tier-section';
      sec.innerHTML = `<div class="tier-title" style="color:${TIER_COLORS[t]}">${t} (6×6)</div>`;
      const grid = document.createElement('div');
      grid.className = 'level-grid';
      _levels.forEach((L, idx) => {
        if (L.tier !== t) return;
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const prev = _saveData['lvl' + idx] || {};
        if (prev.completed) {
          btn.classList.add('completed');
          btn.innerHTML = `<span>${idx + 1}</span><span class="level-stars">${'★'.repeat(prev.stars || 0)}${'☆'.repeat(3 - (prev.stars || 0))}</span>`;
        } else {
          // Locked if previous tier not complete
          let locked = false;
          if (idx > 0) {
            const prevL = _saveData['lvl' + (idx - 1)] || {};
            if (!prevL.completed && t !== 'Beginner') locked = true;
          }
          if (locked) btn.classList.add('locked');
          btn.textContent = idx + 1;
        }
        btn.onclick = () => {
          if (btn.classList.contains('locked')) {
            playError();
            return;
          }
          startLevel(idx);
        };
        grid.appendChild(btn);
      });
      sec.appendChild(grid);
      list.appendChild(sec);
    });
  }

  function getCanvasCellFromEvent(e) {
    const c = canvas();
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const dpr = window.devicePixelRatio || 1;
    const w = c.width / dpr;
    const n = _grid.length;
    const cellSize = Math.floor((w - 24) / n);
    const padX = (w - cellSize * n) / 2;
    const padY = (w - cellSize * n) / 2;
    const col = Math.floor((x / dpr - padX) / cellSize);
    const row = Math.floor((y / dpr - padY) / cellSize);
    if (row < 0 || row >= n || col < 0 || col >= n) return null;
    return [row, col];
  }

  function bindEvents() {
    $('btn-play').onclick = () => { showLevels(); playClick(); };
    $('btn-howto').onclick = () => { showModal('modal-howto'); playClick(); };
    $('btn-settings').onclick = () => { showModal('modal-settings'); playClick(); };
    $('btn-close-howto').onclick = () => { closeModal('modal-howto'); playClick(); };
    $('btn-close-settings').onclick = () => { closeModal('modal-settings'); playClick(); };
    $('btn-back-title').onclick = () => { showScreen('title'); playClick(); };
    $('btn-hint').onclick = () => showHint();
    $('btn-restart').onclick = () => restartLevel();
    $('btn-check').onclick = () => checkSolution();
    $('btn-mute').onclick = () => {
      _settings.music = !_settings.music;
      _settings.sfx = _settings.sfx;
      persistSettings();
      $('btn-mute').textContent = _settings.music ? '🔊' : '🔇';
      if (_settings.music) startBGM(); else stopBGM();
    };
    $('btn-menu').onclick = () => { showLevels(); playClick(); };
    $('btn-next').onclick = () => next();
    $('btn-replay').onclick = () => restartLevel();

    $('setMusic').onchange = (e) => {
      _settings.music = e.target.checked;
      persistSettings();
      if (_settings.music) startBGM(); else stopBGM();
    };
    $('setSfx').onchange = (e) => {
      _settings.sfx = e.target.checked;
      persistSettings();
    };

    canvas().addEventListener('click', (e) => {
      const cell = getCanvasCellFromEvent(e);
      if (cell) onCellClick(cell[0], cell[1]);
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'h': showHint(); break;
        case 'r': restartLevel(); break;
        case 'enter': checkSolution(); break;
        case 'escape': showLevels(); break;
        case 'm':
          _settings.music = !_settings.music;
          persistSettings();
          $('btn-mute').textContent = _settings.music ? '🔊' : '🔇';
          if (_settings.music) startBGM(); else stopBGM();
          break;
      }
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      stopBGM();
      stopTimer();
      if (_audioCtx) try { _audioCtx.close(); } catch (e) {}
    });
    window.addEventListener('pagehide', () => {
      stopBGM();
      stopTimer();
      if (_audioCtx) try { _audioCtx.close(); } catch (e) {}
    });
  }

  function init() {
    if (!window.TANGO_LOGIC_DATA) {
      console.error('TANGO_LOGIC_DATA not loaded');
      return;
    }
    _levels = window.TANGO_LOGIC_DATA.levels;
    loadSave();
    loadSettings();
    bindEvents();
    $('setMusic').checked = _settings.music;
    $('setSfx').checked = _settings.sfx;
    $('btn-mute').textContent = _settings.music ? '🔊' : '🔇';
    showScreen('title');
    startBGM();
    console.log('Tango Logic initialized: ' + _levels.length + ' levels');
  }

  // Expose for testing
  window.TangoLogic = {
    getGrid: () => _grid,
    getCurrentLevel: () => _currentLevel,
    checkSolution,
    showHint,
    restartLevel,
    solveFromSolution: function() {
      // Debug helper: copy solution into grid
      const L = _levels[_currentLevel];
      for (let r = 0; r < L.n; r++) {
        for (let c = 0; c < L.n; c++) {
          _grid[r][c] = L.solution[r][c];
        }
      }
      drawGrid();
      checkSolution();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();