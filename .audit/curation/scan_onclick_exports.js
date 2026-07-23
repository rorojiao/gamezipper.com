#!/usr/bin/env node
/* 静态扫描: inline onclick/on* 引用了 IIFE 内部函数但未 window.* 导出 → 玩家点击必然 ReferenceError
   输出: onclick_missing.json {slug: [missingFn,...]} */
const fs = require('fs'), path = require('path');
const ROOT = '/home/msdn/gamezipper.com';
const DEL = new Set(fs.readFileSync(ROOT + '/.audit/curation/del_slugs.txt', 'utf8').trim().split('\n'));
const NON = new Set(['admin','blog','contact','cookie-policy','terms','fun-web-games','api','audio','categories','js','scripts','node_modules']);

const out = {};
for (const d of fs.readdirSync(ROOT)) {
  if (d.startsWith('.') || NON.has(d) || DEL.has(d)) continue;
  const p = path.join(ROOT, d, 'index.html');
  if (!fs.existsSync(p) || !fs.statSync(path.join(ROOT, d)).isDirectory()) continue;
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes('http-equiv="refresh"') && src.length < 3000) continue;

  // 收集 inline handler 里调用的函数名
  const called = new Set();
  for (const m of src.matchAll(/on(?:click|pointerdown|touchstart|change|input|submit)\s*=\s*"([^"]+)"|on(?:click|pointerdown|touchstart|change|input|submit)\s*=\s*'([^']+)'/g)) {
    const code = m[1] || m[2] || '';
    for (const f of code.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const name = f[1];
      if (!['if','for','while','return','function','alert','confirm'].includes(name)) called.add(name);
    }
  }
  if (!called.size) continue;
  // 收集 window.X = 导出
  const exposed = new Set([...src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1]));
  // 顶层 function 声明 (粗糙: 不在任何 (function(){}) 包裹内的很难静态判, 用近似: 若文件含 IIFE 且函数在 IIFE 内定义且未导出 → missing)
  const isIIFE = /\(function\s*\(\)\s*\{|!function\s*\(\)\s*\{|\(\(\)\s*=>/.test(src);
  const missing = [];
  for (const fn of called) {
    if (exposed.has(fn)) continue;
    // 若 fn 定义在顶层 script(非IIFE), inline handler 可访问 → OK
    // 近似判定: 找到 "function fn(" 出现位置, 检查其是否在最内层 IIFE 包裹中 —— 简化: 若文件有 IIFE 且该函数只出现在 IIFE 起止之间
    const defIdx = src.search(new RegExp('function\\s+' + fn + '\\s*\\('));
    if (defIdx < 0) {
      // 可能是 var fn = function / const fn = ( 或箭头
      const def2 = src.search(new RegExp('(var|let|const)\\s+' + fn + '\\s*=\\s*(function|\\()'));
      if (def2 < 0) { missing.push(fn + ' (no def found)'); continue; }
    }
    if (isIIFE) {
      // 找 IIFE 范围
      const iifeStart = src.search(/\(function\s*\(\)\s*\{/);
      const defPos = src.search(new RegExp('function\\s+' + fn + '\\s*\\('));
      if (defPos > iifeStart && !exposed.has(fn)) missing.push(fn);
    }
  }
  if (missing.length) out[d] = missing;
}
fs.writeFileSync(ROOT + '/.audit/curation/onclick_missing.json', JSON.stringify(out, null, 1));
console.log('games with potentially unexposed onclick functions:', Object.keys(out).length);
for (const [k, v] of Object.entries(out)) console.log(' ', k, '→', v.join(', '));
