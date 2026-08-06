#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const tierMatch = html.match(/const TIERS\s*=\s*(\[[\s\S]*?\n\]);/);
const themesMatch = html.match(/const T\s*=\s*\{([\s\S]*?)\n\};\nconst TIERS/);
if (!tierMatch || !themesMatch) throw new Error('Could not extract TIERS/themes');

const tiers = Function('return ' + tierMatch[1])();
const paletteSizes = [...themesMatch[1].matchAll(/pads:\s*\[([^\]]+)\]/g)]
  .map(m => [...m[1].matchAll(/#[0-9a-f]{6}/gi)].length);
if (paletteSizes.length !== 5 || paletteSizes.some(n => n !== 6)) {
  throw new Error('Expected five six-color theme palettes, got ' + paletteSizes.join(','));
}

const usesSpawnedPadColors = /const themeCol\s*=\s*padColors\[Math\.floor\(Math\.random\(\)\*padColors\.length\)\]/.test(html);
const usesFullThemePalette = /const themeCol\s*=\s*theme\.pads\[Math\.floor\(Math\.random\(\)\*theme\.pads\.length\)\]/.test(html);

let pass = 0;
const failures = [];
for (let level = 1; level <= 25; level++) {
  const tier = tiers.find(t => t.lvls.includes(level));
  if (!tier) { failures.push(`L${level}: missing tier`); continue; }
  const guaranteed = usesSpawnedPadColors && !usesFullThemePalette && tier.pads >= 1 && tier.zones >= 1;
  if (guaranteed) pass++;
  else failures.push(`L${level}: zone colors are not guaranteed to be in the ${tier.pads}-pad spawned set`);
}

console.log(JSON.stringify({ total: 25, pass, fail: failures.length, usesSpawnedPadColors, failures }, null, 2));
if (pass !== 25 || failures.length) process.exit(1);