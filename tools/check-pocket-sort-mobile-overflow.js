#!/usr/bin/env node
/* pocket-sort R332 P1 regression gate — horizontal scroll on mobile.
 *
 * DEFECT (measured live at 390x844, 2026-10-23):
 *   AdSense injected IFRAME#aswift_2 (1265px wide) as a DIRECT CHILD of <body>,
 *   bypassing every wrapper (each computed max-width:none). body{overflow-x:hidden}
 *   did NOT contain it: the root scroll container is <html>, which had no
 *   overflow-x rule. Result: documentElement.scrollWidth = 1265,
 *   window.scrollTo(600,0) succeeded (scrollX=600), and the game canvas went from
 *   left=16px to left=-584px — the user could scroll the playable board off-screen.
 *
 * WHY A STATIC GATE IS VALID HERE (Pitfall #78 — CSS-only fixes fail live):
 *   the fix is `html,body{overflow-x:hidden}`, i.e. the ROOT scroller is clipped.
 *   That is exactly the property the gate asserts, and it is the property the
 *   browser uses. Live-verified before and after (see state file).
 *
 * A gate that cannot fail is not a gate — this one is proven bidirectionally:
 *   node tools/check-pocket-sort-mobile-overflow.js          -> exit 0
 *   node tools/check-pocket-sort-mobile-overflow.js <prefix>  -> exit 1
 * i.e. point it at the pre-fix file and it MUST fail.
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'pocket-sort', 'index.html');

const html = fs.readFileSync(target, 'utf8');

/* strip comments so a commented-out rule cannot satisfy the gate */
const clean = html
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const failures = [];

/* 1. the ROOT element must clip horizontally. This is the load-bearing bit:
 *    <html> is the viewport propagation source and the root scroll container. */
const htmlRule = /(^|[};])\s*html\s*(,[^{]*)?\{([^}]*)\}/.exec(clean);
if (!htmlRule) {
  failures.push('no rule targets the <html> element at all');
} else if (!/overflow-x\s*:\s*hidden/.test(htmlRule[3])) {
  failures.push('<html> rule exists but does not set overflow-x:hidden — the root '
    + 'scroll container stays scrollable when an ad injects a wide iframe as a '
    + 'direct child of <body>');
}

/* 2. body must also clip (the pre-fix file had this; keep it) */
const bodyRule = /(^|[};])\s*(?:html\s*,\s*)?body\s*\{([^}]*)\}/.exec(clean);
if (!bodyRule || !/overflow-x\s*:\s*hidden/.test(bodyRule[2])) {
  failures.push('<body> does not set overflow-x:hidden');
}

/* 3. guard against the regression returning via an explicit `overflow-x:visible`
 *    or `overflow:auto` on html/body (would silently undo the clip) */
const badOverflow = /(html|body)[^{]*\{[^}]*overflow-x\s*:\s*(visible|auto|scroll)/.exec(clean);
if (badOverflow) {
  failures.push('found overflow-x:' + badOverflow[1] + ' on ' + badOverflow[0].slice(0, 40)
    + ' — this re-opens the horizontal scroll');
}

console.log('pocket-sort mobile-overflow gate: ' + target.replace(/^.*gamezipper\.com\//, ''));
if (failures.length) {
  console.log('  FAIL');
  failures.forEach(f => console.log('   - ' + f));
  process.exit(1);
}
console.log('  PASS — html+body both clip overflow-x, no re-opening rule');
process.exit(0);