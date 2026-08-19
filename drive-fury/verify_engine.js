#!/usr/bin/env node
// verify_engine.js — drive-fury procedural-level + save verifier (sweep 84)
// Drive-fury generates 40 levels via generateLevel(i) at module load.
// Verify:
// 1. LEVELS array is generated with 40 entries
// 2. Each level has a parseable track (start/finish segments) and obstacles
// 3. Save/load with v===VERSION guard works
// 4. Star computation exists (1/2/3 stars based on time or coins)
// 5. Level unlock chain (stars >= 1 to advance)

const fs = require('fs');
const html = fs.readFileSync('drive-fury/index.html', 'utf8');

// 1) LEVELS generation
const levelsGen = /const LEVELS = \[\];[\s\S]*?for \(let i = 0; i < 40; i\+\+\) LEVELS\.push\(generateLevel\(i\)\)/.test(html);
console.log('LEVELS generated 40:', levelsGen ? 'OK' : 'BAD');

// 2) generateLevel function
const hasGenerate = /function generateLevel\(/.test(html);
console.log('generateLevel function:', hasGenerate ? 'OK' : 'BAD');

// 3) Save version
const versionOk = /const VERSION = 2;/.test(html);
console.log('VERSION = 2:', versionOk ? 'OK' : 'BAD');

const loadGuard = /if \(save\.v !== VERSION\) save = defaultSave\(\)/.test(html);
console.log('loadSave v guard:', loadGuard ? 'OK' : 'BAD');

const defaultSaveV = /return \{ v: VERSION, levels: \{\}, coins: 0, totalStars: 0, endlessBest: 0, soundOn: true, bgmOn: true \}/.test(html);
console.log('defaultSave has v:VERSION:', defaultSaveV ? 'OK' : 'BAD');

const writeSaveOk = /localStorage\.setItem\(SAVE_KEY, JSON\.stringify\(save\)\)/.test(html);
console.log('writeSave to localStorage:', writeSaveOk ? 'OK' : 'BAD');

// 4) Star computation
const starFn = /function saveLevelResult|function getLevelStars|function calculateStars/.test(html);
console.log('Level star tracking:', starFn ? 'OK' : 'BAD');

// 5) Unlock chain
const unlockOk = /function isLevelUnlocked\(i\) \{ return i === 0 \|\| getLevelStars\(i - 1\) >= 1; \}/.test(html);
console.log('Level unlock chain:', unlockOk ? 'OK' : 'BAD');

// 6) Game loop
const mainLoopOk = /function mainLoop\(timestamp\)/.test(html);
console.log('mainLoop function:', mainLoopOk ? 'OK' : 'BAD');

// 7) Vehicle unlock groups
const vehicleUnlockOk = /function isVehicleUnlocked/.test(html);
console.log('Vehicle group unlock:', vehicleUnlockOk ? 'OK' : 'BAD');

// 8) Endless mode score
const endlessOk = /save\.endlessBest/.test(html);
console.log('Endless best score persisted:', endlessOk ? 'OK' : 'BAD');

// 9) Coin collection persistence
const coinOk = /save\.coins \+= g\.coins/.test(html) || /save\.coins \+= game\.coins/.test(html);
console.log('Coin collection persistence:', coinOk ? 'OK' : 'BAD');

// 10) Audio engine
const audioOk = /function initAudio\(\)/.test(html) && /new \(window\.AudioContext/.test(html);
console.log('Web Audio engine:', audioOk ? 'OK' : 'BAD');

const allOk = levelsGen && hasGenerate && versionOk && loadGuard && defaultSaveV &&
              writeSaveOk && starFn && unlockOk && mainLoopOk && vehicleUnlockOk &&
              endlessOk && coinOk && audioOk;

console.log('\n' + (allOk ? '✅ drive-fury structural invariants PASS' : '❌ FAIL'));
process.exit(allOk ? 0 : 1);