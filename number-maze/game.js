/* Number Maze - Game Logic
 * Author: GameZipper R569
 * Mechanic: draw a path through maze walls, visiting checkpoints 1..k in order
 */
(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const STORAGE_KEY_PROGRESS = 'nm_progress_v1';
  const STORAGE_KEY_SETTINGS = 'nm_settings_v1';
  const STORAGE_KEY_TIMER = 'nm_timer_v1';
  const HINT_LIMIT = 3;
  const TIER_RANGES = [
    { name: 'Beginner', min: 0, max: 5 },
    { name: 'Easy',     min: 6, max: 11 },
    { name: 'Medium',   min: 12, max: 17 },
    { name: 'Hard',     min: 18, max: 23 },
    { name: 'Expert',   min: 24, max: 29 },
  ];

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    levels: [],
    currentLevel: 0,
    path: [],          // array of {r,c}
    nextCheckpoint: 0, // index of next checkpoint to visit (0..k)
    hints: HINT_LIMIT,
    timer: 0,
    timerId: null,
    startTime: 0,
    solved: false,
    showingHint: null, // {r, c} - currently highlighted hint cell
    audioCtx: null,
    musicOn: true,
    sfxOn: true,
  };

  // ============================================================
  // DOM HELPERS
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const screens = {
    title: $('screen-title'),
    levels: $('screen-levels'),
    game: $('screen-game'),
  };
  const canvas = $('board');
  const ctx = canvas.getContext('2d');

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ============================================================
  // LEVEL DATA LOAD
  // ============================================================
  function loadLevels() {
    state.levels = NM_LEVELS;
  }

  // ============================================================
  // WALL HELPERS (in-engine)
  // ============================================================
  function hasWall(walls, r1, c1, r2, c2) {
    const n = walls.length;
    if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) return true;
    if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) return true;
    if (r2 === r1 - 1 && c2 === c1) return !!(walls[r1][c1] & 1);
    if (r2 === r1 && c2 === c1 + 1) return !!(walls[r1][c1] & 2);
    if (r2 === r1 + 1 && c2 === c1) return !!(walls[r1][c1] & 4);
    if (r2 === r1 && c2 === c1 - 1) return !!(walls[r1][c1] & 8);
    return true;
  }

  // ============================================================
  // CANVAS RENDER
  // ============================================================
  let cellPx = 60;
  let padding = 16;

  function resizeCanvas() {
    const lvl = state.levels[state.currentLevel];
    const n = lvl.n;
    const maxW = Math.min(window.innerWidth - 60, 520);
    const target = Math.floor((maxW - padding * 2) / n);
    cellPx = Math.max(36, Math.min(72, target));
    const size = cellPx * n + padding * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function render() {
    const lvl = state.levels[state.currentLevel];
    const n = lvl.n;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = padding + c * cellPx;
        const y = padding + r * cellPx;
        const isInPath = state.path.some(p => p.r === r && p.c === c);
        const isHint = state.showingHint && state.showingHint.r === r && state.showingHint.c === c;

        ctx.fillStyle = isInPath ? '#1d3158' : '#162648';
        if (isHint) ctx.fillStyle = 'rgba(100,255,218,.4)';
        ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2);

        // Cell border
        ctx.strokeStyle = '#2a3d6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellPx - 1, cellPx - 1);
      }
    }

    // Walls
    ctx.strokeStyle = '#0d1730';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = padding + c * cellPx;
        const y = padding + r * cellPx;
        const w = lvl.walls[r][c];
        if (w & 1) { // N
          ctx.beginPath();
          ctx.moveTo(x, y + 1);
          ctx.lineTo(x + cellPx, y + 1);
          ctx.stroke();
        }
        if (w & 2) { // E
          ctx.beginPath();
          ctx.moveTo(x + cellPx - 1, y);
          ctx.lineTo(x + cellPx - 1, y + cellPx);
          ctx.stroke();
        }
        if (w & 4) { // S
          ctx.beginPath();
          ctx.moveTo(x, y + cellPx - 1);
          ctx.lineTo(x + cellPx, y + cellPx - 1);
          ctx.stroke();
        }
        if (w & 8) { // W
          ctx.beginPath();
          ctx.moveTo(x + 1, y);
          ctx.lineTo(x + 1, y + cellPx);
          ctx.stroke();
        }
      }
    }

    // Path overlay (drawn thick orange line through centers)
    if (state.path.length >= 2) {
      ctx.strokeStyle = '#ff8a65';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,138,101,.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const first = state.path[0];
      ctx.moveTo(padding + first.c * cellPx + cellPx / 2, padding + first.r * cellPx + cellPx / 2);
      for (let i = 1; i < state.path.length; i++) {
        const p = state.path[i];
        ctx.lineTo(padding + p.c * cellPx + cellPx / 2, padding + p.r * cellPx + cellPx / 2);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Checkpoints
    for (let i = 0; i < lvl.checkpoints.length; i++) {
      const cp = lvl.checkpoints[i];
      const num = i + 1;
      const isLast = (i === lvl.checkpoints.length - 1);
      const x = padding + cp[1] * cellPx + cellPx / 2;
      const y = padding + cp[0] * cellPx + cellPx / 2;
      const isCurrent = (i === state.nextCheckpoint);
      const isPast = (i < state.nextCheckpoint);

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, cellPx * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = isPast ? '#64ffda' : (isCurrent ? '#ffd54f' : (isLast ? '#ff8a65' : '#94a3c4'));
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, cellPx * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = '#0a1428';
      ctx.fill();

      // Number or flag
      if (isLast) {
        // Flag
        ctx.fillStyle = '#ffd54f';
        ctx.font = `bold ${Math.floor(cellPx * 0.32)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', x, y);
      } else {
        ctx.fillStyle = isPast ? '#0a1428' : (isCurrent ? '#0a1428' : '#e8eef8');
        ctx.font = `bold ${Math.floor(cellPx * 0.32)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), x, y);
      }
    }
  }

  // ============================================================
  // INPUT - tap cells
  // ============================================================
  function getCellAt(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) - padding;
    const y = (e.clientY - rect.top) - padding;
    const c = Math.floor(x / cellPx);
    const r = Math.floor(y / cellPx);
    const lvl = state.levels[state.currentLevel];
    if (r < 0 || r >= lvl.n || c < 0 || c >= lvl.n) return null;
    return { r, c };
  }

  function onCellTap(cell) {
    if (state.solved) return;
    if (state.showingHint) {
      state.showingHint = null;
      render();
    }
    const lvl = state.levels[state.currentLevel];
    const ck = lvl.checkpoints[state.nextCheckpoint];
    const last = state.path[state.path.length - 1];

    // If tapped on the last cell in path → remove from path (backtrack)
    if (state.path.length > 0 && last.r === cell.r && last.c === cell.c) {
      // Check if we're backtracking over a checkpoint (and it's the start of path)
      if (state.path.length > 1) {
        const ckAtRemoved = lvl.checkpoints.findIndex(c => c[0] === last.r && c[1] === last.c);
        if (ckAtRemoved >= 0 && ckAtRemoved < state.nextCheckpoint) {
          state.nextCheckpoint = ckAtRemoved;
        }
        state.path.pop();
        playSfx('undo');
        render();
        updateHud();
        return;
      }
    }

    // Cannot tap an already-visited cell (except to remove the last one above)
    if (state.path.some(p => p.r === cell.r && p.c === cell.c)) return;

    // Must be adjacent to last cell
    if (last) {
      const dr = Math.abs(cell.r - last.r);
      const dc = Math.abs(cell.c - last.c);
      if (dr + dc !== 1) return;
      if (hasWall(lvl.walls, last.r, last.c, cell.r, cell.c)) return;
    } else {
      // First tap: must be on the start checkpoint (1)
      if (cell.r !== ck[0] || cell.c !== ck[1]) return;
    }

    // Add to path
    state.path.push(cell);

    // Check if this cell is the next expected checkpoint
    if (cell.r === ck[0] && cell.c === ck[1]) {
      state.nextCheckpoint++;
      playSfx('checkpoint');
    } else {
      playSfx('step');
    }

    render();
    updateHud();
  }

  canvas.addEventListener('click', (e) => {
    const cell = getCellAt(e);
    if (cell) onCellTap(cell);
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const fake = { clientX: t.clientX, clientY: t.clientY };
    const cell = getCellAt(fake);
    if (cell) onCellTap(cell);
  }, { passive: false });

  // ============================================================
  // ACTIONS
  // ============================================================
  function undo() {
    if (state.path.length === 0) return;
    const last = state.path[state.path.length - 1];
    const lvl = state.levels[state.currentLevel];
    const ckAtRemoved = lvl.checkpoints.findIndex(c => c[0] === last.r && c[1] === last.c);
    if (ckAtRemoved >= 0 && ckAtRemoved < state.nextCheckpoint) {
      state.nextCheckpoint = ckAtRemoved;
    }
    state.path.pop();
    state.showingHint = null;
    render();
    updateHud();
    playSfx('undo');
  }

  function restart() {
    state.path = [];
    state.nextCheckpoint = 0;
    state.showingHint = null;
    state.solved = false;
    state.hints = HINT_LIMIT;
    state.timer = 0;
    state.startTime = Date.now();
    render();
    updateHud();
    playSfx('click');
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (!state.solved) {
        state.timer = Math.floor((Date.now() - state.startTime) / 1000);
        updateHud();
      }
    }, 1000);
  }

  function check() {
    const lvl = state.levels[state.currentLevel];
    const sol = lvl.solution;
    if (state.path.length !== sol.length) {
      playSfx('error');
      flashError();
      return false;
    }
    for (let i = 0; i < sol.length; i++) {
      if (state.path[i].r !== sol[i][0] || state.path[i].c !== sol[i][1]) {
        playSfx('error');
        flashError();
        return false;
      }
    }
    // Solved!
    state.solved = true;
    if (state.timerId) clearInterval(state.timerId);
    saveProgress(state.currentLevel, computeStars(), state.timer);
    playSfx('win');
    showWinOverlay();
    return true;
  }

  function hint() {
    if (state.hints <= 0) return;
    const lvl = state.levels[state.currentLevel];
    const sol = lvl.solution;
    // Find the next expected cell in the solution
    const nextIdx = state.path.length;
    if (nextIdx >= sol.length) return;
    const target = sol[nextIdx];
    state.showingHint = { r: target[0], c: target[1] };
    state.hints--;
    playSfx('hint');
    render();
    updateHud();
  }

  function computeStars() {
    // 3 stars if solved in < 30s, 2 if < 60s, 1 otherwise
    if (state.timer < 30) return 3;
    if (state.timer < 60) return 2;
    return 1;
  }

  function flashError() {
    canvas.style.transition = 'box-shadow .15s';
    canvas.style.boxShadow = '0 0 0 4px var(--bad)';
    setTimeout(() => { canvas.style.boxShadow = ''; }, 250);
  }

  // ============================================================
  // WIN OVERLAY
  // ============================================================
  function showWinOverlay() {
    const stars = computeStars();
    $('win-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('win-time').textContent = 'Solved in ' + state.timer + 's';
    $('win-overlay').classList.remove('hidden');
    // Confetti
    for (let i = 0; i < 30; i++) {
      setTimeout(() => spawnConfetti(), i * 30);
    }
  }

  function spawnConfetti() {
    const c = document.createElement('div');
    c.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-10px;width:8px;height:8px;background:${['#ffd54f','#64ffda','#ff8a65','#a78bfa'][Math.floor(Math.random()*4)]};border-radius:1px;z-index:100;pointer-events:none;transition:transform 1.2s ease,opacity 1.2s`;
    document.body.appendChild(c);
    requestAnimationFrame(() => {
      c.style.transform = `translateY(${window.innerHeight + 20}px) rotate(${Math.random()*720}deg)`;
      c.style.opacity = '0';
    });
    setTimeout(() => c.remove(), 1300);
  }

  // ============================================================
  // HUD
  // ============================================================
  function updateHud() {
    $('hud-level').textContent = (state.currentLevel + 1).toString();
    $('hud-next').textContent = (state.nextCheckpoint + 1).toString();
    const mm = Math.floor(state.timer / 60);
    const ss = state.timer % 60;
    $('hud-time').textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
    $('btn-hint').textContent = '💡' + state.hints;
  }

  // ============================================================
  // STORAGE
  // ============================================================
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveProgress(levelId, stars, time) {
    const data = loadProgress();
    const existing = data[levelId];
    if (!existing || existing.stars < stars) {
      data[levelId] = { stars, time };
    } else if (time && (!existing.time || time < existing.time)) {
      data[levelId].time = time;
    }
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data));
  }
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? JSON.parse(raw) : { music: true, sfx: true };
    } catch (e) { return { music: true, sfx: true }; }
  }
  function saveSettings() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ music: state.musicOn, sfx: state.sfxOn }));
  }

  // ============================================================
  // LEVEL SELECT
  // ============================================================
  function buildLevelSelect() {
    const container = $('tiers-container');
    container.innerHTML = '';
    const progress = loadProgress();
    const completed = new Set(Object.keys(progress).map(k => parseInt(k)));
    TIER_RANGES.forEach(tier => {
      const section = document.createElement('div');
      section.className = 'tier-section';
      section.innerHTML = `<div class="tier-title">${tier.name}</div>`;
      const grid = document.createElement('div');
      grid.className = 'level-grid';
      for (let i = tier.min; i <= tier.max; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const isCompleted = completed.has(i);
        // Unlock: first level always unlocked; or if previous level completed
        let unlocked = (i === 0);
        if (i > 0) {
          let prevCompleted = completed.has(i - 1);
          // also unlock if previous level completed in any tier
          if (!prevCompleted && i > 0) {
            prevCompleted = completed.has(i - 1);
          }
          unlocked = prevCompleted;
        }
        // Also unlock if there's any completed level at or above current
        if (!unlocked && completed.size > 0) {
          // Allow playing any completed level
          if (isCompleted) unlocked = true;
          // Also unlock next level after last completed
          const maxCompleted = Math.max(...Array.from(completed), -1);
          if (i <= maxCompleted + 1) unlocked = true;
        }
        if (!unlocked) {
          btn.classList.add('locked');
          btn.innerHTML = '<span>🔒</span>';
        } else {
          btn.textContent = (i + 1).toString();
          if (isCompleted) {
            btn.classList.add('completed');
            const s = progress[i].stars || 0;
            btn.innerHTML = `<span>${i + 1}</span><span class="level-stars">${'★'.repeat(s)}${'☆'.repeat(3-s)}</span>`;
          }
          btn.addEventListener('click', () => {
            playSfx('click');
            state.currentLevel = i;
            showScreen('game');
            setTimeout(() => {
              resizeCanvas();
              restart();
            }, 50);
          });
        }
        grid.appendChild(btn);
      }
      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  // ============================================================
  // AUDIO
  // ============================================================
  function initAudio() {
    if (state.audioCtx) return;
    try {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  function playTone(freq, dur, type, vol) {
    if (!state.sfxOn || !state.audioCtx) return;
    try {
      const o = state.audioCtx.createOscillator();
      const g = state.audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.06, state.audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + dur);
      o.connect(g).connect(state.audioCtx.destination);
      o.start();
      o.stop(state.audioCtx.currentTime + dur);
    } catch (e) {}
  }

  const SFX = {
    click:      () => playTone(440, 0.06, 'square', 0.05),
    step:       () => playTone(660, 0.08, 'sine', 0.05),
    checkpoint: () => { playTone(880, 0.12, 'triangle', 0.07); setTimeout(() => playTone(1320, 0.1, 'triangle', 0.06), 60); },
    undo:       () => playTone(330, 0.06, 'sawtooth', 0.04),
    hint:       () => { playTone(880, 0.1, 'sine', 0.05); setTimeout(() => playTone(1100, 0.1, 'sine', 0.05), 60); },
    win:        () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'triangle', 0.08), i * 100)); },
    error:      () => { playTone(220, 0.15, 'sawtooth', 0.06); setTimeout(() => playTone(180, 0.2, 'sawtooth', 0.06), 80); },
  };
  function playSfx(name) { const fn = SFX[name]; if (fn) fn(); }

  // Music: ambient chord progression loop
  let musicNodes = [];
  function startMusic() {
    if (!state.musicOn || !state.audioCtx) return;
    if (musicNodes.length > 0) return;
    const chords = [[261.6, 329.6, 392.0], [293.7, 349.2, 440.0], [220.0, 277.2, 329.6], [349.2, 440.0, 523.3]];
    let step = 0;
    const playStep = () => {
      if (!state.musicOn || !state.audioCtx) { stopMusic(); return; }
      const c = chords[step % chords.length];
      c.forEach(f => {
        try {
          const o = state.audioCtx.createOscillator();
          const g = state.audioCtx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0, state.audioCtx.currentTime);
          g.gain.linearRampToValueAtTime(0.018, state.audioCtx.currentTime + 0.5);
          g.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 3.5);
          o.connect(g).connect(state.audioCtx.destination);
          o.start(); o.stop(state.audioCtx.currentTime + 3.5);
        } catch (e) {}
      });
      step++;
    };
    playStep();
    musicNodes.push(setInterval(playStep, 3500));
  }
  function stopMusic() {
    musicNodes.forEach(id => clearInterval(id));
    musicNodes = [];
  }

  function toggleMute() {
    state.musicOn = !state.musicOn;
    state.sfxOn = state.musicOn;
    const btn = $('btn-mute');
    btn.textContent = state.musicOn ? '🔊' : '🔇';
    btn.classList.toggle('muted', !state.musicOn);
    if (state.musicOn) startMusic();
    else stopMusic();
    saveSettings();
  }

  // ============================================================
  // AUDIO CLEANUP
  // ============================================================
  window.addEventListener('beforeunload', () => {
    if (state.audioCtx) try { state.audioCtx.close(); } catch (e) {}
    stopMusic();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.audioCtx) {
      try { state.audioCtx.suspend(); } catch (e) {}
    } else if (state.audioCtx) {
      try { state.audioCtx.resume(); } catch (e) {}
    }
  });

  // ============================================================
  // KEYBOARD
  // ============================================================
  document.addEventListener('keydown', (e) => {
    if (screens.game.classList.contains('active')) {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
      else if (e.key === 'r' || e.key === 'R') restart();
      else if (e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') undo();
      else if (e.key === 'h' || e.key === 'H') hint();
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'Escape') $('modal-confirm').classList.remove('hidden');
    }
  });

  // ============================================================
  // WIRING
  // ============================================================
  function wireButtons() {
    $('btn-play').addEventListener('click', () => {
      initAudio();
      buildLevelSelect();
      showScreen('levels');
      playSfx('click');
    });
    $('btn-howto').addEventListener('click', () => {
      $('modal-howto').classList.remove('hidden');
      playSfx('click');
    });
    $('btn-close-howto').addEventListener('click', () => $('modal-howto').classList.add('hidden'));
    $('btn-back-title').addEventListener('click', () => {
      if (state.timerId) clearInterval(state.timerId);
      showScreen('title');
      playSfx('click');
    });
    $('btn-hint').addEventListener('click', hint);
    $('btn-undo').addEventListener('click', undo);
    $('btn-restart').addEventListener('click', restart);
    $('btn-check').addEventListener('click', check);
    $('btn-mute').addEventListener('click', toggleMute);
    $('btn-menu').addEventListener('click', () => $('modal-confirm').classList.remove('hidden'));
    $('btn-confirm-no').addEventListener('click', () => $('modal-confirm').classList.add('hidden'));
    $('btn-confirm-yes').addEventListener('click', () => {
      $('modal-confirm').classList.add('hidden');
      if (state.timerId) clearInterval(state.timerId);
      buildLevelSelect();
      showScreen('levels');
    });
    $('btn-next').addEventListener('click', () => {
      $('win-overlay').classList.add('hidden');
      if (state.currentLevel < state.levels.length - 1) {
        state.currentLevel++;
        setTimeout(() => { resizeCanvas(); restart(); }, 50);
      } else {
        buildLevelSelect();
        showScreen('levels');
      }
    });
    $('btn-replay').addEventListener('click', () => {
      $('win-overlay').classList.add('hidden');
      setTimeout(() => { restart(); }, 50);
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    loadLevels();
    const settings = loadSettings();
    state.musicOn = settings.music !== false;
    state.sfxOn = settings.sfx !== false;
    const btn = $('btn-mute');
    btn.textContent = state.musicOn ? '🔊' : '🔇';
    btn.classList.toggle('muted', !state.musicOn);
    wireButtons();
    // First user gesture starts audio
    const startAudio = () => {
      initAudio();
      if (state.musicOn) startMusic();
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true });
  }

  // Expose checkSolution for verifier
  window.checkSolution = function (level, path) {
    const sol = level.solution;
    if (path.length !== sol.length) return false;
    for (let i = 0; i < sol.length; i++) {
      if (path[i][0] !== sol[i][0] || path[i][1] !== sol[i][1]) return false;
    }
    return true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
