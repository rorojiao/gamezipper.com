#!/usr/bin/env node
/**
 * R333 D7 detector v2: DEFINED-BUT-NEVER-REFERENCED functions.
 *
 * Bug class found live this tick: kropki-sudoku's `drawDots()` was defined
 * with a full render implementation and NEVER CALLED, so the puzzle's
 * defining constraint was never drawn (and it referenced an undeclared
 * `ctx`, so calling it would have thrown). Every screenshot review and every
 * "does it render something" functional test passes on such a game.
 *
 * v1 counted only `NAME(` call sites and produced 465/466 false positives,
 * because a function passed as a callback (`setInterval(loop, 30)`,
 * `requestAnimationFrame(draw)`, `addEventListener('x', handler)`) is a
 * legitimate reference with no parentheses.
 *
 * v2 counts WHOLE-WORD REFERENCES of the identifier outside its own
 * declaration. A function whose name appears nowhere else in the page's
 * script code (and nowhere in an HTML inline handler) is unreachable.
 *
 * CALIBRATION:
 *   - POSITIVE: kropki-sudoku BEFORE the R333 fix must flag drawDots;
 *     AFTER the fix it must not.
 *   - NEGATIVE: functions passed as callbacks must NOT be flagged.
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
  // HTML with the script blocks removed -> inline handlers like onclick="nextLevel()"
  const htmlNoScripts = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  return { code: parts.join('\n'), html: htmlNoScripts };
}

function stripNoise(src) {
  let s = src;
  s = s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  s = s.replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, m => ' '.repeat(m.length));
  s = s.replace(/"(?:[^"\\\n]|\\.)*"/g, m => ' '.repeat(m.length));
  s = s.replace(/`(?:[^`\\]|\\.)*`/g, m => ' '.repeat(m.length));
  return s;
}

const NOT_A_FUNCTION = new Set(['function', 'if', 'for', 'while', 'switch', 'catch', 'return', 'do', 'else',
  'new', 'typeof', 'void', 'delete', 'in', 'of', 'instanceof']);

function analyse(slug) {
  const pc = pageCode(slug);
  if (!pc) return null;
  const code = stripNoise(pc.code);
  const html = pc.html;

  const decls = new Map();
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    const n = m[1];
    if (NOT_A_FUNCTION.has(n)) continue;
    if (!decls.has(n)) decls.set(n, 0);
    decls.set(n, decls.get(n) + 1);
  }
  const unreferenced = [];
  for (const name of decls.keys()) {
    const esc = name.replace(/\$/g, '\\$');
    // references in the stripped script code
    let refs = 0;
    for (const m of code.matchAll(new RegExp('(?<![\\w$])' + esc + '(?![\\w$])', 'g'))) refs++;
    // each declaration contributes exactly 1 reference
    const declRefs = decls.get(name);
    if (refs <= declRefs) {
      // maybe referenced from an inline HTML handler
      const inHtml = new RegExp('(?<![\\w$])' + esc + '(?![\\w$])').test(html);
      if (!inHtml) unreferenced.push(name);
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
  console.log(`\n=== D7 games with >=1 NEVER-REFERENCED function: ${findings.length} ===`);
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
  fs.writeFileSync(path.join(ROOT, '.audit/r333-d7-unreferenced.json'), JSON.stringify(findings, null, 1));

  console.log('\n=== CALIBRATION CONTROLS ===');
  const k = analyse('kropki-sudoku');
  console.log(`   kropki-sudoku drawDots unreferenced? ${k.unreferenced.includes('drawDots')}  (must be false after the R333 fix)`);
  console.log(`   kropki-sudoku all unreferenced: ${k.unreferenced.join(', ') || '(none)'}`);
  // POSITIVE control: synthetic
  const synth = 'function drawAlpha(){ ctx.fillRect(0,0,1,1); }\nfunction usedBeta(){ return 1; }\nsetInterval(usedBeta, 30);\n';
  const code = stripNoise(synth);
  const decls = new Map();
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) decls.set(m[1], (decls.get(m[1]) || 0) + 1);
  const unc = [];
  for (const name of decls.keys()) {
    let refs = 0;
    for (const m of code.matchAll(new RegExp('(?<![\\w$])' + name + '(?![\\w$])', 'g'))) refs++;
    if (refs <= decls.get(name)) unc.push(name);
  }
  console.log(`   SYNTH unreferenced: ${unc.join(',')}  (must contain drawAlpha, must NOT contain usedBeta)`);
}

main();
