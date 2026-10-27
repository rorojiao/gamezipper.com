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

const ROOT = process.env.GZ_SITE_ROOT || path.resolve(__dirname, '..');

const NAME_RE = /(generat|makePuzzle|buildLevel|createLevel|randomLevel|randomize|makeBoard|newPuzzle)/i;
const RANDOM_RE = /Math\.random\s*\(|mulberry32\s*\(|seededRandom\s*\(|seedRng\s*\(|\brng\s*\(|\brandomSeed|\bnextRand\b/;

function classify(slug) {
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
