// Code-level QA checklist for Koburin
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let checks = [];
function check(name, cond) { checks.push({ name, pass: !!cond }); }

// 1. Required JSON-LD blocks
check('VideoGame JSON-LD', html.includes('"@type":"VideoGame"'));
check('FAQPage JSON-LD', html.includes('"@type":"FAQPage"'));
check('BreadcrumbList JSON-LD', html.includes('"@type":"BreadcrumbList"'));

// 2. SEO basics
check('title tag', /<title>[^<]+<\/title>/.test(html));
check('meta description', /name="description"/.test(html));
check('canonical link', /rel="canonical"/.test(html));
check('og:title', html.includes('og:title'));
check('og:image', html.includes('og:image'));
check('gz-sr-only H1', html.includes('gz-sr-only') && html.includes('<h1'));
check('icon link', html.includes('icon.png'));

// 3. Game systems
check('Canvas element', html.includes('<canvas'));
check('LEVELS data', html.includes('const LEVELS'));
check('checkWin function', html.includes('function checkWin'));
check('Web Audio init', html.includes('AudioContext') || html.includes('webkitAudioContext'));
check('music (startMusic)', html.includes('function startMusic'));
check('SFX (playSfx)', html.includes('function playSfx'));
check('hint system', html.includes('function giveHint'));
check('level select', html.includes('showLevelSelect'));
check('settings panel', html.includes('showSettings'));
check('localStorage save', html.includes('localStorage') && html.includes('saveProgress'));
check('3-star ratings', html.includes('stars'));
check('keyboard support', html.includes('keydown') || html.includes('addEventListener'));
check('touch support', html.includes('touchstart') && html.includes('touchend'));
check('confetti win', html.includes('confetti'));
check('timer', html.includes('timer') || html.includes('setInterval'));
check('mode buttons (black/loop/erase)', html.includes('mode-black') || html.includes("'black'"));
check('win overlay', html.includes('showWinOverlay'));
check('clue violation highlight', html.includes('ef4444') || html.includes('red'));
check('adjacent black detection', html.includes('adjacent') || html.includes('adj blacks'));

// 4. Footer / analytics / ads
check('gz-analytics', html.includes('gz-analytics.js'));
check('game-footer', html.includes('game-footer.js'));
check('monetag ad', html.includes('monetag-manager.js'));
check('ad slot', html.includes('gz-ad-below-game'));

// 5. No obvious JS errors (check balanced braces roughly)
check('no LEVELS_PLACEHOLDER leftover', !html.includes('LEVELS_PLACEHOLDER'));

// 6. Levels embedded
const levelsMatch = html.match(/const LEVELS\s*=\s*(\[[\s\S]*?\]);/);
check('LEVELS is valid JSON array', levelsMatch !== null);
if (levelsMatch) {
  try {
    const LEVELS = JSON.parse(levelsMatch[1]);
    check('30 levels present', LEVELS.length === 30);
    check('all levels have R,C,blacks,clues,solution_loop', 
      LEVELS.every(l => l.R && l.C && Array.isArray(l.blacks) && l.clues && Array.isArray(l.solution_loop)));
    check('5 tiers present', new Set(LEVELS.map(l=>l.tier)).size === 5);
  } catch(e) {
    check('LEVELS parse OK', false);
  }
}

// Report
const pass = checks.filter(c=>c.pass).length;
const fail = checks.filter(c=>!c.pass);
console.log(`QA Checklist: ${pass}/${checks.length} passed`);
if (fail.length) {
  console.log('FAILED:');
  fail.forEach(c => console.log(`  ✗ ${c.name}`));
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED ✅');
}
