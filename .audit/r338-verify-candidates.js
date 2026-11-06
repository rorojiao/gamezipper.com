#!/usr/bin/env node
/**
 * R338 — ground-truth verification of the D21 candidates.
 *
 * For each candidate slug: extract the ACTUAL level catalog with a
 * balanced-bracket walker, report every distinct size/tier, and print every
 * copy claim that mentions a tier ladder or a grid size. The point is to
 * separate "the page lies" from "my extractor lies" before touching a page.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function extractLiteral(code, name) {
  const re = new RegExp(String.raw`(?:const|let|var)\s+${name}\s*=\s*`, 'g');
  const m = re.exec(code);
  if (!m) return null;
  let i = m.index + m[0].length;
  const open = code[i];
  if (open !== '[' && open !== '{') return null;
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = null;
  for (let j = i; j < code.length && j < i + 4000000; j++) {
    const c = code[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '/' && code[j + 1] === '/') { const nl = code.indexOf('\n', j); j = nl < 0 ? code.length : nl; continue; }
    if (c === '/' && code[j + 1] === '*') { const e = code.indexOf('*/', j); j = e < 0 ? code.length : e + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return code.slice(i, j + 1); }
  }
  return null;
}

function inlineCode(html) {
  return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/\bsrc\s*=/.test(m[1]))
    .filter(m => !/type\s*=\s*["']?(application\/ld\+json|application\/json)/i.test(m[1]))
    .map(m => m[2]).join('\n;\n');
}

function dimsOf(lv) {
  const out = new Set();
  for (const l of lv) {
    if (!l || typeof l !== 'object') continue;
    // explicit size string
    if (typeof l.size === 'string') out.add(l.size.replace(/\s/g, ''));
    // rows/cols
    const r = l.rows ?? l.height ?? l.r, c = l.cols ?? l.width ?? l.c;
    if (typeof r === 'number' && typeof c === 'number') out.add(`${r}x${c}`);
    else if (typeof r === 'number' && typeof c === 'undefined') out.add(`${r}x${r}`);
    // grid array of strings
    if (Array.isArray(l.grid) && l.grid.length && typeof l.grid[0] === 'string') {
      out.add(`${l.grid[0].length}x${l.grid.length}`);
    }
  }
  return [...out];
}
function tiersOf(lv) {
  const out = new Set();
  for (const l of lv) {
    if (!l || typeof l !== 'object') continue;
    for (const k of ['tier', 'difficulty', 'diff', 'rank', 'band']) {
      const v = l[k];
      if (typeof v === 'string' && v.trim()) out.add(v.trim());
      else if (typeof v === 'number') out.add(String(v));
    }
  }
  return [...out];
}

const CANDS = process.argv.slice(2);
for (const slug of CANDS) {
  console.log('\n' + '='.repeat(70));
  console.log('### ' + slug);
  const html = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  const code = inlineCode(html);

  let lv = null, src = null;
  for (const name of ['LEVELS', 'PUZZLES', 'LEVEL_DATA']) {
    const lit = extractLiteral(code, name);
    if (!lit) continue;
    try {
      const v = (0, eval)('(' + lit + ')');
      if (Array.isArray(v) && v.length) { lv = v; src = name; break; }
    } catch (e) { console.log('  eval failed for ' + name + ': ' + String(e).slice(0, 100)); }
  }
  if (!lv) { console.log('  !! could not extract catalog'); continue; }
  console.log('  catalog: ' + src + '  n=' + lv.length);
  console.log('  sizes : ' + JSON.stringify(dimsOf(lv)));
  console.log('  tiers : ' + JSON.stringify(tiersOf(lv)));

  // every copy claim about tiers / sizes
  const copy = [];
  for (const m of html.matchAll(/<meta name="description" content="([^"]*)"/g)) copy.push(m[1]);
  for (const m of html.matchAll(/<meta property="og:description" content="([^"]*)"/g)) copy.push(m[1]);
  for (const m of html.matchAll(/"acceptedAnswer":\{"@type":"Answer","text":"([^"]{0,600})"/g)) copy.push(m[1]);
  for (const m of html.matchAll(/"description"\s*:\s*"([^"]{0,600})"/g)) copy.push(m[1]);
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  copy.push(body);
  const text = copy.join(' || ');
  console.log('  --- claims ---');
  const seen = new Set();
  for (const sent of text.split(/(?<=[.!?])\s+|\s\|\|\s/)) {
    if (!/\d+\s*(x|×)\s*\d+/i.test(sent) && !/\btiers?\b/i.test(sent)) continue;
    if (/src=|href=|width=|height=|px|viewport|grid-template|repeat\(|column-gap|row-gap|font-|emoji|sprite|@media/i.test(sent)) continue;
    const k = sent.trim().slice(0, 60);
    if (seen.has(k)) continue;
    seen.add(k);
    console.log('   * ' + sent.trim().slice(0, 300));
  }
}
