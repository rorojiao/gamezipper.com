#!/usr/bin/env node
/**
 * R338 — D21: "advertised vs shipped" on the axes no gate covers.
 *
 * R337's D18 covers level COUNT (daily pool folded into the campaign count).
 * R337's D20 covers PROVENANCE ("handcrafted" vs generated at runtime).
 * Neither looks at the OTHER axes a page advertises:
 *
 *   AXIS 1 — TIER SET: the page names N difficulty tiers (or a tier ladder
 *            like "3x3 ... 7x7"). The shipped catalog must contain them.
 *   AXIS 2 — SIZE / GRID SET: the page claims a range of grid sizes or
 *            dimensions ("6x6 ... 16x16", "from 8x8 to 20x20"). The shipped
 *            catalog must span what is claimed.
 *   AXIS 3 — THEME / MODE COUNT: the page claims N themes, categories, scenes
 *            or modes. The shipped catalog must contain N.
 *
 * Unlike D17/D18/D20, this is NOT a static regex count: the level catalog is
 * read by EXECUTING the game's own module body in a vm sandbox (the pattern
 * D17 already established), so a runtime-populated LEVELS is measured
 * correctly. Where the catalog cannot be executed we report UNKNOWN and never
 * guess (D20's rule).
 *
 * CALIBRATION (mandatory, Pitfall #62):
 *   - POSITIVE: a synthetic page whose copy claims 5 tiers while the catalog
 *     has 3 must be FLAGGED.
 *   - NEGATIVE: a synthetic page whose copy matches the catalog must NOT be.
 *   - The real pages must not produce an implausibly large flag count; a
 *     detector that fires on everything is worse than no detector.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name, desc: g.desc || '' }));
}

// ---------- copy extraction ----------
function copyOf(html) {
  // Only the parts a search/AI engine reads, plus the visible body prose.
  const parts = [];
  const metaDesc = html.match(/<meta name="description" content="([^"]*)"/);
  if (metaDesc) parts.push(metaDesc[1]);
  for (const m of html.matchAll(/<meta property="og:description" content="([^"]*)"/g)) parts.push(m[1]);
  for (const m of html.matchAll(/<meta name="twitter:description" content="([^"]*)"/g)) parts.push(m[1]);
  for (const m of html.matchAll(/"acceptedAnswer":\{"@type":"Answer","text":"([^"]{0,600})"/g)) parts.push(m[1]);
  for (const m of html.matchAll(/"description"\s*:\s*"([^"]{0,600})"/g)) parts.push(m[1]);
  // visible prose (strip tags)
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  parts.push(text);
  return parts.join(' || ');
}

// ---------- catalog extraction ----------
// Load the game's own module body in a vm so a runtime-populated LEVELS is
// measured exactly as the player sees it.
// Extract the balanced-bracket literal assigned to a catalog global.
// Naive `/const LEVELS = (\[.*?\]);/s` is BROKEN: it stops at the first `];`
// INSIDE the array (e.g. rooms:[[1,2],[3,4]]) — Pitfall #41. This walks the
// brackets with string-literal awareness instead.
function extractLiteral(code, name) {
  const re = new RegExp(String.raw`(?:const|let|var)\s+${name}\s*=\s*`, 'g');
  const m = re.exec(code);
  if (!m) return null;
  let i = m.index + m[0].length;
  const open = code[i];
  if (open !== '[' && open !== '{') return null;
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = null;
  for (let j = i; j < code.length && j < i + 4000000; j++) {
    const c = code[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '/' && code[j + 1] === '/') { const nl = code.indexOf('\n', j); j = nl < 0 ? code.length : nl; continue; }
    if (c === '/' && code[j + 1] === '*') { const e = code.indexOf('*/', j); j = e < 0 ? code.length : e + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return code.slice(i, j + 1); }
  }
  return null;
}

// A level catalog is an array whose elements are OBJECTS carrying at least
// one dimension-ish key. Arrays of strings (a grid), arrays of numbers (a
// solution) and arrays of arrays are NOT catalogs.
function looksLikeLevelArray(val) {
  if (!Array.isArray(val) || val.length < 3) return false;
  const objs = val.filter(v => v && typeof v === 'object' && !Array.isArray(v));
  if (objs.length < Math.max(3, val.length * 0.6)) return false;
  const DIMKEYS = ['rows', 'cols', 'row', 'col', 'width', 'height', 'size', 'grid', 'board',
    'cells', 'level', 'tier', 'difficulty', 'r', 'c', 'n', 'w', 'h'];
  let hits = 0;
  const sample = objs.slice(0, 8);
  for (const o of sample) {
    for (const k of Object.keys(o)) if (DIMKEYS.includes(k)) { hits++; break; }
  }
  return hits >= Math.max(3, sample.length * 0.5);
}

// Enumerate every `const|let|var <name> = [` / `= {` literal in the page
// whose identifier LOOKS level-ish, and return the balanced-bracket source
// text of each. Scanning the whole page (instead of a fixed name list) is
// what removes the 238-game blind spot: star-loom's catalog is `tierLevels`,
// circuit-logic's is `levelData`, and no fixed name list can know that.
const LEVELISH_NAME = /(level|puzzle|board|grid|catalog|stages|tier|wave|round|cell)/i;
function candidateLevelLiterals(code) {
  const out = [];
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?=[[{])/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (!LEVELISH_NAME.test(m[1])) continue;
    const lit = extractLiteral(code, m[1]);
    if (lit) out.push(lit);
  }
  return out;
}

function loadCatalog(slug) {
  const dir = path.join(ROOT, slug);
  const idxPath = path.join(dir, 'index.html');
  let html = '';
  try { html = fs.readFileSync(idxPath, 'utf8'); } catch (e) { return { status: 'NO_INDEX' }; }

  // NOTE: ld+json / json script blocks are DATA, not JS. Executing them
  // throws SyntaxError and made 364/466 games report UNKNOWN — a detector
  // that cannot see 78% of the catalog is a blind spot, not a gate.
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/\bsrc\s*=/.test(m[1]))
    .filter(m => !/type\s*=\s*["']?(application\/ld\+json|application\/json|application\/speculationrules)/i.test(m[1]))
    .map(m => m[2]);
  const code = scripts.join('\n;\n');
  if (!code.trim()) return { status: 'NO_LEVELS' };

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
    Math, JSON, Date, Object, Array, String, Number, Boolean, Set, Map, WeakMap, WeakSet, Symbol, RegExp, Error, Proxy, Reflect,
    isNaN, isFinite, parseInt, parseFloat, Infinity, NaN, undefined, BigInt,
    Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array,
    ArrayBuffer, Uint8ClampedArray, DataView, URL, URLSearchParams, TextEncoder, TextDecoder,
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  const mkEl = () => ({
    style: {}, dataset: {}, children: [], childNodes: [], classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    appendChild() {}, removeChild() {}, replaceChildren() {}, remove() {}, setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
    offsetWidth: 0, offsetHeight: 0, clientWidth: 0, clientHeight: 0, innerHTML: '', innerText: '', textContent: '', tagName: 'DIV',
    focus() {}, blur() {}, click() {}, dispatchEvent() { return true; }, className: '', id: '', value: '',
  });
  const doc = {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: mkEl, createElementNS: mkEl, createTextNode: () => mkEl(),
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    body: mkEl(), head: mkEl(), documentElement: mkEl(),
    readyState: 'complete', hidden: false, visibilityState: 'visible',
  };
  sandbox.document = doc;
  sandbox.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 };
  sandbox.sessionStorage = sandbox.localStorage;
  sandbox.navigator = { userAgent: 'node', vibrate() {}, language: 'en-US', languages: ['en-US'], clipboard: { writeText() {} } };
  sandbox.location = { href: 'https://gamezipper.com/', pathname: '/', hostname: 'gamezipper.com', protocol: 'https:', search: '', hash: '' };
  sandbox.history = { pushState() {}, replaceState() {}, back() {}, forward() {} };
  sandbox.innerWidth = 1280; sandbox.innerHeight = 800; sandbox.devicePixelRatio = 1; sandbox.scrollX = 0; sandbox.scrollY = 0;
  sandbox.scrollTo = () => {}; sandbox.alert = () => {}; sandbox.confirm = () => true; sandbox.prompt = () => '';
  sandbox.getComputedStyle = () => ({ getPropertyValue: () => '' });
  sandbox.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  sandbox.requestAnimationFrame = () => 0;
  sandbox.AudioContext = function () {
    const g = { value: 1, connect() {}, disconnect() {} };
    return { createOscillator: () => ({ start() {}, stop() {}, connect() {}, frequency: g, type: '' }), createGain: () => g, createBuffer: () => ({ getChannelData: () => new Float32Array(1) }), destination: g, resume() {}, close() {}, state: 'suspended', sampleRate: 44100, currentTime: 0 };
  };
  sandbox.webkitAudioContext = sandbox.AudioContext;
  sandbox.Image = function () { return { addEventListener() {}, removeEventListener() {}, src: '', width: 0, height: 0, complete: true }; };
  sandbox.HTMLCanvasElement = function () {};
  sandbox.HTMLElement = function () {};
  sandbox.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 8000 });
  } catch (e) {
    // full-page execution failed — fall through to the literal extractor
    sandbox.__vmError = String(e).slice(0, 160);
  }

  // 1. runtime-populated catalog: the global exists after execution
  for (const name of ['LEVELS', 'levels', 'PUZZLES', 'LEVEL', 'LEVEL_DATA', 'PUZZLE_LIST']) {
    const L = sandbox[name];
    if (Array.isArray(L) && L.length) return { status: 'OK', levels: L, source: 'inline-vm' };
  }

  // 2. static catalog: evaluate the balanced-bracket literal on its own.
  //    This is both faster and far more robust than running the whole page.
  //    Scan EVERY level-ish global, not a fixed name list: star-loom calls
  //    its catalog `tierLevels`, and a name list that misses the real name
  //    turns a readable game into a blind spot.
  for (const lit of candidateLevelLiterals(code)) {
    try {
      const val = vm.runInContext('(' + lit + ')', sandbox, { timeout: 8000 });
      if (Array.isArray(val) && val.length && looksLikeLevelArray(val)) {
        return { status: 'OK', levels: val, source: 'inline-literal' };
      }
    } catch (e) { /* try the next candidate */ }
  }
  for (const name of ['LEVELS', 'PUZZLES', 'LEVEL_DATA', 'PUZZLE_LIST']) {
    const lit = extractLiteral(code, name);
    if (!lit) continue;
    try {
      const val = vm.runInContext('(' + lit + ')', sandbox, { timeout: 8000 });
      if (Array.isArray(val) && val.length) return { status: 'OK', levels: val, source: 'inline-literal' };
    } catch (e) { /* try the next name */ }
  }

  // 3. fallback: a sibling levels.json the page actually FETCHES.
  //    Only trust it when the page references it — an orphan file is not the
  //    shipped catalog (kurodoko/levels.json holds 3 levels; the engine plays
  //    30 inline ones).
  if (/\blevels\.json\b/.test(html)) {
    const ljPath = path.join(dir, 'levels.json');
    if (fs.existsSync(ljPath)) {
      try {
        const j = JSON.parse(fs.readFileSync(ljPath, 'utf8'));
        const arr = Array.isArray(j) ? j : (Array.isArray(j.levels) ? j.levels : null);
        if (arr && arr.length) return { status: 'OK', levels: arr, source: 'levels.json' };
      } catch (e) { /* not parseable */ }
    }
  }
  if (sandbox.__vmError) return { status: 'VM_ERROR', error: sandbox.__vmError };
  return { status: 'NO_LEVELS' };
}

// ---------- axis extraction ----------
const TIER_WORDS = ['tutorial', 'beginner', 'easy', 'simple', 'basic', 'medium', 'normal', 'intermediate', 'hard', 'difficult', 'advanced', 'expert', 'master', 'legendary', 'extreme'];
const NUM = String.raw`(\d{1,3})\s*[x×]\s*(\d{1,3})`;

function claimedTiers(copy) {
  // A tier is claimed when a TIER WORD appears adjacent to a count or list marker.
  const out = new Set();
  const re = new RegExp(String.raw`\b(${TIER_WORDS.join('|')})\b`, 'gi');
  let m;
  while ((m = re.exec(copy))) out.add(m[1].toLowerCase());
  return out;
}
function claimedTierCount(copy) {
  // "across 5 difficulty tiers", "5 tiers", "N difficulty tiers"
  const pats = [
    new RegExp(String.raw`\b(\d{1,2})\s+(?:different\s+|unique\s+|difficulty\s+)?(?:difficulty\s+)?tiers\b`, 'gi'),
    new RegExp(String.raw`\btiers?\s*[:=]\s*(\d{1,2})\b`, 'gi'),
  ];
  const out = new Set();
  for (const p of pats) { let m; while ((m = p.exec(copy))) out.add(parseInt(m[1], 10)); }
  return [...out];
}
// A grid-size claim only counts when it is attached to a LEVEL/DIFFICULTY
// statement. "Snakes must not form a 2x2 block" and "3x1 trays" are rules, not
// the level-size ladder. Require a tier/size phrase in the same sentence.
const SIZE_CLAIM_CONTEXT = /(?:tier|level|size|grid|board|from|starting|ranging)\b[^.]{0,120}?\d{1,2}\s*[x×]\s*\d{1,2}|\d{1,2}\s*[x×]\s*\d{1,2}[^.]{0,60}?\b(?:tier|level|beginner|easy|medium|hard|expert)\b/i;

function claimedGridSizes(copy) {
  const out = new Set();
  // work sentence by sentence so the context test is local
  for (const sent of copy.split(/(?<=[.!?])\s+|\s\|\|\s/)) {
    if (!SIZE_CLAIM_CONTEXT.test(sent)) continue;
    for (const m of sent.matchAll(new RegExp(NUM, 'g'))) out.add(`${m[1]}x${m[2]}`);
  }
  return out;
}
function claimedThemeCount(copy) {
  const out = new Set();
  const pats = [
    new RegExp(String.raw`\b(\d{1,2})\s+(?:unique\s+|different\s+|themed\s+|game\s+)?themes\b`, 'gi'),
    new RegExp(String.raw`\b(\d{1,2})\s+(?:unique\s+|different\s+)?(?:scenes?|categories|categories)\b`, 'gi'),
  ];
  for (const p of pats) { let m; while ((m = p.exec(copy))) out.add(parseInt(m[1], 10)); }
  return [...out];
}

// shipped facts
// NOTE: a `tier` field may hold an INDEX (1..5) rather than a NAME. The
// `level` field is a level NUMBER, never a tier — including it made nuritwin
// report 31 "tiers" (levels 0..30) against a 5-tier claim. Only fields that
// actually partition the catalog into difficulty bands qualify.
function tierValues(levels) {
  const set = new Set();
  for (const l of levels) {
    if (!l || typeof l !== 'object') continue;
    for (const k of ['tier', 'difficulty', 'diff', 'rank', 'band', 'group', 'category', 'theme']) {
      const v = l[k];
      if (typeof v === 'string' && v.trim()) set.add(v.trim().toLowerCase());
      else if (typeof v === 'number' && k !== 'level') set.add(String(v));
    }
  }
  return set;
}
function gridSizes(levels) {
  const set = new Set();
  const grab = (w, h) => { if (typeof w === 'number' && typeof h === 'number') set.add(`${w}x${h}`); };
  for (const l of levels) {
    if (!l || typeof l !== 'object') continue;
    grab(l.rows, l.cols); grab(l.height, l.width); grab(l.h, l.w); grab(l.size, l.size);
    if (typeof l.size === 'number' && l.size > 1) set.add(`${l.size}x${l.size}`);
    if (typeof l.grid === 'string') {
      const lines = l.grid.split(/[;\n]/).filter(Boolean);
      if (lines.length > 1) {
        const cols = Math.max(...lines.map(x => x.length));
        set.add(`${cols}x${lines.length}`);
      } else {
        const m = l.grid.match(new RegExp(NUM));
        if (m) set.add(`${m[1]}x${m[2]}`);
      }
    }
    if (Array.isArray(l.grid) && l.grid.length) {
      const w = Math.max(...l.grid.map(r => (Array.isArray(r) ? r.length : 0)));
      set.add(`${w}x${l.grid.length}`);
    }
  }
  return set;
}
function themeValues(levels) {
  const set = new Set();
  for (const l of levels) {
    if (!l || typeof l !== 'object') continue;
    for (const k of ['theme', 'category', 'scene', 'mode', 'set', 'pack', 'chapter', 'world', 'stage']) {
      const v = l[k];
      if (typeof v === 'string' && v.trim()) set.add(v.trim().toLowerCase());
      else if (Array.isArray(v) && typeof v[0] === 'string') set.add(v[0].trim().toLowerCase());
    }
  }
  return set;
}

function main() {
  const games = liveGames();
  const findings = [];
  const unknown = [];
  let checked = 0;

  for (const g of games) {
    const htmlPath = path.join(ROOT, g.slug, 'index.html');
    if (!fs.existsSync(htmlPath)) { unknown.push({ slug: g.slug, why: 'NO_INDEX' }); continue; }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const copy = copyOf(html);
    const cat = loadCatalog(g.slug);
    if (cat.status !== 'OK') { unknown.push({ slug: g.slug, why: cat.status }); continue; }
    checked++;

    const lv = cat.levels;
    const shippedTiers = tierValues(lv);
    const shippedSizes = gridSizes(lv);
    const shippedThemes = themeValues(lv);

    // AXIS 1: tier count
    const claimedTierNums = claimedTierCount(copy);
    for (const n of claimedTierNums) {
      if (n < 2 || n > 12) continue;
      if (shippedTiers.size === 0) continue; // unknown, do not guess
      if (shippedTiers.size !== n) {
        findings.push({ slug: g.slug, axis: 'TIER_COUNT', claimed: n, shipped: shippedTiers.size,
          shippedTiers: [...shippedTiers].slice(0, 12) });
      }
    }
    // AXIS 1b: named tier set.
    // A bare keyword scan is a false-positive machine: "easy to play", "master
    // your skills" and "simple rules" are ordinary copy, and EVERY game page
    // contains them. A tier NAME only counts when it appears inside an
    // explicit ladder — i.e. the page enumerates the tiers, e.g.
    //   "Beginner (5x5), Easy (6x6), Medium (7x7), Hard (8x8), Expert (9x9)"
    //   "5 tiers: Tutorial, Easy, Medium, Hard, Expert"
    // so require 3+ tier words inside ONE sentence together with a tier
    // marker, and require the shipped catalog to actually carry tier data.
    const tierLadder = [];
    for (const sent of copy.split(/(?<=[.!?])\s+|\s\|\|\s/)) {
      const words = [...sent.matchAll(new RegExp(String.raw`\b(${TIER_WORDS.join('|')})\b`, 'gi'))]
        .map(m => m[1].toLowerCase());
      const uniq = [...new Set(words)];
      if (uniq.length < 3) continue;
      if (!/\btiers?\b|\bfrom\b|\bto\b|\bbeginner\b|\bexpert\b/i.test(sent)) continue;
      tierLadder.push({ sentence: sent.trim().slice(0, 220), words: uniq });
    }
    if (tierLadder.length && shippedTiers.size > 0) {
      const ladderWords = [...new Set(tierLadder.flatMap(t => t.words))];
      const shippedNorm = [...shippedTiers].map(s => s.toLowerCase());
      // the shipped catalog must carry NAMED tiers for this axis to apply
      const shippedHasNames = shippedNorm.some(s => TIER_WORDS.includes(s));
      if (shippedHasNames) {
        const missing = ladderWords.filter(w => !shippedNorm.some(s => s.includes(w) || w.includes(s)));
        if (missing.length >= 2) {
          findings.push({ slug: g.slug, axis: 'TIER_NAMES', claimedNamed: ladderWords,
            missingFromShipped: missing, shippedTiers: [...shippedTiers].slice(0, 12),
            ladder: tierLadder[0].sentence });
        }
      }
    }
    // AXIS 2: grid-size range
    if (shippedSizes.size > 0) {
      const claimedSizes = claimedGridSizes(copy);
      for (const cs of claimedSizes) {
        const [cw, ch] = cs.split('x').map(Number);
        if (cw < 3 || cw > 60) continue;
        const shippedNums = [...shippedSizes].map(s => s.split('x').map(Number));
        const maxS = Math.max(...shippedNums.map(x => x[0]));
        const minS = Math.min(...shippedNums.map(x => x[0]));
        // the claim is a specific grid dimension; the catalog must contain it
        if (cw > maxS || cw < minS) {
          findings.push({ slug: g.slug, axis: 'GRID_SIZE', claimedSize: cs,
            shippedRange: `${minS}..${maxS}`, shippedSizes: [...shippedSizes].slice(0, 14) });
        }
      }
    }
    // AXIS 3: theme count
    const claimedThemes = claimedThemeCount(copy);
    for (const n of claimedThemes) {
      if (n < 2 || n > 20) continue;
      if (shippedThemes.size === 0) continue;
      if (shippedThemes.size !== n) {
        findings.push({ slug: g.slug, axis: 'THEME_COUNT', claimed: n, shipped: shippedThemes.size,
          shippedThemes: [...shippedThemes].slice(0, 14) });
      }
    }
  }

  console.log(`checked=${checked} unknown=${unknown.length} findings=${findings.length}`);
  const byAxis = {};
  for (const f of findings) byAxis[f.axis] = (byAxis[f.axis] || 0) + 1;
  console.log('by axis:', JSON.stringify(byAxis));
  console.log('unknown reasons:', JSON.stringify(unknown.reduce((a, u) => { a[u.why] = (a[u.why] || 0) + 1; return a; }, {})));
  console.log('\n=== FINDINGS ===');
  for (const f of findings) console.log(JSON.stringify(f));
  fs.writeFileSync(path.join(ROOT, '.audit/r338-d21-advertised-axes.json'),
    JSON.stringify({ checked, unknown, findings }, null, 1));
}

main();
