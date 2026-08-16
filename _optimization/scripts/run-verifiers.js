#!/usr/bin/env node
/* Phase 2a: run every existing <slug>/verify_engine.js, capture per-level results as evidence.
 * Usage: node run-verifiers.js [--only a,b] [--timeout 90]
 * Output: _optimization/evidence/<slug>/verify.json + reports/solvability-results.json */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const RESULTS = path.join(repo, '_optimization', 'reports', 'solvability-results.json');

const args = process.argv.slice(2);
const argOf = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = argOf('--only') ? argOf('--only').split(',') : null;
const FORCE = args.includes('--force');
const TIMEOUT = parseInt(argOf('--timeout') || '90', 10) * 1000;

const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), 'utf8')).games;
const invSet = new Set(inventory.map(g => g.slug));
let slugs = fs.readdirSync(repo).filter(d => {
  const p = path.join(repo, d, 'verify_engine.js');
  return fs.existsSync(p) && !fs.statSync(p).isDirectory();
}); // filesystem discovery (inventory hasVerifier is stale for newly written verifiers)
if (ONLY) slugs = slugs.filter(s => ONLY.includes(s));

let store = {};
if (fs.existsSync(RESULTS)) { try { store = JSON.parse(fs.readFileSync(RESULTS, 'utf8')).results || {}; } catch (e) {} }
const queue = slugs.filter(s => FORCE || !store[s] || !store[s].verifierRun);
console.log(`[verify] to run: ${queue.length} (have results: ${slugs.length - queue.length})`);

let idx = 0, done = 0;
function persist() { fs.writeFileSync(RESULTS, JSON.stringify({ updated: new Date().toISOString(), results: store }, null, 1)); }

function runOnce(slug, cwd) {
  return new Promise(res => {
    execFile('node', [path.join(repo, slug, 'verify_engine.js')], { cwd, timeout: TIMEOUT, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      res({ err, stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}
async function runOne(slug) {
  const t0 = Date.now();
  // some verifiers assume game-dir cwd, others repo-root (relative 'slug/index.html')
  let r = await runOnce(slug, path.join(repo, slug));
  if (r.err && r.err.code === 1 && /no such file or directory/i.test(r.stderr + r.stdout)) {
    const r2 = await runOnce(slug, repo);
    if (!r2.err) r = { ...r2, cwdFallback: 'repo-root' };
  }
  const err = r.err, out = r.stdout, serr = r.stderr;
  const exitCode = err ? (err.code ?? (err.killed ? 'timeout' : 1)) : 0;
  const m = out.match(/(?:PASS:\s*(\d+)\/(\d+))|(?:"pass":\s*(\d+)[\s\S]*?"fail":\s*(\d+)[\s\S]*?"total":\s*(\d+))/);
  let passed = null, total = null;
  if (m) { passed = parseInt(m[1] ?? m[3], 10); total = parseInt(m[2] ?? m[5], 10); }
  const rec = {
    slug, verifierRun: true, exitCode, passed, total,
    verdict: exitCode === 0 ? 'PASS' : (exitCode === 'timeout' ? 'TIMEOUT' : 'FAIL'),
    cwdFallback: r.cwdFallback || undefined,
    durS: +((Date.now() - t0) / 1000).toFixed(1),
    stdoutTail: out.slice(-1500), stderrTail: serr.slice(-800),
    ts: new Date().toISOString(),
  };
  store[slug] = rec;
  const evDir = path.join(repo, '_optimization', 'evidence', slug);
  fs.mkdirSync(evDir, { recursive: true });
  fs.writeFileSync(path.join(evDir, 'verify.json'), JSON.stringify(rec, null, 1));
  fs.writeFileSync(path.join(evDir, 'verify.log'), `exit=${exitCode}\n--- stdout tail ---\n${out.slice(-4000)}\n--- stderr tail ---\n${serr.slice(-2000)}\n`);
  return rec;
}

async function worker() {
  while (idx < queue.length) {
    const slug = queue[idx++];
    const r = await runOne(slug);
    done++;
    console.log(`[${done}/${queue.length}] ${slug} ${r.verdict} ${r.passed != null ? `(${r.passed}/${r.total})` : ''} ${r.durS}s`);
    if (done % 10 === 0) persist();
  }
}
(async () => {
  await Promise.all(Array.from({ length: 8 }, worker));
  persist();
  const v = {};
  Object.entries(store).filter(([, r]) => r.verifierRun).forEach(([, r]) => v[r.verdict] = (v[r.verdict] || 0) + 1);
  console.log('[verify] DONE', JSON.stringify(v));
})();
