#!/usr/bin/env node
/* Merge one archived verify run into _optimization/reports/solvability-results.json.
 * Reads evidence/<slug>/verify.json + verify.log (written by save-verify.js), re-reads the
 * WHOLE results file before merging (per verifier-spec run contract).
 * Usage: node merge-wave-result.js <slug> [durS] [detail] */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node merge-wave-result.js <slug> [durS] [detail]'); process.exit(2); }
const durS = process.argv[3] ? parseFloat(process.argv[3]) : null;
const detail = process.argv[4] || undefined;
const RESULTS = path.join(repo, '_optimization', 'reports', 'solvability-results.json');
const evDir = path.join(repo, '_optimization', 'evidence', slug);
const vj = JSON.parse(fs.readFileSync(path.join(evDir, 'verify.json'), 'utf8'));
const log = fs.existsSync(path.join(evDir, 'verify.log')) ? fs.readFileSync(path.join(evDir, 'verify.log'), 'utf8') : '';
const store = JSON.parse(fs.readFileSync(RESULTS, 'utf8')); // re-read whole file before merge
const results = store.results || (store.results = {});
const rec = {
  slug,
  verifierRun: true,
  exitCode: vj.verdict === 'PASS' ? 0 : 1,
  passed: vj.pass !== undefined ? vj.pass : vj.passed,
  total: vj.total !== undefined ? vj.total : null,
  verdict: vj.verdict || 'FAIL',
  durS: durS !== null ? durS : undefined,
  detail,
  stdoutTail: log.slice(-1500),
  stderrTail: '',
  ts: new Date().toISOString(),
};
if (vj.fails && vj.fails.length) rec.fails = vj.fails.slice(0, 20);
results[slug] = rec;
store.updated = new Date().toISOString();
fs.writeFileSync(RESULTS, JSON.stringify(store, null, 1));
console.log(`[merge] ${slug}: ${rec.verdict} ${rec.passed}/${rec.total}`);
