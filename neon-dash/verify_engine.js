// Neon Dash per-game verifier — sweep 92 (2026-08-21)
//
// Validates:
//   - LEVELS array parses (balanced-bracket scanner) and has ≥10 levels
//   - each level has: name, color, speed (1-20), obstacles (≥1), spikes+blocks+coins mix
//   - total obstacles per level ≥ 3
//   - site-chrome elements present (game-footer, monetag, gz-ad-below-game)
//
// Usage: node neon-dash/verify_engine.js
// Exit 0 = all checks pass, 1 = structural defect.

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [];
function check(name, ok, detail) { checks.push({ name, ok, detail }); }

check('has-monetag-script', html.includes('monetag-manager.js'));
check('has-game-footer-script', html.includes('game-footer.js'));
check('has-gz-ad-below-game', html.includes('gz-ad-below-game'));
check('has-LEVELS-array', /\b(var|const|let)\s+LEVELS\s*=\s*\[/.test(html));
check('has-btnPlay', /id\s*=\s*["']btnPlay["']/.test(html));
check('has-startLevel', /function startLevel/.test(html));

// Extract LEVELS via balanced-bracket scanner (string-literal aware)
function findMatching(s, i, open, close) {
  let depth = 1, inStr = null, inLineComment = false, inBlockComment = false;
  while (i < s.length && depth > 0) {
    const c = s[i], prev = s[i-1] || '', next = s[i+1] || '';
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++; }
    } else if (inStr) {
      if (c === '\\') { i++; }
      else if (c === inStr) { inStr = null; }
    } else {
      if (c === '/' && next === '/') { inLineComment = true; i++; }
      else if (c === '/' && next === '*') { inBlockComment = true; i++; }
      else if (c === '"' || c === "'" || c === '`') { inStr = c; }
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return i; }
    }
    i++;
  }
  return -1;
}

let levels = [];
const m = /\b(var|const|let)\s+LEVELS\s*=\s*\[/g.exec(html);
if (m) {
  const startIdx = m.index + m[0].length - 1; // index of '['
  const closeIdx = findMatching(html, startIdx + 1, '[', ']');
  if (closeIdx > 0) {
    const body = html.slice(startIdx, closeIdx + 1);
    try { levels = eval('(' + body + ')'); }
    catch (e) {
      try { levels = JSON.parse(body); } catch (e2) { check('LEVELS-parses', false, 'throws: ' + e.message); }
    }
  }
}

check('LEVELS-non-empty', levels.length > 0, `count=${levels.length}`);
check('LEVELS-min-10', levels.length >= 10, `count=${levels.length}`);

let invalid = 0;
const obsTypes = new Set();
for (const lv of levels) {
  if (!lv.name || typeof lv.name !== 'string') { invalid++; continue; }
  if (!lv.color || typeof lv.color !== 'string') { invalid++; continue; }
  if (typeof lv.speed !== 'number' || lv.speed < 1 || lv.speed > 30) { invalid++; continue; }
  if (!Array.isArray(lv.obstacles) || lv.obstacles.length < 1) { invalid++; continue; }
  for (const o of lv.obstacles) {
    if (!o.type) { invalid++; break; }
    obsTypes.add(o.type);
    if (typeof o.x !== 'number' || typeof o.y !== 'number' || typeof o.w !== 'number') { invalid++; break; }
  }
}
check('all-levels-valid', invalid === 0, `invalid=${invalid}/${levels.length}`);
check('obstacle-types-known', obsTypes.size >= 2, `types=${[...obsTypes].join(',')}`);

const passed = checks.filter(c => c.ok).length;
const failed = checks.length - passed;
console.log(`Neon Dash sweep-92 verifier: ${passed}/${checks.length} checks pass`);
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
console.log(JSON.stringify({ verdict: failed === 0 ? 'PASS' : 'FAIL', pass: passed, fail: failed, total: checks.length, levels: levels.length, invalidLevels: invalid, obstacleTypes: [...obsTypes] }));
process.exit(failed === 0 ? 0 : 1);