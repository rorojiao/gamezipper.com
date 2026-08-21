// Tower Stacker 3D per-game verifier — sweep 92 (2026-08-21)
//
// Validates:
//   - LEVELS array has 30 entries (6 biomes × 5 levels each)
//   - every level has: biome (0-5), target (8-25), craneSpeed (12-40), level (1-30)
//   - site-chrome elements present (game-footer, monetag, gz-ad-below-game)
//   - main game fns wired: startLevel, startDaily, initAudio
//
// Usage: node tower-stacker-3d/verify_engine.js
// Exit 0 = all checks pass, 1 = structural defect.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [];
function check(name, ok, detail) { checks.push({ name, ok, detail }); }

check('has-monetag-script', html.includes('monetag-manager.js'));
check('has-game-footer-script', html.includes('game-footer.js'));
check('has-gz-ad-below-game', html.includes('gz-ad-below-game'));
check('has-LEVELS-array', /\b(const|var|let)\s+LEVELS\s*=/.test(html));
check('has-startLevel', /function startLevel/.test(html));
check('has-startDaily', /function startDaily/.test(html));
check('has-initAudio', /function initAudio/.test(html));
check('has-createGameData', /function createGameData/.test(html));
check('has-playBGM', /function playBGM/.test(html));

// Extract the LEVELS generation block: from `const LEVELS = [];` to matching `];`
function findMatching(s, i, open, close) {
  let depth = 1, inStr = null, inLineComment = false, inBlockComment = false;
  while (i < s.length && depth > 0) {
    const c = s[i], next = s[i+1] || '';
    if (inLineComment) { if (c === '\n') inLineComment = false; }
    else if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } }
    else if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; }
    else {
      if (c === '/' && next === '/') { inLineComment = true; i++; }
      else if (c === '/' && next === '*') { inBlockComment = true; i++; }
      else if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return i; }
    }
    i++;
  }
  return -1;
}

// Capture from `const LEVELS = [];` through the end of the for-loop that populates it.
// The LEVELS is initialized as `[]` then a for loop pushes items. We need the full block.
const startMatch = /const\s+LEVELS\s*=\s*\[\s*\]\s*;/.exec(html);
let levels = [];
if (startMatch) {
  // Start scanning from the line after the const declaration
  const afterConst = startMatch.index + startMatch[0].length;
  // The for-loop block ends with `}` — find the matching closing brace
  // Search for `for (` after `const LEVELS = [];`
  const forMatch = /\bfor\s*\(/.exec(html.slice(afterConst));
  let closeIdx = -1;
  if (forMatch) {
    const forOpenIdx = afterConst + forMatch.index + forMatch[0].length - 1; // index of '('
    // Find matching ')' of for(...)
    let depth = 1, inStr = null, inLineComment = false, inBlockComment = false;
    let i = forOpenIdx + 1;
    while (i < html.length && depth > 0) {
      const c = html[i], next = html[i+1] || '';
      if (inLineComment) { if (c === '\n') inLineComment = false; }
      else if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } }
      else if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; }
      else {
        if (c === '/' && next === '/') { inLineComment = true; i++; }
        else if (c === '/' && next === '*') { inBlockComment = true; i++; }
        else if (c === '"' || c === "'" || c === '`') inStr = c;
        else if (c === '(') depth++;
        else if (c === ')') { depth--; if (depth === 0) { i++; break; } }
      }
      i++;
    }
    // Now i points just after the `)`. Skip whitespace and find the opening `{` of the loop body
    while (i < html.length && /\s/.test(html[i])) i++;
    if (html[i] === '{') {
      // Scan to matching '}'
      depth = 1; inStr = null; inLineComment = false; inBlockComment = false;
      i++;
      while (i < html.length && depth > 0) {
        const c = html[i], next = html[i+1] || '';
        if (inLineComment) { if (c === '\n') inLineComment = false; }
        else if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } }
        else if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; }
        else {
          if (c === '/' && next === '/') { inLineComment = true; i++; }
          else if (c === '/' && next === '*') { inBlockComment = true; i++; }
          else if (c === '"' || c === "'" || c === '`') inStr = c;
          else if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) { closeIdx = i; break; } }
        }
        i++;
      }
    }
  }
  if (closeIdx > 0) {
    // Capture full block; replace local `const LEVELS = [];` with globalThis.LEVELS = [];
    let blockCode = html.slice(startMatch.index, closeIdx + 1);
    blockCode = blockCode.replace(/const\s+LEVELS\s*=\s*\[\s*\]\s*;/, 'globalThis.LEVELS = [];');
    blockCode = blockCode.replace(/LEVELS\.push/g, 'globalThis.LEVELS.push');
    const genCode = blockCode + '\nthis.__lvls = globalThis.LEVELS;';
    try {
      const ctx = vm.createContext({ Math: Math, console: console });
      vm.runInContext(genCode, ctx);
      levels = ctx.__lvls || [];
    } catch (e) {
      check('LEVELS-runs', false, 'throws: ' + e.message);
    }
  }
}

check('LEVELS-30-generated', levels.length === 30, `count=${levels.length}`);

let invalid = 0;
for (const lv of levels) {
  if (typeof lv.biome !== 'number' || lv.biome < 0 || lv.biome > 5) invalid++;
  if (typeof lv.target !== 'number' || lv.target < 8 || lv.target > 25) invalid++;
  if (typeof lv.craneSpeed !== 'number' || lv.craneSpeed < 12 || lv.craneSpeed > 40) invalid++;
  if (typeof lv.level !== 'number' || lv.level < 1 || lv.level > 30) invalid++;
}
check('all-levels-valid', invalid === 0, `invalid=${invalid}/${levels.length}`);

const passed = checks.filter(c => c.ok).length;
const failed = checks.length - passed;
console.log(`Tower Stacker 3D sweep-92 verifier: ${passed}/${checks.length} checks pass`);
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
console.log(JSON.stringify({ verdict: failed === 0 ? 'PASS' : 'FAIL', pass: passed, fail: failed, total: checks.length, levels: levels.length, invalidLevels: invalid }));
process.exit(failed === 0 ? 0 : 1);