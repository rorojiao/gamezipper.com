#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const code = scripts.find(s => /var\s+LEVELS\s*=\s*\[\s*\]/.test(s) && /generateLevels/.test(s));
if (!code) throw new Error('game script with generated LEVELS not found');
const prefix = code.slice(0, code.indexOf('// === AUDIO SYSTEM ==='));
const context = { console, Math, JSON, Array, Object, String, Number, Boolean };
vm.createContext(context);
vm.runInContext(prefix, context, {filename: 'pin-pull-puzzle/index.inline.js', timeout: 5000});
const LEVELS = vm.runInContext('LEVELS', context);
if (!Array.isArray(LEVELS) || LEVELS.length !== 30) throw new Error(`expected 30 levels, got ${LEVELS && LEVELS.length}`);

function enumerateOrders(level, limit = 2) {
  const pins = level.pins;
  const used = Array(pins.length).fill(false);
  let count = 0;
  let witness = null;
  function dfs(order) {
    if (count >= limit) return;
    if (order.length === pins.length) {
      count++;
      if (!witness) witness = order.slice();
      return;
    }
    for (let i = 0; i < pins.length; i++) {
      if (used[i]) continue;
      const deps = pins[i].blockedBy || [];
      if (!deps.every(d => Number.isInteger(d) && d >= 0 && d < pins.length && used[d])) continue;
      used[i] = true; order.push(i); dfs(order); order.pop(); used[i] = false;
      if (count >= limit) return;
    }
  }
  dfs([]);
  return {count, witness};
}

let pass = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const errors = [];
  if (!Number.isInteger(L.tier) || L.tier < 1 || L.tier > 5) errors.push('bad tier');
  if (!Number.isInteger(L.par) || L.par < 1) errors.push('bad par');
  if (!Array.isArray(L.pins) || !L.pins.length) errors.push('no pins');
  if (!Array.isArray(L.loot) || !L.loot.length) errors.push('no loot');
  if (!Array.isArray(L.hazards)) errors.push('bad hazards');
  if (!L.goal || !['x','y','width','height'].every(k => Number.isFinite(L.goal[k]))) errors.push('bad goal');
  for (let p = 0; p < (L.pins || []).length; p++) {
    const deps = L.pins[p].blockedBy || [];
    if (deps.some(d => !Number.isInteger(d) || d < 0 || d >= L.pins.length || d === p)) errors.push(`pin ${p} invalid dependency`);
  }
  const result = enumerateOrders(L, 2);
  if (result.count === 0) errors.push('dependency graph unsolvable');
  if (result.witness && L.par > L.pins.length) errors.push(`par ${L.par} exceeds mandatory pin count ${L.pins.length}`);
  if (errors.length) {
    console.log(`L${String(i+1).padStart(2,'0')} FAIL: ${errors.join('; ')}`);
  } else {
    pass++;
    console.log(`L${String(i+1).padStart(2,'0')} PASS orders=${result.count}${result.count >= 2 ? '+' : ''} witness=${result.witness.join(',')}`);
  }
}
console.log(`\n${pass}/${LEVELS.length} PASS (generated pack + dependency-order limit=2)`);
process.exit(pass === LEVELS.length ? 0 : 1);
