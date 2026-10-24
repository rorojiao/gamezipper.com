#!/usr/bin/env node
/**
 * R333: for each Sudoku-family game, print its DISTINCTIVE rule sentence(s)
 * and the data keys that carry the variant constraint. A variant whose rule
 * sentence mentions ANOTHER variant's mechanic (or whose data has no
 * variant-specific key) is an inherited-prose victim.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const extractLevels = require(path.join(ROOT, '.audit/gz-extract-levels.js'));

const FAMILY = ['sudoku', 'kropki-sudoku', 'sandwich-sudoku', 'x-sudoku', 'odd-even-sudoku',
  'arrow-sudoku', 'anti-knight-sudoku', 'greater-than-sudoku', 'outside-sudoku',
  'palindrome-sudoku', 'thermo-sudoku', 'jigsaw-sudoku', 'samurai-sudoku', 'windmill-sudoku',
  'killer-sudoku', 'kenken', 'binairo', 'strimko', 'anti-knight-sudoku'];

for (const slug of FAMILY) {
  const p = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(p)) { console.log(`\n### ${slug}: NOT PRESENT`); continue; }
  const html = fs.readFileSync(p, 'utf8');
  // JSON-LD HowTo steps
  const steps = [];
  const ldRe = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const walk = o => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type'] === 'HowToStep') {
          if (o.name) steps.push('NAME: ' + o.name);
          if (o.text) steps.push('TEXT: ' + o.text);
        }
        Object.values(o).forEach(walk);
      };
      walk(j);
    } catch (e) { /* ignore */ }
  }
  // data keys
  let arr = null;
  try { arr = extractLevels(slug); } catch (e) { arr = null; }
  const keys = new Set();
  if (Array.isArray(arr)) {
    for (const o of arr.slice(0, 5)) if (o && typeof o === 'object') Object.keys(o).forEach(k => keys.add(k));
  }
  // distinctive rule words per variant
  const VARIANT_MARKERS = {
    'kropki-sudoku': ['dot', 'consecutive', 'ratio', 'double'],
    'sandwich-sudoku': ['sandwich', 'sum', 'outside', 'crust', 'between'],
    'x-sudoku': ['diagonal', 'x'],
    'odd-even-sudoku': ['odd', 'even', 'shaded', 'parity'],
    'arrow-sudoku': ['arrow', 'direction'],
    'anti-knight-sudoku': ['knight'],
    'greater-than-sudoku': ['greater', 'inequality', 'bigger', 'larger'],
    'outside-sudoku': ['outside', 'border'],
    'palindrome-sudoku': ['palindrome', 'symmetr', 'mirror', 'read'],
    'thermo-sudoku': ['thermo', 'increasing', 'path', 'temperature'],
    'jigsaw-sudoku': ['jigsaw', 'region', 'shape'],
    'binairo': ['binary', 'black', 'white', 'same', 'different'],
  };
  const markers = VARIANT_MARKERS[slug] || [];
  const allText = steps.join(' \n ') + ' ' + html.replace(/<[^>]+>/g, ' ');
  const prose = allText.toLowerCase();
  // the visible rules block
  const vis = html.match(/<div class="rules"[^>]*>([\s\S]{0,1500}?)<\/div>/i);
  const visible = vis ? vis[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '(no .rules block)';
  console.log(`\n### ${slug}`);
  console.log(`   data keys: ${[...keys].join(', ')}`);
  console.log(`   visible rules: ${visible.slice(0, 420)}`);
  if (markers.length) {
    const hit = markers.filter(w => prose.includes(w));
    console.log(`   variant markers present: ${hit.length ? hit.join(', ') : 'NONE  <-- SUSPECT'}`);
  }
  const stepsTxt = steps.filter(s => s.startsWith('TEXT:')).join(' | ');
  console.log(`   HowTo steps: ${stepsTxt.slice(0, 460)}`);
}
