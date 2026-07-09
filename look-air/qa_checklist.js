// Comprehensive QA checklist for look-air game
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/look-air/index.html', 'utf8');
const checks = [];
const addCheck = (name, ok, detail = '') => checks.push({name, ok, detail});

addCheck('DOCTYPE html5', /<!DOCTYPE html>/i.test(html));
addCheck('Title tag', /<title>[^<]+<\/title>/.test(html));
addCheck('Meta description', /<meta\s+name="description"/i.test(html));
addCheck('Meta keywords', /<meta\s+name="keywords"/i.test(html));
addCheck('Canonical URL', /<link\s+rel="canonical"/i.test(html));
addCheck('og:title', /property="og:title"/i.test(html));
addCheck('og:description', /property="og:description"/i.test(html));
addCheck('og:image', /property="og:image"/i.test(html));
addCheck('twitter:card', /name="twitter:card"/i.test(html));
addCheck('JSON-LD VideoGame', /"@type"\s*:\s*"VideoGame"/.test(html));
addCheck('JSON-LD FAQPage', /"@type"\s*:\s*"FAQPage"/.test(html));
addCheck('JSON-LD HowTo', /"@type"\s*:\s*"HowTo"/.test(html));
addCheck('JSON-LD BreadcrumbList', /"@type"\s*:\s*"BreadcrumbList"/.test(html));
addCheck('gz-sr-only H1', /<h1\s+class="gz-sr-only"/.test(html));
addCheck('icon.png link', /\/look-air\/icon\.png/.test(html));
addCheck('og-image.jpg meta', /\/look-air\/og-image\.jpg/.test(html));
addCheck('Levels data injected', /__LEVELS_DATA_JSON__/.test(html) === false);
addCheck('LEVELS const defined', /const LEVELS = LEVELS_DATA_FROM_GEN/.test(html) || /window\.LEVELS/.test(html));
addCheck('Web Audio API usage', /AudioContext|webkitAudioContext/.test(html));
addCheck('LocalStorage save', /localStorage\.setItem/.test(html));
addCheck('Hint system', /useHint/.test(html) && /hints/.test(html));
addCheck('3 block size buttons', /data-size="1"/.test(html) && /data-size="2"/.test(html) && /data-size="3"/.test(html));
addCheck('Erase mode button', /id="erase-btn"/.test(html));
addCheck('Check button', /id="check-btn"/.test(html));
addCheck('Level select screen', /id="level-select-screen"/.test(html));
addCheck('Settings panel', /id="settings-panel"/.test(html));
addCheck('Win overlay', /id="win-overlay"/.test(html));
addCheck('Keyboard handler', /keydown/.test(html));
addCheck('Touch handlers', /touchstart|touchmove|touchend/.test(html));
addCheck('Mouse handlers', /mousedown|mousemove|mouseup/.test(html));
addCheck('Restart function', /restartLevel/.test(html));
addCheck('No external JS deps', !/<script\s+src=/.test(html));
addCheck('No console.log in production', !/console\.log/.test(html));
addCheck('Music ambient BGM', /Cmaj7|Am7|Fmaj7|ambient/i.test(html) || /chord|progression/i.test(html));
addCheck('SFX place/erase/hint/win', /playPlace/.test(html) && /playErase/.test(html) && /playHint/.test(html) && /playWin/.test(html));

// Check levels data validity
const m = html.match(/const __LEVELS_DATA_SCRIPT__ = `([^`]+)`/);
if (m) {
  const LEVELS = JSON.parse(m[1]);
  addCheck('30 levels', LEVELS.length === 30, `${LEVELS.length}`);
  const sizes = new Set(LEVELS.map(L => `${L.size[0]}x${L.size[1]}`));
  addCheck('5 distinct sizes', sizes.size === 5, [...sizes].join(', '));
  addCheck('All have solution field', LEVELS.every(L => Array.isArray(L.solution)));
  addCheck('All have numbers field', LEVELS.every(L => Array.isArray(L.numbers)));
  addCheck('Solutions are square', LEVELS.every(L => L.solution.every(r => r.length === L.size[1]) && L.solution.length === L.size[0]));
} else {
  addCheck('Levels data parsed', false);
}

// Check no site-analytics pixel
addCheck('No deprecated site-analytics', !/site-analytics\.js/.test(html));

// Check icon and og-image files exist
addCheck('icon.png exists', fs.existsSync('/home/msdn/gamezipper.com/look-air/icon.png'));
addCheck('og-image.jpg exists', fs.existsSync('/home/msdn/gamezipper.com/look-air/og-image.jpg'));
const iconSize = fs.statSync('/home/msdn/gamezipper.com/look-air/icon.png').size;
const ogSize = fs.statSync('/home/msdn/gamezipper.com/look-air/og-image.jpg').size;
addCheck('icon.png > 1KB', iconSize > 1024, `${iconSize} bytes`);
addCheck('og-image.jpg > 5KB', ogSize > 5120, `${ogSize} bytes`);

let pass = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
  if (c.ok) pass++;
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(pass === checks.length ? 0 : 1);