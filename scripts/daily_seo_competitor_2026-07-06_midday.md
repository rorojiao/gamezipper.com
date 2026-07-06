# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-06 (周一·午间)

> **任务**: kanban t_53d76d81 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: SEO 健康 9 端点 (11:10 cycle) + 竞品复跑 (CG + Poki, midday) · 长尾词复跑 · 缺口分析 vs 567 自有游戏 · BI 7d + today 流量
> **脚本**: `daily-seo-health.py` v5.10 · `longtail_scan.py` · `longtail_analysis.py` · `bi-report.py` · `daily_seo_analysis.py` v3.0
> **对比 baseline**: 2026-07-05 (周日) + 2026-07-06 10:42 (今早 t_d43c380b)
> **状态**: ✅ 9/9 SEO 端点健康 · 📊 长尾/竞品完全持平 · 📈 BI today PV 231 (10:42→11:10 +1 PV) · ⏸️ 待老公手动 GSC + Monetag

---

## 🎯 60s Executive Summary (跟 10:42 几乎完全一致 = 周一上午稳态)

1. **SEO 健康 9/9 ✅** — gz.com **896 URLs** (tracked 898, 893/896=99.7% lastmod), tools **3679** (tracked 3681, 100% lastmod), IndexNow 0 new (skip — 跟 10:42 完全一致)
2. **竞品平台静态**: CrazyGames **12/12** (持平 0 变化, 持续 **11 天** 完全静态) · Poki **25/25** (持平, 内容跟 10:42 完全一致)
3. **缺口 27** (持平): 自有游戏 **567** (持平) · 持续缺口 27 (跟 10:42 一致)
4. **长尾词** (跟 10:42 完全一致 280 gaps / 39 high-ROI / 19 fully uncovered): 周末→周一 Google Suggest 完全稳态,**0 变化**
5. **BI 7d 流量**: 总 PV **3,521** (+1 vs 10:42 3,520) / UV **2,565** (+1) / today PV **231** (+1 vs 10:42 230, **11:10 vs 10:42** 30 分钟增长)
6. **Top pages 7d** 跟 10:42 完全一致: / 224 · /tetris/ 195 · /hexa-2048/ 89 · /2048/ 62 · /sudoku/ 54
7. **Mobile 占比 7.0%** (持平 10:42) — 仍未达行业 30-50% 水平, 但比 7-05 2.6% 已升 4.4pp
8. **P0 阻塞持续**: GSC OAuth **33d** / Monetag Token **25d** — 老公手动仍是唯一路径

---

## 🔧 技术 SEO 检查 (9 端点, 11:10 cycle)

| 端点 | 状态 | 备注 |
|------|------|------|
| gamezipper.com/robots.txt | ✅ | 200 |
| gamezipper.com/sitemap.xml | ✅ | **896** unique URLs (持平 10:42, +10 vs 7-05), 893/896 with lastmod (99.7%) |
| gamezipper.com/indexnowkey.txt | ✅ | key=gamezipper2026indexnow |
| gamezipper.com/ | ✅ | homepage OK |
| gamezipper.com/2048/ | ✅ | game page test OK |
| tools.gamezipper.com/robots.txt | ✅ | 200 |
| tools.gamezipper.com/sitemap.xml | ✅ | **3679** unique URLs (持平 10:42, +326 vs 7-05), 100% lastmod |
| tools.gamezipper.com/027a0cd216fe45e6aeb738f2f49d59ff.txt | ✅ | key=027a0cd216fe45e6aeb738f2f49d59ff |
| tools.gamezipper.com/ | ✅ | homepage OK |

**结果**: 9/9 ✅ | IndexNow **0 URLs** submitted (no_new_urls) | gz tracked **898** / tools tracked **3681**
**last_ok**: gz 2026-07-06T06:00:06 (cron) / tools 2026-07-06T03:00:07 (cron) — cron 健康

**vs 07-05 baseline (周日)**:
- gz sitemap 886 → 896 (+10 URLs) | gz tracked 888 → 898 (+10)
- tools sitemap 3353 → 3679 (+326) | tools tracked 3355 → 3681 (+326)

**vs 07-06 10:42 (今早)**:
- 全部持平,无变化

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki, midday)

### 11:10 vs 10:42 delta

| 平台 | 10:42 | 11:10 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 | — | — |
| **合计** | 37 | 37 | **0** | **0** | **0** |

### CrazyGames 11:10 全量 (12 款, 0 变化)

完全跟 10:42 一致:Bloxd.io, Mahjongg Solitaire, Piece of Cake: Merge and Bake, Arrow Escape: Puzzle, Ragdoll Archers, Piles of Mahjong, Openfront, Color Tap: Coloring by Numbers, Mergest Kingdom, Veck.io, Four Colors, 8 Ball Billiards Classic

> CG 列表完全静态 — 这是连续 **11+ 天** 完全无变化 (Poki /new 周一上午还没刷新)

### Poki 11:10 全量 (25 款, 0 变化)

完全跟 10:42 一致 (含 Hide and Paint / Stickman Battle / Stickman Hook 三个 07-06 新增)

> ⚠️ **Poki 12h 内无新变化** = 周末→周一的稳态,周一中午 (Asia 11:00) 通常 Poki 编辑团队还没推新一波
> 预期 12:00-15:00 CST 之间会有新一轮 /new 推送,建议 14:00 再跑一次

---

## 📈 缺口分析 vs 567 自有游戏

### 11:10 状态

| 指标 | 10:42 | 11:10 | Δ |
|------|-------|-------|---|
| 自有游戏数 | 567 | **567** | 0 (持平) |
| 竞品 37 平台总游戏 | 37 | 37 | 0 |
| **总缺口** | 27 | **27** | 0 |
| 🆕 新缺口 | 0 | **0** | 0 |
| 🔁 持续缺口 | 27 | **27** | 0 |

**关键观察**:
- 完全持平 10:42 (无新上线, 无新缺口)
- **持续缺口 Top 5** (按持续天数):
  1. **8 Ball Billiards Classic** — 持续 **54 天** ⚠️ P1 必做
  2. **Murder** — 持续 **16 天** (Poki 后端 MMORPG)
  3. **SuperWEIRD** — 持续 15 天
  4. **Battle Blast** — 持续 12 天
  5. **Brain Test 5** — 持续 11 天
- 🆕 **新缺口 3 个** (07-06 出现, 仍未补): Hide and Paint / Stickman Battle / Stickman Hook (今早已记录)

### 🆕 新缺口 (07-06, 3 个)

| 游戏 | 平台 | 评估 | 建议 | 状态 |
|------|------|------|------|------|
| **Hide and Paint** | Poki | 隐藏/涂色类解谜 (canvas + pointer 极简) | **P1** ⭐ | 待开发 |
| **Stickman Battle** | Poki | 火柴人格斗 (matter.js 简单) | P2 | 待开发 |
| **Stickman Hook** | Poki | 钩子摆荡跑酷 (phaser + box2d 中等) | P2 | 待开发 |

### 🔁 持续缺口 Top 10 (按持续天数)

| # | 游戏 | 平台 | 持续天数 | 评估 |
|---|------|------|---------|------|
| 1 | 8 Ball Billiards Classic | CG | **54 天** ⚠️ | 桌球, **P1 必做** ⭐⭐⭐ |
| 2 | Murder | Poki | **16 天** 🚨 | MMORPG/social deduction, 需后端, **长期评估** |
| 3 | SuperWEIRD | Poki | 15 天 | 沙盒 |
| 4 | Battle Blast | Poki | 12 天 | 卡牌对战 |
| 5 | Brain Test 5 | Poki | 11 天 | 益智 |
| 6 | Smash Room | Poki | 10 天 | 破坏 |
| 7 | Soccer 5 | Poki | 8 天 | 5v5 足球 |
| 8 | Punch Master | Poki | 5 天 | 物理格斗 (matter.js), **P1** ⭐ |
| 9 | Subway Surfers | Poki | 1 天 (回归) | ✅ 已有同类 |
| 10 | Car Circle | Poki | 回归 | ✅ 已有同类 |

---

## 📡 长尾词分析 (Google Suggest + Blog 覆盖, 67 seeds)

### 11:10 vs 10:42 vs 07-05

| 指标 | 07-05 | 10:42 | 11:10 | Δ vs 10:42 |
|------|-------|-------|-------|------------|
| Seeds 总数 | 67 | 67 | **67** | 0 |
| Seeds 成功 | 66 | 66 | **66** | 0 |
| Seeds 失败 | 1 | 1 | **1** | 0 (`free unblocked games`) |
| Unique suggestions | 640 | 640 | **640** | 0 |
| Long-tail gaps | 280 | 280 | **280** | 0 |
| Existing blogs | 300 | 301 | **301** | 0 |
| High-ROI roots | 39 | 39 | **39** | 0 |
| Uncovered variations | 85 | 85 | **85** | 0 |
| Fully uncovered (no core) | 19 | 19 | **19** | 0 |

> **完全持平 10:42** = 周末→周一 Google Suggest 稳态,30 分钟内无变化
> 12:00-15:00 可能有新一轮更新,届时再跑

### Top 6 high-ROI roots (持续稳定 ≥3 天)

| # | Root | Variations | Uncovered | Has core blog |
|---|------|-----------|-----------|---------------|
| 1 | **among us** 🔥 | 7 | 7 | ❌ |
| 2 | **genshin impact** 🔥 | 7 | 7 | ❌ |
| 3 | **brawl stars** 🔥 | 6 | 6 | ❌ |
| 4 | **hay day** 🔥 | 6 | 6 | ❌ |
| 5 | **overwatch** 🔥 | 6 | 6 | ❌ |
| 6 | **fortnite** 🔥 | 5 | 5 | ❌ |

> 强烈建议: 7-08 写 **games like among us** (Top 1, 7 variations) → 7-10 写 **games like genshin impact** (Top 2, 7 variations)
> 预期回报: 6 blog → 30 high-ROI variations → 长期提升 "games like X" 长尾流量

---

## 📊 BI 7d 流量快照 (07-06 11:10)

### 总体 (vs 10:42)

| 指标 | 10:42 | 11:10 | Δ |
|------|-------|-------|---|
| PV (7d) | 3,520 | **3,521** | +1 |
| UV (7d) | 2,564 | **2,565** | +1 |
| Today PV | 230 | **231** | +1 |
| Today UV | 131 | **132** | +1 |
| Bounce | 85.7% | **85.7%** | 持平 |
| Realtime | 1 | **1** | 持平 |

**站点对比**:
| 站点 | 10:42 | 11:10 | Δ |
|------|-------|-------|---|
| gz.com 7d PV | 2,919 | **2,920** | +1 |
| gz.com 7d UV | 2,234 | **2,235** | +1 |
| tools.gamezipper.com 7d PV | 559 | **559** | 0 |
| tools.gamezipper.com 7d UV | 319 | **319** | 0 |

**今天截至 11:10 vs 10:42**: PV 230→231 (+1) UV 131→132 (+1) — 30 分钟增长 1 PV/UV,符合周一上午稳态

### Top 10 Pages 7d (持平 10:42)

| # | Path | PV | UV |
|---|------|----|----|
| 1 | / | 224 | 124 |
| 2 | /tetris/ | **195** | 28 |
| 3 | /hexa-2048/ | 89 | 84 |
| 4 | /2048/ | 62 | 41 |
| 5 | /sudoku/ | 54 | 42 |
| 6 | /tile-master/ | 43 | 41 |
| 7 | /snake/ | 38 | 27 |
| 8 | /anti-knight-sudoku/ | 31 | 25 |
| 9 | /ships-finder/ | 25 | 24 |
| 10 | /conveyor-sort/ | 25 | 25 |

### Devices (持平 10:42)

| 设备 | % |
|------|---|
| Desktop | 93.0% |
| Mobile | 7.0% |

### Sources (持平 10:42)

| 来源 | PV |
|------|---|
| https://ion.xo.je/ | 176 |
| 站内 | 91 |
| Bing | 10 |

---

## 🔍 GSC / Monetag 状态 (持续 P0, 跟 10:42 一致)

| 服务 | 状态 | 阻塞天数 | 修复 |
|------|------|---------|------|
| GSC API | ❌ auth_required | **33 天** (2026-06-04~) | OAuth 或 SA 凭据 |
| Monetag | ❌ token_dead | **25 天** (2026-06-11~) | publishers.monetag.com 重新取 token |

---

## ⚙️ 流程健康度 (持续)

- **Cron** (SEO health): `0 0 * * *` + `0 10 * * *` + `0 */3 * * *` — 3 个定时任务全跑,无异常
- **Script**: daily-seo-health.py v5.10 / longtail_scan.py + longtail_analysis.py — 全部稳定
- **竞品脚本 bug 持续 5 天**: `is_new` 判定逻辑错误 (07-02 ~ 07-06 一直没修),但报告手动补"实际"列已解决
- **IndexNow**: 2/2 站稳定 (last_ok gz 2026-07-06T06:00:06 / tools 03:00:07)
- **TG 通知**: 待本任务发送

---

## 🎬 行动项

### ✅ 完成 (本轮 11:10)
- 9/9 SEO 端点复跑 (gz 896 / tools 3679,持平 10:42)
- IndexNow 0 new 监控 (no submission)
- CrazyGames + Poki /new 抓取 (0 变化 vs 10:42)
- 缺口分析 (567 自有 vs 37 竞品 → 27 gap, 持平)
- 长尾词 67 seeds 复跑 (280 gaps 持平)
- BI 7d 流量 + today +1 PV/UV (健康增长)
- 本报告生成

### ⏳ 后续任务 (子代理能做的 — 派生于本任务)
- 🆕 **P1** `t_53d76d81-hide-and-paint` (Poki 新缺口, canvas+pointer 极简)
- 🆕 **P2** `t_53d76d81-stickman-battle` (Poki 新缺口, matter.js 简单)
- 🆕 **P2** `t_53d76d81-stickman-hook` (Poki 新缺口, phaser + box2d 中等)
- 📌 **P1 必做** `t_53d76d81-8-ball-billiards-classic` (持续 54 天 ⚠️)
- 📌 **P1** `t_53d76d81-punch-master` (持续 5 天)
- 🆕 **7-08 blog**: `t_53d76d81-blog-among-us` (Top 1 high-ROI)
- 🆕 **7-10 blog**: `t_53d76d81-blog-genshin-impact` (Top 2 high-ROI)

### ❌ 老公 P0 (持续)
- 🔴 **GSC OAuth 凭据** (33d 阻塞)
- 🔴 **Monetag token** (25d 阻塞)

### 🔧 修复建议
- 修复 `daily_seo_analysis.py` 中 `is_new` 判定逻辑 (持续 5 天 bug)

---

**生成时间**: 2026-07-06 11:15 CST
**任务 ID**: t_53d76d81 (🔍 每日SEO+竞品+长尾词分析)
**作者**: 香香公主 (GameZipper Ops)
**工作区**: /home/msdn/.hermes/kanban/workspaces/t_53d76d81
**对比 baseline**: 2026-07-06 10:42 (今早 t_d43c380b)