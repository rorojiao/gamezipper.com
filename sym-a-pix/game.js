// Sym-a-Pix game engine
//
// Rules:
// - N x N grid with 0..9 number clue in every cell
// - Each clue says: how many of my 8 neighbors are filled
// - Solution must satisfy all clues AND be point-symmetric (180° rotational)
// - Player toggles each cell filled (1) or empty (0)
// - Win: all clues match + grid is point-symmetric

(function() {
  'use strict';

  const SAVE_KEY = 'sym_a_pix_save_v1';
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
  let clues = [];         // clue numbers (displayed always)
  let solution = [];      // true solution (for hints / validation)
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
    dom.btnRestart.addEventListener('click', () => restartLevel());
    dom.btnCheck.addEventListener('click', onCheckWin);
    dom.btnMute.addEventListener('click', () => toggleMute());
    dom.btnMenu.addEventListener('click', () => {
      if (currentLevel >= 0) {
        dom.modalConfirm.classList.remove('hidden');
      } else {
        showScreen('title');
      }
    });
    dom.btnConfirmYes.addEventListener('click', () => {
      dom.modalConfirm.classList.add('hidden');
      stopTimer();
      showScreen('levels');
      renderLevels();
    });
    dom.btnConfirmNo.addEventListener('click', () => dom.modalConfirm.classList.add('hidden'));
    dom.btnSettings.addEventListener('click', () => dom.modalSettings.classList.remove('hidden'));
    dom.btnCloseSettings.addEventListener('click', () => dom.modalSettings.classList.add('hidden'));
    dom.setMusic.addEventListener('change', () => { musicEnabled = dom.setMusic.checked; saveSettings(); if (musicEnabled) playBgMusic(); else stopBgMusic(); });
    dom.setSfx.addEventListener('change', () => { sfxEnabled = dom.setSfx.checked; saveSettings(); });
    dom.btnNext.addEventListener('click', () => {
      dom.winOverlay.classList.add('hidden');
      const next = currentLevel + 1;
      if (next < SYM_A_PIX_LEVELS.levels.length) {
        loadLevel(next);
      } else {
        stopTimer();
        showScreen('levels');
        renderLevels();
      }
    });
    dom.btnReplay.addEventListener('click', () => {
      dom.winOverlay.classList.add('hidden');
      restartLevel();
    });
    // canvas click handling
    dom.canvas.addEventListener('click', (e) => onCanvasClick(e, false));
    dom.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); onCanvasClick(e, true); });
    // touch long-press for right-click on mobile
    let touchTimer = null;
    let touchMoved = false;
    dom.canvas.addEventListener('touchstart', (e) => {
      touchMoved = false;
      touchTimer = setTimeout(() => {
        touchTimer = null;
        if (!touchMoved) onCanvasClick(e, true);
      }, 500);
    });
    dom.canvas.addEventListener('touchmove', () => { touchMoved = true; });
    dom.canvas.addEventListener('touchend', () => {
      if (touchTimer !== null) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    });
    // mouse hover
    dom.canvas.addEventListener('mousemove', (e) => onCanvasHover(e));
    dom.canvas.addEventListener('mouseleave', () => { hoverCell = null; drawBoard(); });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Enter') {
        if (!dom.winOverlay.classList.contains('hidden')) {
          dom.btnNext.click();
        } else {
          onCheckWin();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        restartLevel();
      } else if (e.key === 'h' || e.key === 'H') {
        useHint();
      } else if (e.key === 'Escape') {
        if (!dom.modalHowto.classList.contains('hidden')) dom.modalHowto.classList.add('hidden');
        else if (!dom.modalSettings.classList.contains('hidden')) dom.modalSettings.classList.add('hidden');
        else if (!dom.modalConfirm.classList.contains('hidden')) dom.modalConfirm.classList.add('hidden');
        else if (currentLevel >= 0 && dom.screens.game.classList.contains('active')) {
          dom.modalConfirm.classList.remove('hidden');
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    });
    // Audio cleanup
    window.addEventListener('beforeunload', cleanupAudio);
    window.addEventListener('pagehide', cleanupAudio);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') cleanupAudio();
    });
  }

  function showScreen(name) {
    Object.values(dom.screens).forEach(s => s.classList.remove('active'));
    dom.screens[name].classList.add('active');
  }

  function loadSave() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function persistSave(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function loadSettings() {
    const s = loadSave();
    if (typeof s.music === 'boolean') musicEnabled = s.music;
    if (typeof s.sfx === 'boolean') sfxEnabled = s.sfx;
    bestTimes = s.bestTimes || {};
    if (dom.setMusic) dom.setMusic.checked = musicEnabled;
    if (dom.setSfx) dom.setSfx.checked = sfxEnabled;
  }

  function saveSettings() {
    const s = loadSave();
    s.music = musicEnabled;
    s.sfx = sfxEnabled;
    s.bestTimes = bestTimes;
    persistSave(s);
  }

  function renderLevels() {
    const groups = {};
    for (const lvl of SYM_A_PIX_LEVELS.levels) {
      if (!groups[lvl.tier]) groups[lvl.tier] = [];
      groups[lvl.tier].push(lvl);
    }
    const tierOrder = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    const completedSet = new Set(Object.keys(bestTimes).map(k => parseInt(k, 10)));
    let html = '';
    for (const tier of tierOrder) {
      if (!groups[tier]) continue;
      html += `<div class="tier-section"><div class="tier-title" style="color:${TIER_COLORS[tier] || '#888'}">${tier}</div><div class="level-grid">`;
      for (const lvl of groups[tier]) {
        const locked = lvl.id > 0 && !completedSet.has(lvl.id - 1);
        const completed = completedSet.has(lvl.id);
        const stars = bestTimes[lvl.id] ? starsHtml(bestTimes[lvl.id]) : '';
        html += `<button class="level-btn${locked ? ' locked' : ''}${completed ? ' completed' : ''}" data-id="${lvl.id}" ${locked ? 'disabled' : ''}>${lvl.id + 1}${stars}</button>`;
      }
      html += `</div></div>`;
    }
    dom.tiersContainer.innerHTML = html;
    dom.tiersContainer.style.alignItems = 'stretch';
    dom.tiersContainer.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        loadLevel(id);
      });
    });
  }

  function starsHtml(record) {
    if (!record) return '';
    const s = record.stars || 0;
    return `<div class="level-stars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</div>`;
  }

  function loadLevel(idx) {
    if (idx < 0 || idx >= SYM_A_PIX_LEVELS.levels.length) return;
    currentLevel = idx;
    const lvl = SYM_A_PIX_LEVELS.levels[idx];
    n = lvl.n;
    clues = lvl.clues;
    solution = lvl.solution;
    grid = Array.from({ length: n }, () => new Array(n).fill(-1)); // -1 = undecided
    hintsUsed = 0;
    timer = 0;
    dom.hudLevel.textContent = (idx + 1);
    dom.winOverlay.classList.add('hidden');
    showScreen('game');
    startTimer();
    drawBoard();
  }

  function restartLevel() {
    if (currentLevel < 0) return;
    timer = 0;
    hintsUsed = 0;
    const lvl = SYM_A_PIX_LEVELS.levels[currentLevel];
    grid = Array.from({ length: n }, () => new Array(n).fill(-1));
    dom.winOverlay.classList.add('hidden');
    startTimer();
    drawBoard();
  }

  // ============================================================
  // Cell interaction
  // ============================================================

  function getCellRCFromXY(x, y) {
    // Returns [r, c] or null
    const cw = dom.canvas.clientWidth;
    const padding = 12;
    const avail = cw - padding * 2;
    const cellSize = avail / n;
    const offsetX = (cw - avail) / 2;
    const offsetY = (cw - avail) / 2;
    const c = Math.floor((x - offsetX) / cellSize);
    const r = Math.floor((y - offsetY) / cellSize);
    if (r < 0 || r >= n || c < 0 || c >= n) return null;
    return [r, c];
  }

  function onCanvasClick(e, asRightClick) {
    e.preventDefault();
    if (currentLevel < 0) return;
    const rect = dom.canvas.getBoundingClientRect();
    let x, y;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    const rc = getCellRCFromXY(x, y);
    if (!rc) return;
    const [r, c] = rc;
    const cur = grid[r][c];
    // Click cycle:
    //   left: -1 (undecided) → 1 (filled) → 0 (explicit empty) → 1 → 0 → ...
    //   right: -1 (undecided) → 0 (explicit empty) → 1 → 0 → ...
    if (asRightClick) {
      if (cur === 0 || cur === -1) grid[r][c] = (cur === 0 ? 1 : 0);
      else grid[r][c] = 0;
    } else {
      if (cur === 1 || cur === -1) grid[r][c] = (cur === 1 ? 0 : 1);
      else grid[r][c] = 1;
    }
    playSfx('click');
    drawBoard();
  }

  function onCanvasHover(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rc = getCellRCFromXY(x, y);
    const newHover = rc ? `${rc[0]},${rc[1]}` : null;
    if (newHover !== hoverCell) {
      hoverCell = newHover;
      drawBoard();
    }
  }

  // ============================================================
  // Win check
  // ============================================================

  function checkSolution() {
    // Returns { ok: true/false, errors: [...] }
    const errors = [];
    // 1) every cell must be decided
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === -1) {
          errors.push(`cell (${r+1},${c+1}) undecided`);
        }
      }
    }
    if (errors.length > 0) return { ok: false, errors };
    // 2) every clue must match 8-neighbor count
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n) cnt += grid[nr][nc];
          }
        }
        if (cnt !== clues[r][c]) {
          errors.push(`clue (${r+1},${c+1}) = ${clues[r][c]} but got ${cnt}`);
        }
      }
    }
    // 3) point-symmetry
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const rr = n - 1 - r, cc = n - 1 - c;
        if (grid[r][c] !== grid[rr][cc]) {
          errors.push(`not symmetric at (${r+1},${c+1}) vs (${rr+1},${cc+1})`);
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }

  function onCheckWin() {
    if (currentLevel < 0) return;
    const result = checkSolution();
    if (result.ok) {
      playSfx('win');
      stopTimer();
      const stars = calculateStars(timer, hintsUsed);
      const t = formatTime(timer);
      dom.winStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      dom.winTime.textContent = `Solved in ${t}`;
      dom.winOverlay.classList.remove('hidden');
      // save best
      const prev = bestTimes[currentLevel];
      if (!prev || timer < prev.time) {
        bestTimes[currentLevel] = { time: timer, stars: stars, hints: hintsUsed };
        saveSettings();
      }
    } else {
      // show error feedback
      playSfx('error');
      flashError(`Not solved: ${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}`);
    }
  }

  function calculateStars(time, hints) {
    // 3 stars: time <= 30s and 0 hints
    // 2 stars: time <= 120s and hints <= 1
    // 1 star: solved
    if (time <= 30 && hints === 0) return 3;
    if (time <= 120 && hints <= 1) return 2;
    return 1;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function useHint() {
    if (currentLevel < 0) return;
    if (hintsUsed >= HINT_LIMIT) {
      flashError('No hints left (max 3 per level)');
      return;
    }
    // Find first cell where grid != solution (and is undecided or wrong)
    let found = null;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] !== solution[r][c]) {
          found = [r, c];
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      flashError('Already correct!');
      return;
    }
    grid[found[0]][found[1]] = solution[found[0]][found[1]];
    // propagate symmetric partner too
    const rr = n - 1 - found[0], cc = n - 1 - found[1];
    grid[rr][cc] = solution[rr][cc];
    hintsUsed++;
    playSfx('hint');
    drawBoard();
  }

  function flashError(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,82,82,0.92);color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:700;z-index:100;animation:fadeIn .3s ease';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  // ============================================================
  // Drawing
  // ============================================================

  function drawBoard() {
    const dpr = window.devicePixelRatio || 1;
    // Use a fixed canvas size based on screen-game wrapper (not canvas's own parent, to avoid shrinking loop).
    const wrap = document.getElementById('screen-game');
    const wrapW = wrap ? wrap.clientWidth : window.innerWidth;
    const cw = Math.min(640, Math.floor(wrapW * 0.94));
    dom.canvas.style.width = cw + 'px';
    dom.canvas.style.height = cw + 'px';
    dom.canvas.width = cw * dpr;
    dom.canvas.height = cw * dpr;
    const ctx = dom.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = 12;
    const avail = cw - padding * 2;
    const cellSize = avail / n;
    const gridW = cellSize * n;
    const gridH = cellSize * n;
    const offsetX = (cw - gridW) / 2;
    const offsetY = (cw - gridH) / 2;

    // Background
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, cw, cw);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const v = grid[r][c];
        // cell background
        if (v === 1) {
          // filled - pink/magenta
          const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          grad.addColorStop(0, '#ff6b9d');
          grad.addColorStop(1, '#ff4081');
          ctx.fillStyle = grad;
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          // small symbol
          ctx.fillStyle = '#fff';
          ctx.font = 'bold ' + (cellSize * 0.5) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('●', x + cellSize / 2, y + cellSize / 2 + 1);
        } else if (v === 0) {
          // explicitly empty - light cell
          ctx.fillStyle = '#162648';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        } else {
          // undecided - darker
          ctx.fillStyle = '#0c1830';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
        // clue number
        const clue = clues[r][c];
        if (v !== 1) {
          // clue color: depends on clue value
          let clueColor = '#9eb8e8';
          if (clue === 0) clueColor = '#3ee07f';
          else if (clue === 9) clueColor = '#ff5252';
          else if (clue >= 6) clueColor = '#ffd54f';
          ctx.fillStyle = clueColor;
          ctx.font = 'bold ' + (cellSize * 0.42) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(clue), x + cellSize / 2, y + cellSize / 2 + 1);
        }
        // hover highlight
        if (hoverCell === `${r},${c}`) {
          ctx.strokeStyle = '#64ffda';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
        }
      }
    }

    // Symmetry axis lines (subtle)
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    // horizontal axis (between rows m-1 and m for odd n; for even n, center)
    if (n % 2 === 1) {
      const m = Math.floor(n / 2);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + (m + 0.5) * cellSize);
      ctx.lineTo(offsetX + gridW, offsetY + (m + 0.5) * cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX + (m + 0.5) * cellSize, offsetY);
      ctx.lineTo(offsetX + (m + 0.5) * cellSize, offsetY + gridH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Grid lines
    ctx.strokeStyle = '#2a3d6a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      const yy = offsetY + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, yy);
      ctx.lineTo(offsetX + gridW, yy);
      ctx.stroke();
      const xx = offsetX + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(xx, offsetY);
      ctx.lineTo(xx, offsetY + gridH);
      ctx.stroke();
    }
  }

  // ============================================================
  // Timer
  // ============================================================

  function startTimer() {
    stopTimer();
    timer = 0;
    dom.hudTime.textContent = formatTime(0);
    timerHandle = setInterval(() => {
      timer++;
      dom.hudTime.textContent = formatTime(timer);
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  // ============================================================
  // Audio (Web Audio API)
  // ============================================================

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.06;
        musicGain.connect(audioCtx.destination);
        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.18;
        sfxGain.connect(audioCtx.destination);
      } catch (e) {
        return null;
      }
    }
    return audioCtx;
  }

  function playSfx(type) {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.connect(env);
    env.connect(sfxGain);
    let freq = 440;
    let dur = 0.08;
    if (type === 'click') { freq = 800; dur = 0.04; }
    else if (type === 'hint') { freq = 660; dur = 0.12; }
    else if (type === 'error') { freq = 200; dur = 0.18; }
    else if (type === 'win') { freq = 880; dur = 0.4; osc.type = 'triangle'; }
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playBgMusic() {
    if (!musicEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    stopBgMusic();
    // Cmaj7 → Dm7 → Am7 → G progression (one chord every 4s)
    const chords = [
      [261.63, 329.63, 392.00, 493.88],  // Cmaj7
      [293.66, 349.23, 440.00, 523.25],  // Dm7 (with C as 7)
      [220.00, 261.63, 329.63, 392.00],  // Am7
      [196.00, 246.94, 293.66, 392.00],  // G
    ];
    let beat = 0;
    function playChord() {
      if (!musicEnabled) return;
      const ctx2 = getAudioCtx();
      if (!ctx2) return;
      const chord = chords[beat % chords.length];
      const now = ctx2.currentTime;
      const dur = 4.0;
      const gain = ctx2.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.6, now + 2.5);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      gain.connect(musicGain);
      chord.forEach((f, i) => {
        const o = ctx2.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * (i === 0 ? 1 : 0.5); // bass on first
        o.connect(gain);
        o.start(now);
        o.stop(now + dur + 0.05);
      });
      beat++;
    }
    playChord();
    musicTimer = setInterval(playChord, 4000);
  }

  function stopBgMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  function toggleMute() {
    musicEnabled = !musicEnabled;
    sfxEnabled = !sfxEnabled;
    dom.setMusic.checked = musicEnabled;
    dom.setSfx.checked = sfxEnabled;
    saveSettings();
    if (musicEnabled) playBgMusic(); else stopBgMusic();
    dom.btnMute.textContent = musicEnabled ? '🔊' : '🔇';
  }

  function cleanupAudio() {
    stopBgMusic();
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
      musicGain = null;
      sfxGain = null;
    }
  }

  // ============================================================
  // Init
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
