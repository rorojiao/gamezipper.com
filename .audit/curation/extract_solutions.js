#!/usr/bin/env node
/* 静态提取 447 游戏的前3关答案 → solutions.json
   类型: shading(0/1网格→点黑格) | digits(数字网格→点格+数字) | unknown
   答案来自源码 LEVELS/PUZZLES 字面量(只读提取, 不是页面作弊) */
const fs = require('fs'), path = require('path');
const ROOT = '/home/msdn/gamezipper.com';
const DEL = new Set(fs.readFileSync(path.join(ROOT, '.audit/curation/del_slugs.txt'), 'utf8').trim().split('\n'));
const NON = new Set(['admin','blog','contact','cookie-policy','terms','fun-web-games','api','audio','categories','js','scripts','node_modules']);

function balancedSlice(src, startIdx, open = '[', close = ']') {
  let depth = 0, inStr = null, esc = false;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (inStr) { if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
  }
  return null;
}

function extractLevels(src) {
  // 找 const LEVELS = [ / var LEVELS=[ / PUZZLES=[ 等
  const m = src.match(/(?:const|var|let)\s+(LEVELS|PUZZLES|STAGES|LEVEL_DATA|levels|puzzles)\s*=\s*\[/);
  if (!m) return null;
  const start = src.indexOf('[', m.index);
  const lit = balancedSlice(src, start);
  if (!lit) return null;
  try { return (new Function('return ' + lit + ';'))(); } catch (e) { return null; }
}

function isGrid(a) { return Array.isArray(a) && a.length && a.every(r => Array.isArray(r)); }
function flatIs01(a) { return a.every(v => v === 0 || v === 1); }

function normLevel(L) {
  if (!L || typeof L !== 'object') return null;
  // 常见字段名
  const solKeys = ['solution', 'sol', 'answer', 'solved', 'target', 'shade', 'black'];
  let sol = null, solKey = null;
  for (const k of solKeys) if (L[k] !== undefined) { sol = L[k]; solKey = k; break; }
  if (sol === null) return null;
  const rows = L.rows || L.R || L.h || L.height || (isGrid(sol) ? sol.length : null);
  const cols = L.cols || L.C || L.w || L.width || (isGrid(sol) ? (sol[0] || []).length : null);
  return { sol, solKey, rows, cols, clues: L.clues ?? L.givens ?? L.grid ?? L.puzzle ?? null };
}

function classify(L) {
  const n = normLevel(L);
  if (!n) return { type: 'unknown' };
  const { sol } = n;
  // 2D 网格
  if (isGrid(sol)) {
    const flat = sol.flat();
    if (flat.every(v => v === 0 || v === 1 || v === true || v === false)) return { type: 'shading', ...n };
    if (flat.every(v => typeof v === 'number' && v >= 0 && v <= 99)) return { type: 'digits', ...n };
    return { type: 'unknown' };
  }
  // 扁平数组 + rows/cols
  if (Array.isArray(sol) && n.rows && n.cols && sol.length === n.rows * n.cols) {
    if (flatIs01(sol)) return { type: 'shading-flat', ...n };
    if (sol.every(v => typeof v === 'number')) return { type: 'digits-flat', ...n };
  }
  // 扁平三元组编码 [r,c,v,...]
  if (Array.isArray(sol) && sol.length % 3 === 0 && sol.every(v => typeof v === 'number')) {
    return { type: 'triples', ...n };
  }
  return { type: 'unknown' };
}

const out = {};
const dirs = fs.readdirSync(ROOT).filter(d => {
  if (d.startsWith('.') || NON.has(d) || DEL.has(d)) return false;
  const p = path.join(ROOT, d, 'index.html');
  return fs.statSync(path.join(ROOT, d)).isDirectory() && fs.existsSync(p);
});

let stats = { shading: 0, digits: 0, triples: 0, unknown: 0, nolevels: 0 };
for (const slug of dirs) {
  const src = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  if (src.includes('http-equiv="refresh"') && src.length < 3000) continue;
  const levels = extractLevels(src);
  if (!levels || !levels.length) { stats.nolevels++; continue; }
  const first3 = levels.slice(0, 3).map(L => classify(L));
  out[slug] = { count: levels.length, levels: first3 };
  stats[first3[0].type.replace('-flat', '')] = (stats[first3[0].type.replace('-flat', '')] || 0) + 1;
}
fs.writeFileSync(path.join(ROOT, '.audit/curation/solutions.json'), JSON.stringify(out));
console.log('games with extractable solutions:', Object.keys(out).length);
console.log(stats);
