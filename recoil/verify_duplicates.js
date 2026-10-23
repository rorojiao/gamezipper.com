// duplicate-level gate for recoil (Pitfall #73). NEGATIVE TEST MODE: if argv[3]==='--old-file',
// read the pre-fix catalog from git so we can prove this gate actually FAILS on broken data
// (Pitfall #62: a gate that cannot fail is not a gate).
const fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const SLUG = 'recoil';
const ARG_OLD = process.argv[2];            // NB: argv[2] is the FIRST user arg (argv[0]=node, argv[1]=script)
let html;
if (ARG_OLD === '--old-file') {
  const sha = process.argv[3];
  if (!sha) { console.error('FATAL: --old-file needs a git sha; refusing to silently fall through to the fixed file'); process.exit(3); }
  html = cp.execSync(`git show ${sha}:${SLUG}/index.html`, { cwd: '/home/junze/gamezipper.com', maxBuffer: 1 << 26 }).toString();
} else {
  html = fs.readFileSync(`/home/junze/gamezipper.com/${SLUG}/index.html`, 'utf8');
}
const m = html.match(/var LEVELS=\[/);
const start = html.indexOf('[', m.index);
let depth = 0, end = -1, inStr = null;
for (let i = start; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
  if (c === '"' || c === "'") { inStr = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const LEVELS = new Function('return ' + html.slice(start, end + 1).replace(/\/\/[^\n]*/g, ''))();
// denylist of cosmetic fields; tier is EXCLUDED on purpose (Pitfall #73: same board under two
// tier labels is still the same puzzle the player meets twice)
const COSM = new Set(['id', 'name', 'hint', 'par', 'tier']);
const idOf = L => crypto.createHash('md5').update(JSON.stringify(
  Object.keys(L).sort().filter(k => !COSM.has(k)).map(k => [k, L[k]]))).digest('hex').slice(0, 10);
const g = new Map();
LEVELS.forEach(L => { const h = idOf(L); if (!g.has(h)) g.set(h, []); g.get(h).push(L.id); });
const dups = [...g.entries()].filter(([, v]) => v.length > 1);
console.log(`${SLUG}: ${LEVELS.length} levels, ${g.size} distinct boards`);
if (dups.length) {
  console.log('FAIL duplicate-level groups: ' + JSON.stringify(dups));
  process.exit(1);
}
// negative control: a synthetic catalog WITH a duplicate must be rejected
const ctl = JSON.parse(JSON.stringify(LEVELS));
ctl.push({ ...ctl[0], id: 999, name: 'Control Clone', tier: 5 });
if (new Set(ctl.map(idOf)).size === ctl.length) {
  console.log('FAIL negative control: duplicate was NOT detected — gate is a no-op');
  process.exit(2);
}
console.log('duplicate-level gate: PASS (negative control correctly rejected a cloned level)');