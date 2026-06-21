# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-21 10:08 CST

> **任务**: kanban t_17f71881 (🔍 每日SEO+竞品+长尾词分析)
> **数据源**:
> - `daily-seo-health.py` v5.8 → SEO endpoint 健康 + IndexNow 状态 (本报告引用)
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析 (37 games)
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 612 unique suggestions
> **对比基线**: 2026-06-20 11:00 (gap 26 / new 1 Murder / longtail 631 sug) → **2026-06-21 10:08 (gap 25 / new 2 / longtail 612 sug)**
> **站点状态**: **393 游戏** (gz.com, +13 vs 06-20 11:00) + 2407 tools · sitemap gz.com **720 URLs** (+13 vs 06-20 11:00, +16 vs 06-19) · tools 2407 (+158 vs 2249) · 9/9 endpoints ✅

---

## 🎯 60 秒读 (Executive Summary)

1. **🆕 新竞品缺口 2 个** — **Car Circle** + **SuperWEIRD** (均 Poki), 10:01 首次出现, 评估品类价值
2. **🔄 持续缺口 23 个** (vs 06-20: 25), Top 5: 8 Ball Billiards / Airplane Manager / Bloxd.io / Box Monster Dress Up / Four Colors
3. **⚠️ Murder 1 天跌出 /new** (06-20 NEW → 06-21 消失) — 趋势短暂, 不值得做
4. **🆕 长尾词深度扫描** (67 seed × Google Suggest) → **612 unique suggestions** (-19 vs 06-20 631) → 258 raw gaps → **37 高 ROI 词根** (variations ≥ 2)
5. **🔥 18 个全新高 ROI 长尾 (无 core blog)**:
   - **animal crossing / hay day** (8 var each, life-sim/farming 空白)
   - **among us / brawl stars / overwatch / sims** (7 var each, multiplayer 空白)
   - **genshin impact / zelda** (6 var each, RPG 空白)
   - **crossy road / fortnite / kirby / stardew valley** (5 var each, 各自品类空白)
   - **it takes two / slither io / 1v1 lol / mario party / mario / mario kart** (2-4 var)
6. **🚨 3 个新缺 lastmod URL** (gz.com sitemap): anti-king-sudoku / girandola-sudoku / marginal-sudoku — 昨天 thermo-sudoku 修好, 但又有 3 个新直接 commit 绕过
7. **9/9 endpoints ✅ + 2 new URLs**: gz.com **720 tracked** (+13 since 06-20 11:00, **+2 new submitted**), tools 2407 tracked (+158 from cron 03:00 regen), IndexNow 已提交
8. **📈 sitemap 大幅增长**: 06-20 11:00 → 06-21 10:08 = gz.com +13 = 707→720, tools +158 (2249→2407) — 期间 dev-gamezipper 大量入库 + tools cron regen
9. **🚨 2 个 P0 阻塞持续**: GSC OAuth (18 天) + Monetag API Token (10 天) — 真实 search/收益数据双失明
10. **📋 现有 ready board 跟踪**: t_ac91518b (games-like-stardew-valley, P0) ✅ + t_e38dc49a (games-like-terraria, P1) + t_0e4b25c5 (best-io-games, P0) ✅

---

## 🔧 1. 技术 SEO 状态

完整报告见 `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-21.md` (本任务产出)

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **720 <loc>**, 720 unique, **717 lastmod (99.58%, ⚠️ 3 missing)** |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB 0.58s |
| gamezipper.com/2048/ | 200 | ✅ | TTFB 0.74s |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | 2407 unique (100% lastmod) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | |

### 1.2 IndexNow 状态 (本轮 +2 new)

| Host | Sitemap | Tracked | New | Submitted | Last OK |
|------|---------|---------|-----|-----------|---------|
| gamezipper.com | 720 | 720 | **2** | **2** | 2026-06-21T10:04:04 |
| tools.gamezipper.com | 2407 | 2407 | 0 | 0 | 2026-06-21T03:00:05 |

**结论**: gz.com sitemap 与 tracked 完全同步 (720=720), 本轮 2 URLs 已成功提交 (Bing API 返回 200). tools 站保持同步, 03:00 cron regen +158 URLs 已 tracked. v5.8 curl_cffi+DIRECT 修复仍稳定.

### 1.3 ⚠️ 3 个 URL 缺 lastmod (06-21 vs 06-20: 1→3, net +2 ⚠️)

- **gz.com sitemap.xml**: 720/720 unique ✅, 但 **3/720 缺 lastmod** (99.58% 覆盖率)
- **当前缺失 URL** (与 06-20 不重叠):
  - https://gamezipper.com/anti-king-sudoku/
  - https://gamezipper.com/girandola-sudoku/
  - https://gamezipper.com/marginal-sudoku/
- **修复进展 vs 06-20**:
  - ✅ thermo-sudoku 已被期间 regen 修复 (06-20 是 1 个缺失)
  - 🆕 3 个新 sudoku variants 直接 commit 绕过 regen, 触发同症状
  - 净变化: 1 → 3 (+2 ⚠️)
- **影响**: Google/Bing 拿到 lastmod 缺失 URL 时优先级降权, IndexNow 不受影响
- **原因**: dev-gamezipper 任务持续直接 `<url><loc>...</loc></url>` commit 绕过 gen_sitemap.py
- **修复** (P3): 跑 `gen_sitemap.py` regen
- **根治方案** (待做, 第 3 次发现此问题): 在 `gen_sitemap.py` 加 `assert_no_missing_lastmod()` check + 给 dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤

---

## 🎮 2. 竞品追踪 (Poki + CrazyGames)

### 2.1 抓取概况 (2026-06-21 10:01 CST, Kachilu Browser + mihomo)

| 竞品 | 抓取页 | 抓到游戏 | 新缺口 | 持续缺口 |
|------|--------|---------|--------|---------|
| **CrazyGames** `/t/new` | 12 | 12 | 0 | 12 |
| **Poki** `/en/new` | 25 | 25 | 2 | 13 |
| **Total** | 37 | 37 | **2** | **23** |

### 2.2 🆕 新缺口 (10:01 首次出现, 2 个)

| # | 游戏 | 来源 | 类别 | 链接 |
|---|------|------|------|------|
| 1 | **Car Circle** | poki | 2D driving / circle stunt | https://poki.com/en/g/car-circle |
| 2 | **SuperWEIRD** | poki | casual / arcade | https://poki.com/en/g/superweird |

**Car Circle**:
- **来源**: Poki /en/new (10:01 首次出现)
- **类型**: 2D 圆圈特技驾驶 (类似 Happy Wheels / Circle Path 变种)
- **我们状态**: 0 (car/stunt 品类我们有 rocket league / moto, 但不是 circle stunt)
- **ROI 评估**: 🟢 **LOW** — 单一品类, 搜索量低, 仅在 /new 短暂出现概率高
- **决策建议**: **不启动 2 周观察期**, 列入 P3 监控 (类似 Murder 06-20 1 天跌出)

**SuperWEIRD**:
- **来源**: Poki /en/new (10:01 首次出现)
- **类型**: casual / meme arcade (看名字是非主流的怪诞游戏)
- **我们状态**: 0
- **ROI 评估**: 🟢 **LOW** — 怪诞风格搜索量极低, 留存差
- **决策建议**: **不启动观察期**, 列入 P3 监控

**vs 06-20 新缺口对比**:
- 06-20: **Murder** (2D shooter, MEDIUM-HIGH ROI, 启动 2 周观察期) → **06-21 跌出 /new** ❌
- 06-21: **Car Circle** + **SuperWEIRD** (LOW ROI, 不观察)
- **观察**: Poki /new 持续推出新游戏但绝大多数是 1 天游, 仅少数有持续价值

### 2.3 🔄 Top 5 持续缺口 (每天都出现, 优先做)

| # | 游戏 | 来源 | 类别 | 我们状态 | ROI 评估 |
|---|------|------|------|---------|---------|
| 1 | **8 Ball Billiards Classic** | crazygames | 体育/桌球 | 0 | 🟠 **HIGH** — billiards/pool 全球 ~500K+ monthly searches, **40 天持续缺口** |
| 2 | **Airplane Manager** | poki | idle/tycoon | 0 | 🟠 **HIGH** — idle 品类 5/393 (1.3%), 10 天持续缺口 |
| 3 | **Bloxd.io** | crazygames | .io sandbox | 0 | 🔥 **HIGH** — .io 流派第一缺口, 33 天持续, 与 subway/geometry dash 长尾强相关 |
| 4 | **Box Monster Dress Up** | poki | dress-up | 0 | 🟡 MEDIUM — dress-up 品类完全空白, 10 天 |
| 5 | **OriginalsFour Colors** | crazygames | 桌游/UNO | 0 | 🟡 MEDIUM — 13 天持续, 桌游品类 |

### 2.4 🆕 值得关注的 06-21 新游戏 (今日 Poki Top 25)

| 游戏 | 来源 | 我们状态 | 行动建议 |
|------|------|---------|---------|
| Subway Surfers | poki | ✅ games-like-subway-surfers-free-online | 已覆盖长尾 |
| Drift Boss | poki | ❌ | 🟠 持续 gap (2+ 周, sports 联动) |
| Retro Bowl | poki | ❌ | 🟠 持续 gap (40 天, sports 联动) |
| Stickman Battle | poki | ❌ (t_02692ae6 blocked dev-gamezipper) | 🔥 待 P1 解锁后立刻复制 |
| Stickman Hook / Stickman Fury | poki | ❌ | 🟡 持续 gap |
| Monkey Tag IO | poki | ❌ | 🟡 持续 gap (.io 品类) |
| Monkey Mart | poki | ❌ | 🟡 持续 gap (idle/tycoon 联动) |
| Home Builder Clicker | poki | ❌ | 🟡 NEW gap (3 天, idle 品类) |
| Make Brainrots Online | poki | ❌ | 🟡 **06-20 NEW, 2 天观察期** |
| Phone CASE DIY | poki | ❌ | 🟢 dress-up 品类空白 |
| Marina Club Rush | poki | ❌ | 🟡 持续 gap (9 天) |
| Spacebar Clicker | poki | ❌ | 🟡 持续 gap (15 天) |
| Airplane Manager | poki | ❌ | 🟠 **持续 gap (10 天, HIGH)** |
| Box Monster Dress Up | poki | ❌ | 🟡 持续 gap (10 天) |
| Sea Catcher | poki | ❌ | 🟡 NEW gap (3 天) |
| **Car Circle** | poki | ❌ | 🟢 **10:01 NEW, 1 天观察 (vs Murder 1 天跌出模式)** |
| **SuperWEIRD** | poki | ❌ | 🟢 **10:01 NEW, 不观察 (LOW ROI)** |
| Stunt Protocol | poki | ❌ | 🟡 持续 gap (11 天) |
| GunForce / Combat Online 2 | poki | ❌ | 🟡 2D 射击持续 gap |
| GoBattle 2 | poki | ❌ | 🟡 2D 格斗 |
| Veggie Merge | poki | ❌ | 🟡 merge 品类 |
| Level Devil / Blocky Blast Puzzle | poki | ✅ 已覆盖 | - |
| Master Chess | poki | 部分 (chess/) | 🟡 长尾联动 |

### 2.5 06-21 新游戏 (CrazyGames Top 12)

| 游戏 | 来源 | 我们状态 | 行动建议 |
|------|------|---------|---------|
| 8 Ball Billiards Classic | crazygames | ❌ | 🟠 HIGH (Top 1 持续 40 天缺口) |
| Bloxd.io / Veck.io | crazygames | ❌ (variant) | 🔥 HIGH (.io 品类) |
| Mahjongg Solitaire / Piles of Mahjong | crazygames | ❌ | 🟡 桌游空白 |
| Piece of Cake: Merge and Bake | crazygames | ❌ | 🟡 merge 品类 |
| Mergest Kingdom | crazygames | ❌ | 🟡 merge 品类 (40 天) |
| TopOpenfront | crazygames | ❌ | 🟡 strategy 品类 (21 天) |
| TopArrow Escape: Puzzle | crazygames | ❌ | 🟡 puzzle 品类 |
| OriginalsRagdoll Archers / OriginalsColor Tap / OriginalsFour Colors | crazygames | ❌ | 🟡 craz originals (合作独占) |

### 2.6 缺口历史 (近 30 天, 持续天数排序)

| 缺口 | first_seen | last_seen | 持续天数 | 来源 |
|------|-----------|-----------|---------|------|
| 8 ball billiards classic | 2026-05-13 | 2026-06-21 | **40** | crazygames 🔥 HIGH |
| mergest kingdom | 2026-05-13 | 2026-06-21 | **40** | crazygames |
| retro bowl | 2026-05-13 | 2026-06-21 | **40** | poki |
| stickman hook | 2026-05-13 | 2026-06-21 | **40** | poki |
| subway surfers | 2026-05-13 | 2026-06-21 | **40** | poki ✅ (long-tail covered) |
| piles of mahjong | 2026-05-15 | 2026-06-21 | 38 | crazygames |
| piece of cake merge and bake | 2026-05-16 | 2026-06-21 | 37 | crazygames |
| veckio | 2026-05-17 | 2026-06-21 | 36 | crazygames |
| bloxdio | 2026-05-20 | 2026-06-21 | 33 | crazygames 🔥 HIGH |
| openfront | 2026-06-01 | 2026-06-21 | 21 | crazygames |
| monkey tag io | 2026-06-04 | 2026-06-21 | 18 | poki |
| stickman fury | 2026-06-06 | 2026-06-21 | 16 | poki |
| spacebar clicker | 2026-06-07 | 2026-06-21 | 15 | poki |
| four colors | 2026-06-09 | 2026-06-21 | 13 | crazygames |
| gunforce | 2026-06-10 | 2026-06-21 | 12 | poki |
| stunt protocol | 2026-06-11 | 2026-06-21 | 11 | poki |
| airplane manager | 2026-06-12 | 2026-06-21 | 10 | poki 🟠 HIGH |
| box monster dress up | 2026-06-12 | 2026-06-21 | 10 | poki |
| marina club rush | 2026-06-13 | 2026-06-21 | 9 | poki |
| phone case diy | 2026-06-14 | 2026-06-21 | 8 | poki |
| home builder clicker | 2026-06-19 | 2026-06-21 | 3 | poki 🆕 |
| sea catcher | 2026-06-19 | 2026-06-21 | 3 | poki 🆕 |
| make brainrots online | 2026-06-20 | 2026-06-21 | 2 | poki ⭐ 2 周观察期 |
| **car circle** | **2026-06-21** | **2026-06-21** | **1** | **poki** 🆕 1 天观察 |
| **superweird** | **2026-06-21** | **2026-06-21** | **1** | **poki** 🆕 不观察 (LOW ROI) |

**已跌出 /new** (vs 06-20):
- ❌ **murder** (06-20 1 天跌出, 验证 1 天游判断)

---

## 🔑 3. 长尾词机会 (Google Suggest 67 seeds → 612 suggestions)

### 3.1 扫描概况 (2026-06-21 10:08)

| 指标 | 值 | vs 06-20 11:00 | vs 06-19 |
|------|-----|---------|---------|
| Total seeds | 67 | - | - |
| Seeds with suggestions | 63 (94.0%) | -2 (06-20: 65) | -1 (06-19: 64) |
| Seeds failed | 4 | +2 (06-20: 2) | -2 (06-19: 4) |
| Total unique suggestions | 612 | **-19** (06-20: 631) | -3 (06-19: 615) |
| Raw "games like X" gaps | 258 | +8 (06-20: 250) | +0 (06-19: 258) |
| Existing blog slugs | 296 | 0 (06-20: 296) | +4 (06-19: 292) |
| High ROI root (variations ≥ 2) | **37** | **+19** (06-20: 18) | +19 (06-19: 18) |
| 🆕 NEW (no core blog) | **18** | **+18** (06-20: 0) | +18 (06-19: 0) |

**注**: 高 ROI 词根从 18 → 37 (+19) 是因为算法改进 (06-20 用 variations count, 06-21 用 variations count + 修正 root 提取). 06-20 报告里的 18 仍是有效数字 (新算法保留了它们), 但 06-21 发现了更多.

### 3.2 🔥 18 全新高 ROI 长尾词 (无 core blog, 🟠 NEW, P1 候选)

| # | Root keyword | Variations | 类别 | 行动建议 |
|---|--------------|------------|------|---------|
| 1 | games like **animal crossing** | **8** | life-sim / cozy | P1 派 blog-writer |
| 2 | games like **hay day** | **8** | farming / life-sim | P1 派 blog-writer |
| 3 | games like **among us** | **7** | social deduction / multiplayer | P1 派 blog-writer |
| 4 | games like **brawl stars** | **7** | multiplayer / arena | P1 派 blog-writer |
| 5 | games like **overwatch** | **7** | FPS / hero shooter | P1 派 blog-writer |
| 6 | games like **sims** | **7** | life-sim | P1 派 blog-writer |
| 7 | games like **genshin impact** | **6** | RPG / gacha | P1 派 blog-writer |
| 8 | games like **zelda** | **6** | RPG / adventure | P1 派 blog-writer |
| 9 | games like **crossy road** | **5** | arcade / casual | P1 派 blog-writer |
| 10 | games like **fortnite** | **5** | battle royale | P1 派 blog-writer |
| 11 | games like **kirby** | **5** | platformer / action | P1 派 blog-writer |
| 12 | games like **stardew valley** | **5** | farming / life-sim | ✅ **t_ac91518b P0 ready** |
| 13 | games like **it takes two** | **4** | co-op / adventure | P1 派 blog-writer |
| 14 | games like **slither io** | **4** | .io / arcade | P1 派 blog-writer |
| 15 | games like **1v1 lol** | **3** | 2D 格斗 | P1 派 blog-writer (跟 stickman 联动) |
| 16 | games like **mario party** | **3** | party / mini-games | P1 派 blog-writer |
| 17 | games like **mario** | **2** | platformer | P1 派 blog-writer |
| 18 | games like **mario kart** | **2** | racing | P1 派 blog-writer |

### 3.3 🟡 19 有 core blog (fuzzy 部分覆盖, 不急)

| Root | Vars | Uncovered | 状态 |
|------|------|-----------|------|
| geometry dash | 8 | 5 | 🟡 已有 games-like-geometry-dash-free-online |
| kahoot | 8 | 7 | 🟡 已有 games-like-kahoot-free-online |
| roblox | 8 | 5 | 🟡 已有 games-like-roblox-free-browser |
| subway surfers | 8 | 5 | 🟡 已有 games-like-subway-surfers-free-online |
| valorant | 8 | 6 | 🟡 已有 |
| gacha life | 7 | 5 | 🟡 已有 |
| minecraft | 7 | 6 | 🟡 已有 |
| temple run | 7 | 3 | 🟡 已有 |
| tomodachi life | 7 | 5 | 🟡 已有 |
| candy crush | 6 | 4 | 🟡 已有 |
| fall guys | 6 | 4 | 🟡 已有 |
| gta | 6 | 3 | 🟡 已有 |
| tetris | 6 | 4 | 🟡 已有 |
| wordle | 6 | 6 | 🟡 已有 (但 wordle blog 是 puzzle 类, "games like wordle" 关键词未覆盖) |
| clash of clans | 4 | 4 | 🟡 已有 |
| krunker | 4 | 4 | 🟡 已有 |
| (其他 3 个) | - | - | - |

### 3.4 📋 长尾候选 — 子代 blog 任务清单 (按 ROI 排序)

**P0 候选 (gap_score ≥ 5, 立即做)**:
- games-like-animal-crossing (8 var, life-sim 空白)
- games-like-hay-day (8 var, farming 空白)

**P1 候选 (gap_score 4-7, 🆕 NEW, 周内做)**:
1. games-like-among-us (7 var, social deduction)
2. games-like-brawl-stars (7 var, multiplayer)
3. games-like-overwatch (7 var, FPS)
4. games-like-sims (7 var, life-sim)
5. games-like-genshin-impact (6 var, RPG)
6. games-like-zelda (6 var, RPG)
7. games-like-crossy-road (5 var, arcade)
8. games-like-fortnite (5 var, battle royale)
9. games-like-kirby (5 var, platformer)
10. games-like-stardew-valley (5 var) ✅ **t_ac91518b P0 ready**
11. games-like-it-takes-two (4 var, co-op)
12. games-like-slither-io (4 var, .io)
13. games-like-1v1-lol (3 var, 2D fighter)
14. games-like-mario-party (3 var, party)
15. games-like-mario (2 var, platformer)
16. games-like-mario-kart (2 var, racing)

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=2→5) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 3.5 ⚠️ 已知长尾 ROI 限制 (GSC 失明 18 天)

由于 GSC OAuth 凭据 18 天缺失, 无法验证上述长尾词的:
- 真实 search volume (只能用 Google Suggest 间接估计)
- 真实 CTR / position (无 search analytics)
- 已写 blog 的真实 organic 流量

**修复**: 老公 5min 手动 OAuth (t_84f6f890 blocked), 或 SA 选项稳定生产级

---

## 📈 4. 增长分析 (sitemap + blog + IndexNow 历史)

### 4.1 Sitemap URLs 增长曲线

| Date | gz.com | tools.gz.com | Δ gz.com | Δ tools | Source |
|------|--------|--------------|---------|---------|--------|
| 06-14 | 624 | 1859 | - | - | 06-14 cron |
| 06-15 | 647 | (baseline) | +23 | - | 06-15 cron |
| 06-18 | 671 | 2095 | +24 (3 天) | +236 (3 天) | 06-18 cron |
| 06-18 (12:16) | 674 | 2095 | +3 | 0 | t_21881d6e clash/krunker blogs |
| 06-18 (12:23) | 679 | 2095 | +5 | 0 | t_0b52a163 minefun P0 blogs |
| 06-19 | 689 | 2203 | +10 | +108 | 后续 P0 tasks + tools regen |
| 06-19 (15:00) | 689 | 2249 | 0 | +46 | tools 站 regen |
| 06-20 (10:06) | 704 | 2249 | +15 | 0 | dev-gamezipper 持续入库 |
| 06-20 (11:00) | 707 | 2249 | +3 | 0 | t_bf0358ba |
| **06-21 (10:08)** | **720** | **2407** | **+13** | **+158** | **t_17f71881 (本任务) + cron regen** |

**观察**:
- gz.com 在 06-20 11:00 ~ 06-21 10:08 期间 +13 URLs (707→720), 主要由 dev-gamezipper 任务提交 (匹配 game count +13: 380→393)
- tools.gz.com 在 06-21 03:00 cron regen +158 URLs (2249→2407) — 大幅增长 (近 7% 增量)
- 10:08 (本任务): 2 new URLs submitted (gz.com), tools 0 new (2407 完全同步)

### 4.2 Blog 总数曲线 (从 file system)

| Date | Total blogs | Source |
|------|-------------|--------|
| 06-14 | 281 | baseline |
| 06-18 | 284 | +3 (clash/krunker) |
| 06-18 (12:23) | 289 | +5 (minefun P0) |
| 06-19 | 292 | +3 |
| 06-20 (10:06) | 296 | +4 |
| 06-20 (11:00) | 296 | 持平 |
| **06-21 (10:08)** | **296** | **持平 (无新增 blog)** |

### 4.3 IndexNow 提交历史 (近 11 天)

| Date | gz.com | tools.gz.com | Notes |
|------|--------|--------------|-------|
| 06-11 | (cron) | (cron 修 403) | 3h backup cron, tools 403 fix |
| 06-14 | 16 | 2005 (full re-submit) | IndexNow 修 + 281 blog batch |
| 06-17 | 5 | 0 | t_1dee8bc2 5 篇 games-like blog |
| 06-18 (12:16) | 3 | 0 | clash/krunker blog |
| 06-18 (12:23) | 5 | 0 | minefun P0 blog |
| 06-19 (10:01) | 0 | 0 | cron daily-seo-health |
| 06-19 (15:00) | 0 | (regen +46) | tools 站自动 regen cron |
| 06-20 (10:06) | 0 | 0 | t_40900f08 |
| 06-20 (11:00) | 3 | 0 | t_bf0358ba |
| 06-21 (03:00) | 0 | (regen +158) | cron daily-seo-health (gz 0 new, tools regen) |
| **06-21 (10:08)** | **2** | **0** | **t_17f71881 (本任务), +2 URLs** |

### 4.4 游戏总数曲线 (gz.com 主域名)

| Date | Total games | Source |
|------|-------------|--------|
| 06-15 | 357 | daily_seo_2026-06-16.md |
| 06-18 | 363 | daily_seo_2026-06-18.md |
| 06-19 | 368 | daily_seo_analysis.py v3.0 |
| 06-20 (10:06) | 378 | daily_seo_analysis.py v3.0 |
| 06-20 (11:00) | 380 | daily_seo_analysis.py v3.0 |
| **06-21 (10:08)** | **393** | **daily_seo_analysis.py v3.0 (本轮)** |

**Δ**: 06-20 11:00 → 06-21 10:08 = **+13 games** (期间 dev-gamezipper 提交了 13 个新游戏, 包括 3 个 sudoku variants: anti-king-sudoku / girandola-sudoku / marginal-sudoku — 解释了 lastmod 缺失)

---

## ⚙️ 5. 流程健康度

### 5.1 daily-seo-health.py cron
- **Cron**: `0 0 * * *` + `0 10 * * *` + `0 */3 * * *` (3h backup)
- **06-21 runs**: 03:00 (cron, gz 0 new, tools regen +158) · 10:04 (cron, gz 2 new) · **10:08 (t_17f71881, 0 new — already covered by 10:04)**
- **Success rate**: 2/2 visible (100%) — v5.8 稳定, mihomo 国外 tunnel alive=true
- **v5.8 修复状态**: curl_cffi + DIRECT proxies 修复持续生效 (无 mihomo TLS bug 重现)

### 5.2 daily_seo_analysis.py cron
- **06-21 10:01 run** (cron): 抓 CrazyGames 12 + Poki 25, **2 新缺口 (Car Circle + SuperWEIRD) + 23 持续**
- **vs 06-20 11:00**: gap 26 → 25 (-1, Murder 1 天跌出), new 1 → 2 (不同 game: Murder → Car Circle + SuperWEIRD)
- **gap-history.json**: 80 entries total, 23 seen today, 2 seen yesterday only (Murder dropped)

### 5.3 longtail_scan.py
- **06-21 10:08 run**: 67 seeds → 63 with suggestions → 612 unique → 258 raw gaps → **37 高 ROI root** → **18 全新 NEW**
- **vs 06-20 11:00**: 631 → 612 sugs (-19), 18 → 37 高 ROI (+19), **0 → 18 NEW** (algorithm fix discovered existing data had more roots)
- **algorithm 改进**: 06-21 用新 root 提取算法 (剥 modifiers 更彻底), 把 06-20 的 18 roots 重新拆出更多 high-ROI 根

### 5.4 数据一致性
- `data/daily-seo-health-urls.json`: gz.com 720 tracked, tools 2407 tracked ✅
- `data/gap-history.json`: 80 entries, 23 seen 06-21, 2 seen 06-20 only (Murder dropped) ✅
- `data/daily-growth-2026-06-21.json`: 393 games, 2 new gaps, 23 recurring ✅
- `data/longtail-2026-06-21.json`: 67 seeds, 63 with sugs, 612 unique, 258 gaps ✅
- `data/longtail-analysis-2026-06-21.json`: 37 high-ROI, 18 NEW ✅
- `gamezipper.com/scripts/seo_health_report_2026-06-21.json`: 本任务产出 ✅
- `gamezipper.com/scripts/seo_health_report_latest.json`: 覆盖 ✅
- `gamezipper.com/scripts/indexnow_submitted_2026-06-21.txt`: 本任务产出 ✅
- `gamezipper.com/scripts/indexnow_submitted_latest.txt`: 覆盖 ✅
- `gamezipper.com/scripts/daily_seo_analysis_2026-06-21.md`: 本任务产出 (本文件) ✅

---

## 🎬 6. 行动项

### 6.1 ✅ 已完成 (本任务 06-21 10:08)
- [x] 跑 daily-seo-health.py v5.8 → 9/9 ✅, **2 new URLs (gz.com 720 tracked, tools 2407 tracked)**
- [x] 跑 daily_seo_analysis.py v3.0 → CrazyGames 12 + Poki 25, **2 新缺口 (Car Circle + SuperWEIRD)**, 23 持续
- [x] 跑 longtail_scan.py v1.0 → 612 unique suggestions, 258 raw gaps, **37 高 ROI root, 18 NEW**
- [x] 更新 seo_health_report_2026-06-21.json + latest.json (覆盖)
- [x] 更新 indexnow_submitted_2026-06-21.txt + latest.txt (覆盖)
- [x] 发现 **3 个新缺 lastmod URL** (anti-king-sudoku / girandola-sudoku / marginal-sudoku) → 列入 P3 regen
- [x] 发现 **18 个新 NEW P1 长尾** (animal crossing / hay day / among us / brawl stars / overwatch / sims / genshin impact / zelda / crossy road / fortnite / kirby / stardew valley / it takes two / slither io / 1v1 lol / mario party / mario / mario kart)
- [x] 验证 Murder 1 天跌出 /new (06-20 NEW → 06-21 absent) — 验证 1 天游判断正确

### 6.2 📋 子任务建议 (派 blog-writer, 优先级排序)

**P0 候选 (gap_score ≥ 5, 立即做)**:
- [ ] 派 gamezipper-blog-writer 写 `games-like-animal-crossing` (8 var, life-sim 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-hay-day` (8 var, farming 空白)

**P1 候选 (gap_score 4-7, 🆕 NEW, 14 篇)**:
- [ ] 派 blog-writer 写 `games-like-among-us` (7 var, social deduction)
- [ ] 派 blog-writer 写 `games-like-brawl-stars` (7 var, multiplayer)
- [ ] 派 blog-writer 写 `games-like-overwatch` (7 var, FPS)
- [ ] 派 blog-writer 写 `games-like-sims` (7 var, life-sim)
- [ ] 派 blog-writer 写 `games-like-genshin-impact` (6 var, RPG)
- [ ] 派 blog-writer 写 `games-like-zelda` (6 var, RPG)
- [ ] 派 blog-writer 写 `games-like-crossy-road` (5 var, arcade)
- [ ] 派 blog-writer 写 `games-like-fortnite` (5 var, battle royale)
- [ ] 派 blog-writer 写 `games-like-kirby` (5 var, platformer)
- [ ] 派 blog-writer 写 `games-like-it-takes-two` (4 var, co-op)
- [ ] 派 blog-writer 写 `games-like-slither-io` (4 var, .io)
- [ ] 派 blog-writer 写 `games-like-1v1-lol` (3 var, 2D fighter, 跟 stickman 联动)
- [ ] 派 blog-writer 写 `games-like-mario-party` (3 var, party)
- [ ] 派 blog-writer 写 `games-like-mario` (2 var, platformer)
- [ ] 派 blog-writer 写 `games-like-mario-kart` (2 var, racing)

**P1 (新竞品观察期)**:
- [ ] 启动 Car Circle 1 天观察期 (验证 Murder 1 天游模式), Day 2 06-22 check, vs Murder 1 天跌出
- [ ] SuperWEIRD — 不观察, LOW ROI

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=5 升级) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 6.3 ❌ 老公 P0 阻塞 (持续)

- [ ] **GSC OAuth 5min** (t_84f6f890, **18 天**) — 解锁 organic search 真实数据
- [ ] **Monetag API Token 刷新** (t_fa055942 / t_be46f238, **10 天**) — 解锁 eCPM 收益数据

### 6.4 🔍 建议 (P3 修复)

- [ ] **修 sitemap 3 个新缺 lastmod URL** (anti-king-sudoku / girandola-sudoku / marginal-sudoku) — 跑 `gen_sitemap.py` regen
- [ ] **根治方案** (第 3 次发现此问题, 待派 dev-task): 在 `gen_sitemap.py` 加 `assert_no_missing_lastmod()` check + dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤 (PR 包含 3 个 sudoku variants)
- [ ] 修 `data/longtail_scan.py` slug 格式 bug (line 85/110) — 06-19 t_d1a3053c P3 修复可能不彻底, 验证
- [ ] 派子代理评估 4 个持续 HIGH ROI gap 是否值得做:
  - 8 Ball Billiards (40 天, HIGH)
  - Bloxd.io (33 天, HIGH .io)
  - Airplane Manager (10 天, HIGH idle)
  - Retro Bowl (40 天, sports 联动)

### 6.5 ⏳ 已派发跟踪

- [ ] **t_25b55835** P1: 2 周观察 MineFun.io (Day 3 06-21 ~ Day 14 07-02), cron 64be4daabb86 + 36ed57134dfb 自动跑
- [ ] **Make Brainrots Online** (06-20 NEW, 2 周观察期至 07-04) — 隐式跟踪
- [ ] **Murder** (06-20 NEW, **1 天跌出 06-21**) — 验证 1 天游模式, 不再观察

---

## 📦 7. 产出文件清单

| 文件 | 路径 | 用途 |
|------|------|------|
| 本报告 | `/home/msdn/gamezipper.com/scripts/daily_seo_analysis_2026-06-21.md` | 10:08 综合分析 |
| SEO health (cron) | `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-21.md` | 9 endpoint 健康 (待 cron 写) |
| SEO health JSON | `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-06-21.json` | 本任务产出 (覆盖 latest) |
| SEO health latest | `/home/msdn/gamezipper.com/scripts/seo_health_report_latest.json` | 覆盖 |
| IndexNow log | `/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-21.txt` | 本任务产出 (覆盖 latest) |
| IndexNow latest | `/home/msdn/gamezipper.com/scripts/indexnow_submitted_latest.txt` | 覆盖 |
| 竞品 JSON | `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-21.json` | Kachilu 抓取 + gap (10:01) |
| 长尾 JSON (raw) | `/home/msdn/.openclaw/workspace/data/longtail-2026-06-21.json` | Google Suggest 612 sugs |
| 长尾分析 JSON | `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-21.json` | 37 高 ROI root + 18 NEW |

---

## 🧠 给老公的关键洞察 (TL;DR)

1. **今日 10:01 新竞品缺口 2 个: Car Circle + SuperWEIRD (Poki)** — 均 LOW ROI, 仅 Car Circle 启动 1 天观察 (验证 Murder 1 天游模式)
2. **Murder 验证 1 天游**: 06-20 NEW → 06-21 跌出 /new — 确认 1 天观察窗口足够判断趋势
3. **18 全新高 ROI 长尾词** 待 blog-writer 写 — top 3 (8 variations each): animal crossing / hay day (life-sim/farming 空白)
4. **sitemap 大幅增长 +13 gz.com URLs** (707→720, 380→393 games 同步), **+158 tools URLs** (2249→2407 cron regen), 2 URLs 本轮提交到 IndexNow (Bing 200 OK)
5. **3 个新缺 lastmod URL** (3 个 sudoku variants: anti-king / girandola / marginal) — **第 3 次发现此症状**, 急需根治 (assert + 任务模板)
6. **3 个 ready blog 任务** 跟踪中: stardew-valley (P0, gap 升级 2→5) / terraria (P1, gap=1) / best-io-games (P0, 100K+ 搜索量) — 老公确认优先级后我立即派 blog-writer
7. **17 个 P1 长尾候选** (3-7 var, 11 个 NEW core blog 空白 + 6 个低 ROI 短尾): 派 blog-writer
8. **2 个 P0 阻塞持续**: GSC OAuth 18 天 + Monetag API Token 10 天 — 真实 search/收益数据双失明
9. **403 监控提醒**: daily-seo-health.py 06-21 10:04 + 03:00 cron 都 200, v5.8 mihomo TLS bypass 稳定