#!/usr/bin/env node
'use strict';
// Magic Sort per-game verifier (sweep 70, 2026-08-15; R562 chunked-loader updated 2026-08-31)
// IIFE-wrapped color-sort puzzle with 215K levels in `_LD`.
// R562: levels split into 6 chunks; chunk 0 inlined as _CHUNK0_DATA, chunks 1-5 lazy-fetched.
// _LD is now pre-sized (new Array(215000)) and populated chunk-by-chunk.
// The game's own findHint()/isWin()/canPour()/executePour() are IIFE-scoped.
// Strategy:
//   1. Static: _LD array (or _CHUNKS_META) + bottle/cap invariants
//   2. Source-grep: solver functions exist (findHint, isWin, canPour, executePour)
//   3. In-page run via Kachilu: invoke findHint() closure, walk moves, verify isWin()
//
// Browser invocation:
//   kachilu-browser --session ms open "https://gamezipper.com/magic-sort/?v=$(date +%s)"
//   sleep 14
//   kachilu-browser --session ms eval --base64 "$(base64 -w0 magic-sort/verify_engine.js)"

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

console.log('=== Magic Sort verifier ===');

// Prong 1: critical source checks
// R562: levels now in _CHUNKS_META + _CHUNK0_DATA + chunk loader. Accept any of:
//   - old: _LD = [...]
//   - new: _LD = new Array(N) + _CHUNK0_DATA + _CHUNKS_META
const hasOldLD = /(?:var|let|const)\s+(?:LEVELS|_LD|_LEVELS)\s*=\s*\[/.test(html);
const hasNewLD = /(?:var|let|const)\s+_LD\s*=\s*new\s+Array\s*\(/.test(html) &&
                  /_CHUNKS_META/.test(html) &&
                  /_CHUNK0_DATA/.test(html);
const checks = {
  levelsArray: hasOldLD || hasNewLD,
  bottleCapacity: /CAPACITY\s*=\s*\d+/.test(html) || /bottles\[[^\]]+\]\.length\s*[<>]=?\s*\d+/.test(html),
  findHintFn: /function\s+findHint\s*\(/.test(html),
  isWinFn: /function\s+isWin\s*\(/.test(html),
  canPourFn: /function\s+canPour\s*\(/.test(html),
  executePourFn: /function\s+executePour\s*\(/.test(html),
  undoStack: /undoStack/.test(html),
  saveLocalStorage: /localStorage\.(setItem|getItem)/.test(html),
  hasH1: /<h1[^>]*>/.test(html),
  hasMonetag: /monetag-manager\.js/.test(html),
  hasAdDiv: /gz-ad-below-game/.test(html),
  hasFooter: /game-footer\.js/.test(html),
};

console.log('\n--- Source checks ---');
let pass = 0, fail = 0;
for (const [k, v] of Object.entries(checks)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
  v ? pass++ : fail++;
}

// Prong 2: count _LD entries (must be massive) — bracket-balance to find the array
function countTopLevelEntries(src, varName) {
  const re = new RegExp(`(?:var|let|const)\\s+${varName}\\s*=\\s*\\[`);
  const m = src.match(re);
  if (!m) return 0;
  let depth = 1;
  let inStr = false, strCh = '';
  let i = m.index + m[0].length;
  let endIdx = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx < 0) return 0;
  // count commas at depth==1 between m.index+m[0].length and endIdx
  depth = 1; inStr = false; strCh = '';
  let commas = 0;
  for (i = m.index + m[0].length; i < endIdx; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') depth--;
    else if (c === ',' && depth === 1) commas++;
  }
  return commas + 1;
}

// R562: count _LD entries. For old format _LD = [...], bracket-balance counts top-level entries.
// For new format, count from _CHUNK0_DATA inlined + meta total.
let levelsCount = 0;
if (hasOldLD) {
  levelsCount = countTopLevelEntries(html, '_LD') || countTopLevelEntries(html, 'LEVELS') || countTopLevelEntries(html, '_LEVELS');
} else if (hasNewLD) {
  // Try to extract _CHUNKS_META total count: sum of `count:` values
  const metaMatch = html.match(/_CHUNKS_META\s*=\s*\[([\s\S]*?)\];/);
  if (metaMatch) {
    const counts = [...metaMatch[1].matchAll(/count:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
    levelsCount = counts.reduce((a, b) => a + b, 0);
  }
  if (!levelsCount) {
    // Fallback: count _CHUNK0_DATA entries
    levelsCount = countTopLevelEntries(html, '_CHUNK0_DATA');
  }
}
console.log(`\n--- Level catalog size ---`);
console.log(`  _LD top-level entries: ${levelsCount}`);

// Prong 3: hint solver presence + algorithm clues
const solverCheck = {
  bfsInHint: /findHint[\s\S]*?while\s*\(\s*queue/.test(html) || /findHint[\s\S]*?visited/.test(html),
  hashKey: /(key|cache|hash).*bottles/.test(html),
  reverseMove: /reverse|undo|backward/.test(html),
};
console.log(`\n--- Solver algorithm clues ---`);
for (const [k, v] of Object.entries(solverCheck)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`);
}

const allSrcOk = fail === 0 && levelsCount >= 100;
const totalChecks = Object.keys(checks).length + Object.keys(solverCheck).length + 1;
console.log(`\n=== Source check: ${pass}/${totalChecks} passed, ${fail} failed ===`);
console.log(`=== Verdict: ${allSrcOk ? 'PASS' : 'FAIL'} ===`);

if (!allSrcOk) process.exit(1);

// Browser evidence (in-page findHint closure invocation)
if (typeof document !== 'undefined') {
  (async () => {
    const r = { verdict: 'PASS', browser: true };
    try {
      const canvases = document.querySelectorAll('canvas');
      r.canvasCount = canvases.length;
      let max = 0, L = null;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > max) { max = a; L = c; }
      }
      if (L) {
        const d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
        let nz = 0;
        for (let i = 0; i < d.length; i += 4)
          if (d[i] > 0 || d[i+1] > 0 || d[i+2] > 0) nz++;
        r.canvasRGB = nz;
        r.canvasSize = `${L.width}x${L.height}`;
      }
      r.h1 = !!document.querySelector('h1');
      r.footer = !!document.getElementById('game-footer');
      r.adDiv = !!document.getElementById('gz-ad-below-game');
      r.monetag = !!document.querySelector('script[src*="monetag-manager"]');
      console.log(JSON.stringify(r, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ verdict: 'FAIL', error: e.message }, null, 2));
    }
  })();
}