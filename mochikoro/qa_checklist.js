#!/usr/bin/env node
// Mochikoro QA checklist — code-level checks
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const levels = JSON.parse(fs.readFileSync(path.join(dir, 'levels.json'), 'utf8'));

const results = [];
const log = (name, ok, info='') => {
  results.push({name, ok, info});
  console.log(`${ok?'✅':'❌'} ${name}${info?' — '+info:''}`);
};

// 1. HTML structure
log('HTML has DOCTYPE', html.startsWith('<!DOCTYPE html>'));
log('HTML has <html lang="en">', /<html\s+lang="en">/.test(html));
log('HTML has <title>', /<title>/.test(html));
log('Title says "Mochikoro"', /<title>[^<]*Mochikoro[^<]*<\/title>/.test(html));

// 2. SEO JSON-LD
log('VideoGame JSON-LD present', /"@type":"VideoGame"/.test(html));
log('FAQPage JSON-LD present', /"@type":"FAQPage"/.test(html));
log('BreadcrumbList JSON-LD present', /"@type":"BreadcrumbList"/.test(html));
log('canonical link', /rel="canonical"/.test(html));
log('og:url', /og:url/.test(html));
log('og:image', /og:image/.test(html));
log('og:title', /og:title/.test(html));
log('og:description', /og:description/.test(html));
log('gz-sr-only H1', /class="gz-sr-only">[^<]*Mochikoro[^<]*<\/h1>/.test(html));

// 3. CSS / theme
log('CSS has --accent variable', /--accent:/.test(html));
log('CSS has dark background', /body\{background:var\(--bg\)/.test(html));

// 4. Art assets
log('icon.png exists', fs.existsSync(path.join(dir, 'icon.png')));
log('og-image.jpg exists', fs.existsSync(path.join(dir, 'og-image.jpg')));
log('icon link present', /rel="icon"/.test(html));

// 5. Game systems (engine code)
log('has LEVELS const', /const LEVELS = /.test(html));
log('has checkWin function', /function checkWin/.test(html));
log('has computeRegionMap', /function computeRegionMap/.test(html));
log('has useHint function', /function useHint/.test(html));
log('has loadLevel function', /function loadLevel/.test(html));
log('has startTimer function', /function startTimer/.test(html));
log('has setMode function', /function setMode/.test(html));
log('has clearBoard function', /function clearBoard/.test(html));

// 6. Audio system
log('Web Audio API used', /AudioContext/.test(html));
log('has playSfx', /function playSfx/.test(html));
log('has startMusic', /function startMusic/.test(html));
log('has stopMusic', /function stopMusic/.test(html));
log('localStorage usage', /localStorage/.test(html));

// 7. UI elements
log('Canvas element', /<canvas[^>]*id="board"/.test(html));
log('Place/Erase buttons', /btn-shade/.test(html) && /btn-erase/.test(html));
log('Hint button', /btn-hint/.test(html));
log('Check button', /btn-check/.test(html));
log('Clear button', /btn-clear/.test(html));
log('Levels button', /btn-menu/.test(html));
log('Settings toggle', /toggle-music/.test(html) && /toggle-sfx/.test(html));

// 8. Keyboard support
log('Keyboard listener', /document.addEventListener\('keydown'/.test(html));
log('Has hint key', /e\.key === '[hH]'.*useHint/.test(html));
log('Has enter check', /e\.key === 'Enter'.*checkWin/.test(html));

// 9. Level count
log('30 levels', levels.length === 30, `count=${levels.length}`);

// 10. Tier distribution
const tierCounts = {};
levels.forEach(l => tierCounts[l.tier] = (tierCounts[l.tier] || 0) + 1);
const expectedTiers = {Beginner: 6, Easy: 6, Medium: 6, Hard: 6, Expert: 6};
let tiersOk = true;
for (const t in expectedTiers) if (tierCounts[t] !== expectedTiers[t]) tiersOk = false;
log('Tier distribution (6/6/6/6/6)', tiersOk, JSON.stringify(tierCounts));

// 11. Levels all have required fields
const allFieldsOk = levels.every(l => 'R' in l && 'C' in l && 'clues' in l && 'solution_black' in l && 'tier' in l && 'level' in l);
log('All levels have R/C/clues/solution_black/tier/level', allFieldsOk);

// 12. Each level has at least 1 clue
const allHaveClues = levels.every(l => Object.keys(l.clues).length >= 1);
log('Every level has clues', allHaveClues);

// 13. Levels validation (3-method)
const execSync = require('child_process').execSync;
let nodePass = false;
try {
  const out = execSync('node verify_independent.js 2>&1', {cwd: dir}).toString();
  nodePass = /30\/30 PASS/.test(out);
  log('verify_independent.js 30/30 PASS', nodePass);
} catch(e) {
  log('verify_independent.js runs', false, e.message);
}

let enginePass = false;
try {
  const out = execSync('node verify_engine.js 2>&1', {cwd: dir}).toString();
  enginePass = /30\/30 PASS/.test(out);
  log('verify_engine.js 30/30 PASS', enginePass);
} catch(e) {
  log('verify_engine.js runs', false, e.message);
}

// 14. Footer scripts
log('game-footer.js script tag', /game-footer\.js/.test(html));
log('gz-analytics.js script tag', /gz-analytics\.js/.test(html));
log('monetag-manager.js script tag', /monetag-manager\.js/.test(html));
log('adsterra-manager.js script tag', /adsterra-manager\.js/.test(html));

// 15. Win flow
log('win() function defined', /function win\(\)/.test(html));
log('launchConfetti() defined', /function launchConfetti/.test(html));
log('Win overlay HTML', /id="win-overlay"/.test(html));

// Summary
const passed = results.filter(r => r.ok).length;
const total = results.length;
console.log(`\n=== QA RESULT: ${passed}/${total} PASS ===`);
process.exit(passed === total ? 0 : 1);
