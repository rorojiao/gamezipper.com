/**
 * R341 — canal-lock locked-level feedback probe.
 * Question: does tapping a LOCKED level cell give the player ANY feedback?
 * The cell is rendered as  class="lc lk"  with  onclick=""  (empty attribute).
 * BI logs 12 dead_click on /canal-lock/ with sel "DIV.lc" and "DIV.lc lk".
 */
const { execFileSync } = require('child_process');
const KB = '/home/junze/.nvm/versions/node/v22.22.0/bin/kachilu-browser';
const base = process.argv[2] || 'http://127.0.0.1:8899';

const PROBE = `
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [], errs: [] };
  window.addEventListener('error', e => out.errs.push(String(e.message)));

  // reach the level-select screen
  document.querySelector('.btn[onclick*="sl("]')?.click();
  await sleep(700);
  out.screen = document.querySelector('.s.active')?.id || null;

  const cells = [...document.querySelectorAll('.lc')];
  out.totalCells = cells.length;
  out.lockedCount = cells.filter(c => c.classList.contains('lk')).length;
  out.unlockedCount = cells.filter(c => !c.classList.contains('lk')).length;
  out.lockedHasOnclickAttr = cells.filter(c => c.classList.contains('lk'))
    .map(c => c.getAttribute('onclick')).filter(Boolean).length;
  out.lockedOnclickPropTruthy = cells.filter(c => c.classList.contains('lk'))
    .map(c => !!c.onclick);

  // ---- CONTROL 1: a genuinely dead div ----
  const dead = document.createElement('div');
  dead.className = 'r341-dead-ctl';
  document.body.appendChild(dead);
  const deadBefore = dead.className + '|' + (dead.getAttribute('style')||'');
  dead.click();
  await sleep(1600);
  out.deadCtl = { before: deadBefore, after: dead.className + '|' + (dead.getAttribute('style')||''),
                   changed: deadBefore !== (dead.className + '|' + (dead.getAttribute('style')||'')) };
  dead.remove();

  // ---- TARGET: the FIRST locked cell ----
  const locked = cells.find(c => c.classList.contains('lk'));
  if (locked) {
    const snap = () => ({
      cls: locked.className,
      style: locked.getAttribute('style') || '',
      aria: locked.getAttribute('aria-expanded') || '',
      bodyTxt: document.body.innerText.slice(0, 300),
      toast: (() => {
        const t = document.querySelector('.toast, #toast, .nt, .msg, [class*="toast"], [class*="msg"], [id*="toast"]');
        return t ? (t.innerText||'').trim().slice(0,80) : null;
      })(),
      anyNewText: document.body.innerText.length
    });
    const before = snap();
    locked.click();
    await sleep(1700);
    const after = snap();
    out.lockedStep = {
      clsBefore: before.cls, clsAfter: after.cls,
      styleBefore: before.style, styleAfter: after.style,
      ariaBefore: before.aria, ariaAfter: after.aria,
      elementChanged: before.cls !== after.cls || before.style !== after.style || before.aria !== after.aria,
      bodyChanged: before.bodyTxt !== after.bodyTxt,
      toastBefore: before.toast, toastAfter: after.toast,
      screenAfter: document.querySelector('.s.active')?.id || null
    };
  }

  // ---- CONTROL 2: an UNLOCKED cell (should start a level) ----
  const un = cells.find(c => !c.classList.contains('lk'));
  if (un) {
    const scr0 = document.querySelector('.s.active')?.id;
    un.click();
    await sleep(800);
    out.unlockedStep = { screenBefore: scr0, screenAfter: document.querySelector('.s.active')?.id || null };
  }
  return out;
})()
`;

function kb(args, timeout) {
  try { return execFileSync(KB, args, { encoding: 'utf8', timeout: timeout || 240000, stdio: ['ignore','pipe','pipe'] }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
function unwrap(raw) {
  let d = (raw || '').trim();
  for (let i = 0; i < 6; i++) { if (typeof d !== 'string') return d; try { d = JSON.parse(d); } catch (e) { return null; } }
  return typeof d === 'object' ? d : null;
}

const session = 'r341-cl-' + Date.now().toString(36);
kb(['--session', session, 'open', base + '/canal-lock/?v=' + Date.now()]);
kb(['--session', session, 'wait', '8000']);
const raw = kb(['--session', session, 'eval', '--base64', Buffer.from(PROBE).toString('base64')]);
kb(['--session', session, 'close']);
const res = unwrap(raw);
if (!res || res.ERROR) { console.log('PROBE-FAIL ' + String(raw).slice(0,300)); process.exit(1); }
console.log(JSON.stringify(res, null, 2));
