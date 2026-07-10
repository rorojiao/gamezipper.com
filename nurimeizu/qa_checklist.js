// QA checklist for Nurimeizu
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = {
  'HTML has DOCTYPE': html.startsWith('<!DOCTYPE html>'),
  'Has lang=en': html.includes('<html lang="en">'),
  'Has viewport meta': html.includes('viewport'),
  'Has title with Nurimeizu': html.includes('<title>Nurimeizu'),
  'Has meta description': html.includes('name="description"'),
  'Has canonical link': html.includes('rel="canonical"'),
  'Has og:title': html.includes('og:title'),
  'Has og:image': html.includes('og:image'),
  'Has og:url': html.includes('og:url'),
  'Has twitter:card': html.includes('twitter:card'),
  'Has favicon': html.includes('rel="icon"'),
  'Has VideoGame JSON-LD': html.includes('"@type":"VideoGame"'),
  'Has FAQPage JSON-LD': html.includes('"@type":"FAQPage"'),
  'Has HowTo JSON-LD': html.includes('"@type":"HowTo"'),
  'Has BreadcrumbList JSON-LD': html.includes('"@type":"BreadcrumbList"'),
  'Has Canvas element': html.includes('<canvas'),
  'Has LEVELS data': html.includes('const LEVELS'),
  'Has checkSolution function': html.includes('function checkSolution'),
  'Has drawBoard function': html.includes('function drawBoard'),
  'Has handlePaint function': html.includes('function handlePaint'),
  'Has Web Audio init': html.includes('AudioContext'),
  'Has music chord progression': html.includes('chords'),
  'Has SFX functions': html.includes('sfxPaint') && html.includes('sfxWin'),
  'Has hint system': html.includes('function giveHint'),
  'Has level select': html.includes('buildLevelGrid'),
  'Has win overlay': html.includes('win-overlay'),
  'Has level overlay': html.includes('level-overlay'),
  'Has settings panel': html.includes('settings-panel'),
  'Has toast': html.includes('showToastMsg'),
  'Has confetti': html.includes('confetti'),
  'Has keyboard support': html.includes('addEventListener("keydown"'),
  'Has touch support': html.includes('touchstart'),
  'Has localStorage save': html.includes('localStorage'),
  'Has star ratings': html.includes('stars'),
  'Has 30 levels (LEVELS array)': (html.match(/"num":\d+/g) || []).length >= 30,
  'No eval() usage': !html.includes('eval('),
  'No external scripts': !html.includes('<script src='),
  'No console.log': !html.includes('console.log'),
  ' gz-sr-only H1': html.includes('gz-sr-only'),
};

let pass = 0, fail = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log((ok ? '✅' : '❌') + ' ' + name);
  if (ok) pass++; else fail++;
}

console.log(`\n${pass}/${pass+fail} checks passed`);
process.exit(fail > 0 ? 1 : 0);
