#!/usr/bin/env node
/* Rebuild _optimization/reports/solvability-results.json from per-slug evidence files.
 * Source of truth: _optimization/evidence/<slug>/verify.json  (written by save-verify.js)
 * plus <slug>/verify_engine.js presence. Immune to concurrent write races on the store:
 * run this AFTER all agents finish; per-slug 'detail'/'evidence' fields are preserved from
 * any fragment files agents left in _optimization/state/store-frag/<slug>.json, else from
 * the existing store entry, else synthesized. */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const EV = path.join(repo, '_optimization', 'evidence');
const STORE = path.join(repo, '_optimization', 'reports', 'solvability-results.json');
const FRAG = path.join(repo, '_optimization', 'state', 'store-frag');

const prev = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')).results || {} : {};
const slugs = fs.readdirSync(repo).filter(d => {
  const p = path.join(repo, d, 'verify_engine.js');
  return fs.existsSync(p) && fs.statSync(p).isFile();
});
const out = {};
let pass = 0, fail = 0, broken = [];
for (const s of slugs) {
  const vj = path.join(EV, s, 'verify.json');
  let entry = null;
  try { entry = JSON.parse(fs.readFileSync(vj, 'utf8')); } catch (e) { broken.push(s); }
  if (!entry) continue;
  const isPass = entry.verdict === 'PASS' ||
    (entry.passed !== undefined && entry.failed === 0 && entry.passed === entry.total) || // tap-away style {passed,failed,total}
    (entry.pass !== undefined && entry.fail === 0);
  const verdict = isPass ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') pass++; else fail++;
  // preserve rich fields from fragment (agents write these) or previous store entry
  const frag = (() => { try { return JSON.parse(fs.readFileSync(path.join(FRAG, s + '.json'), 'utf8')); } catch (e) { return null; } })();
  const rich = frag || prev[s] || {};
  out[s] = { slug: s, verifierRun: true, exitCode: entry.verdict === 'PASS' ? 0 : 1,
    passed: entry.pass ?? entry.passed ?? null, total: entry.total ?? null, verdict, durS: rich.durS ?? entry.durS ?? null,
    ...(rich.detail ? { detail: rich.detail } : {}), ...(rich.evidence ? { evidence: rich.evidence } : {}),
    ...(verdict === 'FAIL' && entry.fails ? { fails: entry.fails } : {}) };
}
fs.writeFileSync(STORE, JSON.stringify({ updated: new Date().toISOString(), results: out }, null, 1));
console.log(JSON.stringify({ rebuilt: Object.keys(out).length, pass, fail, missingEvidence: broken.length, missing: broken.slice(0, 20) }));
