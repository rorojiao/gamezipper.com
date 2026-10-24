#!/usr/bin/env node
/**
 * hidato — BROWSER regression gate for the number-picker reopen bug (R334).
 *
 * THE BUG (P0, live 2026-10-24)
 *   openPicker() did:
 *       $("picker-grid").replaceWith(grid.cloneNode(true));
 *   The FIRST call replaced the static #picker-grid with a clone that has
 *   NO id, so #picker-grid no longer existed in the document. The SECOND
 *   call therefore evaluated $("#picker-grid") to null and threw
 *       TypeError: Cannot read properties of null (reading 'replaceWith')
 *   -> the number picker never opened again, so a player could place
 *   exactly ONE number per level and then the game became unplayable.
 *
 * WHY A BROWSER GATE IS REQUIRED
 *   The shared VM harness (harness-lib.js) implements getElementById as
 *   "create and return an element for ANY id" — it can never return null,
 *   so the VM structurally CANNOT reproduce this class of bug. The shipped
 *   hidato/verify_engine.js even stubbed `replaceWith` to a no-op, which is
 *   why it reported 30/30 PASS on a game that was broken in production.
 *   This gate therefore drives a real browser.
 *
 * WHAT IT ASSERTS
 *   1. the picker opens for cell A and a number lands in the grid;
 *   2. the picker STILL opens for cell B afterwards (the regression);
 *   3. a second number lands;
 *   4. no uncaught page error was raised during the sequence.
 *
 * USAGE
 *   node hidato/verify_picker_browser.js [baseUrl]
 *   baseUrl defaults to http://127.0.0.1:8899 (serve the repo root) and
 *   falls back to https://gamezipper.com when the local server is absent.
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KB = '/home/junze/.nvm/versions/node/v22.22.0/bin/kachilu-browser';
const base = process.argv[2] || 'http://127.0.0.1:8899';
const slug = 'hidato';

const PROBE = `
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const errs = [];
  window.addEventListener('error', e => errs.push(String(e.message)));
  const probe = document.createElement('button');
  document.body.appendChild(probe);
  probe.setAttribute('onclick', 'window.__S = (typeof State !== "undefined") ? State : null;');
  probe.click();
  const S = window.__S;
  if (!S) { probe.remove(); return { ERROR: 'no State global' }; }
  const cv = document.getElementById('board');
  const rect = cv.getBoundingClientRect();
  const n = S.puzzle.size;
  const cs = rect.width / n;
  const pathArr = S.puzzle.solution;
  const empties = pathArr.filter(([r, c]) => S.grid2d[r][c] === null).slice(0, 2);
  const out = { n, empties: empties.length, steps: [] };

  for (let i = 0; i < empties.length; i++) {
    const [rr, cc] = empties[i];
    // close any open picker first
    const pk = document.querySelector('.picker');
    if (pk && getComputedStyle(pk).display !== 'none') {
      const cl = document.querySelector('.picker-close');
      if (cl) cl.click();
      await sleep(20);
    }
    const before = S.grid2d.flat().filter(x => x !== null).length;
    cv.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: rect.left + (cc + 0.5) * cs, clientY: rect.top + (rr + 0.5) * cs,
      bubbles: true, cancelable: true }));
    await sleep(220);
    const pk2 = document.querySelector('.picker');
    const cells = [...document.querySelectorAll('.picker-cell')];
    const step = {
      index: i,
      pickerVisible: pk2 ? getComputedStyle(pk2).display : 'no-picker',
      cellCount: cells.length,
      hasPickerGrid: !!document.querySelector('#picker .picker-grid'),
    };
    // pick the FIRST unused number (any valid placement proves the path works)
    const btn = cells.find(c => !c.classList.contains('used') && !c.classList.contains('erase'));
    step.foundBtn = !!btn;
    if (btn) { btn.click(); await sleep(220); }
    step.filledBefore = before;
    step.filledAfter = S.grid2d.flat().filter(x => x !== null).length;
    step.placed = step.filledAfter > before;
    out.steps.push(step);
  }
  out.errs = errs;
  probe.remove();
  return out;
})()
`;

function kb(args, timeout) {
  try {
    return execFileSync(KB, args, { encoding: 'utf8', timeout: timeout || 180000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

function unwrap(raw) {
  let d = (raw || '').trim();
  for (let i = 0; i < 5; i++) {
    if (typeof d !== 'string') return d;
    try { d = JSON.parse(d); } catch (e) { return null; }
  }
  return typeof d === 'object' ? d : null;
}

const session = 'r334-hid-picker';
const url = base + '/' + slug + '/index.html?v=' + Date.now();
kb(['--session', session, 'open', url]);
kb(['--session', session, 'wait', '8000']);
const raw = kb(['--session', session, 'eval', '--base64', Buffer.from(PROBE).toString('base64')]);
kb(['--session', session, 'close']);

const res = unwrap(raw);
if (!res || res.ERROR) {
  console.log('hidato picker gate: PROBE-FAIL ' + (res && res.ERROR ? res.ERROR : String(raw).slice(0, 160)));
  process.exit(1);
}

console.log('hidato picker-reopen gate (' + base + ')');
console.log('  grid ' + res.n + 'x' + res.n + ', empty cells probed: ' + res.empties);
(res.steps || []).forEach(s => {
  console.log('  step' + s.index + ': picker=' + s.pickerVisible + ' cells=' + s.cellCount
    + ' #picker-grid=' + s.hasPickerGrid + ' placed=' + s.placed
    + ' (filled ' + s.filledBefore + ' -> ' + s.filledAfter + ')');
});
const errs = res.errs || [];
if (errs.length) console.log('  page errors: ' + JSON.stringify(errs));

let fail = 0;
if ((res.steps || []).length < 2) { console.log('  FAIL: fewer than 2 probe steps ran'); fail++; }
(res.steps || []).forEach(s => {
  if (s.pickerVisible !== 'block') { console.log('  FAIL: step' + s.index + ' picker did not open'); fail++; }
  if (!s.placed) { console.log('  FAIL: step' + s.index + ' number did not land'); fail++; }
});
if (errs.some(e => /TypeError|ReferenceError/.test(e))) { console.log('  FAIL: uncaught page error'); fail++; }

console.log(fail === 0 ? 'VERDICT: PASS' : 'VERDICT: FAIL');
process.exit(fail === 0 ? 0 : 1);
