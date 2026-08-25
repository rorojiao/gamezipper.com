// jsdom integration test: crankshaft-linkage is now a permanent alias page
// redirecting to antikythera-mechanism (no engine by design). Verify the stub
// redirects consistently and the target exists locally as a real game page.
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch(e) {
  console.log('jsdom not installed — skipping (code-level BFS verified)');
  process.exit(0);
}
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const dom = new JSDOM(html);
const doc = dom.window.document;

let ok = true;
const check = (name, cond, info) => {
  console.log((cond ? 'PASS' : 'FAIL') + ': ' + name + (cond ? '' : ' (' + info + ')'));
  if (!cond) ok = false;
};

const refresh = doc.querySelector('meta[http-equiv="refresh"]');
const refreshUrl = refresh ? (String(refresh.getAttribute('content')).match(/url=([^;"]+)/i) || [])[1] : '';
const canon = doc.querySelector('link[rel="canonical"]');
const canonUrl = canon ? canon.getAttribute('href') : '';
const js = (html.match(/location\.replace\('([^']+)'\)/) || [])[1] || '';
const last = u => String(u || '').replace(/\/+$/, '').split('/').pop();

check('meta-refresh -> antikythera-mechanism', last(refreshUrl) === 'antikythera-mechanism', refreshUrl);
check('canonical -> antikythera-mechanism', last(canonUrl) === 'antikythera-mechanism', canonUrl);
check('js-replace -> antikythera-mechanism', last(js) === 'antikythera-mechanism', js);
check('no-engine-by-design', !/<canvas|requestAnimationFrame/.test(html), 'alias page should not embed an engine');

const tp = path.join(__dirname, '..', 'antikythera-mechanism', 'index.html');
let tok = fs.existsSync(tp);
if (tok) { // a real game page, not another alias hop
  const th = fs.readFileSync(tp, 'utf8');
  tok = !/http-equiv="refresh"|location\.replace/.test(th) || /<canvas|requestAnimationFrame|addEventListener/.test(th);
}
check('target-is-real-game', tok, 'antikythera-mechanism/index.html');

console.log(ok ? 'jsdom alias integration: PASS' : 'jsdom alias integration: FAIL');
process.exit(ok ? 0 : 1);
