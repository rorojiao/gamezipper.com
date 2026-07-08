// qa_checklist.js — Code-level QA checklist for Sukoro
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html','utf8');
let checks = [];
let pass = 0, fail = 0;

function check(name, condition){
  if(condition){ pass++; checks.push(`✅ ${name}`); }
  else { fail++; checks.push(`❌ ${name}`); }
}

// 1. HTML structure
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('meta charset', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('viewport'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('og:url', html.includes('og:url'));
check('twitter:card', html.includes('twitter:card'));
check('favicon link', html.includes('rel="icon"'));
check('lang attribute', html.includes('<html lang="en">'));

// 2. SEO
check('title contains Sukoro', html.includes('<title>Sukoro'));
check('meta description', html.includes('name="description"'));
check('sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));
check('GameZipper mentioned', html.includes('GameZipper'));

// 3. JSON-LD
check('VideoGame schema', html.includes('"@type":"VideoGame"'));
check('BreadcrumbList schema', html.includes('"@type":"BreadcrumbList"'));
check('FAQPage schema', html.includes('"@type":"FAQPage"'));
check('schema @context', html.includes('"@context":"https://schema.org"'));

// 4. Game features
check('canvas element', html.includes('<canvas'));
check('LEVELS data', html.includes('const LEVELS'));
check('30 levels', (html.match(/"id":\d+/g) || []).length >= 30);
check('Web Audio init', html.includes('AudioContext'));
check('music function', html.includes('startMusic'));
check('sound effects', html.includes('sfxPlace') && html.includes('sfxWin'));
check('localStorage save', html.includes('localStorage'));
check('hint system', html.includes('hintsLeft') && html.includes('btnHint'));
check('undo/restart', html.includes('btnRestart'));
check('level select', html.includes('updateLevelSelect'));
check('star ratings', html.includes('stars') && html.includes('progress'));
check('keyboard support', html.includes('keydown'));
check('touch support', html.includes('touchstart'));
check('confetti animation', html.includes('confetti'));
check('win overlay', html.includes('winOverlay'));
check('timer', html.includes('updateTimer'));

// 5. No deprecated elements
check('no site-analytics pixel', !html.includes('site-analytics'));
check('no inline errors', !html.includes('undefined') || html.includes("'undefined'"));

// 6. Assets
check('icon.png referenced', html.includes('/sukoro/icon.png'));
check('og-image.jpg referenced', html.includes('/sukoro/og-image.jpg'));

// 7. Responsive
check('mobile viewport', html.includes('width=device-width'));
check('media query', html.includes('@media'));

// 8. Levels integrity — extract and validate
try {
  const match = html.match(/const LEVELS\s*=\s*(\[.*?\]);/s);
  const sandbox = { LEVELS: null };
  const ctx = vm.createContext(sandbox);
  vm.runInContext('LEVELS = ' + match[1] + ';', ctx);
  const LEVELS = sandbox.LEVELS;
  check('LEVELS parseable', Array.isArray(LEVELS) && LEVELS.length === 30);
  
  const tiers = ['Beginner','Easy','Medium','Hard','Expert'];
  check('5 tiers present', tiers.every(t => LEVELS.some(l => l.tier === t)));
  check('levels numbered 1-30', LEVELS.every((l,i) => l.id === i+1));
  check('all have grid', LEVELS.every(l => Array.isArray(l.g)));
  check('all have solution', LEVELS.every(l => Array.isArray(l.s)));
  check('grid dims match', LEVELS.every(l => l.g.length === l.H && l.g[0].length === l.W));
  check('solution dims match', LEVELS.every(l => l.s.length === l.H && l.s[0].length === l.W));
} catch(e) {
  check('LEVELS parseable', false);
}

// 9. Files exist
check('icon.png exists', fs.existsSync('icon.png'));
check('og-image.jpg exists', fs.existsSync('og-image.jpg'));
check('levels.json exists', fs.existsSync('levels.json'));
check('gen_levels.py exists', fs.existsSync('gen_levels.py'));
check('BENCHMARK.md exists', fs.existsSync('BENCHMARK.md'));

checks.forEach(c => console.log(c));
console.log(`\n${fail===0?'✅':'❌'} QA: ${pass}/${pass+fail} checks passed (${fail} failures)`);
process.exit(fail===0?0:1);
