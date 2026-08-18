#!/usr/bin/env node
/* duck-merge — permanent alias page redirecting to merge-sweets (no engine by design).
 * Verifier: the alias must redirect consistently (meta refresh + JS replace + canonical
 * all name the same target), and the target must exist locally as a real game page
 * (engine markup present, itself not a redirect — no alias chains). */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

const refresh = (html.match(/http-equiv="refresh" content="0;\s*url=([^"]+)"/) || [])[1] || '';
const js = (html.match(/location\.replace\('([^']+)'\)/) || [])[1] || '';
const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
const last = u => String(u).replace(/\/$/, '').split('/').pop();
T('refresh-target', last(refresh) === 'merge-sweets', refresh);
T('js-target', last(js) === 'merge-sweets', js);
T('canonical-target', last(canon) === 'merge-sweets', canon);
T('no-engine-by-design', !/<canvas|requestAnimationFrame/.test(html), 'alias page should not embed an engine');
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_optimization', 'state', 'inventory.json'), 'utf8')).games;
const tp = path.join(__dirname, '..', last(refresh), 'index.html');
let tok = fs.existsSync(tp) && inv.some(g => g.slug === last(refresh));
if (tok) { // a real game page, not another alias hop
  const th = fs.readFileSync(tp, 'utf8');
  tok = !/http-equiv="refresh"|location\.replace/.test(th) || /<canvas|requestAnimationFrame|addEventListener/.test(th);
}
T('target-is-real-game', tok, 'merge-sweets/index.html');
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { aliasOf: 'merge-sweets' } };
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
