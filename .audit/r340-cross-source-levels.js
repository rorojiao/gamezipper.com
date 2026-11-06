#!/usr/bin/env node
// R340 detector (v2): CROSS-SOURCE level-catalog consistency.
//
// Bug class (pentomino, 2026-10-31 R340): the duplicate-level detector
// (r338-d21-dup-levels.js) reads the catalog through gz-extract-levels.js,
// whose precedence is (1) inline `const LEVELS = [...]` in index.html,
// (2) sibling levels.json.  But a game may load its catalog from a DIFFERENT
// file at runtime (levels-data.js, data.js, ...).  When the two disagree:
//
//   (a) the repair lands in only ONE file -> the player still meets the same
//       puzzle twice (the duplicate survives in the file the page loads), or
//   (b) the runtime file is edited into a shape the piece cannot tile ->
//       a P0 "level unsolvable" that every verifier MISSES, because the
//       verifiers read levels.json, not the file the page loads.
//
//   Confirmed on pentomino: levels.json idx5 was correctly changed to the
//   Y-pentomino region ["####","..#."], but levels-data.js (the file
//   index.html actually loads) was changed to ["####","...#"], which the Y
//   piece cannot tile.  verify_engine.js + verify_independent.js both read
//   levels.json -> 30/30 PASS on a level the player can never complete.
//
// This detector, for every live game:
//   1. finds the RUNTIME catalog source (inline in index.html, or the .js /
//      .json file index.html loads that defines a level array, including the
//      nested {levels:[...]} / window.X = {levels:[...]} shapes)
//   2. finds the AUDIT source gz-extract-levels.js would read
//   3. normalizes both to a canonical level-identity signature
//   4. reports games where the two disagree, and where each source has
//      duplicate levels the other does not.
//
// Usage:
//   node .audit/r340-cross-source-levels.js            # whole catalog
//   node .audit/r340-cross-source-levels.js SLUG ...   # subset
//   GZ_SITE_ROOT=/path/to/worktree node .audit/r340-cross-source-levels.js
//
// Exit 0 = consistent; exit 1 = divergence found.

const fs = require('fs');
const path = require('path');

const ROOT = process.env.GZ_SITE_ROOT
  ? path.resolve(process.env.GZ_SITE_ROOT)
  : path.resolve(__dirname, '..');

// ---------- generic helpers ----------

function extractBalanced(src, openIdx) {
  const open = src[openIdx];
  // NOTE: the close char must be '}' for '{'.  R340 detector v1 wrote '{'
  // here, so every OBJECT literal (e.g. `const X = {"levels":[...]}`) failed
  // to extract and was silently skipped -> the detector under-reported.
  const close = open === '[' ? ']' : '}';
  let depth = 0, instr = null, esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (instr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === instr) instr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { instr = ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return null;
}

// Find `const|let|var NAME = <[ or {>` and return the parsed value.
function extractNamedValue(src, names) {
  for (const nm of names) {
    const re = new RegExp('\\b(?:const|let|var)\\s+' + nm + '\\s*=\\s*[{[]', 'g');
    let m;
    while ((m = re.exec(src))) {
      const start = m.index + m[0].length - 1;
      const body = extractBalanced(src, start);
      if (!body) continue;
      try {
        const v = eval('(' + body + ')');
        return v;
      } catch (e) { /* try JSON.parse */ }
      try { return JSON.parse(body); } catch (e2) { /* keep searching */ }
    }
  }
  return null;
}

// Pull a level array out of a value: array | {levels:[...]} | {LEVELS:[...]}.
function asLevelArray(v) {
  if (!v) return null;
  if (Array.isArray(v)) return v;
  if (typeof v !== 'object') return null;
  for (const k of ['levels', 'LEVELS', 'data', 'puzzles', 'items']) {
    if (Array.isArray(v[k])) return v[k];
  }
  return null;
}

// A level array is "level-like" if its entries are objects (not strings).
function levelLike(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(e => e && typeof e === 'object' && !Array.isArray(e));
}

// ---------- runtime source discovery ----------

// Site-chrome scripts are loaded by every game page and are NOT the game's
// level catalog: games-data.js holds the 466-entry catalog, game-footer.js
// holds the related-games rail, the rest are ad/analytics/bootstrap.
// R340 detector v1 false-flagged 3 games because it accepted these.
const CHROME = /^(games-data|game-footer|monetag-manager|adsterra|gz-analytics|gz-ux|sw|site|main|app|common|vendor|jquery|bootstrap|analytics|gtag|adsbygoogle)([-.].*)?$/i;

function runtimeSources(slugDir) {
  const htmlPath = path.join(slugDir, 'index.html');
  if (!fs.existsSync(htmlPath)) return { kind: 'none', detail: 'no index.html' };
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1) inline catalog in index.html
  const inline = asLevelArray(extractNamedValue(html, ['LEVELS']));
  if (inline && levelLike(inline)) return { kind: 'inline', file: 'index.html', levels: inline };

  // 2) external file loaded via <script src> that defines the catalog
  const srcRe = /<script[^>]+src\s*=\s*["']([^"']+)["']/gi;
  let m;
  const loaded = [];
  while ((m = srcRe.exec(html))) loaded.push(m[1]);
  for (const ref of loaded) {
    if (/^https?:|^\/\/|^data:/i.test(ref)) continue;
    const base = ref.replace(/^\//, '').split('?')[0];
    const baseName = path.basename(base);
    if (CHROME.test(baseName)) continue;
    // A game may only load a catalog from its OWN directory, or from a path
    // that is explicitly under this game's directory (e.g. "pentomino/x.js").
    const candidates = [path.join(slugDir, baseName)];
    if (base.startsWith(slugDir + '/')) candidates.push(path.join(ROOT, base));
    for (const f of candidates) {
      if (!fs.existsSync(f)) continue;
      if (process.env.GZ_TRACE) console.error('  [trace] scanning candidate', path.basename(f));
      let src;
      try { src = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
      // whole-file JSON?
      let arr = null;
      try {
        const j = JSON.parse(src);
        arr = asLevelArray(j);
      } catch (e) { /* not JSON */ }
      if (!arr) {
        // any top-level assignment whose value holds a level array
        const re = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*[{[]/g;
        let mm;
        while ((mm = re.exec(src))) {
          if (process.env.GZ_TRACE) console.error('  [trace]  assign', mm[1], '@', mm.index);
          const start = mm.index + mm[0].length - 1;
          const body = extractBalanced(src, start);
          if (!body) { if (process.env.GZ_TRACE) console.error('  [trace]  no balanced body for', mm[1]); continue; }
          let v = null;
          try { v = eval('(' + body + ')'); } catch (e) { try { v = JSON.parse(body); } catch (e2) { if (process.env.GZ_TRACE) console.error('  [trace] eval+json fail for', mm[1], e.message.slice(0, 60)); continue; } }
          const cand = asLevelArray(v);
          if (cand && levelLike(cand)) { arr = cand; if (process.env.GZ_TRACE) console.error('  [trace] matched', mm[1], 'in', path.basename(f), 'n=' + cand.length); break; }
          if (process.env.GZ_TRACE) console.error('  [trace] ', mm[1], 'is not a level array (len ' + (cand ? cand.length : 'null') + ')');
        }
      }
      if (arr && arr.length) return { kind: 'external', file: path.relative(ROOT, f), levels: arr };
    }
  }
  return { kind: 'none', detail: 'no inline LEVELS and no loaded script defines one' };
}

// ---------- audit source discovery (mirrors gz-extract-levels.js precedence) ----------

function auditSource(slugDir) {
  const htmlPath = path.join(slugDir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const arr = asLevelArray(extractNamedValue(html, ['LEVELS']));
    if (arr) return { kind: 'inline', file: 'index.html', levels: arr };
  }
  for (const fname of ['levels.json', 'levels_inline.json']) {
    const p = path.join(slugDir, fname);
    if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      const arr = asLevelArray(j);
      if (arr) return { kind: 'json', file: fname, levels: arr };
    } catch (e) { /* try next */ }
  }
  return { kind: 'none', detail: 'no levels.json / levels_inline.json' };
}

// ---------- canonical level identity ----------

// Cosmetic fields are EXCLUDED from the identity, per
// game-commercial-readiness-audit Pitfall #73: the same board under two tier
// labels is still the same puzzle the player meets twice.
const COSMETIC = new Set([
  'id', 'name', 'label', 'desc', 'description', 'tier', 'par', 'tutorial',
  'hint', 'difficulty', 'order', 'index', 'note', 't',
  // R338: measured/derived fields are artifacts of the measurement.
  'solve_ms', 'solveTime', 'elapsed', 'duration_ms', 'gen_time',
]);

function levelIdentity(lv) {
  if (lv === null || typeof lv !== 'object') return JSON.stringify(lv);
  const keys = Object.keys(lv).filter(k => !COSMETIC.has(k)).sort();
  return JSON.stringify(keys.map(k => [k, lv[k]]));
}

// Compact runtimes (o/s/r/c/p) -> same identity shape as the JSON form
// (cols/rows/outline/pieces/solution) so the two sources compare.
const PIECE_ORDER = ['F','I','L','N','P','T','U','V','W','X','Y','Z'];
function compactToJson(lv) {
  if (!lv || typeof lv !== 'object' || !Array.isArray(lv.o)) return null;
  const cols = lv.c, rows = lv.r;
  const outline = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) row += (lv.o[r * cols + c] === 1 ? '#' : '.');
    outline.push(row);
  }
  const out = { cols, rows, outline, pieces: lv.p || [] };
  if (Array.isArray(lv.s)) {
    const sol = [];
    for (let r = 0; r < rows; r++) {
      let row = '';
      for (let c = 0; c < cols; c++) {
        const id = lv.s[r * cols + c];
        row += (id === undefined || id === null || id < 0) ? '.' : (PIECE_ORDER[id] || String(id));
      }
      sol.push(row);
    }
    out.solution = sol;
  }
  return out;
}

function isCompact(lv) { return lv && typeof lv === 'object' && Array.isArray(lv.o) && typeof lv.c === 'number' && typeof lv.r === 'number'; }

function identitySet(levels) {
  const map = new Map();
  levels.forEach((lv, i) => {
    const norm = isCompact(lv) ? compactToJson(lv) : lv;
    if (!norm) return;
    const id = levelIdentity(norm);
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(i);
  });
  return map;
}

// ---------- main ----------

function liveSlugs() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'games-data.js'), 'utf8');
  const t = src.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(t + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => g.url.replace(/^\//, '').replace(/\/\$/, ''));
}

const args = process.argv.slice(2);
const slugs = args.length && !args[0].startsWith('--') ? args : liveSlugs();

let divergent = 0, checked = 0, splitSource = 0;

for (const slug of slugs) {
  const dir = path.join(ROOT, slug);
  if (!fs.existsSync(dir)) continue;
  const rt = runtimeSources(dir);
  const au = auditSource(dir);
  if (rt.kind === 'none' && au.kind === 'none') continue;
  checked++;

  const rtIds = rt.levels ? identitySet(rt.levels) : new Map();
  const auIds = au.levels ? identitySet(au.levels) : new Map();

  const rtDup = [...rtIds.values()].filter(g => g.length > 1);
  const auDup = [...auIds.values()].filter(g => g.length > 1);

  const sameFile = rt.file && au.file && rt.file === au.file;
  const sameLen = rt.levels && au.levels && rt.levels.length === au.levels.length;

  let identical = false;
  if (rt.levels && au.levels && sameLen) {
    identical = [...rtIds.keys()].sort().join('|') === [...auIds.keys()].sort().join('|');
  }

  const report = [];
  if (!sameFile && rt.kind !== 'none' && au.kind !== 'none') {
    splitSource++;
    report.push(`SPLIT SOURCE: runtime=${rt.file} (${rt.levels.length}) audit=${au.file} (${au.levels.length})`);
    if (!identical) {
      divergent++;
      report.push('  ** CATALOG DIVERGENCE ** the two files describe different level sets');
      const rtKeys = new Set(rtIds.keys()), auKeys = new Set(auIds.keys());
      const onlyRt = [...rtKeys].filter(k => !auKeys.has(k));
      const onlyAu = [...auKeys].filter(k => !rtKeys.has(k));
      if (onlyRt.length) report.push(`  levels present in RUNTIME only: ${onlyRt.length}`);
      if (onlyAu.length) report.push(`  levels present in AUDIT only: ${onlyAu.length}`);
      if (onlyRt.length) report.push(`  e.g. runtime idx ${rtIds.get(onlyRt[0]).join(',')}: ${JSON.stringify(onlyRt[0]).slice(0, 170)}`);
      if (onlyAu.length) report.push(`  e.g. audit   idx ${auIds.get(onlyAu[0]).join(',')}: ${JSON.stringify(onlyAu[0]).slice(0, 170)}`);
    }
  }
  if (rtDup.length) report.push(`runtime duplicates: ${rtDup.length} group(s) -> ${JSON.stringify(rtDup)}`);
  if (auDup.length) report.push(`audit duplicates:   ${auDup.length} group(s) -> ${JSON.stringify(auDup)}`);

  if (report.length) {
    console.log(`\n### ${slug}`);
    report.forEach(r => console.log('  ' + r));
  }
}

console.log(`\nCHECKED=${checked}  SPLIT_SOURCE_GAMES=${splitSource}  DIVERGENT=${divergent}`);
process.exit(divergent > 0 ? 1 : 0);
