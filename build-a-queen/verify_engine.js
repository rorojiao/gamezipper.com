#!/usr/bin/env node
/**
 * build-a-queen — deterministic level verifier (NEW for sweep 85)
 *
 * Strategy: extract the level generator (5 themes × 6 levels = 30),
 * verify save schema, and check for the 2026-07-17 build-a-queen P0 pitfall
 * (writeSave() must set save.v=1).
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [];
function check(name, ok, msg) { checks.push({name, ok, msg: msg || ''}); }

// 1. Levels definition: 5 themes × 6 levels = 30 levels
const levelsMatch = html.match(/var levels=[];[\s\S]*?for\(var t=0;t<5;t\+\+\)\{[\s\S]*?for\(var l=0;l<6;l\+\+\)\{[\s\S]*?levels\.push\(\{[^}]*\}\)\s*\}\s*\}/);
check('30 levels defined', /t\*6\+l/.test(html) && /for\(var t=0;t<5;t\+\+\)/.test(html) && /for\(var l=0;l<6;l\+\+\)/.test(html));

// 2. Each level has theme, level, index, gates, id
check('level shape', /levels\.push\(\{theme:\s*t,level:\s*l,index:\s*t\*6\+l,gates:[\s\S]*?id:\s*t\*6\+l\}\)/.test(html));

// 3. Save schema: writeSave sets save.v=1 (Pitfall #40 fix verified)
const writeSave = html.match(/function writeSave\(\)\{[\s\S]*?\}/);
check('writeSave sets save.v=1', writeSave && /save\.v\s*=\s*1/.test(writeSave[0]));

// 4. Save schema: loadSave has d.v===1 guard
const loadSave = html.match(/function loadSave\(\)\{[\s\S]*?\}/);
check('loadSave has d.v===1 guard', loadSave && /d\.v\s*===\s*1/.test(loadSave[0]));

// 5. SAVE_KEY exists
check('SAVE_KEY defined', /var SAVE_KEY\s*=\s*['"]/.test(html));

// 6. Game state machine: 6 screens
check('6 screens', /title.*levels.*play.*result.*tutorial.*shop/.test(html));

// 7. Game logic functions
['drawTitle','renderLevelGrid','renderShop','startLevel','chooseGate','drawRunScene','drawResultScene','showResult'].forEach(fn => {
  check(`${fn} defined`, new RegExp('function ' + fn + '\\b').test(html));
});

// 8. Catwalk character rendering
check('drawCharacter defined', /function drawCharacter/.test(html));

// 9. Site chrome
check('monetag-manager.js', /monetag-manager\.js/.test(html));
check('gz-ad-below-game', /gz-ad-below-game/.test(html));
check('game-footer.js', /game-footer\.js/.test(html));

// 10. Audio + music
check('initAudio/audioCtx', /AudioContext|webkitAudioContext/.test(html));
check('startMusic', /function startMusic/.test(html));

// 11. JSON-LD
check('JSON-LD schema', /"@type":\s*"Game"|"@type":\s*"VideoGame"|"@type":\s*"WebApplication"/.test(html));

// 12. chooseGate logic — game must have gate selection
check('chooseGate defined', /function chooseGate\(side\)/.test(html));

// 13. Best score persistence
check('bestScores stored', /save\.bestScores/.test(html));

// 14. Final score calculation
check('finalScore calculated', /finalScore\s*=/.test(html));

// 15. confetti spawn on win
check('confetti on win', /spawnConfetti/.test(html));

// 16. catwalk + stars display
check('catwalk animation', /catwalkTime|catwalkCharX/.test(html));

// 17. UI buttons
const uiBtnCount = (html.match(/<button[^>]*>/g) || []).length;
check(`>=3 buttons`, uiBtnCount >= 3, `found ${uiBtnCount}`);

// 18. touch/click handlers for mobile
check('touchstart or click handler', /addEventListener\(['"](touchstart|pointerdown|click)/.test(html));

// 19. No obvious 3rd-party heavy scripts
check('no recaptcha', !/recaptcha|hcaptcha/.test(html));

// 20. rAF-based game loop
check('rAF game loop', /requestAnimationFrame/.test(html));

// 21. Settings screen
check('settings screen exists', /settings/.test(html));

// 22. Tutorial overlay
check('tutorial overlay exists', /tutorial/.test(html));

// 23. Sound toggle
check('sound toggle', /(soundOn|toggleSound|toggleMute|sfx.*on|sound)/.test(html));

const fail = checks.filter(c => !c.ok);
console.log(JSON.stringify({
  verdict: fail.length === 0 ? 'PASS' : 'FAIL',
  failCount: fail.length,
  passCount: checks.length - fail.length,
  failDetails: fail,
  uiButtons: uiBtnCount,
}, null, 2));
process.exit(fail.length === 0 ? 0 : 1);
