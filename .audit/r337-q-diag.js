#!/usr/bin/env node
/* R337 queens — diagnostic: how long does ONE level take per n, with the
 * region-size bounds taken from the SHIPPED catalog? The build2 script may be
 * stuck because the bounds make the uniqueness DFS unable to EXHAUST the
 * alternatives (which is what proving uniqueness requires).
 */
const G = require('./r337-queens-gen7.js');
const BOUNDS = { 7: [4, 9], 8: [5, 11], 9: [6, 12], 10: [8, 14], 11: [8, 14] };
const n = parseInt(process.argv[2] || '10', 10);
const tries = parseInt(process.argv[3] || '5', 10);
const [MIN, MAX] = BOUNDS[n];
console.log('n=' + n + ' bounds ' + MIN + '..' + MAX);
for (let seed = 1; seed <= tries; seed++) {
  const sol = G.ctx.__pq(n, G.mulberry32(seed * 31 + n));
  if (!sol) { console.log('  seed=' + seed + ' no queen placement'); continue; }
  const t0 = Date.now();
  let g = null, att = 0;
  while (!g && att < 3) {
    g = G.buildUnique(n, sol, G.mulberry32(seed * 7919 + n * 104729 + att * 977), 400000, MIN, MAX);
    att++;
  }
  const ms = Date.now() - t0;
  if (!g) { console.log('  seed=' + seed + ' FAIL after ' + att + ' attempts, ' + ms + 'ms'); continue; }
  const sizes = [];
  for (let R = 0; R < n; R++) { let k = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] === R) k++; sizes.push(k); }
  console.log('  seed=' + seed + ' OK ' + ms + 'ms exact=' + G.exactCount(n, g, 5) +
    ' sizes=' + Math.min(...sizes) + '..' + Math.max(...sizes));
}
