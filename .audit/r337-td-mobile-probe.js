/* R337 tower-defense — mobile path-coverage probe (v3, real UI flow).
 *
 * The shipped verifier warns: "path world 1000x600 assumes a >=1000px
 * container; on narrow phones most of the path lies outside the placement
 * grid (responsive flaw, desktop unaffected)".
 *
 * v3 follows the REAL first-visit path:
 *   titleScreen -> "Play" (showLevelSelect) -> levelGrid button 1
 * then measures the LIVE canvas, the placement grid, and the path coverage.
 */
(async () => {
  const r = { vw: window.innerWidth, vh: window.innerHeight, href: location.href };
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const screen = id => { const e = document.getElementById(id); return e ? getComputedStyle(e).display !== 'none' : null; };

  r.screensBefore = { title: screen('titleScreen'), level: screen('levelSelect'), game: screen('gameScreen') };

  // 1. Play button (title screen) — it is a <button class="btn btn-primary"> with text "Play"
  const play = [...document.querySelectorAll('#titleScreen button')].find(b => /play/i.test(b.innerText || ''));
  r.playFound = !!play;
  if (play) play.click();
  await sleep(1000);
  r.afterPlay = { title: screen('titleScreen'), level: screen('levelSelect') };

  // 2. level 1 in the level grid
  const lv = document.querySelector('#levelGrid .level-btn');
  r.levelBtnFound = !!lv;
  if (lv) lv.click();
  await sleep(1800);
  r.afterLevel = { level: screen('levelSelect'), game: screen('gameScreen') };

  const c = document.getElementById('gameCanvas');
  if (!c) return { ERROR: 'no gameCanvas', ...r };
  const rect = c.getBoundingClientRect();
  r.canvas = {
    backingW: c.width, backingH: c.height,
    dispW: Math.round(rect.width), dispH: Math.round(rect.height),
    scaleX: +(c.width / (rect.width || 1)).toFixed(3), scaleY: +(c.height / (rect.height || 1)).toFixed(3),
  };
  r.scrollW = document.documentElement.scrollWidth;
  r.overflowX = r.scrollW > window.innerWidth;

  // 3. path + grid re-derived from the SHIPPED source
  try {
    const src = await (await fetch('/tower-defense/index.html?v=probe' + Date.now())).text();
    const pm = src.match(/const LEVEL_PATHS\s*=\s*\[/);
    let i = src.indexOf('[', pm.index), depth = 0, j = i;
    for (; j < src.length; j++) { if (src[j] === '[') depth++; else if (src[j] === ']') { depth--; if (depth === 0) break; } }
    const PATHS = eval('(' + src.slice(i, j + 1) + ')');
    const path = PATHS[0];
    const cellSize = Math.max(40, Math.min(50, c.width / 20));
    const cols = Math.ceil(c.width / cellSize);
    const rows = Math.ceil(c.height / cellSize);
    r.grid = { cellSize, cols, rows, canvasW: c.width, canvasH: c.height };

    const pathCells = new Set();
    for (let k = 0; k < path.length - 1; k++) {
      const [x1, y1] = path[k], [x2, y2] = path[k + 1];
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.ceil(dist / 10);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          pathCells.add(Math.floor((x + dx * cellSize) / cellSize) + ',' + Math.floor((y + dy * cellSize) / cellSize));
        }
      }
    }
    function pseg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
      if (len2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / len2; t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
    function d2p(px, py) {
      let m = Infinity;
      for (let k = 0; k < path.length - 1; k++) { const a = path[k], b2 = path[k + 1]; m = Math.min(m, pseg(px, py, a[0], a[1], b2[0], b2[1])); }
      return m;
    }
    let valid = 0, total = 0;
    const validList = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      total++;
      const isPath = pathCells.has(x + ',' + y);
      const d = d2p(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
      if (!isPath && d < cellSize * 3 && d > cellSize * 0.5) { valid++; validList.push([x, y]); }
    }
    r.placement = { totalCells: total, validCells: valid, validPct: +(100 * valid / (total || 1)).toFixed(1) };
    r.sampleValid = validList.slice(0, 8);

    let inside = 0;
    path.forEach(([x, y]) => { if (x <= c.width && y <= c.height) inside++; });
    r.pathVisible = { inside, total: path.length, pct: +(100 * inside / (path.length || 1)).toFixed(1) };
    const end = path[path.length - 1], start = path[0];
    r.pathEndpoints = {
      start: { x: start[0], y: start[1], onCanvas: start[0] <= c.width && start[1] <= c.height },
      end: { x: end[0], y: end[1], onCanvas: end[0] <= c.width && end[1] <= c.height },
    };
    // how far do the path points go vs the canvas
    r.pathMax = { x: Math.max(...path.map(p => p[0])), y: Math.max(...path.map(p => p[1])) };
  } catch (e) { r.pathErr = String(e); }

  // 4. live canvas pixels (is anything drawn?)
  try {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let nz = 0;
    for (let k = 0; k < d.length; k += 4) if (d[k] > 0 || d[k + 1] > 0 || d[k + 2] > 0) nz++;
    r.canvasRGB = nz;
  } catch (e) { r.pxErr = String(e); }
  return r;
})()
