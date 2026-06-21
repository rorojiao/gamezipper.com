# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-21 11:03 CST (增量)

> **任务**: kanban t_833e4ccc (🔍 每日SEO+竞品+长尾词分析 — 11:03 re-run)
> **对比基线**: 2026-06-21 10:08 (t_17f71881) → **2026-06-21 11:03 (t_833e4ccc)**
> **核心结论**: 50 分钟内数据基本稳定, 无重大新缺口. 增量 +1 URL submitted, +1 game入库, 3 项 SEO 优化提交.

---

## 🎯 60s Executive Summary (vs 10:08 baseline)

1. **9/9 endpoints ✅ + 1 new URL submitted** — gz.com sitemap **721 URLs (100% lastmod)**, 50 min 内净 +1 URL 已 IndexNow 提交 (Bing 200)
2. **📦 Game count 393 → 395 (+2)** — Marginal Sudoku + **Palindrome Sudoku** 在 10:18~11:09 期间由 dev-gamezipper 入库
3. **🎯 竞品 0 new gaps** — Poki + CrazyGames 25+12=37 游戏, Car Circle + SuperWEIRD 第二次出现 → 进入 25 个 recurring 列表
4. **🔑 长尾词 Google Suggest rate-limited**: 612 → 583 unique (-29), 4 → 7 seeds failed (+3). 18 个 NEW high-ROI 长尾词 (P1 候选) 数据与 10:08 一致, 未新增.
5. **🆕 3 项 SEO 优化 commits** (10:18~11:02 期间, 来自其它任务):
   - `704f15958f` SEO: Fix 118 pages with broken og:image references
   - `bcdbf3f50e` Fix: Double-encoded &amp;amp; entities in blog listing titles
   - `6da4e68784` SEO: Add twitter:card meta tags + favicon links to 233 blog & category pages
6. **🚨 持续 P0 阻塞**: GSC OAuth (19 天) + Monetag API Token (11 天) — search/revenue 双失明
7. **📋 ready board 跟踪**: t_ac91518b (games-like-stardew-valley, P0 ✅) + t_e38dc49a (games-like-terraria, P1) + t_0e4b25c5 (best-io-games, P0 ✅)

---

## 🔧 1. 技术 SEO 状态 (vs 10:08)

### 1.1 端点检查 (9/9 ✅)

| Endpoint | HTTP | 状态 | vs 10:08 |
|----------|------|------|---------|
| gamezipper.com/robots.txt | 200 | ✅ | 同 |
| gamezipper.com/sitemap.xml | 200 | ✅ | **721 <loc>** (10:08: 720, +1) |
| gamezipper.com/indexnowkey.txt | 200 | ✅ | 同 |
| gamezipper.com/ | 200 | ✅ | 同 |
| gamezipper.com/2048/ | 200 | ✅ | 同 |
| tools.gamezipper.com/robots.txt | 200 | ✅ | 同 |
| tools.gamezipper.com/sitemap.xml | 200 | ✅ | 2407 (10:08: 2407) |
| tools.gamezipper.com/027a...txt | 200 | ✅ | 同 |
| tools.gamezipper.com/ | 200 | ✅ | 同 |

### 1.2 IndexNow 状态 (+1 new)

| Host | Sitemap | Tracked | New (vs 10:08) | Submitted | Last OK |
|------|---------|---------|-----|-----------|---------|
| gamezipper.com | 721 | 721 | **+1** (10:08: 720) | **+1** | 2026-06-21T11:03:14 |
| tools.gamezipper.com | 2407 | 2407 | 0 | 0 | 2026-06-21T03:00:05 |

**+1 URL** 详情: 新增在 tracked 列表末尾的 URL (10:04 last 5 中出现的 `https://gamezipper.com/zuma/` 之前, 11:03 又新增 1 个 — 推测来自 dev-gamezipper 在 10:18 之后的入站). Bing API 返回 200 OK.

### 1.3 ✅ sitemap 100% lastmod (维持)

- **gz.com**: 721/721 unique, **721/721 lastmod (100% ✅)** — 维持 (10:07 commit fc1fe185bf 修复 3 sudoku 缺 lastmod 后稳定)
- **tools**: 2407/2407 unique, 2407/2407 lastmod (100% ✅) — 维持
- **净变化 vs 10:08**: 0 missing (维持 100%)
- **P3 根治待办**: gen_sitemap.py 加 assert + dev-task 模板加 regen 步骤 (第 3 次复发仍未根治)

### 1.4 🆕 SEO 优化 commits (10:18~11:02 期间)

| Commit | 描述 | 影响范围 |
|--------|------|---------|
| `704f15958f` | SEO: Fix 118 pages with broken og:image references | 118 个页面 og:image 修复, social share 卡预览可用 |
| `bcdbf3f50e` | Fix: Double-encoded &amp;amp; entities in blog listing titles | blog 列表页 & 实体解码 |
| `6da4e68784` | SEO: Add twitter:card meta tags + favicon links to 233 blog & category pages | twitter:card + favicon, Twitter share 卡完整 |

**估值**: 这 3 个 commit 总共影响 **118 + 多个 + 233 = ~350 个页面**, 对 social sharing / Twitter card / blog 标题显示质量有显著提升. **不直接增加 sitemap URLs** (因为只是 metadata 修复, 不是新增页面), 所以 sitemap 只净 +1.

---

## 🎮 2. 竞品追踪 (vs 10:08)

### 2.1 抓取概况 (11:03 CST, Kachilu Browser + mihomo)

| 竞品 | 抓取页 | 抓到游戏 | vs 10:08 |
|------|--------|---------|----------|
| CrazyGames /t/new | 12 | 12 | 0 (同) |
| Poki /en/new | 25 | 25 | 0 (同) |
| Total | 37 | 37 | **0 new** |

### 2.2 缺口分析 (vs 10:08)

| 指标 | 10:08 | 11:03 | 变化 |
|------|-------|-------|------|
| 总缺口 | 25 | 25 | 0 |
| 新缺口 | 2 (Car Circle + SuperWEIRD) | **0** | -2 (迁移到 recurring) |
| 持续缺口 | 23 | **25** | +2 |

**结论**: Car Circle + SuperWEIRD 在 11:03 第二次出现在 Poki /new → 升级为 recurring (1 day → 2 days). 这与 06-20 Murder 1 天跌出模式相反, 是短期有效的迹象. 但 ROI 评估不变:
- **Car Circle** (2D circle stunt): 🟢 LOW — 单一品类, 搜索量低, 暂不启动观察期
- **SuperWEIRD** (casual/meme): 🟢 LOW — 怪诞风格搜索量极低, 留存差, 暂不启动

### 2.3 🔄 Top 5 持续缺口 (维持 10:08 排序)

| # | 游戏 | 来源 | 持续天数 | ROI |
|---|------|------|---------|-----|
| 1 | 8 Ball Billiards Classic | crazygames | **41** (10:08: 40) | 🟠 HIGH |
| 2 | Airplane Manager | poki | **11** (10:08: 10) | 🟠 HIGH |
| 3 | Bloxd.io | crazygames | **34** (10:08: 33) | 🔥 HIGH |
| 4 | Box Monster Dress Up | poki | **11** (10:08: 10) | 🟡 MEDIUM |
| 5 | Four Colors | crazygames | **14** (10:08: 13) | 🟡 MEDIUM |

**观察**: 持续天数都 +1 (符合每日递增). Top 3 持续 30+ 天的 8 Ball / Airplane / Bloxd 都是稳定长尾驱动型, 仍未启动. 建议下次 daily-run 重点推送这些 P1 卡.

---

## 🔑 3. 长尾词机会 (vs 10:08)

### 3.1 扫描概况对比

| 指标 | 10:08 | 11:03 | 变化 |
|------|-------|-------|------|
| Seeds total | 67 | 67 | 0 |
| Seeds with suggestions | 63 (94.0%) | **60 (89.6%)** | -3 ⚠️ rate limit |
| Seeds failed | 4 | **7** | +3 ⚠️ |
| Total unique suggestions | 612 | **583** | **-29** ⚠️ |
| Longtail gap count | 258 | **229** | **-29** ⚠️ |
| Existing blog slugs | 296 | 296 | 0 |

**根因**: Google Suggest 在 50min 内对 3 个新 seed 触发 rate limit (games like roblox / gta / slither.io / animal crossing / play sudoku / play snake 等). 这是已知的 Google 抗爬行为, 与 daily 频率运行有关.

**应对**: 18 个 NEW high-ROI 长尾词结论**不变** (来自 10:08 baseline, P1 候选清单见下方 §3.2). 11:03 数据未发现新候选.

### 3.2 🔥 18 全新高 ROI 长尾词 (10:08 baseline 结论, 🟠 P1 候选, 未变化)

| # | Root | Vars | 类别 | 行动 |
|---|------|------|------|------|
| 1 | animal crossing | 8 | life-sim | P1 派 blog-writer |
| 2 | hay day | 8 | farming | P1 派 blog-writer |
| 3 | among us | 7 | social deduction | P1 派 blog-writer |
| 4 | brawl stars | 7 | multiplayer | P1 派 blog-writer |
| 5 | overwatch | 7 | FPS | P1 派 blog-writer |
| 6 | sims | 7 | life-sim | P1 派 blog-writer |
| 7 | genshin impact | 6 | RPG | P1 派 blog-writer |
| 8 | zelda | 6 | RPG | P1 派 blog-writer |
| 9 | crossy road | 5 | arcade | P1 派 blog-writer |
| 10 | fortnite | 5 | battle royale | P1 派 blog-writer |
| 11 | kirby | 5 | platformer | P1 派 blog-writer |
| 12 | stardew valley | 5 | farming | ✅ t_ac91518b P0 ready |
| 13 | it takes two | 4 | co-op | P1 派 blog-writer |
| 14 | slither io | 4 | .io | P1 派 blog-writer |
| 15 | 1v1 lol | 3 | 2D 格斗 | P1 派 blog-writer |
| 16 | mario party | 3 | party | P1 派 blog-writer |
| 17 | mario | 2 | platformer | P1 派 blog-writer |
| 18 | mario kart | 2 | racing | P1 派 blog-writer |

### 3.3 ⚠️ 长尾 ROI 限制 (GSC 失明 19 天)

无法验证上述长尾词的真实 search volume / CTR / 已写 blog organic 流量.
**修复**: t_84f6f890 blocked 等老公手动 OAuth (5min) 或 SA 凭据.

---

## 📈 4. 增长指标汇总 (vs 10:08)

| 维度 | 10:08 | 11:03 | Δ |
|------|-------|-------|---|
| gz.com 游戏数 | 393 | **395** | +2 (Marginal Sudoku + Palindrome Sudoku, 11:09 时已加入) |
| gz.com sitemap URLs | 720 | **722** | +2 |
| gz.com lastmod | 100% | **100%** | 0 |
| gz.com IndexNow tracked | 720 | **721** | +1 (11:03 IndexNow) |
| tools sitemap URLs | 2407 | 2407 | 0 |
| tools lastmod | 100% | 100% | 0 |
| 9/9 endpoints | ✅ | ✅ | 0 |
| 竞品总缺口 | 25 | 25 | 0 |
| 竞品新缺口 | 2 | **0** | -2 (迁移到 recurring) |
| 长尾 unique sug | 612 | **583** | -29 (rate limit) |
| 长尾 gap 数 | 258 | **229** | -29 (rate limit) |
| HIGH ROI 长尾 NEW | 18 | 18 | 0 (10:08 baseline) |

---

## 🎬 5. 行动项

### ✅ 本任务完成 (06-21 11:03 t_833e4ccc)
- [x] 9/9 endpoint 健康检查 (curl_cffi+DIRECT 仍稳定)
- [x] +1 new URL 提交到 IndexNow (gz.com, Bing 200)
- [x] sitemap 721/721 100% lastmod ✅ (维持)
- [x] 竞品 re-scrape (37 games, 0 new, 25 recurring)
- [x] 长尾 re-scan (rate-limited, baseline 18 NEW high-ROI 不变)
- [x] 数据保存: `daily-growth-2026-06-21.json` + `longtail-2026-06-21.json` 已更新
- [x] 增量报告 `daily_seo_analysis_2026-06-21_11.md` 已生成

### 🔍 待观察 (P1 候选, 已 in 10:08 报告)
- [ ] **games-like-animal-crossing** (8 var, life-sim 空白)
- [ ] **games-like-hay-day** (8 var, farming 空白)
- [ ] **games-like-among-us** (7 var, social deduction)
- [ ] **games-like-brawl-stars** (7 var, multiplayer)
- [ ] **games-like-overwatch** (7 var, FPS)
- [ ] (其他 13 个见 §3.2)

### 🔍 Top 3 持续 30+ 天缺口 (P1 候选, 未启动)
- [ ] **8 Ball Billiards Classic** (41 天, HIGH, billiards/pool)
- [ ] **Bloxd.io** (34 天, HIGH, .io 品类第一缺口)
- [ ] **Airplane Manager** (11 天, HIGH, idle/tycoon)

### ❌ 老公 P0 阻塞 (持续, 19 天)
- [ ] **GSC OAuth** 凭据 (t_84f6f890 blocked) — 解锁 organic search 数据盲区
- [ ] **Monetag API Token** (11 天, publishers.monetag.com reCAPTCHA 阻挡)

### 📋 P3 持续
- [ ] **sitemap lastmod 根治方案**: gen_sitemap.py 加 assert + dev-task 模板加 regen 步骤 (第 3 次复发, 此次靠 commit fc1fe185bf 抢修, 但下次仍会复发)
- [ ] **Google Suggest rate limit 应对**: 长尾扫描间隔 ≥ 60min, 或加 proxy rotation

### 📊 现有 ready 跟踪
- [x] t_ac91518b: games-like-stardew-valley (P0 ready, gap_score 5) ✅
- [ ] t_e38dc49a: games-like-terraria (P1 ready, gap_score 1)
- [x] t_0e4b25c5: best-io-games (P0 ready, 100K+ 搜索量) ✅

---

## 📎 附件

- 完整 10:08 baseline 报告: `daily_seo_analysis_2026-06-21.md` (488 行, 28K)
- SEO health: `daily_seo_2026-06-21.md` (10:04, 修复 3 个 lastmod)
- 数据文件: `/home/msdn/.openclaw/workspace/data/{daily-growth-2026-06-21,longtail-2026-06-21,daily-seo-health-urls}.json`
- IndexNow log: `gamezipper.com/scripts/indexnow_submitted_2026-06-21.txt`
- 提交 hash: 待 commit (pre-commit hook 检测到 395 vs 394 GAMES-vs-schema drift, 由 dev-gamezipper 加入 palindrome-sudoku 但未同步 schema — **非本任务范围**, 已 unstage MD 文件待主代理修复 drift 后统一 commit)

---

## 🚨 发现 (NOT in scope, 需主代理/其他 worker 处理)

**Pre-commit hook 失败** (commit 阶段):
- ❌ GAMES vs Schema numberOfItems DRIFT (395 vs 394)
- ❌ GAMES vs Schema itemListElement.length DRIFT (395 vs 394)
- 修改文件: index.html / js/games-data.js / sitemap.xml
- 新增目录: palindrome-sudoku/ (untracked)

**根因**: dev-gamezipper (或其它 worker) 在 10:18~11:09 期间加入 palindrome-sudoku 游戏 (395 total), 但 schema.org JSON-LD 仍显示 394.

**修复**: 跑 `bash scripts/sync-game-counts.sh` 看具体差异, 同步更新 index.html 的 JSON-LD schema (`numberOfItems` 和 `itemListElement`) 到 395.

**本任务处理**: 已 unstage my MD file. 主代理修复 drift 后, 与 MD 文件一起 commit (本任务产物). **子代理不应绕过 pre-commit hook** (per AGENTS.md 铁律).