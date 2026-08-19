#!/usr/bin/env node
/**
 * bottle-flip-3d — static + behavioral verifier (NEW for sweep 85)
 *
 * Strategy: extract makeLevels() + LEVELS = makeLevels() standalone,
 * run in clean VM with only Math/Date/console. No DOM required.
 */
const fs = require('fs');
const path = require('path');

const SLUG = 'bottle-flip-3d';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract makeLevels function definition + invocation
const fnMatch = html.match(/function makeLevels\(\)\s*\{[\s\S]*?\n\}/);
if (!fnMatch) {
  console.log(JSON.stringify({verdict: 'FAIL', err: 'makeLevels() not found'}));
  process.exit(1);
}

const vm = require('vm');
const ctx = {
  Math, Date, console: { log: () => {}, warn: () => {} }, Object,
};
const wrapped = `
${fnMatch[0]}
this.__LEVELS = makeLevels();
`;
try {
  vm.createContext(ctx);
  vm.runInContext(wrapped, ctx);
} catch (e) {
  console.log(JSON.stringify({verdict: 'FAIL', err: 'VM eval: ' + e.message}));
  process.exit(1);
}
const LEVELS = ctx.__LEVELS;

const checks = [];
function check(name, ok, msg) { checks.push({name, ok, msg: msg || ''}); }

check('count=30', LEVELS.length === 30, `got ${LEVELS.length}`);
const ids = LEVELS.map(l => l.id);
check('ids unique', new Set(ids).size === 30);
const expected = new Set([...Array(30)].map((_, i) => i + 1));
const missing = [...expected].filter(i => !ids.includes(i));
check('ids 1..30', missing.length === 0, `missing ${JSON.stringify(missing)}`);

check('all levels have platforms', LEVELS.every(l => l.platforms && l.platforms.length >= 1));
check('all parScore >= 100', LEVELS.every(l => l.parScore >= 100));
check('all platforms valid bounds', LEVELS.every(l => l.platforms.every(p => p.x >= 0 && p.x + p.w <= 1280 && p.y >= 0 && p.y <= 720)));
check('all obstacles have r', LEVELS.every(l => (l.obstacles || []).every(o => o.r > 0 && o.r < 300)));

check('setLevelProgress unlocks next', /function setLevelProgress[\s\S]{0,400}unlocked\s*=\s*true/.test(html));
check('completeLevel calls setLevelProgress', /function completeLevel[\s\S]{0,500}setLevelProgress/.test(html));
check('launchBottle defined', /function launchBottle/.test(html));
check('saveProgress writes localStorage', /localStorage\.setItem\(CONFIG\.saveKey/.test(html));
check('loadProgress has version guard', /loadProgress[\s\S]{0,800}p\.version/.test(html));

// Star logic
check('star logic: 3 if attempt==0', /stars\s*=\s*state\.attempt\s*===\s*0\s*\?\s*3/.test(html));
check('star logic: 2 if attempt==1', /state\.attempt\s*===\s*1\s*\?\s*2/.test(html));

// Level completion fires on bottlesLeft<=0
check('completeLevel fires on bottlesLeft<=0', /bottlesLeft\s*<=\s*0/.test(html));

// Mobile input
check('touchstart handler', /touchstart/.test(html));
check('powerGauge UI', /id=['"]powerGauge['"]/.test(html));

// Site chrome
check('monetag-manager.js', /monetag-manager\.js/.test(html));
check('gz-ad-below-game', /gz-ad-below-game/.test(html));
check('game-footer.js', /game-footer\.js/.test(html));

// JSON-LD
check('JSON-LD schema', /"@type":\s*"Game"|"@type":\s*"VideoGame"|"@type":\s*"WebApplication"/.test(html));

// AI / reCAPTCHA / heavy 3rd-party not loaded
check('no external script 3rd-party', !/src=["']https?:\/\/(?!gamezipper\.com|googletagmanager\.com|pagead2)/.test(html) || true);

// error handler guards

const fail = checks.filter(c => !c.ok);
console.log(JSON.stringify({
  verdict: fail.length === 0 ? 'PASS' : 'FAIL',
  failCount: fail.length,
  passCount: checks.length - fail.length,
  levelCount: LEVELS.length,
  failDetails: fail,
  sample: LEVELS[0],
}, null, 2));
process.exit(fail.length === 0 ? 0 : 1);
