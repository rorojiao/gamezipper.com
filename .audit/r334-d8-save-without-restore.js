#!/usr/bin/env node
/**
 * R334 D8 detector: SAVE-WITHOUT-RESTORE.
 *
 * The defect class this tick found live: a game PERSISTS a record
 * (localStorage.setItem) but never READS it back, so the persisted value is
 * provably wrong on every session after the first.
 *
 * Confirmed instances (read from the engine, not guessed):
 *   strimko / magnets / tatami
 *     `let bestTimes = {}`  +  `saveBestTimes()` (called)  +  `loadBestTimes()`
 *     (NEVER called).  Effect: each session starts with an EMPTY map, so
 *     `if (!bestTimes[lv] || timer < bestTimes[lv])` is always true -> the
 *     stored "best" becomes the LAST time played, and the whole map is
 *     replaced by a single-entry map (every other level's record is lost).
 *
 * The inverse class (both save and load dead, or load explicitly documented
 * as an intentional no-op) is NOT a defect and is reported separately.
 *
 * CALIBRATION (mandatory, Pitfall #62):
 *   - POSITIVE: a synthetic game whose save IS called but whose load is NOT
 *     must be FLAGGED.
 *   - NEGATIVE: a synthetic game whose save AND load are both called must NOT
 *     be flagged.
 *   - NEGATIVE: an explicitly-documented intentional no-op loader must NOT be
 *     flagged (tripeaks pattern).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function liveGames() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  const GAMES = new Function(src + '; return GAMES;')();
  return GAMES.filter(g => g.status === 'live')
    .map(g => ({ slug: g.url.replace(/^\//, '').replace(/\/$/, ''), name: g.name }));
}

const DEVTOOL = /verify_|qa_?check|gen_|register|fix_|solver|_test\.js|browser_test|levels_compact|_levels/i;

function pageCode(slug) {
  const d = path.join(ROOT, slug);
  const idx = path.join(d, 'index.html');
  if (!fs.existsSync(idx)) return null;
  const html = fs.readFileSync(idx, 'utf8');
  const parts = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) parts.push(m[1]);
  for (const m of html.matchAll(/<script[^>]*\bsrc=["']([^"']+\.js)["']/g)) {
    const src = m[1];
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('/')) continue;
    if (DEVTOOL.test(src)) continue;
    const p = path.join(d, src);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
  }
  return parts.join('\n');
}

function stripComments(src) {
  let s = src;
  s = s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  s = s.replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return s;
}

// count whole-word references of a name in code (excluding its own declaration)
function refCount(code, name) {
  const esc = name.replace(/[$]/g, '\\$');
  let n = 0;
  for (const m of code.matchAll(new RegExp('(?<![\\w$])' + esc + '(?![\\w$])', 'g'))) n++;
  return n;
}

function declCount(code, name) {
  const esc = name.replace(/[$]/g, '\\$');
  let n = 0;
  for (const m of code.matchAll(new RegExp('function\\s+' + esc + '\\s*\\(', 'g'))) n++;
  return n;
}

// A save/restore pair: same suffix, opposite prefix.
const PAIRS = [
  ['save', 'load'], ['store', 'restore'], ['persist', 'read'], ['write', 'read'],
];

function analyse(slug) {
  const code = stripComments(pageCode(slug) || '');
  if (!code) return null;
  const fns = new Set();
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) fns.add(m[1]);

  const flagged = [];
  const intentional = [];
  for (const name of fns) {
    const m = name.match(/^(save|store|persist|write)([A-Z_$][\w$]*)$/);
    if (!m) continue;
    const savePrefix = m[1], suffix = m[2];
    const loadPrefix = { save: 'load', store: 'restore', persist: 'read', write: 'read' }[savePrefix];
    const loadName = loadPrefix + suffix;
    if (!fns.has(loadName)) continue;

    const saveRefs = refCount(code, name);
    const loadRefs = refCount(code, loadName);

    // save is called (more refs than its own declaration), load is NOT
    const saveLive = saveRefs > declCount(code, name);
    const loadLive = loadRefs > declCount(code, loadName);
    if (saveLive && !loadLive) {
      // intentional no-op? loader body says so
      const body = (code.match(new RegExp('function\\s+' + loadName + '\\s*\\([\\s\\S]{0,600}?\\n\\}')) || [''])[0];
      const intentionalNoop = /intentional|for simplicity|not implemented|always returns false|return false;?\s*\/\/\s*(intentional|by design)/i.test(body)
        || /\/\/[^\n]*by design/i.test(body);
      const rec = { slug, save: name, load: loadName, saveRefs, loadRefs };
      if (intentionalNoop) intentional.push(rec);
      else flagged.push(rec);
    }
  }
  return { slug, flagged, intentional };
}

function main() {
  const games = liveGames();
  console.log(`LIVE: ${games.length}`);
  const flagged = [], intentional = [];
  for (const g of games) {
    const a = analyse(g.slug);
    if (!a) continue;
    if (a.flagged.length) flagged.push(a);
    if (a.intentional.length) intentional.push(a);
  }
  console.log(`\n=== D8 SAVE-WITHOUT-RESTORE: ${flagged.length} games ===`);
  for (const f of flagged) {
    console.log(`\n  ${f.slug}`);
    for (const r of f.flagged) console.log(`     ${r.save}() CALLED (${r.saveRefs} refs)  |  ${r.load}() NEVER CALLED (${r.loadRefs} refs)`);
  }
  console.log(`\n=== D8 intentional no-op loaders (NOT defects): ${intentional.length} games ===`);
  for (const f of intentional) {
    for (const r of f.intentional) console.log(`  ${r.slug}: ${r.save}() called, ${r.load}() is a documented no-op`);
  }

  fs.writeFileSync(path.join(ROOT, '.audit/r334-d8-save-without-restore.json'),
    JSON.stringify({ flagged, intentional }, null, 1));

  console.log('\n=== CALIBRATION CONTROLS ===');
  // POSITIVE: save called, load never called -> MUST be flagged
  const pos = `
    function saveAlpha(){ localStorage.setItem('k', '1'); }
    function loadAlpha(){ return JSON.parse(localStorage.getItem('k')||'{}'); }
    function boot(){ saveAlpha(); }
    boot();
  `;
  const aPos = analyse.__raw ? null : null;
  // reuse analyse() logic on a synthetic slug via a temp injection
  const { execSync } = require('child_process');
  console.log('   (POSITIVE/NEGATIVE controls are evaluated in-process below)');
  function analyseCode(code) {
    const fns = new Set();
    for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) fns.add(m[1]);
    const out = [];
    for (const name of fns) {
      const m = name.match(/^(save|store|persist|write)([A-Z_$][\w$]*)$/);
      if (!m) continue;
      const loadPrefix = { save: 'load', store: 'restore', persist: 'read', write: 'read' }[m[1]];
      const loadName = loadPrefix + m[2];
      if (!fns.has(loadName)) continue;
      const saveLive = refCount(code, name) > declCount(code, name);
      const loadLive = refCount(code, loadName) > declCount(code, loadName);
      if (saveLive && !loadLive) {
        // a documented intentional no-op loader is not a defect
        const body = (code.match(new RegExp('function\\s+' + loadName + '\\s*\\([\\s\\S]{0,600}?\\}')) || [''])[0];
        const intentionalNoop = /intentional|for simplicity|not implemented|always returns false/i.test(body)
          || /\/\/[^\n]*by design/i.test(body);
        if (!intentionalNoop) out.push(name + '/' + loadName);
      }
    }
    return out;
  }
  const posOut = analyseCode(stripComments(pos));
  console.log(`   POSITIVE (save called, load dead): ${posOut.join(',') || '(none)'}  (must contain saveAlpha/loadAlpha)`);

  const neg = `
    function saveBeta(){ localStorage.setItem('k', '1'); }
    function loadBeta(){ return JSON.parse(localStorage.getItem('k')||'{}'); }
    function boot(){ saveBeta(); loadBeta(); }
    boot();
  `;
  const negOut = analyseCode(stripComments(neg));
  console.log(`   NEGATIVE (save AND load both called): ${negOut.join(',') || '(none)'}  (must be empty)`);

  // NEGATIVE #2: NO matching load fn exists at all -> nothing to pair with,
  // so nothing can be flagged (the save is simply a one-way write by design).
  const neg2 = `
    function saveGamma(){ localStorage.setItem('k', '1'); }
    function boot(){ saveGamma(); }
    boot();
  `;
  const neg2Out = analyseCode(stripComments(neg2));
  console.log(`   NEGATIVE (no matching load fn at all): ${neg2Out.join(',') || '(none)'}  (must be empty)`);

  // NEGATIVE #3: a save whose matching load exists but is an intentional
  // no-op is NOT a save-without-restore defect.
  const neg3 = `
    function saveDelta(){ localStorage.setItem('k', '1'); }
    function loadDelta(){ /* intentional: always starts a new game */ return false; }
    function boot(){ saveDelta(); }
    boot();
  `;
  const neg3Out = analyseCode(stripComments(neg3));
  console.log(`   NEGATIVE (documented no-op loader): ${neg3Out.join(',') || '(none)'}  (must be empty — the loader IS called nowhere but is a documented no-op; see tripeaks)`);
}

main();
