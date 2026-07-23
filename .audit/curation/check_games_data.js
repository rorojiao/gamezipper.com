const fs = require('fs');
eval(fs.readFileSync('js/games-data.js', 'utf8') + ';globalThis.__G = GAMES;');
const GAMES = globalThis.__G;
const valid = GAMES.filter(g => g && g.url);
console.log('GAMES total:', GAMES.length, 'valid:', valid.length);
const DEL = fs.readFileSync('.audit/curation/del_slugs.txt', 'utf8').trim().split('\n');
const bad = valid.filter(g => DEL.includes(g.url.replace(/\//g, '')));
console.log('deleted still present:', bad.length, bad.map(g => g.url));
// 重复 url 检查
const seen = {}, dup = [];
for (const g of valid) { if (seen[g.url]) dup.push(g.url); seen[g.url] = 1; }
console.log('dup urls:', dup.length, dup);
