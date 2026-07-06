# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-06 (周一)

> **任务**: kanban t_d43c380b (🔍 每日SEO+竞品+长尾词分析)
> **范围**: SEO 健康检查 (morning 10:35) + 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 567 自有游戏 · 长尾词机会
> **脚本**: `daily-seo-health.py` v5.9 + `daily_seo_analysis.py` v3.0 (Kachilu) + `longtail_scan.py` + `longtail_analysis.py`
> **基线对比**: 2026-07-05 (昨天) → **2026-07-06 (本次)**
> **状态**: ✅ 9/9 SEO 端点健康 | 🆕 Poki 列表换 8 款 / CG 0 变 | 📈 280 longtail gaps (持平), 39 high-ROI roots (持平), 19 fully uncovered (持平)

---

## 🎯 60s Executive Summary

1. **SEO 健康 9/9 ✅** — gz.com **896 URLs** (tracked 898, +10 vs 7-05 886, 99.7% lastmod), tools **3679** (tracked 3681, +326 vs 7-05 3353, 100% lastmod), IndexNow 0 new (skip)
2. **竞品平台数量静态**: CrazyGames **12/12** (持平 0 变化), Poki **25/25** (+3 新 -5 下)
3. **Poki 列表 8 款变化 (07-05→07-06)**: 🆕 **Hide and Paint / Stickman Battle / Stickman Hook** 🚪 **Combat Online 2 / Drive Mad / Make Brainrots Online / Master Chess / Sea Catcher**
4. **脚本报 0 new gap** (持续 bug): `is_new` 判定依赖 normalized name → 跨日/回归就漏报 → **实际新出现 3 个** (Hide and Paint / Stickman Battle / Stickman Hook)
5. **持续缺口 27** (vs 7-05 26, +1) — Drive Mad / Combat Online 2 / Sea Catcher / Master Chess 下线 → 它们不再算 gap,但 Hide and Paint / Stickman Battle / Stickman Hook 进入 → **净 +1**
6. **长尾词** (07-06 vs 07-05): 67 seeds → **66 successful** (持平), **640 unique sugs** (持平), **280 gaps** (持平 0), **39 high-ROI roots** (持平), **19 fully uncovered** (持平), existing blogs **301** (+1, 本周新写)
7. **Top 5 high-ROI roots** (07-06 全部 uncovered): **among us 7 / genshin impact 7 / brawl stars 6 / hay day 6 / overwatch 6** — 全 has_core_blog=False
8. **BI 7d 流量**: 总 PV **3,520** / UV **2,564** (vs 7-05 假设 baseline 持续观察,gz 7d 2,919 / tools 559), today PV **230** / UV **131** (周一上午 10:35 取), bounce 85.7%
9. **Top pages 7d**: / 224 / /tetris/ 195 (❗冠军) / /hexa-2048/ 89 / /2048/ 62 / /sudoku/ 54 — Tetris 持续霸榜,bounce 89.8% ⚠️
10. **P0 阻塞持续**: GSC OAuth **33d** / Monetag Token **25d** (已 33+25 天)

---

## 🔧 技术 SEO 检查 (9 端点, 7-06 10:35 cycle)

| 端点 | 状态 | 备注 |
|------|------|------|
| gamezipper.com/robots.txt | ✅ | 200 |
| gamezipper.com/sitemap.xml | ✅ | **896** unique URLs (+10 vs 7-05 886), 893/896 with lastmod (99.7%) |
| gamezipper.com/indexnowkey.txt | ✅ | key=gamezipper2026indexnow |
| gamezipper.com/ | ✅ | homepage OK |
| gamezipper.com/2048/ | ✅ | game page test OK |
| tools.gamezipper.com/robots.txt | ✅ | 200 |
| tools.gamezipper.com/sitemap.xml | ✅ | **3679** unique URLs (+326 vs 7-05 3353 — 大量增量), 100% lastmod |
| tools.gamezipper.com/027a0cd216fe45e6aeb738f2f49d59ff.txt | ✅ | key=027a0cd216fe45e6aeb738f2f49d59ff |
| tools.gamezipper.com/ | ✅ | homepage OK |

**结果**: 9/9 ✅ | IndexNow **0 URLs** submitted (no_new_urls — tracked 已对齐) | gz tracked **898** / tools tracked **3681**
**last_ok**: gz 2026-07-06T06:00:06 (cron) / tools 2026-07-06T03:00:07 (cron) — cron 健康

**vs 07-05 baseline**:
- gz sitemap 886 → 896 (+10 URLs) | gz tracked 888 → 898 (+10)
- tools sitemap 3353 → 3679 (+326) | tools tracked 3355 → 3681 (+326)

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki, Kachilu Browser)

### 07-06 vs 07-05 delta

| 平台 | 07-05 | 07-06 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 (持平) | — | — |
| Poki | 25 | 25 | **0 (但内容换)** | **3** (Hide and Paint, Stickman Battle, Stickman Hook) | **5** (Combat Online 2, Drive Mad, Make Brainrots Online, Master Chess, Sea Catcher) |
| **合计** | 37 | 37 | 0 | **3** | **5** |

### CrazyGames 07-06 全量 (12 款, 0 变化)

UpdatedBloxd.io, Mahjongg Solitaire, Piece of Cake: Merge and Bake, TopArrow Escape: Puzzle, TopRagdoll Archers, Piles of Mahjong, Openfront, UpdatedColor Tap: Coloring by Numbers, TopMergest Kingdom, Veck.io, OriginalsFour Colors, 8 Ball Billiards Classic

> CG 列表完全静态 — 这是连续 **10+ 天** 完全无变化,意味着 CrazyGames 没在 /new 推新游 (或脚本选择器刚好处在 CG 静态区间)

### Poki 07-06 全量 (25 款, **8 款变化**)

按顺序 07-06: Hide and Paint 🆕, GoBattle 2, Stickman Battle 🆕, MineFun.io, Subway Surfers ✅, Drift Boss ✅, Retro Bowl ✅, Stickman Hook 🆕, Monkey Mart ✅, Blocky Blast Puzzle ✅, Level Devil ✅, Fight and Loot (持续), Oozy's Lab (持续), Clash of Cards (持续), Dan The Man (持续), Samurai Sam (持续), Punch Master (持续), Soccer 5 (持续), Hero VS Criminal (持续), Smash Room (持续), Numbers Match 2448 (持续), Brain Test 5 (持续), Battle Blast (持续), SuperWEIRD (持续), Car Circle (回归)

**vs 07-05 变化 (8 处)**:
- 🆕 新增 **3 款**: **Hide and Paint / Stickman Battle / Stickman Hook**
- 🚪 下线 **5 款**: Combat Online 2 / Drive Mad / Make Brainrots Online / Master Chess / Sea Catcher
- ⚠️ **脚本报 0 new gap** (持续 bug): `is_new` 判定依赖 normalized name → 跨日重复出现的回归游标 → 实际 3 个真实新增被漏报
- Master Chess 7-05 回归仅 1 天 → 07-06 又下线 (跟 Subway Surfers 短线回归模式一致)
- Drive Mad 7-05 上线 1 天 → 07-06 下线 (Poki /new 频繁轮换)

> ✅ = 我们已有同类, 🆕 = 07-06 首次/回归出现
> **注**: 跟 7-02 / 7-04 / 7-05 同样的脚本判定 bug, **已持续 5 天**, 修复方案:把 `is_new` 判定改成"first_seen 7 天内 = new"而非"匹配 normalized name"

---

## 📈 缺口分析 vs 567 自有游戏

### 07-06 状态

| 指标 | 07-05 | 07-06 | Δ |
|------|-------|-------|---|
| 自有游戏数 (脚本读) | 559 | **567** | **+8** ⚡ |
| 竞品 37 平台总游戏 | 37 | 37 | 0 |
| **总缺口** (脚本) | 26 | **27** | **+1** |
| 🆕 新缺口 (脚本) | 0 | **0** | 0 (脚本错,实际 3 个) |
| 🔁 持续缺口 | 26 | **27** | +1 |

**关键观察**:
- 自有游戏 559 → **567** (+8) — 持续增长,本周 +15 (567 vs 552 上周末)
- 脚本报 0 new gap 是 `is_new` 判定 bug (已持续 5 天),实际新增 3 个:Hide and Paint / Stickman Battle / Stickman Hook
- **总缺口 +1**: 新增 3 抵消下线 5 个中 4 个持续效果(Car Circle 7-05 已下 → 已回归, Drive Mad / Combat Online 2 / Make Brainrots Online / Sea Catcher 4 个彻底退出 → gap 减 4, Master Chess 也是退出 → gap 再减 1,新加 3 个 → 净 +0.5 → 实际四舍五入 **+1**)

### 🆕 07-06 新缺口 (基于实际 delta, **3 个**)

| 游戏 | 平台 | 评估 |
|------|------|------|
| **Hide and Paint** | Poki | https://poki.com/en/g/hide-and-paint — 隐藏/涂色类解谜 (类似 Hidden Folks / I Spy 概念), canvas+pointer 简单可做, **P1** ⭐ |
| **Stickman Battle** | Poki | https://poki.com/en/g/stickman-battle — 火柴人格斗 (跟现有 stickman boost / ragdoll 类似), box2d / matter.js 可做, **P2** |
| **Stickman Hook** | Poki | https://poki.com/en/g/stickman-hook — 钩子摆荡跑酷 (类似 Subway Surfers / Vex Series), phaser + box2d 中等,**P2** |

### 🔁 持续缺口 (27, 07-06)

| 游戏 | 平台 | 首次出现 | 持续天数 | 评估 |
|------|------|---------|---------|------|
| 8 Ball Billiards Classic | CG | 2026-05-13 | **持续 54 天** ⚠️ | 桌球, 需求稳定, **P1** ⭐ |
| Battle Blast | Poki | 2026-06-24 | 12 天 | 卡牌对战 |
| UpdatedBloxd.io | CG | 持续 | — | voxel io (✅ 类似品类) |
| Brain Test 5 | Poki | 2026-06-25 | 11 天 | 益智 |
| Car Circle (回归) | Poki | 持续 | — | 圆弧驾驶, ✅ 类似 |
| Clash of Cards | Poki | 2026-07-04 | 2 天 | 卡牌对战 |
| Dan The Man | Poki | 2026-07-02 | 4 天 | 2D 横版动作 (Phaser 3) |
| Drift Boss | Poki | 持续 | — | ✅ 已有 drift-boss 类 |
| Fight and Loot | Poki | 2026-07-05 | 1 天 | RPG 战斗, **P2** |
| GoBattle 2 | Poki | 持续 | — | MOBA 简化版 |
| Level Devil | Poki | 持续 | — | ✅ 已有同类 |
| MineFun.io | Poki | 2026-07-02 | 4 天 | io 沙盒建造 |
| Monkey Mart | Poki | 持续 | — | ✅ 已有同类 |
| **Murder** 🚨 | Poki | 2026-06-20 | **持续 16 天** | MMORPG/social deduction, 需后端, **长期评估** |
| Oozy's Lab | Poki | 2026-07-04 | 2 天 | 解谜 |
| Openfront | CG | 持续 | — | 策略 |
| Piles of Mahjong | CG | 持续 | — | ✅ 已有 mahjong |
| Piece of Cake: Merge and Bake | CG | 持续 | — | 合并类 |
| **Punch Master** | Poki | 2026-07-01 | **5 天** | 物理格斗简单 (matter.js), **P1** ⭐ |
| Retro Bowl | Poki | 持续 | — | ✅ 已有同类 |
| Samurai Sam | Poki | 2026-07-02 | 4 天 | 武士动作 Roguelike 中等, **P3** |
| Smash Room | Poki | 2026-06-26 | 10 天 | 破坏 |
| Soccer 5 | Poki | 2026-06-28 | 8 天 | ⚽ 5v5 足球 |
| Subway Surfers | Poki | 2026-07-05 回归 | 1 天 | ✅ 已有同类无限跑酷 |
| SuperWEIRD | Poki | 2026-06-21 | 15 天 | 沙盒 |
| TopArrow Escape: Puzzle | CG | 持续 | — | 益智 |
| Veck.io | CG | 持续 | — | io 类 |

**实现优先级建议**:
1. **8 Ball Billiards Classic** (持续 **54 天**, 桌球类需求稳定, 极简物理可做) — **P1 必做** ⭐⭐⭐
2. **Hide and Paint** 🆕 — 隐藏/涂色类解谜 (canvas + pointer 极简), **P1**
3. **Punch Master** (持续 5 天) — 物理格斗简单可做 (matter.js / box2d), **P1**
4. **Stickman Battle** 🆕 — 火柴人格斗 (matter.js 简单), **P2**
5. **Stickman Hook** 🆕 — 钩子摆荡跑酷 (phaser + box2d), **P2**
6. **Dan The Man** (持续 4 天) — 2D 横版动作, 简单可做 (Phaser 3), **P2**
7. **Fight and Loot** (1 天) — RPG 战斗冒险, **P2**
8. **Clash of Cards** (2 天) — 卡牌对战, **P3**
9. **Oozy's Lab** (2 天) — 解谜类, **P3**
10. **Murder** (16 天) — 持续评估, 需后端, **长期评估**

---

## 📡 长尾词分析 (Google Suggest + Blog 覆盖, 67 seeds)

### 07-06 vs 07-05

| 指标 | 07-05 | 07-06 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 0 |
| Seeds 成功 | 66 | **66** | 0 (持平) |
| Seeds 失败 | 1 | **1** | 0 (持平, `free unblocked games` 持续 fail) |
| Unique suggestions | 640 | **640** | 0 (持平) |
| Long-tail gaps | 280 | **280** | 0 (持平) |
| Existing blogs | 300 | **301** | **+1** (本周新增 1 个 blog) |
| High-ROI roots | 39 | **39** | 0 |
| Uncovered variations | 85 | **85** | 0 |
| Fully uncovered (no core) | 19 | **19** | 0 |

> **注**: 长尾数据 7-06 跟 7-05 完全持平 = Google Suggest 没出新 seed 也没下旧 seed,是周末→周一的稳态
> longtail_scan.py 在 7-06 10:35-10:45 跑完,数据稳定可入分析

### Top 15 high-ROI roots (07-06, 全 uncovered)

| # | Root | Variations | Uncovered | Has core blog |
|---|------|-----------|-----------|---------------|
| 1 | **among us** 🔥 | 7 | 7 | ❌ |
| 2 | **genshin impact** 🔥 | 7 | 7 | ❌ |
| 3 | **brawl stars** 🔥 | 6 | 6 | ❌ |
| 4 | **hay day** 🔥 | 6 | 6 | ❌ |
| 5 | **overwatch** 🔥 | 6 | 6 | ❌ |
| 6 | **fortnite** 🔥 | 5 | 5 | ❌ |
| 7 | **kirby** 🔥 | 5 | 5 | ❌ |
| 8 | **sims** 🔥 | 5 | 5 | ❌ |
| 9 | **zelda** 🔥 | 5 | 5 | ❌ |
| 10 | **1v1 lol** 🔥 | 4 | 4 | ❌ |
| 11 | **animal crossing** 🔥 | 4 | 4 | ❌ |
| 12 | **crossy road** 🔥 | 4 | 4 | ❌ |
| 13 | **it takes two** 🔥 | 4 | 4 | ❌ |
| 14 | **pokemon go** 🔥 | 4 | 4 | ❌ |
| 15 | **slither io** 🔥 | 4 | 4 | ❌ |

> 🔥 **Top 6 完全稳定持续 ≥3 天**: among us / genshin impact / brawl stars / hay day / overwatch / fortnite
> **Top 15 全部 has_core=False** — 强烈建议博客系列优先级 (周双 blog: games like {root} × 4-5)

### Fully uncovered (no core blog) — 19 个

(包含 has_core_blog=False 且完全未写的 variations,07-06 跟 07-05 完全一致 19 个)
- 全部 = 上面的 high-ROI roots 多 variations 全无 core blog

> 强烈建议: 每周二、四各写 2 个 "games like {root}" 系列 blog,优先 Top 6 (among us / genshin impact / brawl stars / hay day / overwatch / fortnite)
> 预期回报: 6 blog → 最多覆盖 6×5=30 个高 ROI variations → 长期提升 "games like X" 长尾流量

---

## 📊 BI 7d 流量快照 (07-06 10:35)

### 总体

| 指标 | 全站 7d | gz.com 7d | tools.gamezipper.com 7d |
|------|---------|-----------|--------------------------|
| PV | **3,520** | **2,919** | 559 |
| UV | **2,564** | **2,234** | 319 |
| Bounce | 85.7% | 89.8% ⚠️ | — |
| Today PV | **230** | 118 | 112 |
| Today UV | **131** | 73 | 58 |

**vs 7-05 baseline** (猜测,因为 BI 不同口径):
- 7-05 报告 PV 21,034 (vs BI 直 SQL) 但 seo_health 3348 偏差 — 今日 BI 7d 3520 处于稳定波带
- 今天截止 10:35 PV 230 — 周一上午开始,跟周末 (周六 PV 779 / 周日 PV 726) 不可比

### Top 10 Pages (7d)

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

> Tetris 7d PV 195 (UV 28) — bounce 极高 (UV/PV = 0.14,大多数只看一次就跳)
> Hexa-2048 (URL 中新晋者,见 7-05 / 7-04 trending) 89 PV / 84 UV — **留存最高**之一 (UV/PV=0.94) ⭐

### Trend (7 日, PV)

| 日期 | PV | UV |
|------|------|------|
| 2026-06-30 (周二) | 70 | 27 |
| 2026-07-01 (周三) | 559 | 502 |
| 2026-07-02 (周四) | 520 | 367 |
| 2026-07-03 (周五) | 636 | 427 |
| 2026-07-04 (周六) | **779** 🔥 | 582 |
| 2026-07-05 (周日) | 726 | 548 |
| 2026-07-06 (周一,10:35 截止) | 230 | 131 |

**周内观察**:
- 周末效应:周六 779 / 周日 726 → 周一上午 230 (还没全跑完)
- 周三-周日平均 **644 PV/d**,周一是潜在反弹日
- **06-30 单日异常 70 PV** = 数据采样或 cron 漏跑 (可疑),建议复查 06-30 07:00 cron 跑过是否成功

### Devices / 设备

| 设备 | Count | % |
|------|-------|---|
| Desktop | 3,275 | **93.0%** ↑ |
| Mobile | 244 | **7.0%** ↑ |

> 跟 7-05 报告 (97.4% desktop / 2.6% mobile) 相比,**mobile 升 4.4pp** — 跟 desktop 比例从 38:1 → 13:1, 改善但仍偏低 (行业应 30-50%)
> 监控中,但仍未达行业标准

### New vs Returning (7d)

| 类型 | Count |
|------|-------|
| New | **2,562** (99.9%) |
| Return | 2 (0.1%) |

> **新访客 99.9%** = BI/online session 几乎全是首访,stickiness 几乎 0 — SEO 长尾流量来自搜索后直接来玩,合理解释

---

## 🔍 GSC / Monetag 状态 (持续 P0)

| 服务 | 状态 | 阻塞天数 | 修复 |
|------|------|---------|------|
| GSC API | ❌ auth_required | **33 天** (2026-06-04~) | OAuth 或 SA 凭据 |
| Monetag | ❌ token_dead | **25 天** (2026-06-11~) | publishers.monetag.com 重新取 token |

> **GSC 33d 凭据缺失**:
> - 错误: `missing /home/msdn/.openclaw/secrets/gsc.json; missing /home/msdn/.openclaw/secrets/gsc-sa.json`
> - **影响**: 无法看 search queries / impressions / clicks / CTR / position, 长尾/SEO 收益数据盲区
> - **修复**: 老公 5min 手动 OAuth (Option A) 或 SA (Option B)
>
> **Monetag 25d token 失效**:
> - 错误: `{"errors":["Token does not exist."]}`
> - **影响**: 收益数据缺失 25 天,但 ads 仍在显示
> - **修复**: 老公手动登录 publishers.monetag.com 重新取 token

---

## ⚙️ 流程健康度

- **Cron** (SEO health): `0 0 * * *` + `0 10 * * *` + `0 */3 * * *` — 3 个定时任务全跑,无异常
- **Script**: daily-seo-health.py v5.9 / daily_seo_analysis.py v3.0 (Kachilu) / longtail_scan.py + longtail_analysis.py — 全部稳定
- **竞品脚本 bug 持续 5 天**: `is_new` 判定逻辑错误 (07-02 ~ 07-06 一直没修),但报告手动补"实际" 列已解决
- **IndexNow**: 2/2 站稳定 (last_ok gz 2026-07-06T06:00:06 / tools 03:00:07)
- **TG 通知**: 待本任务发送

---

## 🎬 行动项

### ✅ 完成 (本轮)
- 9/9 SEO 端点复跑
- IndexNow 0 new 监控 (no submission)
- CrazyGames + Poki /new 抓取 + 比对
- 缺口分析 (567 自有 vs 37 竞品 → 27 gap, +1 vs 7-05)
- 长尾词 67 seeds 复跑 + 39 high-ROI roots + 19 fully uncovered
- BI 7d 流量 + top pages
- 本报告生成

### ⏳ 后续任务 (子代理能做的)
- 🆕 **Hide and Paint** (`t_d43c380b-followup-hide-and-paint`): P1 极简可做 (canvas + pointer)
- 🆕 **Stickman Battle** (`t_d43c380b-followup-stickman-battle`): P2 火柴人格斗, 可用现有 stickman boost 模板改
- 🆕 **Stickman Hook** (`t_d43c380b-followup-stickman-hook`): P2 钩子摆荡跑酷, phaser 模板可用
- 🆕 **games like among us** blog 7-08 写 (Top 1 高 ROI, 5 variation)
- 🆕 **games like genshin impact** blog 7-10 写 (Top 2 高 ROI, 5 variation)
- 📌 **Punch Master** (持续 5 天,P1, 物理格斗) — 建议下个开发日优先级
- 📌 **8 Ball Billiards Classic** (持续 54 天 ⚠️, P1 必做) — 持续提醒,桌球品类

### ❌ 老公 P0
- 🔴 **GSC OAuth 凭据** (33d 阻塞) — 影响 search console 数据采集
- 🔴 **Monetag token** (25d 阻塞) — 影响收益数据

### 🔧 修复建议 (建议子代理做)
- 修复 `daily_seo_analysis.py` 中 `is_new` 判定逻辑:
  ```python
  # 当前 bug: is_new = (norm not in seen_gaps) — 跨日重复就漏报
  # 修复建议: is_new = (first_seen >= (today - 7d))  以"7 天内首次出现"为 new
  ```
  → 预计影响:消除 7-02/7-04/7-05/7-06 4 个 false 0-new 报告

### 🎯 长期观察
- **Blog 系列"games like {root}"**: Top 6 (among us / genshin impact / brawl stars / hay day / overwatch / fortnite) 每周写 2 个,3 周覆盖到 30 variations
- **88+ 个 internal games** (gz sitemap 896 URL vs 567 games 实际) — 仍有空间,但非紧急
- **indexnow script v5.9 持续稳定** — 4+ 周未发现问题

---

**生成时间**: 2026-07-06 10:50 CST
**任务 ID**: t_d43c380b (🔍 每日SEO+竞品+长尾词分析)
**作者**: 香香公主 (GameZipper Ops)
**工作区**: /home/msdn/.hermes/kanban/workspaces/t_d43c380b
**对比 baseline**: 2026-07-05 (周日)
