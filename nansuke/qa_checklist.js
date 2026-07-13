// qa_checklist.js — Code-level QA for Nansuke index.html
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; /*console.log('  ✅ ' + name);*/ }
  else { fail++; console.log('  ❌ ' + name); }
}

// SEO / meta
check('has <title>', /<title>/.test(html));
check('has meta description', /name="description"/.test(html));
check('has canonical', /rel="canonical"/.test(html));
check('has og:title', /property="og:title"/.test(html));
check('has og:image', /property="og:image"/.test(html));
check('has twitter:card', /twitter:card/.test(html));
check('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));
check('sr-only H1', /gz-sr-only/.test(html) && /<h1/.test(html));
check('icon link', /rel="icon"[^>]*nansuke/.test(html));

// Levels
check('LEVELS array defined', /var LEVELS\s*=/.test(html));
const levelCount = (html.match(/"tier":\s*"[a-z]+"/g) || []).length;
check('30 levels present', levelCount === 30);

// Game systems
check('Web Audio AudioContext', /AudioContext/.test(html));
check('Canvas element', /<canvas/.test(html));
check('localStorage save', /localStorage/.test(html));
check('hint system', /useHint|hintCells/.test(html));
check('star ratings', /stars|star/.test(html));
check('level select', /levelSelect|level-select/.test(html));
check('timer', /hud-time|startTime/.test(html));
check('keyboard support', /addEventListener\('keydown'/.test(html));
check('erase mode', /eraseMode|btn-erase/.test(html));
check('check function', /function doCheck|isComplete/.test(html));
check('confetti', /confetti/.test(html));
check('toast messages', /showToast/.test(html));
check('settings panel', /settingsOverlay|autoCheck/.test(html));
check('touch support', /touchstart/.test(html));
check('beforeunload cleanup', /beforeunload/.test(html));

// Art assets
check('icon.png referenced', /nansuke\/icon\.png/.test(html));
check('og-image referenced', /nansuke\/og-image\.jpg/.test(html));

// Monetag / footer / analytics
check('game-footer.js', /game-footer\.js/.test(html));
check('game-audio-auto.js', /game-audio-auto\.js/.test(html));

// Topnav
check('topnav', /gz-topnav/.test(html));

// Number bank
check('num-bank', /num-bank/.test(html));
check('num-chip', /num-chip/.test(html));

console.log(`\nQA: ${pass}/${pass+fail} checks passed`);
if (fail > 0) { console.log('❌ QA FAILED'); process.exit(1); }
else console.log('✅ QA PASSED');
