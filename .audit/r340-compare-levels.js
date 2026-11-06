// R340: compare the binairo and zen-garden level catalogs board-by-board.
// Extracts both arrays with a balanced-bracket scan, evaluates them, and
// normalises each level to (size, sorted givens, solution) for an exact match.
const fs = require('fs');

function extractArray(src, varname) {
  const re = new RegExp('\\b' + varname + '\\s*=\\s*\\[');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0, i = start, instr = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (instr) {
      if (c === '\\') { i++; continue; }
      if (c === instr) instr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { instr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 1);
}

const bRaw = extractArray(fs.readFileSync('binairo/index.html', 'utf8'), 'LEVELS_DATA');
const zRaw = extractArray(fs.readFileSync('zen-garden/index.html', 'utf8'), 'LEVELS');
const B = eval('(' + bRaw + ')');
const Z = eval('(' + zRaw + ')');

console.log('binairo levels:', B.length, 'zen-garden levels:', Z.length);

// normalise
const nb = B.map(l => ({
  n: l.size,
  giv: l.givens.map(g => g.slice().sort((a, b) => a - b)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map(g => g.join(',')).join(';'),
  sol: l.solution.map(r => r.join('')).join(''),
  tier: l.tier,
}));
const nz = Z.map(l => {
  const p = l.p.replace(/\./g, '0');
  const giv = [];
  for (let i = 0; i < p.length; i++) if (p[i] !== '0') giv.push([Math.floor(i / l.n), i % l.n, +p[i]]);
  return {
    n: l.n,
    giv: giv.map(g => g.join(',')).sort().join(';'),
    sol: l.s,
    tier: 'n/a',
  };
});

const keyFull = x => `${x.n}|${x.giv}|${x.sol}`;
const keyGiv = x => `${x.n}|${x.giv}`;
const keySol = x => `${x.n}|${x.sol}`;

const setB = new Set(nb.map(keyFull)), setZ = new Set(nz.map(keyFull));
const gB = new Set(nb.map(keyGiv)), gZ = new Set(nz.map(keyGiv));
const sB = new Set(nb.map(keySol)), sZ = new Set(nz.map(keySol));
const inter = [...setB].filter(k => setZ.has(k));

console.log('exact (size+givens+solution) matches:', inter.length);
for (const k of inter) {
  const ib = nb.findIndex(x => keyFull(x) === k), iz = nz.findIndex(x => keyFull(x) === k);
  console.log(`   binairo#${ib + 1} == zen-garden#${iz + 1}`);
}
console.log('givens-only matches:', [...gB].filter(k => gZ.has(k)).length);
console.log('solution-only matches:', [...sB].filter(k => sZ.has(k)).length);
for (const k of [...sB].filter(k => sZ.has(k))) {
  const ib = nb.findIndex(x => keySol(x) === k), iz = nz.findIndex(x => keySol(x) === k);
  console.log(`   same SOLUTION: binairo#${ib + 1} == zen-garden#${iz + 1}`);
}

// size distribution + givens density
const bySizeB = {}, bySizeZ = {};
nb.forEach(x => bySizeB[x.n] = (bySizeB[x.n] || 0) + 1);
nz.forEach(x => bySizeZ[x.n] = (bySizeZ[x.n] || 0) + 1);
console.log('binairo size dist:', JSON.stringify(bySizeB));
console.log('zen-garden size dist:', JSON.stringify(bySizeZ));
const densB = nb.map(x => x.giv ? x.giv.split(';').length : 0);
const densZ = nz.map(x => x.giv ? x.giv.split(';').length : 0);
const avg = a => (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1);
console.log('binairo avg givens:', avg(densB), 'zen-garden avg givens:', avg(densZ));
console.log('binairo tiers:', JSON.stringify(nb.reduce((a, x) => (a[x.tier] = (a[x.tier] || 0) + 1, a), {})));
