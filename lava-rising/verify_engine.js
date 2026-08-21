// Lava Rising per-game verifier — sweep 92 (2026-08-21)
//
// Validates:
//   - genLevels() generates 30 levels (6 tiers × 5 each) per the procedural template
//   - each level has ≥3 platforms, valid platform types, valid target height
//   - genEndlessPlatforms() produces a non-empty platform list
//   - site-chrome elements present (game-footer, monetag, gz-ad-below-game)
//   - in-page DOM buttons wire inline onclick handlers (Challenge, Endless)
//
// Usage: node lava-rising/verify_engine.js
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
check('has-LVLS-array', /var LVLS\s*=/.test(html));
check('has-genEndlessPlatforms', /function genEndlessPlatforms\(\)/.test(html));
check('has-genLevels', /function genLevels\(\)/.test(html));
check('has-startChallenge', /window\.startChallenge\s*=/.test(html));
check('has-startEndless', /window\.startEndless\s*=/.test(html));

function extractBody(name) {
  const re = new RegExp('function ' + name + '\\s*\\(', 'g');
  const m = re.exec(html);
  if (!m) return null;
  const start = m.index;
  let depth = 0, end = start;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  return html.slice(start, end + 1);
}

// genLevels needs seededRNG helper and `LVLS` global capture
const seedBody = extractBody('seededRNG');
const genBody = extractBody('genLevels');
const endlessBody = extractBody('genEndlessPlatforms');

let lvls = [];
let endlessCount = 0;
try {
  const ctx = vm.createContext({ Math: Math, console: console, W: 600, H: 800 });
  // Pre-define globalThis.LVLS = [] and platforms = [] for genLevels/genEndlessPlatforms
  vm.runInContext('globalThis.LVLS = []; globalThis.platforms = [];\n' +
                  seedBody + '\n' +
                  genBody.replace(/^function genLevels\(\)/, 'globalThis.__genLevels = function()')
                          .replace(/LVLS\s*=\s*\[\]/g, 'globalThis.LVLS=[]')
                          .replace(/LVLS\.push/g, 'globalThis.LVLS.push')
                          .replace(/}\s*$/, 'return globalThis.LVLS;\n}') +
                  '\nthis.__lvls = globalThis.__genLevels();', ctx);
  lvls = ctx.__lvls || [];
  // Endless — same pattern: replace local platforms=[] and platforms.push with globalThis.platforms
  const endlessRewrite = endlessBody
    .replace(/^function genEndlessPlatforms\(\)/, 'globalThis.__genE = function()')
    .replace(/platforms\s*=\s*\[\]/g, 'globalThis.platforms=[]')
    .replace(/platforms\.push/g, 'globalThis.platforms.push')
    .replace(/}\s*$/, 'return globalThis.platforms;\n}');
  vm.runInContext(endlessRewrite + '\nthis.__plats = globalThis.__genE();', ctx);
  endlessCount = (ctx.__plats || []).length;
} catch (e) {
  check('procedural-runs', false, 'throws: ' + e.message);
}

check('LVLS-30-generated', lvls.length === 30, `count=${lvls.length}`);
check('endless-plats-non-empty', endlessCount >= 5, `plats=${endlessCount}`);

const validTypes = new Set(['normal','spiky','breakable','moving','spring']);
let invalidLvls = 0;
let badType = 0;
for (const lv of lvls) {
  if (!lv.plats || lv.plats.length < 3) { invalidLvls++; continue; }
  let platBad = false;
  for (const p of lv.plats) {
    if (typeof p.x !== 'number' || typeof p.y !== 'number' || typeof p.w !== 'number' || !p.type) { platBad = true; break; }
    if (!validTypes.has(p.type)) badType++;
  }
  if (platBad) { invalidLvls++; continue; }
  if (typeof lv.targetH !== 'number' || lv.targetH < 100) invalidLvls++;
  if (typeof lv.lavaSpeed !== 'number' || lv.lavaSpeed <= 0) invalidLvls++;
}
check('all-levels-valid', invalidLvls === 0, `invalid=${invalidLvls}/${lvls.length}`);
check('platform-types-valid', badType === 0, `bad=${badType}`);

const passed = checks.filter(c => c.ok).length;
const failed = checks.length - passed;
console.log(`Lava Rising sweep-92 verifier: ${passed}/${checks.length} checks pass`);
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ' ('+c.detail+')' : ''}`);
console.log(JSON.stringify({ verdict: failed === 0 ? 'PASS' : 'FAIL', pass: passed, fail: failed, total: checks.length, lvls: lvls.length, invalidLevels: invalidLvls, badTypes: badType, endlessPlats: endlessCount }));
process.exit(failed === 0 ? 0 : 1);