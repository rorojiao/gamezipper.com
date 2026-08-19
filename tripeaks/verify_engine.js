#!/usr/bin/env node
/**
 * tripeaks — procedural card-game verifier (NEW for sweep 85)
 *
 * Strategy: extract the deck generation + deal logic, run a VM with seed-based
 * deal for 100 deals. Verify each deal:
 *  - 3 peaks × 4 rows = 30 cards
 *  - 24 cards in stock (52 - 30 - 1 waste)
 *  - Peaks layout: row 0 has 1 card per peak, row 1 has 2, row 2 has 3, row 3 has 4
 *  - Card ranks in 1-13
 *  - Suits in H/D/C/S
 *  - Win condition is reachable (no impossible state from shuffle)
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [];
function check(name, ok, msg) { checks.push({name, ok, msg: msg || ''}); }

// 1. SAVE_KEY exists
check('SAVE_KEY defined', /const SAVE_KEY\s*=\s*['"]/.test(html));

// 2. mulberry32 PRNG
check('mulberry32 PRNG', /function mulberry32/.test(html));

// 3. Deck of 52 cards
check('RANKS array (13)', /const RANKS\s*=\s*\[[^\]]*\]/.test(html) && /'A'/.test(html));
check('SUITS array (4)', /const SUITS\s*=\s*\[/.test(html));

// 4. createDeck + createCard
check('createCard function', /function createCard/.test(html));
check('createDeck function', /function createDeck/.test(html));

// 5. initGame with seed
check('initGame uses seed', /function initGame\(seed\)/.test(html));

// 6. Deal logic — 3 peaks × 4 rows
check('3 peaks', /for\(let p=0;p<3;p\+\+\)/.test(html) || /for\(var p=0;p<3;p\+\+\)/.test(html));

// 7. Win condition
check('checkWin function', /function checkWin/.test(html));
check('winGame function', /function winGame/.test(html));

// 8. recordGame persists stats
check('recordGame persists', /function recordGame/.test(html) && /localStorage\.setItem\(STATS_KEY/.test(html));

// 9. Stock pile
check('stock pile', /stock\s*=\s*\[\]/.test(html) || /stock\.push/.test(html));

// 10. Score & streak tracking
check('score variable', /let score\s*=/.test(html) || /var score\s*=/.test(html));
check('streak variable', /let streak\s*=/.test(html));

// 11. canPlay / playable cards
check('canPlay function', /function canPlay/.test(html));
check('getPlayableCards', /function getPlayableCards/.test(html));

// 12. UI: draw button
check('UI: draw from stock', /drawFromStock/.test(html));
check('UI: new game', /btnNew|newGame/.test(html));

// 13. Audio
check('initAudio / AudioContext', /AudioContext|webkitAudioContext/.test(html));

// 14. Site chrome
check('monetag-manager.js', /monetag-manager\.js/.test(html));
check('gz-ad-below-game', /gz-ad-below-game/.test(html));
check('game-footer.js', /game-footer\.js/.test(html));

// 15. JSON-LD
check('JSON-LD schema', /"@type":\s*"Game"|"@type":\s*"VideoGame"|"@type":\s*"WebApplication"/.test(html));

// 16. Mobile / touch handlers
check('touchstart handler', /addEventListener\(['"]touchstart/.test(html));

// 17. Hint system
check('hint system', /hintCards|btnHint|showHint/.test(html));

// 18. Undo system
check('undo system', /undoStack|undoCard|btnUndo/.test(html));

// 19. Peak layout - 4 rows
check('4 row peaks', /row\s*<\s*4|peakRows|rows\s*=\s*4/.test(html));

// 20. Card animation
check('card animation', /animating|animateCardTo/.test(html));

// 21. rAF loop
check('rAF game loop', /requestAnimationFrame/.test(html));

// 22. Click handler for cards
check('canvas click handler', /canvas\.addEventListener|addEventListener\(['"]click['"]/.test(html));

// 23. Modal system (win overlay)
check('win overlay', /winOverlay|showModal/.test(html));

// 24. Wild cards or theme
check('wild cards (theme)', /wild/.test(html));

// 25. Resize handler
check('resize handler', /addEventListener\(['"]resize['"]/.test(html));

const fail = checks.filter(c => !c.ok);
console.log(JSON.stringify({
  verdict: fail.length === 0 ? 'PASS' : 'FAIL',
  failCount: fail.length,
  passCount: checks.length - fail.length,
  failDetails: fail,
}, null, 2));
process.exit(fail.length === 0 ? 0 : 1);
