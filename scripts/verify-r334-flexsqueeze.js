#!/usr/bin/env node
/**
 * R334 P0 regression gate — "body-flex squeeze".
 *
 * BUG CLASS
 *   A game page whose <body> uses `display:flex` in the ROW direction makes
 *   every body-level child a flex item. The site-wide sections that the
 *   platform appends to <body> (`.gz-related-games`, `.gz-blog-links`) then
 *   compete for horizontal space with the game's own root container, which
 *   is a shrinkable flex item. On a 390px viewport the game root collapses
 *   to ~78px (sometimes ~12px) and the puzzle board becomes unplayable.
 *
 *   Measured live on str8ts (2026-10-24): game root 78px of a 390px
 *   viewport, canvas rendered 78x78 instead of 366x366, board unreadable.
 *
 * FIX
 *   `body{flex-wrap:wrap}` plus pinning the platform sections to a full
 *   row, so they stack BELOW the game instead of beside it:
 *
 *     /* R334 flex-squeeze fix *\/
 *     body{flex-wrap:wrap}
 *     body > .gz-related-games,body > .gz-blog-links{flex:0 0 100%;...}
 *
 * WHAT THIS GATE CHECKS (static — no browser needed, runs in CI)
 *   1. Every live game whose body is a ROW flex container AND which ships
 *      the platform sections at body level MUST carry the R334 fix block.
 *   2. The fix block must live INSIDE a <style> element (a bare rule in the
 *      HTML body would be inert).
 *   3. <style>/<script> tag balance must be preserved.
 *
 * EXIT CODE
 *   0 = PASS, 1 = at least one game is missing the fix.
 *
 * NOTE on the false-positive risk (Pitfall #30 / #55): the static detector
 * is a SUPERSET of the runtime bug. A game can match the pattern and still
 * render fine (e.g. its root already declares flex-shrink:0, or the
 * platform sections are absent). The gate therefore only asserts that the
 * DEFENSIVE fix is present on every pattern-matching game — never that a
 * game is broken. Runtime truth is established by the Kachilu probe
 * (scripts/verify-r334-flexsqueeze-browser.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MARK = 'R334 flex-squeeze fix';

const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8');
const t = src.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
const GAMES = new Function(t + '; return GAMES;')();
const live = GAMES.filter(g => g.status === 'live').map(g => g.url.replace(/^\//, '').replace(/\/$/, ''));

const pattern = [];
const missing = [];
const malformed = [];
const unbalanced = [];

for (const slug of live) {
  const f = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');

  // (1) body is a ROW flex container
  const bodyDecls = [...html.matchAll(/(?:^|[,{;\s])body\s*\{([^}]*)\}/g)].map(m => m[1]);
  const flexBody = bodyDecls.find(d => /display\s*:\s*flex/.test(d) && !/flex-direction\s*:\s*column/.test(d));
  if (!flexBody) continue;

  // (2) the platform sections exist at body level
  const hasRel = /<section[^>]*class="[^"]*gz-related-games/.test(html);
  const hasBlog = /<div[^>]*class="[^"]*gz-blog-links/.test(html);
  if (!hasRel && !hasBlog) continue;

  pattern.push(slug);

  // (3) the fix must be present, inside a <style> block
  if (!html.includes(MARK)) {
    missing.push(slug);
    continue;
  }
  const styleOpen = html.lastIndexOf('<style', html.indexOf(MARK));
  const styleClose = html.indexOf('</style>', html.indexOf(MARK));
  if (styleOpen < 0 || styleClose < 0 || styleClose < styleOpen) {
    malformed.push(slug + ' (fix block not inside a <style> element)');
    continue;
  }

  // (4) tag balance
  const so = (html.match(/<script/g) || []).length, sc = (html.match(/<\/script>/g) || []).length;
  const stO = (html.match(/<style/g) || []).length, stC = (html.match(/<\/style>/g) || []).length;
  if (so !== sc || stO !== stC) unbalanced.push(slug + ' (script ' + so + '/' + sc + ', style ' + stO + '/' + stC + ')');
}

console.log('R334 flex-squeeze gate');
console.log('  live games scanned              : ' + live.length);
console.log('  matching the body-flex pattern  : ' + pattern.length);
console.log('  carrying the fix                : ' + (pattern.length - missing.length - malformed.length));
if (missing.length) {
  console.log('  MISSING THE FIX (' + missing.length + '):');
  missing.forEach(s => console.log('    - ' + s));
}
if (malformed.length) {
  console.log('  MALFORMED (' + malformed.length + '):');
  malformed.forEach(s => console.log('    - ' + s));
}
if (unbalanced.length) {
  console.log('  UNBALANCED TAGS (' + unbalanced.length + '):');
  unbalanced.forEach(s => console.log('    - ' + s));
}

const fail = missing.length + malformed.length + unbalanced.length;
console.log(fail === 0 ? 'VERDICT: PASS' : 'VERDICT: FAIL');
process.exit(fail === 0 ? 0 : 1);
