#!/usr/bin/env node
// R338 D21 — authoritative "advertised tier ladder vs shipped level ladder" probe.
//
// Ground truth sources, in authority order:
//   1. SHIPPED catalog   = inline `const LEVELS = [...]` in index.html, parsed with the
//                          canonical balanced-bracket extractor (.audit/gz-extract-levels.js).
//   2. SIBLING catalog   = <slug>/levels.json (the file build.py embeds into index.html).
//   3. COMPACT catalog   = <slug>/levels_compact.json (orphan unless something reads it).
//   4. GENERATOR spec    = gen_levels.py TIERS table (intended catalog).
//   5. VISIBLE copy      = meta description / JSON-LD in index.html (what the user is told).
//
// For every tier slice declared by the shipped `const TIERS = [...]` table we report the
// size range actually present and the numSegments range (the real difficulty proxy), so a
// tier ladder can be judged as "monotone difficulty" or "size-stalled".
//
// Usage: node .audit/r338-d21-ladder-truth.js <slug> [<slug> ...]
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const extractLevels = require(path.join(ROOT, '.audit', 'gz-extract-levels.js'));

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

// The shipped tier table is a literal `const TIERS = [ {name,start,count}, ... ];` array.
function readTierTable(html) {
  const re = /\b(?:const|let|var)\s+TIERS\s*=\s*\[/g;
  let m;
  while ((m = re.exec(html))) {
    const start = m.index + m[0].length - 1;
    // balanced-bracket scan reusing the canonical helper's scanner
    const body = html.slice(start, start + 4000);
    const arr = /^\s*\[/.exec(body);
    if (!arr) continue;
    const close = body.indexOf('];');
    if (close < 0) continue;
    try {
      const parsed = eval('(' + body.slice(0, close + 1) + ')');
      if (Array.isArray(parsed) && parsed.length && parsed[0].start !== undefined) return parsed;
    } catch (e) { /* keep scanning */ }
  }
  return null;
}

function sizeKey(l) { return l.rows + 'x' + l.cols; }

function describe(catalog) {
  if (!catalog || !catalog.length) return null;
  const segs = catalog.map(l => (typeof l.numSegments === 'number' ? l.numSegments : null)).filter(v => v !== null);
  return {
    n: catalog.length,
    sizes: catalog.reduce((acc, l) => { const k = sizeKey(l); acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
    maxRows: Math.max(...catalog.map(l => l.rows)),
    maxCols: Math.max(...catalog.map(l => l.cols)),
    segMin: segs.length ? Math.min(...segs) : null,
    segMax: segs.length ? Math.max(...segs) : null,
    hasTierField: catalog.filter(l => l.tier !== undefined).length,
  };
}

function stripTier(catalog) {
  return catalog.map(l => { const c = { ...l }; delete c.tier; delete c.numSegments; return c; });
}

function sameCatalog(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const A = JSON.stringify(a.map(l => ({ ...l, numSegments: undefined })));
  const B = JSON.stringify(b.map(l => ({ ...l, numSegments: undefined })));
  return A === B;
}

for (const slug of process.argv.slice(2)) {
  const dir = path.join(ROOT, slug);
  const htmlPath = path.join(dir, 'index.html');
  console.log('='.repeat(78));
  console.log('SLUG:', slug);
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  const shipped = extractLevels(slug);
  const sibling = readJson(path.join(dir, 'levels.json'));
  const compact = readJson(path.join(dir, 'levels_compact.json'));

  console.log('-- shipped catalog (inline, canonical extractor) --');
  console.log('   ', JSON.stringify(describe(shipped)));
  console.log('-- sibling levels.json --');
  console.log('   ', JSON.stringify(describe(sibling)));
  console.log('-- sibling levels_compact.json --');
  console.log('   ', JSON.stringify(describe(compact)));
  console.log('-- equality --');
  console.log('    inline === levels.json        :', sameCatalog(shipped, sibling));
  console.log('    inline === levels_compact.json:', sameCatalog(shipped, compact));
  console.log('    levels.json === compact       :', sameCatalog(sibling, compact));

  const tiers = readTierTable(html);
  if (tiers && shipped) {
    console.log('-- shipped TIERS table -> actual slice contents --');
    let prevSegMax = -Infinity;
    for (const t of tiers) {
      const slice = shipped.slice(t.start, t.start + t.count);
      const sizes = slice.reduce((acc, l) => { const k = sizeKey(l); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
      const segs = slice.map(l => l.numSegments).filter(v => typeof v === 'number');
      const segLo = segs.length ? Math.min(...segs) : null;
      const segHi = segs.length ? Math.max(...segs) : null;
      const sizeDistinct = Object.keys(sizes).length;
      const monotone = segLo !== null && segLo > prevSegMax;
      prevSegMax = segHi === null ? prevSegMax : Math.max(prevSegMax, segHi);
      console.log(
        `    ${String(t.name).padEnd(9)} idx ${t.start}-${t.start + t.count - 1}  sizes=${JSON.stringify(sizes)}` +
        `  segs=${segLo}..${segHi}  sizeDistinct=${sizeDistinct}` +
        `  ${sizeDistinct === 1 && t.count > 0 ? '' : ''}${monotone ? '  [seg monotone ↑]' : ''}`
      );
    }
  } else {
    console.log('-- shipped TIERS table: NOT FOUND in index.html --');
  }

  // Visible copy assertions
  const claims = [];
  const claimRe = /(\d+\s*[x×]\s*\d+)/g;
  const copySources = [
    ['meta description', (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]],
    ['og:description', (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1]],
    ['jsonld VideoGame', (html.match(/"@type":"VideoGame"[\s\S]{0,900}?"description":"([^"]*)"/) || [])[1]],
    ['jsonld FAQ', (html.match(/"@type":"FAQPage"[\s\S]{0,4000}?"description":"([^"]*)"/) || [])[1]],
  ];
  for (const [label, text] of copySources) {
    if (!text) { claims.push(`${label}: (absent)`); continue; }
    const found = [...new Set(text.match(claimRe) || [])];
    claims.push(`${label}: sizes=${JSON.stringify(found)}`);
  }
  console.log('-- visible copy size claims --');
  claims.forEach(c => console.log('    ' + c));

  if (shipped) {
    const distinct = Object.keys(describe(shipped).sizes);
    console.log('-- verdict inputs --');
    console.log('    shipped distinct sizes      :', JSON.stringify(distinct));
    console.log('    shipped max                 :', describe(shipped).maxRows + 'x' + describe(shipped).maxCols);
  }
}
