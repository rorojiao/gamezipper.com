#!/usr/bin/env node
/**
 * Set Quest QA Checklist (123+ checks).
 *
 * Validates index.html against production quality standards:
 *  - HTML structure + SEO meta (canonical, og:*, twitter:*, title/description lengths)
 *  - JSON-LD (VideoGame + FAQPage + BreadcrumbList, every block JSON.parse-validated)
 *  - Game systems (screens, buttons, HUD ids)
 *  - Inline __LEVELS_DATA (30 levels, 5 tiers, full per-level fields)
 *  - Engine API (window.setQuest)
 *  - Web Audio + cleanup on the handlers THIS FILE actually has
 *    (pagehide + beforeunload both stop the timer and close the AudioContext;
 *     this game has no visibilitychange handler — asserted as found, not guessed)
 *  - localStorage persistence
 *  - Monetization (Monetag manager + sanctioned multitag, Adsterra, footer, analytics,
 *    AdSense ins+loader) and NO zombie ad networks
 *  - Assets on disk + size budgets
 *  - Accessibility (aria-label/aria-pressed/role=dialog/aria-modal)
 *  - Mobile (viewport, auto-fit minmax grid, dvh units, safe-area, touch-action)
 *  - The three verifiers actually pass when executed
 *
 * R963 pitfall: every filesystem access is anchored to THIS script's directory.
 * Running from the repo root must never audit <root>/index.html (the HOMEPAGE)
 * instead of set-quest/index.html (cwd-shadow bug class).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const gz = f => path.join(HERE, f);

const HTML = fs.readFileSync(gz('index.html'), 'utf8');

let passed = 0, failed = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) passed++;
  else { failed++; failures.push(name + (detail ? ': ' + detail : '')); }
  const mark = ok ? '\u2713' : '\u2717';
  console.log(`  ${mark} ${name}: ${detail || (ok ? 'ok' : 'FAILED')}`);
}

// ---------- A. HTML / SEO ----------
check('A01 doctype', /^<!DOCTYPE html>/i.test(HTML));
check('A02 lang=en', /<html lang="en"/.test(HTML));
check('A03 utf8 charset', /<meta charset="UTF-8">/i.test(HTML));
check('A04 viewport width=device-width', /<meta\s+name="viewport"[^>]*width=device-width/.test(HTML));
check('A05 viewport-fit=cover', /viewport-fit=cover/.test(HTML));
check('A06 theme-color', /<meta\s+name="theme-color"\s+content="#0a1430">/.test(HTML));
check('A07 canonical present', /<link\s+rel="canonical"/.test(HTML));
check('A08 canonical URL exact', /rel="canonical"\s+href="https:\/\/gamezipper\.com\/set-quest\/"/.test(HTML));
check('A09 og:type', /<meta\s+property="og:type"\s+content="website">/.test(HTML));
check('A10 og:title', /<meta\s+property="og:title"\s+content="[^"]+"/.test(HTML));
check('A11 og:description', /<meta\s+property="og:description"\s+content="[^"]+"/.test(HTML));
check('A12 og:image', /<meta\s+property="og:image"\s+content="[^"]+"/.test(HTML));
check('A13 og:image URL exact', /property="og:image"\s+content="https:\/\/gamezipper\.com\/set-quest\/og-image\.jpg"/.test(HTML));
check('A14 og:url', /<meta\s+property="og:url"\s+content="https:\/\/gamezipper\.com\/set-quest\/">/.test(HTML));
check('A15 twitter:card', /<meta\s+name="twitter:card"\s+content="summary_large_image">/.test(HTML));
check('A16 twitter:title', /<meta\s+name="twitter:title"\s+content="[^"]+"/.test(HTML));
check('A17 twitter:description', /<meta\s+name="twitter:description"\s+content="[^"]+"/.test(HTML));
check('A18 twitter:image', /<meta\s+name="twitter:image"\s+content="https:\/\/gamezipper\.com\/set-quest\/og-image\.jpg">/.test(HTML));
const titleM = HTML.match(/<title>([^<]*)<\/title>/);
check('A19 title non-empty', !!titleM && titleM[1].trim().length > 0,
  titleM ? `"${titleM[1].slice(0, 40)}..."` : 'no <title>');
check('A20 title < 70 chars', !!titleM && titleM[1].length < 70,
  titleM ? `${titleM[1].length} chars` : 'no <title>');
const descM = HTML.match(/<meta\s+name="description"\s+content="([^"]+)"/);
check('A21 description 50..300 chars', !!descM && descM[1].length >= 50 && descM[1].length <= 300,
  descM ? `${descM[1].length} chars` : 'no meta description');
check('A22 SVG data-URI favicon', /rel="icon"\s+type="image\/svg\+xml"\s+href="data:image\/svg\+xml/.test(HTML));
check('A23 h1 gz-sr-only', /<h1 class="gz-sr-only">[^<]+<\/h1>/.test(HTML));

// ---------- B. JSON-LD ----------
const ldBlocks = (HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [])
  .map(b => b.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, ''));
check('B01 JSON-LD block count 3', ldBlocks.length === 3, `${ldBlocks.length} blocks`);

let vg = null, faq = null, bc = null;
let allValid = ldBlocks.length > 0;
for (let i = 0; i < ldBlocks.length; i++) {
  try { JSON.parse(ldBlocks[i]); } catch (e) {
    allValid = false;
    console.error(`  !! JSON-LD block ${i + 1} is INVALID JSON: ${e.message}`);
  }
}
for (const b of ldBlocks) {
  let o = null;
  try { o = JSON.parse(b); } catch (e) { continue; }
  if (o['@type'] === 'VideoGame') vg = o;
  if (o['@type'] === 'FAQPage') faq = o;
  if (o['@type'] === 'BreadcrumbList') bc = o;
}
check('B02 VideoGame present', !!vg);
check('B03 VideoGame valid JSON', ldBlocks.some(b => { try { return JSON.parse(b)['@type'] === 'VideoGame'; } catch (e) { return false; } }));
check('B04 VideoGame @context schema.org', !!vg && vg['@context'] === 'https://schema.org');
check('B05 VideoGame genre=Puzzle', !!vg && vg.genre === 'Puzzle');
check('B06 VideoGame price 0', !!vg && vg.offers && String(vg.offers.price) === '0');
check('B07 VideoGame publisher GameZipper', !!vg && vg.publisher && vg.publisher.name === 'GameZipper');
check('B08 VideoGame isAccessibleForFree', !!vg && vg.isAccessibleForFree === true);
check('B09 VideoGame numberOfPlayers 1', !!vg && vg.numberOfPlayers && Number(vg.numberOfPlayers.value) === 1);
check('B10 FAQPage present', !!faq);
check('B11 FAQPage valid JSON', ldBlocks.some(b => { try { return JSON.parse(b)['@type'] === 'FAQPage'; } catch (e) { return false; } }));
check('B12 FAQPage >= 4 questions', !!faq && Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 4,
  faq ? `${faq.mainEntity.length} questions` : 'n/a');
check('B13 BreadcrumbList present', !!bc);
check('B14 BreadcrumbList valid JSON', ldBlocks.some(b => { try { return JSON.parse(b)['@type'] === 'BreadcrumbList'; } catch (e) { return false; } }));
check('B15 BreadcrumbList 3 items', !!bc && Array.isArray(bc.itemListElement) && bc.itemListElement.length === 3,
  bc ? `${bc.itemListElement.length} items` : 'n/a');
check('B16 every JSON-LD block valid JSON', allValid);

// ---------- C. Game systems ----------
check('C01 screen-menu', /id="screen-menu"/.test(HTML));
check('C02 screen-levels', /id="screen-levels"/.test(HTML));
check('C03 screen-game', /id="screen-game"/.test(HTML));
for (const id of ['btn-play', 'btn-how', 'btn-hint', 'btn-undo', 'btn-reset-level',
  'btn-check', 'btn-back-menu', 'btn-back-levels', 'btn-next', 'btn-prev',
  'btn-replay', 'btn-next-win', 'btn-close-how']) {
  check(`C04 button #${id}`, new RegExp(`id="${id}"`).test(HTML));
}
for (const id of ['board', 'err-count', 'hint-count', 'selected-count', 'level-label',
  'g-meta', 'g-timer', 'g-status', 'win-stars', 'win-stats', 'overlay-win',
  'overlay-how', 'toast', 'confetti', 'tiers', 'tiers-menu']) {
  check(`C05 element #${id}`, new RegExp(`id="${id}"`).test(HTML));
}

// ---------- D. Level data ----------
check('D01 __LEVELS_DATA present', /window\.__LEVELS_DATA/.test(HTML));
let levels = null;
try {
  const start = HTML.indexOf('window.__LEVELS_DATA');
  if (start >= 0) {
    const eq = HTML.indexOf('=', start);
    const scriptEnd = HTML.indexOf('</script>', start);
    const jsonText = HTML.slice(eq + 1, scriptEnd).trim().replace(/;\s*$/, '');
    levels = JSON.parse(jsonText).LEVELS;
  }
} catch (e) {
  console.error(`  !! __LEVELS_DATA does not parse: ${e.message}`);
}
check('D02 __LEVELS_DATA parses', Array.isArray(levels));
check('D03 exactly 30 level objects', !!levels && levels.length === 30, levels ? `${levels.length} levels` : 'n/a');
check('D04 >= 30 "tier":" occurrences', (HTML.match(/"tier":"/g) || []).length >= 30,
  `${(HTML.match(/"tier":"/g) || []).length} occurrences`);
const distinctTiers = levels ? [...new Set(levels.map(l => l.tier))] : [];
check('D05 5 distinct tiers', distinctTiers.length === 5, distinctTiers.join(','));
const hasAll = levels && levels.every(l =>
  l.i !== undefined && typeof l.tier === 'string' && l.features !== undefined &&
  Array.isArray(l.cards) && Array.isArray(l.solution) && l.par !== undefined);
check('D06 every level has i', !!levels && levels.every(l => l.i !== undefined));
check('D07 every level has tier', !!levels && levels.every(l => typeof l.tier === 'string' && l.tier.length > 0));
check('D08 every level has features', !!levels && levels.every(l => l.features === 3 || l.features === 4));
check('D09 every level has cards', !!levels && levels.every(l => Array.isArray(l.cards) && l.cards.length >= 9));
check('D10 every solution length 3', !!levels && levels.every(l => Array.isArray(l.solution) && l.solution.length === 3));
check('D11 every level has par', !!levels && levels.every(l => Number.isInteger(l.par) && l.par > 0));

// ---------- D2. SEMANTIC level validation (embedded copy) ----------
// The D block above only proves the SHAPE of the embedded table. These checks
// prove the embedded table is actually PLAYABLE: attribute values in range,
// solution indices in range and distinct, and exactly one valid SET per board.
// A structural-only check would happily pass a board whose cards are all
// garbage or whose solution points at the wrong three cards.
function isSetTriple(a, b, c) {
  if (!a || !b || !c) return false;
  if (a.length !== b.length || b.length !== c.length) return false;
  for (let f = 0; f < a.length; f++) {
    const vals = [a[f], b[f], c[f]];
    const allSame = vals[0] === vals[1] && vals[1] === vals[2];
    const allDiff = vals[0] !== vals[1] && vals[1] !== vals[2] && vals[0] !== vals[2];
    if (!allSame && !allDiff) return false;
  }
  return true;
}
function countSets(cards) {
  let n = 0;
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++)
      for (let k = j + 1; k < cards.length; k++)
        if (isSetTriple(cards[i], cards[j], cards[k])) n++;
  return n;
}
const allCardsInRange = !!levels && levels.every(l =>
  Array.isArray(l.cards) && l.cards.every(c =>
    Array.isArray(c) && c.length === l.features &&
    c.every(v => Number.isInteger(v) && v >= 0 && v <= 2)));
check('D12 every card value is an int 0..2', allCardsInRange);
check('D13 every card has exactly `features` attributes', !!levels && levels.every(l =>
  Array.isArray(l.cards) && l.cards.every(c => Array.isArray(c) && c.length === l.features)));
check('D14 no duplicate cards on a board', !!levels && levels.every(l => {
  const seen = new Set(l.cards.map(c => JSON.stringify(c)));
  return seen.size === l.cards.length;
}));
const solInRange = !!levels && levels.every(l =>
  Array.isArray(l.solution) && l.solution.length === 3 &&
  new Set(l.solution).size === 3 &&
  l.solution.every(i => Number.isInteger(i) && i >= 0 && i < l.cards.length));
check('D15 solution indices in range and distinct', solInRange);
check('D16 solution actually forms a SET', !!levels && levels.every(l =>
  isSetTriple(l.cards[l.solution[0]], l.cards[l.solution[1]], l.cards[l.solution[2]])));
const setCounts = levels ? levels.map(l => countSets(l.cards)) : [];
check('D17 exactly one SET per board (unique solution)', !!levels && setCounts.every(n => n === 1),
  levels ? `max sets on a board = ${Math.max(...setCounts)}` : 'n/a');
check('D18 solution is the unique SET', !!levels && levels.every(l => {
  const s = l.solution.slice().sort((x, y) => x - y);
  const found = [];
  for (let i = 0; i < l.cards.length; i++)
    for (let j = i + 1; j < l.cards.length; j++)
      for (let k = j + 1; k < l.cards.length; k++)
        if (isSetTriple(l.cards[i], l.cards[j], l.cards[k])) found.push([i, j, k]);
  return found.length === 1 && found[0][0] === s[0] && found[0][1] === s[1] && found[0][2] === s[2];
}));
// The "answer is always the first three cards" defect: the solution must be
// spread across the board, not clustered at the low indices.
const spreads = levels ? levels.map(l => Math.max(...l.solution) - Math.min(...l.solution)) : [];
check('D19 solution is scattered (spread >= 4)', !!levels && spreads.every(sp => sp >= 4),
  levels ? `min spread = ${Math.min(...spreads)}` : 'n/a');
check('D20 boards are pairwise distinct', !!levels &&
  new Set(levels.map(l => JSON.stringify(l.cards))).size === levels.length);

// The embedded table must match the canonical levels.json byte-for-byte in
// content, otherwise the shipped game can drift from the audited source.
try {
  const canon = JSON.parse(fs.readFileSync(gz('levels.json'), 'utf8')).levels;
  let drift = 0;
  if (canon.length !== (levels ? levels.length : -1)) drift++;
  else canon.forEach((c, i) => {
    const e = levels[i];
    if (!e) { drift++; return; }
    if (JSON.stringify(c.cards) !== JSON.stringify(e.cards) ||
        JSON.stringify(c.solution) !== JSON.stringify(e.solution) ||
        c.tier !== e.tier || c.features !== e.features || c.par !== e.par) drift++;
  });
  check('D21 embedded table matches levels.json', drift === 0, drift ? `${drift} drifted level(s)` : 'in sync');
} catch (e) {
  check('D21 embedded table matches levels.json', false, e.message);
}

// ---------- E. Engine API ----------
check('E01 window.setQuest exposed', /window\.setQuest\s*=\s*\{/.test(HTML));
for (const fn of ['isSet', 'findSets', 'startLevel', 'selectCard', 'getState']) {
  check(`E02 setQuest.${fn}`, new RegExp(`window\\.setQuest\\s*=\\s*\\{[\\s\\S]*?${fn}\\s*:`).test(HTML));
}

// ---------- F. Audio (ACTUAL handlers in this file) ----------
// index.html has exactly two lifecycle cleanup handlers — pagehide and
// beforeunload — both stopTimer() and close() the AudioContext. There is no
// visibilitychange handler in this file, so none is asserted here.
check('F01 AudioContext present', /window\.AudioContext\s*\|\|\s*window\.webkitAudioContext/.test(HTML));
check('F02 webkitAudioContext fallback', /webkitAudioContext/.test(HTML));
check('F03 createOscillator', /createOscillator/.test(HTML));
check('F04 createGain', /createGain/.test(HTML));
check('F05 pagehide closes audioCtx', /addEventListener\('pagehide'[\s\S]{0,160}audioCtx\.close\(\)/.test(HTML));
check('F06 beforeunload closes audioCtx', /addEventListener\('beforeunload'[\s\S]{0,160}audioCtx\.close\(\)/.test(HTML));
check('F07 cleanup stops the timer', /addEventListener\('pagehide'[\s\S]{0,80}stopTimer\(\)/.test(HTML));

// ---------- G. localStorage ----------
check('G01 localStorage.getItem', /localStorage\.getItem/.test(HTML));
check('G02 localStorage.setItem', /localStorage\.setItem/.test(HTML));
check('G03 stars persisted (progress.stars + saveProgress)', /progress\.stars\[[^\]]*\]\s*=/.test(HTML) && /saveProgress\(/.test(HTML));
check('G04 reached/progress persisted (saveReached)', /saveReached\(/.test(HTML));
check('G05 storage keys defined', /STORAGE_KEY/.test(HTML) && /SETTINGS_KEY/.test(HTML) && /SAVE_KEY/.test(HTML));

// ---------- H. Monetization + analytics ----------
// These assert a REAL <script src=...> tag, not a bare substring: the file
// also mentions these filenames inside an explanatory comment, and a bare
// substring check would keep passing after the actual tag was deleted.
function hasScriptSrc(re) {
  // The src may carry a ?v= cache-buster, so match the path inside the
  // quoted attribute value rather than requiring the closing quote to follow.
  return new RegExp('<script[^>]*\\ssrc="[^"]*' + re.source, 'i').test(HTML);
}
check('H01 monetag-manager.js', hasScriptSrc(/monetag-manager\.js/));
check('H02 adsterra-manager.js', hasScriptSrc(/adsterra-manager\.js/));
check('H03 game-footer.js', hasScriptSrc(/game-footer\.js/));
check('H04 gz-analytics.js', hasScriptSrc(/gz-analytics\.js/));
check('H05 gz-ux.js', hasScriptSrc(/gz-ux\.js/));
check('H06 adsbygoogle ins elements (2)', (HTML.match(/<ins class="adsbygoogle"/g) || []).length >= 2,
  `${(HTML.match(/<ins class="adsbygoogle"/g) || []).length} ins`);
check('H07 adsbygoogle loader script', /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/.test(HTML));
check('H08 adsbygoogle push', /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push/.test(HTML));
check('H09 Monetag manager owns all zones (no legacy zone queue)', /monetag-manager\.js/.test(HTML) &&
  !/monetagMulti\.push/.test(HTML));

// ---------- I. No zombie ad networks ----------
// 1ktower / libtl / goomaphy / m2d.m2cdn must not appear anywhere. The raw
// m2d.m2cdn CDN path is explicitly on the house zombie list — this file loads
// Monetag exclusively through /monetag-manager.js (see the comment block in
// index.html above the AdSense loader).
check('I01 no 1ktower', !/1ktower/i.test(HTML));
check('I02 no libtl', !/libtl/i.test(HTML));
check('I03 no goomaphy', !/goomaphy/i.test(HTML));
check('I04 no m2d.m2cdn raw CDN path', !/m2d\.m2cdn/i.test(HTML));

// ---------- J. Assets on disk ----------
for (const asset of ['icon.png', 'og-image.jpg', 'levels.json', 'verify_python.py', 'verify_independent.js', 'verify_engine.js']) {
  const p = gz(asset);
  check(`J01 asset ${asset}`, fs.existsSync(p), fs.existsSync(p) ? `${fs.statSync(p).size} bytes` : 'MISSING');
}
function sizeKB(f) { return fs.existsSync(gz(f)) ? fs.statSync(gz(f)).size / 1024 : Infinity; }
check('J02 icon.png <= 50KB', sizeKB('icon.png') <= 50, `${sizeKB('icon.png').toFixed(1)} KB`);
check('J03 og-image.jpg <= 200KB', sizeKB('og-image.jpg') <= 200, `${sizeKB('og-image.jpg').toFixed(1)} KB`);

// ---------- K. index.html size ----------
check('K01 index.html <= 100KB', sizeKB('index.html') <= 100, `${sizeKB('index.html').toFixed(1)} KB`);

// ---------- L. Accessibility ----------
check('L01 aria-label on cards', /setAttribute\('aria-label',\s*cardLabel\(/.test(HTML));
check('L02 aria-pressed selection state', /setAttribute\('aria-pressed',\s*'false'\)/.test(HTML) &&
  /aria-pressed',\s*isSel \? 'true' : 'false'/.test(HTML));
check('L03 win overlay role=dialog', /id="overlay-win"[^>]*role="dialog"/.test(HTML));
check('L04 win overlay aria-modal', /id="overlay-win"[^>]*aria-modal="true"/.test(HTML));
check('L05 aria-label on back buttons', /id="btn-back-menu"\s+aria-label="[^"]+"/.test(HTML) &&
  /id="btn-back-levels"\s+aria-label="[^"]+"/.test(HTML));
check('L06 sound button aria-label', /id="btn-sound"\s+aria-label="[^"]+"/.test(HTML));

// ---------- M. Mobile ----------
// Actual responsive strategy in this file: fluid auto-fit minmax() grid for the
// board, 100dvh viewport units, a max-width:400px breakpoint, env(safe-area-*)
// padding and touch-action:manipulation. (No clamp()/vw — asserted as built.)
check('M01 user-scalable=no', /user-scalable=no/.test(HTML));
check('M02 CSS grid board', /#board\{display:grid;grid-template-columns/.test(HTML));
check('M03 responsive auto-fit minmax sizing', /repeat\(auto-fit,\s*minmax\(9\dpx,\s*1fr\)\)/.test(HTML));
check('M04 dvh viewport units', /100dvh/.test(HTML));
check('M05 mobile breakpoint @media', /@media\s*\(max-width:\s*\d+px\)/.test(HTML));
check('M06 safe-area-inset usage', /env\(safe-area-inset-top\)/.test(HTML) && /env\(safe-area-inset-bottom\)/.test(HTML));
check('M07 touch-action manipulation', /touch-action:manipulation/.test(HTML));

// ---------- N. The three verifiers actually PASS ----------
function runVerifier(cmd, args, name) {
  const r = spawnSync(cmd, args, { cwd: HERE, encoding: 'utf8', timeout: 120000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0 && /PASS/.test(out);
  const line = out.split('\n').map(s => s.trim()).filter(Boolean).pop() || 'no output';
  check(name, ok, line);
}
runVerifier('python3', ['verify_python.py'], 'N01 verify_python.py passes');
runVerifier('node', ['verify_independent.js'], 'N02 verify_independent.js passes');
runVerifier('node', ['verify_engine.js'], 'N03 verify_engine.js passes');

// ---------- Extras ----------
check('X01 related games section', /gz-related-games/.test(HTML));
check('X02 >= 4 related games', (HTML.match(/gz-related-card/g) || []).length >= 4,
  `${(HTML.match(/gz-related-card/g) || []).length} cards`);
check('X03 keyboard handler', /addEventListener\('keydown'/.test(HTML));
check('X04 Escape key handling', /e\.key === 'Escape'/.test(HTML));
check('X05 arrow key level nav', /ArrowLeft/.test(HTML) && /ArrowRight/.test(HTML));
check('X06 confetti canvas 2d context', /getElementById\('confetti'\)[\s\S]{0,60}getContext\('2d'\)/.test(HTML));
check('X07 unique-solution guarantee documented', /EXACTLY one valid SET|exactly one valid SET/i.test(HTML));

// ---------- Output ----------
console.log(`\n${failed === 0 ? 'PASS' : 'FAIL'}: ${passed}/${passed + failed} checks`);
if (failed > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log('  ' + f));
  process.exit(1);
}
