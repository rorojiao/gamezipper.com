// Comprehensive QA checklist for wagiri game
const fs = require('fs');

const html = fs.readFileSync('/home/msdn/gamezipper.com/wagiri/index.html', 'utf8');
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
addCheck('icon.png link', /\/wagiri\/icon\.png/.test(html));
addCheck('og-image.jpg meta', /\/wagiri\/og-image\.jpg/.test(html));
addCheck('Levels data injected', /__LEVELS_DATA_JSON__/.test(html) === false);
addCheck('LEVELS const defined', /window\.LEVELS/.test(html));
addCheck('Web Audio API usage', /AudioContext|webkitAudioContext/.test(html));
addCheck('LocalStorage save', /localStorage\.setItem/.test(html));
addCheck('Hint system', /hint-btn/.test(html) && /hints/.test(html));
addCheck('Check button', /id="check-btn"/.test(html));
addCheck('Restart button', /id="restart-btn"/.test(html));
addCheck('Level select screen', /id="level-select-screen"/.test(html));
addCheck('Settings panel', /id="settings-panel"/.test(html));
addCheck('Win overlay', /id="win-overlay"/.test(html));
addCheck('Keyboard handler', /keydown/.test(html));
addCheck('Touch handlers', /touchstart|touchmove|touchend/.test(html));
addCheck('Mouse handlers', /mousedown|mousemove|mouseup/.test(html));
addCheck('No external JS deps', !/<script\s+src=/.test(html));
addCheck('No console.log in production', !/console\.log/.test(html));
addCheck('Music BGM (chord progression)', /bgmChords/.test(html));
addCheck('SFX draw/erase/hint/win', /'draw'/.test(html) && /'erase'/.test(html) && /'hint'/.test(html) && /'win'/.test(html));

// Check levels data validity
const m = html.match(/const __LEVELS_DATA_SCRIPT__ = `([^`]+)`/);
if (m) {
  const LEVELS = JSON.parse(m[1]);
  addCheck('30 levels', LEVELS.length === 30, `${LEVELS.length}`);
  const sizes = new Set(LEVELS.map(L => `${L.size[0]}x${L.size[1]}`));
  addCheck('5 distinct sizes', sizes.size === 5, [...sizes].join(', '));
  addCheck('All have circles field', LEVELS.every(L => Array.isArray(L.circles) && L.circles.length >= 4 && L.circles.length % 2 === 0));
  addCheck('All have edges field', LEVELS.every(L => Array.isArray(L.edges) && L.edges.length > 0));
  addCheck('All circles in grid bounds', LEVELS.every(L => L.circles.every(([r, c]) => r >= 0 && r < L.size[0] && c >= 0 && c < L.size[1])));
  addCheck('All edges in grid bounds', LEVELS.every(L => L.edges.every(e => e[0] >= 0 && e[0] < L.size[0] && e[1] >= 0 && e[1] < L.size[1] && e[2] >= 0 && e[2] < L.size[0] && e[3] >= 0 && e[3] < L.size[1])));
  addCheck('All edges are orth adjacent', LEVELS.every(L => L.edges.every(e => (e[0] === e[2] && Math.abs(e[1] - e[3]) === 1) || (e[1] === e[3] && Math.abs(e[0] - e[2]) === 1))));
} else {
  addCheck('Levels data parsed', false);
}

// Check no deprecated site-analytics pixel
addCheck('No deprecated site-analytics', !/site-analytics\.js/.test(html));

// Check icon and og-image files exist
addCheck('icon.png exists', fs.existsSync('/home/msdn/gamezipper.com/wagiri/icon.png'));
addCheck('og-image.jpg exists', fs.existsSync('/home/msdn/gamezipper.com/wagiri/og-image.jpg'));
const iconSize = fs.statSync('/home/msdn/gamezipper.com/wagiri/icon.png').size;
const ogSize = fs.statSync('/home/msdn/gamezipper.com/wagiri/og-image.jpg').size;
addCheck('icon.png > 1KB', iconSize > 1024, `${iconSize} bytes`);
addCheck('og-image.jpg > 5KB', ogSize > 5120, `${ogSize} bytes`);

let pass = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
  if (c.ok) pass++;
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(pass === checks.length ? 0 : 1);