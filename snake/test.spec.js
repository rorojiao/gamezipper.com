#!/usr/bin/env node
'use strict';

// Dependency-free Snake regression gate. Browser behavior is replayed separately with Kachilu;
// this script protects the source-level contracts without requiring @playwright/test.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [];
function check(name, condition) {
  const pass = !!condition;
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`);
}

check('canvas exists', /<canvas id="c"><\/canvas>/.test(html));
check('desktop canvas reserves nav and HUD space', /window\.innerHeight\s*-\s*navH\s*-\s*100/.test(html));
check('menu starts idle demo loop', /requestAnimationFrame\(menuLoop\)/.test(html) && /function stepDemo\(/.test(html));
check('single canvas click starts menu state', /if\(gameState===['"]menu['"]\)\s*\{\s*startGame\(\);\s*return;\s*\}/.test(html));
check('keyboard start and arrows wired', /addEventListener\(['"]keydown/.test(html) && /case['"]ArrowUp['"]:setDir/.test(html));
check('pause toggle wired', /e\.key===['"]p['"]\|\|e\.key===['"]P['"]/.test(html) && /paused=!paused/.test(html));
check('touch swipe input wired', /addEventListener\(['"]touchstart/.test(html) && /addEventListener\(['"]touchmove/.test(html));
check('mobile D-pad touch controls wired', /id="dpad"/.test(html) && /ontouchstart="setDir/.test(html));
check('boundary/self collision reaches game over', /gameState=['"]over['"]/.test(html) && /window\.dispatchEvent\(new Event\(['"]gameover['"]\)\)/.test(html));
check('restart clears score and snake length', /function startGame\(\)[\s\S]*?snake=\[\{x:12,y:12\}\][\s\S]*?score=0/.test(html));
check('best score persists', /localStorage\.setItem\(['"]snake_best['"],bestScore\)/.test(html) && /localStorage\.getItem\(['"]snake_best['"]\)/.test(html));
check('native rAF cancellation wrapper', /_origCAF\.call\(window,id\)/.test(html));
check('site chrome complete', /monetag-manager\.js/.test(html) && /game-footer\.js/.test(html) && /id="gz-ad-below-game"/.test(html));
check('sound control present', /id="soundToggle"/.test(html) && /sound-toggle\.js/.test(html));

const failed = checks.filter(c => !c.pass);
console.log(`RESULT: ${checks.length - failed.length}/${checks.length} PASS`);
if (failed.length) process.exit(1);
