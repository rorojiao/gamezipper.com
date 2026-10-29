#!/usr/bin/env node
/**
 * R338 — D20 classifier v2: is a game's level catalog AUTHORED ("handcrafted")
 * or GENERATED at runtime?
 *
 * WHY v2 (the v1 detector was wrong in BOTH directions — a P1 test-gate defect):
 *
 *   FALSE NEGATIVES (v1 said UNKNOWN, the catalog is actually shipped):
 *     yajilin            -> `var LV=[`      (name not LEVELS/PUZZLES/GAME_DATA/LEVEL)
 *     tangram            -> `var LVLS=[`    (same)
 *     bus-traffic-fever  -> `var LEVELS=[` in game.js, NOT in index.html
 *     number-maze        -> catalog in data.js, NOT in index.html
 *     labyrinth          -> `var LEVELS=[]` EMPTY, filled by pushes in an
 *                            ANONYMOUS IIFE
 *   163 live games came back UNKNOWN and 14 of them CLAIM handcrafted levels,
 *   so the D20 class could not be closed.
 *
 *   FALSE POSITIVES (v1 said STATIC, the levels are actually GENERATED):
 *     v1 rule (2) matched ANY `var LEVEL…=` literal, including
 *       - an EMPTY catalog (`const LEVELS=[]` in color-by-number, lockpick)
 *       - a METADATA array (`var LEVEL_SEEDS=[101,202,…]` in hex-minesweeper,
 *         `const LEVEL_COUNTS={3:10,…}` in crossmath,
 *         `const LEVEL_GROUPS=[{name:'Tutorial',…}]` in drive-fury)
 *     In all of those the real levels come from a seeded generator, so the
 *     "handcrafted" claim is false. A field that reports on a fact is not the
 *     field that decides the verdict.
 *
 * THE DECISION PROCEDURE (in order):
 *   1. SHIPPED SOURCES — index.html inline <script> bodies + the same-dir .js
 *      that index.html actually references (<script src>, query string
 *      stripped) + sibling data files. A generator script the page does NOT
 *      reference (tangram's gen_levels.js) is a DEV tool, not the catalog.
 *   2. A GENERATOR THAT REACHES THE CATALOG decides PROCEDURAL. A function
 *      whose name is generator-shaped AND whose OWN body uses a randomness
 *      source, called (directly or via one builder level) into a catalog-named
 *      target.
 *   3. Otherwise a catalog whose data is AUTHORED decides STATIC: a literal
 *      array of >=2 level objects, or a builder that pushes authored literals
 *      (blumgi-slime's buildLevels() has NO randomness in its own body — the
 *      file's Math.random calls are cosmetic).
 *   4. Otherwise UNKNOWN — never guess.
 *
 * CALIBRATION lives in .audit/r338-d20-calibrate-v2.js and is BIDIRECTIONAL:
 *   POSITIVE  the 19 games v1 settled as PROCEDURAL stay PROCEDURAL
 *   NEGATIVE  every game v1 settled STATIC whose source shows an AUTHORED
 *             catalog stays STATIC; a changed verdict is listed for manual
 *             adjudication (the calibration prints the evidence)
 *   CONTROL   hidato -> PROCEDURAL, numbrix / suguru / tapa -> STATIC
 *   NEW       yajilin / tangram / bus-traffic-fever / number-maze /
 *             labyrinth / blumgi-slime -> STATIC
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.GZ_SITE_ROOT || path.resolve(__dirname, '..');

// randomness source
const RANDOM_RE = /Math\.random\s*\(|mulberry32\s*\(|seededRandom\s*\(|seedRng\s*\(|\brng\s*\(|\brandomSeed|\bnextRand\b|\bxorshift\b|\blcg\b|function\s+rand\s*\(|\bseed\s*\*\s*\d{3,}/i;
// a generator-shaped function name
const GEN_NAME_RE = /(generat|gen|make|build|creat|random|new)[A-Za-z0-9_$]*(level|puzzle|stage|board|config|map|course|world|grid|maze|image|room|cell|block|pattern)/i;
// a catalog-shaped variable name (seed/count/group metadata are NOT catalogs)
const CATALOG_RE = /^(?:level|levels|lv|lvs|lvls|puzzle|puzzles|stage|stages|challenge|challenges|round|rounds|config|configs|map|maps|course|courses|world|worlds|hole|holes|level_?data|leveldata|game_?data|gamedata|puzzle_?data|puzzledata|levels_?data|levelsdata|puzzles_?data|all_?levels|level_?raw|levels_?raw|raw_?levels|level_?paths|level_?waves)$/i;
// a .js file that is a DEV tool, never the shipped catalog
const DEV_TOOL_RE = /(verify|qa[-_]?|gen|test|browser[-_]?test|register|fix|solver|exp|checklist|make[-_]?art)/i;

function stripStrings(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  return new Function(src + '; return GAMES;')().filter(g => g.status === 'live');
}

// ---- balanced slicing (string-literal + comment aware) --------------------
function matchBracket(src, openIdx) {
  const open = src[openIdx];
  const close = open === '[' ? ']' : open === '{' ? '}' : open === '(' ? ')' : null;
  if (!close) return -1;
  let depth = 0, i = openIdx, quote = null;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i += 2; continue; }
      if (c === quote) quote = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const n = src.indexOf('\n', i); if (n < 0) break; i = n; continue; }
    if (c === '/' && src[i + 1] === '*') { const n = src.indexOf('*/', i); if (n < 0) break; i = n + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

// count top-level elements of an array literal body
function topLevelElements(body) {
  let depth = 0, quote = null, count = 0, sawContent = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; sawContent = true; continue; }
    if (c === ')' || c === ']' || c === '}') { depth--; continue; }
    if (depth === 0) {
      if (c === ',') count++;
      else if (!/\s/.test(c)) sawContent = true;
    }
  }
  return sawContent ? count + 1 : 0;
}

// count top-level OBJECT elements (a real level catalog's entries are objects)
function topLevelObjects(body) {
  let depth = 0, quote = null, objects = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') { if (depth === 0) objects++; depth++; continue; }
    if (c === '}') { depth--; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
  }
  return objects;
}

function fnBodies(src) {
  const out = [];
  const re = /function\s*([A-Za-z_$][\w$]*)?\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const brace = src.indexOf('{', m.index);
    if (brace < 0) continue;
    // guard: the '{' must belong to this function's body, not a default arg
    const end = matchBracket(src, brace);
    if (end < 0) continue;
    out.push({ name: m[1] || '(anonymous)', body: src.slice(brace, end + 1), start: m.index, end, brace });
  }
  return out;
}

function shippedSources(slug) {
  const dir = path.join(ROOT, slug);
  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) return null;
  const html = fs.readFileSync(idx, 'utf8');
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push({ file: 'index.html (inline)', code: m[1] });
  const srcRe = /<script[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  const seen = new Set();
  while ((m = srcRe.exec(html))) {
    let s = m[1];
    if (/^(https?:)?\/\//.test(s) || s.startsWith('/')) continue;
    s = s.split('?')[0].split('#')[0];
    const base = path.basename(s);
    if (!base || DEV_TOOL_RE.test(base)) continue;
    const p = path.join(dir, base);
    if (!fs.existsSync(p) || seen.has(base)) continue;
    seen.add(base);
    out.push({ file: base, code: fs.readFileSync(p, 'utf8') });
  }
  for (const f of ['levels.json', 'levels_inline.json', 'levels_compact.json', 'levels_inline.txt', 'puzzles.json']) {
    if (fs.existsSync(path.join(dir, f))) out.push({ file: f, code: fs.readFileSync(path.join(dir, f), 'utf8') });
  }
  return { dir, html, sources: out };
}

function isCatalogName(n) {
  n = n.split('.').pop().split('[')[0];
  return CATALOG_RE.test(n) || /levels?$/i.test(n) || /puzzles?$/i.test(n);
}

// catalog declarations: NAME = literal | NAME = call
function findCatalogDecls(src) {
  const hits = [];
  const re = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (!isCatalogName(name)) continue;
    const after = src.slice(m.index + m[0].length);
    const first = after[0];
    if (first === '[' || first === '{') {
      const end = matchBracket(src, m.index + m[0].length);
      if (end < 0) continue;
      const body = src.slice(m.index + m[0].length + 1, end);
      hits.push({ name, kind: 'literal', container: first, objects: topLevelObjects(body), elements: topLevelElements(body), file: null, src, start: m.index, body });
    } else if (first === '(' && /^\(\s*function\b/.test(after)) {
      // `var LEVELS = (function(){ var L=[]; L.push(...); return L; })()`
      const bodyStart = after.indexOf('{');
      const end = matchBracket(after, bodyStart);
      if (end < 0) continue;
      hits.push({ name, kind: 'iife', callee: '(function', file: null, src, start: m.index, body: after.slice(bodyStart, end + 1) });
    } else if (/[A-Za-z_$]/.test(first)) {
      const callRe = /([A-Za-z_$][\w$]*)\s*\(/;
      const cm = callRe.exec(after);
      if (cm) hits.push({ name, kind: 'call', callee: cm[1], file: null, src, start: m.index });
    }
  }
  return hits;
}

// Count the top-level entries of a literal catalog body that actually look
// like LEVELS: an object with >=2 keys, or a non-empty array. This separates
// a real catalog (`LEVELS=[{...},{...}]`) from a metadata object
// (`CONFIG={HEX_SIZE:36,...}`, `puzzles={0:[],1:[],daily:null}`).
function realLevelEntries(body, container) {
  const out = [];
  for (const e of topLevelEntries(body, container)) {
    if (isLevelShaped(e)) out.push(e);
  }
  return out.length;
}

// Is this catalog entry LEVEL-shaped (as opposed to metadata)?
// A level entry is an object carrying the puzzle's own content, or an array
// of cells, or a string definition. The metadata class fails this test:
//   hex-haven   CONFIG={HEX_SIZE:36,...,TERRAIN_COLORS:{forest:{...}}} — a
//               theme map whose values are flat colour records
//   killer-sudoku puzzles={0:[],1:[],...,daily:null} — index-keyed but the
//               values are EMPTY (the generator fills them later)
// A level-shaped object has >=2 keys AND either a non-empty nested array
// (the board) or >=3 keys.
function isLevelShaped(e) {
  if (e.kind === 'arr') {
    // a list of level OBJECTS  -> a real catalog value
    //   (suguru: LEVELS={easy:[{grid,regions,givens},...]})
    if (e.arrObjCount >= 1) return true;
    // an ENCODED BOARD: a list of non-empty arrays
    //   ({v:[[0,2,2],[1,1]]})
    if (e.arrArrCount >= 1) return true;
    // a list of type names / empty slots is NOT a level
    //   (TERRAIN_TYPES:['forest','field'], killer-sudoku's `0:[]`)
    return false;
  }
  if (e.kind === 'str') return e.len > 0;
  if (e.kind === 'obj') {
    if (e.keys < 2) return false;
    if (e.hasNonEmptyArray) return true;
    if (e.keys >= 3) return true;
    return false;
  }
  return false;
}

// Enumerate the top-level entries of a literal body.
// container is the ORIGINAL bracket: '[' for an array literal, '{' for an
// object literal. (The body passed in has the outer bracket stripped.)
function topLevelEntries(body, container) {
  const out = [];
  let i = 0;
  const n = body.length;
  while (i < n && /\s/.test(body[i])) i++;
  if (i >= n) return out;
  const isObj = container === '{';
  if (isObj) {
    // object body: parse `key : value` pairs. The body's outer braces are
    // already stripped, so start at the first key.
    while (i < n) {
      while (i < n && /[\s,]/.test(body[i])) i++;
      if (i >= n) break;
      // key
      while (i < n && body[i] !== ':') {
        if (body[i] === '}' || body[i] === ']') break;
        i++;
      }
      if (i >= n || body[i] !== ':') break;
      i++; // skip ':'
      while (i < n && /\s/.test(body[i])) i++;
      const val = readValue(body, i);
      if (val) { out.push(val); i = val.end; }
      else i++;
      // skip to next comma at this depth
      let d = 0;
      while (i < n) {
        const c = body[i];
        if (c === '{' || c === '[' || c === '(') d++;
        else if (c === '}' || c === ']' || c === ')') { if (d === 0) break; d--; }
        else if (c === ',' && d === 0) { i++; break; }
        i++;
      }
    }
    return out;
  }
  // array body
  while (i < n) {
    while (i < n && /[\s,]/.test(body[i])) i++;
    if (i >= n || body[i] === ']') break;
    const val = readValue(body, i);
    if (val) { out.push(val); i = val.end; }
    else i++;
  }
  return out;
}

// read one JS literal value starting at i; returns {kind, keys, len, end}
function readValue(body, i) {
  const n = body.length;
  if (i >= n) return null;
  const c = body[i];
  if (c === '{') {
    const end = matchBracket(body, i);
    if (end < 0) return null;
    const inner = body.slice(i + 1, end);
    return { kind: 'obj', keys: countKeysIn(inner), hasNonEmptyArray: hasNonEmptyArray(inner), len: end - i, end: end + 1 };
  }
  if (c === '[') {
    const end = matchBracket(body, i);
    if (end < 0) return null;
    const inner = body.slice(i + 1, end);
    const els = topLevelEntries(inner, '[');
    return {
      kind: 'arr', keys: 0, len: end - i, end: end + 1,
      arrObjCount: els.filter(e => e.kind === 'obj' && e.keys >= 2).length,
      arrArrCount: els.filter(e => e.kind === 'arr' && e.len > 2).length
    };
  }
  if (c === '"' || c === "'" || c === '`') {
    let j = i + 1;
    while (j < n) {
      if (body[j] === '\\') { j += 2; continue; }
      if (body[j] === c) break;
      j++;
    }
    return { kind: 'str', keys: 0, len: j - i - 1, end: j + 1 };
  }
  // number / boolean / null
  let j = i;
  while (j < n && !/[\s,\]}]/.test(body[j])) j++;
  const txt = body.slice(i, j);
  if (!txt) return null;
  const kind = /^-?\d/.test(txt) ? 'num' : 'other';
  return { kind, keys: 0, len: txt.length, end: j };
}

// the shapes of the objects pushed into `name.push(...)`
function v2_pushEntries(code, name) {
  const out = [];
  const re = new RegExp('(?<![\\w$.])' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\s*\\.\\s*push\\s*\\(', 'g');
  let m;
  while ((m = re.exec(code))) {
    const open = code.indexOf('(', m.index + m[0].length - 1);
    const end = matchBracket(code, open);
    if (end < 0) continue;
    out.push(code.slice(open + 1, end));
  }
  return out;
}

// the names of functions CALLED at the top level of a literal body
function topLevelCallNames(body) {
  const out = [];
  let d = 0, quote = null;
  // strip strings first so a '(' inside a string is not counted
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{' || c === '[' || c === '(') {
      if (c === '(' && d === 0) {
        // read the identifier immediately before the '('
        let j = i - 1;
        while (j >= 0 && /\s/.test(body[j])) j--;
        let k = j;
        while (j >= 0 && /[A-Za-z_$]/.test(body[j])) j--;
        const nm = body.slice(j + 1, k + 1);
        if (nm && /^[A-Za-z_$][\w$]*$/.test(nm)) out.push(nm);
      }
      d++; continue;
    }
    if (c === '}' || c === ']' || c === ')') d--;
  }
  return out;
}

// does this object body contain a NON-EMPTY array value?
// `TERRAIN_COLORS:{forest:{main,light,dark,icon}}` has none; a level
// `{w:4,h:4,v:[[0,2,2],[1,1]]}` does.
function hasNonEmptyArray(inner) {
  let d = 0, quote = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') {
      const end = matchBracket(inner, i);
      if (end < 0) return false;
      // non-empty = has at least one non-space char between the brackets
      if (inner.slice(i + 1, end).trim().length > 0) return true;
      i = end;
      continue;
    }
    if (c === '{' || c === '(') d++;
    else if (c === '}' || c === ')') d--;
  }
  return false;
}

// count `key:` pairs at depth 1 of an object body
function countKeysIn(inner) {
  let d = 0, quote = null, keys = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{' || c === '[' || c === '(') { d++; continue; }
    if (c === '}' || c === ']' || c === ')') { d--; continue; }
    if (d === 0 && c === ':') keys++;
  }
  return keys;
}

// find pushes into a catalog target anywhere in a source
function findCatalogPushes(src) {
  const out = [];
  const re = /([A-Za-z_$][\w$]*)\s*\.\s*push\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    if (!isCatalogName(m[1])) continue;
    const exprStart = m.index + m[0].length - 1;
    const exprEnd = matchBracket(src, exprStart);
    if (exprEnd < 0) continue;
    out.push({ target: m[1], expr: src.slice(exprStart, exprEnd + 1), src, start: m.index });
  }
  return out;
}

// does `expr` contain randomness, directly or via one call level?
function exprIsRandom(src, expr, fns) {
  const clean = stripStrings(expr);
  if (RANDOM_RE.test(clean)) return true;
  const callRe = /([A-Za-z_$][\w$]*)\s*\(/g;
  let cm;
  while ((cm = callRe.exec(clean))) {
    const callee = cm[1];
    const cf = fns.find(x => x.name === callee);
    if (cf && RANDOM_RE.test(stripStrings(cf.body))) return true;
  }
  return false;
}

function classify(slug) {
  const dir = path.join(ROOT, slug);
  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) return { kind: 'ERROR', why: 'no index.html' };
  const html = fs.readFileSync(idx, 'utf8');

  // (1) a shipped data file IS authored content
  for (const f of ['levels.json', 'levels_inline.json', 'levels_compact.json', 'levels_inline.txt', 'puzzles.json']) {
    if (fs.existsSync(path.join(dir, f))) return { kind: 'STATIC', why: 'ships ' + f };
  }

  const shipped = shippedSources(slug);

  // gather per-source function tables
  const perSource = shipped.sources.map(s => ({ s, fns: fnBodies(s.code) }));

  // ---- gather AUTHORED catalog evidence (a real level catalog) -------------
  // A literal is a REAL catalog only if its entries look like levels: an
  // object with >=2 keys, or a non-empty array. This excludes the metadata
  // class (killer-sudoku's `puzzles={0:[],1:[],...,daily:null}`,
  // hex-haven's `CONFIG={HEX_SIZE:36,...}`) which v1 called STATIC.
  const authored = [];   // {name, file, why}
  const decls = [];
  for (const { s } of perSource) {
    for (const d of findCatalogDecls(s.code)) { d.file = s.file; d.owner = s; decls.push(d); }
  }
  for (const d of decls) {
    if (d.kind === 'literal' && d.elements >= 2 && realLevelEntries(d.body, d.container) >= 2) {
      authored.push({ name: d.name, file: d.file, why: 'literal catalog ' + d.name + '[] (' + d.elements + ' entries) in ' + d.file });
    }
  }
  // a literal catalog whose entries are BUILDER CALLS of an authored
  //   builder (shape-fold: `LEVELS=[buildSquares([[0,0],[1,0]], ...), ...]`).
  //   The builder is deterministic and non-randomising, so the catalog is
  //   authored even though the entries are not literal objects.
  for (const d of decls) {
    if (d.kind !== 'literal' || d.elements < 2) continue;
    const owner = perSource.find(x => x.s === d.owner);
    if (!owner) continue;
    const calls = topLevelCallNames(d.body);
    if (!calls.length) continue;
    const builders = calls.map(cn => owner.fns.find(f => f.name === cn)).filter(Boolean);
    if (!builders.length) continue;
    const allAuthored = builders.every(b =>
      !RANDOM_RE.test(stripStrings(b.body)) && !/Math\.random/i.test(b.body));
    if (allAuthored) {
      authored.push({ name: d.name, file: d.file, why: 'literal catalog ' + d.name + '[] (' + d.elements + ' entries) built by ' + [...new Set(calls)].join('/') + '() in ' + d.file });
    }
  }
  // a catalog assigned from a builder that pushes authored literals
  for (const d of decls) {
    if (d.kind !== 'call') continue;
    const owner = perSource.find(x => x.s === d.owner);
    if (!owner) continue;
    const builder = owner.fns.find(f => f.name === d.callee);
    if (!builder) continue;
    if (RANDOM_RE.test(stripStrings(builder.body))) continue; // procedural
    if (/\.\s*push\s*\(/.test(builder.body) || /\[\s*\.\.\./.test(builder.body)) {
      authored.push({ name: d.name, file: d.file, why: 'builder ' + d.callee + '() assembles AUTHORED literals into "' + d.name + '" (' + d.file + ')' });
    }
  }
  // a catalog filled by pushes of authored data (empty literal + pushes)
  for (const { s, fns } of perSource) {
    for (const p of findCatalogPushes(s.code)) {
      if (!exprIsRandom(s.code, p.expr, fns)) {
        authored.push({ name: p.target, file: s.file, why: 'catalog "' + p.target + '" filled with authored literals in ' + s.file });
      }
    }
  }
  // a catalog assigned from an IIFE that assembles AUTHORED literals:
  //   `var LEVELS = (function(){ var L=[]; L.push({...}); return L; })()`
  for (const d of decls) {
    if (d.kind !== 'iife') continue;
    if (RANDOM_RE.test(stripStrings(d.body))) continue;
    if (/\.\s*push\s*\(/.test(d.body)) {
      authored.push({ name: d.name, file: d.file, why: 'IIFE assembles AUTHORED literals into "' + d.name + '" (' + d.file + ')' });
    }
  }

  // ---- gather GENERATED catalog evidence ----------------------------------
  // A randomising generator that feeds a catalog makes that catalog
  // PROCEDURAL. Note it may feed a DIFFERENT catalog than the main one
  // (shakashaka's `generateDailyPuzzle()` feeds `puzzle` while its 30-level
  // `LEVELS` catalog is authored) — so the two sets are compared by NAME.
  const generated = [];
  for (const { s, fns } of perSource) {
    for (const gen of fns) {
      if (!GEN_NAME_RE.test(gen.name)) continue;
      if (!RANDOM_RE.test(stripStrings(gen.body))) continue;
      // direct reach: `CATALOG = gen(` or `CATALOG.push(gen(` — the target may
      // carry an index (`puzzles[d] = generatePuzzle(...)`)
      const callRe = new RegExp('([A-Za-z_$][\\w$]*(?:\\[[^\\]]*\\])?)\\s*(?:=\\s*|\\.\\s*push\\s*\\(\\s*)' + gen.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(', 'g');
      let cm;
      while ((cm = callRe.exec(s.code))) {
        if (isCatalogName(cm[1])) generated.push({ name: cm[1], why: 'generator ' + gen.name + '() synthesizes levels with a seeded RNG into "' + cm[1] + '" (' + s.file + ')' });
      }
      // indirect reach: gen is called inside builder B, and B reaches a catalog
      const genCallRe = new RegExp('(?<![\\w$.])' + gen.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(', 'g');
      let gm;
      while ((gm = genCallRe.exec(s.code))) {
        const enclosing = fns.find(f => f.start < gm.index && f.end > gm.index);
        if (!enclosing || enclosing.name === gen.name) continue;
        const bRe = new RegExp('([A-Za-z_$][\\w$]*)\\s*(?:=\\s*|\\.\\s*push\\s*\\(\\s*)' + enclosing.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(', 'g');
        let bm;
        while ((bm = bRe.exec(s.code))) {
          if (isCatalogName(bm[1])) generated.push({ name: bm[1], why: 'builder ' + enclosing.name + '() composes randomising ' + gen.name + '() into "' + bm[1] + '" (' + s.file + ')' });
        }
      }
    }
  }

  // ---- SEED-DERIVED LEVEL CONTENT ------------------------------------------
  // A catalog whose ENTRIES are authored literals can still ship GENERATED
  // content, when each entry carries only a `seed` and the board is drawn
  // from that seed at load time.
  //   unpuzzle: `LEVELS.push({id,tier,w,h,par,seed:_id*7919+ti*131+i})`
  //             then `makePattern(L.seed,L.w,L.h,cellSize)` renders the board
  //             through `mulberry32(seed+999)`.
  // The discriminator is whether the entry carries AUTHORED BOARD CONTENT
  // (a `puzzle`/`solution`/`rows`/`grid` field) or only a seed:
  //   x-sudoku        entry has `puzzle` + `solution`  -> AUTHORED
  //   balls-vs-bricks entry has `rows`                -> AUTHORED
  //   unpuzzle        entry has only `seed`           -> GENERATED
  const seedDerived = [];
  // candidate catalogs: a literal with >=2 entries, OR an EMPTY catalog that
  // is filled by a push loop (unpuzzle: `LEVELS=[]` then `LEVELS.push({...})`)
  const seedCandidates = [];
  for (const d of decls) {
    if (d.kind !== 'literal') continue;
    if (d.elements >= 2) { seedCandidates.push({ d, body: d.body }); continue; }
    if (d.elements === 0) {
      // empty catalog: collect the pushed entry shapes
      const owner = perSource.find(x => x.s === d.owner);
      if (!owner) continue;
      const pushes = v2_pushEntries(owner.s.code, d.name);
      if (pushes.length) seedCandidates.push({ d, body: pushes.join(',') });
    }
  }
  for (const cand of seedCandidates) {
    const d = cand.d;
    const owner = perSource.find(x => x.s === d.owner);
    if (!owner) continue;
    const body = cand.body;
    if (!/\bseed\b\s*:/i.test(body)) continue;
    // does any entry carry authored board content?
    const hasBoardField = /\b(puzzle|solution|grid|rows|board|cells|tiles|pattern|layout|edges|blocks|pieces)\s*:/i.test(body);
    if (hasBoardField) continue;
    // ... and is there a function that renders the board from the seed?
    const seeded = owner.fns.filter(f =>
      RANDOM_RE.test(stripStrings(f.body)) && /\bseed\b/i.test(f.body));
    if (!seeded.length) continue;
    const used = seeded.filter(f =>
      new RegExp('(?<![\\w$.])' + f.name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\s*\\([^)]*\\bseed\\b', 'i').test(owner.s.code) ||
      new RegExp('\\(\\s*[A-Za-z_$][\\w$]*\\s*\\.\\s*seed\\b', 'i').test(owner.s.code));
    if (!used.length) continue;
    seedDerived.push({ name: d.name, file: d.file, why: 'catalog "' + d.name + '" entries carry only a seed (' + used.map(f => f.name).join('/') + '() draws the board from it) — the level CONTENT is generated, not authored (' + d.file + ')' });
  }

  // ---- DECIDE --------------------------------------------------------------
  // The MAIN catalog is the one the game actually indexes for level
  // selection (`LEVELS[idx]`, `LEVELS[currentLevel]`, ...). A generator that
  // feeds a DIFFERENT catalog (shakashaka's `generateDailyPuzzle()` feeds
  // `puzzle` while its 30-level `LEVELS` campaign is authored) does not make
  // the campaign procedural.
  const usage = {};
  for (const { s } of perSource) {
    for (const nm of catalogNamesIn(s.code)) {
      const re = new RegExp('(?<![\\w$.])' + nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\[', 'g');
      const n = (s.code.match(re) || []).length;
      usage[nm] = (usage[nm] || 0) + n;
    }
  }
  const mainName = Object.keys(usage).sort((a, b) => usage[b] - usage[a])[0];
  const genMain = generated.find(g => g.name === mainName);
  if (genMain) return { kind: 'PROCEDURAL', why: genMain.why };
  // seed-derived CONTENT: the entries are authored but the BOARD they
  // describe is drawn from a seeded RNG, so the level content is generated
  const seedMain = seedDerived.find(s => s.name === mainName);
  if (seedMain) return { kind: 'PROCEDURAL', why: seedMain.why };
  const authMain = authored.find(a => a.name === mainName);
  if (authMain) return { kind: 'STATIC', why: authMain.why };
  // no indexed main catalog: fall back to name-match, then to any evidence
  for (const g of generated) {
    if (authored.some(a => a.name === g.name)) return { kind: 'PROCEDURAL', why: g.why };
  }
  if (seedDerived.length) return { kind: 'PROCEDURAL', why: seedDerived[0].why };
  if (authored.length) return { kind: 'STATIC', why: authored[0].why };
  if (generated.length) return { kind: 'PROCEDURAL', why: generated[0].why };

  return { kind: 'UNKNOWN', why: 'no shipped catalog, no detected generator' };
}

// every catalog-shaped name declared in a source
function catalogNamesIn(src) {
  const out = new Set();
  const re = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) if (isCatalogName(m[1])) out.add(m[1]);
  const pRe = /([A-Za-z_$][\w$]*)\s*\.\s*push\s*\(/g;
  while ((m = pRe.exec(src))) if (isCatalogName(m[1])) out.add(m[1]);
  return out;
}

module.exports = { classify, liveGames, ROOT, shippedSources, findCatalogDecls, findCatalogPushes, fnBodies };

if (require.main === module) {
  const out = {};
  for (const g of liveGames()) {
    const slug = g.url.replace(/^\//, '').replace(/\/$/, '');
    let c;
    try { c = classify(slug); } catch (e) { c = { kind: 'ERROR', why: String(e.message) }; }
    out[slug] = c;
  }
  if (process.argv.includes('--procedural-only')) {
    const p = {};
    for (const [k, v] of Object.entries(out)) if (v.kind === 'PROCEDURAL') p[k] = v;
    console.log(JSON.stringify(p, null, 1));
  } else {
    console.log(JSON.stringify(out, null, 1));
  }
}
