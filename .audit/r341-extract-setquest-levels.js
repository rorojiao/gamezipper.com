#!/usr/bin/env node
/**
 * R341 helper — extract set-quest's ENGINE LEVELS table from index.html.
 * The table is a JS object literal with UNQUOTED keys ({"i":0,...} is fine but
 * the outer object uses bare keys in some builds), so JSON.parse is not safe.
 * Use a balanced-bracket scan + eval() in expression context (Pitfall #46).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const SQ = path.join(path.dirname(HERE), 'set-quest');
const html = fs.readFileSync(path.join(SQ, 'index.html'), 'utf8');

const MARK = 'window.__LEVELS_DATA = ';
const i = html.indexOf(MARK);
if (i < 0) { console.error('FATAL: __LEVELS_DATA not found'); process.exit(1); }
const start = i + MARK.length;
let depth = 0, end = -1, inStr = false, strCh = '', esc = false;
for (let p = start; p < html.length; p++) {
  const ch = html[p];
  if (inStr) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === strCh) inStr = false;
    continue;
  }
  if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
  if (ch === '[' || ch === '{') depth++;
  else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { end = p + 1; break; } }
}
if (end < 0) { console.error('FATAL: unbalanced'); process.exit(1); }
const src = html.slice(start, end);
let obj;
try { obj = eval('(' + src + ')'); } catch (e) { console.error('FATAL eval: ' + e.message); process.exit(1); }
const levels = obj.LEVELS || obj;
process.stdout.write(JSON.stringify(levels));
