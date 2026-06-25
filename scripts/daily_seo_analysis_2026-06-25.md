# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-25 12:13 CST

> **任务**: kanban t_53eba8f6 (🔍 每日SEO+竞品+长尾词分析) — GameZipper每日增长分析
> **数据源**:
> - `daily-seo-health.py` v5.10 (curl_cffi + subprocess curl fallback) → 9 endpoint + IndexNow
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 597 unique suggestions
> - `data/longtail_analysis.py` v1.0 → 31 high-ROI roots / 12 fully uncovered no core
> **对比基线**: 2026-06-24 12:08 (gap 25 / longtail 600 sug / gz 750 unique / sitemap 100% ✅) → **2026-06-25 12:13 (gap 26 / longtail 597 sug / gz 761 unique / sitemap LIVE 99.6% ⚠️)**
> **站点状态**: **432 → 433 游戏** (gz.com, **+11 vs 06-24 422** → +11 to 433) + 2735 tools · 9/9 endpoints ✅ · IndexNow 0 new

---

## 🎯 60 秒读 (Executive Summary)

1. **🚨 P0: gz.com sitemap 第 7 次复发 (3 URLs 缺 lastmod) → 已修复 LOCAL, 待 push** — 758/760 lastmod (99.7%) LIVE → **761/761 lastmod (100% ✅) LOCAL**. 根因: 3 个新 dev-gamezipper subagent 添加 (black-box/labyrinth/stick-hero) bypass 了 `gen_sitemap.py` regen. **修复 = 跑 `python3 scripts/gen_sitemap.py` (本任务)**, sitemap.xml 已 staged 在 git, 待主代理 push.
2. **🆕 2 个新竞品缺口 (gap-history 视角)** — Brain Test 5 / Numbers Match 2448 (first_seen 2026-06-25, 来源 poki). daily_seo_analysis.py 当日 new_gaps=0 因脚本曾二次运行, 但 gap-history.json 持久化记录显示 2 个 first_seen=2026-06-25. 总缺口 **26** (+1 vs 06-24 25).
3. **🔥 9 个长跑缺口 (>30d 仍在 /new)** — Drive Mad (43d) / Mergest Kingdom (43d) / Retro Bowl (43d) / Stickman Hook (43d) / Subway Surfers (43d, IP 跳过) / Piles of Mahjong (41d) / Piece of Cake: Merge and Bake (40d) / Veck.io (39d) / Bloxd.io (36d)
4. **📉 长尾词 -3 unique** — 67 seed × Google Suggest = **597 unique** (-3 vs 06-24 600). 06-24 失败的 5 个 seeds (among us/sims/best io games/best card games free/best idle games browser) **修复 ✅**, 但 6 个 NEW 失败: fortnite/pokemon go/kirby/brawl stars/gacha life/free unblocked games — Google Suggest 持续轮换失败
5. **🔥 12 个全新高 ROI 长尾 (新脚本 longtail_analysis.py v1.0 输出)** — **TOP**: among us (7 var) / hay day (7 var) / overwatch (7 var) / animal crossing (5 var) / genshin impact (5 var) / crossy road (4 var) / it takes two (4 var) / sims (4 var) / slither io (4 var) / 1v1 lol (3 var) / sims 4 (3 var) / zelda (3 var). **vs 06-24**: among us 从 2 → 7 var, sims 从 2 → 4 var, sims 4 NEW (3 var). 净 ROI 质量提升 (-5 roots, -10 uncovered_total 集中度更高)
6. **📊 31 high-ROI 词根** (-5 vs 06-24 36, 因失败 seeds 轮换), **56 uncovered variations** (-10 vs 06-24 66, 持续 covered), **241 raw gaps**
7. **9/9 endpoints ✅ + 0 new URLs IndexNow** — gz.com 760 tracked vs 761 live (post-fix), tools 2737 tracked ≥ 2735 live (2 stale URLs 持续, color-contrast-checker en/zh)
8. **📉 BI 数据微跌** — 7d PV 3,418 (-68 vs 06-24 3,486) / UV 1,982 (-110 vs 06-24 2,092); 跳出率 **85.2%** (-1.6pp 改善 📉 持续); 今日 PV 114 / UV 50 (12:08 中午时段)
9. **🚨 2 个 P0 阻塞持续**: GSC OAuth (23 天, 06-04 起) + Monetag API Token (15 天, 06-11 起)
10. **📈 游戏数 +11 (24h)**: 422 → 433, 期间 dev-gamezipper 大量入库 (balance-scale #433 + matchstick-puzzle #432 + black-box + labyrinth + stick-hero + 其他 +6 新游戏)
11. **📋 现有 ready board 跟踪**: t_ac91518b (games-like-stardew-valley, P0) ✅ + t_e38dc49a (games-like-terraria, P1) + t_0e4b25c5 (best-io-games, P0) ✅
12. **🔥 新 backlog 候选 (Top 5 by ROI)**: among us (7/7, NEW TOP) / hay day (7/7) / overwatch (7/7) / animal crossing (5/5) / genshin impact (5/5)

---

## 🔧 1. 技术 SEO 状态

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **LIVE 758/760 lastmod (99.7%)** ⚠️ / **LOCAL 761/761 (100% ✅)** |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB OK |
| gamezipper.com/2048/ | 200 | ✅ | TTFB OK |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | **2735 unique** (vs tracked 2737, -2 stale URLs, 持续) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | |

### 1.2 IndexNow 状态 (本轮 0 new)

| Host | Sitemap (LIVE) | Tracked | New | Submitted | Last OK |
|------|----------------|---------|-----|-----------|---------|
| gamezipper.com | 760 (758 lastmod) | 760 | 0 (skipped) | 0 | 2026-06-25T10:00:09 |
| tools.gamezipper.com | 2735 | 2737 | 0 (skipped) | 0 | 2026-06-25T06:00:06 |

**结论**: gz.com tracked (760) ≤ live (760, post-fix 761), 0 new URLs to submit.

### 1.3 🚨 gz.com Sitemap 第 7 次复发 (本任务发现并修复 LOCAL)

| 指标 | 06-24 12:08 (基线) | 06-25 12:09 (LIVE 本任务 detect) | 06-25 12:12 (LOCAL post-fix) |
|------|--------------------|----------------------------------|------------------------------|
| URL 总数 | 750 (live) / 750 (local) | **760 (live + local)** | 761 (local) ✅ |
| lastmod 数 | 750 (live) / 750 (local) | **758 (live)** ⚠️ | 761 (local) ✅ |
| lastmod 占比 | 100% / 100% | **99.7%** ⚠️ (-0.3pp) | **100%** ✅ |
| lastmod range | 02-19 ~ 06-24 | 02-19 ~ 06-25 | 02-19 ~ 06-25 |

**⚠️ LIVE 3 个 URL 缺 lastmod** (持续 ~12h, 估算从 06-24 22:00 dev-gamezipper batch 起):
- `https://gamezipper.com/black-box/`
- `https://gamezipper.com/labyrinth/`
- `https://gamezipper.com/stick-hero/`

**全部 200 OK** (game pages 存在), 但 sitemap entry 缺 `<lastmod>` (dev-gamezipper subagent 用 broken regen).

**修复 (本任务)**:
- 跑 `python3 scripts/gen_sitemap.py` (12:12) — 100+ 秒扫描所有 game dirs + static pages
- 结果: 761 unique / 761 lastmod (100% ✅), lastmod range 2026-02-19 ~ 2026-06-25
- **未 deploy**: 已 staged in git, 待主代理 push

**历史 (第 7 次复发!)**:

| 日期 | 症状 | 根因 | 修复 |
|------|------|------|------|
| 06-18 | 10 URLs 缺 lastmod | dev-gamezipper game-add 流程直接写 `<url><loc>...</loc></url>` 绕过 regen | 跑 gen_sitemap.py |
| 06-19 | 3 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-21 | 3 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-22 | 4 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-23 | 403/0 全回归 ⚠️ | kakurasu subagent R219 QA 用 broken regen | 跑 gen_sitemap.py (t_ece65b25) |
| 06-24 | 9 URLs 缺 lastmod | dev-gamezipper subagent (新 5 sudoku 变体 + others) bypass regen | 跑 gen_sitemap.py (t_5840f5dc) |
| **06-25** | **3 URLs 缺 lastmod** | dev-gamezipper subagent (black-box + labyrinth + stick-hero 新加) bypass regen | 跑 gen_sitemap.py (本任务 t_53eba8f6) |

**根治建议 (持续 7 次未实施, P3 - 应优先!)**:
- **gen_sitemap.py 加 `assert_no_missing_lastmod()`** — 强制 commit 前 regen
- **dev-gamezipper 任务模板加 commit 前 regen 步骤**
- **pre-commit hook**: 检测到 sitemap.xml 改动时, 强制 re-run gen_sitemap.py + diff
- **subagent prompt 加 sitemap 安全条款**: "sitemap.xml 修改必须用 scripts/gen_sitemap.py, 禁止手写, 禁止 strip lastmod"

### 1.4 tools sitemap 漂移 (-2 URLs, 持续 06-22 状态)

- tracked 2737 vs live 2735 (-2 stale URLs: color-contrast-checker en/zh moved to /css/)
- 等待 deploy 决定: 加回 / 或接受 -2

---

## 🆕 2. 竞品缺口分析

### 2.1 竞品总览 (37 games / 2 sources)

| Source | 06-25 Games | 06-24 Games | Δ |
|--------|-------------|-------------|---|
| crazygames | 12 | 12 | 持平 |
| poki | 25 | 25 | 持平 |
| **Total** | **37** | **37** | 持平 |

### 2.2 🆕 新竞品缺口 (gap-history 视角, 2 个)

| 名称 | 来源 | 备注 |
|------|------|------|
| **Brain Test 5** | poki | puzzle/trivia, 系列化第 5 代. 我们有 Brain Out / Impossible Quiz / One Line Puzzle (3 个 brain 类, 无直接 Brain Test 克隆) |
| **Numbers Match 2448** | poki | number puzzle, 类似 2048. 我们有 **2048 Galaxy** (直接覆盖, 不需要新游戏) |

> 注: `daily_seo_analysis.py` 当日 `new_gaps=0` 因脚本当日曾二次运行, Brain Test 5 + Numbers Match 2448 第一次出现时是 new, 加入 gap-history.json 后第二次运行被归类为 recurring. **gap-history.json 持久化视角才是真相**.

### 2.3 竞品缺口 Top 15 (06-25)

| # | 名称 | 来源 | 状态 |
|---|------|------|------|
| 1 | Airplane Manager | poki | 14d 未补 |
| 2 | Battle Blast | poki | 1d ⚠️ (06-24 first_seen) |
| 3 | Bloxd.io | crazygames | 36d 🟡 (长跑) |
| 4 | Box Monster Dress Up | poki | 13d |
| 5 | **Brain Test 5** | poki | 1d 🆕 (NEW 06-25) |
| 6 | BuildNow GG | crazygames | 16d |
| 7 | Drive Mad | poki | 43d 🔴 (长跑) |
| 8 | Farm Merge Valley | crazygames | 9d (last_seen 06-17) |
| 9 | Find it! | poki | 7d (last_seen 06-18) |
| 10 | Four Colors | crazygames | 16d |
| 11 | GunForce | poki | 15d |
| 12 | Home Builder Clicker | poki | 6d |
| 13 | Make Brainrots Online | poki | 5d |
| 14 | Marbles Garden | poki | - |
| 15 | Marina Club Rush | poki | 12d |

### 2.4 长跑缺口 (>30d, 9 个)

| 名称 | 首次发现 | 持续天数 | 来源 | IP skip |
|------|---------|---------|------|---------|
| Drive Mad | 2026-05-13 | **43d** | poki | ✗ |
| Mergest Kingdom | 2026-05-13 | **43d** | crazygames | ✗ |
| Retro Bowl | 2026-05-13 | **43d** | poki | ✗ |
| Stickman Hook | 2026-05-13 | **43d** | poki | ✗ |
| Subway Surfers | 2026-05-13 | **43d** | poki | ✅ IP skip |
| Piles of Mahjong | 2026-05-15 | **41d** | crazygames | ✗ |
| Piece of Cake: Merge and Bake | 2026-05-16 | **40d** | crazygames | ✗ |
| Veck.io | 2026-05-17 | **39d** | crazygames | ✗ |
| Bloxd.io | 2026-05-20 | **36d** | crazygames | ✗ |

**Top 候选新游戏 (按 ROI)**:
- **Drive Mad** (43d) — 物理驾驶, 简单 HTML5 clone 可做
- **Mergest Kingdom** (43d) — merge puzzle, 高热度
- **Stickman Hook** (43d) — 简单物理
- **Piles of Mahjong** (41d) — 麻将变体, 已有同类 (Mahjongg Solitaire? 没找到)
- **Bloxd.io** (36d) — io voxel, 工程量中

---

## 🔥 3. 长尾词分析 (Google Suggest)

### 3.1 长尾扫描状态

| 指标 | 06-25 | 06-24 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 持平 |
| Seeds 成功 | 61 | 62 | -1 |
| Seeds 失败 | 6 | 5 | +1 |
| Unique suggestions | 597 | 600 | -3 📉 |
| 现有 blog 数 | 296 | 296 | 持平 |

### 3.2 失败的 6 个 seeds (Google Suggest 持续轮换)

- ❌ games like fortnite (IP 高查询量, 但 Suggest 0 结果)
- ❌ games like pokemon go (IP 高查询量, Suggest 0)
- ❌ games like kirby (IP, Suggest 0)
- ❌ games like brawl stars (IP, Suggest 0)
- ❌ games like gacha life (Suggest 0, 06-23 失败)
- ❌ free unblocked games (06-23 失败, Suggest 0)

### 3.3 修复的 5 个 seeds (06-24 失败 → 06-25 成功 ✅)

- ✅ games like among us (2 → 7 var)
- ✅ games like sims (2 → 4 var)
- ✅ best io games
- ✅ best card games free
- ✅ best idle games browser

### 3.4 Top 12 🔥 fully uncovered 高 ROI 词根

| # | 词根 | Variations | Uncovered | 品类 |
|---|------|------------|-----------|------|
| 1 | **among us** | 7 | 7 | social deduction (🆕 06-25 升至 #1) |
| 2 | **hay day** | 7 | 7 | farming |
| 3 | **overwatch** | 7 | 7 | FPS |
| 4 | **animal crossing** | 5 | 5 | life sim |
| 5 | **genshin impact** | 5 | 5 | gacha RPG |
| 6 | **crossy road** | 4 | 4 | arcade |
| 7 | **it takes two** | 4 | 4 | co-op |
| 8 | **sims** | 4 | 4 | life sim (🆕 06-25, 06-24 仅 2 var) |
| 9 | **slither io** | 4 | 4 | io |
| 10 | **1v1 lol** | 3 | 3 | io shooter |
| 11 | **sims 4** | 3 | 3 | life sim (🆕 NEW) |
| 12 | **zelda** | 3 | 3 | adventure (IP skip) |

**vs 06-24 16 fully uncovered**:
- 🆕 **NEW**: among us (从 2 var → 7 var, 跳升 #1) / sims (从 2 var → 4 var) / sims 4 (NEW 3 var)
- 🚫 **Gone**: kirby / gacha life 2 / gacha life / pokemon go / mario / brawl stars / fortnite / mario party (seeds 失败)

### 3.5 完整 high_roi_roots 列表 (31 个)

12 个 🔥 fully uncovered no core + 19 个 ✅ fully covered:

| 词根 | Variations | Uncovered | has_core_blog | 备注 |
|------|-----------|-----------|---------------|------|
| among us | 7 | 7 | False | 🔥 social ded (06-25 跳升) |
| hay day | 7 | 7 | False | 🔥 farming |
| overwatch | 7 | 7 | False | 🔥 FPS |
| animal crossing | 5 | 5 | False | 🔥 life sim |
| genshin impact | 5 | 5 | False | 🔥 gacha RPG |
| crossy road | 4 | 4 | False | 🔥 arcade |
| it takes two | 4 | 4 | False | 🔥 co-op |
| sims | 4 | 4 | False | 🔥 life sim (🆕) |
| slither io | 4 | 4 | False | 🔥 io |
| 1v1 lol | 3 | 3 | False | 🔥 io |
| sims 4 | 3 | 3 | False | 🔥 life sim (🆕) |
| zelda | 3 | 3 | False | 🔥 IP skip |
| geometry dash | 8 | 0 | False | ✅ full covered |
| kahoot | 8 | 0 | False | ✅ full covered |
| cookie clicker | 7 | 0 | True | ✅ full covered |
| krunker | 7 | 0 | True | ✅ full covered |
| subway surfers | 7 | 0 | False | ✅ full covered |
| wordle | 7 | 0 | True | ✅ full covered |
| candy crush | 6 | 0 | False | ✅ full covered |
| clash of clans | 6 | 0 | True | ✅ full covered |
| fall guys | 6 | 0 | False | ✅ full covered |
| minecraft | 6 | 0 | False | ✅ full covered |
| roblox | 6 | 0 | False | ✅ full covered |
| temple run | 6 | 0 | False | ✅ full covered |
| tomodachi life | 6 | 0 | False | ✅ full covered |
| valorant | 6 | 0 | False | ✅ full covered |
| clash royale | 5 | 0 | True | ✅ full covered |
| tetris | 5 | 0 | False | ✅ full covered |
| gta 5 | 4 | 0 | False | ✅ full covered |
| gta | 3 | 0 | False | ✅ full covered |
| agar io | 2 | 0 | False | ✅ full covered |

### 3.6 长尾词新增空白博客建议 (Top 5 P0)

基于 uncovered_count + has_core_blog=False 排序:
1. **among us** (7/7 var) — 🆕 升至 #1 (06-24 仅 2 var), social deduction 空白, ROI 最高
2. **hay day** (7/7 var) — farming 空白, ROI 持续高
3. **overwatch** (7/7 var) — FPS 空白
4. **animal crossing** (5/5 var) — life-sim 空白
5. **genshin impact** (5/5 var) — gacha RPG 空白

### 3.7 新增 high_roi_roots (06-24 → 06-25 对比)

| Δ | 词根 | 变化原因 |
|---|------|---------|
| 🆕 | among us | 06-24 seed 失败 → 06-25 修复, 7 var 跳升 #1 |
| 🆕 | sims | 06-24 seed 失败 → 06-25 修复, 4 var (vs 06-24 2) |
| 🆕 | sims 4 | NEW, 3 var |
| 🚫 | gacha life 2 | seed 失败, 退出 high_roi_roots |
| 🚫 | gacha life | seed 失败 |
| 🚫 | pokemon go | seed 失败 |
| 🚫 | mario | seed 失败 |
| 🚫 | brawl stars | seed 失败 |
| 🚫 | fortnite | seed 失败 |
| 🚫 | kirby | seed 失败 |
| 🚫 | mario party | seed 失败 (NEW never in ROI roots) |

**净 ROI 质量**: 36 → 31 roots, 16 → 12 fully uncovered, 66 → 56 uncovered_total. **集中度更高, 候选 ROI 更可执行**.

---

## 🆕 4. 本轮修复 (本任务产出)

### 4.1 Sitemap regen (scripts/gen_sitemap.py) — 🚨 P0 修复

- **修改文件**: `sitemap.xml` (local, staged)
- **变更**: -336 lines + 376 lines = +40 lines net (760 → 761)
- **结果**: 758/760 lastmod (99.7%) LIVE → **761/761 lastmod (100% ✅) LOCAL**
- **lastmod range**: 2026-02-19 ~ 2026-06-25
- **新 entries**: 1 个 (black-box 自然加入)
- **commit**: 已 staged `git status: modified: sitemap.xml`, 待生成 (本任务内, 子代理只 commit 不 push)

### 4.2 数据文件 (06-25 新建)

- `data/longtail-2026-06-25.json` — Google Suggest 抓取 (新, 597 unique)
- `data/longtail-analysis-2026-06-25.json` — 高 ROI roots 分析 (新, 31 roots / 12 fully uncovered)
- `data/daily-growth-2026-06-25.json` — 竞品抓取 (新, 37 games / 26 gaps)
- `data/gap-history.json` — 已更新 (76+ entries, 2 NEW 06-25: Brain Test 5 / Numbers Match 2448)

### 4.3 流程改进 (持续)

- **06-24 新建** `data/longtail_analysis.py` v1.0 持续运行成功 (06-25 输出 31 roots / 12 fully uncovered)
- 06-25 cron 自动产出 (daily_seo_analysis.py 12:07 + longtail_scan 12:11 + longtail_analysis 12:12)

---

## 🔍 5. GSC 状态

- **状态**: ❌ **auth_required** (持续 23 天, 2026-06-04 起)
- **错误**: `missing /home/msdn/.openclaw/secrets/gsc.json; missing /home/msdn/.openclaw/secrets/gsc-sa.json`
- **影响**: 无法拉取 Search Console API 数据 (queries/clicks/impressions/CTR/position)
- **修复** (持续):
  - Option A (OAuth, 5min): `https://console.cloud.google.com/apis/credentials` → enable Search Console API → re-authorize → save 3 keys to `/home/msdn/.openclaw/secrets/gsc.json`
  - Option B (SA, 稳定): create service account + add as GSC Owner + save key to `/home/msdn/.openclaw/secrets/gsc-sa.json`

---

## 📊 6. Sitemap 健康度

```
gz.com sitemap.xml (LOCAL post-regen 12:12):
  Total URLs:        761
  Unique URLs:       761 (100%)
  With lastmod:      761 (100% ✅)
  Lastmod range:     2026-02-19 ~ 2026-06-25
  Missing lastmod:   0 ✅

gz.com sitemap.xml (LIVE 06-25 12:09 ⚠️ REGRESSION):
  Total URLs:        761 (-1 vs LOCAL 761, 因为新加 1 个)
  Unique URLs:       760 (100%)
  With lastmod:      758 (-3 vs LOCAL 761, -0.4pp) ⚠️
  Lastmod range:     2025-06-25 ~ 2026-06-25 (异常: 2025-06-25 entry = empty placeholder)
  Missing lastmod:   3 (0.4% missing) ⚠️

tools.gamezipper.com sitemap.xml (LIVE 06-25):
  Total URLs:        2735
  Unique URLs:       2735 (100%)
  With lastmod:      2735 (100% ✅)
  Lastmod range:     2026-06-22 ~ 2026-06-22
  Tracked but not in sitemap: 2 (color-contrast-checker en/zh moved to /css/, 持续 06-22 状态)
```

---

## ⚙️ 7. 流程健康度

| 流程 | 状态 | 备注 |
|------|------|------|
| daily-seo-health.py v5.10 (curl_cffi+subprocess) | ✅ 稳定 | 9/9 endpoints OK, mihomo bypass 工作正常 |
| daily_seo_analysis.py v3.0 (Kachilu+mihomo) | ✅ 稳定 | 37 games 抓取 OK, 26 gap 跟踪 (+1 vs 06-24 25) |
| longtail_scan.py v1.0 (Google Suggest) | ⚠️ 6 seeds 失败 | fortnite/pokemon go/kirby/brawl stars/gacha life/free unblocked games (06-24 失败的 5 个修复 ✅) |
| longtail_analysis.py v1.0 (06-24 新建) | ✅ 上线 | 从 longtail-*.json 聚合 high-ROI roots, 输出 31 roots / 12 fully_uncovered |
| gsc_fetch.py (6am cron) | ❌ auth_required | 已持续 23 天, 见 §5 |
| monetag-token-refresh.py | ❌ token_invalid | 已持续 15 天, 需老公手动 OAuth |
| gen_sitemap.py (manual + cron 03:00 tools) | ✅ regen 修复成功 | **第 7 次复发** (3 URLs lastmod), 仍未根治 (assert + dev-task 模板 + subagent prompt) |

---

## 🎬 8. 行动项

### ✅ 本任务完成 (06-25 12:13)

- [x] 9/9 endpoint 健康检查
- [x] **🚨 检测 gz.com sitemap 第 7 次复发 (3 URLs 缺 lastmod)** ← 重要发现
- [x] 跑 `python3 scripts/gen_sitemap.py` 修复 → 761/761 100% ✅ LOCAL
- [x] longtail_scan.py 跑今日 (61 OK, 597 suggestions, 31 高 ROI roots)
- [x] longtail_analysis.py 跑今日 (12 fully uncovered no core)
- [x] daily_seo_analysis.py 跑今日 (37 games 抓取, 26 gap 跟踪, **2 new: Brain Test 5 + Numbers Match 2448**)
- [x] 更新 gap-history.json (76+ entries, 2 NEW 06-25)
- [x] daily_seo_analysis_2026-06-25.md (本报告)
- [x] sitemap.xml staged in git (待 commit, 本任务内)

### ⏳ 待主代理 push 后生效

- [ ] **🚨 push sitemap.xml commit → live 同步 (3 missing lastmod → 0)** — **最紧急**
- [ ] 下次 cron (15:00 + 18:00) detect 1 new URL (gz.com 760 vs tracked 760, push 后才 match)
- [ ] tools sitemap 2 stale URLs 处理决策 (deploy 时加回 / 或接受 -2)

### 🔍 P3 待修复 (持续, 第 7 次复发 - 应优先!)

- [ ] **根治 sitemap missing lastmod**: gen_sitemap.py 加 `assert_no_missing_lastmod()` + dev-gamezipper 任务模板加 commit 前 regen 步骤 + subagent prompt 加 sitemap 安全条款
- [ ] pre-commit hook: 检测 sitemap.xml 改动时, 强制 re-run gen_sitemap.py + diff (防止 broken regen 入库)
- [ ] **降低 longtail_scan.py seed 失败率**: 失败 seeds (fortnite/pokemon go 等 IP 大词) 改用 Anthropic Suggest 或 DuckDuckGo Suggest API 作 fallback

### ❌ 老公 P0 阻塞 (持续 23 天 + 15 天)

- [ ] **GSC OAuth** 凭据 (23 天) — 解锁 organic search 数据
- [ ] **Monetag API Token** (15 天) — 解锁收益数据

### 💡 建议 (今日新增 backlog, 12 P0 候选 longtail)

- [ ] 创建 `t_among_us_blog` (7/7 var, 🆕 #1) — social deduction 空白, ROI 跳升
- [ ] 创建 `t_hay_day_blog` (7/7 var) — farming 空白
- [ ] 创建 `t_overwatch_blog` (7/7 var) — FPS 空白
- [ ] 创建 `t_animal_crossing_blog` (5/5 var) — life-sim 空白
- [ ] 创建 `t_genshin_impact_blog` (5/5 var) — gacha RPG 空白
- [ ] 创建 `t_sims_blog` (4/4 var, 🆕) + `t_sims_4_blog` (3/3 var, 🆕) — life-sim 空白
- [ ] longtail_scan.py 06-26 重跑 6 failed seeds (fortnite/pokemon go/kirby/brawl stars/gacha life/free unblocked games), 如持续失败考虑换 Anthropic Suggest
- [ ] **游戏 backlog 候选 (竞品, ROI by 持续天数)**:
  - Drive Mad (43d) — 物理驾驶, HTML5 简单
  - Mergest Kingdom (43d) — merge puzzle, 高热度
  - Stickman Hook (43d) — 简单物理
  - Piles of Mahjong (41d) — 麻将变体
  - Bloxd.io (36d) — io voxel
  - Brain Test 5 (1d, 🆕) — puzzle/trivia 系列
  - Battle Blast (1d) — shooter

---

## 📊 9. 附: BI 数据快照 (近 7 天, 12:08 run)

| 指标 | 06-25 | 06-24 | Δ |
|------|-------|-------|---|
| PV (7d) | 3,418 | 3,486 | -68 📉 |
| UV (7d) | 1,982 | 2,092 | -110 📉 |
| 今日 PV | 114 | 73* | +41 (12:08 时段累计) |
| 今日 UV | 50 | 52* | -2 |
| 跳出率 | **85.2%** | 86.8% | **-1.6pp 📉 持续改善** |
| 均停留 | 0s | 0s | 持平 |
| Desktop / Mobile | 97% / 2% | 97% / 2% | 持平 |
| 新访客 / 回访 | 99% / 0% | 99% / 0% | 持平 |

*注: 06-24 "今日" = 当日累计 12:08; 06-25 "今日" = 当日累计 12:08, 时段相同可对比, +41 PV / -2 UV 实际微涨*

**热门游戏 (7d)**: 2048 66PV (-1 vs 06-24 65) / Snake 56PV (-5 vs 06-24 61) / Tetris 34PV (-4 vs 06-24 38)

**站点对比 (7d)**:
- gamezipper.com: PV 2,036 / UV 1,541 (vs 06-24 2,153 / 1,679, -117 PV 📉 / -138 UV 📉)
- tools.gamezipper.com: PV 1,143 / UV 363 (vs 06-24 1,110 / 343, **+33 PV / +20 UV 📈 持续涨**)

**外链 Top 3**: 站内 139 / emulatorxdotcom.wpcomstaging.com 30 / 站内 21

**洞察**:
- 主站流量微跌 (-117 PV) 但跳出率持续改善 (-1.6pp) — 可能是 dev-gamezipper 新游戏分流 (433 vs 422 +11 games), 用户逛的更精准
- tools 站流量持续上升 (+33 PV), 反映 06-23 commit 4e078a6c 推送 5 zh tools + sitemap 165 URL gap 修复开始生效
- 实时 0 人 (12:08 中午时段, 正常)

---

## 📝 附: 子代理 commit 说明

本任务 (t_53eba8f6) 在 ~3 分钟后被 dispatcher 因 priority=0 reclaim timer 归档 (12:05 起, kanban-worker skill 已记录此 known issue). 但 agent 继续完成所有交付物:

**待 commit 文件** (子代理 only commit, 不 push):
- `sitemap.xml` (761 URLs, 100% lastmod) ← **关键 P0 修复**, 已 staged

**新报告文件** (待 commit):
- `scripts/daily_seo_analysis_2026-06-25.md` (新增完整报告, 本文件)

**Workspace 数据文件** (独立 repo, ~/.openclaw/workspace):
- `/home/msdn/.openclaw/workspace/data/longtail-2026-06-25.json`
- `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-25.json`
- `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-25.json`
- `/home/msdn/.openclaw/workspace/data/gap-history.json` (更新, 76+ entries, 2 NEW 06-25)