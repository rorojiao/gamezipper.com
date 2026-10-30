#!/usr/bin/env node
/* Behavioral test for magic-sort _ensureChunk, running the REAL source that
 * ships in magic-sort/index.html (not a hand-copied paraphrase).
 *
 * Method: extract the `_ensureChunk` function body from the shipped HTML with a
 * balanced-bracket scan, then eval it in a vm sandbox where `fetch` is stubbed.
 * The stub can fail (transient 403 / network error) and then recover.
 *
 * Assertions:
 *   A. A failed chunk MUST be retryable in the same session (the shipped code
 *      before the fix cached the rejected promise forever).
 *   B. The retry MUST bypass the HTTP cache (no-store) so a cached 403 is not
 *      replayed.
 *   C. Negative control: a permanently broken chunk must still reject — the fix
 *      must not turn every failure into a silent success.
 *   D. The first (non-retry) attempt must still use the fast force-cache path.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, 'index.html');
const html = fs.readFileSync(HTML, 'utf8');

function extractBalanced(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
  }
  throw new Error('unbalanced braces');
}

const fnIdx = html.indexOf('async function _ensureChunk(chunkIdx)');
if (fnIdx < 0) { console.error('FAIL: _ensureChunk not found'); process.exit(1); }
const fnSrc = extractBalanced(html, fnIdx);

const grab = (re) => (html.match(re) || [null])[0];
const stateDecls = [
  grab(/const _CHUNK_LOADED\s*=\s*\{\};/) || 'const _CHUNK_LOADED = {};',
  grab(/const _CHUNK_PROMISES\s*=\s*\{\};/) || 'const _CHUNK_PROMISES = {};',
  grab(/const _CHUNK_RETRY\s*=\s*\{\};/) || 'const _CHUNK_RETRY = {};',
];
const metaSrc = grab(/const _CHUNKS_META\s*=\s*\[[\s\S]*?\n\];/);
if (!metaSrc) { console.error('FAIL: _CHUNKS_META not found'); process.exit(1); }

const HAS_EVICTION = /delete\s+_CHUNK_PROMISES\[chunkIdx\]/.test(html);
const HAS_RETRY_FLAG = /_CHUNK_RETRY\[/.test(html);

console.log('=== magic-sort chunk-retry behavioral test (runs the SHIPPED source) ===');
console.log('  rejected-promise eviction present :', HAS_EVICTION);
console.log('  cache-bypass retry flag present   :', HAS_RETRY_FLAG);
console.log('');

function makeSandbox(fetchImpl) {
  const sandbox = {
    window: {},
    navigator: { connection: { saveData: false } },
    console, setTimeout,
    fetch: fetchImpl,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext([
    'var _LD = new Array(10);',
    stateDecls.join('\n'),
    metaSrc,
    'function _prefetchAdjacentChunk(){}',
    fnSrc,
    'globalThis.__ensure = _ensureChunk;',
  ].join('\n'), sandbox, { timeout: 5000 });
  return sandbox;
}

// A fetch stub whose behaviour is driven by a list of per-call outcomes.
function stubFetch(outcomes) {
  const calls = [];
  const f = async function (url, opts) {
    calls.push({ url, opts });
    const o = outcomes[Math.min(calls.length - 1, outcomes.length - 1)];
    if (o === 'fail') { const e = new Error('network down'); e.ok = false; e.status = 403; throw e; }
    if (o === 'notok') { const e = new Error('http error'); e.ok = false; e.status = 500; throw e; }
    return { ok: true, status: 200, json: async () => ({ levels: [[2, 1, 2, 0, 0]] }) };
  };
  f.calls = calls;
  return f;
}

async function attempt(sb) {
  try { return await sb.__ensure(0); } catch (e) { return 'ERROR'; }
}

(async () => {
  let allOk = true;
  const results = [];

  // --- A: transient failure then recovery ---
  {
    const f = stubFetch(['fail', 'ok']);
    const sb = makeSandbox(f);
    const r1 = await attempt(sb);
    const r2 = await attempt(sb);
    const ok = (r1 === 'ERROR' && r2 === true && f.calls.length === 2);
    results.push([ok, 'A: transient 403 -> retry succeeds (fetch called twice)', r1, r2, f.calls.length]);
    allOk &= ok;
  }

  // --- B: the retry must bypass the HTTP cache ---
  {
    const f = stubFetch(['fail', 'ok']);
    const sb = makeSandbox(f);
    await attempt(sb);
    await attempt(sb);
    const second = f.calls[1] && f.calls[1].opts;
    const first = f.calls[0] && f.calls[0].opts;
    const ok = !!(second && second.cache === 'no-store') && !!(first && first.cache === 'force-cache');
    results.push([ok, 'B: first attempt force-cache, retry no-store (no cached-error replay)',
      first && first.cache, second && second.cache, f.calls.length]);
    allOk &= ok;
  }

  // --- C: negative control — permanently broken chunk still rejects ---
  {
    const f = stubFetch(['fail']);
    const sb = makeSandbox(f);
    const r1 = await attempt(sb);
    const r2 = await attempt(sb);
    const ok = (r1 === 'ERROR' && r2 === 'ERROR');
    results.push([ok, 'C: negative control — permanent failure still rejects (no fake success)', r1, r2, f.calls.length]);
    allOk &= ok;
  }

  // --- D: a healthy chunk resolves on the first attempt (no regression) ---
  {
    const f = stubFetch(['ok']);
    const sb = makeSandbox(f);
    const r1 = await attempt(sb);
    const r2 = await attempt(sb);
    const ok = (r1 === true && r2 === true && f.calls.length === 1);
    results.push([ok, 'D: healthy chunk resolves immediately and is cached (no extra fetch)', r1, r2, f.calls.length]);
    allOk &= ok;
  }

  console.log('  RESULT  DESCRIPTION');
  for (const [ok, desc, a, b, c] of results) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}   ${desc}`);
    console.log(`          attempt1=${a} attempt2=${b} fetchCalls=${c}`);
  }
  console.log('');
  if (allOk) {
    console.log('VERDICT: PASS — chunk failures are retryable, the retry bypasses the cache, failures still fail.');
    process.exit(0);
  }
  console.log('VERDICT: FAIL');
  process.exit(1);
})();
