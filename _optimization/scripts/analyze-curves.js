#!/usr/bin/env node
/* Difficulty-curve analyzer (§四 acceptance): for every game with per-level difficulty data
 * (verify.json solution lengths / par / optimal), score the curve:
 *   rise     — overall upward trend (Spearman-ish between level idx and difficulty)
 *   sawtooth — after a peak there is a breather (a local max followed by a drop of ≥15%)
 *   onboarding — first 3 levels light (each ≤ 35% of max difficulty; L1 ≤ max*0.2)
 * verdict PASS needs: rise ≥ 0.5 AND onboarding AND (levels < 8 OR sawtooth present OR smooth monotonic)
 * Output: reports/difficulty-curves.json + console table */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const evDir = path.join(__dirname, '..', 'evidence');
const out = {};
for (const slug of fs.readdirSync(evDir)) {
  const vj = path.join(evDir, slug, 'verify.json');
  if (!fs.existsSync(vj)) continue;
  let d; try { d = JSON.parse(fs.readFileSync(vj, 'utf8')); } catch (e) { continue; }
  // extract per-level difficulty array from known shapes
  let diffs = null;
  if (Array.isArray(d)) diffs = d.map(l => l.optimal ?? l.moves ?? l.intendedMoves ?? l.par ?? l.solution?.length).filter(v => typeof v === 'number' && v > 0);
  else if (d.levels && Array.isArray(d.levels)) diffs = d.levels.map(l => l.optimal ?? l.moves ?? l.intendedMoves ?? l.par ?? l.solution?.length).filter(v => typeof v === 'number' && v > 0);
  else if (d.perLevel && Array.isArray(d.perLevel)) diffs = d.perLevel.map(l => l.optimal ?? l.moves ?? l.par ?? l.solution?.length).filter(v => typeof v === 'number' && v > 0);
  if (!diffs || diffs.length < 4) continue;
  const n = diffs.length, max = Math.max(...diffs);
  // rise: normalized Spearman (1 - 6*Σd²/(n(n²-1)))
  let sd = 0;
  const rank = a => a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]).map(([, i], r) => [i, r]).sort((x, y) => x[0] - y[0]).map(([, r]) => r);
  const r1 = rank(diffs), r2 = diffs.map((_, i) => i);
  for (let i = 0; i < n; i++) sd += (r1[i] - r2[i]) ** 2;
  const rise = n > 1 ? 1 - 6 * sd / (n * (n * n - 1)) : 1;
  // sawtooth: exists peak index p (not last) with diffs[p+1] <= diffs[p] * 0.85 and diffs[p] >= max*0.6
  let sawtooth = false, peakAt = -1;
  for (let p = Math.floor(n * 0.3); p < n - 1; p++) {
    if (diffs[p] >= max * 0.6 && diffs[p + 1] <= diffs[p] * 0.85) { sawtooth = true; peakAt = p; break; }
  }
  const monotonic = rise >= 0.85;
  const onboarding = diffs[0] <= Math.max(2, max * 0.2) && diffs.slice(0, 3).every(v => v <= Math.max(3, max * 0.35));
  const verdict = (rise >= 0.5 && onboarding && (n < 8 || sawtooth || monotonic)) ? 'PASS' : 'REVIEW';
  out[slug] = { n, max, rise: +rise.toFixed(3), sawtooth, peakAt, monotonic, onboarding, verdict, diffs };
  console.log(`${slug.padEnd(18)} n=${String(n).padStart(2)} max=${String(max).padStart(3)} rise=${rise.toFixed(2)} saw=${sawtooth ? 'Y' : 'n'} onb=${onboarding ? 'Y' : 'n'} → ${verdict}`);
}
fs.writeFileSync(path.join(__dirname, '..', 'reports', 'difficulty-curves.json'), JSON.stringify({ generated: new Date().toISOString(), curves: out }, null, 1));
const fail = Object.values(out).filter(o => o.verdict !== 'PASS').length;
console.log(`\n${Object.keys(out).length} curves analyzed, ${fail} need review`);
