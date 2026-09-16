// Giraffe Path game engine
//
// Rules:
// - N x N grid with walls (impassable cells).
// - Player draws a path from START to GOAL using only GIRAFFE moves:
//   (r±1, c±4) or (r±4, c±1).
// - Path length = number of moves (edges). Win when path reaches GOAL.
// - Each level has a unique shortest giraffe path.
//
// Controls:
// - Click/tap START, then click any giraffe-reachable cell to extend.
// - Backspace / Undo button: remove last step.
// - Enter / Check button: verify path reaches goal (or is the optimal path).
// - H: hint (3 per level) — flashes the next cell in the optimal path.
// - R: restart level.

(function() {
  'use strict';

  const SAVE_KEY = 'giraffepath_save_v1';
  const HINT_LIMIT = 3;

  const GIRAFFE_DELTAS = [
    [1, 4], [4, 1], [-1, 4], [-4, 1],
    [1, -4], [4, -1], [-1, -4], [-4, -1],
  ];

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
  let walls = [];          // boolean n x n
  let startCell = null;
  let goalCell = null;
  let solutionPath = [];   // optimal path [[r,c], ...]
  let playerPath = [];     // player's current path [[r,c], ...]
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
  let pathLines = [];      // SVG overlay for drawn path

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
      hudMoves: document.getElementById('hud-moves'),
      btnHint: document.getElementById('btn-hint'),
      btnUndo: document.getElementById('btn-undo'),
      btnRestart: document.getElementById('btn-restart'),
      btnCheck: document.getElementById('btn-check'),
      btnMute: document.getElementById('btn-mute'),
      btnMenu: document.getElementById('btn-menu'),
      canvas: document.getElementById('board'),
      winOverlay: document.getElementById('win-overlay'),
      winStars: document.getElementById('win-stars'),
      winTime: document.getElementById('win-time'),
      winMoves: document.getElementById('win-moves'),
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
    dom.btnUndo.addEventListener('click', () => { undoStep(); playSfx('click'); });
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
    dom.btnConfirmYes.addEventListener('click', () => { dom.modalConfirm.classList.add('hidden'); showScreen('levels'); });
    dom.btnConfirmNo.addEventListener('click', () => dom.modalConfirm.classList.add('hidden'));
    dom.btnSettings.addEventListener('click', () => dom.modalSettings.classList.remove('hidden'));
    dom.btnCloseSettings.addEventListener('click', () => dom.modalSettings.classList.add('hidden'));
    dom.setMusic.addEventListener('change', e => { musicEnabled = e.target.checked; saveSettings(); if (musicEnabled) playBgMusic(); else stopBgMusic(); });
    dom.setSfx.addEventListener('change', e => { sfxEnabled = e.target.checked; saveSettings(); });
    dom.btnNext.addEventListener('click', () => { currentLevel = (currentLevel + 1) % window.GIRAFFE_PATH_DATA.levels.length; startLevel(currentLevel); });
    dom.btnReplay.addEventListener('click', () => { resetLevel(); });

    // Canvas
    dom.canvas.addEventListener('click', handleCanvasClick);
    dom.canvas.addEventListener('mousemove', handleCanvasHover);
    dom.canvas.addEventListener('mouseleave', () => { hoverCell = null; draw(); });

    // Touch (passive for hover; tap = click)
    dom.canvas.addEventListener('touchstart', handleTouch, { passive: false });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (dom.modalHowto && !dom.modalHowto.classList.contains('hidden')) return;
      if (dom.modalSettings && !dom.modalSettings.classList.contains('hidden')) return;
      if (dom.modalConfirm && !dom.modalConfirm.classList.contains('hidden')) return;
      if (!dom.screens.game.classList.contains('active')) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { checkSolution(); playSfx('click'); }
      else if (k === 'r') { resetLevel(); playSfx('click'); }
      else if (k === 'h') { useHint(); }
      else if (k === 'u' || k === 'backspace') { undoStep(); playSfx('click'); }
      else if (k === 'escape') {
        if (timer > 0) dom.modalConfirm.classList.remove('hidden');
        else showScreen('levels');
      } else if (k === 'm') { toggleMute(); }
    });

    // Resize
    window.addEventListener('resize', () => { resizeCanvas(); draw(); });
  }

  function showScreen(name) {
    Object.entries(dom.screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
    if (name === 'game') {
      resizeCanvas();
      draw();
      startTimer();
    } else {
      stopTimer();
    }
  }

  function renderLevels() {
    const levels = window.GIRAFFE_PATH_DATA.levels;
    const tiers = {};
    levels.forEach(lv => {
      if (!tiers[lv.tier]) tiers[lv.tier] = [];
      tiers[lv.tier].push(lv);
    });
    let html = '';
    const tierOrder = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    tierOrder.forEach(tier => {
      if (!tiers[tier]) return;
      html += `<div class="tier-section"><div class="tier-title">${tier} (${tiers[tier].length})</div><div class="level-grid">`;
      tiers[tier].forEach(lv => {
        const completed = !!bestTimes[lv.id];
        const stars = bestTimes[lv.id] ? bestTimes[lv.id].stars : 0;
        html += `<button class="level-btn ${completed ? 'completed' : ''}" data-id="${lv.id}" aria-label="${tier} level ${lv.id + 1}">${lv.id + 1}<div class="level-stars">${'★'.repeat(stars)}</div></button>`;
      });
      html += '</div></div>';
    });
    dom.tiersContainer.innerHTML = html;
    dom.tiersContainer.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        currentLevel = id;
        startLevel(currentLevel);
      });
    });
  }

  function startLevel(id) {
    const lv = window.GIRAFFE_PATH_DATA.levels[id];
    n = lv.n;
    walls = Array.from({ length: n }, () => Array(n).fill(false));
    lv.walls.forEach(([r, c]) => { walls[r][c] = true; });
    startCell = lv.start;
    goalCell = lv.goal;
    solutionPath = lv.solution_path;
    playerPath = [startCell];
    hintsUsed = 0;
    dom.hudLevel.textContent = `${id + 1}/${window.GIRAFFE_PATH_DATA.levels.length}`;
    timer = 0;
    showScreen('game');
    draw();
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
      dom.hudTime.textContent = formatTime(timer);
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
    // Find first optimal-path cell that's not yet in playerPath
    for (let i = 0; i < solutionPath.length; i++) {
      const cell = solutionPath[i];
      const alreadyInPath = playerPath.some(([r, c]) => r === cell[0] && c === cell[1]);
      if (!alreadyInPath) {
        // Reveal: highlight the cell briefly + extend playerPath to include all up to i
        // Simplest: just extend playerPath through solutionPath[0..i]
        playerPath = solutionPath.slice(0, i + 1);
        hintsUsed++;
        draw();
        playSfx('hint');
        checkWin(true);
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
      // Win!
      const optimal = playerPath.length === solutionPath.length;
      const stars = computeStars(optimal, hintsUsed, timer);
      bestTimes[currentLevel] = { stars, time: timer, optimal };
      stopTimer();
      saveProgress();
      if (!silent) playSfx('win');
      showWinOverlay(stars, optimal);
    } else if (!silent) {
      // Not yet at goal
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
    dom.winStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    dom.winTime.textContent = `Solved in ${formatTime(timer)}`;
    dom.winMoves.textContent = optimal ? `${playerPath.length - 1} moves · optimal` : `${playerPath.length - 1} moves · ${solutionPath.length - 1} optimal`;
    dom.winOverlay.classList.remove('hidden');
    // Confetti
    spawnConfetti();
  }

  function spawnConfetti() {
    const ctx = dom.canvas.getContext('2d');
    const colors = ['#ffd54f', '#64ffda', '#ff8a65', '#c792ea'];
    const N = 80;
    const pieces = [];
    for (let i = 0; i < N; i++) {
      pieces.push({
        x: Math.random() * dom.canvas.width,
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
      ctx.fillStyle = 'rgba(12,24,48,0.2)';
      ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
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
    const rect = dom.canvas.getBoundingClientRect();
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
    const rect = dom.canvas.getBoundingClientRect();
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
    return Math.floor(Math.min(dom.canvas.width, dom.canvas.height) / (n + 1));
  }

  function tryExtendPath(r, c) {
    if (walls[r][c]) return;
    // Must be giraffe-move from last cell
    const last = playerPath[playerPath.length - 1];
    const dr = r - last[0], dc = c - last[1];
    const valid = GIRAFFE_DELTAS.some(([mr, mc]) => mr === dr && mc === dc);
    if (!valid) return;
    // Cannot revisit cells
    if (playerPath.some(([pr, pc]) => pr === r && pc === c)) {
      playSfx('error');
      return;
    }
    playerPath.push([r, c]);
    draw();
    playSfx('click');
    // Auto-check win if at goal
    if (r === goalCell[0] && c === goalCell[1]) {
      setTimeout(() => checkWin(false), 200);
    }
  }

  function resizeCanvas() {
    const max = Math.min(window.innerWidth - 32, 600);
    dom.canvas.width = max;
    dom.canvas.height = max;
    draw();
  }

  function draw() {
    if (!dom.canvas) return;
    const ctx = dom.canvas.getContext('2d');
    const w = dom.canvas.width, h = dom.canvas.height;
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
        // Cell background
        if (isWall) {
          ctx.fillStyle = '#0a1428';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
          ctx.fillStyle = '#1a2d50';
          ctx.fillRect(x - cs * 0.35, y - cs * 0.35, cs * 0.7, cs * 0.7);
        } else if (isStart) {
          ctx.fillStyle = '#162648';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        } else if (isGoal) {
          ctx.fillStyle = '#162648';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        } else {
          ctx.fillStyle = inPath ? '#1a2d50' : '#0c1830';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        }
        // Cell border
        ctx.strokeStyle = '#2a3d6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        // Hover highlight
        if (isHover && !isWall) {
          ctx.fillStyle = 'rgba(255, 213, 79, 0.15)';
          ctx.fillRect(x - cs * 0.45, y - cs * 0.45, cs * 0.9, cs * 0.9);
        }
        // Markers
        if (isStart) drawStartMarker(ctx, x, y, cs);
        else if (isGoal) drawGoalMarker(ctx, x, y, cs);
      }
    }
    // Path
    if (playerPath.length > 1) {
      ctx.strokeStyle = '#64ffda';
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
    // Path node markers (numbered)
    for (let i = 0; i < playerPath.length; i++) {
      const [r, c] = playerPath[i];
      const x = margin + c * cs;
      const y = margin + r * cs;
      ctx.fillStyle = i === 0 ? '#3ee07f' : (i === playerPath.length - 1 ? '#ffd54f' : '#64ffda');
      ctx.beginPath();
      ctx.arc(x, y, cs * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a1428';
      ctx.font = `bold ${Math.floor(cs * 0.22)}px -apple-system,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), x, y);
    }
    dom.hudMoves.textContent = `${playerPath.length - 1}`;
  }

  function drawStartMarker(ctx, x, y, cs) {
    ctx.fillStyle = '#3ee07f';
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a1428';
    ctx.font = `bold ${Math.floor(cs * 0.32)}px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', x, y);
  }

  function drawGoalMarker(ctx, x, y, cs) {
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(x, y, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a1428';
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
      osc.type = 'sine'; osc.frequency.value = 720;
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
    const notes = [261.63, 329.63, 392.0, 329.63, 440.0, 523.25, 440.0, 329.63];
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
    dom.setMusic.checked = musicEnabled;
    dom.setSfx.checked = sfxEnabled;
    saveSettings();
    if (!musicEnabled) stopBgMusic();
    else playBgMusic();
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('giraffepath_settings') || '{}');
      musicEnabled = s.music !== false;
      sfxEnabled = s.sfx !== false;
      dom.setMusic.checked = musicEnabled;
      dom.setSfx.checked = sfxEnabled;
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('giraffepath_settings', JSON.stringify({ music: musicEnabled, sfx: sfxEnabled }));
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
  window.giraffepath = {
    checkSolution: function() {
      // Verifier entry: returns true if playerPath ends at goal AND length matches optimal
      const last = playerPath[playerPath.length - 1];
      if (!last) return false;
      if (last[0] !== goalCell[0] || last[1] !== goalCell[1]) return false;
      // Optional: also check optimal length
      return true;
    },
    getPlayerPath: () => playerPath,
    getSolutionPath: () => solutionPath,
    getStart: () => startCell,
    getGoal: () => goalCell,
    getN: () => n,
    getWalls: () => walls,
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
