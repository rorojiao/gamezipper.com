#!/usr/bin/env node
/* W4 difficulty-tier audit: find big in-page LEVELS arrays (>=18 entries),
 * proxy complexity per entry (serialized length), split into 5 tiers, flag
 * tiers whose mean complexity decreases materially (non-monotonic gradient).
 * Output: _optimization/reports/ux-tier-audit.json */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');

function findArrays(js) {
  // crude bracket scanner: top-level arrays assigned to LEVEL(S)/PUZZLES/etc or pushed into them
  const out = [];
  const re = /(?:const|let|var)\s+(LEVELS?|PUZZLES?|BOARDS?|MAPS?|STAGES?)\s*=\s*\[/gi;
  let m;
  while ((m = re.exec(js))) {
    const start = m.index + m[0].length - 1;
    let depth = 0, inStr = null, esc = false;
    for (let i = start; i < js.length && i < start + 400000; i++) {
      const ch = js[i];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === inStr) inStr = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { out.push(js.slice(start, i + 1)); break; } }
    }
  }
  return out;
}

function entrySizes(arrSrc) {
  // split top-level commas of the array body
  const body = arrSrc.slice(1, -1);
  const sizes = [];
  let depth = 0, inStr = null, esc = false, start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if ('[{('.includes(ch)) depth++;
    else if (']})'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) { sizes.push(i - start); start = i + 1; }
  }
  sizes.push(body.length - start);
  return sizes;
}

const rows = [];
for (const d of fs.readdirSync(repo)) {
  const f = path.join(repo, d, 'index.html');
  if (!fs.existsSync(f) || !fs.statSync(path.join(repo, d)).isDirectory()) continue;
  const html = fs.readFileSync(f, 'utf8');
  const scripts = (html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || []).join('\n');
  for (const arr of findArrays(scripts)) {
    const sizes = entrySizes(arr).filter(s => s > 3);
    if (sizes.length < 18) continue;
    const tiers = 5, per = Math.floor(sizes.length / tiers);
    if (per < 3) continue;
    const means = [];
    for (let t = 0; t < tiers; t++) {
      const seg = sizes.slice(t * per, (t + 1) * per);
      means.push(+(seg.reduce((a, b) => a + b, 0) / seg.length).toFixed(1));
    }
    let violations = 0;
    for (let t = 1; t < tiers; t++) if (means[t] < means[t - 1] * 0.85) violations++;
    rows.push({ slug: d, levels: sizes.length, tierMeans: means, violations, monotonic: violations === 0 });
    break; // first qualifying array per game
  }
}
const bad = rows.filter(r => !r.monotonic);
fs.writeFileSync(path.join(repo, '_optimization', 'reports', 'ux-tier-audit.json'), JSON.stringify({ updated: new Date().toISOString(), checked: rows.length, monotonic: rows.length - bad.length, flagged: bad.length, rows, bad }, null, 1));
console.log(JSON.stringify({ checked: rows.length, monotonic: rows.length - bad.length, flagged: bad.length, flaggedList: bad.map(b => b.slug + '(v' + b.violations + ')').join(' ') }));
