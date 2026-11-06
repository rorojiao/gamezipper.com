/**
 * R341 — measure the production detector's `lookClickable` predicate for the
 * exact elements BI is flagging, plus their real response behaviour.
 *
 * gz-analytics.js lookClickable:
 *   role==='button' || t.onclick || (t.style && t.style.cursor==='pointer')
 *   || (t.className && /click|card|btn|tile|thumb|seg/i.test(t.className))
 */
const { execFileSync } = require('child_process');
const KB = '/home/junze/.nvm/versions/node/v22.22.0/bin/kachilu-browser';
const base = process.argv[2] || 'http://127.0.0.1:8899';
const slug = process.argv[3];
const preClicks = (process.argv[4] || '').split(',').filter(Boolean);

const PROBE = `
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [], rows: [] };
  window.addEventListener('error', e => out.errs.push(String(e.message)));
  for (const sel of ${JSON.stringify(preClicks)}) {
    const b = document.querySelector(sel);
    if (b) { b.click(); await sleep(600); }
  }
  const re = /click|card|btn|tile|thumb|seg/i;
  const els = [...document.querySelectorAll('${process.argv[5] || '.lc'}')];
  out.count = els.length;
  for (const t of els.slice(0, 6)) {
    out.rows.push({
      sel: t.tagName + '.' + (t.className||''),
      text: (t.innerText||'').trim().slice(0,20),
      role: t.getAttribute('role'),
      onclickProp: !!t.onclick,
      onclickAttr: t.getAttribute('onclick'),
      inlineCursor: t.style && t.style.cursor,
      classMatches: !!(t.className && re.test(t.className.toString())),
      computedCursor: getComputedStyle(t).cursor
    });
  }
  return out;
})()
`;
function kb(args, timeout) {
  try { return execFileSync(KB, args, { encoding:'utf8', timeout: timeout||240000, stdio:['ignore','pipe','pipe'] }); }
  catch (e) { return (e.stdout||'')+(e.stderr||''); }
}
function unwrap(raw) {
  let d = (raw||'').trim();
  for (let i=0;i<6;i++){ if (typeof d!=='string') return d; try { d=JSON.parse(d); } catch(e){ return null; } }
  return typeof d==='object'?d:null;
}
const session = 'r341-lc-'+Date.now().toString(36);
kb(['--session',session,'open', base+'/'+slug+'/?v='+Date.now()]);
kb(['--session',session,'wait','8000']);
const raw = kb(['--session',session,'eval','--base64',Buffer.from(PROBE).toString('base64')]);
kb(['--session',session,'close']);
const res = unwrap(raw);
if (!res || res.ERROR) { console.log('PROBE-FAIL '+String(raw).slice(0,300)); process.exit(1); }
console.log(JSON.stringify(res,null,2));
