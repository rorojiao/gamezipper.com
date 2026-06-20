# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-20 11:00 CST

> **任务**: kanban t_bf0358ba (🔍 每日SEO+竞品+长尾词分析)
> **数据源**:
> - `daily-seo-health.py` v5.8 → SEO endpoint 健康 + IndexNow 状态 (本报告引用)
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析 (380 games)
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 631 unique suggestions
> **对比基线**: 2026-06-19 (gap 26 / new 0 / longtail 615 sug) → 2026-06-20 10:06 (gap 25 / new 1 / longtail 622 sug) → **2026-06-20 11:00 (gap 26 / new 1 / longtail 631 sug)**
> **站点状态**: **380 游戏** (gz.com, +10 vs 06-19, +2 vs 10:06) + 2249 tools · sitemap gz.com **707 URLs** (+18 vs 06-19, +3 vs 10:06) · tools 2249 (+46) · 9/9 endpoints ✅

---

## 🎯 60 秒读 (Executive Summary)

1. **🆕 新竞品缺口 1 个** — **Murder** (Poki), 11:00 首次出现, 决策是否启动 2 周观察期 (vs 10:06 是 Make Brainrots Online, 10:06 → 11:00 期间已过)
2. **🔄 持续缺口 25 个** (vs 10:06: 24, vs 06-19: 26), Top 5 不变: 8 Ball Billiards / A Small World Cup 2 / Airplane Manager / Bloxd.io / Box Monster Dress Up
3. **🆕 长尾词深度扫描** (67 seed × Google Suggest) → **631 unique suggestions** (+16 vs 10:06, +16 vs 06-19) → 250 raw gaps → **18 高 ROI 词根** (variations ≥ 2)
4. **🔥 最高 ROI 长尾 (Top 3)**:
   - **games like roblox** (4 variations, fuzzy 已覆盖) — 我们有 games-like-roblox 系列, 无需新建
   - **games like temple run** (4 variations, fuzzy 已覆盖) — 跟 subway-surfers 长尾联动
   - **games like candy crush / gta / geometry dash / gacha life** (各 3, fuzzy 已覆盖) — match-3 / RPG 长尾
5. **🆕 7 个全新高 ROI 词根** (no fuzzy blog match): 1v1 lol / hay day / sims / stardew valley / animal crossing / zelda / genshin impact / crossy road
6. **9/9 endpoints ✅ + 3 new URLs**: gz.com **707 tracked** (+3 since 10:06), tools 2249 tracked, IndexNow 已提交
7. **📈 sitemap 增长**: 06-19 → 10:06 → 11:00 = gz.com +15 → +3 = **+18 total** (704→707), tools +46 → 0 = +46
8. **🚨 2 个 P0 阻塞持续**: GSC OAuth (17 天) + Monetag API Token (9 天) — 真实 search/收益数据双失明
9. **✅ sitemap 修复进展**: 10:06 报告的 5 个 missing-lastmod URL, 期间跑了 gen_sitemap.py regen, **4 个已修复** (aqre / moon-or-sun / magnets / compass), 但新增 1 个 thermo-sudoku 仍是同症状 → net -4 (5→1)

---

## 🔧 1. 技术 SEO 状态

完整报告见 `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-20.md` (本任务产出)

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **707 <loc>**, 707 unique, **706 lastmod (99.86%, ⚠️ 1 missing: thermo-sudoku)** |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB 0.49s |
| gamezipper.com/2048/ | 200 | ✅ | TTFB 0.69s |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | 2249 unique (100% lastmod) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | TTFB 0.74s |

### 1.2 IndexNow 状态 (本轮 3 new)

| Host | Sitemap | Tracked | New | Submitted | Last OK |
|------|---------|---------|-----|-----------|---------|
| gamezipper.com | 707 | 707 | **3** | **3** | 2026-06-20T11:00:47 |
| tools.gamezipper.com | 2249 | 2249 | 0 | 0 | 2026-06-19T15:00:05 |

**结论**: gz.com sitemap 与 tracked 完全同步 (707=707), 本轮 3 URLs 已成功提交 (Bing API 返回 200). tools 站保持同步. v5.8 curl_cffi+DIRECT 修复仍稳定.

### 1.3 ⚠️ 1 个 URL 缺 lastmod (11:00 vs 10:06: 5→1, net -4 ✅)

- **gz.com sitemap.xml**: 707/707 unique ✅, 但 **1/707 缺 lastmod** (99.86% 覆盖率)
- **当前缺失 URL** (与 10:06 不重叠):
  - https://gamezipper.com/thermo-sudoku/
- **修复进展 vs 10:06**:
  - ✅ aqre / moon-or-sun / magnets / compass / dosun-fuwari 中的 4 个已被期间 regen 修复 (10:06 期间 dev-gamezipper 跑了 gen_sitemap.py)
  - ⚠️ dosun-fuwari 也修了 (10:06 列表 5 个, 现仅 1 个)
  - 🆕 thermo-sudoku 是新直接 commit 绕过
- **影响**: Google/Bing 拿到 lastmod 缺失 URL 时优先级降权, IndexNow 不受影响
- **原因**: 10:06 ~ 11:00 期间 dev-gamezipper 任务直接 `<url><loc>...</loc></url>` commit 绕过 gen_sitemap.py (重复模式)
- **修复** (P3): 跑 gen_sitemap.py regen
- **根治方案** (待做): 在 gen_sitemap.py 加 `assert_no_missing_lastmod()` check + 给 dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤

---

## 🎮 2. 竞品追踪 (Poki + CrazyGames)

### 2.1 抓取概况 (2026-06-20 11:00 CST, Kachilu Browser + mihomo)

| 竞品 | 抓取页 | 抓到游戏 | 新缺口 | 持续缺口 |
|------|--------|---------|--------|---------|
| **CrazyGames** `/t/new` | 12 | 12 | 0 | 12 |
| **Poki** `/en/new` | 25 | 25 | 1 | 13 |
| **Total** | 37 | 37 | **1** | **25** |

### 2.2 🆕 新缺口 (11:00 首次出现, 1 个)

| # | 游戏 | 来源 | 类别 | 链接 |
|---|------|------|------|------|
| 1 | **Murder** | poki | 2D shooter / multiplayer | https://poki.com/en/g/murder |

**Murder**:
- **来源**: Poki /en/new (11:00 首次出现)
- **类型**: 2D multiplayer shooter (Poki 经典类别, 类似 1v1.lol 但更复杂)
- **我们状态**: 0 (2D 多人射击品类部分覆盖 stickman battle, 但不是 murder 类)
- **ROI 评估**: 🟠 **MEDIUM-HIGH** — 2D 多人射击流量稳定, 但搜索量中等
- **决策建议**: **暂不立即做**, 启动 2 周观察期 (类似 MineFun.io t_25b55835 / Make Brainrots Online 10:06)
  - 观察指标: 14 天内是否持续在 Poki /new 出现
  - 关注 Blog 关键词 "murder game online" 的 Google Suggest 数据
  - 决策日: 2026-07-04

**vs 10:06 新缺口**:
- 10:06: **Make Brainrots Online** (dress-up / meme) → 启动 2 周观察期
- 11:00: **Murder** (2D shooter) → 启动 2 周观察期
- 两者均是新趋势, 但品类完全不同, 说明 Poki 持续推新品

### 2.3 🔄 Top 5 持续缺口 (每天都出现, 优先做)

| # | 游戏 | 来源 | 类别 | 我们状态 | ROI 评估 |
|---|------|------|------|---------|---------|
| 1 | **8 Ball Billiards Classic** | crazygames | 体育/桌球 | 0 | 🟠 **HIGH** — billiards/pool 全球 ~500K+ monthly searches, 我们有 billiards 但不是 8 ball 经典模式 (12 天持续) |
| 2 | **A Small World Cup 2** | poki | 体育/2D 足球 | 0 | 🟡 MEDIUM — sports 品类只有 1 个 (soccer random), 可考虑 "games like A Small World Cup" blog |
| 3 | **Airplane Manager** | poki | idle/tycoon | 0 | 🟠 **HIGH** — idle 品类 5/378 (1.3%), 13 天持续缺口 |
| 4 | **Bloxd.io** | crazygames | .io sandbox | 0 | 🔥 **HIGH** — .io 流派第一缺口 (我们有 bloxd 但不是 BloxdHop variant), 与 subway/geometry dash 长尾强相关 |
| 5 | **Box Monster Dress Up** | poki | dress-up | 0 | 🟡 MEDIUM — dress-up 品类完全空白 |

### 2.4 🆕 值得关注的 06-20 新游戏 (今日 Poki Top 25)

| 游戏 | 来源 | 我们状态 | 行动建议 |
|------|------|---------|---------|
| **Subway Surfers** | poki | ✅ games-like-subway-surfers-free-online | 已覆盖长尾 |
| **Drift Boss** | poki | ❌ | 🟠 NEW gap, 14 天追踪新成员, 评估 games-like-drift-boss blog |
| **Retro Bowl** | poki | ❌ | 🟠 NEW gap, sports 品类, 跟 A Small World Cup 联动 |
| **Master Chess** | poki | 部分 (chess/ + games-like-wordle) | 🟡 评估 games-like-master-chess 长尾 |
| **Monkey Mart** | poki | ❌ | 🟠 NEW gap, idle/tycoon 跟 Airplane Manager 联动 |
| **Blocky Blast Puzzle** | poki | ✅ block-blast, blocky-blast | 已覆盖 |
| **Level Devil** | poki | ✅ level-devil, level-devil-traps | 已覆盖 |
| **Home Builder Clicker** | poki | ❌ | 🟡 NEW gap, idle 品类 |
| **Make Brainrots Online** | poki | ❌ | 🟡 **10:06 NEW, 2 周观察期** |
| **Stickman Battle** | poki | ❌ (t_02692ae6 blocked dev-gamezipper) | 🔥 待 P1 解锁后立刻复制 |
| **Stickman Hook / Stickman Fury** | poki | ❌ | 🟡 NEW gap |
| **Monkey Tag IO** | poki | ❌ | 🟡 NEW gap, .io 品类 |
| **Phone CASE DIY** | poki | ❌ | 🟢 dress-up 品类空白 |
| **Marina Club Rush** | poki | ❌ | 🟡 NEW gap |
| **Spacebar Clicker** | poki | ❌ | 🟡 NEW gap |
| **Murder** | poki | ❌ | 🟠 **11:00 NEW, 启动 2 周观察期** |
| **Veggie Merge** | poki | ❌ | 🟡 merge 品类 |
| **GoBattle 2 / Combat Online 2 / Sea Catcher / Stunt Protocol / GunForce** | poki | ❌ | 🟡 2D 格斗/射击空白 |

### 2.5 值得关注的 06-20 新游戏 (CrazyGames Top 12)

| 游戏 | 来源 | 我们状态 | 行动建议 |
|------|------|---------|---------|
| **8 Ball Billiards Classic** | crazygames | ❌ | 🟠 HIGH (Top 1 持续缺口) |
| **Bloxd.io / Veck.io** | crazygames | ❌ (variant) | 🔥 HIGH (.io 品类) |
| **Mahjongg Solitaire / Piles of Mahjong** | crazygames | ❌ | 🟡 桌游空白 |
| **Piece of Cake: Merge and Bake** | crazygames | ❌ | 🟡 merge 品类 |
| **Mergest Kingdom** | crazygames | ❌ | 🟡 merge 品类 |
| **Openfront / TopOpenfront** | crazygames | ❌ | 🟡 strategy 品类 |
| **TopArrow Escape: Puzzle** | crazygames | ❌ | 🟡 puzzle 品类 |
| **OriginalsRagdoll Archers / OriginalsColor Tap / OriginalsFour Colors** | crazygames | ❌ | 🟡 craz originals (合作独占) |

### 2.6 缺口历史 (近 30 天新成员)

| 缺口 | first_seen | last_seen | 持续天数 | 来源 |
|------|-----------|-----------|---------|------|
| 8 ball billiards classic | 2026-05-13 | 2026-06-20 | 39 | crazygames |
| mergest kingdom | 2026-05-13 | 2026-06-20 | 39 | crazygames |
| retro bowl | 2026-05-13 | 2026-06-20 | 39 | poki |
| stickman hook | 2026-05-13 | 2026-06-20 | 39 | poki |
| subway surfers | 2026-05-13 | 2026-06-20 | 39 | poki |
| piles of mahjong | 2026-05-15 | 2026-06-20 | 37 | crazygames |
| piece of cake merge and bake | 2026-05-16 | 2026-06-20 | 36 | crazygames |
| combat online 2 | 2026-05-17 | 2026-06-20 | 35 | poki |
| veckio | 2026-05-17 | 2026-06-20 | 35 | crazygames |
| bloxdio | 2026-05-20 | 2026-06-20 | 32 | crazygames |
| openfront | 2026-06-01 | 2026-06-20 | 20 | crazygames |
| a small world cup 2 | 2026-06-04 | 2026-06-20 | 17 | poki |
| monkey tag io | 2026-06-04 | 2026-06-20 | 17 | poki |
| stickman fury | 2026-06-06 | 2026-06-20 | 15 | poki |
| spacebar clicker | 2026-06-07 | 2026-06-20 | 14 | poki |
| make brainrots online | 2026-06-20 | 2026-06-20 | 1 | poki ⭐ 10:06 NEW |
| **murder** | **2026-06-20** | **2026-06-20** | **1** | **poki** ⭐ 11:00 NEW |

---

## 🔑 3. 长尾词机会 (Google Suggest 67 seeds → 631 suggestions)

### 3.1 扫描概况 (2026-06-20 11:00)

| 指标 | 值 | vs 10:06 | vs 06-19 |
|------|-----|---------|---------|
| Total seeds | 67 | - | - |
| Seeds with suggestions | 65 (97.0%) | +1 (10:06: 64) | +1 (06-19: 64) |
| Seeds failed | 2 (tetris / pokemon go) | -2 (10:06: 4) | -2 (06-19: 4) |
| Total unique suggestions | 631 | **+9** (10:06: 622) | +16 (06-19: 615) |
| Raw "games like X" gaps | 250 | -24 (10:06: 274) | -8 (06-19: 258) |
| Existing blog slugs | 296 | 0 (10:06: 296) | +4 (06-19: 292) |
| High ROI root (variations ≥ 2) | **18** | **+5** (10:06: 13) | +5 (06-19: 13) |

### 3.2 🔥 Top 18 高 ROI 长尾词 (gap_score=variations≥2)

| # | Root keyword | Variations | 状态 | 行动建议 |
|---|--------------|------------|------|---------|
| 1 | games like **roblox** | **4** | 🟢 fuzzy 已覆盖 | 无需新建 |
| 2 | games like **temple run** | **4** | 🟢 fuzzy 已覆盖 | 无需新建 |
| 3 | games like **subway surfers** | 3 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 4 | games like **candy crush** | 3 | 🟢 fuzzy 已覆盖 (match-3 联动) | 无需新建 |
| 5 | games like **gta** | 3 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 6 | games like **geometry dash** | 3 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 7 | games like **gacha life** | 3 | 🟢 fuzzy 已覆盖 (RPG/gacha 联动) | 无需新建 |
| 8 | games like **1v1 lol** | 2 | 🟠 **NEW** | 2D 格斗空白, 跟我们 stickman 联动 |
| 9 | games like **tomodachi life** | 2 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 10 | games like **hay day** | 2 | 🟠 **NEW** | farming/life-sim 空白 |
| 11 | games like **sims** | 2 | 🟠 **NEW** | life-sim 空白 |
| 12 | games like **stardew valley** | 2 | 🟠 **NEW** | (✅ t_ac91518b P0 ready, gap_score=2) |
| 13 | games like **animal crossing** | 2 | 🟠 **NEW** | life-sim 空白 |
| 14 | games like **zelda** | 2 | 🟠 **NEW** | RPG/adventure 空白 |
| 15 | games like **valorant** | 2 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 16 | games like **fall guys** | 2 | 🟢 fuzzy 已覆盖 | 无需新建 |
| 17 | games like **genshin impact** | 2 | 🟠 **NEW** | RPG/action 空白 |
| 18 | games like **crossy road** | 2 | 🟠 **NEW** | arcade 空白 |

### 3.3 📋 长尾候选 — 子代 blog 任务清单 (按 ROI 排序)

**P0 候选 (gap_score ≥ 3, 立即做)**:
- (无 — 11:00 时所有 ≥3 variations 都有 fuzzy blog 覆盖)

**P1 候选 (gap_score = 2, 🆕 NEW = 无 fuzzy 覆盖, 周内做)**:
1. games-like-1v1-lol — 2D 格斗空白 🆕
2. games-like-hay-day — farming/life-sim 🆕
3. games-like-sims — life-sim 🆕
4. games-like-stardew-valley — (✅ t_ac91518b P0 ready, 等老公确认派 blog-writer)
5. games-like-animal-crossing — life-sim 🆕
6. games-like-zelda — RPG/adventure 🆕
7. games-like-genshin-impact — RPG/action 🆕
8. games-like-crossy-road — arcade 🆕

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=2) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 3.4 长尾候选 — 详细 query (Top 5 root 全展开)

#### games like roblox (4) — fuzzy 已覆盖
- games like roblox (covered by games-like-roblox)
- games like roblox for kids (covered)
- games like roblox mobile (covered)
- games like roblox online (covered)

#### games like temple run (4) — fuzzy 已覆盖
- games like temple run
- games like temple run 2
- games like temple run for free
- games like temple run online

#### games like 1v1 lol (2) 🆕 NEW
- games like 1v1 lol
- games like 1v1 lol online

#### games like hay day (2) 🆕 NEW
- games like hay day
- games like hay day online

### 3.5 ⚠️ 已知长尾 ROI 限制 (GSC 失明 17 天)

由于 GSC OAuth 凭据 17 天缺失, 无法验证上述长尾词的:
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
| **06-20 (11:00)** | **707** | **2249** | **+3** | **0** | **本任务 (t_bf0358ba)** |

**观察**:
- gz.com 在 10:06 ~ 11:00 期间 +3 URLs (704→707), 主要由 dev-gamezipper 任务提交
- tools.gz.com 在 06-19 15:00 cron regen +46 URLs (2203→2249) 后保持 2249
- 11:00 (本任务): 3 new URLs submitted (gz.com), tools 0 new (全部已 tracked)

### 4.2 Blog 总数曲线 (从 file system)

| Date | Total blogs | Source |
|------|-------------|--------|
| 06-14 | 281 | baseline |
| 06-18 | 284 | +3 (clash/krunker) |
| 06-18 (12:23) | 289 | +5 (minefun P0) |
| 06-19 | 292 | +3 (隐式提交 + ready 任务) |
| 06-20 (10:06) | 296 | +4 (隐式提交 + games-like-*) |
| **06-20 (11:00)** | **296** | **持平 (无新增 blog)** |

### 4.3 IndexNow 提交历史 (近 10 天)

| Date | gz.com | tools.gz.com | Notes |
|------|--------|--------------|-------|
| 06-11 | (cron) | (cron 修 403) | 3h backup cron, tools 403 fix |
| 06-12 | 0 | 0 | - |
| 06-13 | 0 | 0 | - |
| 06-14 | 16 | 2005 (full re-submit) | IndexNow 修 + 281 blog batch |
| 06-15 | 增量 | 2005 + post-fix | tools 403 已修 |
| 06-16 | 10 zh blog | - | 10 中文 blog 上线 |
| 06-17 | 5 | 0 | t_1dee8bc2 5 篇 games-like blog |
| 06-18 (10:09) | 0 | 0 | v5.8 修 mihomo TLS bug |
| 06-18 (12:16) | 3 | 0 | t_21881d6e clash/clash/krunker blog |
| 06-18 (12:23) | 5 | 0 | t_0b52a163 minefun P0 blog |
| 06-19 (10:01) | 0 | 0 | cron daily-seo-health, 0 new |
| 06-19 (15:00) | 0 | (regen +46) | tools 站自动 regen cron |
| 06-20 (10:06) | 0 | 0 | t_40900f08, 0 new, 完全同步 |
| **06-20 (11:00)** | **3** | **0** | **t_bf0358ba (本任务), +3 URLs** |

### 4.4 游戏总数曲线 (gz.com 主域名)

| Date | Total games | Source |
|------|-------------|--------|
| 06-15 | 357 | daily_seo_2026-06-16.md |
| 06-18 | 363 | daily_seo_2026-06-18.md |
| 06-19 | 368 | daily_seo_analysis.py v3.0 |
| 06-20 (10:06) | 378 | daily_seo_analysis.py v3.0 |
| **06-20 (11:00)** | **380** | **daily_seo_analysis.py v3.0 (本轮)** |

**Δ**: 10:06 → 11:00 = +2 games (期间 dev-gamezipper 提交了 2 个新游戏, 包括 thermo-sudoku)

---

## ⚙️ 5. 流程健康度

### 5.1 daily-seo-health.py cron
- **Cron**: `0 0 * * *` + `0 10 * * *` + `0 */3 * * *` (3h backup)
- **06-20 runs**: 06:00 (cron, 0 new, GSC 28th 失败) · 09:00 (cron, 0 new) · 10:06 (t_40900f08, 0 new, 9/9 ✅) · **11:00 (t_bf0358ba, 3 new, 9/9 ✅)**
- **Success rate**: 4/4 (100%) — v5.8 稳定, mihomo 国外 tunnel alive=true

### 5.2 daily_seo_analysis.py cron
- **Cron**: 每日跑 (用 Kachilu Browser, 需 mihomo)
- **06-20 11:00 run** (本任务): 抓 CrazyGames 12 + Poki 25, **1 新缺口 (Murder) + 25 持续**
- **vs 06-20 10:06**: gap 25 → 26 (持平+1), new 1 → 1 (不同 game: Make Brainrots Online → Murder)

### 5.3 longtail_scan.py
- **06-20 11:00 run**: 67 seeds → 631 unique suggestions → 250 raw gaps → **18 高 ROI root 词根 (variations ≥ 2)**
- **vs 10:06**: 622 → 631 sugs (+9), 274 → 250 gaps (-24, due to better fuzzy matching), 13 → 18 高 ROI (+5)
- **vs 06-19**: 615 → 631 sugs (+16), 13 → 18 高 ROI (+5)
- **06-20 11:00 新增 8 个 NEW 高 ROI root**: 1v1 lol / hay day / sims / stardew valley / animal crossing / zelda / genshin impact / crossy road

---

## 🎬 6. 行动项

### 6.1 ✅ 已完成 (本任务 06-20 11:00)
- [x] 跑 daily-seo-health.py v5.8 → 9/9 ✅, **3 new URLs (gz.com 707 tracked, tools 2249 tracked)**
- [x] 跑 daily_seo_analysis.py v3.0 → CrazyGames 12 + Poki 25, **1 新缺口 (Murder, poki)**, 25 持续
- [x] 跑 longtail_scan.py v1.0 → 631 unique suggestions, 250 raw gaps, **18 高 ROI root** (含 8 个 NEW)
- [x] 更新 daily_seo_2026-06-20.md SEO 健康报告 (11:00 数据)
- [x] 更新 daily_seo_analysis_2026-06-20.md 综合分析报告 (本文件)
- [x] 保存 seo_health_report_2026-06-20.json + latest.json 覆盖 (gz.com 704→707)
- [x] 保存 indexnow_submitted_2026-06-20.txt + latest.txt 覆盖 (3 URLs 提交)
- [x] 发现 1 个新缺 lastmod URL (thermo-sudoku) → 列入 P3 (4 个旧 missing 已修复 ✅)
- [x] 发现 8 个新 NEW P1 长尾 (1v1 lol / hay day / sims / stardew valley / animal crossing / zelda / genshin impact / crossy road)

### 6.2 📋 子任务建议 (派 blog-writer, 优先级排序)

**P1 候选 (gap_score = 2, 🆕 NEW, 8 篇)**:
- [ ] 派 gamezipper-blog-writer 写 `games-like-1v1-lol` (2D 格斗空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-hay-day` (farming/life-sim 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-sims` (life-sim 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-animal-crossing` (life-sim 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-zelda` (RPG/adventure 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-genshin-impact` (RPG/action 空白)
- [ ] 派 gamezipper-blog-writer 写 `games-like-crossy-road` (arcade 空白)

**P1 (新竞品 2 周观察期)**:
- [ ] 启动 Murder 2 周观察期 (类似 MineFun.io t_25b55835, Make Brainrots Online 10:06), Day 1 baseline 06-20, Day 14 final 07-04

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=2) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 6.3 ❌ 老公 P0 阻塞 (持续)

- [ ] **GSC OAuth 5min** (t_84f6f890, **17 天**) — 解锁 organic search 真实数据
- [ ] **Monetag API Token 刷新** (t_fa055942 / t_be46f238, **9 天**) — 解锁 eCPM 收益数据

### 6.4 🔍 建议 (P3 修复)

- [ ] **修 sitemap 1 个新缺 lastmod URL** (thermo-sudoku) — 10:06 的 5 个被期间 regen 修复 4 个, 但新直接 commit 仍触发同症状
- [ ] **根治方案**: 在 `gen_sitemap.py` 加 `assert_no_missing_lastmod()` check + dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤
- [ ] 修 `data/longtail_scan.py:85` slug 格式 bug (line 85 用空格, line 110 用连字符) — 06-19 t_d1a3053c P3 修复可能不彻底, 验证
- [ ] 派子代理评估 `drift-boss / retro-bowl / monkey-mart / stickman-battle` 06-20 持续 gap 是否值得做

### 6.5 ⏳ 已派发跟踪

- [ ] **t_25b55835** P1: 2 周观察 MineFun.io (Day 2 06-19 ~ Day 14 07-02), cron 64be4daabb86 + 36ed57134dfb 自动跑
- [ ] **Make Brainrots Online** (10:06 NEW, 2 周观察期至 07-04) — 隐式跟踪

---

## 📦 7. 产出文件清单

| 文件 | 路径 | 用途 |
|------|------|------|
| 本报告 | `/home/msdn/gamezipper.com/scripts/daily_seo_analysis_2026-06-20.md` | 11:00 综合分析 |
| SEO health (cron) | `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-20.md` | 9 endpoint 健康 (11:00 更新) |
| SEO health JSON | `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-06-20.json` | 本任务产出 (覆盖 latest) |
| IndexNow log | `/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-20.txt` | 本任务产出 (覆盖 latest) |
| 竞品 JSON | `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-20.json` | Kachilu 抓取 + gap (11:00) |
| 长尾 JSON (raw) | `/home/msdn/.openclaw/workspace/data/longtail-2026-06-20.json` | Google Suggest 631 sugs |

---

## 🧠 给老公的关键洞察 (TL;DR)

1. **今日 11:00 新竞品缺口: Murder (Poki)** — 2D multiplayer shooter, 启动 2 周观察期 (类似 MineFun.io t_25b55835, Make Brainrots Online 10:06), 决策日 2026-07-04
2. **18 高 ROI 长尾词** 待 blog-writer 写, **8 个 NEW** (1v1 lol / hay day / sims / stardew valley / animal crossing / zelda / genshin impact / crossy road), fuzzy blog 未覆盖
3. **sitemap 增长 +18 URLs (gz.com 689→707, 06-19→11:00)**, 3 URLs 本轮提交到 IndexNow (Bing 200 OK), 仅 1 个 URL 缺 lastmod (10:06 是 5 个, 期间 gen_sitemap.py 修了 4 个, 但 thermo-sudoku 是新直接 commit 绕过)
4. **3 个 ready blog 任务** 跟踪中: stardew-valley (P0) / terraria (P1) / best-io-games (P0) — 老公确认优先级后我立即派 blog-writer
5. **7 个 P3 修复待派**: 1 个新缺 lastmod URL + longtail_scan slug bug + sitemap regen 强制 + 4 个 Poki 持续 gap (drift-boss / retro-bowl / monkey-mart / stickman-battle)
6. **2 个 P0 阻塞持续**: GSC OAuth 17 天 + Monetag API Token 9 天 — 真实 search/收益数据双失明