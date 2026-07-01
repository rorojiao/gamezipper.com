// Phase 7: Comprehensive QA validation for vortex-valve
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/vortex-valve/index.html', 'utf8');

// Extract main game script (largest script block)
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
let blocks = [];
scriptMatch.forEach((s, i) => {
  const code = s.replace(/<\/?script[^>]*>/g, '');
  if (code.length > 0) blocks.push({idx: i, code, len: code.length});
});
console.log('Script blocks found:', blocks.length);
blocks.forEach(b => console.log(`  Block ${b.idx}: ${b.len} chars`));

// Find main game script (largest)
const main = blocks.reduce((a, b) => b.len > a.len ? b : a);
console.log('\nMain game script:', main.len, 'chars');

// JS syntax check
try { new Function(main.code); console.log('JS SYNTAX: OK'); }
catch(e) { console.log('JS ERROR:', e.message); process.exit(1); }

// JSON-LD validation
const jsonldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
if (jsonldMatches) {
  jsonldMatches.forEach((m, i) => {
    const json = m.replace(/<script[^>]*>|<\/script>/g, '');
    try { JSON.parse(json); console.log(`JSON-LD ${i+1}: OK`); }
    catch(e) { console.log(`JSON-LD ${i+1}: ERROR -`, e.message); }
  });
}

// Feature checklist
const checks = [
  ['30 LEVELS', /"K":\d+/.test(html) || html.includes('{K:2')],
  ['Level count = 30', (html.match(/{K:\d+,N:\d+,o:\[/g) || []).length === 30],
  ['Canvas', html.includes('<canvas')],
  ['getContext', html.includes('getContext')],
  ['requestAnimationFrame', html.includes('requestAnimationFrame')],
  ['cancelAnimationFrame', html.includes('cancelAnimationFrame')],
  ['Pointer events', html.includes('pointerdown')],
  ['Touch action', html.includes('touch-action')],
  ['AudioContext', html.includes('AudioContext')],
  ['Audio close', html.includes('audioCtx.close')],
  ['BGM start+stop', html.includes('startBGM') && html.includes('stopBGM')],
  ['Sound toggle', html.includes('toggleSound')],
  ['Music toggle', html.includes('toggleMusic')],
  ['localStorage', html.includes('localStorage')],
  ['Undo', html.includes('undoMove')],
  ['Reset', html.includes('resetLevel')],
  ['Hint', html.includes('nextHint')],
  ['Win condition', html.includes('checkWin')],
  ['Star rating', html.includes('stars')],
  ['Level select', html.includes('showMenu')],
  ['Cleanup function', html.includes('function cleanup')],
  ['beforeunload', html.includes('beforeunload')],
  ['visibilitychange', html.includes('visibilitychange')],
  ['Analytics', html.includes('site-analytics')],
  ['Canonical', html.includes('canonical')],
  ['OG title', html.includes('og:title')],
  ['JSON-LD VideoGame', html.includes('VideoGame')],
  ['JSON-LD FAQPage', html.includes('FAQPage')],
  ['JSON-LD BreadcrumbList', html.includes('BreadcrumbList')],
  ['Monetag manager', html.includes('monetag-manager')],
  ['Game footer', html.includes('game-footer')],
  ['Dark theme', html.includes('#080c18') || html.includes('#0a0e1a')],
  ['user-select', html.includes('user-select:none')],
  ['overflow touch-action', html.includes('touch-action:none')],
  ['No -webkit-text-stroke', !html.includes('-webkit-text-stroke')],
  ['Tier names', html.includes('Master')],
  ['File size > 20KB', html.length > 20000],
  ['Single file DOCTYPE', html.includes('<!DOCTYPE html>')],
  ['Linked valves', html.includes('linkedMap')],
  ['Modular arithmetic', html.includes('mod(')],
  ['Particle effects', html.includes('particles')],
];

let pass = 0, fail = 0;
checks.forEach(c => {
  console.log((c[1] ? 'OK   ' : 'FAIL ') + c[0]);
  c[1] ? pass++ : fail++;
});
console.log('\n' + pass + '/' + checks.length + ' passed' + (fail ? ' (' + fail + ' FAILED)' : ''));

// Level data validation - verify all levels parse
const levelMatch = html.match(/const LEVELS=\[([\s\S]*?)\];/);
if (levelMatch) {
  try {
    const LEVELS = JSON.parse('[' + levelMatch[1] + ']');
    console.log('\nLevel data: ' + LEVELS.length + ' levels loaded');
    LEVELS.forEach((lv, i) => {
      if (!lv.K || !lv.N || !lv.o || lv.o.length !== lv.K) {
        console.log('  ERROR L' + (i+1) + ': invalid structure');
      }
    });
    // Verify tier distribution
    const tierRanges = [[0,5],[5,10],[10,15],[15,20],[20,25],[25,30]];
    tierRanges.forEach((r, t) => {
      const tierLevels = LEVELS.slice(r[0], r[1]);
      const hasLinks = tierLevels.some(l => l.l && l.l.length > 0);
      console.log('  Tier ' + (t+1) + ' (L' + (r[0]+1) + '-L' + r[1] + '): K=' + tierLevels[0].K + ' N=' + tierLevels[0].N + ' links=' + (hasLinks ? 'yes' : 'no'));
    });
  } catch(e) {
    console.log('Level parse error:', e.message);
  }
}
