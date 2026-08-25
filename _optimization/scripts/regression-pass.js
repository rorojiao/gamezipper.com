#!/usr/bin/env node
/* Full-regression pass R3: re-run EVERY <slug>/verify_engine.js and compare the
 * verdict against the archived evidence verdict. READ-ONLY toward evidence/ —
 * results go to _optimization/reports/regression-r3.json so the rich per-game
 * evidence (fails/notes/卡点) saved by the verification queues is never clobbered.
 * Convergence rule (TC-REG-04): a round with ZERO new failures = converged.
 * Usage: node regression-pass.js [--timeout 125] [--out regression-r3.json] [--only a,b] */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const EV = path.join(repo, '_optimization', 'evidence');
const REPORTS = path.join(repo, '_optimization', 'reports');

const args = process.argv.slice(2);
const argOf = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const TIMEOUT = parseInt(argOf('--timeout') || '125', 10) * 1000;
const OUT = argOf('--out') || 'regression-r3.json';
const WORKERS = parseInt(argOf('--workers') || '8', 10);
const ONLY = argOf('--only') ? argOf('--only').split(',') : null;

const slugs = (ONLY || fs.readdirSync(repo).filter(d => fs.existsSync(path.join(repo, d, 'verify_engine.js')))).sort();

function archivedVerdict(slug) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(EV, slug, 'verify.json'), 'utf8'));
    return j.verdict || (j.exitCode === 0 ? 'PASS' : 'FAIL') || null;
  } catch { return null; }
}
function lastJson(stdout) {
  const lines = stdout.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const s = lines[i].trim();
    if (s.startsWith('{')) { try { return JSON.parse(s); } catch {} }
  }
  return null;
}

function runOnce(slug, cwd) {
  return new Promise(res => {
    execFile('node', [path.join(repo, slug, 'verify_engine.js')], { cwd, timeout: TIMEOUT, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      res({ err, stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}
async function runSmart(slug) {
  // game-dir cwd first; some verifiers resolve 'slug/index.html' from repo root
  let r = await runOnce(slug, path.join(repo, slug));
  if (r.err && /ENOENT/i.test(r.stderr + r.stdout)) {
    const r2 = await runOnce(slug, repo);
    if (!r2.err) r = r2;
  }
  return r;
}

(async () => {
  const results = [];
  let idx = 0, done = 0;
  const t0 = Date.now();
  async function worker() {
    while (idx < slugs.length) {
      const slug = slugs[idx++];
      const was = archivedVerdict(slug);
      const r = await runSmart(slug);
      const exitCode = r.err ? (r.err.code ?? (r.err.killed ? 'timeout' : 1)) : 0;
      const j = lastJson(r.stdout);
      const nowVerdict = exitCode === 0 ? 'PASS' : (exitCode === 'timeout' ? 'TIMEOUT' : (j && j.verdict) || 'FAIL');
      const rec = { slug, was, now: nowVerdict, exitCode, durS: +(((Date.now()) - t0) / 1000).toFixed(0), pass: j ? (j.pass ?? j.passed ?? null) : null, total: j ? (j.total ?? null) : null };
      if (nowVerdict !== 'PASS') rec.tail = (r.stdout + r.stderr).slice(-400);
      results.push(rec);
      done++;
      const flip = was && was !== nowVerdict ? ' <-- FLIP (was ' + was + ')' : '';
      if (nowVerdict !== 'PASS' || flip) console.log('[' + done + '/' + slugs.length + '] ' + slug + ' ' + nowVerdict + (rec.pass != null ? ' ' + rec.pass + '/' + rec.total : '') + flip);
      else if (done % 25 === 0) console.log('[' + done + '/' + slugs.length + '] ... ok');
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  const fails = results.filter(r => r.now !== 'PASS');
  const flips = results.filter(r => r.was && r.was !== r.now);
  const noEvidence = results.filter(r => !r.was);
  const out = { updated: new Date().toISOString(), total: results.length,
    passCount: results.length - fails.length, failCount: fails.length,
    newFailures: flips.filter(f => f.now !== 'PASS').map(f => f.slug),
    recovered: flips.filter(f => f.now === 'PASS').map(f => f.slug),
    noEvidenceBefore: noEvidence.map(f => f.slug),
    fails: fails.map(f => ({ slug: f.slug, was: f.was, now: f.now, tail: f.tail })), results };
  fs.writeFileSync(path.join(REPORTS, OUT), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ total: out.total, pass: out.passCount, fail: out.failCount, newFailures: out.newFailures, recovered: out.recovered }));
})();
