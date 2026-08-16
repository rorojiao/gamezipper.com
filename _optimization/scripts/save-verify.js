#!/usr/bin/env node
/* Re-run a game's verify_engine.js and archive evidence:
 *   evidence/<slug>/verify.json       (parsed result, convention shape)
 *   evidence/<slug>/verify.log        (full stdout/stderr)
 *   evidence/<slug>/verify-after.log  (alias of verify.log)
 * Existing verify.json is preserved as verify-before.json (first time only).
 * Usage: node save-verify.js <slug> */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node save-verify.js <slug>'); process.exit(2); }
const evDir = path.join(repo, '_optimization', 'evidence', slug);
fs.mkdirSync(evDir, { recursive: true });
const prevJson = path.join(evDir, 'verify.json');
if (fs.existsSync(prevJson) && !fs.existsSync(path.join(evDir, 'verify-before.json'))) {
  fs.copyFileSync(prevJson, path.join(evDir, 'verify-before.json'));
  const prevLog = path.join(evDir, 'verify.log');
  if (fs.existsSync(prevLog)) fs.copyFileSync(prevLog, path.join(evDir, 'verify-before.log'));
}
let out = '';
try {
  out = execFileSync('node', [path.join(repo, slug, 'verify_engine.js')], { cwd: repo, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  out = (e.stdout || '') + '\n[exit ' + (e.status ?? 'signal') + ']\n' + (e.stderr || '');
}
fs.writeFileSync(path.join(evDir, 'verify.log'), out);
fs.writeFileSync(path.join(evDir, 'verify-after.log'), out);
// extract last JSON object in stdout (line-anchored or inline)
let j = null;
const tryParse = s => { try { const c = JSON.parse(s); return c && (c.verdict || c.pass !== undefined) ? c : null; } catch (e) { return null; } };
const lines = out.split('\n');
outer: for (let i = 0; i < lines.length; i++) {
  for (let k = lines.length - 1; k > i; k--) {
    const c = tryParse(lines.slice(i, k + 1).join('\n'));
    if (c) { j = c; break outer; }
  }
  const inline = lines[i].match(/\{[^{}]*"pass"[^{}]*\}/);
  if (inline) { const c = tryParse(inline[0]); if (c) j = c; }
  if (j) break;
}
if (j) fs.writeFileSync(prevJson, JSON.stringify(j, null, 1));
console.log(`[${slug}] exit-evidence: ${j ? j.verdict : 'PARSE-FAIL'} pass=${j && j.pass} total=${j && j.total}`);
process.exit(0);
