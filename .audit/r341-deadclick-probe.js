/**
 * R341 — byte-faithful replica of gz-analytics.js's dead_click detector
 * (gz-analytics.js lines 599-632), PLUS a global-state observer.
 *
 * The production detector is CAPTURE-phase, 1500ms, and compares ONLY:
 *   className | aria-expanded | inline style attribute
 * on the SAME element reference `t = e.target`.
 *
 * This replica therefore CANNOT see a click whose response is a screen
 * change or a state change elsewhere on the page. To tell a REAL dead
 * click (the element really did nothing) from a NAVIGATION click (the
 * element is unchanged but the app responded elsewhere), we ALSO snapshot
 * a broad global fingerprint before/after.
 *
 * Usage:  node .audit/r341-deadclick-probe.js <baseUrl> <slug> <selector> [maxClicks]
 *   baseUrl e.g. http://127.0.0.1:8899
 *
 * Controls are mandatory (Pitfall #31 / R336):
 *   - a synthetic DEAD div (no handler) MUST report DEAD_CLICK
 *   - a synthetic LIVE div (adds a class) MUST report ALIVE
 */

const { execFileSync } = require('child_process');

const KB = '/home/junze/.nvm/versions/node/v22.22.0/bin/kachilu-browser';
const base = process.argv[2];
const slug = process.argv[3];
const selector = process.argv[4];
const maxClicks = parseInt(process.argv[5] || '1', 10);

if (!base || !slug || !selector) {
  console.error('usage: node r341-deadclick-probe.js <baseUrl> <slug> <selector> [maxClicks]');
  process.exit(2);
}

const PROBE = `
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { href: location.href, steps: [], controls: {}, errs: [] };
  window.addEventListener('error', e => out.errs.push(String(e.message)));

  // ---- optional pre-navigation: click a menu button to reach the target screen ----
  const PRE = ${JSON.stringify(process.env.R341_PRE || '')};
  if (PRE) {
    for (const sel of PRE.split('|')) {
      const b = document.querySelector(sel);
      if (b) { b.click(); await sleep(500); }
    }
    await sleep(400);
  }
  out.preHref = location.href;

  // ---- byte-faithful production detector replica ----
  function detectorSnapshot(t) {
    return {
      className: t.className.toString(),
      aria: t.getAttribute('aria-expanded') || '',
      inline: t.getAttribute('style') || ''
    };
  }
  // broad global fingerprint: catches ANY response elsewhere on the page
  function globalFingerprint() {
    const screens = [...document.querySelectorAll('.screen, [class*="screen"], #wo, #game, [id*="game"]')]
      .map(e => e.id + ':' + (e.className||'') + ':' + (getComputedStyle(e).display||'')).join('|');
    const bodyTxt = document.body.innerText.slice(0, 400);
    const canv = [...document.querySelectorAll('canvas')].map(c => c.id + ':' + c.width + 'x' + c.height).join('|');
    const ls = Object.keys(localStorage).map(k => k + '=' + (localStorage.getItem(k)||'').slice(0,40)).join('|');
    return screens + '##' + bodyTxt + '##' + canv + '##' + ls;
  }

  function runOne(el) {
    return new Promise(resolve => {
      const before = detectorSnapshot(el);
      const gBefore = globalFingerprint();
      let clicked = false;
      const capture = (e) => { if (el.contains(e.target) || e.target === el) clicked = true; };
      document.addEventListener('click', capture, true);
      el.click();
      document.removeEventListener('click', capture, true);
      setTimeout(() => {
        const after = detectorSnapshot(el);
        const gAfter = globalFingerprint();
        const elementChanged = (before.className !== after.className) || (before.aria !== after.aria) || (before.inline !== after.inline);
        const globalChanged = (gBefore !== gAfter);
        resolve({
          clicked: clicked,
          elementChanged: elementChanged,
          globalChanged: globalChanged,
          detectorVerdict: elementChanged ? 'ALIVE' : 'DEAD_CLICK',
          truthVerdict: (elementChanged || globalChanged) ? 'RESPONDED' : 'TRULY_DEAD',
          inDOM: document.body.contains(el),
          before: before, after: after
        });
      }, 1600);
    });
  }

  // ---- controls ----
  const dead = document.createElement('div');
  dead.className = 'r341-dead-ctl';
  document.body.appendChild(dead);
  out.controls.dead = await runOne(dead);
  dead.remove();

  const live = document.createElement('div');
  live.className = 'r341-live-ctl';
  document.body.appendChild(live);
  live.addEventListener('click', () => live.classList.add('r341-acked'));
  out.controls.live = await runOne(live);
  live.remove();

  // ---- targets ----
  const targets = [...document.querySelectorAll(${JSON.stringify(selector)})];
  out.targetCount = targets.length;
  const n = Math.min(targets.length, ${maxClicks});
  for (let i = 0; i < n; i++) {
    const el = targets[i];
    const step = await runOne(el);
    step.index = i;
    step.sel = (el.tagName||'?') + '.' + (el.className||'').toString().slice(0,40);
    step.text = (el.innerText||el.textContent||'').trim().slice(0,40);
    out.steps.push(step);
    await sleep(300);
  }
  out.finalHref = location.href;
  return out;
})()
`;

function kb(args, timeout) {
  try {
    return execFileSync(KB, args, { encoding: 'utf8', timeout: timeout || 240000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

function unwrap(raw) {
  let d = (raw || '').trim();
  for (let i = 0; i < 6; i++) {
    if (typeof d !== 'string') return d;
    try { d = JSON.parse(d); } catch (e) { return null; }
  }
  return typeof d === 'object' ? d : null;
}

const session = 'r341-dc-' + slug + '-' + Date.now().toString(36);
const url = base + '/' + slug + '/?v=' + Date.now();
kb(['--session', session, 'open', url]);
kb(['--session', session, 'wait', '9000']);
const raw = kb(['--session', session, 'eval', '--base64', Buffer.from(PROBE).toString('base64')]);
kb(['--session', session, 'close']);

const res = unwrap(raw);
if (!res || res.ERROR) {
  console.log('PROBE-FAIL ' + (res && res.ERROR ? res.ERROR : String(raw).slice(0, 300)));
  process.exit(1);
}
console.log(JSON.stringify(res, null, 2));
const c = res.controls || {};
console.log('\n--- CONTROL VALIDATION ---');
console.log('dead ctl  detector=' + (c.dead && c.dead.detectorVerdict) + ' truth=' + (c.dead && c.dead.truthVerdict)
  + '  (REQUIRED: DEAD_CLICK / TRULY_DEAD)');
console.log('live ctl  detector=' + (c.live && c.live.detectorVerdict) + ' truth=' + (c.live && c.live.truthVerdict)
  + '  (REQUIRED: ALIVE / RESPONDED)');
const ctlOK = c.dead && c.dead.detectorVerdict === 'DEAD_CLICK' && c.live && c.live.detectorVerdict === 'ALIVE';
console.log('controls valid: ' + (ctlOK ? 'YES' : 'NO -- results untrustworthy'));
(res.steps || []).forEach(s => {
  console.log('target[' + s.index + '] ' + s.sel + ' "' + s.text + '" -> detector=' + s.detectorVerdict
    + ' truth=' + s.truthVerdict + ' elementChanged=' + s.elementChanged + ' globalChanged=' + s.globalChanged);
});
if (res.errs && res.errs.length) console.log('page errors: ' + JSON.stringify(res.errs));
process.exit(ctlOK ? 0 : 1);
