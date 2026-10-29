#!/usr/bin/env node
/**
 * R337 — D20 shared classifier: is a game's level catalog AUTHORED
 * ("handcrafted") or GENERATED at runtime?
 *
 * SINGLE SOURCE OF TRUTH: both the detector (.audit/r337-d20-handcrafted.js)
 * and the fixer (.audit/r337-d20-fix.py) use this. The fixer used to carry a
 * HARDCODED target list, which meant it would edit a game the detector had
 * not flagged — the negative test caught exactly that (it "fixed" an
 * authored-catalog game). A fix must be driven by the detector, never by a
 * second, independent list that can drift.
 *
 * Usage:
 *   node .audit/r337-d20-classify.js            -> JSON {slug: {kind, why}}
 *   node .audit/r337-d20-classify.js --procedural-only
 */
const fs = require('fs');
const path = require('path');

// R338 UPGRADE: the v1 classifier below was BIDIRECTIONALLY distorted and is
// retained only as a fallback. It produced:
//   FALSE NEGATIVES — a game's catalog was invisible to it, so a real
//     PROCEDURAL game was reported STATIC/UNKNOWN:
//       yajilin (`var LV=`), tangram (`var LVLS=`), bus-traffic-fever
//       (`game.js:var LEVELS=`), number-maze (`data.js`), labyrinth
//       (`var LEVELS=[]` + anonymous IIFE pushes), blumgi-slime
//       (`const LEVELS = buildLevels()`), teleport-jumper
//       (`var LEVELS=(function(){ var L=[]; ... return L; })()`)
//   FALSE POSITIVES — an EMPTY catalog or a METADATA array was read as an
//       authored level catalog:
//       color-by-number, lockpick, hex-minesweeper, crossmath
// The v2 classifier (.audit/r338-d20-classify-v2.js) resolves all of those.
// It is the SINGLE SOURCE OF TRUTH now; this file is a thin delegator so the
// legacy detector (.audit/r337-d20-handcrafted.js) and fixer
// (.audit/r337-d20-fix.py) keep working against the corrected logic.
const V2 = require('./r338-d20-classify-v2.js');

const ROOT = process.env.GZ_SITE_ROOT || path.resolve(__dirname, '..');

const NAME_RE = /(generat|makePuzzle|buildLevel|createLevel|randomLevel|randomize|makeBoard|newPuzzle)/i;
const RANDOM_RE = /Math\.random\s*\(|mulberry32\s*\(|seededRandom\s*\(|seedRng\s*\(|\brng\s*\(|\brandomSeed|\bnextRand\b/;

function classifyV1(slug) {
  const dir = path.join(ROOT, slug);
  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) return { kind: 'ERROR', why: 'no index.html' };
  const html = fs.readFileSync(idx, 'utf8');

  // (1) a shipped data file IS authored content
  for (const f of ['levels.json', 'levels_inline.json', 'levels_compact.json', 'levels_inline.txt', 'puzzles.json']) {
    if (fs.existsSync(path.join(dir, f))) return { kind: 'STATIC', why: 'ships ' + f };
  }
  // (2) an inline literal catalog (array OR object keyed by level id) is authored
  if (/(?:const|let|var)\s+(?:LEVELS|PUZZLES|GAME_DATA|LEVEL)\w*\s*=\s*[\[{]/.test(html))
    return { kind: 'STATIC', why: 'inline literal catalog' };

  // (3) a generator-named function whose result is assigned to a puzzle/level
  //     variable AND whose own body uses a randomness source.
  const fnRe = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = fnRe.exec(html))) {
    const fn = m[1];
    if (!NAME_RE.test(fn)) continue;
    const esc = fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const callRe = new RegExp('([A-Za-z_$][\\w$.\\[\\]]{0,40})\\s*(?:=|\\.push\\()\\s*' + esc + '\\s*\\(', 'g');
    let cm;
    while ((cm = callRe.exec(html))) {
      const target = cm[1];
      if (!/(puzzle|level)/i.test(target)) continue;
      // the generator must SYNTHESIZE with randomness — a builder that pushes
      // AUTHORED literals (blumgi-slime's buildLevels) is handcrafted
      const bodyStart = html.indexOf('{', m.index);
      let depth = 0, bodyEnd = -1;
      for (let j = bodyStart; j < html.length && j < bodyStart + 12000; j++) {
        if (html[j] === '{') depth++;
        else if (html[j] === '}') { depth--; if (depth === 0) { bodyEnd = j; break; } }
      }
      const body = bodyEnd > 0 ? html.slice(bodyStart, bodyEnd) : '';
      if (!RANDOM_RE.test(body)) continue;
      return { kind: 'PROCEDURAL', why: 'generator fn ' + fn + '() synthesizes levels with a seeded RNG (assigned to "' + target.trim() + '")' };
    }
  }
  return { kind: 'UNKNOWN', why: 'no shipped catalog, no detected generator' };
}

// The v2 classifier is authoritative. It is the only one that can resolve
// the alias / external-file / empty-plus-builder / direct-IIFE catalog shapes,
// and it is the only one that recognises a SEED-DERIVED catalog (entries that
// carry only a `seed`, with the board drawn from it at load time).
// v1 is kept ONLY as a fallback for the case where v2 throws, so a crash in
// the newer logic can never silently turn into "no defects found".
function classify(slug) {
  try {
    const v2 = V2.classify(slug);
    if (v2 && v2.kind && v2.kind !== 'ERROR') return v2;
    return v2;
  } catch (e) {
    return { kind: 'UNKNOWN', why: 'v2 classifier failed (' + e.message + '); v1 fallback: ' + classifyV1(slug).why };
  }
}

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  return new Function(src + '; return GAMES;')().filter(g => g.status === 'live');
}

module.exports = { classify, liveGames, ROOT };

if (require.main === module) {
  const out = {};
  for (const g of liveGames()) {
    const slug = g.url.replace(/^\//, '').replace(/\/$/, '');
    out[slug] = classify(slug);
  }
  if (process.argv.includes('--procedural-only')) {
    const p = {};
    for (const [k, v] of Object.entries(out)) if (v.kind === 'PROCEDURAL') p[k] = v;
    console.log(JSON.stringify(p, null, 1));
  } else {
    console.log(JSON.stringify(out, null, 1));
  }
}
