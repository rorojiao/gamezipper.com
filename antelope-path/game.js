// Antelope Path game engine
//
// Rules:
// - N x N grid with walls (impassable cells).
// - Player draws a path from START to GOAL using ANTELOPE moves only:
//   (3,1) leaper — 8 directions. Each move is a single hop (not a slide).
//   (|dr|, |dc|) = (3, 1) or (1, 3).
// - Walls block the path (cannot step on wall cells).
// - Each cell can only be visited once.
// - Reach the goal in the minimum number of moves for 3 stars.
//
// Controls:
// - Click/tap any cell to extend the path. Cells reachable by an antelope hop
//   from the last cell are highlighted on hover.
// - Press H for hint, R for restart, Esc for menu.

(function() {
  'use strict';

  const SAVE_KEY = 'antelopepath_save_v1';
  const HINT_LIMIT = 3;

  const ANTELOPE_DIRS = [
    [3, 1], [1, 3], [3, -1], [1, -3],
    [-3, 1], [-1, 3], [-3, -1], [-1, -3],
  ];

  const TIER_COLORS = {
    Beginner: '#fbbf24',
    Easy:     '#f59e0b',
    Medium:   '#d97706',
    Hard:     '#c2410c',
    Expert:   '#9a3412',
  };

  // State
  let currentLevel = 0;
  let n = 0;
  let walls = [];
  let startCell = null;
  let goalCell = null;
  let solutionPath = [];
  let playerPath = [];
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
    renderLevels();
    showScreen('title');
    resizeCanvas();
    loadProgress();
    if (musicEnabled) playBgMusic();
  }

  function cacheDom() {
    dom = {};
    [
      'screen-title','screen-levels','screen-game',
      'hudLevel','hudTime','hudMoves',
      'canvas','winOverlay','winStars','winTime','winMoves',
      'modal-howto','modal-settings',
      'setMusic','setSfx',
      'btn-play','btn-howto','btn-settings','btn-back-title',
      'btn-hint','btn-undo','btn-restart','btn-check','btn-mute','btn-menu',
      'btn-next','btn-replay',
      'btn-close-howto','btn-close-settings',
      'levels-list'
    ].forEach(id => { dom[id] = document.getElementById(id); });
  }

  function bindEvents() {
    if (dom['btn-play']) dom['btn-play'].addEventListener('click', () => {
      try { renderLevels(); } catch(e) { console.error('[antelopepath] renderLevels:', e.message); }
      try { showScreen('levels'); } catch(e) { console.error('[antelopepath] showScreen:', e.message); }
    });
    if (dom['btn-howto']) dom['btn-howto'].addEventListener('click', () => { if (dom['modal-howto']) dom['modal-howto'].classList.remove('hidden'); });
    if (dom['btn-settings']) dom['btn-settings'].addEventListener('click', () => { if (dom['modal-settings']) dom['modal-settings'].classList.remove('hidden'); });
    if (dom['btn-close-howto']) dom['btn-close-howto'].addEventListener('click', () => { if (dom['modal-howto']) dom['modal-howto'].classList.add('hidden'); });
    if (dom['btn-close-settings']) dom['btn-close-settings'].addEventListener('click', () => { if (dom['modal-settings']) dom['modal-settings'].classList.add('hidden'); });
    if (dom['btn-back-title']) dom['btn-back-title'].addEventListener('click', () => showScreen('title'));

    if (dom['btn-menu']) dom['btn-menu'].addEventListener('click', () => showScreen('title'));
    if (dom['btn-restart']) dom['btn-restart'].addEventListener('click', resetLevel);
    if (dom['btn-hint']) dom['btn-hint'].addEventListener('click', useHint);
    if (dom['btn-undo']) dom['btn-undo'].addEventListener('click', undoStep);
    if (dom['btn-check']) dom['btn-check'].addEventListener('click', checkSolution);
    if (dom['btn-mute']) dom['btn-mute'].addEventListener('click', toggleMute);
    if (dom['btn-next']) dom['btn-next'].addEventListener('click', () => {
      if (currentLevel + 1 < window.ANTELOPE_PATH_DATA.levels.length) {
        currentLevel++;
        startLevel(currentLevel);
      } else {
        showScreen('title');
      }
    });
    if (dom['btn-replay']) dom['btn-replay'].addEventListener('click', () => {
      dom['winOverlay'].classList.add('hidden');
      resetLevel();
    });

    if (dom['setMusic']) dom['setMusic'].addEventListener('change', () => { musicEnabled = dom['setMusic'].checked; saveSettings(); if (!musicEnabled) stopBgMusic(); else playBgMusic(); });
    if (dom['setSfx']) dom['setSfx'].addEventListener('change', () => { sfxEnabled = dom['setSfx'].checked; saveSettings(); });

    if (dom['canvas']) {
      dom['canvas'].addEventListener('click', handleCanvasClick);
      dom['canvas'].addEventListener('mousemove', handleCanvasHover);
      dom['canvas'].addEventListener('mouseleave', () => { hoverCell = null; draw(); });
      dom['canvas'].addEventListener('touchstart', handleTouch, { passive: false });
    }

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') { showScreen('title'); return; }
      if (!dom['screen-game'] || !dom['screen-game'].classList.contains('active')) return;
      if (k === 'h') useHint();
      else if (k === 'r') resetLevel();
      else if (k === 'u') undoStep();
      else if (k === 'enter') checkSolution();
    });

    window.addEventListener('resize', () => { resizeCanvas(); draw(); });
  }

  function showScreen(name) {
    const SCREEN_MAP = {
      title: 'screen-title',
      levels: 'screen-levels',
      game: 'screen-game',
    };
    Object.values(SCREEN_MAP).forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle('active', s === SCREEN_MAP[name]);
    });
    if (name === 'title' || name === 'levels') {
      if (dom['winOverlay']) dom['winOverlay'].classList.add('hidden');
    }
  }

  function renderLevels() {
    const levels = window.ANTELOPE_PATH_DATA.levels;
    const tiers = {};
    levels.forEach(lv => { if (!tiers[lv.tier]) tiers[lv.tier] = []; tiers[lv.tier].push(lv); });

    const tierOrder = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    let html = '';
    tierOrder.forEach(tier => {
      if (!tiers[tier]) return;
      html += `<div class="tier-section"><div class="tier-title" style="color:${TIER_COLORS[tier] || '#fbbf24'}">${tier}</div><div class="level-grid">`;
      tiers[tier].forEach(lv => {
        const completed = !!bestTimes[lv.id];
        const stars = bestTimes[lv.id] ? bestTimes[lv.id].stars : 0;
        html += `<button class="level-btn ${completed ? 'completed' : ''}" data-id="${lv.id}">${lv.id + 1}${completed ? `<span class="level-stars">${'★'.repeat(stars)}</span>` : ''}</button>`;
      });
      html += '</div></div>';
    });
    const list = document.getElementById('levels-list');
    if (list) list.innerHTML = html;
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        currentLevel = id;
        startLevel(currentLevel);
      });
    });
  }

  function startLevel(id) {
    const lv = window.ANTELOPE_PATH_DATA.levels[id];
    n = lv.n;
    walls = Array.from({ length: n }, () => Array(n).fill(false));
    lv.walls.forEach(([r, c]) => { walls[r][c] = true; });
    startCell = lv.start;
    goalCell = lv.goal;
    solutionPath = lv.solution_path;
    playerPath = [startCell];
    hintsUsed = 0;
    dom['hudLevel'].textContent = `${id + 1}/${window.ANTELOPE_PATH_DATA.levels.length}`;
    timer = 0;
    showScreen('game');
    dom['winOverlay'].classList.add('hidden');
    resizeCanvas();
    draw();
    startTimer();
    try { document.dispatchEvent(new CustomEvent('level-start')); } catch(e) {}
  }

  function resetLevel() {
    playerPath = [startCell];
    hintsUsed = 0;
    timer = 0;
    startTimer();
    draw();
  }

  function startTimer() {
    stopTimer();
    timerHandle = setInterval(() => {
      timer++;
      dom['hudTime'].textContent = formatTime(timer);
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function useHint() {
    if (hintsUsed >= HINT_LIMIT) return;
    if (playerPath.length === 0) return;
    for (let i = 0; i < solutionPath.length; i++) {
      const cell = solutionPath[i];
      const alreadyInPath = playerPath.some(([r, c]) => r === cell[0] && c === cell[1]);
      if (!alreadyInPath) {
        playerPath = solutionPath.slice(0, i + 1);
        hintsUsed++;
        draw();
        playSfx('hint');
        if (i === solutionPath.length - 1) {
          setTimeout(() => checkWin(true), 200);
        }
        return;
      }
    }
  }

  function undoStep() {
    if (playerPath.length > 1) {
      playerPath.pop();
      draw();
    }
  }

  function checkWin(silent) {
    const last = playerPath[playerPath.length - 1];
    if (last && last[0] === goalCell[0] && last[1] === goalCell[1]) {
      const optimal = playerPath.length === solutionPath.length;
      const stars = computeStars(optimal, hintsUsed, timer);
      bestTimes[currentLevel] = { stars, time: timer, optimal };
      stopTimer();
      saveProgress();
      if (!silent) playSfx('win');
      showWinOverlay(stars, optimal);
      try { document.dispatchEvent(new CustomEvent('level-complete')); } catch(e) {}
    } else if (!silent) {
      playSfx('error');
    }
  }

  function checkSolution() {
    checkWin(false);
  }

  function computeStars(optimal, hints, time) {
    if (!optimal) return 1;
    if (hints === 0 && time < 30) return 3;
    if (hints <= 1) return 3;
    if (hints <= 2) return 2;
    return 2;
  }

  function showWinOverlay(stars, optimal) {
    dom['winStars'].textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    dom['winTime'].textContent = `Solved in ${formatTime(timer)}`;
    dom['winMoves'].textContent = optimal ? `${playerPath.length - 1} moves · optimal` : `${playerPath.length - 1} moves · ${solutionPath.length - 1} optimal`;
    dom['winOverlay'].classList.remove('hidden');
    spawnConfetti();
  }

  function spawnConfetti() {
    const ctx = dom['canvas'].getContext('2d');
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#92400e'];
    const N = 80;
    const pieces = [];
    for (let i = 0; i < N; i++) {
      pieces.push({
        x: Math.random() * dom['canvas'].width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
      });
    }
    const start = performance.now();
    function loop(now) {
      const elapsed = now - start;
      ctx.save();
      ctx.fillStyle = 'rgba(28,18,8,0.2)';
      ctx.fillRect(0, 0, dom['canvas'].width, dom['canvas'].height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      if (elapsed < 2500) requestAnimationFrame(loop);
      else { ctx.restore(); draw(); }
    }
    requestAnimationFrame(loop);
  }

  function handleCanvasClick(e) {
    const [r, c] = canvasToCell(e);
    if (r == null) return;
    tryExtendPath(r, c);
  }

  function handleTouch(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const rect = dom['canvas'].getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const [r, c] = pixelToCell(x, y);
    if (r != null) tryExtendPath(r, c);
  }

  function handleCanvasHover(e) {
    const [r, c] = canvasToCell(e);
    hoverCell = (r != null) ? [r, c] : null;
    draw();
  }

  function canvasToCell(e) {
    const rect = dom['canvas'].getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return pixelToCell(x, y);
  }

  function pixelToCell(x, y) {
    const cs = cellSize();
    const margin = cs * 0.5;
    const c = Math.round((x - margin) / cs);
    const r = Math.round((y - margin) / cs);
    if (r < 0 || r >= n || c < 0 || c >= n) return [null, null];
    return [r, c];
  }

  function cellSize() {
    return Math.floor(Math.min(dom['canvas'].width, dom['canvas'].height) / (n + 1));
  }

  // Check if (r2, c2) is reachable from (r1, c1) by a single antelope hop
  function isAntelopeMove(r1, c1, r2, c2) {
    const dr = r2 - r1;
    const dc = c2 - c1;
    const sorted = [Math.abs(dr), Math.abs(dc)].sort((a, b) => a - b);
    return sorted[0] === 1 && sorted[1] === 3;
  }

  function tryExtendPath(r, c) {
    if (walls[r][c]) return;
    const last = playerPath[playerPath.length - 1];
    if (!isAntelopeMove(last[0], last[1], r, c)) {
      playSfx('error');
      return;
    }
    if (playerPath.some(([pr, pc]) => pr === r && pc === c)) {
      playSfx('error');
      return;
    }
    playerPath.push([r, c]);
    draw();
    playSfx('click');
    if (r === goalCell[0] && c === goalCell[1]) {
      setTimeout(() => checkWin(false), 200);
    }
  }

  function resizeCanvas() {
    const max = Math.min(window.innerWidth - 32, 600);
    dom['canvas'].width = max;
    dom['canvas'].height = max;
    draw();
  }

  function draw() {
    if (!dom['canvas']) return;
    const ctx = dom['canvas'].getContext('2d');
    const w = dom['canvas'].width, h = dom['canvas'].height;
    const cs = cellSize();
    const margin = cs * 0.5;
    ctx.clearRect(0, 0, w, h);

    // Background cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = margin + c * cs;
        const y = margin + r * cs;
        const isWall = walls[r][c];
        const isStart = r === startCell[0] && c === startCell[1];
        const isGoal = r === goalCell[0] && c === goalCell[1];
        const inPath = playerPath.some(([pr, pc]) => pr === r && pc === c);
        const isHover = hoverCell && hoverCell[0] === r && hoverCell[1] === c;
        const isValidMove = hoverCell && !isWall && !isStart &&
          (playerPath.length === 0 ||
           isAntelopeMove(playerPath[playerPath.length - 1][0], playerPath[playerPath.length - 1][1], r, c))
          && !playerPath.some(([pr, pc]) => pr === r && pc === c);

        if (isWall) {
          ctx.fillStyle = '#1c1208';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
          ctx.fillStyle = '#3a2818';
          ctx.fillRect(x - cs * 0.35, y - cs * 0.35, cs * 0.7, cs * 0.7);
        } else if (isStart) {
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        } else if (isGoal) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        } else {
          ctx.fillStyle = inPath ? '#3a2818' : '#1c1208';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        }

        if (isHover && isValidMove) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        } else if (isHover && !isWall && !isStart && !isGoal && !inPath) {
          ctx.fillStyle = 'rgba(217, 119, 6, 0.10)';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        }

        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);

        if (isStart) drawStartMarker(ctx, x, y, cs);
        else if (isGoal) drawGoalMarker(ctx, x, y, cs);
      }
    }

    if (playerPath.length > 1) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = cs * 0.18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = playerPath[0];
      ctx.moveTo(margin + first[1] * cs, margin + first[0] * cs);
      for (let i = 1; i < playerPath.length; i++) {
        const [r, c] = playerPath[i];
        ctx.lineTo(margin + c * cs, margin + r * cs);
      }
      ctx.stroke();
    }

    for (let i = 0; i < playerPath.length; i++) {
      const [r, c] = playerPath[i];
      const x = margin + c * cs;
      const y = margin + r * cs;
      ctx.fillStyle = i === 0 ? '#fb923c' : (i === playerPath.length - 1 ? '#fbbf24' : '#f59e0b');
      ctx.beginPath();
      ctx.arc(x, y, cs * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1208';
      ctx.font = `bold ${Math.floor(cs * 0.22)}px -apple-system,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), x, y);
    }
    if (dom['hudMoves']) dom['hudMoves'].textContent = `${playerPath.length - 1}`;
  }

  function drawStartMarker(ctx, x, y, cs) {
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1208';
    ctx.font = `bold ${Math.floor(cs * 0.32)}px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', x, y);
  }

  function drawGoalMarker(ctx, x, y, cs) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1208';
    ctx.font = `bold ${Math.floor(cs * 0.32)}px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', x, y);
  }

  // ===== Audio =====
  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.04;
        musicGain.connect(audioCtx.destination);
        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.10;
        sfxGain.connect(audioCtx.destination);
      } catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }

  function playSfx(kind) {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    if (kind === 'click') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 880;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t); osc.stop(t + 0.1);
    } else if (kind === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = freq;
        g.gain.setValueAtTime(0, t + i * 0.1);
        g.gain.linearRampToValueAtTime(0.2, t + i * 0.1 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
        osc.connect(g); g.connect(sfxGain);
        osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.42);
      });
    } else if (kind === 'error') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 180;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t); osc.stop(t + 0.16);
    } else if (kind === 'hint') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.2);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t); osc.stop(t + 0.26);
    }
  }

  function playBgMusic() {
    if (!musicEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    // Savanna-themed: ascending A minor pentatonic
    const notes = [440.0, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25];
    const step = 0.5;
    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * step;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.06, t0 + 0.05);
      g.gain.linearRampToValueAtTime(0.04, t0 + step * 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + step * 0.95);
      osc.connect(g); g.connect(musicGain);
      osc.start(t0); osc.stop(t0 + step);
    });
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = setTimeout(playBgMusic, notes.length * 500);
  }

  function stopBgMusic() {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }

  function toggleMute() {
    musicEnabled = !musicEnabled;
    sfxEnabled = !sfxEnabled;
    if (dom['setMusic']) dom['setMusic'].checked = musicEnabled;
    if (dom['setSfx']) dom['setSfx'].checked = sfxEnabled;
    saveSettings();
    if (!musicEnabled) stopBgMusic();
    else playBgMusic();
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('antelopepath_settings') || '{}');
      musicEnabled = s.music !== false;
      sfxEnabled = s.sfx !== false;
      if (dom['setMusic']) dom['setMusic'].checked = musicEnabled;
      if (dom['setSfx']) dom['setSfx'].checked = sfxEnabled;
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('antelopepath_settings', JSON.stringify({ music: musicEnabled, sfx: sfxEnabled }));
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ bestTimes }));
    } catch (e) {}
  }

  function loadProgress() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      bestTimes = s.bestTimes || {};
    } catch (e) { bestTimes = {}; }
  }

  // Public: checkSolution() is also exposed for verifier
  window.antelopepath = {
    checkSolution: function() {
      const last = playerPath[playerPath.length - 1];
      if (!last) return false;
      if (last[0] !== goalCell[0] || last[1] !== goalCell[1]) return false;
      return true;
    },
    getPlayerPath: () => playerPath,
    getSolutionPath: () => solutionPath,
    getStart: () => startCell,
    getGoal: () => goalCell,
    getN: () => n,
    getWalls: () => walls,
    validateSolutionPath: function(level) {
      if (!level) return false;
      const path = level.solution_path;
      if (!path || path.length < 2) return path.length === 1;
      const wallsSet = new Set(level.walls.map(w => `${w[0]},${w[1]}`));
      for (let i = 0; i < path.length - 1; i++) {
        const [r1, c1] = path[i];
        const [r2, c2] = path[i + 1];
        const sorted = [Math.abs(r2-r1), Math.abs(c2-c1)].sort((a, b) => a - b);
        if (sorted[0] !== 1 || sorted[1] !== 3) return false;
        if (wallsSet.has(`${r2},${c2}`)) return false;
      }
      const last = path[path.length - 1];
      return last[0] === level.goal[0] && last[1] === level.goal[1];
    },
    solveWithPath: function(level, path) {
      if (!level) return false;
      n = level.n;
      walls = Array.from({ length: n }, () => Array(n).fill(false));
      level.walls.forEach(([r, c]) => { walls[r][c] = true; });
      startCell = level.start;
      goalCell = level.goal;
      playerPath = path.map(p => [p[0], p[1]]);
      return this.validateSolutionPath(level) && this.checkSolution();
    },
  };

  // ===== Init =====
  loadProgress();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup audio on page hide
  window.addEventListener('pagehide', () => {
    stopBgMusic();
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
  });
  window.addEventListener('beforeunload', () => {
    stopBgMusic();
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopBgMusic();
    else if (musicEnabled) playBgMusic();
  });
})();