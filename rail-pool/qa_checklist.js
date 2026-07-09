// qa_checklist.js — Code-level QA checks for the Rail Pool game
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
let pass = 0, fail = 0;
const fails = [];

function check(name, condition) {
  if (condition) {
    pass++;
    console.log(`  PASS: ${name}`);
  } else {
    fail++;
    console.log(`  FAIL: ${name}`);
    fails.push(name);
  }
}

console.log('=== Rail Pool QA Checklist ===\n');

// === Structural checks ===
check('Has <!DOCTYPE html>', html.startsWith('<!DOCTYPE html>'));
check('Has <html lang="en">', html.includes('<html lang="en">'));
check('Has <meta charset="UTF-8">', html.includes('<meta charset="UTF-8">'));
check('Has <meta name="viewport">', html.includes('name="viewport"'));
check('Has <title>Rail Pool', html.includes('<title>Rail Pool'));
check('Has meta description', html.includes('meta name="description"') && html.includes('Rail Pool'));
check('Has meta keywords', html.includes('meta name="keywords"') && html.includes('rail pool'));
check('Has canonical link', html.includes('rel="canonical"'));
check('Has og:image', html.includes('og:image'));
check('Has og:title', html.includes('og:title'));
check('Has og:description', html.includes('og:description'));
check('Has og:url', html.includes('og:url'));
check('Has og:type', html.includes('og:type'));
check('Has twitter:card', html.includes('twitter:card'));

// === JSON-LD blocks ===
check('Has VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('Has FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('Has HowTo JSON-LD', html.includes('"@type":"HowTo"'));
check('Has BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// === Required game functions ===
check('Has AudioEngine class', html.includes('class AudioEngine'));
check('Has Web Audio music (chordProgression)', html.includes('chordProgression'));
check('Has SFX (place/erase/win/hint/error)', html.includes("sfx('place')") && html.includes("sfx('erase')") && html.includes("sfx('win')"));
check('Has drawBoard function', html.includes('function drawBoard()'));
check('Has resizeCanvas function', html.includes('function resizeCanvas()'));
check('Has computeSegments function', html.includes('function computeSegments()'));
check('Has computeViolations function', html.includes('function computeViolations()'));
check('Has isLoopClosed function', html.includes('function isLoopClosed()'));
check('Has checkWin function', html.includes('function checkWin()'));
check('Has showHint function', html.includes('function showHint()'));
check('Has undo function', html.includes('function undo()'));
check('Has localStorage save/load', html.includes('localStorage') && html.includes('railpool-progress'));

// === Game features ===
check('Has 30 levels', html.match(/"levels":\[/g) && html.match(/"levels":\[/g).length === 1);
check('Has tier names (Beginner/Easy/Medium/Hard/Expert)', html.includes('Beginner') && html.includes('Easy') && html.includes('Medium') && html.includes('Hard') && html.includes('Expert'));
check('Has draw mode button', html.includes('id="mode-draw"'));
check('Has erase mode button', html.includes('id="mode-erase"'));
check('Has hint button', html.includes('id="btn-hint"'));
check('Has undo button', html.includes('id="btn-undo"'));
check('Has restart button', html.includes('id="btn-restart"'));
check('Has settings panel', html.includes('id="settings-panel"'));
check('Has win overlay', html.includes('id="win-overlay"'));
check('Has 3-star rating system', html.includes("'\u2605'") || html.includes('stars'));
check('Has level select screen', html.includes('id="level-select-screen"'));
check('Has hint counter (3 hints)', html.includes('hints: 3') || html.includes('state.hints = 3'));
check('Has keyboard support hints', html.includes('key') || html.includes('Keyboard'));

// === Pointer events ===
check('Has mousedown handler', html.includes("addEventListener('mousedown'"));
check('Has mousemove handler', html.includes("addEventListener('mousemove'"));
check('Has touchstart handler', html.includes("addEventListener('touchstart'"));
check('Has touchmove handler', html.includes("addEventListener('touchmove'"));

// === Compliance checks ===
check('NO site-analytics pixel (deprecated)', !html.includes('site-analytics') && !html.includes('analytics.js'));
check('NO 3rd-party trackers', !html.includes('google-analytics') && !html.includes('googletagmanager'));
check('NO adsterra-monetag pixel in HTML', !html.includes('adsterra') || html.indexOf('adsterra') === -1);

// === Level data integrity ===
const m = html.match(/const LEVELS_DATA = (\{[\s\S]*?\});/);
if (m) {
  const data = JSON.parse(m[1]);
  check('Has 30 levels in data', data.levels.length === 30);
  check('All levels have size, regions, clues, solution', data.levels.every(l => l.size && l.regions && l.clues && l.solution_entry && l.solution_exit));
  check('All levels have a tier', data.levels.every(l => l.tier));
  check('All levels have a number', data.levels.every(l => typeof l.number === 'number'));
  check('Numbers are 1..30', data.levels.map(l => l.number).sort((a,b) => a-b).join(',') === Array.from({length: 30}, (_, i) => i + 1).join(','));
  // Tier distribution
  const tiers = {};
  data.levels.forEach(l => tiers[l.tier] = (tiers[l.tier] || 0) + 1);
  check('Tier distribution is 6/6/6/6/6', Object.values(tiers).join(',') === '6,6,6,6,6');
  // Each level's clues should have valid r,c
  check('All clues have valid coords', data.levels.every(l => l.clues.every(c => c.r >= 0 && c.r < l.size[0] && c.c >= 0 && c.c < l.size[1])));
  // Each level's regions is a 2D array matching size
  check('All regions match size', data.levels.every(l => l.regions.length === l.size[0] && l.regions.every(row => row.length === l.size[1])));
  // Each level has at least 3 clues
  check('All levels have >=3 clues', data.levels.every(l => l.clues.length >= 3));
}

// === Icon/OG image refs ===
check('References icon.png', html.includes('icon.png') || html.match(/<link[^>]*icon/i));
check('References og-image.jpg', html.includes('og-image.jpg'));

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
if (fail > 0) {
  console.log('\nFailures:');
  fails.forEach(f => console.log(' - ' + f));
}
process.exit(fail > 0 ? 1 : 0);