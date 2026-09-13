// Dot-a-Pix game engine
//
// Rules:
// - N x N grid of cells. Each cell is either EMPTY (off) or FILLED (a dot).
// - Anchor cells are pre-filled and shown as colored dots.
// - Player toggles cells by clicking/tapping.
// - Win: player's filled-set matches the solution exactly.
// - 3 stars: no hints used; 2 stars: 1 hint; 1 star: any other.
//
// Conceptis Dot-a-Pix is "Pixel art with dots" — the picture is fully
// defined by the level; anchors provide partial reveal so the player
// can deduce the rest.

(function() {
  'use strict';

  const SAVE_KEY = 'dot_a_pix_save_v1';
  const HINT_LIMIT = 3;
  const TIER_COLORS = {
    'Beginner': '#5fa8ff',
    'Easy':     '#3ee07f',
    'Medium':   '#ffd54f',
    'Hard':     '#ff8a65',
    'Expert':   '#c792ea',
  };

  // State
  let currentLevel = 0;
  let n = 0;
  let grid = [];          // player's 0/1 grid
  let anchors = [];       // anchor {r,c} positions
  let solution = [];      // target 0/1 grid
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
      window.__gzTrack && window.__gzTrack('page_view', { game: 'dot-a-pix' });
    } catch (e) {}
  }

  function cacheDom() {
    dom.titleScreen = document.getElementById('titleScreen');
    dom.levelSelect = document.getElementById('levelSelect');
    dom.gameScreen = document.getElementById('gameScreen');
    dom.winOverlay = document.getElementById('winOverlay');
    dom.btnPlay = document.getElementById('btnPlay');
    dom.btnHowTo = document.getElementById('btnHowTo');
    dom.btnCloseHowTo = document.getElementById('btnCloseHowTo');
    dom.btnBackToLevels = document.getElementById('btnBackToLevels');
    dom.btnBackToLevelsWin = document.getElementById('btnBackToLevelsWin');
    dom.btnNextLevel = document.getElementById('btnNextLevel');
    dom.btnHint = document.getElementById('btnHint');
    dom.btnUndo = document.getElementById('btnUndo');
    dom.btnReset = document.getElementById('btnReset');
    dom.btnMute = document.getElementById('btnMute');
    dom.grid = document.getElementById('grid');
    dom.levelTitle = document.getElementById('levelTitle');
    dom.tierBadge = document.getElementById('tierBadge');
    dom.timerEl = document.getElementById('timer');
    dom.hintCount = document.getElementById('hintCount');
    dom.undoCount = document.getElementById('undoCount');
    dom.levelButtons = document.getElementById('levelButtons');
    dom.howToModal = document.getElementById('howToModal');
    dom.winMessage = document.getElementById('winMessage');
    dom.stars = document.getElementById('stars');
    dom.winTime = document.getElementById('winTime');
    dom.solveCount = document.getElementById('solveCount');
    dom.filledCount = document.getElementById('filledCount');
    dom.totalCount = document.getElementById('totalCount');
  }

  function bindEvents() {
    dom.btnPlay.addEventListener('click', () => showScreen('levels'));
    dom.btnHowTo.addEventListener('click', () => dom.howToModal.classList.add('active'));
    dom.btnCloseHowTo.addEventListener('click', () => dom.howToModal.classList.remove('active'));
    dom.btnBackToLevels.addEventListener('click', () => { stopTimer(); showScreen('levels'); });
    dom.btnBackToLevelsWin.addEventListener('click', () => { stopTimer(); showScreen('levels'); });
    dom.btnNextLevel.addEventListener('click', () => {
      if (currentLevel < DOT_A_PIX_LEVELS.levels.length - 1) {
        loadLevel(currentLevel + 1);
      } else {
        showScreen('levels');
      }
    });
    dom.btnHint.addEventListener('click', useHint);
    dom.btnUndo.addEventListener('click', undoMove);
    dom.btnReset.addEventListener('click', resetLevel);
    dom.btnMute.addEventListener('click', toggleMute);

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'h' || e.key === 'H') useHint();
      else if (e.key === 'u' || e.key === 'U') undoMove();
      else if (e.key === 'r' || e.key === 'R') resetLevel();
      else if (e.key === 'Escape') {
        if (dom.howToModal.classList.contains('active')) {
          dom.howToModal.classList.remove('active');
        } else if (dom.gameScreen.classList.contains('active')) {
          showScreen('levels');
        }
      }
    });

    // Cleanup on pagehide
    window.addEventListener('pagehide', cleanupAudio);
    window.addEventListener('beforeunload', cleanupAudio);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause music when hidden
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend();
        }
      } else {
        if (audioCtx && audioCtx.state === 'suspended' && musicEnabled) {
          audioCtx.resume();
        }
      }
    });
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('dot_a_pix_settings') || '{}');
      musicEnabled = s.musicEnabled !== false;
      sfxEnabled = s.sfxEnabled !== false;
      bestTimes = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    } catch (e) {
      bestTimes = {};
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('dot_a_pix_settings', JSON.stringify({
        musicEnabled, sfxEnabled,
      }));
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(bestTimes));
    } catch (e) {}
  }

  // ==================== Audio ====================
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = 0.4;
      sfxGain.connect(audioCtx.destination);
    } catch (e) {
      audioCtx = null;
    }
  }

  function playBgMusic() {
    if (!musicEnabled) return;
    initAudio();
    if (!audioCtx) return;
    // Simple procedural 8-note loop in C major pentatonic
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    let idx = 0;
    const playNote = () => {
      if (!musicEnabled || !audioCtx || audioCtx.state !== 'running') return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[idx % notes.length];
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
      idx++;
    };
    musicTimer = setInterval(playNote, 500);
    // Kick off first notes immediately
    playNote();
    setTimeout(playNote, 250);
  }

  function stopBgMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function playSFX(kind) {
    if (!sfxEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    let freq = 440;
    let dur = 0.1;
    if (kind === 'place') { freq = 880; dur = 0.05; }
    else if (kind === 'remove') { freq = 220; dur = 0.05; }
    else if (kind === 'win') {
      // Fanfare: play 3 ascending notes
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, i) => {
        setTimeout(() => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0, audioCtx.currentTime);
          g.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
          o.connect(g);
          g.connect(sfxGain);
          o.start();
          o.stop(audioCtx.currentTime + 0.45);
        }, i * 150);
      });
      return;
    } else if (kind === 'hint') { freq = 660; dur = 0.15; }
    else if (kind === 'error') { freq = 165; dur = 0.2; }
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start();
    osc.stop(audioCtx.currentTime + dur + 0.01);
  }

  function cleanupAudio() {
    stopBgMusic();
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
  }

  function toggleMute() {
    musicEnabled = !musicEnabled;
    sfxEnabled = !sfxEnabled;
    dom.btnMute.textContent = (musicEnabled ? '🔊' : '🔇') + ' Sound';
    dom.btnMute.classList.toggle('muted', !musicEnabled);
    saveSettings();
    if (musicEnabled) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
  }

  // ==================== Screens ====================
  function showScreen(name) {
    dom.titleScreen.classList.toggle('active', name === 'title');
    dom.levelSelect.classList.toggle('active', name === 'levels');
    dom.gameScreen.classList.toggle('active', name === 'game');
    dom.winOverlay.classList.remove('active');
    dom.winOverlay.classList.add('hidden');

    if (name === 'levels') {
      renderLevelButtons();
    }
    try {
      window.__gzTrack && window.__gzTrack('screen_view', { screen: name });
    } catch (e) {}
  }

  function renderLevelButtons() {
    dom.levelButtons.innerHTML = '';
    const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    tiers.forEach((tier, ti) => {
      const tierLevels = DOT_A_PIX_LEVELS.levels.filter(l => l.tier === tier);
      const tierDiv = document.createElement('div');
      tierDiv.className = 'tier-section';
      tierDiv.innerHTML = `<h3 class="tier-title" style="color:${TIER_COLORS[tier]}">${tier} (${tierLevels.length})</h3>`;
      const grid = document.createElement('div');
      grid.className = 'tier-grid';
      tierLevels.forEach(lev => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const best = bestTimes[lev.id];
        btn.innerHTML = `<span class="lvl-num">${lev.id + 1}</span><span class="lvl-name">${lev.name}</span>${best ? `<span class="lvl-best">${best}★</span>` : ''}`;
        btn.addEventListener('click', () => loadLevel(lev.id));
        grid.appendChild(btn);
      });
      tierDiv.appendChild(grid);
      dom.levelButtons.appendChild(tierDiv);
    });
  }

  // ==================== Game logic ====================
  function loadLevel(idx) {
    const lev = DOT_A_PIX_LEVELS.levels[idx];
    if (!lev) return;
    currentLevel = idx;
    n = lev.n;
    solution = lev.solution;
    anchors = lev.anchors;
    // Initialize grid: copy anchors
    grid = Array.from({length: n}, () => Array(n).fill(0));
    anchors.forEach(a => { grid[a.r][a.c] = 1; });
    hintsUsed = 0;
    timer = 0;
    dom.levelTitle.textContent = `${lev.tier} #${idx + 1} — ${lev.name}`;
    dom.tierBadge.textContent = lev.tier;
    dom.tierBadge.style.background = TIER_COLORS[lev.tier];
    dom.hintCount.textContent = HINT_LIMIT;
    // undoCount was placeholder; no-op
    showScreen('game');
    renderGrid();
    updateCounts();
    startTimer();
    try {
      window.__gzTrack && window.__gzTrack('level_start', { level: idx, name: lev.name, n: lev.n });
    } catch (e) {}
  }

  function renderGrid() {
    dom.grid.innerHTML = '';
    dom.grid.style.setProperty('--n', n);
    const cellSize = Math.min(50, Math.floor(440 / n));
    dom.grid.style.setProperty('--cell-size', cellSize + 'px');
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        if (grid[r][c]) {
          cell.classList.add('filled');
        }
        // Is this an anchor?
        if (anchors.some(a => a.r === r && a.c === c)) {
          cell.classList.add('anchor');
        }
        cell.addEventListener('click', () => toggleCell(r, c, cell));
        cell.addEventListener('touchstart', e => { e.preventDefault(); toggleCell(r, c, cell); }, { passive: false });
        dom.grid.appendChild(cell);
      }
    }
  }

  function toggleCell(r, c, cellEl) {
    // Anchors are immutable
    if (anchors.some(a => a.r === r && a.c === c)) {
      playSFX('error');
      cellEl.classList.add('shake');
      setTimeout(() => cellEl.classList.remove('shake'), 400);
      return;
    }
    lastMove = { r, c, prev: grid[r][c] };
    grid[r][c] = grid[r][c] ? 0 : 1;
    cellEl.classList.toggle('filled', grid[r][c]);
    playSFX(grid[r][c] ? 'place' : 'remove');
    updateCounts();
    if (checkWin()) showWin();
    try {
      window.__gzTrack && window.__gzTrack('cell_toggle', { r, c, value: grid[r][c] });
    } catch (e) {}
  }

  function checkWin() {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  function showWin() {
    stopTimer();
    const stars = hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1;
    dom.stars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    dom.winTime.textContent = `Solved in ${formatTime(timer)}`;
    dom.winMessage.textContent = `Level ${currentLevel + 1} — ${DOT_A_PIX_LEVELS.levels[currentLevel].name}`;
    dom.winOverlay.classList.remove('hidden');
    dom.winOverlay.classList.add('active');

    // Save best time
    const prev = bestTimes[currentLevel];
    const newScore = stars;
    if (!prev || prev < newScore || (prev === newScore && timer < bestTimes[currentLevel + '_t'])) {
      bestTimes[currentLevel] = newScore;
      bestTimes[currentLevel + '_t'] = timer;
      saveProgress();
    }
    try {
      window.__gzTrack && window.__gzTrack('level_complete', { level: currentLevel, time: timer, hints: hintsUsed, stars });
    } catch (e) {}
    playSFX('win');
    // Confetti
    spawnConfetti();
  }

  function useHint() {
    if (hintsUsed >= HINT_LIMIT) {
      playSFX('error');
      return;
    }
    // Find a hidden cell (not anchor) that's not yet correctly filled
    const candidates = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (anchors.some(a => a.r === r && a.c === c)) continue;
        if (grid[r][c] !== solution[r][c]) candidates.push({r, c});
      }
    }
    if (candidates.length === 0) {
      // Already complete — no hint needed
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    grid[pick.r][pick.c] = solution[pick.r][pick.c];
    hintsUsed++;
    dom.hintCount.textContent = HINT_LIMIT - hintsUsed;
    renderGrid();
    updateCounts();
    playSFX('hint');
    try {
      window.__gzTrack && window.__gzTrack('hint_used', { level: currentLevel, count: hintsUsed });
    } catch (e) {}
    if (checkWin()) showWin();
  }

  let lastMove = null;
  function undoMove() {
    // Simple undo: revert last toggled cell to its previous state.
    // For simplicity (and because dot-a-pix is mostly about revealing cells),
    // we track the most recent toggle.
    if (!lastMove) {
      playSFX('error');
      return;
    }
    const {r, c, prev} = lastMove;
    grid[r][c] = prev;
    lastMove = null;
    renderGrid();
    updateCounts();
    playSFX('remove');
  }

  // Wrap toggleCell to track lastMove
  // (Tracking is now done directly inside toggleCell.)

  function resetLevel() {
    if (!confirm('Reset this level? Your progress on it will be cleared.')) return;
    loadLevel(currentLevel);
  }

  function updateCounts() {
    const filled = grid.flat().filter(v => v).length;
    const total = solution.flat().filter(v => v).length;
    dom.filledCount.textContent = filled;
    dom.totalCount.textContent = total;
  }

  // ==================== Timer ====================
  function startTimer() {
    stopTimer();
    timer = 0;
    timerHandle = setInterval(() => {
      timer++;
      dom.timerEl.textContent = formatTime(timer);
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
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // ==================== Confetti ====================
  function spawnConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a55eea', '#26de81'];
    for (let i = 0; i < 40; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.background = colors[Math.floor(Math.random() * colors.length)];
      conf.style.animationDelay = Math.random() * 0.5 + 's';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 2500);
    }
  }

  // ==================== Boot ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for verification scripts
  window.__DOT_A_PIX = {
    loadLevel,
    toggleCell,
    useHint,
    checkWin,
    getGrid: () => grid,
    getSolution: () => solution,
    getAnchors: () => anchors,
  };
})();
