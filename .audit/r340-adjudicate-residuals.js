#!/usr/bin/env node
/*
 * R340 residual-candidate adjudicator.
 *
 * The R340 cross-source detector flags duplicate level groups. This script
 * takes the DETECTED pairs and decides, per game, whether the pair is a real
 * player-visible duplicate or a false positive:
 *
 *   - Uses the canonical balanced-bracket extractor (gz-extract-levels.js),
 *     never a hand-rolled regex.
 *   - Uses the canonical D21 cosmetic-field denylist + SPEC_PROCEDURAL skip
 *     list, so this script agrees with the canonical detector by construction.
 *   - For each candidate pair it prints the DIFF of the two level objects
 *     (which fields differ), so the verdict rests on evidence, not on a score.
 */
const fs = require('fs');
const path = require('path');
const { extractLevelsFromHtml, extractFromJson } = require('./gz-extract-levels.js');

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');

// Canonical cosmetic-field denylist (identical to .audit/r338-d21-dup-levels.js).
const COSMETIC = new Set([
  'id', 'name', 'label', 'desc', 'description', 'tier', 'par', 'tutorial',
  'hint', 'difficulty', 'order', 'index', 'note',
  'solve_ms', 'solveTime', 'elapsed', 'duration_ms', 'gen_time',
]);

// Games whose level payload is only a difficulty preset -> not player-visible
// duplicates (identical list to the canonical D21 detector).
const SPEC_PROCEDURAL = new Set([
  'flood-fill', 'pocket-sort', 'paper-io', 'brick-breaker',
  'balance-scale',
]);

function strip(l) {
  const o = {};
  for (const k of Object.keys(l).sort()) {
    if (COSMETIC.has(k)) continue;
    o[k] = l[k];
  }
  return o;
}
function sig(l) { return JSON.stringify(strip(l)); }

function diffFields(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of [...keys].sort()) {
    const sa = JSON.stringify(a[k]);
    const sb = JSON.stringify(b[k]);
    if (sa !== sb) out.push(k);
  }
  return out;
}

function readCatalog(slug) {
  const dir = path.join(ROOT, slug);
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlPath)) return null;
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1) inline LEVELS / PUZZLES literal in index.html
  for (const name of ['LEVELS', 'PUZZLES']) {
    const re = new RegExp('(?:const|var|let)\\s+' + name + '\\s*=\\s*\\[');
    const m = html.match(re);
    if (m) {
      try {
        const lv = extractLevelsFromHtml(html, name);
        if (lv && lv.length) return { source: 'index.html:' + name, levels: lv };
      } catch (e) { /* fall through */ }
    }
  }
  // 2) sibling levels.json
  const lp = path.join(dir, 'levels.json');
  if (fs.existsSync(lp)) {
    try {
      const lv = extractFromJson(fs.readFileSync(lp, 'utf8'));
      if (lv && lv.length) return { source: 'levels.json', levels: lv };
    } catch (e) { /* fall through */ }
  }
  // 3) sibling data.js / levels-data.js (runtime catalogs)
  for (const f of ['data.js', 'levels-data.js', 'levels_compact.json']) {
    const fp = path.join(dir, f);
    if (!fs.existsSync(fp)) continue;
    try {
      const txt = fs.readFileSync(fp, 'utf8');
      for (const name of ['LEVELS', 'PUZZLES']) {
        const re = new RegExp('(?:const|var|let)\\s+' + name + '\\s*=\\s*\\[');
        if (!re.test(txt)) continue;
        const lv = extractLevelsFromHtml(txt, name);
        if (lv && lv.length) return { source: f + ':' + name, levels: lv };
      }
      const j = extractFromJson(txt);
      if (j && j.length) return { source: f, levels: j };
    } catch (e) { /* fall through */ }
  }
  return null;
}

const candidates = process.argv.slice(3);
if (!candidates.length) {
  console.error('usage: node r340-adjudicate-residuals.js [SITE_ROOT] SLUG...');
  process.exit(2);
}

for (const slug of candidates) {
  console.log('### ' + slug);
  if (SPEC_PROCEDURAL.has(slug)) {
    console.log('  VERDICT: SKIP (canonical D21 SPEC_PROCEDURAL — level payload is a difficulty preset, board is drawn at load time)');
    continue;
  }
  const cat = readCatalog(slug);
  if (!cat) { console.log('  VERDICT: NO-CATALOG (no inline LEVELS/PUZZLES, no levels.json, no data.js)'); continue; }
  console.log('  source: ' + cat.source + '  levels: ' + cat.levels.length);

  const groups = new Map();
  cat.levels.forEach((l, i) => {
    const k = sig(l);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const dups = [...groups.values()].filter(g => g.length > 1);
  if (!dups.length) { console.log('  VERDICT: NO-DUPLICATES (after cosmetic denylist)'); continue; }

  console.log('  duplicate groups: ' + dups.length);
  for (const g of dups.slice(0, 6)) {
    const a = cat.levels[g[0]], b = cat.levels[g[1]];
    const differing = diffFields(a, b);
    const cosmeticOnly = differing.every(k => COSMETIC.has(k));
    console.log('  pair [' + g.join(',') + ']' +
      ' diffFields=[' + differing.join(',') + ']' +
      ' cosmeticOnly=' + cosmeticOnly);
    if (!cosmeticOnly) {
      for (const k of differing.slice(0, 3)) {
        console.log('      ' + k + ':');
        console.log('        L' + g[0] + ' = ' + JSON.stringify(a[k]).slice(0, 160));
        console.log('        L' + g[1] + ' = ' + JSON.stringify(b[k]).slice(0, 160));
      }
    }
  }
  console.log('  VERDICT: ' + (dups.length ? 'NEEDS-REVIEW' : 'NO-DUPLICATES'));
}
