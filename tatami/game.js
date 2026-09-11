// Tatami game engine
// Mechanics:
// - N x M grid (4x4 .. 4x8)
// - User places 1x2 / 2x1 rectangles to tile the grid
// - Anchors are pre-placed tiles (gold); cannot be removed
// - Constraint: at every interior corner point, only 2 tiles may meet (no 4-meet)
// - Goal: cover every cell with no 4-corner violation

(function() {
  'use strict';

  const SAVE_KEY = 'tatami_save_v1';
  const HINT_LIMIT = 3;
  const TILE_COLORS = [
    '#ff6b6b','#5fa8ff','#3ee07f','#ffd54f',
    '#c792ea','#ff8a65','#64ffda','#f48fb1',
    '#80cbc4','#fff176','#ffab91','#a5d6a7',
  ];

  // State
  let currentLevel = 0;
  let n = 0, m = 0;
  let tileGrid = [];          // 2D array of tile_id or 0 for empty
  let originalAnchors = [];   // [{head, foot}] immutable
  let solutionTiling = [];    // solution grid
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
  let pendingStart = null;    // [r,c] of first click for new tile

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
      currentLevel = Math.min(currentLevel + 1, TATAMI_LEVELS.levels.length - 1);
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
        if (pendingStart) {
          pendingStart = null;
          drawBoard();
          playSfx('erase');
        } else if (!dom.modalConfirm.classList.contains('hidden')) {
          dom.modalConfirm.classList.add('hidden');
        } else {
          dom.modalConfirm.classList.remove('hidden');
        }
      }
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
      { name: 'Beginner', label: '⭐ Beginner (4×4)' },
      { name: 'Easy',     label: '⭐⭐ Easy (4×6)' },
      { name: 'Medium',   label: '⭐⭐⭐ Medium (4×6)' },
      { name: 'Hard',     label: '⭐⭐⭐⭐ Hard (4×8)' },
      { name: 'Expert',   label: '⭐⭐⭐⭐⭐ Expert (4×8)' },
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
      const tierLevels = TATAMI_LEVELS.levels.filter(l => l.tier === t.name);
      tierLevels.forEach((lvl) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const idx = TATAMI_LEVELS.levels.indexOf(lvl);
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
    const lvl = TATAMI_LEVELS.levels[idx];
    n = lvl.n;
    m = lvl.m;
    originalAnchors = lvl.anchors.map(a => ({ head: a.head.slice(), foot: a.foot.slice() }));
    solutionTiling = lvl.solution_tiling.map(row => row.slice());
    // Initialize tileGrid from anchors
    tileGrid = Array.from({ length: n }, () => new Array(m).fill(0));
    let tid = 1000;
    const anchorTileIds = [];
    for (const anc of originalAnchors) {
      const h = anc.head, f = anc.foot;
      tileGrid[h[0]][h[1]] = tid;
      tileGrid[f[0]][f[1]] = tid;
      anchorTileIds.push(tid);
      tid++;
    }
    hintsUsed = 0;
    timer = 0;
    pendingStart = null;
    dom.hudLevel.textContent = String(idx + 1);
    dom.hudTime.textContent = '0:00';
    showScreen('game');
    drawBoard();
    startTimer();
  }

  function restartLevel() {
    const lvl = TATAMI_LEVELS.levels[currentLevel];
    n = lvl.n;
    m = lvl.m;
    originalAnchors = lvl.anchors.map(a => ({ head: a.head.slice(), foot: a.foot.slice() }));
    solutionTiling = lvl.solution_tiling.map(row => row.slice());
    tileGrid = Array.from({ length: n }, () => new Array(m).fill(0));
    let tid = 1000;
    for (const anc of originalAnchors) {
      tileGrid[anc.head[0]][anc.head[1]] = tid;
      tileGrid[anc.foot[0]][anc.foot[1]] = tid;
      tid++;
    }
    hintsUsed = 0;
    timer = 0;
    pendingStart = null;
    dom.hudTime.textContent = '0:00';
    drawBoard();
    playSfx('click');
  }

  function isAnchorTile(tid) {
    return tid >= 1000 && tid < 1000 + originalAnchors.length;
  }

  function getCellRCFromXY(x, y) {
    const dpr = window.devicePixelRatio || 1;
    const cw = dom.canvas.width / dpr;
    const ch = dom.canvas.height / dpr;
    const padding = 12;
    const gridSize = Math.min(cw - padding * 2, ch - padding * 2);
    const cellSize = gridSize / Math.max(n, m);
    const offsetX = (cw - cellSize * m) / 2;
    const offsetY = (ch - cellSize * n) / 2;
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (row < 0 || row >= n || col < 0 || col >= m) return null;
    return [row, col];
  }

  function findTileCells(tid) {
    const cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (tileGrid[r][c] === tid) cells.push([r, c]);
      }
    }
    return cells;
  }

  function removeTile(tid) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (tileGrid[r][c] === tid) tileGrid[r][c] = 0;
      }
    }
  }

  function nextFreeTid() {
    let max = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (tileGrid[r][c] > max) max = tileGrid[r][c];
      }
    }
    return max + 1;
  }

  function isValidTile(h, f) {
    const dr = f[0] - h[0];
    const dc = f[1] - h[1];
    if (!((dr === 0 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && dc === 0))) return false;
    if (tileGrid[h[0]][h[1]] !== 0) return false;
    if (tileGrid[f[0]][f[1]] !== 0) return false;
    // No 4-corner violation
    if (hasViolationAfterPlace(tileGrid, n, m, h, f)) return false;
    return true;
  }

  function hasViolationAfterPlace(grid, nn, mm, h, f) {
    // Place tentative tile
    grid[h[0]][h[1]] = 9999;
    grid[f[0]][f[1]] = 9999;
    let violation = false;
    for (let rr = Math.max(0, h[0] - 1); rr <= Math.min(nn - 2, h[0]); rr++) {
      for (let cc = Math.max(0, h[1] - 1); cc <= Math.min(mm - 2, h[1]); cc++) {
        const ids = new Set([
          grid[rr][cc], grid[rr][cc + 1],
          grid[rr + 1][cc], grid[rr + 1][cc + 1],
        ]);
        if (!ids.has(0) && ids.size === 4) {
          violation = true; break;
        }
      }
      if (violation) break;
    }
    // Also check around f
    if (!violation) {
      for (let rr = Math.max(0, f[0] - 1); rr <= Math.min(nn - 2, f[0]); rr++) {
        for (let cc = Math.max(0, f[1] - 1); cc <= Math.min(mm - 2, f[1]); cc++) {
          const ids = new Set([
            grid[rr][cc], grid[rr][cc + 1],
            grid[rr + 1][cc], grid[rr + 1][cc + 1],
          ]);
          if (!ids.has(0) && ids.size === 4) {
            violation = true; break;
          }
        }
        if (violation) break;
      }
    }
    // Undo
    grid[h[0]][h[1]] = 0;
    grid[f[0]][f[1]] = 0;
    return violation;
  }

  function handleCanvasClick(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell = getCellRCFromXY(x, y);
    if (!cell) {
      pendingStart = null;
      drawBoard();
      return;
    }
    const [r, c] = cell;

    // If clicked an existing non-anchor tile → remove it
    const tid = tileGrid[r][c];
    if (tid !== 0) {
      if (isAnchorTile(tid)) {
        playSfx('error');
        flashError('Cannot remove anchor tiles');
        pendingStart = null;
        drawBoard();
        return;
      }
      removeTile(tid);
      playSfx('erase');
      pendingStart = null;
      drawBoard();
      return;
    }

    // Empty cell — start or complete a placement
    if (!pendingStart) {
      pendingStart = [r, c];
      playSfx('click');
      drawBoard();
      return;
    }

    // Complete the placement
    const [hr, hc] = pendingStart;
    const dr = r - hr;
    const dc = c - hc;
    if (!((dr === 0 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && dc === 0))) {
      flashError('Tiles must be 1×2 or 2×1 (orthogonally adjacent)');
      pendingStart = [r, c];
      playSfx('error');
      drawBoard();
      return;
    }

    if (!isValidTile([hr, hc], [r, c])) {
      flashError('Invalid placement — would create 4-corner violation');
      pendingStart = [r, c];
      playSfx('error');
      drawBoard();
      return;
    }

    const newTid = nextFreeTid();
    tileGrid[hr][hc] = newTid;
    tileGrid[r][c] = newTid;
    pendingStart = null;
    playSfx('place');
    drawBoard();
  }

  function checkSolution(levelData, gridToCheck) {
    if (!levelData) {
      levelData = TATAMI_LEVELS.levels[currentLevel];
      gridToCheck = tileGrid;
    }
    const nn = levelData.n;
    const mm = levelData.m;
    const anchors = levelData.anchors;

    // 1. All cells covered
    for (let r = 0; r < nn; r++) {
      for (let c = 0; c < mm; c++) {
        if (gridToCheck[r][c] === 0) {
          playSfx('error');
          flashError(`Incomplete — cell (${r+1},${c+1}) is empty`);
          return false;
        }
      }
    }
    // 2. Anchors intact (they should be — they're immutable)
    for (const anc of anchors) {
      const tid_a = gridToCheck[anc.head[0]][anc.head[1]];
      const tid_b = gridToCheck[anc.foot[0]][anc.foot[1]];
      if (tid_a !== tid_b) {
        playSfx('error');
        flashError('Anchor tiles disturbed');
        return false;
      }
    }
    // 3. No 4-corner violation
    for (let r = 0; r < nn - 1; r++) {
      for (let c = 0; c < mm - 1; c++) {
        const ids = new Set([
          gridToCheck[r][c], gridToCheck[r][c + 1],
          gridToCheck[r + 1][c], gridToCheck[r + 1][c + 1],
        ]);
        if (ids.size === 4) {
          playSfx('error');
          flashError(`4 tiles meet at corner (${r+1},${c+1})`);
          return false;
        }
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
    // Find an empty (non-anchor) cell whose solution value differs from current
    let target = null;
    outer:
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        if (tileGrid[r][c] === 0) {
          // Look at solution tile
          const solTid = solutionTiling[r][c];
          // Find the partner
          let partner = null;
          for (let rr = 0; rr < n && !partner; rr++) {
            for (let cc = 0; cc < m && !partner; cc++) {
              if ((rr !== r || cc !== c) && solutionTiling[rr][cc] === solTid) {
                partner = [rr, cc];
              }
            }
          }
          if (partner && tileGrid[partner[0]][partner[1]] === 0) {
            // Check this tile doesn't already exist
            let alreadyPlaced = false;
            for (let rr = 0; rr < n && !alreadyPlaced; rr++) {
              for (let cc = 0; cc < m && !alreadyPlaced; cc++) {
                if (tileGrid[rr][cc] !== 0 && tileGrid[rr][cc] === solutionTiling[rr][cc]) {
                  // Check if this is the same tile as our target
                  let partner2 = null;
                  for (let rrr = 0; rrr < n && !partner2; rrr++) {
                    for (let ccc = 0; ccc < m && !partner2; ccc++) {
                      if ((rrr !== rr || ccc !== cc) && solutionTiling[rrr][ccc] === solutionTiling[rr][cc]) {
                        partner2 = [rrr, ccc];
                      }
                    }
                  }
                  if (partner2 && partner2[0] === partner[0] && partner2[1] === partner[1]) {
                    alreadyPlaced = true;
                  }
                }
              }
            }
            if (!alreadyPlaced) {
              target = [[r, c], partner];
              break outer;
            }
          }
        }
      }
    }
    if (!target) {
      flashError('No cells need hints!');
      return;
    }
    const [h, f] = target;
    const newTid = nextFreeTid();
    tileGrid[h[0]][h[1]] = newTid;
    tileGrid[f[0]][f[1]] = newTid;
    hintsUsed++;
    playSfx('hint');
    drawBoard();
    flashError(`Hint: tile placed (${HINT_LIMIT - hintsUsed} left)`);
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

  function colorForTid(tid) {
    if (isAnchorTile(tid)) return '#ffd54f';
    // Use a stable hash of the tile id
    const idx = (tid - 1000 - originalAnchors.length) % TILE_COLORS.length;
    return TILE_COLORS[(idx + TILE_COLORS.length) % TILE_COLORS.length];
  }

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
    const maxDim = Math.max(n, m);
    const avail = cw - padding * 2;
    const cellSize = avail / maxDim;
    const gridW = cellSize * m;
    const gridH = cellSize * n;
    const offsetX = (cw - gridW) / 2;
    const offsetY = (ch => (ch - gridH) / 2)(cw);

    // Background
    ctx.fillStyle = '#0c1830';
    ctx.fillRect(0, 0, cw, cw);

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const tid = tileGrid[r][c];
        if (tid !== 0) {
          ctx.fillStyle = colorForTid(tid);
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          // Anchor indicator (small dot at center)
          if (isAnchorTile(tid)) {
            ctx.fillStyle = 'rgba(0,0,0,.4)';
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Empty — show grid cell
          ctx.fillStyle = '#101e3a';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
      }
    }

    // Pending-start highlight
    if (pendingStart) {
      const [pr, pc] = pendingStart;
      const x = offsetX + pc * cellSize;
      const y = offsetY + pr * cellSize;
      ctx.strokeStyle = '#64ffda';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
      // Show ghost preview of valid partners
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = pr + dr, nc = pc + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
        if (tileGrid[nr][nc] !== 0) continue;
        if (isValidTile([pr, pc], [nr, nc])) {
          const gx = offsetX + nc * cellSize;
          const gy = offsetY + nr * cellSize;
          ctx.fillStyle = 'rgba(100, 255, 218, 0.25)';
          ctx.fillRect(gx + 4, gy + 4, cellSize - 8, cellSize - 8);
          ctx.strokeStyle = '#64ffda';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(gx + 4, gy + 4, cellSize - 8, cellSize - 8);
          ctx.setLineDash([]);
        }
      }
    }

    // Grid lines
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
  window.TATAMI = {
    init,
    loadLevel,
    checkSolution: checkSolution,
    tileGrid: () => tileGrid,
    n: () => n,
    m: () => m,
    placeTile: function(h, f) {
      const newTid = nextFreeTid();
      tileGrid[h[0]][h[1]] = newTid;
      tileGrid[f[0]][f[1]] = newTid;
    },
    setTileGrid: function(g) { tileGrid = g; },
  };
})();
