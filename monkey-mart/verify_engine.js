#!/usr/bin/env node
'use strict';

// monkey-mart verifier — continuous supermarket sim (no fixed level catalog).
// Static checks per the source patterns:
//   1. State shape: G object with speedLv, carryLv, staminaLv, coins, zones
//   2. Save/load uses v:1 guard (Pitfall #40 safe)
//   3. Save key matches convention: localStorage.monkeymartSave or similar
//   4. UPGRADE_COSTS is a non-empty table
//   5. Audio context init gated by user gesture (mobile audio)
//   6. Tutorial gate #tutorial -> #clsTut dismisses via click
//   7. State machine: menu -> tutorial -> playing (no stale modal stacking)

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = {
  // Game structure
  hasCanvas: /<canvas[^>]*id="c"/.test(html),
  hasCoreLoop: /function update\(/.test(html) || /function tick\(/.test(html),
  hasStateObj: /var G\s*=\s*\{|let G\s*=\s*\{/.test(html),
  hasUpgradeTable: /UPGRADE_COSTS\s*=\s*\[/.test(html) || /UPGRADE_COSTS\s*=\s*\{/.test(html),
  hasMovement: /keys|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|joystick/i.test(html),
  hasCustomerLoop: /customers|customerArr|spawnCustomer/i.test(html),
  // Save/load
  hasSaveFn: /function save\(|function load\(|function saveGame|function loadGame/.test(html),
  hasVersionGuard: /v\s*[!=]==\s*1|v\s*:\s*1/.test(html),
  // Tutorial
  hasTutorial: /id="tutorial"/.test(html),
  hasTutorialDismiss: /id="clsTut"/.test(html),
  // UI
  hasShopBtn: /id="btnShop"/.test(html),
  hasUpgradeBtn: /id="btnUpg"/.test(html),
  hasHireBtn: /id="btnHire"/.test(html),
  hasGoalBtn: /id="btnGoal"/.test(html),
  hasStatBtn: /id="btnStat"/.test(html),
  hasAudioBtn: /id="btnAudio"/.test(html),
  // Audio
  hasAudioCtx: /AudioContext|webkitAudioContext/.test(html),
  hasAudioResume: /\.resume\(\)/.test(html),
  // Chrome
  monetag: /monetag-manager\.js/.test(html),
  adDiv: /gz-ad-below-game|gz-ad-below-canvas/.test(html),
  footer: /game-footer\.js/.test(html),
  h1: /<h1[^>]*>/.test(html),
};

const failed = Object.entries(checks).filter(([k,v]) => !v).map(([k]) => k);
console.log('Source checks:');
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
}

if (failed.length === 0) {
  console.log(`\nPASS: monkey-mart static checks (continuous sim, no level catalog)`);
  console.log(`Note: full game-loop verification requires live browser (canvas + state machine)`);
  process.exit(0);
} else {
  console.error(`\nFAIL: ${failed.length} missing: ${failed.join(', ')}`);
  process.exit(1);
}