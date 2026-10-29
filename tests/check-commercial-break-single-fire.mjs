#!/usr/bin/env node
// Offline regression: evaluate the real browser script, including its loaders and timers.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixed = readFileSync(new URL('../monetag-manager.js', import.meta.url), 'utf8');

// The negative control needs the PRE-FIX bytes. It used to read
// `git show HEAD:monetag-manager.js`, which silently rotted the moment the
// fix was committed: HEAD then held the FIXED file, so the control compared
// the fix against itself and failed with "negative control must reproduce two
// overlays - 1 !== 2".
//
// Resolve it properly instead: walk the history of monetag-manager.js and
// take the NEWEST revision that does NOT contain the fix marker. That is
// stable across future commits, rebases and squashes, and it is real
// production bytes rather than a simulated one.
const MARKER = 'commercialBreakInFlight';
function preFixBytes() {
  const override = process.env.R1013_PREFIX_REF;
  const shas = execFileSync('git', ['log', '--format=%H', '--', 'monetag-manager.js'], {
    cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024,
  }).trim().split('\n').filter(Boolean);
  if (override) shas.unshift(override);
  for (const sha of shas) {
    let bytes;
    try {
      bytes = execFileSync('git', ['show', `${sha}:monetag-manager.js`], {
        cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024,
      });
    } catch { continue; }
    if (!bytes.includes(MARKER)) return bytes;
  }
  throw new Error(
    'no pre-fix revision of monetag-manager.js found in git history ' +
    '(the negative control needs one; set R1013_PREFIX_REF to override)');
}
const original = preFixBytes();

function sandbox(bytes, fill = true) {
  // No resources option: jsdom cannot fetch scripts/iframes. outside-only also
  // prevents inserted scripts from executing. The classic loader is an inert stub.
  const dom = new JSDOM('<!doctype html><head><script data-gz-adsense-classic="1"></script></head><body></body>', {
    url: 'https://gamezipper.com/regression/', runScripts: 'outside-only',
  });
  const { window } = dom;
  const { document } = window;
  assert.equal(document.referrer, '');
  // Isolate the public API from unrelated homepage/game-page auto-init work.
  Object.defineProperty(document, 'readyState', { value: 'loading' });
  const addListener = document.addEventListener.bind(document);
  document.addEventListener = function(type, ...args) {
    if (type !== 'DOMContentLoaded') return addListener(type, ...args);
  };
  const events = [];
  window.gzAnalytics = { sendAd(type, data) { events.push({ ...data, type }); } };
  const noNetwork = () => { throw new Error('Unexpected network request'); };
  window.fetch = noNetwork;
  window.XMLHttpRequest = noNetwork;
  window.navigator.sendBeacon = noNetwork;
  window.adsbygoogle = {
    push() {
      for (const ins of document.querySelectorAll('ins.adsbygoogle')) {
        if (ins.hasAttribute('data-ad-status')) continue;
        ins.setAttribute('data-ad-status', fill ? 'filled' : 'unfilled');
        if (fill) ins.appendChild(document.createElement('iframe'));
      }
    },
  };

  // Run the production durations unchanged, using a deterministic virtual clock.
  let time = 1800000000000;
  let nextId = 0;
  const timers = new Map();
  window.Date.now = () => time;
  function schedule(fn, delay, repeat) {
    const id = ++nextId;
    timers.set(id, { fn, at: time + Number(delay || 0), repeat });
    return id;
  }
  window.setTimeout = (fn, delay) => schedule(fn, delay, 0);
  window.setInterval = (fn, delay) => schedule(fn, delay, Number(delay));
  window.clearTimeout = window.clearInterval = id => timers.delete(id);
  async function advance(ms) {
    const end = time + ms;
    for (let steps = 0; ; steps++) {
      assert.ok(steps < 10000, 'virtual timer runaway');
      // Flush loader promises before choosing the next timer.
      for (let i = 0; i < 6; i++) await Promise.resolve();
      const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      const [id, timer] = next;
      time = timer.at;
      if (timer.repeat) timer.at += timer.repeat;
      else timers.delete(id);
      timer.fn();
    }
    time = end;
  }
  try {
    window.eval(bytes);
  } catch (error) {
    window.close();
    throw error;
  }
  return { window, document, events, advance, close: () => { timers.clear(); window.close(); } };
}

function breakEvents(s) {
  return s.events.filter(event => event.type.startsWith('commercial_break_'));
}

async function finish(s, promises) {
  let deadline;
  const completion = Promise.race([
    Promise.all(promises),
    new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('break promises hung')), 2000); }),
  ]);
  try {
    await s.advance(s.window.GZAds._config.TIMING.commercialBreakMaxDuration);
    assert.deepEqual(await completion, promises.map(() => undefined));
  } finally {
    clearTimeout(deadline);
  }
}

async function concurrent(bytes, fill = true) {
  const s = sandbox(bytes, fill);
  try {
    const first = s.window.GZInterstitial.show();
    const second = s.window.GZAds.commercialBreak('level_complete_event');
    const overlays = s.document.querySelectorAll('[id="gz-cb-overlay"]').length;
    // In the negative control both requests stay pending until the max timer.
    await finish(s, [first, second]);
    assert.equal(s.document.querySelectorAll('[id="gz-cb-overlay"]').length, 0);
    return { overlays, events: breakEvents(s), fill };
  } finally {
    s.close();
  }
}

function assertSingleFire(result) {
  const failures = [];
  function check(fn) { try { fn(); } catch (error) { failures.push(error.message); } }
  const ofType = type => result.events.filter(event => event.type === type);
  check(() => assert.equal(result.overlays, 1, 'exactly one overlay'));
  check(() => assert.equal(ofType('commercial_break_invoked').length, 1, 'exactly one invoked'));
  const skipped = ofType('commercial_break_skipped');
  check(() => assert.equal(skipped.length, 1, 'exactly one skipped'));
  check(() => assert.equal(skipped[0]?.reason, 'break_in_flight', 'concurrent suppression reason'));
  check(() => assert.equal(skipped[0]?.source, 'level_complete_event', 'suppressed source'));
  check(() => assert.equal(ofType('commercial_break_invoked')[0]?.source, 'legacy_interstitial'));
  const outcome = result.fill ? 'commercial_break_fill' : 'commercial_break_no_fill';
  check(() => assert.equal(ofType(outcome).length, 1, 'exactly one fill/no_fill outcome'));
  for (const type of new Set(result.events.map(event => event.type))) {
    check(() => assert.equal(ofType(type).length, 1, `no duplicate ${type}`));
  }
  assert.equal(failures.length, 0, failures.join('\n'));
}

async function checkReleasePaths() {
  const s = sandbox(fixed);
  try {
    // Frequency rejection must release ownership synchronously.
    const key = s.window.GZAds._config.STORAGE_PREFIX + 'last_commercial_break';
    s.window.localStorage.setItem(s.window.GZAds._config.STORAGE_PREFIX + 'ad_ts',
      JSON.stringify([s.window.Date.now()]));
    await s.window.GZAds.commercialBreak('capped');
    assert.equal(breakEvents(s).at(-1).reason, 'frequency_cap');
    s.window.localStorage.clear();
    s.window.GZAds._state.adTimestamps = [];

    // An orphan overlay must block invocation, and removing it must allow retry.
    const orphan = s.document.createElement('div');
    orphan.id = 'gz-cb-overlay';
    s.document.body.appendChild(orphan);
    await s.window.GZAds.commercialBreak('orphan');
    assert.deepEqual(breakEvents(s).map(event => [event.type, event.reason, event.source]), [
      ['commercial_break_skipped', 'frequency_cap', 'capped'],
      ['commercial_break_skipped', 'overlay_present', 'orphan'],
    ]);
    assert.equal(s.document.querySelectorAll('[id="gz-cb-overlay"]').length, 1);
    orphan.remove();

    // Inject a synchronous body exception; the same error must reject the promise.
    const createElement = s.document.createElement.bind(s.document);
    const injected = new Error('injected overlay creation failure');
    s.document.createElement = () => { throw injected; };
    await assert.rejects(s.window.GZAds.commercialBreak('exception'), error => error === injected);
    s.document.createElement = createElement;
    const retry = s.window.GZAds.commercialBreak('retry');
    assert.equal(s.document.querySelectorAll('[id="gz-cb-overlay"]').length, 1);
    assert.equal(s.window.localStorage.getItem(key), null, 'cooldown not recorded before finish');
    // Allow the duplicate promise to settle, then try again while the owner runs.
    await s.window.GZAds.commercialBreak('duplicate_one');
    await s.window.GZAds.commercialBreak('duplicate_two');
    assert.equal(breakEvents(s).at(-1).reason, 'break_in_flight');
    await finish(s, [retry]);
    assert.ok(s.window.localStorage.getItem(key), 'cooldown recorded at finish');
    s.window.localStorage.clear();
    s.window.GZAds._state.adTimestamps = [];
    const afterFinish = s.window.GZAds.commercialBreak('after_finish');
    assert.equal(s.document.querySelectorAll('[id="gz-cb-overlay"]').length, 1);
    await finish(s, [afterFinish]);
  } finally {
    s.close();
  }
}

try {
  const baseline = await concurrent(original);
  assert.equal(baseline.overlays, 2, 'negative control must reproduce two overlays');
  assert.equal(baseline.events.filter(event => event.type === 'commercial_break_invoked').length, 2);
  assert.equal(baseline.events.filter(event => event.type === 'commercial_break_fill').length, 2);
  assert.throws(() => assertSingleFire(baseline), assert.AssertionError);
  console.log('PASS negative control (HEAD): 2 overlays, 2 invoked; single-fire assertions fail as expected');
  assertSingleFire(await concurrent(fixed));
  console.log('PASS fixed: 1 overlay, 1 invoked, 1 skipped (break_in_flight), 1 fill; both promises resolve');
  assertSingleFire(await concurrent(fixed, false));
  console.log('PASS no-fill: one event per break type; both promises resolve');
  await checkReleasePaths();
  console.log('PASS ownership released after frequency cap, overlay_present, exception, and finish; rejection preserved');
} catch (error) {
  console.error('FAIL commercial-break single-fire:', error.stack || error);
  process.exitCode = 1;
}
