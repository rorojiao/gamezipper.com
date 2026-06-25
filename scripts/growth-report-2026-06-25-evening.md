# 🚀 GameZipper 增长报告 — 2026-06-25

## 🎯 Executive Summary (60s)
- **BI 7d**: PV 3,428 / UV 1,989 (today 124/57), 跳出率 85.3% (puzzle站正常范围)
- **gz.com 7d**: PV 2,044 / UV 1,547 (bounce 94.6%) — Top 流量页 /2048/ 66 PV, /snake/ 56 PV
- **tools.gamezipper.com 7d**: PV 1,145 / UV 364 (bounce 53.2% — 健康) — /text/word-counter 8 PV
- **Top 10 game pages 拿 30%+ 流量** (2048/snake/tetris/chess 主导)
- **P0 修复 (8/8)**: 8 个游戏页有 `<div class="gz-related-games">` 但缺 CSS, 修复后 related-games 渲染为卡片网格
  - 影响: 2048 (#1 流量, 183 PV/30d), arrow-escape, bubble-pop, catch-turkey, dessert-blast, fruit-slash, pixel-logic, tile-dynasty
  - 修复: 在 `</head>` 前注入 light theme CSS (白卡, 浅灰边, teal hover) — 跟 snake 一样的 pattern

## 📊 实时 BI 数据 (近 30 天)

### 整体
| 指标 | 30d | 7d | 今天 |
|---|---|---|---|
| PV | 6,743 | 3,428 | 124 |
| UV | 4,128 | 1,989 | 57 |
| 跳出率 | 79.1% | 85.3% | - |
| 平均停留 | 1019s | - | - |

### 站点对比 (30d)
| 站点 | PV | UV | 跳出率 |
|---|---|---|---|
| gamezipper.com | 4,023 | 3,010 | 93.8% |
| tools.gamezipper.com | 2,286 | 1,007 | 38.7% |

### Top 10 流量页 (30d, gz.com)
| 路径 | PV | UV |
|---|---|---|
| / | 320 | 225 |
| /2048/ | 183 | 150 |
| /snake/ | 140 | 71 |
| /tetris/ | 120 | 98 |
| /chess/ | 110 | 106 |
| /slope/ | 97 | 79 |
| /color-sort/ | 81 | 77 |
| /nut-sort/ | 54 | 54 |
| /sudoku/ | 50 | 44 |
| /cookie-clicker/ | 47 | 47 |

**Top 10 占 30% 流量** — 长尾效应明显

### Top 10 工具页 (30d, tools)
| 路径 | PV |
|---|---|
| / | 110 |
| /zh/ | 12 |
| /calc/bmi-calculator.html | 11 |
| /text/random-sentence-generator.html | 10 |
| /zh/dev/screen-resolution-tester.html | 9 |
| /text/word-counter.html | 9 |
| /dev/css-selector-tester.html | 9 |
| /zh/text/random-question-generator.html | 8 |
| /text/case-converter.html | 8 |
| /dev/webhook-tester.html | 8 |

中文SEO效果显著: /zh/ 12 PV + 4 个中文页面进 top 10

## 🔧 本轮修复 (8 文件, 56 行)

### P0 修复: 8 game pages 缺 gz-related-games CSS
**问题**: 62 个页面有 `<div class="gz-related-games">` HTML, 但只有 54 个有 CSS 规则
**影响页面**: 2048 (183 PV/30d), arrow-escape, bubble-pop, catch-turkey, dessert-blast, fruit-slash, pixel-logic, tile-dynasty
**症状**: 用户看到 `<h3>You May Also Like</h3>` 下面是 plain text 链接, 没有视觉吸引力, 不点击 → 跳出率不必要地高
**修复**: 在 `</head>` 前注入标准 light-theme CSS (跟 snake 一致)
```css
.gz-related-games{margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0}
.gz-related-games h3{font-size:16px;color:#1e293b;margin-bottom:12px}
.gz-related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.gz-related-card{...white card with teal hover...}
```
**预计影响**: 8 个高流量页的 cross-game click-through 提升, 跳出率下降

## 📡 SEO / IndexNow 状态

### Daily SEO Health 2026-06-25 (v5.10 脚本)
- 9/9 endpoints OK
- gz.com sitemap: 761 URLs, 100% lastmod coverage
- tools sitemap: 2735 URLs, 100% lastmod coverage
- IndexNow 0 new URLs (两边都跟上)

### ⚠️ GSC 状态 (需 老公 手动)
- ❌ OAuth 凭据缺失 23 天
- 影响: 无法拉取 Search Console API 数据 (queries/clicks/impressions/CTR)
- Option A (5min): console.cloud.google.com 重新 OAuth
- Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json

### ⚠️ Monetag Token (需 老公 手动)
- ❌ Token 失效 14 天 (8 days since 06-11, +6 since detected 06-18)
- 影响: 无法拉取 Monetag 收益数据
- 修复: 重新登录 publishers.monetag.com 更新 /home/msdn/.openclaw/secrets/monetag.json

## 🎯 增长机会 (按 ROI 排序)

### 1. 🟢 (已做) P0 修复: 8 game pages 缺 gz-related CSS
- ✅ 完成, 8 files changed, 56 lines added
- 预计 +5-15% cross-game click-through on these pages

### 2. 🟡 高 ROI, 30 min: Top 10 游戏的 related-games relevance
- 当前 2048 推: color-sort, word-puzzle, sushi-stack, ocean-gem-pop, dessert-blast
- 5 个里只有 2 个真正是 puzzle 类
- 建议换成: /threes/, /number-nexus/, /number-match/, /nut-sort/, /ball-sort/
- 类似优化: snake, tetris, chess, sudoku, slope, color-sort, nut-sort, sudoku, cookie-clicker

### 3. 🟡 高 ROI, 60 min: 4 个无 related-games 段的高流量页
- nut-sort (54 PV/30d), sudoku (50 PV/30d), cookie-clicker (47 PV/30d)
- one-line-puzzle, crazy-eights, wordle (全部 7d 都有 20+ PV)
- 加 `<div class="gz-related-games">` + 5 个 related 链接

### 4. 🟡 中 ROI, 2 hours: 更多 game pages = 更多 SEO surface
- 当前 433 games, 竞品 crazygames/poki 数千
- 每个新 game = 新 URL = 新搜索入口
- 优先做: 2024-2026 trending puzzle 关键词

### 5. 🔴 BLOCKED: GSC OAuth
- 23 天未拉 search console data
- 不知道哪些 query 实际带来流量
- 老公 5min 手动 OAuth (或 SA 一次)

### 6. 🔴 BLOCKED: Monetag token
- 14 天无收益数据
- 不知道哪些 page/zone 实际产生 eCPM
- 老公 手动登录 publishers.monetag.com

## 🔍 设备 / 流量分析

### 设备分布 (7d, 3324 desktop / 87 mobile)
- **Desktop**: 97.4% (3,324 访客)
- **Mobile**: 2.6% (87 访客)
- 行业 puzzle game 站 mobile 一般 30-50%
- 可能原因: 
  1. CDN/Cloudflare UA 路由问题
  2. 移动端游戏实际体验差 (touch controls 不好)
  3. 真实用户结构就是这样 (美国家长上班用 Chromebook 玩游戏)
- 行动: 检查 top 5 游戏的 mobile touch 体验

### 来源 (7d, 主要站内)
- 站内: 139 (cross-link 流量)
- emulatorxdotcom.wpcomstaging.com: 30 (外部站)
- 其它 0-10: 各 search engines

## 🛠️ 流程健康度

| 检查项 | 状态 |
|---|---|
| daily-seo-health.py v5.10 | ✅ 9/9 OK |
| IndexNow gz.com | ✅ tracked 761 |
| IndexNow tools | ✅ tracked 2737 |
| Sitemap 100% lastmod (gz) | ✅ 761/761 |
| Sitemap 100% lastmod (tools) | ✅ 2735/2735 |
| BI server (10.10.29.67:8090) | ✅ Healthy, token OK |
| Tunnel (trycloudflare) | ✅ 最新 010ed31b59 |
| GSC OAuth | ❌ 23d missing |
| Monetag token | ❌ 14d expired |

## 📁 本轮产出 (子代理 commit, 不 push)

```
8 files changed, 56 insertions(+)
2048/index.html           | 7 +++++++
arrow-escape/index.html   | 7 +++++++
bubble-pop/index.html     | 7 +++++++
catch-turkey/index.html   | 7 +++++++
dessert-blast/index.html  | 7 +++++++
fruit-slash/index.html    | 7 +++++++
pixel-logic/index.html    | 7 +++++++
tile-dynasty/index.html   | 7 +++++++
```

## 🎬 行动项

| 优先级 | 行动 | 状态 |
|---|---|---|
| ✅ P0 | 8 game pages gz-related-games CSS 修复 | 完成, commit 等 push |
| 🟡 P1 | Top 10 games related-games relevance 优化 | 待 |
| 🟡 P1 | 4 高流量页加 related-games 段 | 待 |
| 🔴 P0 | GSC OAuth 修复 (老公手动 5min) | BLOCKED 23d |
| 🔴 P0 | Monetag token 刷新 (老公手动) | BLOCKED 14d |
| 🟢 P2 | Mobile 体验检查 | 待 |
| 🟢 P2 | 增量新 game (SEO surface) | 持续 |
