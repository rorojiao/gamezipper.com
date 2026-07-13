#!/usr/bin/env node
// Kin-Kon-Kan commercial-quality gate. Every check reflects actual source markers.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8'));
const checks = [
  ['HTML5 document', html.includes('<!DOCTYPE html>')],
  ['Responsive viewport', /name="viewport"/.test(html)],
  ['Canonical URL', html.includes('https://gamezipper.com/kinkonkan/')],
  ['VideoGame JSON-LD', html.includes('"@type":"VideoGame"')],
  ['FAQ JSON-LD', html.includes('"@type":"FAQPage"')],
  ['Breadcrumb JSON-LD', html.includes('"@type":"BreadcrumbList"')],
  ['OG image', html.includes('/kinkonkan/og-image.jpg')],
  ['Icon metadata', html.includes('/kinkonkan/icon.png')],
  ['Accessible H1', html.includes('<h1 class="gz-sr-only">')],
  ['Canvas engine', html.includes('getContext(\'2d\')')],
  ['Pointer input', html.includes("addEventListener('pointerdown'")],
  ['Keyboard input', html.includes("addEventListener('keydown'")],
  ['Touch-action CSS', html.includes('touch-action:none')],
  ['Mobile 48px targets', html.includes('min-height:48px')],
  ['Official one-mirror-per-room win rule', html.includes('roomCounts[rid] !== 1')],
  ['Beam exit validation', html.includes('exitOk') && html.includes('countOk')],
  ['All mirrors hit validation', html.includes('missing.length > 0')],
  ['30-level system', levels.length === 30],
  ['Five difficulty tiers', new Set(levels.map(l => l.tier)).size === 5],
  ['Level select', html.includes('function buildLevelSelect')],
  ['Hints', html.includes('function useHint') && html.includes('hintsLeft')],
  ['Stars', html.includes('function computeStars')],
  ['Progress persistence', html.includes('localStorage') && html.includes("lsSet('stars'")],
  ['Settings persistence', html.includes("lsSet('sfx'") && html.includes("lsSet('music'")],
  ['BGM lifecycle', html.includes('function startBGM') && html.includes('function stopBGM')],
  ['Six-plus SFX paths', (html.match(/case '\w+'/g) || []).length >= 6],
  ['Unload cleanup', html.includes("beforeunload', cleanup")],
  ['Confetti win feedback', html.includes('function fireConfetti')],
  ['No zombie 1ktower endpoint', !html.includes('1ktower.com')],
  ['Ad manager integration', html.includes('/monetag-manager.js') && html.includes('/adsterra-manager.js')],
  ['Ad container', html.includes('id="gz-ad-below-game"')],
  ['Game footer integration', html.includes('/game-footer.js')],
  ['Analytics integration', html.includes('/gz-analytics.js')],
  ['No TODO/FIXME', !/TODO|FIXME/.test(html)],
  ['No console.log', !html.includes('console.log')],
  ['Commercial file size', html.length > 40000],
];
let pass = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (ok) pass++;
}
console.log(`SUMMARY: ${pass}/${checks.length} PASS`);
process.exit(pass === checks.length ? 0 : 1);
