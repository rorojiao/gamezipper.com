/**
 * R333 kropki-sudoku dot-render probe (v3 — ALPHA channel).
 *
 * v1 FAILED its own negative control: it scanned +/-0.3*cell, which reached the
 *   adjacent cell's bright digit glyph.
 * v2 used a tight disc but read the RGB channels. getImageData returns
 *   UNPREMULTIPLIED RGBA, so a 14%-alpha white grid line reads back as
 *   RGB=255 -> every grid-line midpoint looked "bright" and the probe passed
 *   on a build where drawDots() was never called.
 *
 * v3 measures the ALPHA channel, which is what actually encodes coverage:
 *   - bare thin grid line  : rgba(255,255,255,0.14) -> alpha ~36
 *   - box border           : rgba(255,255,255,0.55) -> alpha ~140
 *   - a rendered DOT       : stroke/fill alpha 0.90/0.85 -> alpha ~230
 *   - a digit glyph        : opaque -> alpha 255, but 0.5*cell from the line
 * A disc of radius 0.10*cell on the grid line therefore separates dot from
 * bare line, and the digit glyph cannot enter it.
 *
 * Also asserts the NEGATIVE direction (a line with no dot must stay dim) and
 * reports a BUILD MARKER so a cached page can never silently invalidate a run.
 */
(async () => {
  const r = {};
  const cv = document.getElementById('board');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cell = window.G.cell, n = window.G.n;
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const alphaAt = (x, y) => {
    const px = Math.round(x * dpr), py = Math.round(y * dpr);
    if (px < 0 || py < 0 || px >= cv.width || py >= cv.height) return 0;
    return img[(py * cv.width + px) * 4 + 3];
  };
  const discMaxAlpha = (cx, cy, rad) => {
    let best = 0;
    for (let dy = -rad; dy <= rad; dy += 1)
      for (let dx = -rad; dx <= rad; dx += 1) {
        if (dx * dx + dy * dy > rad * rad) continue;
        const v = alphaAt(cx + dx, cy + dy);
        if (v > best) best = v;
      }
    return best;
  };
  const RAD = cell * 0.10;
  const DOT_ALPHA = 170;   // a dot stroke/fill reaches ~230; a bare line ~36

  let expH = 0, expV = 0, foundH = 0, foundV = 0;
  const missed = [], falsePositive = [];

  for (let rr = 0; rr < n; rr++)
    for (let cc = 0; cc < n - 1; cc++) {
      const dot = window.G.hdots[rr][cc];
      const v = discMaxAlpha((cc + 1) * cell, rr * cell + cell / 2, RAD);
      if (dot) { expH++; if (v >= DOT_ALPHA) foundH++; else missed.push(['H', rr, cc, v]); }
      else if (v >= DOT_ALPHA) falsePositive.push(['H', rr, cc, v]);
    }
  for (let rr = 0; rr < n - 1; rr++)
    for (let cc = 0; cc < n; cc++) {
      const dot = window.G.vdots[rr][cc];
      const v = discMaxAlpha(cc * cell + cell / 2, (rr + 1) * cell, RAD);
      if (dot) { expV++; if (v >= DOT_ALPHA) foundV++; else missed.push(['V', rr, cc, v]); }
      else if (v >= DOT_ALPHA) falsePositive.push(['V', rr, cc, v]);
    }

  r.cell = cell; r.n = n; r.rad = RAD; r.threshold = DOT_ALPHA;
  const html = document.documentElement.outerHTML;
  r.buildMarker = html.includes('R333: was (c+1)*cell') ? 'FIXED' : 'PREFIX';
  r.expected = expH + expV;
  r.found = foundH + foundV;
  r.missedCount = missed.length; r.missed = missed.slice(0, 5);
  r.falsePositiveCount = falsePositive.length; r.falsePositive = falsePositive.slice(0, 5);
  r.verdict = (r.found === r.expected && r.falsePositiveCount === 0)
    ? `PASS[${r.buildMarker}] - all ${r.expected} dots render on the grid lines, 0 false positives`
    : `FAIL[${r.buildMarker}] - expected ${r.expected} dots, found ${r.found}; missed ${r.missedCount}; falsePos ${r.falsePositiveCount}`;
  return r;
})()
