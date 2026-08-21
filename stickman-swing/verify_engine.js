// Stickman Swing per-game verifier — sweep 92 (2026-08-21)
//
// Validates:
//   - generateLevels() returns a non-empty array of valid level objects
//   - every level has required fields: start (xy), anchors (>=2), goal (xy), platforms (>=0)
//   - anchor targets are unique within a level
//   - structural solvability: at least one anchor reachable from start within dist 600
//   - site-chrome elements present (game-footer, monetag, gz-ad-below-game)
//
// Usage: node stickman-swing/verify_engine.js
// Exit 0 = all checks pass, 1 = structural defect found.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Sanity: required DOM elements referenced
const checks = [];
function check(name, ok, detail) { checks.push({ name, ok, detail }); }

check('has-monetag-script', html.includes('monetag-manager.js'));
check('has-game-footer-script', html.includes('game-footer.js'));
check('has-gz-ad-below-game', html.includes('gz-ad-below-game'));
check('has-LEVELS-or-generator', /const LEVELS\s*=/.test(html) || /function generateLevels\(\)/.test(html));

// Parse generateLevels() output structure (use VM stub like other verifiers)
const vm = require('vm');
const stub = `
  var document = { getElementById: () => ({ addEventListener: () => {} }), querySelector: () => null, addEventListener: () => {} };
  var window = { addEventListener: () => {} };
  var localStorage = { getItem: () => null };
  var requestAnimationFrame = () => 0;
  var AudioContext = function() { return { state: 'suspended', createOscillator: () => ({ connect:()=>{}, start:()=>{}, stop:()=>{}, frequency: { value: 0 } }), createGain: () => ({ connect:()=>{}, gain: { value: 0 } }), destination: {}, resume: ()=>{} }; };
`;

// Extract generateLevels body via balanced-brace scanner
let levels = [];
{
  const start = html.indexOf('function generateLevels()');
  if (start < 0) {
    check('generateLevels-found', false, 'not in source');
  } else {
    let depth = 0, end = start;
    for (let i = start; i < html.length; i++) {
      const c = html[i];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    const body = html.slice(start, end + 1);
    try {
      const ctx = vm.createContext({ document: { getElementById: () => ({ addEventListener: () => {}, style: {}, classList: { add:()=>{}, remove:()=>{} } }), querySelector: () => null, addEventListener: () => {} }, window: { addEventListener: () => {} }, localStorage: { getItem: () => null }, requestAnimationFrame: () => 0, AudioContext: function(){return {state:'suspended', createOscillator:()=>({connect:()=>{},start:()=>{},frequency:{value:0}}), createGain:()=>({connect:()=>{},gain:{value:0}}), destination:{},resume:()=>{}};}, Math: Math, console: console, performance: { now: () => Date.now() } });
      vm.runInContext(body + '\nthis.__levels = generateLevels();', ctx);
      levels = ctx.__levels || [];
    } catch (e) {
      check('generateLevels-runs', false, 'throws: ' + e.message);
    }
  }
}

check('levels-array-non-empty', levels.length > 0, `count=${levels.length}`);
check('levels-min-10', levels.length >= 10, `count=${levels.length}`);

// Validate each level structure
let invalidLevels = 0;
for (let i = 0; i < levels.length; i++) {
  const lv = levels[i];
  const hasStart = lv && lv.start && typeof lv.start.x === 'number' && typeof lv.start.y === 'number';
  const hasGoal = lv && lv.goal && typeof lv.goal.x === 'number' && typeof lv.goal.y === 'number';
  const hasAnchors = lv && Array.isArray(lv.anchors) && lv.anchors.length >= 2;
  if (!hasStart || !hasGoal || !hasAnchors) { invalidLevels++; continue; }
  // anchors unique
  const seen = new Set();
  let dup = false;
  for (const a of lv.anchors) { const k = `${a.x},${a.y}`; if (seen.has(k)) { dup = true; break; } seen.add(k); }
  if (dup) invalidLevels++;
  // reachable check: at least one anchor within 600px of start
  let reachable = false;
  for (const a of lv.anchors) {
    const d = Math.hypot(a.x - lv.start.x, a.y - lv.start.y);
    if (d <= 600) { reachable = true; break; }
  }
  if (!reachable) invalidLevels++;
}
check('all-levels-structurally-valid', invalidLevels === 0, `invalid=${invalidLevels}/${levels.length}`);

// Output result
const passed = checks.filter(c => c.ok).length;
const failed = checks.length - passed;
console.log(`Stickman Swing sweep-92 verifier: ${passed}/${checks.length} checks pass`);
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
}
const verdict = failed === 0 ? 'PASS' : 'FAIL';
console.log(JSON.stringify({ verdict, pass: passed, fail: failed, total: checks.length, levels: levels.length, invalidLevels }));
process.exit(failed === 0 ? 0 : 1);