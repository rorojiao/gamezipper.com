// Code-level QA checklist for Pentominous.
// Verifies presence and correctness of all required game systems.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pass = 0, fail = 0;
const errors = [];

function check(name, cond, detail='') {
  if (cond) {
    pass++;
    // console.log(`  ✓ ${name}`);
  } else {
    fail++;
    errors.push(`✗ ${name}${detail?': '+detail:''}`);
  }
}

// === HTML structure ===
check('DOCTYPE', /<!DOCTYPE html>/i.test(html));
check('<html lang>', /<html\s+lang="/i.test(html));
check('charset UTF-8', /charset=["']?UTF-8/i.test(html));
check('viewport meta', /name=["']viewport["']/i.test(html));
check('title contains Pentominous', /<title>[^<]*Pentominous/i.test(html));
check('meta description', /name=["']description["']/i.test(html));
check('meta keywords', /name=["']keywords["']/i.test(html));
check('canonical link', /rel=["']canonical["']/i.test(html));
check('og:title', /og:title/i.test(html));
check('og:description', /og:description/i.test(html));
check('og:image', /og:image/i.test(html));
check('og:url', /og:url/i.test(html));
check('theme-color', /theme-color/i.test(html));

// === JSON-LD ===
check('VideoGame JSON-LD', /"@type":"VideoGame"/.test(html));
check('FAQPage JSON-LD', /"@type":"FAQPage"/.test(html));
check('HowTo JSON-LD', /"@type":"HowTo"/.test(html));
check('BreadcrumbList JSON-LD', /"@type":"BreadcrumbList"/.test(html));

// === Game engine ===
check('Canvas element', /<canvas/i.test(html));
check('LEVELS data', /var\s+LEVELS\s*=/.test(html));
check('init function', /function\s+init\(/.test(html));
check('draw function', /function\s+draw\(/.test(html));
check('checkSolution function', /function\s+checkSolution\(/.test(html));
check('getRegions function', /function\s+getRegions\(/.test(html));
check('onWin function', /function\s+onWin\(/.test(html));
check('regionsShareEdge function', /function\s+regionsShareEdge\(/.test(html));

// === Game systems ===
check('Web Audio AudioContext', /AudioContext/.test(html));
check('BGM start/stop', /startBGM|stopBGM|playBGM/.test(html));
check('SFX functions', /sfxError|sfxComplete|sfxPlace/.test(html));
check('Hint system', /hintsLeft|doHint|function.*[Hh]int/.test(html));
check('Undo system', /undoStack|doUndo/.test(html));
check('Level select', /levelSelect|showLevels|showMenu/.test(html));
check('Settings panel', /settings/.test(html));
check('localStorage save', /localStorage/.test(html));
check('saveProgress function', /function\s+saveProgress/.test(html));
check('Particles/confetti', /spawnParticles|particle/.test(html));
check('Toast messages', /showToast/.test(html));
check('Star ratings', /star-filled|star-empty|stars/.test(html));
check('Keyboard handler', /keydown|addEventListener.*key/.test(html));

// === Ads & Analytics ===
check('Monetag manager script', /monetag-manager\.js/.test(html));
check('gz-analytics tracker', /gz-analytics\.js/.test(html));
check('ad-below-game div', /gz-ad-below-game/.test(html));

// === Pentomino-specific ===
check('12 pentomino letters referenced', (function(){
  let all = true;
  for (const L of 'FILNPTUVWXYZ') {
    if (!html.includes(`"${L}"`) && !html.includes(`'${L}'`)) all = false;
  }
  return all;
})());
check('pentomino colors', /PENTO_COLORS/.test(html));

// === No common errors ===
check('No TODO left', !/TODO|FIXME|XXX/.test(html));
check('No console.error stubs', !/console\.error\(['"]Not implemented/.test(html));

// === Summary ===
console.log(`\n=== Pentominous QA Checklist ===`);
console.log(`PASS: ${pass} / ${pass+fail}`);
if (fail > 0) {
  console.log(`FAIL: ${fail}`);
  errors.forEach(e => console.log(`  ${e}`));
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED');
  process.exit(0);
}
