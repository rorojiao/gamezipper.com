#!/usr/bin/env node
/**
 * Maze Bridge Puzzle - QA Code-Level Checklist
 * Validates structural integrity of the game without a browser.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const checks = [];
function check(name, cond) { checks.push({name, pass: !!cond}); }

// 1. Files exist
const html = fs.readFileSync(path.join(dir,'index.html'),'utf8');
const lvJson = JSON.parse(fs.readFileSync(path.join(dir,'levels.json'),'utf8'));
check('index.html exists & non-empty', html.length > 5000);
check('levels.json parses', Array.isArray(lvJson.levels));
check('icon.png exists', fs.existsSync(path.join(dir,'icon.png')));
check('og-image.jpg exists', fs.existsSync(path.join(dir,'og-image.jpg')));
check('BENCHMARK.md exists', fs.existsSync(path.join(dir,'BENCHMARK.md')));

// 2. Level data
const levels = lvJson.levels;
check('exactly 30 levels', levels.length === 30);
check('levels numbered 1-30', levels.every((l,i)=>l.level===i+1));
check('all have grid arrays', levels.every(l=>Array.isArray(l.grid)));
check('all have budget', levels.every(l=>typeof l.budget==='number'&&l.budget>=1));
check('all have start S', levels.every(l=>l.grid.some(r=>r.includes('S'))));
check('all have end E', levels.every(l=>l.grid.some(r=>r.includes('E'))));
check('all have gaps ~', levels.every(l=>l.grid.some(r=>r.includes('~'))));

// 3. HTML structure
check('has DOCTYPE', html.includes('<!DOCTYPE html>'));
check('has viewport meta', html.includes('viewport'));
check('has og:title', html.includes('og:title'));
check('has og:image', html.includes('og:image'));
check('has description meta', html.includes('name="description"'));
check('has keywords meta', html.includes('name="keywords"'));
check('has canvas element', html.includes('<canvas'));
check('has touch-action none', html.includes('touch-action:none'));
check('has Web Audio API', html.includes('AudioContext'));
check('has BGM function', html.includes('startBGM'));
check('has SFX function', html.includes('function sfx'));
check('has undo function', html.includes('function undo'));
check('has hint function', html.includes('useHint'));
check('has localStorage progress', html.includes('localStorage'));
check('has schema.org JSON-LD', html.includes('application/ld+json'));
check('has VideoGame schema', html.includes('"VideoGame"'));
check('has FAQPage schema', html.includes('"FAQPage"'));
check('has HowTo schema', html.includes('"HowTo"'));
check('has BreadcrumbList schema', html.includes('"BreadcrumbList"'));
check('levels embedded (no placeholder)', !html.includes('__LEVELS_JSON__'));
check('mobile responsive (clamp)', html.includes('clamp('));

// 4. Difficulty progression
const sizes = levels.map(l=>l.width);
check('sizes increase (5->9)', sizes[0]===5 && sizes[29]===9);
const budgets = levels.map(l=>l.budget);
check('budgets increase (1->3)', budgets[0]===1 && budgets[29]===3);

// 5. Single-file (no external JS/CSS deps except icon/og)
const extRefs = (html.match(/src="[^"]*"/g)||[]).filter(s=>!s.includes('icon.png'));
check('no external JS deps', extRefs.length===0);

// Report
const pass = checks.filter(c=>c.pass).length;
const fail = checks.filter(c=>!c.pass);
console.log(`\n=== QA CHECKLIST: ${pass}/${checks.length} passed ===\n`);
checks.forEach(c=>console.log(`${c.pass?'✅':'❌'} ${c.name}`));
if(fail.length){
  console.log('\nFAILURES:');
  fail.forEach(c=>console.log('  ❌ '+c.name));
  process.exit(1);
}
console.log('\n✅ ALL QA CHECKS PASSED');
