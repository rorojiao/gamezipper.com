#!/usr/bin/env node
/**
 * R334 D7 detector v3: DEFINED-BUT-NEVER-REFERENCED functions.
 *
 * v2 (R333) counted whole-word references of an identifier outside its own
 * declaration, across inline scripts + same-directory .js the page loads +
 * HTML inline handlers. It found the kropki-sudoku P0 (drawDots()).
 *
 * v3 FIXES THE KNOWN v2 FALSE-POSITIVE SOURCE flagged by R333's next_action:
 * a function reachable ONLY through an inline handler that is BUILT INSIDE a
 * JS string. v2 strips string literals before counting, so `onclick="'" +
 * 'loadLevel(' + n + ')' + '"'` never registers as a reference and every
 * such function is falsely reported as dead.
 *
 * Fix: in ADDITION to the stripped-code reference count, scan the RAW
 * (unstripped) code for the pattern `on<event>=` followed (within the same
 * string-literal run) by the identifier. This catches handlers assembled at
 * runtime without re-introducing the comment false-positive class (comments
 * are still stripped in the raw pass, only STRING LITERALS are kept).
 *
 * CALIBRATION (mandatory, Pitfall #62 — a gate that cannot fail is not a gate):
 *   - POSITIVE: a function referenced ONLY via a template-built inline
 *     handler must NOT be flagged (this is the v2 false positive).
 *   - POSITIVE: a genuinely unreferenced function MUST still be flagged.
 *   - NEGATIVE: a function passed as a callback must NOT be flagged.
 *   - REGRESSION: kropki-sudoku drawDots must not be flagged post-R333-fix.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name }));
}

const DEVTOOL = /verify_|qa_?check|gen_|register|fix_|solver|_test\.js|browser_test|levels_compact|_levels/i;

function pageCode(slug) {
  const d = path.join(ROOT, slug);
  const idx = path.join(d, 'index.html');
  if (!fs.existsSync(idx)) return null;
  const html = fs.readFileSync(idx, 'utf8');
  const parts = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) parts.push(m[1]);
  for (const m of html.matchAll(/<script[^>]*\bsrc=["']([^"']+\.js)["']/g)) {
    const src = m[1];
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('/')) continue;
    if (DEVTOOL.test(src)) continue;
    const p = path.join(d, src);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
  }
  const htmlNoScripts = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  return { code: parts.join('\n'), html: htmlNoScripts };
}

// strip comments only — KEEP string literals (v3 differs from v2 here)
function stripComments(src) {
  let s = src;
  s = s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  s = s.replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return s;
}
// strip comments AND string literals (v2 behaviour) — used for the strict count
function stripNoise(src) {
  let s = stripComments(src);
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, m => ' '.repeat(m.length));
  s = s.replace(/"(?:[^"\\\n]|\\.)*"/g, m => ' '.repeat(m.length));
  s = s.replace(/`(?:[^`\\]|\\.)*`/g, m => ' '.repeat(m.length));
  return s;
}

const NOT_A_FUNCTION = new Set(['function', 'if', 'for', 'while', 'switch', 'catch', 'return', 'do', 'else',
  'new', 'typeof', 'void', 'delete', 'in', 'of', 'instanceof']);

// Does the RAW code contain an inline-handler assignment that mentions NAME?
// Pattern: on<event>= ... NAME ... within a string literal run.
function handlerRef(rawCode, name) {
  const esc = name.replace(/[$]/g, '\\$');
  // find every `onclick=` / `on<event>=` occurrence, then look at the following
  // 400 chars of RAW text for a whole-word occurrence of NAME
  const re = /\bon[a-z]+\s*=/g;
  let m;
  while ((m = re.exec(rawCode))) {
    const win = rawCode.slice(m.index, m.index + 400);
    // the handler body may itself be split across string concatenations
    if (new RegExp('(?<![\\w$])' + esc + '(?![\\w$])').test(win)) return true;
  }
  return false;
}

function analyse(slug) {
  const pc = pageCode(slug);
  if (!pc) return null;
  const raw = stripComments(pc.code);
  const code = stripNoise(pc.code);
  const html = pc.html;

  const decls = new Map();
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    const n = m[1];
    if (NOT_A_FUNCTION.has(n)) continue;
    decls.set(n, (decls.get(n) || 0) + 1);
  }
  // R334 FIX: a SELF-INVOKED IIFE — `(function validateLevels(){...})()` — is a
  // LIVE function even though its name appears exactly once (the declaration).
  // v3 counted only whole-word references, so every self-invoked IIFE was
  // reported as dead. That produced false positives on one-line-puzzle,
  // bus-jam-3d, pocket-sort and suguru (all four run a level-validating IIFE
  // at load time). Detect the IIFE form and count it as a reference.
  const selfInvoked = new Set();
  for (const m of raw.matchAll(/\(\s*function\s+([A-Za-z_$][\w$]*)\s*\([\s\S]{0,8000}?\}\s*\)\s*\(\s*\)/g)) {
    selfInvoked.add(m[1]);
  }
  const unreferenced = [];
  for (const name of decls.keys()) {
    const esc = name.replace(/[$]/g, '\\$');
    let refs = 0;
    for (const m of code.matchAll(new RegExp('(?<![\\w$])' + esc + '(?![\\w$])', 'g'))) refs++;
    if (selfInvoked.has(name)) refs++;   // the IIFE's own invocation counts
    if (refs <= decls.get(name)) {
      const inHtml = new RegExp('(?<![\\w$])' + esc + '(?![\\w$])').test(html);
      // v3: also accept a runtime-built inline handler
      const inHandler = handlerRef(raw, name);
      if (!inHtml && !inHandler) unreferenced.push(name);
    }
  }
  return { slug, declared: decls.size, unreferenced };
}

// a name is "interesting" if it looks like render / rule / input work
const INTERESTING = /^(draw|render|paint|update|check|is|validate|verify|verifyAll|solve|win|place|drop|move|spawn|emit|hit|collide|animate|loop|tick|step|select|choose|pick|remove|clear|score|load|save|reset|init|setup|build|create|make)/;

function main() {
  const games = liveGames();
  console.log(`LIVE: ${games.length}`);
  const findings = [];
  for (const g of games) {
    const a = analyse(g.slug);
    if (a && a.unreferenced.length) findings.push(a);
  }
  console.log(`\n=== D7 v3 games with >=1 NEVER-REFERENCED function: ${findings.length} ===`);
  let shown = 0;
  for (const f of findings) {
    const interesting = f.unreferenced.filter(n => INTERESTING.test(n));
    if (!interesting.length) continue;
    shown++;
    console.log(`\n  ${f.slug}  (${f.unreferenced.length} unreferenced of ${f.declared} declared)`);
    console.log(`     INTERESTING: ${interesting.join(', ')}`);
    console.log(`     all: ${f.unreferenced.slice(0, 30).join(', ')}`);
  }
  console.log(`\n  games with an INTERESTING unreferenced function: ${shown}`);
  fs.writeFileSync(path.join(ROOT, '.audit/r334-d7-unreferenced.json'), JSON.stringify(findings, null, 1));

  console.log('\n=== CALIBRATION CONTROLS ===');
  // REGRESSION control: kropki drawDots must NOT be flagged (fixed in R333)
  const k = analyse('kropki-sudoku');
  console.log(`   REGRESSION kropki-sudoku drawDots flagged? ${k.unreferenced.includes('drawDots')}  (must be false)`);
  console.log(`   REGRESSION kropki-sudoku unreferenced: ${k.unreferenced.join(', ') || '(none)'}`);

  // CONTROL A (v2 FALSE POSITIVE, must now be clean): a function referenced ONLY
  // through a runtime-built inline handler.
  const fakeHandler = `
    function loadLevel(idx){ return idx; }
    function neverUsedAlpha(){ return 42; }
    var html = '<div class="ls-cell" onclick="' + (locked ? '' : 'loadLevel(' + i + ');hideLevelSelect();') + '"></div>';
  `;
  const rawA = stripComments(fakeHandler);
  const codeA = stripNoise(fakeHandler);
  function unreferencedIn(src, raw) {
    const d = new Map();
    for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) d.set(m[1], (d.get(m[1]) || 0) + 1);
    // self-invoked IIFE counts as a reference (same rule as analyse())
    const selfInvoked = new Set();
    for (const m of raw.matchAll(/\(\s*function\s+([A-Za-z_$][\w$]*)\s*\([\s\S]{0,8000}?\}\s*\)\s*\(\s*\)/g)) selfInvoked.add(m[1]);
    const out = [];
    for (const name of d.keys()) {
      const esc = name.replace(/[$]/g, '\\$');
      let refs = 0;
      for (const m of src.matchAll(new RegExp('(?<![\\w$])' + esc + '(?![\\w$])', 'g'))) refs++;
      if (selfInvoked.has(name)) refs++;
      if (refs <= d.get(name)) {
        if (!handlerRef(raw, name)) out.push(name);
      }
    }
    return out;
  }
  const uncA = unreferencedIn(codeA, rawA);
  console.log(`   CONTROL A (template-built handler) unreferenced: ${uncA.join(',') || '(none)'}  (must NOT contain loadLevel; must contain neverUsedAlpha)`);

  // CONTROL B: genuinely dead function MUST still be flagged
  const synth = 'function drawAlpha(){ ctx.fillRect(0,0,1,1); }\nfunction usedBeta(){ return 1; }\nsetInterval(usedBeta, 30);\n';
  const rawB = stripComments(synth);
  const codeB = stripNoise(synth);
  const uncB = unreferencedIn(codeB, rawB);
  console.log(`   CONTROL B (synthetic) unreferenced: ${uncB.join(',')}  (must contain drawAlpha, must NOT contain usedBeta)`);

  // CONTROL C: a dead RENDER function must still be caught (the kropki class)
  const synthC = 'function drawDots(){ ctx.fillRect(0,0,1,1); }\nfunction board(){} board();\n';
  const rawC = stripComments(synthC);
  const codeC = stripNoise(synthC);
  const uncC = unreferencedIn(codeC, rawC);
  console.log(`   CONTROL C (dead render) unreferenced: ${uncC.join(',')}  (must contain drawDots)`);

  // CONTROL D: a SELF-INVOKED IIFE is LIVE and must NOT be flagged.
  // (function validateLevels(){ throw new Error('bad'); })();
  const synthD = '(function validateLevels(){ if(1) throw new Error("x"); })();\nfunction deadThing(){ return 1; }\n';
  const rawD = stripComments(synthD);
  const codeD = stripNoise(synthD);
  const uncD = unreferencedIn(codeD, rawD);
  console.log(`   CONTROL D (self-invoked IIFE) unreferenced: ${uncD.join(',') || '(none)'}  (must NOT contain validateLevels; must contain deadThing)`);
}

main();
