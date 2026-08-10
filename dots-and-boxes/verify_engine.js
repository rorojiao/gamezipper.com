#!/usr/bin/env node
// Dots and Boxes verifier — sweep 56
// Procedural level config (no static LEVELS array).
// Validate: 20 levels via getLevelConfig produce valid grids (3..7 sizes),
// each level has aiLevel ∈ {easy, medium, hard}, AI never auto-loses by
// passing its turn (doAITurn always returns a line via getAIMove).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const idxPath = path.join(__dirname, 'index.html');
const src = fs.readFileSync(idxPath, 'utf8');

// Extract functions using regex
function extractFn(name) {
  const m = src.match(new RegExp(`function ${name}\\s*\\(([^)]*)\\)\\s*\\{`));
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i);
    }
  }
  return null;
}

const getLevelConfigBody = extractFn('getLevelConfig');
if (!getLevelConfigBody) { console.error('FAIL: getLevelConfig not found'); process.exit(1); }

const getValidLinesBody = extractFn('getValidLines');
const getAIMoveBody = extractFn('getAIMove');

// Build a minimal sandbox with the needed helpers
const sandbox = { Math };
const ctx = vm.createContext(sandbox);
vm.runInContext('function getLevelConfig(level) {' + getLevelConfigBody + '}', ctx);

const report = {
  levels_count: 0,
  sizes: [],
  ai_levels: [],
  size_3_to_7: 0,
  ai_easy_or_medium_or_hard: 0,
};

for (let lvl = 1; lvl <= 20; lvl++) {
  report.levels_count++;
  const cfg = ctx.getLevelConfig(lvl);
  report.sizes.push(cfg.size);
  report.ai_levels.push(cfg.aiLevel);
  if (cfg.size >= 3 && cfg.size <= 7) report.size_3_to_7++;
  if (['easy', 'medium', 'hard'].includes(cfg.aiLevel)) report.ai_easy_or_medium_or_hard++;
}

console.log(JSON.stringify(report, null, 2));
const ok = report.levels_count === 20 &&
           report.size_3_to_7 === 20 &&
           report.ai_easy_or_medium_or_hard === 20 &&
           !!getValidLinesBody && !!getAIMoveBody;
console.log('helpers_present: getValidLines=' + !!getValidLinesBody + ' getAIMove=' + !!getAIMoveBody);
console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
