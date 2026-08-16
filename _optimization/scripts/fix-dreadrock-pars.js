#!/usr/bin/env node
/* dreadrock par regenerator (wave-A3).
 * ROOT CAUSE: 5 levels' 3-star par (`p`) is below the provably-minimal move count
 * (BFS over the engine's exact move semantics, see verify_engine.js solve()), so a
 * perfect player could never earn 3 stars: L2 par 8 < min 9, L7 par 8 < min 10,
 * L8 par 10 < min 12, L13 par 8 < min 9, L14 par 12 < min 13.
 * Fix: set p = BFS minimum for exactly those levels (levels with attainable pars are
 * kept VERBATIM; engine code untouched). Minimums come from the verifier's own solver
 * (DRK_PLAN_ONLY=1) so the fixer and the verifier share ONE implementation.
 * Usage: node _optimization/scripts/fix-dreadrock-pars.js   (writes in place) */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const FILE = path.join(ROOT, 'dreadrock', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');

const out = execFileSync(process.execPath, [path.join(ROOT, 'dreadrock', 'verify_engine.js')], {
  env: Object.assign({}, process.env, { DRK_PLAN_ONLY: '1' }), timeout: 170000,
}).toString();
const plans = [];
for (const line of out.split('\n')) {
  const t = line.trim();
  if (t.startsWith('{')) { const d = JSON.parse(t); if (d.n) plans.push(d); }
}
if (plans.length !== 30) { console.error('planner returned ' + plans.length + ' levels'); process.exit(1); }
const bad = plans.filter(p => !p.solvable);
if (bad.length) { console.error('unsolvable: ' + bad.map(p => 'L' + p.n + ' ' + p.why).join('; ')); process.exit(1); }
const toFix = plans.filter(p => p.par > 0 && p.par < p.min);
if (!toFix.length) { console.log('all pars already attainable — nothing to do'); process.exit(0); }

/* patch p: on the level-select line that starts each level's literal. Levels are
 * authored as successive {g:[...],p:N,h:"..."} literals; find each `p:N,` occurrence
 * in document order and patch only the target indices. */
const idxAll = [];
{ const re = /p:(\d+),h:/g; let m; while ((m = re.exec(html))) idxAll.push({ at: m.index, len: m[0].length, p: +m[1] }); }
/* 31 anchors: the original broken L6 literal is overwritten by "Level 6 fix" below it,
 * so anchor #5 is the dead pre-fix L6 (p:0) and anchor #i (i>5) is level i+1. */
if (idxAll.length !== 31) { console.error('expected 31 p:h: anchors (incl. dead pre-fix L6), found ' + idxAll.length); process.exit(1); }
const anchorLevel = (i) => (i < 5 ? i + 1 : i >= 6 ? i : 0); /* anchor 5 = dead literal; anchor 6 = "Level 6 fix" = LEVELS[5] */
const fixSet = new Map(toFix.map(f => [f.n, f.min]));
const expPar = new Map(plans.map(f => [f.n, f.par]));
/* apply edits back-to-front to keep offsets valid; guard against anchor misalignment */
const edits = [];
idxAll.forEach((e, i) => {
  const n = anchorLevel(i);
  if (!n || !fixSet.has(n)) return;
  if (e.p !== expPar.get(n)) { console.error('anchor ' + i + ' (L' + n + ') par ' + e.p + ' != planner-reported original ' + expPar.get(n)); process.exit(1); }
  if (e.p !== fixSet.get(n)) edits.push({ e, min: fixSet.get(n), n });
});
if (edits.length !== toFix.length) { console.error('anchor mismatch: ' + edits.length + ' vs ' + toFix.length); process.exit(1); }
for (const { e, min } of edits.slice().reverse()) {
  html = html.slice(0, e.at) + 'p:' + min + ',h:' + html.slice(e.at + e.len);
}
fs.writeFileSync(FILE, html);
console.log('PATCHED ' + FILE + ' — ' + edits.length + ' pars set to BFS minimum: ' +
  toFix.map(f => 'L' + f.n + ' par ' + f.par + '->' + f.min).join(', '));
