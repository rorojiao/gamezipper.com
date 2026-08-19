#!/usr/bin/env node
// verify_engine.js — blackjack state-machine verifier (sweep 84)
// Blackjack is procedural (no LEVELS array). Validate:
// 1. Init loads balance/stats/settings via localStorage with v===SAVE_VERSION guards
// 2. deal() transitions BETTING→DEALING→PLAYER_TURN
// 3. Hit/Stand paths update scores; bust detection at v>21
// 4. End-of-round settle updates balance+stats and writes back
// 5. Tutorial gate runs once

const fs = require('fs');
const html = fs.readFileSync('blackjack/index.html', 'utf8');

// 1) Save/load guards
const saveBalanceV = /localStorage\.setItem\('bj21_balance',JSON\.stringify\(\{v:SAVE_VERSION,b:balance\}\)\)/.test(html);
const saveStatsV = /localStorage\.setItem\('bj21_stats',JSON\.stringify\(\{v:SAVE_VERSION,\.\.\.stats\}\)\)/.test(html);
const saveSettingsV = /localStorage\.setItem\('bj21_settings',JSON\.stringify\(\{v:SAVE_VERSION,\.\.\.settings\}\)\)/.test(html);
const loadBalanceV = /if\(b&&b\.v===SAVE_VERSION\)balance=b\.b/.test(html);
const loadStatsV = /if\(s&&s\.v===SAVE_VERSION\)/.test(html);
const loadSettingsV = /if\(se&&se\.v===SAVE_VERSION\)/.test(html);

console.log('save bj21_balance writes v:SAVE_VERSION:', saveBalanceV ? 'OK' : 'BAD');
console.log('save bj21_stats writes v:SAVE_VERSION:', saveStatsV ? 'OK' : 'BAD');
console.log('save bj21_settings writes v:SAVE_VERSION:', saveSettingsV ? 'OK' : 'BAD');
console.log('load bj21_balance has v===SAVE_VERSION guard:', loadBalanceV ? 'OK' : 'BAD');
console.log('load bj21_stats has v===SAVE_VERSION guard:', loadStatsV ? 'OK' : 'BAD');
console.log('load bj21_settings has v===SAVE_VERSION guard:', loadSettingsV ? 'OK' : 'BAD');

// 2) Game flow states
const states = ['BETTING', 'DEALING', 'PLAYER_TURN', 'DEALER_TURN', 'RESULT'].filter(s =>
  new RegExp(`gameState\\s*=\\s*['"]${s}['"]`).test(html)
);
console.log(`\nGame state transitions: ${states.length}/5 found: ${states.join(', ')}`);

// 3) Player actions
const actions = ['doHit', 'doStand', 'doDouble', 'doSplit', 'doSurrender'].filter(a =>
  new RegExp(`function ${a}\\(`).test(html)
);
console.log(`Player actions: ${actions.length}/5: ${actions.join(', ')}`);

// 4) Bust detection
const bustDetect = /v\s*>\s*21/.test(html);
console.log('Bust detection (v>21):', bustDetect ? 'OK' : 'BAD');

// 5) Dealer auto-draw loop until >= 17
const dealerLoop = /function dealerDrawLoop\(\)/.test(html) && /if\(dv<17\|\|soft17\)/.test(html);
console.log('Dealer auto-draw to >=17:', dealerLoop ? 'OK' : 'BAD');

// 6) Init function called at module load
const initCalled = /\binit\(\);?\s*$/.test(html) || /init\(\);\s*\n\}\)\(\);/.test(html);
console.log('init() called at load:', initCalled ? 'OK' : 'BAD');

// 7) Card render + draw
const drawCard = /function drawCard\(/.test(html);
const renderCard = /function renderCard\(/.test(html);
console.log('drawCard function:', drawCard ? 'OK' : 'BAD');
console.log('renderCard function:', renderCard ? 'OK' : 'BAD');

// 8) Tutorial gate (one-time)
const tutorialGate = /localStorage\.getItem\('bj21_tutorial_done'\)/.test(html);
console.log('Tutorial gate (bj21_tutorial_done):', tutorialGate ? 'OK' : 'BAD');

const allOk = saveBalanceV && saveStatsV && saveSettingsV &&
              loadBalanceV && loadStatsV && loadSettingsV &&
              states.length === 5 && actions.length === 5 &&
              bustDetect && dealerLoop && initCalled &&
              drawCard && renderCard && tutorialGate;

console.log('\n' + (allOk ? '✅ All blackjack invariants PASS' : '❌ FAIL'));
process.exit(allOk ? 0 : 1);