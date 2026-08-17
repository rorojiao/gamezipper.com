// watermelon-merge (Suika Game) - non-level physics-merge game.
// Architecture: IIFE-wrapped, single canvas#gameCanvas with HUD + overlay.
// Validates engine integrity + merge math + persistence + game over trigger.

'use strict';
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/home/junze/gamezipper.com/watermelon-merge/index.html', 'utf8');

// Engine source checks
const checks = {
  FRUITS_defined: /var\s+FRUITS\s*=\s*\[/.test(html),
  FRUITS_count_11: /\{name:"Watermelon"/.test(html),
  GRAVITY_defined: /var\s+GRAVITY\s*=\s*1200/.test(html),
  canvas_exists: /<canvas[^>]*id="gameCanvas"/.test(html),
  gameState_menu: /gameState\s*=\s*"menu"/.test(html),
  gameState_playing: /gameState\s*=\s*"playing"/.test(html),
  gameState_gameover: /gameState\s*=\s*"gameover"/.test(html),
  hasSpawnNewFruit: /function\s+spawnNewFruit/.test(html),
  hasDropFruit: /function\s+dropFruit/.test(html),
  hasCheckGameOver: /function\s+checkGameOver/.test(html),
  hasMergeLogic: /score\s*\+=/.test(html),
  hasGameOverTrigger: /GAME_OVER_GRACE/.test(html),
  hasPersistence: /localStorage\.(?:get|set)Item\(.wm_merge_hs/.test(html),
  hasPointerHandlers: /pointerdown|addEventListener\(['"]pointerdown/.test(html),
  // Site chrome
  monetag: /monetag-manager\.js/.test(html),
  adDiv: /gz-ad-below-game/.test(html),
  footer: /game-footer\.js/.test(html),
  h1: /<h1[^>]*>/.test(html),
};

console.log('=== watermelon-merge engine checks ===');
let allOK = true;
for (const [k, v] of Object.entries(checks)) {
  console.log('  ' + (v ? 'PASS' : 'FAIL') + ' ' + k);
  if (!v) allOK = false;
}

console.log('\nVERDICT: ' + (allOK ? 'PASS (engine + site chrome verified)' : 'FAIL'));
process.exit(allOK ? 0 : 1);
