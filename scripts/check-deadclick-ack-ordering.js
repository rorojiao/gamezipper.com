#!/usr/bin/env node
/*
 * R338 regression gate — dead_click acknowledgement ORDERING robustness.
 *
 * THE DEFECT CLASS (generalises beyond one game):
 *   gz-analytics.js's dead_click detector registers a CAPTURE-phase click
 *   listener on `document`. It snapshots the clicked element's className /
 *   aria-expanded / inline style, then re-reads THAT SAME element reference
 *   1500ms later and reports dead_click when nothing changed.
 *
 *   A per-game acknowledgement makes the tap observable, but ONLY if the
 *   mutation is still visible at the +1500ms re-read. Two orderings exist:
 *
 *     det-first : the detector's listener runs first, so the snapshot
 *                 PREDATES the ack -> the ack class / inline counter is a
 *                 delta at the re-read. (Correct.)
 *     ack-first : the ack's listener runs first, so the snapshot ALREADY
 *                 contains the ack class -> for the re-read to see a delta,
 *                 the ack class must have been REMOVED by then.
 *
 *   The established correct form is therefore: remove the ack class at
 *   1200ms (BEFORE the 1500ms re-read) and keep a monotonic inline counter
 *   that is never removed. That satisfies BOTH orderings.
 *
 *   The bug this gate catches: an ack whose class removal is scheduled AFTER
 *   1500ms (e.g. 1700ms). Under ack-first the class is still present at the
 *   re-read, the snapshot and the re-read compare EQUAL, and the dead_click
 *   survives the "fix". This is the R336 blackjack shape.
 *
 * WHAT IT PROVES, per game:
 *   1. The ack class removal delay is < 1500ms (the detector's window).
 *   2. A monotonic inline counter is written and never removed.
 *   3. Running the REAL ack code against a byte-faithful detector replica
 *      under BOTH orderings yields "changed" (ALIVE) on the target element.
 *   4. The synthetic dead control is still DEAD and the live control is
 *      still ALIVE (the detector was not blinded).
 *
 * Usage: node scripts/check-deadclick-ack-ordering.js <slug> [<slug> ...]
 * Exit 0 = all PASS, 1 = any FAIL, 2 = setup error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');
const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: node scripts/check-deadclick-ack-ordering.js <slug> [...]');
  process.exit(2);
}

/* ================= faithful mini-DOM (see slice-master gate) ========= */
function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(), nodeType: 1,
    _classList: new Set(), _styleProps: {}, _attrs: {}, children: [],
    parentNode: null, textContent: '', innerHTML: '', onclick: null,
    offsetWidth: 100, __listeners: {},
  };
  Object.defineProperty(el, 'className', {
    get() { return Array.from(el._classList).join(' '); },
    set(v) { el._classList = new Set(String(v).split(/\s+/).filter(Boolean)); },
    configurable: true,
  });
  el.classList = {
    add(...c) { c.forEach(x => el._classList.add(x)); },
    remove(...c) { c.forEach(x => el._classList.delete(x)); },
    contains(c) { return el._classList.has(c); },
    toggle(c) { el._classList.has(c) ? el._classList.delete(c) : el._classList.add(c); },
  };
  el.style = {
    setProperty(k, v) { el._styleProps[k] = String(v); },
    getPropertyValue(k) { return el._styleProps[k] || ''; },
    removeProperty(k) { delete el._styleProps[k]; },
  };
  el.setAttribute = (k, v) => { el._attrs[k] = String(v); };
  el.getAttribute = (k) => {
    if (k === 'style') {
      const keys = Object.keys(el._styleProps);
      return keys.length ? keys.map(k => k + ': ' + el._styleProps[k] + ';').join(' ') : null;
    }
    return el._attrs[k] === undefined ? null : el._attrs[k];
  };
  el.removeAttribute = (k) => { delete el._attrs[k]; };
  el.hasAttribute = (k) => el._attrs[k] !== undefined;
  el.appendChild = (c) => { el.children.push(c); c.parentNode = el; return c; };
  el.remove = () => { if (el.parentNode) el.parentNode.children = el.parentNode.children.filter(x => x !== el); };
  el.addEventListener = (t, f) => { (el.__listeners[t] = el.__listeners[t] || []).push(f); };
  el.removeEventListener = (t, f) => { if (el.__listeners[t]) el.__listeners[t] = el.__listeners[t].filter(x => x !== f); };
  el.matches = (sel) => {
    // support comma-separated selector lists (queens uses '.level-btn, .btn-icon')
    return String(sel).split(',').some(part => {
      const s = part.trim();
      if (!s) return false;
      if (s.startsWith('.')) return el._classList.has(s.slice(1));
      if (s.startsWith('#')) return el.id === s.slice(1);
      return el.tagName === s.toUpperCase();
    });
  };
  el.closest = (sel) => { let n = el; while (n) { if (n.matches && n.matches(sel)) return n; n = n.parentNode; } return null; };
  el.click = () => dispatchClick(el);
  el.dispatchEvent = (ev) => { dispatchClick(el, ev); return true; };
  return el;
}

let docClickCapture = [];
let docClickBubble = [];
let currentDocument = null;
function dispatchClick(target, ev) {
  const e = ev || {};
  e.type = 'click'; e.target = target;
  e.preventDefault = e.preventDefault || (() => {});
  e.stopPropagation = e.stopPropagation || (() => {});
  for (const f of docClickCapture) { try { f.call(currentDocument, e); } catch (err) {} }
  if (typeof target.onclick === 'function') { try { target.onclick.call(target, e); } catch (err) {} }
  for (const f of (target.__listeners && target.__listeners.click) || []) { try { f.call(target, e); } catch (err) {} }
  for (const f of docClickBubble) { try { f.call(currentDocument, e); } catch (err) {} }
}

/* the production detector replica — byte-faithful to gz-analytics.js */
const DETECTOR = `
window.__det = [];
document.addEventListener('click', function(e){
  var t = e.target, tag = t.tagName;
  if (tag !== 'DIV' && tag !== 'SPAN' && tag !== 'LABEL' && tag !== 'LI' && tag !== 'IMG' && tag !== 'SVG' && tag !== 'P') return;
  var lookClickable = t.getAttribute('role') === 'button'
    || t.onclick
    || (t.style && t.style.cursor === 'pointer')
    || (t.className && /click|card|btn|tile|thumb|seg/i.test(t.className.toString()));
  if (!lookClickable) return;
  var sel = (t.tagName || '?') + '.' + (t.className || '').toString().slice(0, 40);
  var sc = t.className.toString(), sa = t.getAttribute('aria-expanded') || '', si = t.getAttribute('style') || '';
  setTimeout(function(){
    var nc = t.className.toString(), na = t.getAttribute('aria-expanded') || '', ni = t.getAttribute('style') || '';
    window.__det.push({ sel: sel, changed: (sc !== nc) || (sa !== na) || (si !== ni) });
  }, 1500);
}, true);
`;

/* ================= per-game analysis ================================ */
function analyse(slug) {
  const file = path.join(REPO, slug, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [];
  const sre = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let sm;
  while ((sm = sre.exec(html)) !== null) {
    if (/application\/ld\+json/.test(sm[1] || '')) continue;
    scripts.push(sm[2]);
  }
  const inline = scripts.join('\n;\n');

  // every ack IIFE that registers a capture-phase document click listener
  const ackBlocks = [];
  const blockRe = /\(function\s*\(\)\s*\{\s*if\s*\(\s*window\.__gz[A-Za-z0-9]*Ack\s*\)\s*return;[\s\S]*?\}\)\(\);/g;
  let bm;
  while ((bm = blockRe.exec(inline)) !== null) ackBlocks.push(bm[0]);

  const problems = [];
  const findings = [];

  if (!ackBlocks.length) {
    findings.push('no dead_click acknowledgement block found (nothing to check)');
    return { slug, problems, findings, ackBlocks: 0 };
  }

  for (const block of ackBlocks) {
    // 1. the removal delay must be < 1500ms. The class name is whatever the
    //    game uses (gz-ack0/gz-ack1, gz-picked, ...), so the check looks for
    //    ANY classList.remove() inside a setTimeout and takes its delay.
    const delays = [...block.matchAll(/setTimeout\s*\(\s*(?:function\s*\([^)]*\)\s*\{[\s\S]{0,240}?\}|[A-Za-z_$][\w$]*)\s*,\s*(\d+)\s*(?:,[^)]*)?\)/g)].map(m => Number(m[1]));
    const removalDelays = delays.filter(d => d >= 1200);
    if (removalDelays.length && Math.min(...removalDelays) >= 1500) {
      problems.push('the ack class removal is scheduled at ' + Math.min(...removalDelays) +
        'ms — that is AFTER the detector\'s 1500ms re-read, so under the ack-first ' +
        'ordering the snapshot and the re-read compare equal and the dead_click survives');
    }
    // 2. a monotonic inline counter that is never removed
    if (!/setProperty\s*\(\s*['"]--gz-tap['"]/.test(block)) {
      problems.push('the ack writes no monotonic inline --gz-tap counter — a class-only ack is a no-op on the second tap (R331 Pitfall #89)');
    }
    if (/removeProperty\s*\(\s*['"]--gz-tap['"]/.test(block)) {
      problems.push('the --gz-tap counter is removed again — it must be monotonic to make every tap a real delta');
    }
    // 3. the ack class must be removed at all
    if (!/classList\.remove\(/.test(block)) {
      problems.push('the ack class is never removed — the highlight would stick permanently');
    }
    findings.push('delays=' + JSON.stringify(delays) + ' counter=' + /--gz-tap/.test(block));
  }

  /* ---- run the REAL ack code under BOTH orderings ---- */
  for (const ordering of ['det-first', 'ack-first']) {
    docClickCapture = []; docClickBubble = [];
    const byId = {};
    const document = {
      body: makeEl('body'),
      createElement: (t) => makeEl(t),
      getElementById: (id) => (byId[id] || (byId[id] = makeEl('div'))),
      querySelector: (sel) => (sel.startsWith('#') ? document.getElementById(sel.slice(1)) : makeEl('div')),
      querySelectorAll: () => [],
      addEventListener: (t, f, capture) => {
        if (t !== 'click') return;
        if (capture) docClickCapture.push(f); else docClickBubble.push(f);
      },
      removeEventListener: () => {},
      readyState: 'complete',
    };
    currentDocument = document;

    const timers = [];
    const sandbox = {
      document,
      window: {},
      localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; })(),
      // support the browser's setTimeout(fn, delay, ...args) form — killer-sudoku
      // uses setTimeout(fn, 1200, btn) and reads the element back out of the
      // argument. A stub that drops the extra args makes the ack class look
      // like it is never removed, which is a FALSE POSITIVE.
      setTimeout: (fn, ms, ...args) => { timers.push({ fn, args, at: (sandbox.__now || 0) + (ms || 0) }); return timers.length; },
      clearTimeout: () => {},
      __now: 0,
    };
    sandbox.window.document = document;
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);

    const ackSrc = ackBlocks.join('\n;\n');
    if (ordering === 'det-first') {
      vm.runInContext(DETECTOR, ctx, { filename: 'det.js' });
      try { vm.runInContext(ackSrc, ctx, { filename: 'ack.js' }); } catch (e) { problems.push('[' + ordering + '] ack threw: ' + e.message); }
    } else {
      try { vm.runInContext(ackSrc, ctx, { filename: 'ack.js' }); } catch (e) { problems.push('[' + ordering + '] ack threw: ' + e.message); }
      vm.runInContext(DETECTOR, ctx, { filename: 'det.js' });
    }

    // The ack's target selector is discovered EMPIRICALLY: probe a set of
    // candidate class names and keep the one the ack actually mutates.
    // Guessing from the source regex is fragile (the selector may live in a
    // `var SEL = '...'` constant), and a wrong guess produces a vacuous
    // "the target reads DEAD" verdict — the R333 Pitfall #62 no-op gate.
    //
    // The candidate list is derived from the game's OWN source:
    //   - every class name in a markup class="..." attribute
    //   - every class name assigned from JS (el.className = 'x',
    //     classList.add('x')) — many games build their cards in script, so
    //     markup alone misses them
    //   - every class name in the ack block's own quoted selector strings,
    //     split on commas so '.level-btn, .btn-icon' yields both
    const CANDIDATES = Array.from(new Set([
      ...[...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)),
      ...[...html.matchAll(/className\s*=\s*['"]([^'"]+)['"]/g)].flatMap(m => m[1].split(/\s+/)),
      ...[...html.matchAll(/classList\.(?:add|remove|toggle)\s*\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]),
      ...[...ackSrc.matchAll(/['"]([^'"]*)['"]/g)].flatMap(m => m[1].split(',').map(s => s.trim().replace(/^[.#]/, ''))),
      'card', 'btn', 'tile', 'seg', 'thumb', 'click',
    ].map(c => String(c).trim()).filter(c => /^[a-z][\w-]*$/i.test(c)))).slice(0, 500);
    const target = makeEl('div');
    target.className = 'gz-probe-target';
    target.onclick = function () {};
    document.body.appendChild(target);
    // click every candidate separately and see which one the ack reacts to
    let matched = null;
    for (const cand of CANDIDATES) {
      const probe = makeEl('div');
      probe.className = cand;
      probe.onclick = function () {};
      document.body.appendChild(probe);
      const beforeCls = probe.className;
      const beforeStyle = probe.getAttribute('style');
      dispatchClick(probe);
      const changed = probe.className !== beforeCls || probe.getAttribute('style') !== beforeStyle;
      if (changed) { matched = cand; break; }
    }
    if (!matched) {
      problems.push('[' + ordering + '] could not determine which element the acknowledgement targets ' +
        '(none of the ' + CANDIDATES.length + ' candidate class names was mutated) — ' +
        'the check cannot be trusted, so this is reported as FAIL rather than a vacuous PASS');
      findings.push('[' + ordering + '] no target selector could be determined');
      continue;
    }
    findings.push('[' + ordering + '] ack target class = ' + matched);

    dispatchClick(target);

    // controls
    const deadCtl = makeEl('div'); deadCtl.className = 'gz-probe-dead card'; document.body.appendChild(deadCtl);
    dispatchClick(deadCtl);
    const liveCtl = makeEl('div'); liveCtl.className = 'gz-probe-live btn'; document.body.appendChild(liveCtl);
    liveCtl.addEventListener('click', function () { this.classList.add('gz-probe-hit'); });
    dispatchClick(liveCtl);

    // advance the clock chronologically
    let maxAt = 0;
    for (const t of timers) maxAt = Math.max(maxAt, t.at);
    sandbox.__now = maxAt;
    let guard = 0;
    while (guard++ < 500) {
      let next = null;
      for (const t of timers) if (!t.done && (next === null || t.at < next.at)) next = t;
      if (!next) break;
      next.done = true;
      sandbox.__now = Math.max(sandbox.__now, next.at);
      try { next.fn(...(next.args || [])); } catch (e) {}
    }

    const det = sandbox.window.__det || [];
    const dTarget = det.find(d => d.sel.includes(matched));
    const dDead = det.find(d => d.sel.includes('gz-probe-dead'));
    const dLive = det.find(d => d.sel.includes('gz-probe-live'));
    if (!dTarget || dTarget.changed !== true) {
      problems.push('[' + ordering + '] the acknowledged element reads DEAD to the detector — ' + JSON.stringify(dTarget || {}));
    }
    if (!dDead || dDead.changed !== false) problems.push('[' + ordering + '] the synthetic dead control did not read DEAD — the detector was blinded');
    if (!dLive || dLive.changed !== true) problems.push('[' + ordering + '] the synthetic live control did not read ALIVE');
    findings.push('[' + ordering + '] target=' + JSON.stringify(dTarget || {}));
  }

  return { slug, problems, findings, ackBlocks: ackBlocks.length };
}

/* ================= run ============================================= */
let failed = 0;
for (const slug of slugs) {
  let res;
  try { res = analyse(slug); }
  catch (e) { console.log('SETUP ERROR ' + slug + ': ' + e.message); failed++; continue; }
  const ok = res.problems.length === 0;
  if (!ok) failed++;
  console.log((ok ? 'PASS ' : 'FAIL ') + slug + '  (ack blocks: ' + res.ackBlocks + ')');
  for (const f of res.findings) console.log('    ' + f);
  for (const p of res.problems) console.log('    ISSUE: ' + p);
}
console.log('---');
console.log(failed ? 'VERDICT: FAIL (' + failed + ' game(s))' : 'VERDICT: PASS');
process.exit(failed ? 1 : 0);
