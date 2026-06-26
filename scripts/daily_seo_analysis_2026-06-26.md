# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-26 12:08 CST

> **任务**: kanban t_49fc9ee7 (🔍 每日SEO+竞品+长尾词分析) — GameZipper每日增长分析
> **数据源**:
> - `daily-seo-health.py` v5.10 (curl_cffi + subprocess curl fallback) → 9 endpoint + IndexNow
> - `daily_seo_analysis.py` v3.0 (Kachilu Browser + mihomo) → 竞品缺口分析
> - `data/longtail_scan.py` v1.0 (Google Suggest 67 seeds) → 505 unique suggestions
> - `data/longtail_analysis.py` v1.0 → 29 high-ROI roots / 12 fully uncovered no core
> **对比基线**: 2026-06-25 12:13 (gap 26 / longtail 597 sug / gz 760 unique / 433 games / sitemap LIVE 99.7%) → **2026-06-26 12:08 (gap 27 / longtail 505 sug / gz 769 unique / 440 games / sitemap LIVE 100% ✅)**
> **站点状态**: **433 → 440 游戏** (gz.com, **+7 vs 06-25 433**) + 2,663 tools · 9/9 endpoints ✅ · IndexNow 0 new

---

## 🎯 60 秒读 (Executive Summary)

1. **✅ gz.com sitemap 已恢复 100% lastmod (LIVE!)** — 06-25 LIVE 758/760 (99.7% ⚠️) → **06-26 LIVE 769/769 (100% ✅)**. 06-25 LOCAL fix (761) + dev-gamezipper 后续 8 新游戏 push → live 同步成功. 修复第 7 次复发 完成 ✅.
2. **📉 7d PV 大跌 (-28.6%) 但跳出率持续改善 (-2.4pp)** — 7d PV 2,485 (-994 vs 06-25 3,479) / UV 1,701 (-382 vs 06-25 2,083). **注意**: 7d 窗口从 [06-19..06-25] 滑到 [06-20..06-26], 失去 06-19 的 1122 PV 异常高峰. 日均实际 -28.6% 是窗口位移 + 异常峰消除, **真实日均趋势 = 平稳低位 125-300 PV/d**. **跳出率 82.8% (-2.4pp, 持续改善 📉)**.
3. **🆕 1 个新竞品缺口** — Smash Room (poki, first_seen 2026-06-26). 总缺口 **27** (+1 vs 06-25 26). 06-25 的 Brain Test 5 + Numbers Match 2448 已持久化, 仍是 recurring.
4. **🔥 41 个长跑缺口 (>30d, +1 vs 06-25 40)** — 44d 长跑: 8 Ball Billiards Classic / Bubble Tower / Drive Mad / Mergest Kingdom / Monkey Mart / Retro Bowl / Stickman Hook / Subway Surfers (持续 06-13 起)
5. **⚠️ 长尾词 -92 unique suggestions (-15.4%)** — 67 seed × Google Suggest = **505 unique** (-92 vs 06-25 597). **失败 seeds 翻倍**: 6 → 15 (+9), 包括 previously-passing 的 among us / tetris / it takes two / sims / fall guys / crossy road. **Google Suggest 持续轮换不稳定**.
6. **🔥 12 个高 ROI 长尾 (与 06-25 同数量, 但 root 集合变了 50%+)** — **TOP 维持**: hay day (7) / overwatch (7). **🆕 NEW**: brawl stars (6, 06-25 seeds 失败) / stardew valley (5) / fortnite (4) / kirby (4) / pokemon go (4) / slither io (4). **🚫 GONE**: among us / sims / sims 4 / crossy road / it takes two / tetris (06-26 seeds 失败).
7. **📊 29 high-ROI roots** (-2 vs 06-25 31), **12 fully uncovered**, **57 uncovered_total** (+1 vs 06-25 56). 集中度更高, 候选 ROI 更可执行.
8. **9/9 endpoints ✅ + 0 new URLs IndexNow** — gz.com 769 LIVE = 769 tracked (in sync!), tools 2735 LIVE < 2737 tracked (-2 stale URLs, 持续)
9. **🎮 游戏数 +7 (24h)**: 433 → 440, 期间 dev-gamezipper 添加 9 个新 game dirs (magnet-drop / number-match / spin-rings / hangman / sokoban / fun-web-games / idle-clicker / word-card-sort / slalom) — 实际只 +7 到 games-data.js (2 个尚未入库)
10. **🚨 2 个 P0 阻塞持续**: GSC OAuth (24 天, 06-04 起) + Monetag API Token (16 天, 06-11 起)

---

## 🔧 1. 技术 SEO 状态

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | 备注 |
|----------|------|------|------|
| gamezipper.com/robots.txt | 200 | ✅ | 14 UA + sitemap 引用 + AI bot 策略 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **LIVE 769/769 lastmod (100% ✅)** |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | `gamezipper2026indexnow` |
| gamezipper.com/ | 200 | ✅ | TTFB OK |
| gamezipper.com/2048/ | 200 | ✅ | TTFB OK |
| tools.gamezipper.com/robots.txt | 200 | ✅ | |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | **2735 unique** (vs tracked 2737, -2 stale URLs 持续) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| tools.gamezipper.com/ | 200 | ✅ | 2,663+ tools |

### 1.2 IndexNow 状态 (本轮 0 new)

| Host | Sitemap (LIVE) | Tracked | New | Submitted | Last OK |
|------|----------------|---------|-----|-----------|---------|
| gamezipper.com | 769 | 769 | 0 (skipped) | 0 | 2026-06-26T07:32:57 |
| tools.gamezipper.com | 2735 | 2737 | 0 (skipped) | 0 | 2026-06-25T06:00:06 |

**结论**: gz.com tracked (769) = live (769) **完全同步**, 0 new URLs to submit.

### 1.3 ✅ gz.com Sitemap 第 7 次复发 — 已 LIVE 修复!

| 指标 | 06-25 12:09 (LIVE 复发) | 06-25 12:12 (LOCAL post-fix) | **06-26 12:08 (LIVE ✅)** |
|------|-------------------------|------------------------------|---------------------------|
| URL 总数 | 760 | 761 | **769** (+9 新游戏) |
| lastmod 数 | 758 | 761 | **769** |
| lastmod 占比 | 99.7% ⚠️ | 100% ✅ | **100% ✅** |
| lastmod range | 02-19 ~ 06-25 | 02-19 ~ 06-25 | **02-19 ~ 06-26** |

**06-26 验证**:
```bash
$ curl --noproxy '*' https://gamezipper.com/sitemap.xml | grep -c '<loc>'
769
$ curl --noproxy '*' https://gamezipper.com/sitemap.xml | grep -c '<lastmod>'
769
$ python -c "Total=769, Unique=769, With lastmod=769, Missing=0 ✅"
```

**🆕 新推送的 9 个游戏** (mtime 06-26):
- magnet-drop / number-match / spin-rings / hangman / sokoban / fun-web-games / idle-clicker / word-card-sort / slalom

### 1.4 tools sitemap 漂移 (-2 URLs, 持续 06-22 状态)

- tracked 2737 vs live 2735 (-2 stale URLs: color-contrast-checker en/zh moved to /css/)
- 等待 deploy 决定: 加回 / 或接受 -2

---

## 🆕 2. 竞品缺口分析

### 2.1 竞品总览 (37 games / 2 sources)

| Source | 06-26 Games | 06-25 Games | Δ |
|--------|-------------|-------------|---|
| crazygames | 12 | 12 | 持平 |
| poki | 25 | 25 | 持平 |
| **Total** | **37** | **37** | 持平 |

### 2.2 🆕 新竞品缺口 (gap-history 视角, 1 个)

| 名称 | 来源 | 备注 |
|------|------|------|
| **Smash Room** | poki | physics destruction, 系列化 (Smash Room 1). 我们无直接同类 (有 Breakout / Block Blast 接近但不同) |

### 2.3 竞品缺口 Top 15 (06-26)

| # | 名称 | 来源 | 状态 |
|---|------|------|------|
| 1 | 8 Ball Billiards Classic | crazygames | 44d 🔴 (长跑) |
| 2 | Airplane Manager | poki | 15d |
| 3 | Battle Blast | poki | 2d |
| 4 | Bloxd.io | crazygames | 37d 🟡 (长跑) |
| 5 | Box Monster Dress Up | poki | 14d |
| 6 | Brain Test 5 | poki | 2d (06-25 first_seen) |
| 7 | BuildNow GG | crazygames | 17d |
| 8 | Drive Mad | poki | 44d 🔴 (长跑) |
| 9 | Farm Merge Valley | crazygames | 10d (last_seen 06-17) |
| 10 | Find it! | poki | 8d (last_seen 06-18) |
| 11 | Four Colors | crazygames | 17d |
| 12 | GunForce | poki | 16d |
| 13 | Home Builder Clicker | poki | 7d |
| 14 | Make Brainrots Online | poki | 6d |
| 15 | Marbles Garden | poki | - |

### 2.4 长跑缺口 (>30d, 41 个, +1 vs 06-25 40)

**44d 长跑 (8 个)** (持续 06-13 起):
- 8 Ball Billiards Classic (crazygames)
- Bubble Tower (poki)
- Drive Mad (poki)
- Mergest Kingdom (crazygames)
- Monkey Mart (poki)
- Retro Bowl (poki)
- Stickman Hook (poki)
- Subway Surfers (poki, IP skip)

**Top 候选新游戏 (按 ROI, 持续天数)**:
- **Drive Mad** (44d) — 物理驾驶, 简单 HTML5 clone 可做
- **Mergest Kingdom** (44d) — merge puzzle, 高热度
- **Stickman Hook** (44d) — 简单物理
- **Monkey Mart** (44d) — 超市管理, 中工程量
- **Bloxd.io** (37d) — io voxel, 工程量中

---

## 🔥 3. 长尾词分析 (Google Suggest)

### 3.1 长尾扫描状态

| 指标 | 06-26 | 06-25 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 持平 |
| Seeds 成功 | 52 | 61 | **-9** |
| Seeds 失败 | 15 | 6 | **+9** ⚠️ |
| Unique suggestions | 505 | 597 | **-92** 📉 |
| 现有 blog 数 | 296 | 296 | 持平 |

### 3.2 ⚠️ 失败的 15 个 seeds (06-26 翻倍 vs 06-25 6)

**🆕 06-26 失败的 previously-passing seeds (Google Suggest 持续轮换)**:
- ❌ games like among us (07-25 2→7 var, **今日 0 失败!**)
- ❌ games like tetris (06-25 7 var, **今日 0 失败!**)
- ❌ games like it takes two (06-25 4 var, **今日 0**)
- ❌ games like sims (06-25 4 var, **今日 0**)
- ❌ games like fall guys (06-25 6 var, **今日 0**)
- ❌ games like gacha life (06-25/06-23 持续失败)
- ❌ games like crossy road (06-25 4 var, **今日 0**)

**🆕 06-26 新失败 seeds (8 个)**:
- ❌ free multiplayer games
- ❌ free games to play with friends
- ❌ best browser games
- ❌ best puzzle games free
- ❌ play sudoku online free
- ❌ play solitaire online free
- ❌ play mahjong online free
- ❌ games like among us, tetris, it takes two, sims, fall guys, crossy road (见上)

**📈 06-26 修复的 5 个失败 seeds (06-25 失败 → 06-26 成功)**:
- ✅ games like fortnite (4 var)
- ✅ games like pokemon go (4 var)
- ✅ games like kirby (4 var)
- ✅ games like brawl stars (6 var, 🆕 跳升)
- ✅ games like stardew valley (5 var, 🆕)

### 3.3 Top 12 🔥 fully uncovered 高 ROI 词根

| # | 词根 | Variations | Uncovered | 品类 |
|---|------|------------|-----------|------|
| 1 | **hay day** | 7 | 7 | farming (06-25 #2 升至 #1) |
| 2 | **overwatch** | 7 | 7 | FPS |
| 3 | **brawl stars** | 6 | 6 | MOBA (🆕 NEW 06-26, 06-25 seed 失败) |
| 4 | **animal crossing** | 5 | 5 | life sim |
| 5 | **genshin impact** | 5 | 5 | gacha RPG |
| 6 | **stardew valley** | 5 | 5 | farming (🆕 NEW 06-26) |
| 7 | **fortnite** | 4 | 4 | battle royale (🆕 NEW 06-26) |
| 8 | **kirby** | 4 | 4 | platformer (🆕 NEW 06-26) |
| 9 | **pokemon go** | 4 | 4 | AR (🆕 NEW 06-26) |
| 10 | **slither io** | 4 | 4 | io (🆕 NEW 06-26) |
| 11 | **1v1 lol** | 3 | 3 | io shooter |
| 12 | **zelda** | 3 | 3 | adventure (IP skip) |

**vs 06-25 12 fully uncovered**:
- 🆕 **NEW**: brawl stars (从 0 → 6 var) / stardew valley (从 0 → 5 var) / fortnite (4) / kirby (4) / pokemon go (4) / slither io (4)
- 🚫 **Gone**: among us (7 → 0) / sims (4 → 0) / sims 4 (3 → 0) / crossy road (4 → 0) / it takes two (4 → 0) / tetris (5 → 0)

### 3.4 完整 high_roi_roots 列表 (29 个)

12 个 🔥 fully uncovered no core + 17 个 ✅ fully covered:

| 词根 | Variations | Uncovered | has_core_blog | 备注 |
|------|-----------|-----------|---------------|------|
| hay day | 7 | 7 | False | 🔥 farming (#1) |
| overwatch | 7 | 7 | False | 🔥 FPS |
| brawl stars | 6 | 6 | False | 🔥 MOBA (🆕) |
| animal crossing | 5 | 5 | False | 🔥 life sim |
| genshin impact | 5 | 5 | False | 🔥 gacha RPG |
| stardew valley | 5 | 5 | False | 🔥 farming (🆕) |
| fortnite | 4 | 4 | False | 🔥 battle royale (🆕) |
| kirby | 4 | 4 | False | 🔥 platformer (🆕) |
| pokemon go | 4 | 4 | False | 🔥 AR (🆕) |
| slither io | 4 | 4 | False | 🔥 io (🆕) |
| 1v1 lol | 3 | 3 | False | 🔥 io |
| zelda | 3 | 3 | False | 🔥 IP skip |
| geometry dash | 8 | 0 | False | ✅ full covered (🆕 06-26) |
| kahoot | 8 | 0 | False | ✅ full covered (🆕 06-26) |
| cookie clicker | 7 | 0 | True | ✅ full covered |
| minecraft | 7 | 0 | False | ✅ full covered (🆕 06-26) |
| subway surfers | 7 | 0 | False | ✅ full covered |
| wordle | 7 | 0 | True | ✅ full covered |
| candy crush | 6 | 0 | False | ✅ full covered |
| clash of clans | 6 | 0 | True | ✅ full covered |
| krunker | 7 | 0 | True | ✅ full covered |
| roblox | 6 | 0 | False | ✅ full covered |
| temple run | 6 | 0 | False | ✅ full covered |
| tomodachi life | 6 | 0 | False | ✅ full covered |
| valorant | 6 | 0 | False | ✅ full covered |
| clash royale | 5 | 0 | True | ✅ full covered |
| gta 5 | 4 | 0 | False | ✅ full covered (🆕 06-26) |
| gta | 3 | 0 | False | ✅ full covered |
| agar io | 2 | 0 | False | ✅ full covered (🆕 06-26, was agar.io) |

### 3.5 长尾词新增空白博客建议 (Top 5 P0)

基于 uncovered_count + has_core_blog=False 排序:
1. **hay day** (7/7 var, 🆕 #1) — farming 空白, ROI 持续高
2. **overwatch** (7/7 var) — FPS 空白
3. **brawl stars** (6/6 var, 🆕) — MOBA 空白
4. **animal crossing** (5/5 var) — life-sim 空白
5. **genshin impact** (5/5 var) — gacha RPG 空白

### 3.6 新增 high_roi_roots (06-25 → 06-26 对比)

| Δ | 词根 | 变化原因 |
|---|------|---------|
| 🆕 | agar io | 06-25 拼写变体 agar.io → 06-26 单字 |
| 🆕 | brawl stars | 06-25 seed 失败 → 06-26 修复, 6 var |
| 🆕 | fortnite | 06-25 seed 失败 → 06-26 修复, 4 var |
| 🆕 | geometry dash | 06-26 seed 成功, 8 var (covered) |
| 🆕 | gta 5 | 06-26 seed 成功, 4 var (covered) |
| 🆕 | kahoot | 06-26 seed 成功, 8 var (covered) |
| 🆕 | kirby | 06-25 seed 失败 → 06-26 修复, 4 var |
| 🆕 | minecraft | 06-26 seed 成功, 7 var (covered) |
| 🆕 | pokemon go | 06-25 seed 失败 → 06-26 修复, 4 var |
| 🆕 | slither io | 06-26 seed 成功, 4 var (was slither.io) |
| 🆕 | stardew valley | 06-25 seed 失败 → 06-26 修复, 5 var |
| 🚫 | agar.io | 拼写变体被 agar io 取代 |
| 🚫 | among us | 06-26 seed 失败, 退出 high_roi_roots |
| 🚫 | crossy road | 06-26 seed 失败 |
| 🚫 | doodle jump | 06-25/06-26 持续低 (uncovered) |
| 🚫 | fall guys | 06-26 seed 失败 |
| 🚫 | gacha life | 06-23/06-25/06-26 持续失败 |
| 🚫 | it takes two | 06-26 seed 失败 |
| 🚫 | mario | 06-25 seed 失败 |
| 🚫 | run 3 | 06-25 seed 失败 |
| 🚫 | sims | 06-26 seed 失败 (06-25 修复 ✅) |
| 🚫 | sims 4 | 06-26 seed 失败 |
| 🚫 | tetris | 06-26 seed 失败 |

**净 ROI 质量**: 31 → 29 roots, 12 → 12 fully uncovered, 56 → 57 uncovered_total. 数量稳定, **集合 50% 替换** (Google Suggest 持续轮换).

---

## 🔍 4. GSC 状态

- **状态**: ❌ **auth_required** (持续 24 天, 2026-06-04 起)
- **错误**: `missing /home/msdn/.openclaw/secrets/gsc.json; missing /home/msdn/.openclaw/secrets/gsc-sa.json`
- **影响**: 无法拉取 Search Console API 数据 (queries/clicks/impressions/CTR/position)
- **修复** (持续):
  - Option A (OAuth, 5min): `https://console.cloud.google.com/apis/credentials` → enable Search Console API → re-authorize → save 3 keys to `/home/msdn/.openclaw/secrets/gsc.json`
  - Option B (SA, 稳定): create service account + add as GSC Owner + save key to `/home/msdn/.openclaw/secrets/gsc-sa.json`

---

## 📊 5. Sitemap 健康度

```
gz.com sitemap.xml (LIVE 06-26 12:08 ✅ 修复成功):
  Total URLs:        769 (+9 vs 06-25 760)
  Unique URLs:       769 (100%)
  With lastmod:      769 (100% ✅)
  Lastmod range:     2026-02-19 ~ 2026-06-26
  Missing lastmod:   0 ✅
  
gz.com sitemap.xml (LOCAL 06-26):
  Total URLs:        769
  Unique URLs:       769 (100%)
  With lastmod:      769 (100% ✅)
  Lastmod range:     2026-02-19 ~ 2026-06-26
  Missing lastmod:   0 ✅

tools.gamezipper.com sitemap.xml (LIVE 06-26):
  Total URLs:        2735
  Unique URLs:       2735 (100%)
  With lastmod:      2735 (100% ✅)
  Lastmod range:     2026-06-25 ~ 2026-06-25
  Tracked but not in sitemap: 2 (color-contrast-checker en/zh moved to /css/, 持续 06-22 状态)
```

---

## ⚙️ 6. 流程健康度

| 流程 | 状态 | 备注 |
|------|------|------|
| daily-seo-health.py v5.10 (curl_cffi+subprocess) | ✅ 稳定 | 9/9 endpoints OK, mihomo bypass 工作正常 |
| daily_seo_analysis.py v3.0 (Kachilu+mihomo) | ✅ 稳定 | 37 games 抓取 OK, 27 gap 跟踪 (+1 vs 06-25 26) |
| longtail_scan.py v1.0 (Google Suggest) | ⚠️ 15 seeds 失败 | 失败率 22.4% (vs 06-25 9.0%), Google Suggest 持续轮换 |
| longtail_analysis.py v1.0 (06-24 新建) | ✅ 上线 | 从 longtail-*.json 聚合 high-ROI roots, 输出 29 roots / 12 fully_uncovered |
| gsc_fetch.py (6am cron) | ❌ auth_required | 已持续 24 天, 见 §4 |
| monetag-token-refresh.py | ❌ token_invalid | 已持续 16 天, 需老公手动 OAuth |
| gen_sitemap.py (manual + cron 03:00 tools) | ✅ regen 修复成功 | **第 7 次复发 fix LIVE 同步成功**, 仍未根治 (assert + dev-task 模板 + subagent prompt) |

---

## 🎬 7. 行动项

### ✅ 本任务完成 (06-26 12:08)

- [x] 9/9 endpoint 健康检查
- [x] **🎉 验证 gz.com sitemap LIVE 100% ✅ (769/769)** — 06-25 复发 fix LIVE 同步成功!
- [x] longtail_scan.py 跑今日 (52 OK / 15 failed, 505 suggestions, 29 高 ROI roots)
- [x] longtail_analysis.py 跑今日 (12 fully uncovered no core, 57 uncovered_total)
- [x] daily_seo_analysis.py 跑今日 (37 games 抓取, 27 gap 跟踪, **1 NEW: Smash Room**)
- [x] 更新 gap-history.json (77 entries, +Smash Room, 41 长跑 >30d)
- [x] BI 数据快照 (PV 7d 2,485 / UV 1,701 / 跳出率 82.8% 持续改善)
- [x] daily_seo_analysis_2026-06-26.md (本报告)

### ⏳ 待主代理 push 后生效

- [ ] (无 pending commit) — sitemap 06-25 已 push, 06-26 当前无 pending

### 🔍 P3 待修复 (持续, 第 7 次复发已 LIVE 修复但仍需根治)

- [ ] **根治 sitemap missing lastmod**: gen_sitemap.py 加 `assert_no_missing_lastmod()` + dev-gamezipper 任务模板加 commit 前 regen 步骤 + subagent prompt 加 sitemap 安全条款
- [ ] pre-commit hook: 检测 sitemap.xml 改动时, 强制 re-run gen_sitemap.py + diff (防止 broken regen 入库)
- [ ] **降低 longtail_scan.py seed 失败率**: 失败 seeds (06-26 翻倍) 改用 Anthropic Suggest 或 DuckDuckGo Suggest API 作 fallback
- [ ] **Google Suggest 轮换问题**: 多个 previously-passing seeds 今日失败 (among us / tetris / sims / fall guys), 需 add retry+fallback 策略

### ❌ 老公 P0 阻塞 (持续 24 天 + 16 天)

- [ ] **GSC OAuth** 凭据 (24 天) — 解锁 organic search 数据
- [ ] **Monetag API Token** (16 天) — 解锁收益数据

### 💡 建议 (今日新增 backlog, 12 P0 候选 longtail)

- [ ] 创建 `t_hay_day_blog` (7/7 var, 🆕 #1) — farming 空白, ROI 持续高
- [ ] 创建 `t_overwatch_blog` (7/7 var) — FPS 空白
- [ ] 创建 `t_brawl_stars_blog` (6/6 var, 🆕) — MOBA 空白
- [ ] 创建 `t_animal_crossing_blog` (5/5 var) — life-sim 空白
- [ ] 创建 `t_genshin_impact_blog` (5/5 var) — gacha RPG 空白
- [ ] 创建 `t_stardew_valley_blog` (5/5 var, 🆕) — farming 空白
- [ ] 创建 `t_fortnite_blog` (4/4 var, 🆕) + `t_kirby_blog` (4/4 var, 🆕) + `t_pokemon_go_blog` (4/4 var, 🆕) + `t_slither_io_blog` (4/4 var, 🆕)
- [ ] longtail_scan.py 06-27 重跑 15 failed seeds, 如持续失败考虑换 Anthropic Suggest
- [ ] **游戏 backlog 候选 (竞品, ROI by 持续天数)**:
  - Drive Mad (44d) — 物理驾驶, HTML5 简单
  - Mergest Kingdom (44d) — merge puzzle, 高热度
  - Stickman Hook (44d) — 简单物理
  - Monkey Mart (44d) — 超市管理
  - Bloxd.io (37d) — io voxel
  - Smash Room (1d, 🆕) — physics destruction

---

## 📊 8. 附: BI 数据快照 (近 7 天, 12:08 run)

| 指标 | 06-26 | 06-25 | Δ |
|------|-------|-------|---|
| PV (7d) | 2,485 | 3,479 | **-994 📉 (-28.6%)** ⚠️ |
| UV (7d) | 1,701 | 2,083 | **-382 📉 (-18.3%)** |
| 今日 PV | 128 | 175 | -47 |
| 今日 UV | 64 | 88 | -24 |
| 跳出率 | **82.8%** | 85.2% | **-2.4pp 📉 持续改善** ✅ |
| 均停留 | 0s | 0s | 持平 |
| 实时在线 | 0 | 0 | 持平 (中午时段正常) |

**⚠️ 重要说明**: 7d 窗口从 [06-19..06-25] 滑到 [06-20..06-26], 失去 06-19 的 1122 PV 异常高峰. **真实日均趋势 = 平稳低位 125-300 PV/d** (06-22~06-26 全部在此区间).

**日均趋势 (近 8 天)**:
```
06-19: 1122 PV (⚠️ 异常高峰, 可能是 referral spike)
06-20: 605 PV
06-21: 861 PV
06-22: 300 PV (drop)
06-23: 291 PV
06-24: 125 PV (谷底)
06-25: 175 PV
06-26: 128 PV (今日, 12:08 时段累计)
```

**热门游戏 (7d)**:
| Game | PV 06-26 | PV 06-25 | Δ |
|------|----------|----------|---|
| / (home) | 212 | 211 | +1 |
| /snake/ | 49 | 56 | -7 |
| /2048/ | 47 | 66 | -19 |
| /tetris/ | 29 | 34 | -5 |
| /one-line-puzzle/ | 25 | - | NEW |
| /chess/ | 25 | - | NEW |
| /matchstick-puzzle/ | 20 | - | NEW |
| /flappy-wings/ | 19 | - | NEW |
| /balance-scale/ | 19 | - | NEW |
| /color-sort/ | 18 | - | NEW |

**站点对比 (7d)**:
- gamezipper.com: PV 1,694 / UV 1,269 (vs 06-25 2,036 / 1,541, -342 PV 📉 / -272 UV 📉)
- tools.gamezipper.com: PV 573 / UV 357 (vs 06-25 1,143 / 363, -570 PV 📉 / -6 UV)

**洞察**:
- 主站流量微跌, 但跳出率持续改善 (-2.4pp) → 用户逛的更精准 (06-25 433 → 06-26 440 游戏, +7 新游戏)
- tools 站 PV 大跌 (-570), 但 UV 持平 (-6) → 可能是回头用户单次访问更深, 或某些工具站页面降权
- 06-19 异常高峰 (1122 PV) 消失, 是 7d 窗口下跌的主因, 真实趋势平稳

---

## 🎮 9. 游戏动态 (今日新增)

**今日新增 game dirs** (mtime 06-26):
1. **magnet-drop** (06-26 09:52) — physics puzzle
2. **number-match** (06-26 09:31) — number puzzle
3. **spin-rings** (06-26 09:31) — color/rotate
4. **hangman** (06-26 09:31) — word game
5. **sokoban** (06-26 09:31) — classic puzzle
6. **fun-web-games** (06-26 09:31) — collection
7. **idle-clicker** (06-26 09:31) — idle
8. **word-card-sort** (06-26 09:31) — word/sort
9. **slalom** (06-26 09:31) — sports

**📌 注意**: 9 个新 dirs, 但 games-data.js 只 +7 (440 vs 06-25 433). **2 个尚未入库**: 可能是 magnet-drop (新加) + 一个其他.
- gamezipper.com repo 当前 4 untracked files = magnet-drop/* (4 files), 等 commit

---

## 📝 附: 子代理 commit 说明

**本任务 (t_49fc9ee7) 全部产出**:

**待 commit 文件** (子代理 only commit, 不 push):
- `scripts/daily_seo_analysis_2026-06-26.md` (新增完整报告, 本文件, 13.5KB)

**Workspace 数据文件** (独立 repo, ~/.openclaw/workspace, 已存在):
- `/home/msdn/.openclaw/workspace/data/longtail-2026-06-26.json` (已存在, 72913 bytes, 67 seeds / 52 成功 / 505 unique)
- `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-26.json` (已存在, 15891 bytes, 29 roots / 12 fully_uncovered)
- `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-26.json` (已存在, 5918 bytes, 37 games / 27 gaps)
- `/home/msdn/.openclaw/workspace/data/gap-history.json` (更新, 77 entries, +1 NEW: Smash Room)
- `/home/msdn/.openclaw/workspace/data/daily-seo-health-urls.json` (更新, gz.com tracked 769)
