#!/usr/bin/env node
/*
 * R338 regression gate — slice-master locked-chapter dead_click.
 *
 * WHY THIS FILE IS SELF-CONTAINED (rather than using _optimization/scripts/
 * harness-lib.js): that harness's element stubs are intentionally lossy —
 * `classList.add()` does NOT update `className`, `style.setProperty()` is a
 * no-op, and `getAttribute('style')` returns null. The production
 * dead_click detector reads EXACTLY those three things (`className`,
 * `aria-expanded`, inline `style`), so a lossy stub would make the detector
 * read a constant and every verdict would be vacuous — the R333 Pitfall #62
 * "no-op gate wearing a PASS costume".
 *
 * So this gate builds a FAITHFUL mini-DOM (className/classList/style stay in
 * sync, getAttribute('style') reflects setProperty) and executes the REAL
 * shipped code extracted from index.html:
 *   - `buildChapters()` + `showChapterMsg()` (the locked-chapter handler)
 *   - the `__gzChapterAck` acknowledgement IIFE
 * then runs a byte-faithful replica of gz-analytics.js's dead_click detector
 * against it.
 *
 * WHAT IT PROVES:
 *   1. POSITIVE — a LOCKED chapter card has a click handler and a tap
 *      produces a state change the detector can observe.
 *   2. BOTH LISTENER ORDERINGS — the whole game (the R336 blackjack lesson):
 *        - "ack-first": the ack listener is registered BEFORE the detector's,
 *          so the detector's snapshot ALREADY contains the ack class;
 *        - "det-first": the detector is registered FIRST, so the snapshot
 *          PREDATES the tap.
 *      A fix that only works under one ordering is not a fix.
 *   3. THE DETECTOR IS NOT BLINDED — a synthetic dead div is still DEAD and
 *      a synthetic live div is still ALIVE (the mandatory negative test).
 *   4. BURST — 4 rapid taps on the SAME card each produce a delta (R331
 *      Pitfall #89: a class-only acknowledgement is a no-op on the 2nd tap).
 *   5. THE GATE CAN FAIL — pointed at the PRE-FIX page it exits non-zero.
 *
 * Usage: node slice-master/verify_deadclick_locked_chapter.js [path/to/index.html]
 * Exit 0 = PASS, 1 = FAIL, 2 = setup error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = process.argv[2] || path.join(__dirname, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');

/* ================= faithful mini-DOM ================================= */
function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    nodeType: 1,
    _classList: new Set(),
    _styleProps: {},
    _attrs: {},
    children: [],
    parentNode: null,
    textContent: '',
    innerHTML: '',
    onclick: null,
    offsetWidth: 100,
    __listeners: {},
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
    const s = String(sel);
    if (s.startsWith('.')) return el._classList.has(s.slice(1));
    if (s.startsWith('#')) return el.id === s.slice(1);
    return el.tagName === s.toUpperCase();
  };
  el.closest = (sel) => {
    let n = el;
    while (n) { if (n.matches && n.matches(sel)) return n; n = n.parentNode; }
    return null;
  };
  el.click = () => dispatchClick(el);
  el.dispatchEvent = (ev) => { dispatchClick(el, ev); return true; };
  return el;
}

let docClickCapture = [];
let docClickBubble = [];
let currentDocument = null;
function dispatchClick(target, ev) {
  const e = ev || {};
  e.type = 'click';
  e.target = target;
  e.preventDefault = e.preventDefault || (() => {});
  e.stopPropagation = e.stopPropagation || (() => {});
  // CAPTURE phase on document (this is where gz-analytics.js listens)
  for (const f of docClickCapture) { try { f.call(currentDocument, e); } catch (err) {} }
  // TARGET phase: the element's own onclick property + its own listeners
  if (typeof target.onclick === 'function') { try { target.onclick.call(target, e); } catch (err) {} }
  for (const f of (target.__listeners && target.__listeners.click) || []) { try { f.call(target, e); } catch (err) {} }
  // BUBBLE phase on document
  for (const f of docClickBubble) { try { f.call(currentDocument, e); } catch (err) {} }
}

/* ================= extract the REAL code from the page =============== */
function extractFunction(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index;
  let i = src.indexOf('{', m.index);
  if (i < 0) return null;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

const scripts = [];
const sre = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
let sm;
while ((sm = sre.exec(html)) !== null) {
  if (/application\/ld\+json/.test(sm[1] || '')) continue;
  scripts.push(sm[2]);
}
const allInline = scripts.join('\n;\n');

const buildChaptersSrc = extractFunction(allInline, 'buildChapters');
const showChapterMsgSrc = extractFunction(allInline, 'showChapterMsg');
const ackMatch = allInline.match(/\(function\(\)\{\s*if\(window\.__gzChapterAck\)[\s\S]*?\}\)\(\);/);

if (!buildChaptersSrc) {
  console.error('SETUP ERROR: buildChapters() not found in the inline scripts');
  process.exit(2);
}

/* The production detector replica — byte-faithful to gz-analytics.js:
   capture phase, snapshot the target's className / aria-expanded / inline
   style, re-read THAT SAME reference at +1500ms, report dead when nothing
   changed. */
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
    window.__det.push({ sel: sel, changed: (sc !== nc) || (sa !== na) || (si !== ni), snapClass: sc, nowClass: nc });
  }, 1500);
}, true);
`;

/* ================= run one ordering ================================ */
function runOrdering(ordering) {
  docClickCapture = [];
  docClickBubble = [];
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
    window: { __gzChapterAck: false },
    localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; })(),
    setTimeout: (fn, ms) => { timers.push({ fn, at: (sandbox.__now || 0) + (ms || 0) }); return timers.length; },
    clearTimeout: () => {},
    getStars: () => 0,
    CH_NAMES: ['', 'Basics', 'Angles', 'Precision', 'Advanced', 'Master'],
    playClick: () => {},
    buildLevels: () => {},
    showScr: () => {},
    isChapterUnlocked: (ch) => ch <= 1,
    __now: 0,
  };
  sandbox.window.document = document;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);

  const problems = [];

  // Register the two document listeners in the requested ORDER.
  if (ordering === 'ack-first') {
    if (ackMatch) { try { vm.runInContext(ackMatch[0], ctx, { filename: 'ack.js' }); } catch (e) { problems.push('ack IIFE threw: ' + e.message); } }
    else problems.push('the dead_click acknowledgement IIFE (__gzChapterAck) is missing');
    vm.runInContext(DETECTOR, ctx, { filename: 'detector.js' });
  } else {
    vm.runInContext(DETECTOR, ctx, { filename: 'detector.js' });
    if (ackMatch) { try { vm.runInContext(ackMatch[0], ctx, { filename: 'ack.js' }); } catch (e) { problems.push('ack IIFE threw: ' + e.message); } }
    else problems.push('the dead_click acknowledgement IIFE (__gzChapterAck) is missing');
  }

  try { vm.runInContext(buildChaptersSrc + '\n' + (showChapterMsgSrc || ''), ctx, { filename: 'chapters.js' }); }
  catch (e) { problems.push('buildChapters() threw: ' + e.message); }
  try { vm.runInContext('buildChapters();', ctx); } catch (e) { problems.push('buildChapters() call threw: ' + e.message); }

  const grid = document.getElementById('chGrid');
  const cards = grid.children;
  const locked = cards.filter(c => c.classList.contains('locked'));

  if (cards.length !== 5) problems.push('chapters-rendered — got ' + cards.length + ' cards');
  if (locked.length !== 4) problems.push('locked-cards-exist — got ' + locked.length);
  if (!locked.length || !locked.every(c => typeof c.onclick === 'function')) {
    problems.push('LOCKED-card-has-handler — the R338 P1 root cause: a locked chapter card has NO click handler');
  }

  // tap a locked card
  if (locked.length) dispatchClick(locked[0]);
  const msg = document.getElementById('chapter-msg');
  const msgText = String((msg && msg.textContent) || '');
  if (!msgText.length) problems.push('locked-tap-shows-message — the tap produced no visible feedback');

  // negative + live controls
  const deadCtl = makeEl('div'); deadCtl.className = 'gz-probe-dead card'; document.body.appendChild(deadCtl);
  dispatchClick(deadCtl);
  const liveCtl = makeEl('div'); liveCtl.className = 'gz-probe-live btn'; document.body.appendChild(liveCtl);
  liveCtl.addEventListener('click', function () { this.classList.add('gz-probe-hit'); });
  dispatchClick(liveCtl);

  // BURST: 4 rapid taps on the SAME locked card
  if (locked.length) for (let i = 0; i < 4; i++) dispatchClick(locked[0]);
  const tapN = locked.length ? (locked[0].__gzTapN || 0) : 0;

  // advance the fake clock CHRONOLOGICALLY so a 1200ms removal really does
  // land before the detector's 1500ms re-read.
  sandbox.__now = 0;
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
    try { next.fn(); } catch (e) {}
  }

  const det = sandbox.window.__det || [];
  const dDead = det.find(d => d.sel.includes('gz-probe-dead'));
  const dLive = det.find(d => d.sel.includes('gz-probe-live'));
  const dLocked = det.find(d => /ch-card/.test(d.sel));

  if (!dDead || dDead.changed !== false) problems.push('negative-control-still-DEAD — ' + JSON.stringify(dDead || {}));
  if (!dLive || dLive.changed !== true) problems.push('live-control-still-ALIVE — ' + JSON.stringify(dLive || {}));
  if (!dLocked || dLocked.changed !== true) problems.push('locked-card-is-ALIVE-to-detector — ' + JSON.stringify(dLocked || {}));
  if (tapN < 4) problems.push('burst-tap-counter-increments — tap counter = ' + tapN);

  return { ordering, problems, det, cards: cards.length, locked: locked.length, msgText, tapN };
}

/* ================= run both orderings ============================== */
const results = [runOrdering('ack-first'), runOrdering('det-first')];
const problems = [];
for (const r of results) for (const p of r.problems) problems.push('[' + r.ordering + '] ' + p);

console.log('slice-master locked-chapter gate: ' + (problems.length ? 'FAIL' : 'PASS'));
for (const r of results) {
  console.log('  [' + r.ordering + '] cards=' + r.cards + ' locked=' + r.locked +
    ' tapCounter=' + r.tapN);
  console.log('      message = ' + JSON.stringify(r.msgText.slice(0, 110)));
  console.log('      detector = ' + JSON.stringify(r.det));
}
for (const p of problems) console.log('  ISSUE: ' + p);
if (problems.length) { console.log('VERDICT: FAIL'); process.exit(1); }
console.log('VERDICT: PASS');
