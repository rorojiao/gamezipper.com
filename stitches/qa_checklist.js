#!/usr/bin/env node
/**
 * Stitches — Code-level QA checklist.
 * Verifies all required systems, JSON-LD, assets references, etc.
 */
const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');

const checks = [];
function check(name, cond) { checks.push({name, pass: !!cond}); }

// 1. Title & meta
check('Has <title>', /<title>Stitches/.test(html));
check('Has meta description', /name="description"/.test(html) && /stitch/i.test(html.match(/name="description" content="([^"]*)"/)[1]));
check('Has keywords', /name="keywords"/.test(html));
check('Has canonical', /rel="canonical" href="https:\/\/gamezipper\.com\/stitches\/"/.test(html));
check('Has og:image', /og:image.*stitches\/og-image\.jpg/.test(html));
check('Has twitter:card', /twitter:card/.test(html));

// 2. JSON-LD blocks
check('Has VideoGame JSON-LD', /@type":"VideoGame"/.test(html));
check('Has FAQPage JSON-LD', /@type":"FAQPage"/.test(html));
check('Has BreadcrumbList JSON-LD', /@type":"BreadcrumbList"/.test(html));

// 3. Icons
check('Has icon.png link', /icon\.png/.test(html));
check('Has apple-touch-icon', /apple-touch-icon/.test(html));

// 4. SR-only H1
check('Has gz-sr-only H1', /gz-sr-only/.test(html) && /<h1/.test(html));

// 5. Game systems
check('Has canvas', /<canvas/.test(html));
check('Has isSolved function', /function isSolved/.test(html));
check('Has placeStitch function', /function placeStitch/.test(html));
check('Has removeStitch function', /function removeStitch/.test(html));
check('Has handleEdgeClick', /function handleEdgeClick/.test(html));
check('Has computeAdjSet', /function computeAdjSet/.test(html));
check('Has useHint', /function useHint/.test(html));
check('Has loadLevel', /function loadLevel/.test(html));
check('Has resizeCanvas', /function resizeCanvas/.test(html));
check('Has level select', /function buildLevelSelect/.test(html));
check('Has settings toggles', /sfxToggle/.test(html) && /musicToggle/.test(html) && /autoCheckToggle/.test(html));
check('Has localStorage save/load', /localStorage\.getItem/.test(html) && /localStorage\.setItem/.test(html));

// 6. Audio
check('Has initAudio', /function initAudio/.test(html));
check('Has playTone', /function playTone/.test(html));
check('Has startMusic', /function startMusic/.test(html));
check('Has stopMusic', /function stopMusic/.test(html));
check('Has MUSIC_CHORDS', /MUSIC_CHORDS/.test(html));
check('Has sfxWin', /function sfxWin/.test(html));
check('Has sfxPlace', /function sfxPlace/.test(html));
check('Has sfxError', /function sfxError/.test(html));

// 7. Modals
check('Has menu modal', /menuModal/.test(html));
check('Has win modal', /winModal/.test(html));
check('Has level modal', /levelModal/.test(html));
check('Has howto modal', /howtoModal/.test(html));
check('Has settings modal', /settingsModal/.test(html));

// 8. Keyboard support
check('Has keyboard handler', /addEventListener\('keydown'/.test(html));
check('Has hint key H', /k==='h'/.test(html));
check('Has restart key R', /k==='r'/.test(html));
check('Has check Enter', /e\.key==='Enter'/.test(html));
check('Has Esc menu', /e\.key==='Escape'/.test(html));

// 9. Touch support
check('Has pointerdown handler', /pointerdown/.test(html));
check('Has touch-action none', /touch-action:none/.test(html));

// 10. Integration
check('Has monetag script', /monetag-manager\.js/.test(html));
check('Has game-footer', /game-footer\.js/.test(html));
check('Has game-audio-auto', /game-audio-auto\.js/.test(html));
check('Has gz-topnav', /gz-topnav/.test(html));

// 11. Levels data injected
check('LEVELS is array', /var LEVELS = \[/.test(html));
check('30 levels present', (html.match(/"levelNum":/g)||[]).length===30 || (html.match(/levelNum/g)||[]).length>=30);

// 12. beforeunload cleanup
check('beforeunload cleanup', /beforeunload/.test(html));

// Report
let pass=0, fail=0;
for(const c of checks){ if(c.pass)pass++; else fail++; console.log(`${c.pass?'✓':'✗'} ${c.name}`); }
console.log(`\n=== QA: ${pass}/${checks.length} PASS, ${fail} FAIL ===`);
process.exit(fail>0?1:0);
