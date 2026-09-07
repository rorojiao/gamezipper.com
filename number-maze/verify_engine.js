#!/usr/bin/env node
/**
 * In-engine validator for Number Maze.
 * Loads index.html into a JSDOM environment, runs the game.js,
 * then for each level asks checkSolution() whether the recorded solution passes.
 * This is the same function the in-game Check button uses.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const LEVELS_PATH = path.join(__dirname, 'levels.json');
const GAME_JS = path.join(__dirname, 'game.js');
const INDEX_HTML = path.join(__dirname, 'index.html');

async function main() {
  const levelsData = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const gameJs = fs.readFileSync(GAME_JS, 'utf8');
  const indexHtml = fs.readFileSync(INDEX_HTML, 'utf8');

  // Strip the data.js + game.js <script> tags - we'll inject fresh
  const stripped = indexHtml
    .replace(/<script src="data\.js"><\/script>/, '')
    .replace(/<script src="game\.js"><\/script>/, '');

  // Inject data.js (with NM_LEVELS const) and game.js inline
  const dataJs = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  const injected = stripped
    .replace('</body>', `<script>${dataJs}</script>\n<script>${gameJs}</script>\n</body>`);

  const dom = new JSDOM(injected, { runScripts: 'dangerously' });
  await new Promise(resolve => setTimeout(resolve, 100));

  const window = dom.window;
  const checkSolution = window.checkSolution;
  if (typeof checkSolution !== 'function') {
    console.error('FAIL: window.checkSolution not exposed');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  for (const lvl of levelsData.levels) {
    const solution = lvl.solution.map(c => [c[0], c[1]]);
    const ok = checkSolution(lvl, solution);
    if (ok) {
      passed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: PASS (checkSolution matches, length ${solution.length})`);
    } else {
      failed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: FAIL (checkSolution mismatch)`);
    }
  }

  console.log('');
  console.log(`Result: ${passed}/${levelsData.levels.length} PASS, ${failed}/${levelsData.levels.length} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
