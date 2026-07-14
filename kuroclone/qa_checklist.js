// Kuroclone code-level QA checklist
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
let checks = 0, pass = 0, fail = 0;
function chk(name, cond) {
  checks++;
  if (cond) { pass++; /*console.log('  ✓ ' + name);*/ }
  else { fail++; console.log('  ✗ FAIL: ' + name); }
}

console.log('=== Kuroclone QA Checklist ===\n');

// 1. HTML structure
chk('DOCTYPE', /<!DOCTYPE html>/i.test(html));
chk('<html lang="en">', /<html lang="en">/i.test(html));
chk('meta charset UTF-8', /charset=["']?UTF-8/i.test(html));
chk('meta viewport', /name=["']viewport["']/i.test(html));
chk('<title>', /<title>[^<]+<\/title>/i.test(html));
chk('meta description', /name=["']description["']/i.test(html));
chk('canonical link', /rel=["']canonical["']/i.test(html));
chk('og:title', /property=["']og:title["']/i.test(html));
chk('og:description', /property=["']og:description["']/i.test(html));
chk('og:type', /property=["']og:type["']/i.test(html));
chk('og:url', /property=["']og:url["']/i.test(html));
chk('og:image', /property=["']og:image["']/i.test(html));

// 2. JSON-LD blocks
chk('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
chk('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
chk('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));

// 3. Assets
chk('icon.png reference', /icon\.png/.test(html));
chk('og-image reference', /og-image\.jpg/.test(html));
const iconExists = fs.existsSync(__dirname + '/icon.png');
const ogExists = fs.existsSync(__dirname + '/og-image.jpg');
chk('icon.png file exists', iconExists);
chk('og-image.jpg file exists', ogExists);

// 4. Game systems
chk('Canvas element', /<canvas/i.test(html));
chk('checkWin function', /function checkWin/.test(html));
chk('LEVELS array', /LEVELS\s*=/.test(html));
chk('hint system', /hint/i.test(html));
chk('star rating', /star/i.test(html));
chk('level select / menu', /menu|level.?select/i.test(html));
chk('timer', /timer|Timer/i.test(html));
chk('keyboard support', /keydown|addEventListener\(['"]keydown/.test(html));
chk('Web Audio / AudioContext', /AudioContext|playSfx|playSnd|sfx/i.test(html));
chk('localStorage save', /localStorage/.test(html));
chk('touch / pointer events', /pointer|touch/i.test(html));
chk('beforeunload cleanup', /beforeunload|pagehide|visibilitychange/i.test(html));

// 5. Ads / analytics / footer
chk('monetag-manager.js', /monetag-manager\.js/.test(html));
chk('adsterra-manager.js', /adsterra-manager\.js/.test(html));
chk('game-footer.js', /game-footer\.js/.test(html));
chk('gz-analytics.js', /gz-analytics\.js/.test(html));

// 6. 30 levels present in engine
const levelCount = (html.match(/"solution":\[/g) || []).length;
chk('30 levels (solution arrays)', levelCount === 30);

// 7. gz-sr-only H1 for SEO
chk('sr-only / gz-sr-only class', /sr-only|gz-sr-only/.test(html));

// 8. Rules text present
chk('rules / how to play text', /rule|how to play|divide|shade|region/i.test(html));

console.log(`\n=== ${pass}/${checks} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
