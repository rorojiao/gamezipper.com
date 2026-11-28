// cross-check L28 Phoenix ambiguity: brute-force grids, validate fully, print diff
const src = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
const m = /const\s+LEVELS\s*=\s*\[/.exec(src);
let i = src.indexOf('[', m.index), depth = 0, inStr = null, esc = false, end = -1;
for (let j = i; j < src.length; j++) { const ch = src[j];
  if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === inStr) inStr = null; continue; }
  if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
  if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
  if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
  if (ch === '[' || ch === '{') depth++;
  else if (ch === ']' || ch === '}') { depth--; if (!depth) { end = j + 1; break; } } }
const LEVELS = eval(src.slice(i, end));
const L = LEVELS[28], n = L.size;
function groups(line) { const g = []; let c = 0; for (const v of line) { if (v === 1) c++; else { if (c > 0) g.push(c); c = 0; } } if (c > 0) g.push(c); return g.length ? g : [0]; }
const rc = [], cc = [];
for (let r = 0; r < n; r++) rc.push(groups(L.sol.slice(r * n, r * n + n)));
for (let c = 0; c < n; c++) cc.push(groups(Array.from({ length: n }, (_, r) => L.sol[r * n + c])));
const norm = cl => cl.map(x => (x.length === 1 && x[0] === 0 ? [] : x));
const RN = norm(rc), CN = norm(cc);
function layouts(clue) { const out = []; (function rec(pos, part, mask) { if (part === clue.length) { out.push(mask); return; } const len = clue[part]; for (let s = pos; s + len <= n; s++) { let m = mask; for (let k = s; k < s + len; k++) m |= 1 << k; rec(s + len + 1, part + 1, m); } })(0, 0, 0); return out; }
const lay = RN.map(layouts);
const full = [];
function dfs(r, g) {
  if (full.length >= 4) return;
  if (r === n) {
    let ok = true;
    for (let c = 0; c < n && ok; c++) {
      const col = g.map(msk => (msk >> c) & 1);
      const gg = groups(col); const gg2 = (gg.length ? gg : []);
      if (JSON.stringify(gg2) !== JSON.stringify(CN[c])) ok = false;
    }
    if (ok) full.push(g.slice());
    return;
  }
  for (const mask of lay[r]) {
    g.push(mask);
    let ok = true;
    for (let c = 0; c < n && ok; c++) {
      const col = g.map(msk => (msk >> c) & 1);
      const gg = groups(col); const last = col[col.length - 1];
      if (gg.length > CN[c].length) { ok = false; break; }
      if (last === 0) { for (let k = 0; k < gg.length; k++) if (gg[k] !== CN[c][k]) { ok = false; break; } }
      else { for (let k = 0; k < gg.length - 1; k++) if (gg[k] !== CN[c][k]) { ok = false; break; }
        if (ok && gg[gg.length - 1] > CN[c][gg.length - 1]) ok = false; }
    }
    if (ok) dfs(r + 1, g);
    g.pop();
  }
}
dfs(0, []);
console.log('full grids matching clues:', full.length);
const solGrid = []; for (let r = 0; r < n; r++) solGrid.push(L.sol.slice(r * n, r * n + n).reduce((m, v, c) => m | (v << c), 0));
const key = g => g.map(x => x.toString(2).padStart(n, '0')).join('/');
console.log('stored sol is among them:', full.some(g => key(g) === key(solGrid)));
full.forEach((g, idx) => { console.log('sol#' + idx, key(g)); });
if (full.length === 2) {
  const diffs = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    if (((full[0][r] >> c) & 1) !== ((full[1][r] >> c) & 1)) diffs.push(r + ',' + c);
  console.log('cells differing:', diffs.join(' '));
}
