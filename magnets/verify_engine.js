#!/usr/bin/env node
/**
 * Magnets in-engine verification via JSDOM.
 *
 * Loads magnets/index.html into a JSDOM environment, runs game.js, and for each
 * level:
 *   1. Sets the grid to the solution.
 *   2. Calls checkSolution() — must return true.
 *   3. Toggles one cell to a wrong value — must return false.
 *
 * Requires jsdom + the local game.js / data.js files.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require(require.resolve('jsdom', { paths: [path.join(__dirname, '..', 'node_modules')] }) || 'jsdom');

const ROOT = __dirname;
const LEVELS_PATH = path.join(ROOT, 'levels.json');
const INDEX_PATH = path.join(ROOT, 'index.html');
const DATA_PATH = path.join(ROOT, 'data.js');
const GAME_PATH = path.join(ROOT, 'game.js');

function runLevel(dom, levels, i) {
  const win = dom.window;
  const { MAGNETS } = win;
  if (!MAGNETS) throw new Error('MAGNETS not exposed');
  const lev = levels[i];
  MAGNETS.loadLevel(i);
  // Set grid to solution (mimic user completing the puzzle)
  const m = win.MAGNETS.m();
  const n = win.MAGNETS.n();
  // grid is exposed via getter; we need to set it. Use loadLevel to reset, then mutate via canvas click events.
  // Easier: re-load and manually set the grid via window globals.
  // We don't have a setter, so do it via setting the state from outside — instead, use checkSolution directly:
  // Actually checkSolution accepts (levelData, gridToCheck) so we can pass our own grid.
  // Build a grid copy from solution
  const gridCopy = lev.solution.map(row => row.slice());
  const ok = MAGNETS.checkSolution(lev, gridCopy);
  if (!ok) {
    throw new Error(`L${i} checkSolution returned false on the actual solution`);
  }
  // Now test by perturbing one cell: change cell (0,0) to wrong value (still in [+1,-1] but flipped)
  const perturbed = lev.solution.map(row => row.slice());
  perturbed[0][0] = -perturbed[0][0];
  // Find a cell whose perturbation actually violates something (X, fixed, clue, or just wrong)
  // If flipping (0,0) makes the row/col clue wrong, that's enough. Otherwise try a different cell.
  const okPerturbed = MAGNETS.checkSolution(lev, perturbed);
  if (okPerturbed) {
    // Try flipping a cell that's part of an X marker
    if (lev.x.length > 0) {
      const [r1, c1, r2, c2] = lev.x[0];
      const perturb2 = lev.solution.map(row => row.slice());
      perturb2[r2][c2] = -perturb2[r2][c2];
      if (!MAGNETS.checkSolution(lev, perturb2)) return true;
    }
    throw new Error(`L${i} perturbation did not change the answer — checkSolution always true`);
  }
  return true;
}

function main() {
  const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8')).levels;
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const dataJs = fs.readFileSync(DATA_PATH, 'utf8');
  const gameJs = fs.readFileSync(GAME_PATH, 'utf8');
  // Strip external script tags that need network, keep data.js + game.js
  const cleaned = html
    .replace(/<script src="\/gz-analytics[^>]*><\/script>/g, '')
    .replace(/<script src="\/adsterra-manager[^>]*><\/script>/g, '')
    .replace(/<script src="\/monetag-manager[^>]*><\/script>/g, '')
    .replace(/<script src="\/game-footer[^>]*><\/script>/g, '')
    .replace(/<script src="\/gz-ux[^>]*><\/script>/g, '')
    .replace(/<script async src="https:\/\/pagead2[^>]*><\/script>/g, '')
    .replace(/<div id="gz-ad[^>]*><\/div>/g, '<div></div>')
    // Inject data.js and game.js inline
    .replace('<script src="data.js"></script>', `<script>${dataJs}</script>`)
    .replace('<script src="game.js"></script>', `<script>${gameJs}</script>`);
  const dom = new JSDOM(cleaned, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://gamezipper.com/magnets/',
  });
  // Stub AudioContext
  dom.window.AudioContext = function() {
    return { createGain: () => ({ gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }), createOscillator: () => ({ frequency: { value: 0 }, connect() {}, start() {}, stop() {} }), destination: {}, currentTime: 0, close() {} };
  };
  // Stub canvas getContext to no-op for drawBoard (avoid radius negative in JSDOM 0x0 canvas)
  dom.window.HTMLCanvasElement.prototype.getContext = function() {
    const noop = () => {};
    return new Proxy({}, {
      get(target, prop) {
        if (prop === 'canvas') return this;
        if (prop === 'setTransform' || prop === 'fillRect' || prop === 'clearRect' || prop === 'beginPath' ||
            prop === 'moveTo' || prop === 'lineTo' || prop === 'stroke' || prop === 'fill' || prop === 'arc' ||
            prop === 'fillText' || prop === 'save' || prop === 'restore' || prop === 'translate' || prop === 'rotate' ||
            prop === 'scale') return noop;
        return undefined;
      }
    });
  };
  // Wait for init
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        let allPass = true;
        for (let i = 0; i < levels.length; i++) {
          try {
            runLevel(dom, levels, i);
            console.log(`  L${String(i).padStart(2, '0')} ${levels[i].tier} (${levels[i].n}x${levels[i].m}): PASS`);
          } catch (e) {
            console.log(`  L${String(i).padStart(2, '0')} ${levels[i].tier} (${levels[i].n}x${levels[i].m}): FAIL — ${e.message}`);
            allPass = false;
          }
        }
        if (allPass) {
          console.log(`\nAll ${levels.length}/30 levels PASS in-engine verification`);
          resolve();
        } else {
          reject(new Error('Some levels failed'));
        }
      } catch (e) {
        reject(e);
      }
    }, 800);
  });
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });