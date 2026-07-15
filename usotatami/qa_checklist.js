// qa_checklist.js — Code-level QA checklist for Usotatami
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

let checks = [];
function check(name, cond) { checks.push({name, pass: !!cond}); }

// 1. HTML structure
check('DOCTYPE html', html.includes('<!DOCTYPE html>'));
check('lang attribute', html.includes('<html lang="en">'));
check('meta charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('title present', /<title>.*Usotatami.*<\/title>/.test(html));
check('meta description', html.includes('name="description"'));
check('canonical link', html.includes('rel="canonical"'));
check('og:title', html.includes('og:title'));
check('og:description', html.includes('og:description'));
check('og:image', html.includes('og:image'));
check('og:url', html.includes('og:url'));
check('twitter:card', html.includes('twitter:card'));
check('favicon (svg data uri)', html.includes('data:image/svg+xml'));

// 2. JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));
check('no aggregateRating (avoid fake)', !html.includes('aggregateRating'));

// 3. SEO
check('gz-sr-only H1', html.includes('class="gz-sr-only"') && html.includes('<h1'));
check('Usotatami in title', html.includes('Usotatami'));

// 4. Game systems
check('LEVELS array defined', /const LEVELS=\[/.test(html));
check('LEVELS has 30 entries', (html.match(/"num":\d+/g)||[]).length===30);
check('checkWin function', html.includes('function checkWin'));
check('computeStrips function', html.includes('function computeStrips'));
check('getStripInfo function', html.includes('function getStripInfo'));
check('getViolations function', html.includes('function getViolations'));
check('render function', html.includes('function render'));
check('loadLevel function', html.includes('function loadLevel'));
check('doHint function', html.includes('function doHint'));
check('doWin function', html.includes('function doWin'));
check('buildMenu function', html.includes('function buildMenu'));
check('toggleBorder function', html.includes('function toggleBorder'));
check('handleCanvasClick function', html.includes('function handleCanvasClick'));

// 5. Game features
check('Web Audio API', html.includes('AudioContext'));
check('music start/stop', html.includes('startMusic') && html.includes('stopMusic'));
check('SFX function', html.includes('function sfx'));
check('win SFX', html.includes("type==='win'"));
check('hint feature (3 per level)', html.includes('hintsLeft') && html.includes('hintCells'));
check('3-star ratings', html.includes('computeStars'));
check('level select menu', html.includes('openMenu') && html.includes('buildMenu'));
check('timer', html.includes('timerInt') && html.includes('updateTimer'));
check('settings (music/sfx/autocheck)', html.includes('toggleMusic') && html.includes('toggleSfx') && html.includes('toggleAuto'));
check('localStorage progress save', html.includes('saveProgress') && html.includes("localStorage.setItem('usotatami_progress'"));
check('localStorage settings save', html.includes("localStorage.setItem('usotatami_settings'"));
check('keyboard support', html.includes("e.key==='1'") && html.includes("e.key==='h'||e.key==='H'") && html.includes('Escape'));
check('touch support', html.includes('touchstart'));
check('pointer/click events', html.includes('addEventListener'));
check('confetti/win overlay', html.includes('win-overlay'));
check('beforeunload cleanup', html.includes('beforeunload'));
check('pagehide cleanup', html.includes('pagehide'));
check('visibilitychange', html.includes('visibilitychange'));

// 6. Ad/analytics/footer integration
check('monetag-manager.js', html.includes('/monetag-manager.js'));
check('adsterra-manager.js', html.includes('/adsterra-manager.js'));
check('game-footer.js', html.includes('/game-footer.js'));
check('gz-analytics.js', html.includes('/gz-analytics.js'));
check('GZFooter call', html.includes('GZFooter'));

// 7. Responsive
check('device-width viewport', html.includes('width=device-width'));
check('mobile media query', html.includes('@media'));

// 8. Art assets referenced
check('icon favicon svg', html.includes('data:image/svg+xml'));
check('og:image path', html.includes('/usotatami/og-image.jpg'));

// 9. Game rules in help text
check('rules in help-box', html.includes('1-cell-wide') && html.includes('lies') && html.includes('four corners'));

// Report
const passed = checks.filter(c=>c.pass).length;
const failed = checks.filter(c=>!c.pass);
console.log(`\n=== QA CHECKLIST: Usotatami ===`);
console.log(`Passed: ${passed}/${checks.length}`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach(c=>console.log(`  ✗ ${c.name}`));
} else {
  console.log('ALL CHECKS PASSED ✓');
}
process.exit(failed.length?1:0);
