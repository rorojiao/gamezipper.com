// qa_checklist.js — Code-level QA checklist for Nuribou
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; } else { fail++; console.log(`FAIL: ${name}`); } }

// 1. Title
check('title present', /<title>[^<]*Nuribou[^<]*<\/title>/.test(html));
// 2. meta description
check('meta description', /<meta name="description"[^>]*Nuribou/.test(html));
// 3. canonical
check('canonical URL', /<link rel="canonical" href="https:\/\/gamezipper\.com\/nuribou\/">/.test(html));
// 4. og:image
check('og:image', /<meta property="og:image" content="\/nuribou\/og-image\.jpg">/.test(html));
// 5. JSON-LD blocks
check('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));
// 6. @context schema.org
check('schema.org context', /"@context":"https:\/\/schema\.org"/.test(html));
// 7. gz-sr-only H1
check('gz-sr-only H1', /gz-sr-only/.test(html) && /<h1[^>]*>Nuribou/.test(html));
// 8. LEVELS array extracted & valid
const startIdx = html.indexOf('const LEVELS=');
const endMarker = ';\n// ============ GAME STATE';
const endIdx = html.indexOf(endMarker, startIdx);
check('LEVELS array present', startIdx >= 0 && endIdx >= 0);
if (startIdx >= 0 && endIdx >= 0) {
  const levelsSrc = html.substring(startIdx + 'const LEVELS='.length, endIdx + 1);
  const sandbox = {}; vm.createContext(sandbox);
  try { vm.runInContext('var LEVELS=' + levelsSrc + ';', sandbox);
    const L = sandbox.LEVELS;
    check('LEVELS has 30 entries', L.length === 30);
    check('all levels have R,C,puzzle,solution', L.every(l => l.R && l.C && l.puzzle && l.solution));
    check('all puzzles non-empty', L.every(l => l.puzzle.length === l.R && l.puzzle[0].length === l.C));
    check('all solutions match R,C', L.every(l => l.solution.length === l.R && l.solution[0].length === l.C));
    check('all tiers present', new Set(L.map(l=>l.tier)).size === 5);
  } catch(e) { check('LEVELS parse OK', false); }
}
// 9. canvas element
check('canvas element', /<canvas[^>]*id="game"/.test(html));
// 10. Web Audio API
check('Web Audio init', /AudioContext/.test(html));
check('Web Audio music', /startMusic/.test(html));
check('Web Audio SFX', /playSfx/.test(html));
// 11. modes
check('fill mode', /mode-fill/.test(html));
check('white mode', /mode-white/.test(html));
check('erase mode', /mode-erase/.test(html));
// 12. hints
check('hint button', /btn-hint/.test(html));
check('hint count 3', /hintsLeft=3/.test(html));
// 13. check button
check('check button', /btn-check/.test(html));
// 14. menu
check('menu button', /btn-menu/.test(html));
check('level select', /level-cell/.test(html));
check('tier headers', /tier-header/.test(html));
// 15. settings
check('settings panel', /settings-panel/.test(html));
check('music toggle', /t-music/.test(html));
check('sfx toggle', /t-sfx/.test(html));
check('autocheck toggle', /t-auto/.test(html));
// 16. localStorage
check('localStorage progress', /localStorage\.setItem\(progressKey/.test(html));
check('localStorage settings', /localStorage\.setItem\('nuribou_settings'/.test(html));
// 17. star ratings
check('3-star ratings', /stars=3/.test(html) || /stars<3/.test(html) || /repeat\(3-stars\)/.test(html));
// 18. timer
check('timer', /info-time/.test(html) && /timerInterval/.test(html));
// 19. keyboard support
check('keyboard 1/2/3', /e\.key==='1'/.test(html) && /e\.key==='2'/.test(html));
check('keyboard H hint', /e\.key==='h'/.test(html));
check('keyboard R restart', /e\.key==='r'/.test(html));
check('keyboard Enter check', /e\.key==='Enter'/.test(html));
check('keyboard Esc menu', /e\.key==='Escape'/.test(html));
// 20. confetti
check('confetti win', /launchConfetti/.test(html));
// 21. toast
check('toast messages', /showToast/.test(html));
// 22. touch support
check('touch pointerdown', /pointerdown/.test(html));
check('touch-action none', /touch-action:none/.test(html));
// 23. responsive
check('viewport meta', /viewport.*width=device-width/.test(html));
// 24. no broken template
check('no LEVELS_PLACEHOLDER', !/LEVELS_PLACEHOLDER/.test(html));
// 25. solution validity (binary 0/1)
const startIdx2 = html.indexOf('const LEVELS=');
const endIdx2 = html.indexOf(endMarker, startIdx2);
const ls2 = html.substring(startIdx2 + 'const LEVELS='.length, endIdx2 + 1);
const sb2 = {}; vm.createContext(sb2);
vm.runInContext('var L=' + ls2 + ';', sb2);
const L2 = sb2.L;
check('solution values 0 or 1', L2.every(l => l.solution.every(row => row.every(v => v === 0 || v === 1))));
check('puzzle values non-negative', L2.every(l => l.puzzle.every(row => row.every(v => v >= 0))));
// 26. win condition callable
check('checkWin function', /function checkWin/.test(html));
check('doWin function', /function doWin/.test(html));

console.log(`\n${pass}/${pass+fail} checks passed`);
process.exit(fail ? 1 : 0);
