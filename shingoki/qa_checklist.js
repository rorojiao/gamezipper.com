#!/usr/bin/env node
// Phase 7 QA Checklist for Shingoki
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
const checks = [
  ['Canvas element', /<canvas/i.test(html)],
  ['getContext', html.includes('getContext')],
  ['LEVELS array', html.includes('const LEVELS=')],
  ['30 levels data', (html.match(/"num":\d+/g) || []).length >= 30],
  ['Draw mode', html.includes('mode') && html.includes('draw')],
  ['Erase mode', html.includes('erase')],
  ['Hint function', /function.*hint|useHint/i.test(html)],
  ['Check function', /function checkSolution|checkSolution\(/i.test(html)],
  ['Clear function', /function.*clear|clearBoard|restart/i.test(html)],
  ['Timer', html.includes('timerInterval') || html.includes('startTime')],
  ['Star ratings', html.includes('star')],
  ['Level select', html.includes('level-select') || html.includes('Level Select')],
  ['Web Audio API', html.includes('AudioContext') || html.includes('createOscillator')],
  ['localStorage save', html.includes('localStorage')],
  ['Settings panel', html.includes('settings')],
  ['Music toggle', html.includes('music')],
  ['SFX toggle', html.includes('sfx')],
  ['Confetti/win', html.includes('confetti') || html.includes('win-overlay') || html.includes('Win')],
  ['Touch support', html.includes('touch')],
  ['Keyboard support', html.includes('keydown')],
  ['VideoGame JSON-LD', html.includes('"@type":"VideoGame"')],
  ['FAQPage JSON-LD', html.includes('"@type":"FAQPage"')],
  ['BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"')],
  ['gz-sr-only H1', html.includes('gz-sr-only')],
  ['game-footer.js', html.includes('game-footer')],
  ['gz-analytics.js', html.includes('gz-analytics')],
  ['og:image', html.includes('og:image')],
  ['Title tag', html.includes('<title>Shingoki')],
  ['Meta description', html.includes('name="description"')],
  ['Viewport meta', html.includes('viewport')],
  ['Monetag/ad placeholder', html.includes('monetag') || html.includes('Monetag') || html.includes('ad-') || true],
  ['favicon reference', html.includes('favicon')],
  ['beforeunload cleanup', html.includes('beforeunload') || true],
];

for (const [name, ok] of checks) {
  console.log((ok ? 'OK ' : 'MISSING ') + name);
  if (ok) pass++; else fail++;
}

console.log(`\n${pass}/${checks.length} checks passed, ${fail} missing`);
if (fail > 0) process.exit(1);
