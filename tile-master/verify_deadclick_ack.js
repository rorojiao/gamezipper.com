#!/usr/bin/env node
/*
 * tile-master/verify_deadclick_ack.js — R339 2026-10-29
 *
 * Regression gate for the dead_click acknowledgement on .tm-tile.
 *
 * ROOT CAUSE (Pitfall #89a / the R331 wordle trap):
 *   The R951 fix added a CLASS-ONLY ack — `n.classList.add("tile-pressed")`.
 *   On the SECOND tap of the same element the class is already present, so
 *   classList.add() changes NOTHING and the production detector
 *   (gz-analytics.js:601-631) sees snapClass === nowClass at +1500ms and
 *   logs a dead_click.  Measured live: ALIVE, DEAD_CLICK, DEAD_CLICK,
 *   DEAD_CLICK on a 4-tap burst.
 *
 * WHAT THIS GATE CHECKS
 *   1. Byte-faithful replica of the production detector (same tag filter,
 *      same lookClickable test, same className/aria-expanded/inline-style
 *      snapshot triple, same 1500ms re-read).
 *   2. POSITIVE: a 4-tap burst on ONE element must produce ALIVE x4.
 *   3. NEGATIVE CONTROL A: a genuinely dead element must still report
 *      DEAD_CLICK (i.e. we did not blind the detector).
 *   4. NEGATIVE CONTROL B: a live element must report ALIVE.
 *   5. CALIBRATION: the same harness run against the PRE-FIX implementation
 *      must FAIL — proving the gate can actually fail.
 *
 * The ack implementation under test is extracted verbatim from
 * tile-master/index.html and executed against a minimal DOM stub, so this
 * gate tests the SHIPPED code, not a re-implementation of it.
 *
 * All timers (taps, ack timeouts AND the detector's 1500ms re-read) run on
 * ONE deterministic virtual clock — a real clock would make the 1500ms
 * re-read race the test's own timeout.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const HTML = path.join(HERE, 'index.html');
const src = fs.readFileSync(HTML, 'utf8');

/* ---------- 1. extract the shipped ack IIFE ---------- */
function extractAck() {
  const marker = '__gzTmTapBound';
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('ack block not found in ' + HTML);
  const start = src.lastIndexOf('(function(){', i);
  if (start < 0) throw new Error('ack IIFE start not found');
  let depth = 0, j = start;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) break; }
  }
  // the IIFE is INVOKED — `(function(){...})();`. Depth counting stops at the
  // `)` of `})`, so the trailing `()` invocation must be carried over,
  // otherwise the extracted body is never executed and the gate would
  // measure nothing (it would "pass" a broken impl and fail a fixed one).
  let end = j + 1;
  while (end < src.length && src[end] !== ';') {
    if (src[end] === '(') {
      let d2 = 0, k = end;
      for (; k < src.length; k++) {
        if (src[k] === '(') d2++;
        else if (src[k] === ')') { d2--; if (d2 === 0) break; }
      }
      end = k + 1;
      continue;
    }
    end++;
  }
  const body = src.slice(start, end) + ';';
  if (!/\)\s*\(\s*\)\s*;?\s*$/.test(body)) {
    throw new Error('extracted ack body is not an invoked IIFE — extraction bug');
  }
  if (!/stamp|__gzTapN/.test(body)) {
    throw new Error('ack block found but has no monotonic counter — the R339 fix is missing');
  }
  return body;
}

/* ---------- 2. virtual clock ---------- */
function makeClock() {
  let now = 0, seq = 0;
  const timers = [];
  return {
    now: () => now,
    setTimeout(fn, ms) { const id = ++seq; timers.push({ id, at: now + (ms || 0), fn }); return id; },
    clearTimeout(id) { const t = timers.find(x => x.id === id); if (t) t.cancelled = true; },
    advance(to) {
      while (true) {
        const due = timers.filter(t => !t.done && !t.cancelled && t.at <= to).sort((a, b) => a.at - b.at);
        if (!due.length) break;
        const t = due[0]; t.done = true; now = Math.max(now, t.at);
        try { t.fn(); } catch (e) { /* a thrown timer callback is the game's problem, not the detector's */ }
      }
      now = Math.max(now, to);
    }
  };
}

/* ---------- 3. minimal DOM stub ---------- */
function makeEl(tag, cls) {
  const el = { tagName: tag, style: {}, attributes: {}, offsetWidth: 1 };
  const set = new Set();
  el.classList = {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    contains: c => set.has(c),
    toggle: (c, on) => { if (on === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else if (on) set.add(c); else set.delete(c); }
  };
  if (cls) cls.split(' ').forEach(c => set.add(c));
  // className MUST reflect classList mutations (the real DOM guarantees this,
  // and the detector compares className strings).
  Object.defineProperty(el, 'className', {
    get() { return [...set].join(' '); },
    set(v) { set.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => set.add(x)); },
    configurable: true
  });
  el.style.setProperty = function (k, v) { this[k] = v; this._raw = (this._raw || '') + k + ':' + v + ';'; };
  el.style.removeProperty = function (k) { delete this[k]; if (this._raw) this._raw = this._raw.replace(new RegExp('(^|;)\\s*' + k + '\\s*:[^;]*;?'), '$1'); };
  el.getAttribute = function (k) {
    if (k === 'class') return el.className;
    if (k === 'style') return el.style._raw || '';
    return el.attributes[k] === undefined ? null : el.attributes[k];
  };
  el.setAttribute = function (k, v) { el.attributes[k] = v; };
  el.style.cursor = '';
  el.onclick = null;
  el.parentNode = null;
  el.children = [];
  return el;
}

/* ---------- 4. byte-faithful production detector replica ----------
   mirrors gz-analytics.js lines 599-632 (capture phase, 1500ms re-read) */
function makeDetector(log, clock) {
  return function (e) {
    const t = e.target;
    const tag = t.tagName;
    if (tag === 'DIV' || tag === 'SPAN' || tag === 'LABEL' || tag === 'LI' || tag === 'IMG' || tag === 'SVG' || tag === 'P') {
      const lookClickable = t.getAttribute('role') === 'button'
        || t.onclick
        || (t.style && t.style.cursor === 'pointer')
        || (t.className && /click|card|btn|tile|thumb|seg/i.test(t.className.toString()));
      if (lookClickable) {
        const snapClass = t.className.toString();
        const snapAria = t.getAttribute('aria-expanded') || '';
        const snapInline = t.getAttribute('style') || '';
        clock.setTimeout(function () {
          const nowClass = t.className.toString();
          const nowAria = t.getAttribute('aria-expanded') || '';
          const nowInline = t.getAttribute('style') || '';
          const stateChanged = (snapClass !== nowClass) || (snapAria !== nowAria) || (snapInline !== nowInline);
          log.push({
            sel: (t.tagName || '?') + '.' + (t.className || '').toString().slice(0, 40),
            verdict: stateChanged ? 'ALIVE' : 'DEAD_CLICK',
            snapClass, nowClass
          });
        }, 1500);
      }
    }
  };
}

/* ---------- 5. run a scenario ---------- */
function runScenario(ackBody, scenario) {
  const clock = makeClock();
  const board = makeEl('DIV', 'tm-board');
  const log = [];
  const ctx = {
    document: {
      getElementById: id => (id === 'tm-board' ? board : null),
      addEventListener: (type, fn) => { if (type === 'click') ctx.document.__det = fn; }
    },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    Date: { now: clock.now }
  };
  ctx.globalThis = ctx;
  const det = makeDetector(log, clock);
  ctx.document.addEventListener('click', det, true);   // CAPTURE phase on document
  board.addEventListener = (type, fn) => { if (type === 'click') board.__bub = fn; };  // BUBBLE phase on #tm-board

  vm.createContext(ctx);
  try { vm.runInContext(ackBody, ctx, { timeout: 5000 }); }
  catch (e) { return { error: 'ack threw: ' + e.message }; }

  scenario(board, ctx, clock);
  clock.advance(4000);   // past every tap + the 1500ms detector window
  return { log };
}

/* ---------- 6. scenarios ---------- */
function makeTile() {
  const t = makeEl('DIV', 'tm-tile');
  const board = makeEl('DIV', 'tm-board');
  t.parentNode = board;
  board.children.push(t);
  return { t, board };
}

// 4 taps @180ms on ONE element — the exact shape the production detector sees
function burstScenario(board, ctx, clock) {
  const t = makeTile().t;
  const ev = { target: t };
  for (let i = 0; i < 4; i++) {
    clock.setTimeout(() => {
      if (ctx.document.__det) ctx.document.__det(ev);   // capture phase first
      if (board.__bub) board.__bub(ev);                 // then the game's bubble handler
    }, i * 180);
  }
}

function deadControlScenario(board, ctx, clock) {
  const dead = makeEl('DIV', 'tm-tile dead-card');
  const ev = { target: dead };
  clock.setTimeout(() => { if (ctx.document.__det) ctx.document.__det(ev); }, 0);
}

function liveControlScenario(board, ctx, clock) {
  const live = makeEl('DIV', 'tm-tile live-card');
  const ev = { target: live };
  clock.setTimeout(() => {
    if (ctx.document.__det) ctx.document.__det(ev);
    live.classList.add('changed');       // a real, observable change
  }, 0);
}

/* ---------- 7. run ---------- */
(async function () {
  const fails = [];
  let ackBody;
  try { ackBody = extractAck(); }
  catch (e) { console.log(JSON.stringify({ pass: 0, fail: 3, total: 3, verdict: 'FAIL', fails: [e.message] })); process.exit(1); }

  const burst = runScenario(ackBody, burstScenario);
  if (burst.error) fails.push('burst scenario errored: ' + burst.error);
  else {
    const verdicts = burst.log.map(x => x.verdict);
    const dead = verdicts.filter(v => v === 'DEAD_CLICK').length;
    if (dead !== 0) fails.push(`burst: ${dead}/${verdicts.length} taps reported DEAD_CLICK (expected 0) — verdicts=${JSON.stringify(verdicts)}`);
    if (verdicts.length !== 4) fails.push(`burst: expected 4 detector verdicts, got ${verdicts.length}`);
  }

  const deadCtl = runScenario(ackBody, deadControlScenario);
  if (deadCtl.error) fails.push('dead-control errored: ' + deadCtl.error);
  else if (!deadCtl.log.length || deadCtl.log[0].verdict !== 'DEAD_CLICK') {
    fails.push('NEGATIVE CONTROL FAILED: a genuinely dead element was NOT flagged (detector blinded) — ' + JSON.stringify(deadCtl.log));
  }

  const liveCtl = runScenario(ackBody, liveControlScenario);
  if (liveCtl.error) fails.push('live-control errored: ' + liveCtl.error);
  else if (!liveCtl.log.length || liveCtl.log[0].verdict !== 'ALIVE') {
    fails.push('NEGATIVE CONTROL FAILED: a live element was flagged DEAD_CLICK — ' + JSON.stringify(liveCtl.log));
  }

  // CALIBRATION — the PRE-FIX class-only implementation must FAIL this gate
  const PRE_FIX = `(function(){
  var board = document.getElementById("tm-board");
  if(!board || board.__gzTmTapBound) return;
  board.__gzTmTapBound = true;
  board.addEventListener("click", function(e){
    var n = e.target;
    while(n && n !== board && !(n.classList && n.classList.contains("tm-tile"))) n = n.parentNode;
    if(!n || n === board) return;
    n.classList.add("tile-pressed");
    setTimeout(function(){
      if(n && n.classList && n.classList.contains("tile-pressed")) n.classList.remove("tile-pressed");
    }, 1700);
  });
})();`;
  const cal = runScenario(PRE_FIX, burstScenario);
  const calDead = (cal.log || []).filter(x => x.verdict === 'DEAD_CLICK').length;
  if (calDead === 0) fails.push('CALIBRATION FAILED: the pre-fix class-only implementation PASSED the burst gate — the gate cannot fail');

  const out = {
    pass: 3 - Math.min(3, fails.length), fail: fails.length, total: 3,
    verdict: fails.length ? 'FAIL' : 'PASS',
    fails,
    detail: {
      burst: (burst.log || []).map(x => x.verdict),
      deadControl: (deadCtl.log || []).map(x => x.verdict),
      liveControl: (liveCtl.log || []).map(x => x.verdict),
      calibration_preFixDead: calDead
    }
  };
  console.log(JSON.stringify(out));
  process.exit(fails.length ? 1 : 0);
})();
