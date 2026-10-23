#!/usr/bin/env node
// R983 proof for the banner_no_fill telemetry.
//
// The failure mode this guards is "the emitter is unreachable", which no unit
// test on trackAdEvent() can catch. So this drives the REAL fillInGameBanner
// poll callback out of the shipped monetag-manager.js, with a container that
// never fills, and asserts on what gets tracked.
//
// Scenarios:
//   timeout      -> the AdSense poll hits inGameBannerMaxFillMs: must EMIT no_fill
//   early-fill   -> container fills at 900ms: must NOT emit no_fill
//   deadzone     -> same timeout, but with inpagePush in deadZones (the shipped
//                   config): must STILL emit no_fill -- this is the exact
//                   regression, since the old emitter sat behind that guard.

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const REPO = '/home/junze/gamezipper.com';
const src = fs.readFileSync(path.join(REPO, 'monetag-manager.js'), 'utf8');

// Pull the real fillInGameBanner body out of the shipped file.
const start = src.indexOf('function fillInGameBanner(');
if (start < 0) { console.error('FAIL: fillInGameBanner not found'); process.exit(1); }
let depth = 0, i = src.indexOf('{', start), end = -1;
for (let k = i; k < src.length; k++) {
  if (src[k] === '{') depth++;
  else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
}
const body = src.slice(start, end);
if (!/trackAdEvent\('banner_no_fill'/.test(body)) {
  console.error('FAIL: fillInGameBanner contains no banner_no_fill emitter');
  process.exit(1);
}

function run(name, { fillMs, deadZones, inpagePush }) {
  let vnow = 1000000;
  const tracked = [];
  const timers = [];
  const container = {
    _filled: false,
    getAttribute(a) { return a === 'data-filled' ? (this._filled ? '1' : null) : null; },
    setAttribute(a, v) { if (a === 'data-filled') this._filled = v === '1'; },
    querySelector() { return null; },
    style: {},
  };
  const sandbox = {
    console, Math, JSON,
    // The poll measures its timeout with Date.now(), so the sandbox needs a
    // clock that follows the virtual time below. Passing the real Date here
    // makes the loop spin thousands of ticks inside one real millisecond and
    // the 10s timeout never fires -- the run reports 0 events and looks like a
    // failed fix when the emitter is fine.
    Date: class extends Date { static now() { return vnow; } },
    // setTimeout must actually run its callback: fillInGameBanner defers the
    // whole AdSense race behind one. setInterval ticks are driven manually
    // below so virtual time stays under our control.
    setTimeout: (fn) => { fn(); return 1; },
    setInterval: (fn, ms) => { timers.push({ fn, ms, at: 0 }); return timers.length; },
    clearInterval: () => {}, clearTimeout: () => {},
    trackAdEvent: (t, meta) => tracked.push({ type: t, meta }),
    markAdShown: () => {}, canShowAd: () => true, showToast: () => {},
    loadAdSenseAd: () => {}, loadZone: () => Promise.reject(new Error('deadzone-guard-blocks-this')),
    CONFIG: { BANNERS: { slotId: 'test-slot' },
              ZONES: { inpagePush, deadZones },
              TIMING: { inGameBannerMaxFillMs: 10000, inGameBannerLoadDelay: 0 } },
    container, position: 'below-canvas',
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext('var CONFIG=CONFIG, container=container, position=position, trackAdEvent=trackAdEvent, markAdShown=markAdShown, canShowAd=canShowAd, loadAdSenseAd=loadAdSenseAd, loadZone=loadZone;\n' + body, ctx, { timeout: 5000 });

  // Actually invoke it -- defining the function does not run the poll.
  if (typeof sandbox.fillInGameBanner !== 'function') { console.error('FAIL: fillInGameBanner not exported to sandbox'); process.exit(1); }
  sandbox.fillInGameBanner(container, 'below-canvas');

  // Advance virtual time to the first setInterval tick, and simulate the poll.
  let clock = 0;
  for (const t of timers) {
    for (let n = 0; n < 40; n++) {
      clock += 300; vnow += 300;
      if (fillMs != null && clock >= fillMs && !container._filled) {
        container.setAttribute('data-filled', '1');   // AdSense filled in time
      }
      t.fn();
      if (tracked.some(x => x.type === 'banner_no_fill')) break;
    }
  }
  const noFill = tracked.filter(x => x.type === 'banner_no_fill');
  console.log(`${name.padEnd(11)} no_fill_events=${noFill.length}` +
    (noFill.length ? `  reason=${noFill[0].meta.reason} network=${noFill[0].meta.network}` : ''));
  return noFill.length;
}

const INPAGEPUSH = 11012002;
const DEAD = [11012002, 11012003];

const a = run('timeout', { fillMs: null, deadZones: DEAD, inpagePush: INPAGEPUSH });
const b = run('early-fill', { fillMs: 900, deadZones: DEAD, inpagePush: INPAGEPUSH });
const c = run('deadzone', { fillMs: null, deadZones: [], inpagePush: INPAGEPUSH });

console.log('');
let ok = true;
if (a !== 1) { console.error(`FAIL: timeout case emitted ${a} no_fill events, expected exactly 1`); ok = false; }
if (b !== 0) { console.error(`FAIL: early-fill case emitted ${b} no_fill events, expected 0 (would double-count a real fill)`); ok = false; }
if (c !== 1) { console.error(`FAIL: deadzone case emitted ${c} no_fill events, expected 1`); ok = false; }
console.log(ok ? 'PASS: no_fill fires on genuine timeout, not on fill, and not behind the dead-zone guard.'
               : 'VERIFICATION FAILED');
process.exit(ok ? 0 : 1);