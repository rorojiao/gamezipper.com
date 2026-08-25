// tests/lib/suite-c-verifiers.mjs — run every per-game verifier script (cases.md Suite C).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { ROOT, SuiteResult } from './common.mjs';

const KINDS = ['verify_engine.js', 'verify_independent.js', 'verify_levels.js', 'verify_model.js', 'verify_unique.js', 'verify_iife.js', 'playtest.js', 'qa_checklist.js', 'qa_check.js', 'test_jsdom.js', 'test_after_fix.js', 'test_playability.js'];
const IDS = Object.fromEntries(KINDS.map(k => [k, 'C' + (KINDS.indexOf(k) + 1)]));
const TIMEOUT_MS = 300_000;

function findVerifiers() {
  const out = [];
  for (const d of fs.readdirSync(ROOT)) {
    if (d.startsWith('.') || d === 'node_modules') continue;
    const dir = path.join(ROOT, d);
    try { if (!fs.statSync(dir).isDirectory()) continue; } catch { continue; }
    for (const k of KINDS) {
      const f = path.join(dir, k);
      if (fs.existsSync(f)) out.push({ slug: d, kind: k, file: f });
    }
  }
  return out;
}

function runOne(v) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [v.file], { cwd: ROOT, env: { ...process.env, CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '', killed = false;
    const timer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, TIMEOUT_MS);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', e => { clearTimeout(timer); resolve({ code: 1, detail: 'spawn error: ' + e.message }); });
    child.on('close', code => {
      clearTimeout(timer);
      const tail = (err || out).trim().split('\n').filter(Boolean).slice(-2).join(' | ');
      resolve({ code: killed ? 124 : (code ?? 1), detail: killed ? `timeout ${TIMEOUT_MS / 1000}s. ${tail}` : tail });
    });
  });
}

export default async function suiteC() {
  const R = new SuiteResult('C:verifiers');
  const all = findVerifiers();
  const conc = Math.min(8, Math.max(2, os.cpus().length));
  let i = 0;
  async function worker() {
    while (i < all.length) {
      const v = all[i++];
      const r = await runOne(v);
      R.record(IDS[v.kind], `${v.slug}/${v.kind}`, r.code === 0, r.code === 0 ? '' : `exit=${r.code} ${r.detail}`);
    }
  }
  await Promise.all(Array.from({ length: conc }, worker));
  R.note(`executed ${all.length} verifier scripts with concurrency ${conc}`);
  return R;
}
