#!/usr/bin/env node
/* Generate _optimization/game-catalog.md from state/inventory.json */
const fs = require('fs');
const path = require('path');
const inv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), 'utf8'));
const games = inv.games;

const byCat = {};
games.forEach(g => { (byCat[g.category] = byCat[g.category] || []).push(g); });
const catOrder = Object.keys(byCat).sort((a, b) => byCat[b].length - byCat[a].length);

let md = `# GameZipper 全站游戏清单 (Phase 0 盘点)

> 生成时间: ${inv.built_at} · 游戏总数: **${games.length}**(目录编目 ${games.filter(g => g.inCatalog).length} + 未编目 ${games.filter(g => !g.inCatalog).length})
> 引擎分布: canvas ${games.filter(g => g.engine.includes('canvas')).length} · dom ${games.filter(g => g.engine === 'dom').length} · pixi ${games.filter(g => g.engine.includes('pixi')).length} · three ${games.filter(g => g.engine.includes('three')).length} · matter ${games.filter(g => g.engine.includes('matter')).length}
> 已有验证器: ${games.filter(g => g.hasVerifier).length} · 有关卡数据: ${games.filter(g => g.hasLevelsData).length} · 无任何音频代码: ${games.filter(g => !g.webAudio).length}
> 排除项: admin/api/audio/blog/zh/docs/contact/cookie-policy/terms/fun-web-games(SEO页)/pool(重定向页)/assets/og-images/tests

状态列: 未测 = 待 Phase 1 冒烟;✅ = 冒烟通过;❌ = 启动失败(P0)。

| # | 游戏 | 目录 | 类别 | 引擎 | 关卡数据 | 验证器 | 音频代码 | JS体量 | 状态 |
|---|------|------|------|------|----------|--------|----------|--------|------|
`;
let i = 0;
for (const cat of catOrder) {
  md += `\n### ${cat} (${byCat[cat].length})\n\n`;
  for (const g of byCat[cat].sort((a, b) => a.slug.localeCompare(b.slug))) {
    i++;
    md += `| ${i} | ${g.name}${g.inCatalog ? '' : ' *(未编目)*'} | \`${g.slug}/\` | ${g.category} | ${g.engine} | ${g.hasLevelsData ? '有' : '—'} | ${g.hasVerifier ? '✅' : '—'} | ${g.webAudio ? '有' : '**无**'} | ${(g.jsBytes / 1024).toFixed(0)}KB | 未测 |\n`;
  }
}
fs.writeFileSync(path.join(__dirname, '..', '..', 'game-catalog.md'), md);
console.log('written game-catalog.md,', i, 'games');
