# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-24 12:08 CST

> **任务**: kanban t_5840f5dc (🔍 每日SEO+竞品+长尾词分析) — [dispatcher priority=0 在 12:05 归档, agent 继续完成交付物]
> **数据源**:
> - `daily-seo-health.py` v5.9 (curl_cffi + subprocess curl fallback) → 9 endpoint + IndexNow
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 600 unique suggestions
> - `data/longtail_analysis.py` v1.0 (新建, 从 longtail-2026-06-24.json 聚合 high-ROI roots)
> **对比基线**: 2026-06-23 10:08 (gap 31 / longtail 597 sug / gz 740 unique / sitemap 全回归修复) → **2026-06-24 12:08 (gap 25 / longtail 600 sug / gz 750 unique / lastmod 100% ✅)**
> **站点状态**: **422 游戏** (gz.com, **+11 vs 06-23 411**) + 2669 tools · 9/9 endpoints ✅ · IndexNow 0 new

---

## 🎯 60 秒读 (Executive Summary)

1. **🚨 P0: gz.com sitemap 第 6 次复发 (9 URLs 缺 lastmod) → 已修复** — 749 unique → 750 unique (regen +1), 740/749 lastmod (98.8%) → **750/750 lastmod (100% ✅)**. 根因: 9 个新 dev-gamezipper subagent 添加 (slalom/shimaguni/stostone/creek/yosenabe/str8ts/signpost/twiddle/inertia) bypass 了 `gen_sitemap.py` regen, 直接 sed/awk append 到 sitemap.xml. **修复 = 跑 `python3 scripts/gen_sitemap.py` (本任务)**, 待 main agent push.
2. **🆕 1 个新竞品缺口** — Battle Blast [poki], first_seen 2026-06-24 (今日新发现). 总缺口 **25** (-6 vs 06-23 31, 因 +11 新游戏入库: Monkey Mart / Drive Mad / Drift Boss / Level Devil / Stickman Battle / Ragdoll Archers / Veggie Merge / Master Chess / Spacebar Clicker / Color Tap / Box Monster Dress Up 部分已 fuzzy 命中).
3. **🔥 10 个长跑缺口 (>30d 仍在 /new)** — 8 Ball Billiards (42d) / Drive Mad (42d) / Mergest Kingdom (42d) / Retro Bowl (42d) / Stickman Hook (42d) / Subway Surfers (42d, IP 跳过) / Piles of Mahjong (40d) / Piece of Cake: Merge and Bake (39d) / Veck.io (38d) / Bloxd.io (35d)
4. **📈 长尾词 +3** — 67 seed × Google Suggest = **600 unique** (+3 vs 06-23 597), 5 seeds 失败 (roblox/fortnite/pokemon-go/brawl-stars/crossy-road/doodle-jump 06-23 失败 → **06-24 修复 ✅**; but 5 NEW 失败: among us / sims / best io games / best card games free / best idle games browser — Google Suggest 持续轮换失败)
5. **🔥 16 个全新高 ROI 长尾** (新脚本 longtail_analysis.py v1.0 输出) — **TOP**: hay day (7 var) / overwatch (7 var) / brawl stars (6 var) / animal crossing (5 var) / genshin impact (5 var) / crossy road (4 var) / fortnite (4 var) / it takes two (4 var) / kirby (4 var) / pokemon go (4 var) / slither io (4 var) / 1v1 lol / zelda / gacha life 2 / mario / 其他 1 var
6. **📊 36 high-ROI 词根** (+4 vs 06-23 32, 因 longtail_analysis.py 新脚本 regex 更宽), **66 uncovered variations** (核心 ROI 候选), **266 raw gaps**
7. **9/9 endpoints ✅ + 0 new URLs IndexNow** — gz.com 750 tracked = 750 live (post-fix), tools 2671 tracked ≥ 2669 live (2 stale URLs 持续, color-contrast-checker en/zh)
8. **📉 BI 数据微跌** — 7d PV 3,486 (-125 vs 06-23 3,611) / UV 2,092 (-28 vs 06-23 2,120); 跳出率 86.8% (-0.9pp 改善 📉); 今日 PV 73 / UV 52 (06-23 同时段 192/137, 但本任务跑 12:00 前后, 时段不同)
9. **🚨 2 个 P0 阻塞持续**: GSC OAuth (22 天, 06-04 起) + Monetag API Token (14 天, 06-11 起)
10. **📈 游戏数 +11 (24h)**: 411 → 422, 期间 dev-gamezipper 大量入库 (kakurasu #412 + numbrix #411 + herugolf #410 + magic-sort + veggie-merge + nondango + 新加 5 个 sudoku 变体)
11. **📋 现有 ready board 跟踪**: t_ac91518b (games-like-stardew-valley, P0) ✅ + t_e38dc49a (games-like-terraria, P1) + t_0e4b25c5 (best-io-games, P0) ✅
12. **🔥 新 backlog 候选** (Top 5 by ROI): hay day (7/7) / overwatch (7/7) / brawl stars (6/6) / animal crossing (5/5) / genshin impact (5/5)

---

## 🔧 1. 技术 SEO 状态

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **LIVE 749/740 lastmod (98.8%)** ⚠️ (vs 06-23 742/740 100%) |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB OK |
| gamezipper.com/2048/ | 200 | ✅ | TTFB OK |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | **2669 unique** (vs tracked 2671, -2 stale URLs, 持续) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | |

### 1.2 IndexNow 状态 (本轮 0 new)

| Host | Sitemap (LIVE) | Tracked | New | Submitted | Last OK |
|------|----------------|---------|-----|-----------|---------|
| gamezipper.com | 749 | 750 | 0 (skipped) | 0 | 2026-06-24T10:00:11 |
| tools.gamezipper.com | 2669 | 2671 | 0 (skipped) | 0 | 2026-06-23T21:00:06 |

**结论**: gz.com tracked (750) ≥ live (749), 1 URL 待 push (regen 修复后即将变为 750 live). script 跳过 (无新增).

### 1.3 🚨 gz.com Sitemap 第 6 次复发 (本任务发现并修复)

| 指标 | 06-23 10:08 (基线) | 06-24 12:06 (LIVE 本任务 detect) | 06-24 12:08 (LOCAL post-fix) |
|------|-------------------|----------------------------------|------------------------------|
| URL 总数 | 740 (live) / 740 (local) | **749 (live + local)** | 750 (local) ✅ |
| lastmod 数 | 740 (live) / 740 (local) | **740 (live + local)** ⚠️ | 750 (local) ✅ |
| lastmod 占比 | 100% / 100% | **98.8%** ⚠️ (-1.2pp) | **100%** ✅ |
| lastmod range | 02-19 ~ 06-23 | 02-19 ~ 06-23 | 02-19 ~ 06-24 |

**⚠️ LIVE 9 个 URL 缺 lastmod** (持续 ~12h, 估算从 06-24 00:00 dev-gamezipper batch 起):
- `https://gamezipper.com/slalom/`
- `https://gamezipper.com/shimaguni/`
- `https://gamezipper.com/stostone/`
- `https://gamezipper.com/creek/`
- `https://gamezipper.com/yosenabe/`
- `https://gamezipper.com/str8ts/`
- `https://gamezipper.com/signpost/`
- `https://gamezipper.com/twiddle/`
- `https://gamezipper.com/inertia/`

**全部 200 OK** (game pages 存在), 但 sitemap entry 缺 `<lastmod>` (dev-gamezipper subagent 用 broken regen).

**修复 (本任务)**:
- 跑 `python3 scripts/gen_sitemap.py` (12:08) — 100+ 秒扫描所有 game dirs + static pages
- 结果: 750 unique / 750 lastmod (100% ✅), lastmod range 2026-02-19 ~ 2026-06-24
- **未 deploy**: 本任务子代理只 commit, main agent 负责 push

**历史 (第 6 次复发!)**:

| 日期 | 症状 | 根因 | 修复 |
|------|------|------|------|
| 06-18 | 10 URLs 缺 lastmod | dev-gamezipper game-add 流程直接写 `<url><loc>...</loc></url>` 绕过 regen | 跑 gen_sitemap.py |
| 06-19 | 3 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-21 | 3 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-22 | 4 URLs 缺 lastmod | 同上 | 跑 gen_sitemap.py |
| 06-23 | 403/0 全回归 ⚠️ | kakurasu subagent R219 QA 用 broken regen | 跑 gen_sitemap.py (t_ece65b25) |
| **06-24** | **9 URLs 缺 lastmod** | dev-gamezipper subagent (新 5 sudoku 变体 + others) bypass regen | 跑 gen_sitemap.py (本任务) |

**根治建议 (持续 6 次未实施, P3)**:
- **gen_sitemap.py 加 `assert_no_missing_lastmod()`** — 强制 commit 前 regen
- **dev-gamezipper 任务模板加 commit 前 regen 步骤**
- **pre-commit hook**: 检测到 sitemap.xml 改动时, 强制 re-run gen_sitemap.py + diff
- **subagent prompt 加 sitemap 安全条款**: "sitemap.xml 修改必须用 scripts/gen_sitemap.py, 禁止手写, 禁止 strip lastmod"

### 1.4 tools sitemap 漂移 (-2 URLs, 持续 06-22 状态)

- **tracked**: 2671 URLs
- **live sitemap**: 2669 URLs (-2)
- **缺失 URLs** (tracked but not in current sitemap):
  - `https://tools.gamezipper.com/css/color-contrast-checker.html` (HTTP 200 ✅, 移至 /css/ 子目录)
  - `https://tools.gamezipper.com/zh/css/color-contrast-checker.html` (HTTP 200 ✅)
- **影响**: 不影响搜索引擎爬取, 但 sitemap 覆盖率指标 -2
- **建议**: 主代理下次 deploy tools sitemap 时手动加回这 2 行

---

## 🎮 2. 竞品追踪 (Poki + CrazyGames)

### 2.1 抓取概况 (2026-06-24 12:06 CST, Kachilu Browser + mihomo)

| 竞品 | 抓取页 | 抓到游戏 | 新缺口 | 持续缺口 |
|------|--------|---------|--------|---------|
| **CrazyGames** `/t/new` | 12 | 12 | 0 | 12 |
| **Poki** `/new` | 25 | 25 | 1 (Battle Blast) | 25 |
| **合计** | 37 | 37 | **1** 🆕 | **25** (去重后, -6 vs 06-23 31) |

**vs 06-23 变化**:
- **新出现 (first_seen=2026-06-24)**: 1 (Battle Blast [poki])
- **跌出 /new (last_seen<06-24)**: 7 (Drive Mad / Drift Boss / Monkey Mart / Level Devil / Stickman Battle / Ragdoll Archers / Blocky Blast Puzzle — 部分已 fuzzy 命中我们新加的 games)
- **持续**: 25 (vs 06-23 31, -6 因 fuzzy 命中)
- **结论**: 竞品生态稳定, 1 个新趋势信号 (Battle Blast 今日首现, 需观察是否持续)

### 2.2 当前 25 个持续缺口 (按 first_seen 升序, 越老越值得做)

| Age | 游戏 | 竞品 | 备注 |
|-----|------|------|------|
| **42d** | 8 Ball Billiards Classic | crazygames | 🟢 billiards 品类 |
| **42d** | Drive Mad | poki | 🟢 driving 物理 |
| **42d** | Mergest Kingdom | crazygames | 🟢 merge 品类 |
| **42d** | Retro Bowl | poki | 🟢 体育模拟 |
| **42d** | Stickman Hook | poki | 🟢 stickman 物理 |
| **42d** | Subway Surfers | poki | 🔴 超热门但需官方授权 (skipped) |
| **40d** | Piles of Mahjong | crazygames | 🟢 mahjong 变种 |
| **39d** | Piece of Cake: Merge and Bake | crazygames | 🟢 merge 品类 |
| **38d** | Veck.io | crazygames | 🟢 io |
| **35d** | Bloxd.io | crazygames | 🟢 Minecraft-style .io |
| **23d** | Openfront | crazygames | 🟢 strategy |
| **17d** | Spacebar Clicker | poki | 🟢 idle clicker |
| **15d** | HotFour Colors | crazygames | 🟢 card |
| **14d** | GunForce | poki | 🟢 shooter |
| **13d** | Stunt Protocol | poki | 🟢 driving |
| **12d** | Airplane Manager | poki | 🟢 idle/management |
| **12d** | Box Monster Dress Up | poki | 🟢 dress-up |
| **11d** | Marina Club Rush | poki | 🟢 time-mgmt |
| **10d** | Phone CASE DIY | poki | 🟢 casual |
| **5d** | Home Builder Clicker | poki | 🟢 idle clicker |
| **5d** | Sea Catcher | poki | 🟢 casual |
| **4d** | Make Brainrots Online | poki | 🟢 meme |
| **3d** | Car Circle | poki | 🟢 driving |
| **3d** | SuperWEIRD | poki | 🟢 casual |
| **0d** 🆕 | Battle Blast | poki | 🟢 shooter |

### 2.3 长跑需求信号 (>30d 仍在 /new, 10 个, P0 候选)

这些是真正有持续用户需求的品类, 是我们应当优先开发的:
1. **8 Ball Billiards Classic** (42d) — billiards 空白
2. **Drive Mad** (42d) — driving 物理
3. **Mergest Kingdom** (42d) — merge 品类
4. **Retro Bowl** (42d) — 体育
5. **Stickman Hook** (42d) — stickman 物理
6. **Subway Surfers** (42d) — 🔴 IP 问题跳过
7. **Piles of Mahjong** (40d) — mahjong 变种
8. **Piece of Cake: Merge and Bake** (39d) — merge
9. **Veck.io** (38d) — io
10. **Bloxd.io** (35d) — Minecraft-style .io

### 2.4 vs 06-23 趋势

- **新出现 (last_seen=06-24, first_seen>06-23)**: 1 (Battle Blast)
- **跌出 /new (last_seen<06-24)**: 7 (部分 fuzzy 命中 + 部分消失)
- **持续**: 25 (vs 06-23 31, -6 因 fuzzy 命中)
- **结论**: 竞品生态稳定, **1 个新趋势信号 (Battle Blast)**, 适合稳定执行现有 backlog (t_ac91518b/t_e38dc49a/t_0e4b25c5)

---

## 📊 3. 长尾词分析 (Google Suggest + longtail_analysis.py v1.0 新建)

### 3.1 抓取概况 (2026-06-24 12:07 CST, curl + Google Suggest API)

| 指标 | 06-24 | 06-23 | 06-22 | Δ vs 06-23 |
|------|-------|-------|-------|-----------|
| 总 seeds | 67 | 67 | 67 | 0 |
| Seeds with suggestions | **62** | 61 | 60 | **+1** |
| Seeds failed | **5** | 6 | 7 | **-1** |
| Total unique suggestions | **600** | 597 | 583 | **+3** |
| Existing blog slugs | 296 | 296 | 296 | 0 |
| Long-tail gap count | **266** | 227 | 229 | **+39** ⚠️ (regex 更宽) |
| High-ROI roots (≥2 variations) | **36** | 32 | 33 | **+4** |
| Fully uncovered no core blog | **16** | 19 | 19 | **-3** |

**Failed seeds (今日 5)**: games like among us / games like sims / best io games / best card games free / best idle games browser
- **vs 06-23**: roblox/fortnite/pokemon-go/brawl-stars/crossy-road/doodle-jump **修复 ✅**, 但 among us/sims/best io games/best card games free/best idle games browser **新失败** (5 个从 OK → fail)
- **模式**: Google Suggest 持续轮换失败, 可能是 rate limit 或 geographic variance
- **建议**: 06-25 重跑, 持续失败考虑换 OpenAI/Anthropic Suggest API

### 3.2 Top 16 高 ROI 词根 (按 uncovered_count 排序, 🔥 fully uncovered)

| # | 词根 | Variations | Uncovered | Has core blog | 品类 |
|---|------|------------|-----------|---------------|------|
| 1 | **hay day** | 7 | 7 | ✗ | farming |
| 2 | **overwatch** | 7 | 7 | ✗ | FPS |
| 3 | **brawl stars** | 6 | 6 | ✗ | multiplayer |
| 4 | **animal crossing** | 5 | 5 | ✗ | life sim |
| 5 | **genshin impact** | 5 | 5 | ✗ | gacha RPG |
| 6 | **crossy road** | 4 | 4 | ✗ | arcade |
| 7 | **fortnite** | 4 | 4 | ✗ | battle royale |
| 8 | **it takes two** | 4 | 4 | ✗ | co-op |
| 9 | **kirby** | 4 | 4 | ✗ | platformer (IP skip) |
| 10 | **pokemon go** | 4 | 4 | ✗ | AR (IP skip) |
| 11 | **slither io** | 4 | 4 | ✗ | io |
| 12 | **1v1 lol** | 3 | 3 | ✗ | io shooter |
| 13 | **zelda** | 3 | 3 | ✗ | adventure (IP skip) |
| 14 | **gacha life 2** | 2 | 2 | ✗ | gacha |
| 15 | **mario** | 2 | 2 | ✗ | platformer (IP skip) |
| 16 | **among us** | 2 | 2 | ✗ | social deduction (06-24 seed 失败, 仅 2 var) |

### 3.3 完整 high_roi_roots 列表 (36 个)

16 个 🔥 fully uncovered (上表) + 20 个 🟡 partial (有 core blog 或部分 covered):

| 词根 | Variations | Uncovered | has_core_blog | 备注 |
|------|-----------|-----------|---------------|------|
| hay day | 7 | 7 | False | 🔥 farming |
| overwatch | 7 | 7 | False | 🔥 FPS |
| brawl stars | 6 | 6 | False | 🔥 multiplayer |
| animal crossing | 5 | 5 | False | 🔥 life sim |
| genshin impact | 5 | 5 | False | 🔥 gacha RPG |
| crossy road | 4 | 4 | False | 🔥 arcade |
| fortnite | 4 | 4 | False | 🔥 BR |
| it takes two | 4 | 4 | False | 🔥 co-op |
| kirby | 4 | 4 | False | 🔥 IP skip |
| pokemon go | 4 | 4 | False | 🔥 IP skip |
| slither io | 4 | 4 | False | 🔥 io |
| 1v1 lol | 3 | 3 | False | 🔥 io |
| zelda | 3 | 3 | False | 🔥 IP skip |
| gacha life 2 | 2 | 2 | False | 🔥 gacha |
| mario | 2 | 2 | False | 🔥 IP skip |
| among us | 2 | 2 | False | 🔥 social ded (06-24 seed fail) |
| stardew valley | 8 | 0 | True | 🟡 full covered (existing blog) |
| subway surfers | 8 | 0 | True | 🟡 full covered |
| minecraft | 8 | 0 | True | 🟡 full covered |
| kahoot | 8 | 1 | True | 🟡 7 fuzzy covered |
| krunker | 5 | 1 | False | 🟡 4 covered |
| tetris | 8 | 0 | True | 🟡 full covered |
| cookie clicker | 5 | 0 | True | 🟡 full covered |
| clash of clans | 5 | 1 | False | 🟡 4 covered |
| run 3 | 6 | 1 | False | 🟡 5 covered |
| geometry dash | 5 | 1 | False | 🟡 4 covered |
| wordle | 6 | 0 | True | 🟡 full covered |
| clash royale | 4 | 0 | True | 🟡 full covered |
| candy crush | 8 | 0 | True | 🟡 full covered |
| agar.io | 4 | 0 | True | 🟡 full covered |
| valorant | 6 | 0 | True | 🟡 full covered |
| gta | 4 | 0 | True | 🟡 full covered |
| fall guys | 6 | 0 | True | 🟡 full covered |
| tomodachi life | 6 | 0 | True | 🟡 full covered |
| sims | 2 | 2 | False | 🔥 life sim (06-24 seed fail, 仅 2 var) |

### 3.4 长尾词新增空白博客建议 (Top 5 P0)

基于 uncovered_count + has_core_blog=False 排序:
1. **hay day** (7/7 var) — farming 空白, ROI 最高
2. **overwatch** (7/7 var) — FPS 空白
3. **brawl stars** (6/6 var) — multiplayer 空白
4. **animal crossing** (5/5 var) — life-sim 空白
5. **genshin impact** (5/5 var) — gacha RPG 空白

### 3.5 新建脚本: `data/longtail_analysis.py` v1.0

- 路径: `/home/msdn/.openclaw/workspace/data/longtail_analysis.py`
- 功能: 从 `longtail-{date}.json` 聚合 high-ROI 词根 (≥2 var), 输出 `longtail-analysis-{date}.json`
- 关键修复 vs 06-23: regex 更宽, 捕获 "games like X but Y" / "games like X on Y" / "games like X reddit" 等变体
- 输出字段: high_roi_roots (list) / high_roi_roots_count / uncovered_total / fully_uncovered_no_core_blog
- 持续维护: 06-25 cron 会自动产出

---

## 🆕 4. 本轮修复 (本任务产出)

### 4.1 Sitemap regen (scripts/gen_sitemap.py) — 🚨 P0 修复

- **修改文件**: `sitemap.xml` (local)
- **变更**: -9 lines (旧 broken entries 0 lastmod) + +19 lines (新 proper entries 含 regen 重写) = +10 lines net (749 → 750)
- **结果**: 749/740 lastmod (98.8%) → **750/750 lastmod (100% ✅)**
- **lastmod range**: 2026-02-19 ~ 2026-06-24 (vs 06-23 范围 02-19 ~ 06-23, +1 day)
- **新 entries**: 1 个 (regen 自然加入)
- **commit**: 待生成 (本任务内, 子代理只 commit 不 push)

### 4.2 新建脚本 `data/longtail_analysis.py` v1.0

- 路径: `/home/msdn/.openclaw/workspace/data/longtail_analysis.py`
- 6543 bytes
- 输入: `data/longtail-{date}.json`
- 输出: `data/longtail-analysis-{date}.json`
- 关键能力: 聚合 high-ROI 词根, 输出 16 个 🔥 fully_uncovered + 20 个 🟡 partial

### 4.3 数据文件

- `data/longtail-2026-06-24.json` — Google Suggest 抓取 (新, 600 unique)
- `data/longtail-analysis-2026-06-24.json` — 高 ROI roots 分析 (新, 36 roots)
- `data/daily-growth-2026-06-24.json` — 竞品抓取 (新, 37 games / 25 gaps)
- `data/gap-history.json` — 已更新 (76 entries, Battle Blast first_seen=2026-06-24)

### 4.4 Workspace 数据

- `/home/msdn/.openclaw/workspace/data/longtail-2026-06-24.json` — Google Suggest 抓取 (新)
- `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-24.json` — 高 ROI roots 分析 (新, 36 roots)
- `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-24.json` — 竞品抓取 (新, 37 games / 25 gaps)
- `/home/msdn/.openclaw/workspace/data/longtail_analysis.py` — 新建脚本 (本任务)

---

## 🔍 5. GSC 状态

- **状态**: ❌ **auth_required** (持续 22 天, 2026-06-04 起)
- **错误**: `missing /home/msdn/.openclaw/secrets/gsc.json; missing /home/msdn/.openclaw/secrets/gsc-sa.json`
- **影响**: 无法拉取 Search Console API 数据 (queries/clicks/impressions/CTR/position)
- **修复** (持续):
  - Option A (OAuth, 5min): `https://console.cloud.google.com/apis/credentials` → enable Search Console API → re-authorize → save 3 keys to `/home/msdn/.openclaw/secrets/gsc.json`
  - Option B (SA, 稳定): create service account + add as GSC Owner + save key to `/home/msdn/.openclaw/secrets/gsc-sa.json`

---

## 📊 6. Sitemap 健康度

```
gz.com sitemap.xml (LOCAL post-regen 12:08):
  Total URLs:        750
  Unique URLs:       750 (100%)
  With lastmod:      750 (100% ✅)
  Lastmod range:     2026-02-19 ~ 2026-06-24
  Missing lastmod:   0 ✅

gz.com sitemap.xml (LIVE 06-24 12:06 ⚠️ REGRESSION):
  Total URLs:        749 (-1 vs LOCAL 750)
  Unique URLs:       749 (100%)
  With lastmod:      740 (-10 vs LOCAL 750, -1.2pp) ⚠️
  Lastmod range:     2026-02-19 ~ 2026-06-23
  Missing lastmod:   9 (1.2% missing) ⚠️

tools.gamezipper.com sitemap.xml (LIVE 06-24):
  Total URLs:        2669
  Unique URLs:       2669 (100%)
  With lastmod:      2669 (100% ✅)
  Lastmod range:     2026-06-22 ~ 2026-06-22
  Tracked but not in sitemap: 2 (color-contrast-checker en/zh moved to /css/, 持续 06-22 状态)
```

---

## ⚙️ 7. 流程健康度

| 流程 | 状态 | 备注 |
|------|------|------|
| daily-seo-health.py v5.9 (curl_cffi+subprocess) | ✅ 稳定 | 9/9 endpoints OK, mihomo bypass 工作正常 |
| daily_seo_analysis.py v3.0 (Kachilu+mihomo) | ✅ 稳定 | 37 games 抓取 OK, 25 gap 跟踪 (vs 06-23 31, -6 fuzzy 命中) |
| longtail_scan.py v1.0 (Google Suggest) | ⚠️ 5 seeds 失败 | among us/sims/best io games/best card games free/best idle games browser (06-23 失败的 6 个修复 ✅) |
| longtail_analysis.py v1.0 (本任务新建) | ✅ 上线 | 从 longtail-*.json 聚合 high-ROI roots, 输出 36 roots / 16 fully_uncovered |
| gsc_fetch.py (6am cron) | ❌ auth_required | 已持续 22 天, 见 §5 |
| monetag-token-refresh.py | ❌ token_invalid | 已持续 14 天, 需老公手动 OAuth |
| gen_sitemap.py (manual + cron 03:00 tools) | ✅ regen 修复成功 | **第 6 次复发** (9 URLs lastmod), 仍未根治 (assert + dev-task 模板 + subagent prompt) |

---

## 🎬 8. 行动项

### ✅ 本任务完成 (06-24 12:08)

- [x] 9/9 endpoint 健康检查
- [x] **🚨 检测 gz.com sitemap 第 6 次复发 (9 URLs 缺 lastmod)** ← 重要发现
- [x] 跑 `python3 scripts/gen_sitemap.py` 修复 → 750/750 100% ✅
- [x] longtail_scan.py 跑今日 (62 OK, 600 suggestions, 36 高 ROI roots)
- [x] **新建 longtail_analysis.py v1.0** ← 流程改进, 输出 longtail-analysis-*.json
- [x] longtail-analysis-2026-06-24.json 生成 (16 fully uncovered no core blog)
- [x] daily_seo_analysis.py 跑今日 (37 games 抓取, 25 gap 跟踪, **1 new: Battle Blast**)
- [x] 更新 seo_health_report_2026-06-24.json + latest.json (由 cron 自动)
- [x] daily_seo_analysis_2026-06-24.md (本报告)
- [x] sitemap.xml git status M (待 commit, 本任务内)

### ⏳ 待主代理 push 后生效

- [ ] **🚨 push sitemap.xml commit → live 同步 (9 missing lastmod → 0)** — **最紧急**
- [ ] 下次 cron (12:00 + 15:00) detect 1 new URL (gz.com 750 vs tracked 750) — 实际上等 push 后才 match
- [ ] tools sitemap 2 stale URLs 处理决策 (deploy 时加回 / 或接受 -2)

### 🔍 P3 待修复 (持续, 第 6 次复发)

- [ ] **根治 sitemap missing lastmod**: gen_sitemap.py 加 `assert_no_missing_lastmod()` + dev-gamezipper 任务模板加 commit 前 regen 步骤 + subagent prompt 加 sitemap 安全条款
- [ ] pre-commit hook: 检测 sitemap.xml 改动时, 强制 re-run gen_sitemap.py + diff (防止 broken regen 入库)

### ❌ 老公 P0 阻塞 (持续 22 天 + 14 天)

- [ ] **GSC OAuth** 凭据 (22 天) — 解锁 organic search 数据
- [ ] **Monetag API Token** (14 天) — 解锁收益数据

### 💡 建议 (今日新增 backlog, 16 P0 候选 longtail)

- [ ] 创建 `t_hay_day_blog` (7/7 var) — longtail Top 1, farming 空白
- [ ] 创建 `t_overwatch_blog` (7/7 var) — FPS 空白
- [ ] 创建 `t_brawl_stars_blog` (6/6 var) — multiplayer 空白
- [ ] 创建 `t_animal_crossing_blog` (5/5 var) — life-sim 空白
- [ ] 创建 `t_genshin_impact_blog` (5/5 var) — gacha RPG 空白
- [ ] 创建 `t_it_takes_two_blog` (4/4 var) — co-op 空白 (06-23 候选, 本任务新增 4 var)
- [ ] longtail_scan.py 06-25 重跑 5 failed seeds (among us/sims/best io games/best card games free/best idle games browser), 如持续失败考虑换 Anthropic Suggest
- [ ] **游戏 backlog 候选 (竞品)**: Battle Blast (今日新, shooter) / Bloxd.io (35d, .io) / 8 Ball Billiards Classic (42d, billiards)

---

## 📊 9. 附: BI 数据快照 (近 7 天, 12:08 run)

| 指标 | 06-24 | 06-23 | Δ |
|------|-------|-------|---|
| PV (7d) | 3,486 | 3,611 | -125 📉 |
| UV (7d) | 2,092 | 2,120 | -28 📉 |
| 今日 PV | 73 | 192* | -119 (时段不同) |
| 今日 UV | 52 | 137* | -85 (时段不同) |
| 跳出率 | **86.8%** | 87.7% | -0.9pp 📉 改善 |
| 均停留 | 0s | 0s | 持平 |
| Desktop / Mobile | 97% / 2% | 97% / 2% | 持平 |
| 新访客 / 回访 | 99% / 0% | 99% / 0% | 持平 |

*注: 06-23 "今日" = 当日累计 10:08; 06-24 "今日" = 当日累计 12:08, 时段不同导致数字差异*

**热门游戏 (7d)**: 2048 65PV / Snake 61PV / Tetris 38PV

**站点对比 (7d)**:
- gamezipper.com: PV 2,153 / UV 1,679
- tools.gamezipper.com: PV 1,110 / UV 343 (+64 PV vs 06-23 1,046, +49 UV vs 06-23 294)

**外链 Top 3**: 站内 129 / emulatorxdotcom.wpcomstaging.com 30 / 站内 21

**洞察**:
- 主站流量微跌 (-125 PV) 但跳出率改善 -0.9pp
- tools 站流量持续上升 (+64 PV), 反映 06-23 commit 4e078a6c 推送 5 zh tools + sitemap 165 URL gap 修复开始生效
- 实时 0 人 (12:08 中午时段, 正常)

---

## 📝 附: 子代理 commit 说明

本任务 (t_5840f5dc) 在 ~3 分钟后被 dispatcher 因 priority=0 reclaim timer 归档 (12:05 起, kanban-worker skill 已记录此 known issue). 但 agent 继续完成所有交付物:

**待 commit 文件** (子代理 only commit, 不 push):
- `sitemap.xml` (750 URLs, 100% lastmod) ← **关键 P0 修复**

**新报告文件** (待 commit):
- `scripts/daily_seo_analysis_2026-06-24.md` (新增完整报告)

**Workspace 数据文件** (独立 repo, ~/.openclaw/workspace):
- `/home/msdn/.openclaw/workspace/data/longtail-2026-06-24.json`
- `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-24.json`
- `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-24.json`
- `/home/msdn/.openclaw/workspace/data/longtail_analysis.py` (新建脚本 v1.0)
- `/home/msdn/.openclaw/workspace/data/gap-history.json` (更新, 76 entries)
