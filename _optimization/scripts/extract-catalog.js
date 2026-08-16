#!/usr/bin/env node
/* Extract GAMES catalog from js/games-data.js into /_optimization/catalog.json */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(repo, 'js/games-data.js'), 'utf8');

const start = src.indexOf('const GAMES = [');
if (start < 0) { console.error('GAMES decl not found'); process.exit(1); }
const arrStart = src.indexOf('[', start);
let depth = 0, inStr = null, esc = false, end = -1;
for (let i = arrStart; i < src.length; i++) {
  const ch = src[i];
  if (inStr) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === inStr) inStr = null;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
  if (ch === '[') depth++;
  else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const arrSrc = src.slice(arrStart, end + 1);
const GAMES = eval(arrSrc);

console.log('GAMES count:', GAMES.length);
const keys = new Set();
GAMES.forEach(g => Object.keys(g).forEach(k => keys.add(k)));
console.log('fields:', [...keys].join(','));
console.log('sample:', JSON.stringify(GAMES[0]));
const byStatus = {};
GAMES.forEach(g => byStatus[g.status || '?'] = (byStatus[g.status || '?'] || 0) + 1);
console.log('status:', JSON.stringify(byStatus));
const cats = {};
GAMES.forEach(g => { const k = g.category || g.cat || '?'; cats[k] = (cats[k] || 0) + 1; });
console.log('categories:', JSON.stringify(cats));

// Cross-check against dirs
const allDirs = fs.readdirSync(repo, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'))
  .map(d => d.name);
const dirSet = new Set(allDirs);
const slugOf = g => String(g.url || '').replace(/^\//, '').replace(/\/$/, '') || g.name;
const inCatalog = new Set(GAMES.map(slugOf));
const missingDir = [...inCatalog].filter(s => !dirSet.has(s));
console.log('catalog slugs without a dir:', missingDir.length, missingDir.slice(0, 10));
const gameDirs = allDirs.filter(d => fs.existsSync(path.join(repo, d, 'index.html')));
const notInCatalog = gameDirs.filter(d => !inCatalog.has(d));
console.log('dirs with index.html not in catalog:', notInCatalog.length, notInCatalog.slice(0, 30));

fs.writeFileSync(path.join(repo, '_optimization', 'state', 'catalog.json'), JSON.stringify({
  extracted_at: new Date().toISOString(),
  count: GAMES.length,
  games: GAMES,
}, null, 1));
console.log('written: _optimization/state/catalog.json');
