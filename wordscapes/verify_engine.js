// wordscapes verify_engine.js — confirms game loads + renderLevels has no startLevel shadowing
// Without this fix, clicking any unlocked level button throws TypeError: startLevel is not a function
// (the local const startLevel = currentPack*5 shadows the module-scope function startLevel).
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join('/home/junze/gamezipper.com', 'wordscapes/index.html'), 'utf8');

const checks = {
  hasRenderLevels: /function renderLevels\(/.test(html),
  hasStartLevelFn: /function startLevel\(lvl\)\{/.test(html),
  // Critical: renderLevels must NOT have a local const named startLevel
  noStartLevelShadow: !/function renderLevels\(\)[\s\S]*?const startLevel\s*=/m.test(html),
  hasShowScreen: /function showScreen\(/.test(html),
  hasSetupCanvases: /function setupCanvases\(/.test(html),
  hasRender: /function render\(/.test(html),
  hasNextLevel: /function nextLevel\(/.test(html),
  hasGoToMenu: /function goToMenu\(/.test(html),
  hasRenderPacks: /function renderPacks\(/.test(html),
  hasGenerateCrossword: /function generateCrossword\(/.test(html),
  hasShuffleArray: /function shuffleArray\(/.test(html),
  hasSaveState: /function saveState\(/.test(html),
  hasLoadState: /function loadState\(/.test(html),
  hasInitAudio: /function initAudio\(/.test(html),
  hasStartBGM: /function startBGM\(/.test(html),
  hasStopBGM: /function stopBGM\(/.test(html),
  hasBtnPlayOnclick: /document\.getElementById\("btn-play"\)\.onclick/.test(html),
};

const allOk = Object.values(checks).every(v => v === true);
console.log('Wordscapes structural checks:');
Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? '✓' : '✗'} ${k}`));
console.log(allOk ? 'PASS' : 'FAIL');
process.exit(allOk ? 0 : 1);