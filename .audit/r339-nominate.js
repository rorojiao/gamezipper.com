#!/usr/bin/env node
/**
 * R339 nomination detector (v2 — fixed).
 *
 * Nominates candidate mechanic-duplicate CLUSTERS over the live catalog.
 * A nomination is NOT a verdict: per protocol, name/tags/fingerprint similarity
 * can only NOMINATE.  Every nominated pair must still be adjudicated by reading
 * the two engines' rules + implementation.
 *
 * SIGNALS
 *   S1  win-predicate shingle signature  (5-gram shingles of the normalized win body)
 *   S2  action-verb set                 (verbs extracted from interaction handlers)
 *   S3  level-record schema             (sorted key-set of the shipped level objects)
 *
 * v1 BUGS (fixed here) — both made the detector measure the CORPUS, not the pairs:
 *   (a) containment() was handed a STRING but iterated it as if it were an array,
 *       so it counted characters -> every pair scored winC=1 (17,096 nominations).
 *       Fixed: the win body is shingled into 5-gram tokens; containment compares
 *       token SETS.
 *   (b) the level literal was extracted from the COMMENT-STRIPPED source, and the
 *       stripper replaces string literals with "" — which erased every object KEY
 *       (keys came back as [""]).  Fixed: the level literal is extracted from the
 *       RAW source (comments stripped only), and the key set is computed on the
 *       real parsed object.
 *
 * Guards carried over from prior sweeps:
 *   - the win-function name list must not contain a generic name (check/init/
 *     update/render/reset): the site-wide ad-blocker sentinel defines a function
 *     literally named `check` that is byte-identical in EVERY game page.
 *   - extracted bodies matching the site-chrome deny-list are dropped.
 *   - a detector whose output is suspiciously round / uniformly high is measuring
 *     the corpus; the calibration controls at the end are the contract.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const WIN_NAMES = [
  'checkWin', 'isWin', 'checkSolution', 'checkCompletion', 'checkAnswer',
  'isSolved', 'checkSolved', 'winCondition', 'isComplete', 'checkComplete',
  'hasWon', 'checkIfWon', 'checkWinCondition', 'evaluateWin', 'checkGoal',
  'isLevelWon', 'checkLevelWon', 'levelWon', 'checkAll', 'isFinished',
];

const DENY = /data-gz-checked|gz-ad-below|monetag|adsbygoogle|gz-error-toast|gz-analytics|game-footer|adsterra|collapseAutoAds|sendBeacon|__gz/i;

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name, cat: g.cat }));
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ')
          .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function extractBody(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(', 'g');
  let m;
  while ((m = re.exec(src))) {
    const open = src.indexOf('{', m.index);
    if (open < 0) continue;
    let depth = 0, i = open, inStr = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    if (depth !== 0) continue;
    return src.slice(open, i);
  }
  return null;
}

function shingles(text, k = 5) {
  const toks = text.split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + k <= toks.length; i++) out.add(toks.slice(i, i + k).join(' '));
  if (!out.size && toks.length) out.add(toks.join(' '));
  return out;
}

function winSignature(html) {
  const src = stripComments(html);
  for (const n of WIN_NAMES) {
    const b = extractBody(src, n);
    if (!b) continue;
    if (DENY.test(b)) continue;
    // normalize: identifiers -> ID, numbers -> N, strings -> ''
    const stripped = b.replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
                      .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
                      .replace(/`(?:[^`\\]|\\.)*`/g, '``');
    const norm = normalize(stripped)
      .replace(/[A-Za-z_$][\w$]*/g, 'ID')
      .replace(/\b\d+(\.\d+)?\b/g, 'N');
    const sh = shingles(norm);
    if (sh.size < 3) continue;
    return { name: n, len: norm.length, shingles: sh };
  }
  return null;
}

const ACTION_VERBS = [
  'drag', 'drop', 'tap', 'click', 'swipe', 'slide', 'rotate', 'flip', 'match',
  'swap', 'place', 'fill', 'paint', 'move', 'select', 'choose', 'type',
  'shoot', 'aim', 'pull', 'push', 'throw', 'catch', 'stack', 'merge', 'sort',
  'group', 'light', 'connect', 'link', 'draw', 'erase', 'cut', 'hold',
  'charge', 'spin', 'guide', 'reach', 'collect', 'pop', 'blast', 'jump',
  'cross', 'toggle', 'pin', 'unlock', 'thread', 'lay', 'roll', 'bounce',
  'tilt', 'squeeze', 'trace', 'shine', 'dim', 'hide', 'reveal',
];

/**
 * v1 BUG: the verb list was matched with a word boundary against a 90-char
 * window after an interaction token.  That window never contained the verb as a
 * STANDALONE word — the game calls `slideFrom(...)`, `doSlide(...)`,
 * `handleDrag(...)`, and `\bslide\b` does not match `slideFrom` (the "F" is a
 * word char).  Result: every game scored verbJ=0, i.e. the signal was
 * silently absent for all 466 games while still looking like a real number.
 *
 * v2: the verb is matched as a SUBSTRING of an identifier or as a standalone
 * word, and the window is the whole handler body (not a fixed 90 chars).
 */
function actionVerbs(html) {
  const src = stripComments(html);
  const s = new Set();
  const lower = src.toLowerCase();
  // 1) verb appears inside a called identifier  (slideFrom, doDrag, handleTap)
  const idents = new Set();
  const idRe = /([A-Za-z_$][\w$]{2,})\s*\(/g;
  let m;
  while ((m = idRe.exec(lower))) idents.add(m[1]);
  for (const id of idents) {
    for (const v of ACTION_VERBS) {
      if (id.includes(v)) { s.add(v); break; }
    }
  }
  // 2) verb appears as a standalone word anywhere in the game code
  for (const v of ACTION_VERBS) {
    const re = new RegExp('(?<![A-Za-z])' + v + '(?![A-Za-z])');
    if (re.test(lower)) s.add(v);
  }
  return [...s].sort();
}

/** Extract the shipped level catalog from the RAW source and describe its schema. */
function levelSchema(rawHtml) {
  const src = rawHtml;
  const m = src.match(/(?:const|var|let)\s+LEVELS\s*=\s*(?:\/\*[^/]*\*\/\s*)?[\[{]/);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0, i = start, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  const lit = src.slice(start, i);
  let val;
  try { val = new Function('return (' + lit + ')')(); } catch (e) { return null; }
  const arr = Array.isArray(val) ? val : Object.values(val || {});
  const objs = arr.filter(x => x && typeof x === 'object' && !Array.isArray(x));
  if (!objs.length) return null;
  const keyCount = {};
  for (const o of objs) for (const k of Object.keys(o)) keyCount[k] = (keyCount[k] || 0) + 1;
  const n = objs.length;
  const keys = Object.keys(keyCount).filter(k => keyCount[k] / n >= 0.6).sort();
  return { n, keys, keyCount };
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function containment(a, b) {
  if (!a.size || !b.size) return 0;
  let c = 0;
  for (const x of a) if (b.has(x)) c++;
  return c / a.size;
}

function main() {
  const games = liveGames();
  const prof = {};
  for (const g of games) {
    const p = path.join(ROOT, g.slug, 'index.html');
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    const win = winSignature(raw);
    const verbs = actionVerbs(raw);
    const ls = levelSchema(raw);
    prof[g.slug] = {
      name: g.name, cat: g.cat,
      win: win ? { name: win.name, len: win.len, shingles: win.shingles } : null,
      verbs: new Set(verbs),
      ls,
    };
  }

  const withWin = Object.entries(prof).filter(([, v]) => v.win);
  console.log(`LIVE: ${games.length}   profiled: ${Object.keys(prof).length}   with win-predicate: ${withWin.length}`);
  console.log(`with level schema: ${Object.values(prof).filter(v => v.ls).length}`);

  // report the level-schema sanity (v1 returned keys:[""] for everything)
  const sample = ['sukima', 'twiddle', 'inertia', 'slide-cat', 'black', 'blue'];
  console.log('\n=== LEVEL SCHEMA SANITY ===');
  for (const s of sample) {
    if (!prof[s]) { console.log(`  ${s}: not profiled`); continue; }
    console.log(`  ${s}: n=${prof[s].ls ? prof[s].ls.n : 'none'} keys=${prof[s].ls ? JSON.stringify(prof[s].ls.keys) : 'none'}`);
  }

  const pairs = [];
  const slugs = Object.keys(prof);
  for (let a = 0; a < slugs.length; a++) {
    for (let b = a + 1; b < slugs.length; b++) {
      const A = prof[slugs[a]], B = prof[slugs[b]];
      const wc = (A.win && B.win) ? containment(A.win.shingles, B.win.shingles) : 0;
      const wcR = (A.win && B.win) ? containment(B.win.shingles, A.win.shingles) : 0;
      const vj = jaccard(A.verbs, B.verbs);
      const sc = (A.ls && B.ls) ? jaccard(new Set(A.ls.keys), new Set(B.ls.keys)) : 0;
      const scC = (A.ls && B.ls) ? containment(new Set(A.ls.keys), new Set(B.ls.keys)) : 0;
      const strong = (wc >= 0.9 && A.win.len > 60) || (scC >= 0.95 && A.ls.keys.length >= 3 && wc >= 0.5);
      if (!strong) continue;
      pairs.push({
        a: slugs[a], b: slugs[b],
        winC: +Math.max(wc, wcR).toFixed(3), verbJ: +vj.toFixed(3),
        schemaC: +scC.toFixed(3), schemaJ: +sc.toFixed(3),
        winLen: [A.win ? A.win.len : 0, B.win ? B.win.len : 0],
      });
    }
  }
  pairs.sort((x, y) => (y.winC * 2 + y.schemaC) - (x.winC * 2 + x.schemaC));
  console.log(`\n=== NOMINATIONS (strong-signal pairs): ${pairs.length} ===`);
  for (const p of pairs.slice(0, 60)) {
    console.log(`  ${p.a} <-> ${p.b}  winC=${p.winC} verbJ=${p.verbJ} schemaC=${p.schemaC} winLen=${p.winLen.join('/')}`);
  }

  console.log('\n=== CALIBRATION CONTROLS ===');
  const ctrl = (x, y) => { const p = pairs.find(q => (q.a === x && q.b === y) || (q.a === y && q.b === x)); return p ? `NOMINATED winC=${p.winC} schemaC=${p.schemaC} verbJ=${p.verbJ}` : 'not nominated'; };
  console.log(`  POSITIVE renzoku    <-> lights-out : ${ctrl('renzoku', 'lights-out')}   (known DISTINCT rules, same data shape)`);
  console.log(`  NEGATIVE hearts     <-> spades      : ${ctrl('hearts', 'spades')}   (different rules)`);
  console.log(`  NEGATIVE black      <-> blue        : ${ctrl('black', 'blue')}   (different level sets)`);
  console.log(`  NEGATIVE sukima     <-> triplace    : ${ctrl('sukima', 'triplace')}   (known DISTINCT)`);

  // A detector that returns a suspiciously round or uniformly-high number is
  // measuring the corpus.  Report the distribution.
  if (pairs.length) {
    const w = pairs.map(p => p.winC);
    const ones = w.filter(x => x === 1).length;
    console.log(`\n=== DISTRIBUTION (corpus check) ===`);
    console.log(`  nominations=${pairs.length}  winC==1.0 exactly: ${ones}  winC>=0.99: ${w.filter(x => x >= 0.99).length}`);
    console.log(`  distinct winC values: ${[...new Set(w)].sort((x, y) => x - y).join(', ')}`);
  }

  const out = {};
  for (const [k, v] of Object.entries(prof)) out[k] = {
    name: v.name, cat: v.cat,
    win: v.win ? { name: v.win.name, len: v.win.len, shingles: [...v.win.shingles] } : null,
    verbs: [...v.verbs], ls: v.ls,
  };
  fs.writeFileSync(path.join(ROOT, '.audit/r339-nominations.json'), JSON.stringify(pairs, null, 1));
  fs.writeFileSync(path.join(ROOT, '.audit/r339-profile.json'), JSON.stringify(out, null, 1));
}

main();
