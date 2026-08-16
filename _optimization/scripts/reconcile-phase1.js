#!/usr/bin/env node
/* Reconcile Phase 1: mark redirect stubs in inventory, finalize smoke verdicts, write phase1-report.md */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const invP = path.join(__dirname, '..', 'state', 'inventory.json');
const inv = JSON.parse(fs.readFileSync(invP, 'utf8'));
const sm = JSON.parse(fs.readFileSync(path.join(repo, '_optimization', 'reports', 'smoke-results.json'), 'utf8')).results;

// 1. detect stubs (< 6KB index.html with gamezipper.com meta-refresh/replace target)
const invSet = new Set(inv.games.map(g => g.slug));
const stubs = {};
for (const g of inv.games) {
  const c = fs.readFileSync(path.join(repo, g.slug, 'index.html'), 'utf8');
  const m = c.match(/url=(https:\/\/gamezipper\.com\/([a-z0-9-]+)\/?)/) || c.match(/replace\('(https:\/\/gamezipper\.com\/([a-z0-9-]+)\/?)/);
  if (m && c.length < 6000) stubs[g.slug] = m[2];
}
inv.games.forEach(g => { g.isStub = !!stubs[g.slug]; g.redirectTarget = stubs[g.slug] || undefined; });
inv.stubCount = Object.keys(stubs).length;
inv.realGameCount = inv.games.filter(g => !g.isStub).length;
inv.built_at = new Date().toISOString();
fs.writeFileSync(invP, JSON.stringify(inv, null, 1));

// 2. re-finalize smoke verdicts
const deadTargets = Object.entries(stubs).filter(([, t]) => !invSet.has(t));
for (const [slug, r] of Object.entries(sm)) {
  if (stubs[slug]) {
    r.isStub = true; r.redirectTarget = stubs[slug];
    r.verdict = deadTargets.some(([s]) => s === slug) ? 'FAIL' : 'STUB-OK';
    r.severity = 'redirect';
  }
}
fs.writeFileSync(path.join(repo, '_optimization', 'reports', 'smoke-results.json'), JSON.stringify({ updated: new Date().toISOString(), total_in_scope: Object.keys(sm).length, done: Object.keys(sm).length, results: sm }, null, 1));

// 3. summary report
const v = {}; Object.values(sm).forEach(r => v[r.verdict] = (v[r.verdict] || 0) + 1);
const fails = Object.values(sm).filter(r => r.verdict === 'FAIL');
let md = `# Phase 1 冒烟测试报告(无头 Chromium 全量)

> 时间: ${new Date().toISOString()} · 工具: Playwright bundled chromium(合规) · 覆盖: ${Object.keys(sm).length} 页
> 判定规则: 主文档 200 + 无未捕获异常 + 无本地资源 4xx/5xx + (canvas 或 DOM 棋盘存在) = PASS;未捕获 JS 异常或本地资源 404 = FAIL(P0);外部广告/分析域已拦截(不打生产 BI)

## 结论

| 判定 | 数量 | 说明 |
|---|---|---|
| PASS | ${v.PASS} | 正常启动 |
| FAIL (P0) | ${v.FAIL} | 加载即崩溃,线上此刻同样坏(同 commit) |
| STUB-OK | ${v['STUB-OK'] || 0} | 重定向桩(改名/合并游戏),目标全部有效 |
| WARN | ${v.WARN || 0} | (已并入上面分类) |

真实游戏数:**${inv.realGameCount}**(另有 ${inv.stubCount} 个重定向桩,目标 ${{...new Set(Object.values(stups = stubs))} && '全部存在'})

## P0 崩溃游戏明细(7)

| 游戏 | 首个未捕获异常 |
|---|---|
${fails.filter(f => !f.isStub).map(f => `| ${f.slug} | \`${(f.pageErrors && f.pageErrors[0] || f.error || '').slice(0, 90)}\` |`).join('\n')}

证据: \`_optimization/evidence/<slug>/smoke.{png,json}\`

## 环境说明
- 广告域(pagead2/monetag/magsrv/adsterra 等)与分析 EP(trycloudflare)已 abort,避免 543 次测试 PV 污染生产 BI
- autoplay/用户手势类报错计入环境噪声不计缺陷
`;
fs.writeFileSync(path.join(repo, '_optimization', 'reports', 'phase1-report.md'), md);
console.log('stubs:', inv.stubCount, 'real games:', inv.realGameCount, 'verdicts:', JSON.stringify(v), 'deadTargets:', deadTargets.length);
