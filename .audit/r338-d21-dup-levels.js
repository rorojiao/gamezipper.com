#!/usr/bin/env node
// R338 / D21 — duplicate-level identity inside ONE shipped catalog.
//
// CLASS: "a catalog that ships the same level twice" (Pitfall #73). The player
// meets the same puzzle twice; the advertised difficulty curve is fictional.
//
// IDENTITY RULE — a DENYLIST of cosmetic fields, never a whitelist.
//   A whitelist drops variant fields (grid/cells/clues/solution/blocks/...) and
//   false-positives on most of the catalog. `tier` IS excluded from the
//   identity on purpose: the same board under two tier labels is still the same
//   puzzle the player meets twice. `par` is excluded for the same reason (a
//   difficulty label, not a rule).
//
// THE SPEC/FULL DISCRIMINATOR (the false-positive trap):
//   A level whose payload is only a DIFFICULTY PRESET (e.g. {colors,size}) is
//   NOT a duplicate when the board is generated at runtime from a PER-INDEX
//   seed or from Math.random(). Confirmed 2026-10-30:
//     flood-fill  generateGrid(size, colors, seed = (idx+1)*7919+12345)
//     pocket-sort generateLevel(lv) -> shuffle(pool) with Math.random()
//   Both ship repeated presets but produce a DIFFERENT board per level.
//   A level that carries the finished board (grid/cells/cars/blocks/clues/
//   solution/...) IS player-visible and IS a duplicate.
//
// Usage:
//   node .audit/r338-d21-dup-levels.js <slug> [<slug> ...]   # per game
//   node .audit/r338-d21-dup-levels.js --all                 # whole catalog
//   node .audit/r338-d21-dup-levels.js --all --json          # machine output
//
// Exit 0 = no duplicate levels; exit 1 = duplicates found; exit 2 = usage error.
const fs = require('fs');
const path = require('path');
// GZ_SITE_ROOT lets the detector run against an ALTERNATE checkout (e.g. an
// isolated worktree under review). Without it the detector always reads the
// repo it lives in, so "run it on the worktree" silently audits the MAIN
// tree instead — the cwd-shadow trap (Pitfall #55/#68).
const ROOT = process.env.GZ_SITE_ROOT
  ? path.resolve(process.env.GZ_SITE_ROOT)
  : path.resolve(__dirname, '..');
const extractLevels = require(path.join(__dirname, 'gz-extract-levels.js'));

const COSMETIC = new Set([
  'id', 'name', 'label', 'desc', 'description', 'tier', 'par', 'tutorial',
  'hint', 'difficulty', 'order', 'index', 'note',
  // R338: measured/derived fields are NOT part of the puzzle identity.
  // kurodoko shipped `solve_ms` (the solver's own timing) on every level, so
  // two levels with the same board but different measured runtimes were
  // treated as DIFFERENT, and two with identical runtimes were treated as
  // the same board. Timing is an artifact of the measurement, not of the
  // puzzle the player meets.
  'solve_ms', 'solveTime', 'elapsed', 'duration_ms', 'gen_time',
]);

// Games whose level payload is only a difficulty preset and whose board is
// regenerated per index / per session -> NOT a player-visible duplicate.
const SPEC_PROCEDURAL = new Set(['flood-fill', 'pocket-sort', 'paper-io', 'brick-breaker']);

function ident(l) {
  if (l === undefined || l === null) return '__UNDEFINED__';
  const c = {};
  for (const k of Object.keys(l).sort()) {
    if (COSMETIC.has(k)) continue;
    c[k] = l[k];
  }
  return JSON.stringify(c);
}

function liveSlugs() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'games-data.js'), 'utf8');
  const t = src.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(t + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => g.url.replace(/^\//, '').replace(/\/$/, ''));
}

function analyze(slug) {
  if (SPEC_PROCEDURAL.has(slug)) return { slug, skipped: 'SPEC_PROCEDURAL', groups: [] };
  let L;
  try { L = extractLevels(slug); } catch (e) {
    return { slug, error: 'extract failed: ' + e.message, groups: [] };
  }
  if (!Array.isArray(L)) return { slug, error: 'no LEVELS array', groups: [] };
  const m = new Map();
  L.forEach((l, i) => {
    const k = ident(l);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  });
  const groups = [...m.values()].filter(v => v.length > 1).map(idxs => {
    const first = L[idxs[0]] || {};
    const payload = {};
    for (const k of Object.keys(first).sort()) {
      if (COSMETIC.has(k)) continue;
      payload[k] = first[k];
    }
    return {
      indices: idxs,
      names: idxs.map(i => (L[i] && (L[i].name || L[i].label)) || ('#' + i)),
      payloadKeys: Object.keys(payload),
      payloadSample: payload,
    };
  });
  return { slug, levelCount: L.length, groups };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const all = args.includes('--all');
  let slugs;
  if (all) {
    slugs = liveSlugs();
  } else {
    slugs = args.filter(a => !a.startsWith('--'));
    if (!slugs.length) {
      console.error('usage: node .audit/r338-d21-dup-levels.js <slug>... | --all [--json]');
      process.exit(2);
    }
  }
  const out = [];
  let gamesWithDup = 0, redundant = 0;
  for (const s of slugs) {
    const r = analyze(s);
    if (r.groups.length) {
      gamesWithDup++;
      redundant += r.groups.reduce((a, g) => a + g.indices.length - 1, 0);
    }
    out.push(r);
  }
  if (json) {
    console.log(JSON.stringify({ gamesWithDup, redundant, results: out }, null, 1));
  } else {
    for (const r of out) {
      if (r.skipped) { console.log(r.slug.padEnd(20), 'SKIP (' + r.skipped + ')'); continue; }
      if (r.error) { console.log(r.slug.padEnd(20), 'ERROR: ' + r.error); continue; }
      if (!r.groups.length) continue;
      console.log(r.slug.padEnd(20), 'levels=' + String(r.levelCount).padEnd(4),
        r.groups.map(g => '[' + g.indices.join(',') + ']').join(' '),
        '| keys=' + r.groups[0].payloadKeys.join(','));
    }
    console.log('\nGAMES_WITH_DUPLICATES=' + gamesWithDup + '  REDUNDANT_LEVELS=' + redundant);
  }
  process.exit(gamesWithDup > 0 ? 1 : 0);
}
main();
