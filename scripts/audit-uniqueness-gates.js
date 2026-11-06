#!/usr/bin/env node
/**
 * audit-uniqueness-gates.js — catalog-wide audit of the "unique solution" promise
 * against the shipped verification gates.   (R992, 2026-10-26)
 *
 * WHY THIS EXISTS
 * ---------------
 * Two shipped games proved that a game can PROMISE a unique solution while its
 * shipped gate is structurally incapable of seeing a non-unique level:
 *
 *   - kropki-sudoku (R329, 2026-10-22): "9/27 levels had a second valid solution;
 *     the shipped gate was blind".  verify_engine.js injected the STORED solution
 *     and called checkWin(), so it could only re-validate the answer it was handed.
 *     It reported 27/27 PASS on a broken catalog and exited 0.
 *   - queens (R337): 30/30 levels non-unique (48..100000 solutions each) while the
 *     page states "Every puzzle has exactly one unique solution" in three places.
 *
 * A gate that re-validates the stored solution is a NO-OP GATE WEARING A PASS
 * COSTUME.  This script finds that class across the WHOLE catalog at once, instead
 * of one game per round.
 *
 * SEVERITY MODEL (measured, not assumed)
 * --------------------------------------
 *  P0  player-harm.  The page's win check COMPARES the player's board against the
 *      stored solution.  If a level has a second valid solution, a player who deduces
 *      it correctly is permanently marked wrong.  (kropki-sudoku pre-R329.)
 *  P1  claim defect.  Uniqueness is promised on a player-visible surface but no
 *      shipped gate asserts it, so nothing in CI can catch a regression.
 *  P2  catalog defect.  games-data.js desc/tags claim uniqueness for a game whose own
 *      shipped gate documents it as MULTI-SOLUTION BY DESIGN (rule-based win check).
 *      Players are not harmed; the marketing copy is false.
 *  OK  no defect.
 *
 * WHAT IT CHECKS (per registered game)
 * ------------------------------------
 *   claim      : does a player-visible or catalog surface promise uniqueness?
 *   gate       : does any shipped verifier ASSERT uniqueness (count/enumerate the
 *                solutions and require exactly 1) rather than merely re-validate one?
 *   wincompare : does the page compare the player's board to the stored solution?
 *   bydesign   : does the shipped gate explicitly document multi-solution by design?
 *
 * STATIC AND READ-ONLY: it never executes game code and never writes to the repo.
 * It reports the class + the prioritised worklist.  Per-game repair belongs to the
 * QA lane (which owns the games); this script is the pipeline-side gate that keeps
 * the class from recurring on future ships.
 *
 * Usage:
 *   node scripts/audit-uniqueness-gates.js                # human report
 *   node scripts/audit-uniqueness-gates.js --tsv          # machine-readable
 *   node scripts/audit-uniqueness-gates.js --defects-only # just the worklist
 *   node scripts/audit-uniqueness-gates.js --self-test    # detector regression
 * Exit: 0 = no defects, 1 = defects found, 2 = usage/IO error.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODE = process.argv[2] || '';

/* ---- claim surfaces -------------------------------------------------------- */
/* "unique solution", "exactly one unique solution", "unique-solution levels", ... */
const CLAIM_RE = /(unique[ -]?(canonical )?solution|exactly one (unique )?solution|one unique solution|unique puzzle solution|solution is unique|unique-solution|unique puzzle|has a unique solution|uniquely solvable)/i;

/* ---- gate: does it ASSERT uniqueness? ------------------------------------- */
/* Three complementary signals.  Calibrated against a labelled set: every gate that
 * counts solutions and requires exactly one matches >=1 signal, and every
 * validity-only gate (which re-validates the stored solution) matches NONE. */
const GATE_FN_RE   = /(countSolutions|countAll|exactCount|numSolutions|solutionCount|countValidSolutions|solveUnique|uniqueSolve|isUnique|hasUniqueSolution|multiSolution|second solution|findAllSolutions|allSolutions|solveAll)/i;
const GATE_WORD_RE = /(\bUNIQUE\b|NOT UNIQUE|NON-UNIQUE|unique solution|unique-solution|uniquely solvable|multiple solutions|exactly one solution|only one solution)/i;
const GATE_CNT_RE  = /\b(sols?|solutions?|solutionList|solList|found|possible|solutionCount|numSolutions|count|allSols|allSolutions)\s*(\.\s*(length|size))?\s*(===|!==|==|>|<|>=|<=)\s*1\b/i;
const GATE_RE = new RegExp([GATE_FN_RE.source, GATE_WORD_RE.source, GATE_CNT_RE.source].join('|'), 'i');

/* ---- the gate documents multi-solution BY DESIGN -------------------------- */
const BYDESIGN_RE = /(does NOT claim uniqueness|multi-?solution by design|not unique by design|no uniqueness claim|intentionally multi-?solution|multi-?solution design|non-uniqueness is NOT a defect)/i;

/* ---- player-harm: win check compares board to the stored solution ---------- */
const WINCOMPARE_RE = /(\[[^\]]*\]\s*!==\s*[A-Za-z_$][\w.$]*\.?solution|\[[^\]]*\]\s*!==\s*solution|board\s*\[[^\]]*\]\s*\[[^\]]*\]\s*!==\s*[A-Za-z_$][\w.$]*\.?solution|cell\s*!==\s*solution|!==\s*lv\.solution|!==\s*p\.solution|!==\s*LEVELS\[[^\]]*\]\.solution)/i;

const GATE_FILES = ['verify_engine.js', 'verify_independent.js', 'verify_python.py', 'verify_levels.js', 'verify_unique.js'];

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } }
function stripTags(h) { return h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '); }

function catalog() {
  const src = read(path.join(ROOT, 'js/games-data.js'));
  const m = src.match(/const\s+GAMES\s*=\s*(\[[\s\S]*?\]);?\s*$/m);
  if (!m) throw new Error('cannot parse GAMES array from js/games-data.js');
  return eval(m[1]);
}

/* Player-visible = prose + JSON-LD (JSON-LD is what search engines and rich
 * results show, and it is where the R329/R337 defects actually shipped). */
function surfaces(html, desc, tags) {
  const prose = stripTags(html);
  const jsonld = (html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []).join('\n');
  return { page: prose + '\n' + jsonld, catalog: (desc || '') + ' ' + (tags || '') };
}

function winCheckBody(html) {
  // body of checkWin / checkSolution / isSolved — the function that decides a win
  const parts = [];
  const re = /function\s+(checkWin|checkSolution|isSolved|checkSolved|winCheck)\s*\([^)]*\)\s*\{/g;
  let m;
  while ((m = re.exec(html))) {
    let i = re.lastIndex, depth = 1;
    while (i < html.length && depth > 0) { const c = html[i]; if (c === '{') depth++; else if (c === '}') depth--; i++; }
    parts.push(html.slice(re.lastIndex, i - 1));
  }
  return parts.join('\n');
}

function main() {
  const games = catalog();
  const rows = [];
  for (const g of games) {
    if (!g || !g.url) continue;
    const slug = g.url.replace(/^\/|\/$/g, '');
    const dir = path.join(ROOT, slug);
    const htmlPath = path.join(dir, 'index.html');
    if (!fs.existsSync(htmlPath)) continue;

    const html = read(htmlPath);
    const surf = surfaces(html, g.desc, Array.isArray(g.tags) ? g.tags.join(' ') : String(g.tags || ''));

    const claimPage = CLAIM_RE.test(surf.page);
    const claimCatalog = CLAIM_RE.test(surf.catalog);
    const claim = claimPage || claimCatalog;

    const gates = [];
    for (const name of GATE_FILES) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) gates.push({ name, text: read(p) });
    }
    const asserting = gates.filter(x => GATE_RE.test(x.text)).map(x => x.name);
    const byDesign = gates.some(x => BYDESIGN_RE.test(x.text));

    const winCmp = WINCOMPARE_RE.test(winCheckBody(html));

    let verdict, severity = '', detail = '';
    if (claim && winCmp && asserting.length === 0) {
      verdict = 'P0-PLAYER-HARM'; severity = 'P0';
      detail = 'win check compares the board to the stored solution AND no shipped gate asserts uniqueness';
    } else if (claim && byDesign && !claimPage) {
      verdict = 'P2-CATALOG-FALSE-CLAIM'; severity = 'P2';
      detail = 'catalog desc/tags claim uniqueness; the shipped gate documents multi-solution by design (rule-based win check)';
    } else if (claim && asserting.length === 0) {
      verdict = 'P1-CLAIM-UNGUARDED'; severity = 'P1';
      detail = 'uniqueness promised on a player-visible surface; no shipped gate can detect a violation';
    } else if (claim) {
      verdict = 'OK'; detail = 'claim present and a shipped gate asserts uniqueness';
    } else if (asserting.length) {
      verdict = 'OK'; detail = 'gate asserts uniqueness; no player-visible claim (harmless)';
    } else {
      verdict = 'OK'; detail = 'no uniqueness claim, nothing load-bearing';
    }

    rows.push({ slug, name: g.name || slug, cat: g.cat || '', claimPage, claimCatalog,
                gates: gates.map(x => x.name).join(','), asserting: asserting.join(','),
                byDesign, winCmp, verdict, severity, detail });
  }

  if (MODE === '--self-test') return selfTest(rows);

  const defects = rows.filter(r => r.verdict !== 'OK');
  if (MODE === '--tsv') {
    console.log('slug\tname\tcat\tclaimPage\tclaimCatalog\tgates\tasserting\tbyDesign\twinCompare\tverdict');
    for (const r of rows) console.log([r.slug, r.name, r.cat, r.claimPage, r.claimCatalog, r.gates, r.asserting, r.byDesign, r.winCmp, r.verdict].join('\t'));
    return defects.length ? 1 : 0;
  }
  if (MODE === '--defects-only') {
    for (const r of defects) console.log(r.severity + '\t' + r.slug + '\t' + r.detail);
    return defects.length ? 1 : 0;
  }

  const bySev = { P0: 0, P1: 0, P2: 0 };
  for (const r of defects) bySev[r.severity]++;
  console.log('=== uniqueness-promise audit vs shipped gates (R992) ===');
  console.log('games audited: ' + rows.length);
  console.log('claim on a player-visible surface: ' + rows.filter(r => r.claimPage).length);
  console.log('claim in catalog desc/tags only:   ' + rows.filter(r => r.claimCatalog && !r.claimPage).length);
  console.log('');
  console.log('DEFECTS: ' + defects.length + '   (P0 player-harm=' + bySev.P0 + ', P1 unguarded-claim=' + bySev.P1 + ', P2 catalog-false-claim=' + bySev.P2 + ')');
  for (const sev of ['P0', 'P1', 'P2']) {
    const list = defects.filter(r => r.severity === sev);
    if (!list.length) continue;
    console.log('');
    console.log('-- ' + sev + ' --');
    for (const r of list) console.log('  ' + r.slug.padEnd(24) + r.detail);
  }
  console.log('');
  console.log('VERDICT: ' + (defects.length ? 'FAIL' : 'PASS'));
  return defects.length ? 1 : 0;
}

/* The self-test is the calibration: the detector must agree with hand-verified
 * ground truth for every labelled case, in BOTH directions. */
function selfTest(rows) {
  let fail = 0;
  const ok = (cond, msg) => { console.log((cond ? '  OK  ' : '  FAIL') + ' ' + msg); if (!cond) fail = 1; };
  const by = s => rows.find(r => r.slug === s);

  console.log('== detector units ==');
  ok(CLAIM_RE.test('Every puzzle has exactly one unique solution'), 'claim regex matches prose claim');
  ok(CLAIM_RE.test('30 handcrafted unique-solution levels'), 'claim regex matches meta claim');
  ok(CLAIM_RE.test('Every puzzle has a unique canonical solution'), 'claim regex matches canonical-solution claim');
  ok(!CLAIM_RE.test('Slide blocks to match the gates'), 'claim regex silent on unrelated prose');
  ok(GATE_RE.test('if (indep !== 1) errs.push("NOT UNIQUE")'), 'gate regex matches a counting gate');
  ok(GATE_RE.test('const unique = found.length === 1;'), 'gate regex matches found.length===1');
  ok(GATE_RE.test('if (sols.length > 1) return { ok: false, reason: "multiple solutions" };'), 'gate regex matches sols.length>1');
  ok(!GATE_RE.test('checkSolution(board, solution)'), 'gate regex silent on a validity-only gate');
  ok(BYDESIGN_RE.test('Catalog meta does NOT claim uniqueness (Kojun is multi-solution by design)'), 'by-design regex matches the documented multi-solution note');
  ok(WINCOMPARE_RE.test('if(G.board[r][c]!==G.solution[r][c]) return;'), 'win-compare regex matches a solution-compare win check');
  ok(!WINCOMPARE_RE.test('if(crowns.length!==n) return;'), 'win-compare regex silent on a rule-based win check');

  console.log('== catalog ground truth (hand-verified) ==');
  const kropki = by('kropki-sudoku');
  ok(!!kropki, 'kropki-sudoku is in the catalog');
  if (kropki) ok(kropki.verdict === 'OK', 'kropki-sudoku is OK (its gate was repaired at R329) — got ' + kropki.verdict);
  const queens = by('queens');
  ok(!!queens, 'queens is in the catalog');
  if (queens) ok(queens.verdict !== 'P0-PLAYER-HARM', 'queens is not P0 (its win check is rule-based) — got ' + queens.verdict);
  const kojun = by('kojun');
  ok(!!kojun, 'kojun is in the catalog');
  if (kojun) ok(kojun.verdict === 'P2-CATALOG-FALSE-CLAIM', 'kojun is P2 (gate says multi-solution by design, catalog claims unique) — got ' + kojun.verdict);
  const js2 = by('japanese-sums');
  if (js2) ok(js2.verdict === 'P2-CATALOG-FALSE-CLAIM', 'japanese-sums is P2 — got ' + js2.verdict);
  const lo = by('lights-out');
  if (lo) ok(lo.verdict !== 'OK' || lo.asserting.length > 0, 'lights-out verdict sane — ' + lo.verdict);

  console.log('== no game may be mislabelled OK while claiming uniqueness with no gate ==');
  const leaks = rows.filter(r => r.verdict === 'OK' && (r.claimPage || r.claimCatalog) && !r.asserting && !r.byDesign);
  ok(leaks.length === 0, 'no silent leaks (' + leaks.length + ') ' + leaks.slice(0, 5).map(r => r.slug).join(','));

  console.log(fail ? 'SELF-TEST FAIL' : 'SELF-TEST PASS');
  return fail;
}

try { process.exit(main()); } catch (e) { console.error('audit-uniqueness-gates: ' + e.message); process.exit(2); }
