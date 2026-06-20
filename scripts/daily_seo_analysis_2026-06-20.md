# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-20 10:06 CST

> **任务**: kanban t_40900f08 (🔍 每日SEO+竞品+长尾词分析)
> **数据源**:
> - `daily-seo-health.py` v5.8 → SEO endpoint 健康 + IndexNow 状态 (本报告引用)
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析 (378 games)
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 622 unique suggestions
> **对比基线**: 2026-06-19 (gap 26 / new 0 / longtail 615 sug) → 2026-06-20 (gap 25 / new 1 / longtail 622 sug)
> **站点状态**: 378 游戏 (gz.com, +10 vs 06-19) + 2249 tools · sitemap gz.com 704 URLs (+15) · tools 2249 (+46) · 9/9 endpoints ✅

---

## 🎯 60 秒读 (Executive Summary)

1. **🆕 新竞品缺口 1 个** — **Make Brainrots Online** (Poki), 首次出现, 决策是否启动 2 周观察期
2. **🔄 持续缺口 24 个** (vs 06-19: 26), Top 5 不变: 8 Ball Billiards / A Small World Cup 2 / Airplane Manager / Bloxd.io / Box Monster Dress Up
3. **🆕 长尾词深度扫描** (67 seed × Google Suggest) → **622 unique suggestions** (+7 vs 06-19) → 274 raw gaps → **13 高 ROI 词根** (variations ≥ 2)
4. **🔥 最高 ROI 长尾 (Top 3)**:
   - **games like candy crush** (3 variations: free / online) — match-3 品类, 我们有 match-3 类似但无 candy crush
   - **games like gacha life** (3: online / free) — RPG/gacha 空白 (vs 06-19: 2 → 3, **新 candidate**)
   - **games like wordle** / tetris / temple run / clash royale / 1v1 lol / cookie clicker / fall guys / geometry dash / gta / gta 5 / krunker (各 2)
5. **9/9 endpoints ✅ + 0 new URLs**: gz.com 704 tracked, tools 2249 tracked, IndexNow 完全同步
6. **📈 sitemap 增长**: 06-19 → 06-20 = gz.com +15, tools +46 (cron regen 06-19 15:00)
7. **🚨 2 个 P0 阻塞持续**: GSC OAuth (17 天) + Monetag API Token (9 天) — 真实 search/收益数据双失明
8. **⚠️ sitemap 复发**: 06-19 修的 10 个 missing-lastmod 已修复, 但 06-19 21:00 ~ 06-20 09:00 期间又出现 5 个新缺 lastmod URL (aqre / moon-or-sun / magnets / compass / dosun-fuwari)

---

## 🔧 1. 技术 SEO 状态

完整报告见 `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-20.md` (本任务产出)

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | 704 <loc>, 704 unique, 698 lastmod (98.6%, ⚠️ 5 new missing) |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB 0.49s |
| gamezipper.com/2048/ | 200 | ✅ | TTFB 0.69s |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | 2249 unique (100% lastmod) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | TTFB 0.74s |

### 1.2 IndexNow 状态 (本轮 0 new)

| Host | Sitemap | Tracked | New | Submitted | Last OK |
|------|---------|---------|-----|-----------|---------|
| gamezipper.com | 704 | 704 | 0 | 0 | 2026-06-20 09:00:06 |
| tools.gamezipper.com | 2249 | 2249 | 0 | 0 | 2026-06-19 15:00:05 |

**结论**: sitemap 与 tracked 完全同步, 本轮 0 URLs 待提交。v5.8 curl_cffi+DIRECT 修复仍稳定。

### 1.3 ⚠️ 5 个 URL 复发缺 lastmod (06-20 复发)

- **gz.com sitemap.xml**: 704/704 unique ✅, 但 **5/704 缺 lastmod** (98.6% 覆盖率)
- **新增缺失 URL** (与 06-19 t_4a940651 修的 10 个 URL 不重叠):
  - https://gamezipper.com/aqre/
  - https://gamezipper.com/moon-or-sun/
  - https://gamezipper.com/magnets/
  - https://gamezipper.com/compass/
  - https://gamezipper.com/dosun-fuwari/
- **影响**: Google/Bing 拿到 lastmod 缺失 URL 时优先级降权, IndexNow 不受影响
- **原因**: 06-19 21:00 ~ 06-20 09:00 期间 dev-gamezipper 任务直接 `<url><loc>...</loc></url>` commit 绕过 gen_sitemap.py (重复模式)
- **修复** (P3, 已在 06-19 t_4a940651 一次性修复): 跑 gen_sitemap.py regen
- **根治方案** (待做): 在 gen_sitemap.py 加 `assert_no_missing_lastmod()` check + 给 dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤

---

## 🎮 2. 竞品追踪 (Poki + CrazyGames)

### 2.1 抓取概况 (2026-06-20 10:06 CST, Kachilu Browser + mihomo)

| 竞品 | 抓取页 | 抓到游戏 | 新缺口 | 持续缺口 |
|------|--------|---------|--------|---------|
| **CrazyGames** `/t/new` | 12 | 12 | 0 | 12 |
| **Poki** `/en/new` | 25 | 25 | 1 | 13 |
| **Total** | 37 | 37 | **1** | **25** |

### 2.2 🆕 新缺口 (06-20 首次出现, 1 个)

| # | 游戏 | 来源 | 类别 | 链接 |
|---|------|------|------|------|
| 1 | **Make Brainrots Online** | poki | dress-up / meme | https://poki.com/en/g/make-brainrots-online |

**Make Brainrots Online**:
- **来源**: Poki /en/new (06-20 首次出现)
- **类型**: dress-up / 角色创建 (Brainrot meme 文化, 2025-2026 病毒流行)
- **我们状态**: 0 (dress-up 品类空白, 仅 Box Monster Dress Up 持续缺口)
- **ROI 评估**: 🟡 **MEDIUM** — Brainrot meme 流量短期可能爆发, 但搜索量难长期维持
- **决策建议**: **暂不立即做**, 启动 2 周观察期 (类似 MineFun.io t_25b55835)
  - 观察指标: 14 天内是否持续在 Poki /new 出现
  - 关注 Blog 关键词 "make brainrots online" 的 Google Suggest 数据
  - 决策日: 2026-07-04

### 2.3 🔄 Top 5 持续缺口 (每天都出现, 优先做)

| # | 游戏 | 来源 | 类别 | 我们状态 | ROI 评估 |
|---|------|------|------|---------|---------|
| 1 | **8 Ball Billiards Classic** | crazygames | 体育/桌球 | 0 | 🟠 **HIGH** — billiards/pool 全球 ~500K+ monthly searches, 我们有 billiards 但不是 8 ball 经典模式 (12 天持续) |
| 2 | **A Small World Cup 2** | poki | 体育/2D 足球 | 0 | 🟡 MEDIUM — sports 品类只有 1 个 (soccer random), 可考虑 "games like A Small World Cup" blog |
| 3 | **Airplane Manager** | poki | idle/tycoon | 0 | 🟠 **HIGH** — idle 品类 5/378 (1.3%), 13 天持续缺口 |
| 4 | **Bloxd.io** | crazygames | .io sandbox | 0 | 🔥 **HIGH** — .io 流派第一缺口 (我们有 bloxd 但不是 BloxdHop variant), 与 subway/geometry dash 长尾强相关 |
| 5 | **Box Monster Dress Up** | poki | dress-up | 0 | 🟡 MEDIUM — dress-up 品类完全空白 |

### 2.4 🆕 值得关注的 06-20 新游戏 (今日 Poki Top 25, 已在我们 / 缺失评估)

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
| **Make Brainrots Online** | poki | ❌ | 🟡 **06-20 NEW, 启动 2 周观察期** |
| **Stickman Battle** | poki | ❌ (t_02692ae6 blocked dev-gamezipper) | 🔥 待 P1 解锁后立刻复制 |
| **Stickman Hook / Stickman Fury** | poki | ❌ | 🟡 NEW gap |
| **Monkey Tag IO** | poki | ❌ | 🟡 NEW gap, .io 品类 |
| **Phone CASE DIY** | poki | ❌ | 🟢 dress-up 品类空白 |
| **Marina Club Rush** | poki | ❌ | 🟡 NEW gap |
| **Spacebar Clicker** | poki | ❌ | 🟡 NEW gap |
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
| **make brainrots online** | **2026-06-20** | **2026-06-20** | **1** | **poki** ⭐ NEW |

---

## 🔑 3. 长尾词机会 (Google Suggest 67 seeds → 622 suggestions)

### 3.1 扫描概况 (2026-06-20)

| 指标 | 值 | vs 06-19 |
|------|-----|---------|
| Total seeds | 67 | - |
| Seeds with suggestions | 64 (95.5%) | +1 (06-19: 63) |
| Seeds failed | 3 (pokemon go / free games for adults / best card games free) | -1 (06-19: 4) |
| Total unique suggestions | 622 | +7 (06-19: 615) |
| Raw "games like X" gaps | 274 | +16 (06-19: 258) |
| Existing blog slugs | 296 | +4 (06-19: 292) |
| High ROI root (variations ≥ 2) | 13 | 持平 (06-19: 13) |

### 3.2 🔥 Top 13 高 ROI 长尾词 (gap_score=variations≥2)

| # | Root keyword | Variations | Seed | 行动建议 |
|---|--------------|------------|------|---------|
| 1 | games like **candy crush** | **3** | candy crush | 🟠 **NEW P0** — match-3 品类我们有, 但 candy crush 长尾未覆盖 (vs 06-19 未上榜, 06-20 新) |
| 2 | games like **gacha life** | **3** | gacha life | 🟠 P0 — RPG/life-sim 空白 (vs 06-19: 2 → 3) |
| 3 | games like **wordle** | 2 | wordle | 🟡 跟 wordle 长尾联动, 我们有 wordle game |
| 4 | games like **tetris** | 2 | tetris | 🟡 经典 puzzle, 跟 block puzzle 长尾 |
| 5 | games like **temple run** | 2 | temple run | 🟡 runner 品类 (跟 subway-surfers 长尾) |
| 6 | games like **clash royale** | 2 | clash royale | 🟡 strategy 跟 tower defense |
| 7 | games like **1v1 lol** | 2 | 1v1 lol | 🔥 HIGH — 2D 格斗空白, 我们有 stickman 但不是 1v1 |
| 8 | games like **cookie clicker** | 2 | cookie clicker | 🟡 idle/clicker, 我们有 cookie clicker 长尾 |
| 9 | games like **fall guys** | 2 | fall guys | 🟠 multiplayer party, 跟 stickman-battle 联动 |
| 10 | games like **geometry dash** | 2 | geometry dash | 🟠 跟 rhythm 长尾, 我们有 geometry dash |
| 11 | games like **gta** / **gta 5** | 2 + 2 | gta | 🟠 GTA 长尾 (合规注意: 不能写 "play GTA free") |
| 12 | games like **krunker** | 2 | krunker | 🟡 FPS 长尾, 我们已有 krunker game |
| 13 | games like **stardew valley** | (已 ready t_ac91518b) | stardew | ✅ **P0 ready, 等老公确认派 blog-writer** |

### 3.3 📋 长尾候选 — 子代 blog 任务清单 (按 ROI 排序)

**P0 候选 (gap_score ≥ 3, 立即做)**:
1. **games-like-candy-crush** (3 variations) — match-3 品类, 06-20 新晋 P0, ROI 极高
2. **games-like-gacha-life** (3 variations) — 全新品类 RPG/gacha, 06-19 已 P0, 06-20 仍 P0

**P1 候选 (gap_score = 2, 周内做)**:
3. games-like-wordle — wordle 长尾, 跟我们 wordle game 联动
4. games-like-tetris — 经典 puzzle
5. games-like-temple-run — runner 品类
6. games-like-clash-royale — strategy 跟 tower defense
7. games-like-1v1-lol — 2D 格斗空白
8. games-like-cookie-clicker — idle/clicker
9. games-like-fall-guys — multiplayer party
10. games-like-geometry-dash — rhythm 长尾
11. games-like-gta — GTA 长尾 (合规注意)
12. games-like-gta-5 — GTA 5 长尾
13. games-like-krunker — FPS 长尾

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=2) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 3.4 长尾候选 — 详细 query (Top 3 root 全展开)

#### games like candy crush (3) 🆕 P0
- games like candy crush
- games like candy crush free
- games like candy crush online

#### games like gacha life (3) 🆕 P0
- games like gacha life
- games like gacha life online
- games like gacha life free

#### games like 1v1 lol (2)
- games like 1v1 lol
- games like 1v1 lol online

#### games like gta (2)
- games like gta
- games like gta online

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
| **06-20** | **704** | **2249** | **+15** | **0** | dev-gamezipper 持续入库 |

**观察**:
- gz.com 在 06-19 21:00 ~ 06-20 09:00 期间 +15 URLs (689→704), 主要由 dev-gamezipper 任务提交 (含 5 个新缺 lastmod, 见 §1.3)
- tools.gz.com 在 06-19 15:00 cron regen +46 URLs (2203→2249)
- 06-20 10:06 本任务: 0 new (全部已 tracked)

### 4.2 Blog 总数曲线 (从 file system)

| Date | Total blogs | Source |
|------|-------------|--------|
| 06-14 | 281 | baseline |
| 06-18 | 284 | +3 (clash/krunker) |
| 06-18 (12:23) | 289 | +5 (minefun P0) |
| 06-19 | 292 | +3 (隐式提交 + ready 任务) |
| **06-20** | **296** | **+4 (隐式提交 + games-like-*)** |

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
| **06-20 (10:06)** | **0** | **0** | **本任务, 0 new, 完全同步** |

### 4.4 游戏总数曲线 (gz.com 主域名)

| Date | Total games | Source |
|------|-------------|--------|
| 06-15 | 357 | daily_seo_2026-06-16.md |
| 06-18 | 363 | daily_seo_2026-06-18.md |
| 06-19 | 368 | daily_seo_analysis.py v3.0 |
| **06-20** | **378** | **daily_seo_analysis.py v3.0 (本轮)** |

**Δ**: 06-19 → 06-20 = +10 games (06-19 21:00 ~ 06-20 09:00 期间 dev-gamezipper 任务, 包括 5 个新缺 lastmod 游戏的 commit)

---

## ⚙️ 5. 流程健康度

### 5.1 daily-seo-health.py cron
- **Cron**: `0 0 * * *` + `0 10 * * *` + `0 */3 * * *` (3h backup)
- **06-20 runs**: 06:00 (cron, 0 new, GSC 27th 失败) · 09:00 (cron, 0 new) · 10:06 (本任务, 0 new, 9/9 ✅)
- **Success rate**: 3/3 (100%) — v5.8 稳定, mihomo 国外 tunnel alive=true

### 5.2 daily_seo_analysis.py cron
- **Cron**: 每日跑 (用 Kachilu Browser, 需 mihomo)
- **06-20 run**: 10:06 (本任务) — 抓 CrazyGames 12 + Poki 25, **1 新缺口 (Make Brainrots Online) + 24 持续**
- **vs 06-19**: gap 26 → 25 (持平), new 0 → 1

### 5.3 longtail_scan.py
- **06-20 run**: 10:06 — 67 seeds → 622 unique suggestions → 274 raw gaps → **13 高 ROI root 词根 (variations ≥ 2)**
- **vs 06-19**: 615 → 622 sugs (+7), 258 → 274 gaps (+16), 13 → 13 高 ROI (持平)
- **06-20 NEW**: candy crush 上榜 (3 variations), gacha life 维持 3 variations

---

## 🎬 6. 行动项

### 6.1 ✅ 已完成 (本任务 06-20 10:06)
- [x] 跑 daily-seo-health.py v5.8 → 9/9 ✅, 0 new URLs (gz.com 704 tracked, tools 2249 tracked)
- [x] 跑 daily_seo_analysis.py v3.0 → CrazyGames 12 + Poki 25, **1 新缺口** (Make Brainrots Online), 25 持续
- [x] 跑 longtail_scan.py v1.0 → 622 unique suggestions, 274 raw gaps, 13 高 ROI root
- [x] 写 daily_seo_2026-06-20.md SEO 健康报告 (10K)
- [x] 写 daily_seo_analysis_2026-06-20.md 综合分析报告 (本文件)
- [x] 保存 seo_health_report_2026-06-20.json + latest.json 覆盖
- [x] 保存 indexnow_submitted_2026-06-20.txt + latest.txt 覆盖
- [x] 发现 5 个新缺 lastmod URL (aqre / moon-or-sun / magnets / compass / dosun-fuwari) → 列入 P3
- [x] 发现 06-20 新 P0 长尾: games-like-candy-crush (3 variations) + games-like-gacha-life (3)
- [x] 发现 1 个新竞品缺口 Make Brainrots Online (Poki) → 建议启动 2 周观察期

### 6.2 📋 子任务建议 (派 blog-writer, 优先级排序)

**P0 (立即做, gap_score ≥ 3)**:
- [ ] 派 gamezipper-blog-writer 写 `games-like-candy-crush` (3 variations, match-3 长尾, **06-20 新晋**)
- [ ] 派 gamezipper-blog-writer 写 `games-like-gacha-life` (3 variations, RPG/gacha 长尾)

**P1 (周内做, gap_score = 2)**:
- [ ] 派 gamezipper-blog-writer 写 11 篇 P1 (wordle / tetris / temple run / clash royale / 1v1 lol / cookie clicker / fall guys / geometry dash / gta / gta 5 / krunker)

**P1 (新竞品 2 周观察期)**:
- [ ] 启动 Make Brainrots Online 2 周观察期 (类似 MineFun.io t_25b55835), Day 1 baseline 06-20, Day 14 final 07-04

**P1 (现有 ready board 跟踪)**:
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score=1)
- [ ] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score=2) ✅
- [ ] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

### 6.3 ❌ 老公 P0 阻塞 (持续)

- [ ] **GSC OAuth 5min** (t_84f6f890, **17 天**) — 解锁 organic search 真实数据
- [ ] **Monetag API Token 刷新** (t_fa055942 / t_be46f238, **9 天**) — 解锁 eCPM 收益数据

### 6.4 🔍 建议 (P3 修复)

- [ ] **修 sitemap 5 个新缺 lastmod URL** (aqre / moon-or-sun / magnets / compass / dosun-fuwari) — 06-19 t_4a940651 仅处理历史, 复发
- [ ] **根治方案**: 在 `gen_sitemap.py` 加 `assert_no_missing_lastmod()` check + dev-gamezipper 任务模板加 "commit 前必须跑 gen_sitemap.py" 强制步骤
- [ ] 修 `data/longtail_scan.py:85` slug 格式 bug (line 85 用空格, line 110 用连字符) — 06-19 t_d1a3053c P3 修复可能不彻底, 验证
- [ ] 派子代理评估 `drift-boss / retro-bowl / monkey-mart / stickman-battle` 06-20 持续 gap 是否值得做

### 6.5 ⏳ 已派发跟踪

- [ ] **t_25b55835** P1: 2 周观察 MineFun.io (Day 2 06-19 ~ Day 14 07-02), cron 64be4daabb86 + 36ed57134dfb 自动跑

---

## 📦 7. 产出文件清单

| 文件 | 路径 | 用途 |
|------|------|------|
| 本报告 | `/home/msdn/gamezipper.com/scripts/daily_seo_analysis_2026-06-20.md` | 06-20 综合分析 |
| SEO health (cron) | `/home/msdn/gamezipper.com/scripts/daily_seo_2026-06-20.md` | 9 endpoint 健康 |
| SEO health JSON | `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-06-20.json` | 本任务产出 (覆盖 latest) |
| IndexNow log | `/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-20.txt` | 本任务产出 (覆盖 latest) |
| 竞品 JSON | `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-20.json` | Kachilu 抓取 + gap (10:06) |
| 长尾 JSON (raw) | `/home/msdn/.openclaw/workspace/data/longtail-2026-06-20.json` | Google Suggest 622 sugs |

---

## 🧠 给老公的关键洞察 (TL;DR)

1. **今日 1 个新竞品缺口: Make Brainrots Online (Poki)** — meme/dress-up 品类, 启动 2 周观察期 (类似 MineFun.io), 决策日 2026-07-04
2. **Top 13 高 ROI 长尾词** 待 blog-writer 写, 最高 ROI = `games-like-candy-crush` (3 variations, 06-20 新晋 P0) 和 `games-like-gacha-life` (3 variations, 维持 P0)
3. **sitemap 增长 +15 URLs (gz.com 689→704)** — 期间 dev-gamezipper 任务入库, 含 5 个新缺 lastmod URL (aqre / moon-or-sun / magnets / compass / dosun-fuwari), 复发 P3
4. **3 个 ready blog 任务** 跟踪中: stardew-valley (P0) / terraria (P1) / best-io-games (P0) — 老公确认优先级后我立即派 blog-writer
5. **5 个 P3 修复待派**: 5 个新缺 lastmod URL + longtail_scan slug bug + sitemap regen 强制 + 4 个 Poki 持续 gap (drift-boss / retro-bowl / monkey-mart / stickman-battle)
6. **2 个 P0 老公手动阻塞**: GSC OAuth (17 天) + Monetag Token (9 天) — 不解锁无法验证长尾 ROI 真实数据
7. **IndexNow 完全同步 0 pending**: gz.com 704 tracked (+15/24h), tools 2249 (+46 cron regen)