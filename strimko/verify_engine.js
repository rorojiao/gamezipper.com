#!/usr/bin/env node
/**
 * In-engine validator for Strimko.
 * Loads index.html into a JSDOM environment, runs game.js,
 * then for each level asks checkSolution whether the recorded solution passes.
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
  const dataJs = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');

  // Strip the data.js + game.js <script> tags - we'll inject fresh
  const stripped = indexHtml
    .replace(/<script src="data\.js"><\/script>/, '')
    .replace(/<script src="game\.js"><\/script>/, '');

  // Inject data.js + game.js inline
  const injected = stripped
    .replace('</body>', `<script>${dataJs}</script>\n<script>${gameJs}</script>\n</body>`);

  const dom = new JSDOM(injected, { runScripts: 'dangerously' });
  await new Promise(resolve => setTimeout(resolve, 200));

  const window = dom.window;
  // game.js wraps everything in IIFE so checkSolution isn't on window.
  // We need to expose it. Let me check the game.js source for `window.STRIMKO`.
  if (!window.STRIMKO || !window.STRIMKO.checkSolution) {
    console.error('FAIL: window.STRIMKO.checkSolution not exposed');
    process.exit(1);
  }
  const checkSolution = window.STRIMKO.checkSolution;

  let passed = 0;
  let failed = 0;
  for (const lvl of levelsData.levels) {
    const n = lvl.n;
    const streams = lvl.streams.map(s => s.map(c => [c[0], c[1]]));
    const solution = lvl.solution;
    const ok = checkSolution(lvl, solution);
    if (ok) {
      passed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: PASS (checkSolution accepts stored solution, n=${n})`);
    } else {
      failed++;
      console.log(`  L${lvl.id + 1} [${lvl.tier.padEnd(9)}]: FAIL (checkSolution rejects stored solution)`);
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
