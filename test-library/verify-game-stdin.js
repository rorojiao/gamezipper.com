#!/usr/bin/env node
/**
 * verify-game-stdin.js — 3-agent × 10-iter verification using kachilu eval --stdin
 *
 * 修复 R95 shell-escape bug: 原 test-library/verify-game.js 用 execSync 拼 inline
 * `eval '<script>'` + bash-style `'\''` escape, 但 node spawn 出来是 /bin/sh (dash)
 * 不是 bash, dash 解析 `'\''` + 嵌套 template literal 时 quote balance 错乱, 浏览器
 * 启动前就报 Syntax error, eval 从未真正执行. 现象: 全部 0/10 pass + playable=undefined.
 *
 * 修复: 用 spawnSync + kachilu `eval --stdin` 把脚本通过 stdin 传, 绕开 shell escape 层.
 *
 * Usage:
 *   node verify-game-stdin.js <slug> [<slug>...]
 *
 * 退出码 0 = 全 PASS, 非 0 = 至少 1 个 iter fail (查看 stdout issues).
 *
 * R95 验证: basketball-shoot / color-sort / word-puzzle / crossword / sudoku 各 30/30 PASS.
 * 修复前同样脚本跑这 5 个全 0/10 — bug 100% 复现.
 */
const { execFileSync, spawnSync } = require('child_process');

const KACHILU = '/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser';

const SCRIPT = `(function(){
  var r = {h1:'', hasCanvas:false, gzAd:false, gzFooter:false, monetag:false,
           hasGameJs:false, playable:false, zombieEndpoints:false, deadAnalytics:false};
  try { r.h1 = (document.querySelector('h1') || {}).textContent || ''; } catch(e){}
  try { r.hasCanvas = !!document.querySelector('canvas'); } catch(e){}
  try { r.gzAd = !!document.getElementById('gz-ad-below-game'); } catch(e){}
  try { r.gzFooter = !!document.getElementById('game-footer'); } catch(e){}
  try { r.monetag = document.querySelector('script[src*="monetag-manager"]') !== null; } catch(e){}
  try {
    var scripts = Array.from(document.scripts).map(s => s.src || '');
    r.hasGameJs = scripts.some(s => /game\\.js|bundle-.*\\.js/.test(s));
  } catch(e){}
  try {
    var bodyHtml = document.body.innerHTML;
    r.zombieEndpoints = /1ktower\\.com|alwingulla\\.com|rye\\.io/.test(bodyHtml);
    r.deadAnalytics = /site-analytics\\.gamezipper\\.com/.test(bodyHtml);
  } catch(e){}
  r.playable = (r.h1 && (r.hasCanvas || r.gzFooter)) ? true : (r.gzFooter ? 'maybe' : false);
  return JSON.stringify(r);
})()`;

async function runOneIter(slug, iter, agentId) {
  const session = `verify-${slug}-i${iter}-a${agentId}`;
  const url = `https://gamezipper.com/${slug}/`;
  try {
    execFileSync(KACHILU, ['--session', session, 'open', url], { timeout: 60000, stdio: 'pipe' });
    await new Promise(r => setTimeout(r, 12000));
    const result = spawnSync(KACHILU, ['--session', session, 'eval', '--stdin'],
      { input: SCRIPT, timeout: 30000, encoding: 'utf8' });
    if (result.status !== 0) return { error: (result.stderr || 'eval-failed').substring(0, 200), playable: false };
    let out = result.stdout.trim();
    // kachilu sometimes wraps JSON-stringified output in extra quotes
    if (out.startsWith('"') && out.endsWith('"')) {
      try { out = JSON.parse(out); } catch {}
    }
    return JSON.parse(out);
  } catch (e) {
    return { error: e.message, playable: false };
  }
}

async function verifyOneGame(slug) {
  const results = { pass: 0, fail: 0, issues: [] };
  console.log(`\n[Verifying] ${slug}`);
  for (let iter = 1; iter <= 10; iter++) {
    const iterResults = await Promise.all([
      runOneIter(slug, iter, 1),
      runOneIter(slug, iter, 2),
      runOneIter(slug, iter, 3),
    ]);
    const allPass = iterResults.every(r => r.playable === true && !r.zombieEndpoints && !r.deadAnalytics);
    if (allPass) {
      results.pass++;
      process.stdout.write('.');
    } else {
      results.fail++;
      process.stdout.write('F');
      iterResults.forEach((r, ai) => {
        if (r.error) results.issues.push(`iter${iter}/agent${ai+1}: error=${r.error.substring(0,80)}`);
        if (r.playable !== true) results.issues.push(`iter${iter}/agent${ai+1}: playable=${r.playable} (h1=${r.h1},canvas=${r.hasCanvas},gzFooter=${r.gzFooter})`);
        if (r.zombieEndpoints) results.issues.push(`iter${iter}/agent${ai+1}: zombie endpoint detected`);
        if (r.deadAnalytics) results.issues.push(`iter${iter}/agent${ai+1}: dead site-analytics img`);
      });
    }
  }
  try { execFileSync(KACHILU, ['close', '--all'], { timeout: 10000, stdio: 'pipe' }); } catch {}
  console.log(`\n[Result] ${slug}: ${results.pass}/10 pass, ${results.fail}/10 fail`);
  if (results.issues.length) {
    console.log('Issues:');
    results.issues.slice(0, 5).forEach(i => console.log('  - ' + i));
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.log('Usage: node verify-game-stdin.js <slug> [<slug>...]');
    process.exit(1);
  }
  const allResults = {};
  for (const slug of args) {
    allResults[slug] = await verifyOneGame(slug);
  }
  const total = Object.keys(allResults).length;
  const allPass = Object.values(allResults).filter(r => r.fail === 0).length;
  const hasFails = Object.values(allResults).filter(r => r.fail > 0).length;
  console.log(`\n=== Summary ===`);
  console.log(`Total: ${total} | All pass: ${allPass} | Has fails: ${hasFails}`);
  process.exit(hasFails > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
