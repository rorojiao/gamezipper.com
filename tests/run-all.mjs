#!/usr/bin/env node
// tests/run-all.mjs — master runner. Usage: node tests/run-all.mjs [--suites=A,B,C,D]
// Exit 0 when every suite passes, 1 otherwise. Report: tests/results/run-<ts>.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/common.mjs';

const arg = process.argv.find(a => a.startsWith('--suites='));
const wanted = arg ? arg.split('=')[1].toUpperCase().split(',') : ['A', 'B', 'C', 'D'];

const SUITES = {
  A: () => import('./lib/suite-a-static.mjs').then(m => m.default()),
  B: () => import('./lib/suite-b-consistency.mjs').then(m => m.default()),
  C: () => import('./lib/suite-c-verifiers.mjs').then(m => m.default()),
  D: () => import('./lib/suite-d-e2e.mjs').then(m => m.default()),
};

const results = [];
for (const key of wanted) {
  if (!SUITES[key]) { console.error(`unknown suite ${key}`); process.exit(2); }
  const t0 = Date.now();
  process.stderr.write(`[run-all] suite ${key} started\n`);
  const r = await SUITES[key]();
  r.durationMs = Date.now() - t0;
  results.push(r);
  process.stderr.write(`[run-all] suite ${key} done: pass=${r.pass} fail=${r.fail} (${r.durationMs}ms)\n`);
}

let pass = 0, fail = 0;
const summary = [];
for (const r of results) {
  pass += r.pass; fail += r.fail;
  summary.push({ name: r.name, pass: r.pass, fail: r.fail, durationMs: r.durationMs, info: r.info });
  console.log(`\n== ${r.name}: pass=${r.pass} fail=${r.fail} (${(r.durationMs / 1000).toFixed(1)}s)`);
  for (const f of r.failures().slice(0, 40)) console.log(`  FAIL ${f.id} ${f.target} :: ${f.detail}`);
  if (r.fail > 40) console.log(`  ... and ${r.fail - 40} more failures (see JSON report)`);
}
console.log(`\nTOTAL pass=${pass} fail=${fail}`);

const dir = path.join(ROOT, 'tests', 'results');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(file, JSON.stringify({ ts: new Date().toISOString(), pass, fail, summary, suites: results }, null, 2));
fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify({ ts: new Date().toISOString(), pass, fail, summary, suites: results }, null, 2));
console.log(`report: ${path.relative(ROOT, file)}`);
process.exit(fail === 0 ? 0 : 1);
