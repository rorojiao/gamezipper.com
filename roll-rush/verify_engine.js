#!/usr/bin/env node
/* roll-rush — permanent alias page redirecting to going-balls (no engine by design).
 * Verifier: the alias must redirect consistently (meta refresh + JS replace + canonical
 * all name the same target), and the target must exist locally as a real game page
 * (engine markup present, itself not a redirect — no alias chains). */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let pass = 0, fail = 0; const fails = [];
const T = (n, ok, info) => { if (ok) pass++; else { fail++; fails.push(n + ': ' + info); } };

const refresh = (html.match(/http-equiv="refresh" content="0;url=([^"]+)"/) || [])[1] || '';
const js = (html.match(/location\.replace\('([^']+)'\)/) || [])[1] || '';
const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
const last = u => String(u).replace(/\/$/, '').split('/').pop();
T('refresh-target', last(refresh) === 'going-balls', refresh);
T('js-target', last(js) === 'going-balls', js);
T('canonical-target', last(canon) === 'going-balls', canon);
T('no-engine-by-design', !/<canvas|requestAnimationFrame/.test(html), 'alias page should not embed an engine');
const tp = path.join(__dirname, '..', 'going-balls', 'index.html');
let tok = fs.existsSync(tp);
if (tok) {
  const th = fs.readFileSync(tp, 'utf8');
  tok = /<canvas|requestAnimationFrame/.test(th) && !/http-equiv="refresh"|location\.replace/.test(th);
}
T('target-is-real-game', tok, 'going-balls/index.html');
const out = { pass, fail, total: pass + fail, verdict: fail === 0 ? 'PASS' : 'FAIL', fails, extra: { aliasOf: 'going-balls' } };
console.log(JSON.stringify(out));
process.exit(fail === 0 ? 0 : 1);
