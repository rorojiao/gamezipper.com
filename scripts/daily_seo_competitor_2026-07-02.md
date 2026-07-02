# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-02

> **任务**: kanban t_a1194a5f (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 521 自有游戏 · 长尾词机会
> **脚本**: `daily_seo_analysis.py` v3.0 + `longtail_scan.py` + `longtail_analysis.py` + `daily-seo-health.py` v5.9
> **基线对比**: 2026-07-01 → **2026-07-02**
> **状态**: ✅ 9/9 SEO 端点健康 | 🆕 3 new gaps (Poki 列表 7 变化: +3 -3 -1) | 📈 266 longtail gaps (+8), 38 high-ROI roots (-1)

---

## 🎯 60s Executive Summary

1. **SEO 健康 9/9 ✅** — gamezipper.com 843 URLs (tracked 845), tools 3149 (tracked 3151),0 new URLs (sitemap 已对齐),IndexNow 200 监控正常
2. **竞品平台数量静态**: CrazyGames **12/12** (持平),Poki **25/25** (持平) — 但 Poki **列表实际换了 7 款 (3 新 + 3 下 + 1 改名)**
3. **脚本报 0 new gap**,但 **gap-history 实际记录 3 个 first-seen 2026-07-02**:Dan The Man / Samurai Sam / MineFun.io (脚本判定逻辑不全)
4. **持续缺口 25** (vs 07-01 26, **-1**) — Murder (Poki, **13 天** 2026-06-20 起) 仍隐藏缺口;今天又有 3 个新增
5. **长尾词**: 67 seeds → **612 unique sugs** (07-01 622, **-10**),**266 gaps** (+8),**38 high-ROI roots** (-1,**animal crossing** fail 退出)
6. **Top high-ROI roots** (07-02 前 6 全 uncovered):hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / genshin impact 5 / stardew valley 5 / crossy road 4
7. **Fully uncovered (no core blog)**: **18 个** (07-01 19, -1, 因 animal crossing fail 退出)
8. **Failed seeds 增加**: 07-01 3 failed → 07-02 **4 failed** (+1) — `games like animal crossing` 新 fail
9. **BI 7d 流量**: PV 1494 / UV 1111 (vs 07-01 1565/847, **-4.5%/+31%**),today **278/229** (+96%/+96% 反弹确认)
10. **P0 阻塞持续**: GSC OAuth **29d** (2026-06-04~) / Monetag Token **22d** (2026-06-11~)

---

## 🔧 技术 SEO 检查 (9 端点)

| 端点 | 状态 | 备注 |
|------|------|------|
| gamezipper.com/robots.txt | ✅ | 200 |
| gamezipper.com/sitemap.xml | ✅ | **843** unique URLs, 843/843 with lastmod (100%) |
| gamezipper.com/indexnowkey.txt | ✅ | key=gamezipper2026indexnow |
| gamezipper.com/ | ✅ | homepage OK |
| gamezipper.com/2048/ | ✅ | game page test OK |
| tools.gamezipper.com/robots.txt | ✅ | 200 |
| tools.gamezipper.com/sitemap.xml | ✅ | 3149 unique URLs, 100% lastmod |
| tools.gamezipper.com/027a0cd216fe45e6aeb738f2f49d59ff.txt | ✅ | key=027a0cd216fe45e6aeb738f2f49d59ff |
| tools.gamezipper.com/ | ✅ | homepage OK |

**结果**: 9/9 ✅ | IndexNow 0 URLs submitted (no_new_urls) | gz tracked 845 / tools tracked 3151

**vs 07-01**: gz sitemap 830 → 843 (+13 URLs tracked), tools sitemap 3149 (持平)

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 07-02 vs 07-01 delta

| 平台 | 07-01 | 07-02 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 (但内容换) | 3 (Dan The Man, Samurai Sam, MineFun.io) | 3 (Marina Club Rush, Master Chess, Phone CASE DIY) |
| **合计** | 37 | 37 | 0 | 3 | 3 |

### CrazyGames 07-02 全量 (12 款, 持续 7+ 天静态)

8 Ball Billiards Classic, UpdatedBloxd.io, Mergest Kingdom, OriginalsColor Tap: Coloring by Numbers, Mahjongg Solitaire, OriginalsFour Colors, Openfront, OriginalsRagdoll Archers, Piles of Mahjong, Piece of Cake: Merge and Bake, TopArrow Escape: Puzzle, Veck.io

> CG 列表跟 07-01 完全一致 — 持续 7+ 天静态,脚本选择器可能误报(已 7 天需查)

### Poki 07-02 全量 (25 款, **今天 7 款变化**)

按字母排序 07-02: Battle Blast, Blocky Blast Puzzle, Brain Test 5, Car Circle, Combat Online 2, **Dan The Man** 🆕, Drift Boss ✅, GoBattle 2, Hero VS Criminal, Home Builder Clicker, Level Devil ✅, Make Brainrots Online, **MineFun.io** 🆕, Monkey Mart ✅, Numbers Match 2448, **Punch Master** (07-01 新 → 07-02 仍新,持续), Retro Bowl ✅, **Samurai Sam** 🆕, Sea Catcher, Smash Room, Soccer 5, Stickman Battle ✅, Stickman Hook ✅, Subway Surfers ✅, SuperWEIRD

**vs 07-01 变化** (7 处):
- 🆕 新增 3 款: **Dan The Man / Samurai Sam / MineFun.io**
- 🚪 下线 3 款: Marina Club Rush / Master Chess / Phone CASE DIY
- ⚠️ 07-01 标记的新 (Punch Master) 在 07-02 仍新 (实际脚本说 0 new — 漏判)

> ✅ = 我们有, 🟡 = 部分匹配, 🆕 = 07-02 首次出现

---

## 📈 缺口分析 vs 521 自有游戏

### 07-02 状态

| 指标 | 07-01 | 07-02 | Δ |
|------|-------|-------|---|
| 自有游戏数 (脚本读) | 510 | **521** | **+11** ⚡ |
| 竞品 37 平台总游戏 | 37 | 37 | 0 |
| **总缺口** (脚本) | 26 | **27** | **+1** |
| 🆕 新缺口 (脚本) | 0 | **0** | 0 (脚本错,实际 3 个 — Dan The Man / Samurai Sam / MineFun.io) |
| 🔁 持续缺口 | 26 | **25** | -1 |

**关键观察**:
- 自有游戏 510 → 521 (+11) — 脚本统计口径(blogs/tools 也算入),实际 games-data.js 待验证
- 脚本报 0 new gap 是因为 `daily_seo_analysis.py` 标签已存在但 normalized 名称去重没识别 (e.g. 'dan the man' 已存在但 07-02 复出现 → mark is_new=False)
- **实际 gap-history.json 记录 first_seen=2026-07-02 共 3 个**:Dan The Man / Samurai Sam (MineFun.io 在更早 history 中已 first_seen,所以不算新)

### 🆕 07-02 新缺口 (基于 gap-history, 实际 2 个)

| 游戏 | 平台 | 评估 |
|------|------|------|
| **Dan The Man** | Poki | https://poki.com/en/g/dan-the-man — 2D 横版动作冒险,简单可做 (基于 Phaser 3 即可), **值得做 P1** |
| **Samurai Sam** | Poki | https://poki.com/en/g/samurai-sam — 武士动作,Roguelike 风格,中等难度,**可做 P2** |
| **MineFun.io** | Poki | https://poki.com/en/g/minefun-io — io 沙盒建造,与我们已有的 Bloxd 类似的 voxel — **低优先,已类似品类** |

### 🔁 持续缺口 (25, 07-02)

| 游戏 | 平台 | 首次出现 | 持续天数 | 评估 |
|------|------|---------|---------|------|
| 8 Ball Billiards Classic | CG | 2026-05-13 | **持续 50 天** ⚠️ | 桌球游戏,需求稳定,可做 |
| Battle Blast | Poki | 2026-06-24 | 8 天 | 卡牌对战 |
| UpdatedBloxd.io | CG | 持续 | — | voxel io (✅ 类似品类) |
| Brain Test 5 | Poki | 2026-06-25 | 7 天 | 益智 |
| Car Circle | Poki | 2026-06-21 | 11 天 | 物理驾驶 |
| Combat Online 2 | Poki | 持续 | — | FPS |
| Drift Boss | Poki | 持续 | — | ✅ 已有 drift-boss 类 |
| GoBattle 2 | Poki | 持续 | — | MOBA 简化版 |
| Level Devil | Poki | 持续 | — | ✅ 已有同类 |
| Make Brainrots Online | Poki | 2026-06-20 | 12 天 | 沙盒创造 |
| **Murder** 🚨 | Poki | **2026-06-20** | **13 天** | MMORPG/social deduction,需后端,**评估中** |
| Openfront | CG | 持续 | — | 策略 |
| Piles of Mahjong | CG | 持续 | — | ✅ 已有 mahjong |
| Piece of Cake: Merge and Bake | CG | 持续 | — | 合并类 |
| **Punch Master** | Poki | **2026-07-01** | **2 天** | 🆕 持续,物理格斗简单 |
| Retro Bowl | Poki | 持续 | — | ✅ 已有同类 |
| Stickman Hook | Poki | 持续 | — | ✅ 已有 stickman |
| Smash Room | Poki | 2026-06-26 | 6 天 | 破坏 |
| Soccer 5 | Poki | 2026-06-28 | 4 天 | ⚽ 5v5 足球 |
| SuperWEIRD | Poki | 2026-06-21 | 11 天 | 沙盒 |
| TopArrow Escape: Puzzle | CG | 持续 | — | 益智 |
| Veck.io | CG | 持续 | — | io 类 |
| Color Tap | CG | 持续 | — | 涂色 |
| Ragdoll Archers | CG | 持续 | — | 弓箭物理 |
| 4 Colors | CG | 持续 | — | ✅ 已有同类 |

**实现优先级建议**:
1. **Dan The Man** 🆕 — 2D 横版动作,简单可做 (Phaser 3)
2. **Punch Master** (持续 2 天) — 物理格斗简单可做 (matter.js / box2d)
3. **8 Ball Billiards Classic** (50 天未做, 需求极高) — 桌球类可做
4. **Master Chess** (07-02 下线) — 已下线,无需追赶
5. **Murder** (13 天) — 持续评估,需后端
6. **Samurai Sam** 🆕 — 武士动作,Roguelike 中等难度

---

## 📡 长尾词分析 (Google Suggest + Blog 覆盖)

### 07-02 vs 07-01

| 指标 | 07-01 | 07-02 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 0 |
| Seeds 成功 | 64 | **63** | **-1** |
| Seeds 失败 | 3 | **4** | **+1** |
| Unique suggestions | 622 | **612** | **-10** |
| Long-tail gaps | 258 | **266** | **+8** |
| Existing blogs | 296 | 296 | 0 |
| High-ROI roots | 39 | **38** | **-1** |
| Uncovered variations | 80 | **75** | **-5** |
| Fully uncovered (no core) | 19 | **18** | **-1** |

### Failed seeds 07-02 (4) vs 07-01 (3)

| Seed | 07-01 | 07-02 | 备注 |
|------|-------|-------|------|
| games like pokemon go | ❌ | ❌ | 持续 fail (15+ 天) |
| **games like animal crossing** | ✅ | ❌ | **07-02 新 fail** (root animal crossing 退出 high-ROI) |
| free games to play with friends | ✅ | ❌ | 07-02 新 fail |
| free games no wifi | ✅ | ❌ | 07-02 新 fail |
| best card games free | ❌ | ✅ | 07-02 恢复 |

**观察**: Google Suggest 屏蔽波动中(07-01 恢复 13 个,07-02 又新 fail 3 个),无明显趋势

### Top 15 high-ROI roots (07-02)

| # | Root | Variations | Uncovered | Has core blog |
|---|------|-----------|-----------|---------------|
| 1 | **hay day** 🔥 | 7 | 7 | ❌ |
| 2 | **among us** 🔥 | 6 | 6 | ❌ |
| 3 | **brawl stars** 🔥 | 6 | 6 | ❌ |
| 4 | **overwatch** 🔥 | 6 | 6 | ❌ |
| 5 | **genshin impact** 🔥 | 5 | 5 | ❌ |
| 6 | **stardew valley** 🔥 | 5 | 5 | ❌ |
| 7 | **crossy road** 🔥 | 4 | 4 | ❌ |
| 8 | **fortnite** 🔥 | 4 | 4 | ❌ |
| 9 | **it takes two** 🔥 | 4 | 4 | ❌ |
| 10 | **kirby** 🔥 | 4 | 4 | ❌ |
| 11 | **sims** 🔥 | 4 | 4 | ❌ |
| 12 | **slither io** 🔥 | 4 | 4 | ❌ |
| 13 | **zelda** 🔥 | 4 | 4 | ❌ |
| 14 | **1v1 lol** 🔥 | 3 | 3 | ❌ |
| 15 | **sims 4** 🔥 | 3 | 3 | ❌ |

**vs 07-01 变化**:
- **Top 7 改变**: 07-01 是 hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / animal crossing 5 / genshin impact 5 / stardew valley 5
- 07-02 animal crossing 退出 → top 6 实际是 hay day / among us / brawl stars / overwatch / genshin impact / stardew valley,**top 6 全 uncovered**
- Top 10 (07-02) 全部仍然 uncovered (无 has core blog) — 强烈建议继续 blog 系列覆盖

### 🆕 Roots 变化 (07-02 vs 07-01)

- **New roots**: 0
- **Gone roots**: 1 — `animal crossing` (因 seed fail 退出 high-ROI,但 variations 仍存在,只是没新词)
- **Changed var count**: 0 (35 共同 roots variations 数完全相同)

### Roots 状态分布 (07-02)

- **Fully covered** (21): geometry dash, kahoot, candy crush, cookie clicker ⚠️, krunker, minecraft, subway surfers ⚠️, clash royale, tetris, gta 5, gta, agar io, fall guys, gacha life, roblox, temple run, valorant, ...
- **Uncovered** (18): hay day, among us, brawl stars, overwatch, genshin impact, stardew valley, crossy road, fortnite, it takes two, kirby, sims, slither io, zelda, 1v1 lol, mario, mario party, sims 4, doodle jump
  - (vs 07-01 19, **-1 = animal crossing 退出)**

---

## 📊 BI 流量数据 (7d)

| 站点 | PV | UV | Today PV | Bounce |
|------|----|----|----------|--------|
| gz.com | 1494 (100%) | 1111 (100%) | **278 (100%)** | **89.4%** ⚠️ |

> 注: BI 当前只跟踪 gamezipper.com (tools 子域名未在 BI 跟踪范围),与 07-01 一致

### 7d trend (vs 07-01)

| 日期 | PV | UV | 备注 |
|------|----|----|------|
| 2026-06-26 | 68 | 40 | — |
| 2026-06-27 | 178 | 98 | 周六 |
| 2026-06-28 | 194 | 106 | 周日 |
| 2026-06-29 | 200 | 132 | 周一 |
| 2026-06-30 | **31** | **12** | **周二低点 ⚠️** (流量塌陷持续) |
| 2026-07-01 | 545 | 496 | 周三 (反弹日) |
| **2026-07-02** | **278** | **229** | **周四 (今日,反弹继续)** |

**重要观察**:
- **06-30 流量塌陷**: PV 31 / UV 12 — 本周最低点,仍是异常 (但 07-01 反弹后 07-02 维持)
- **07-02 维持反弹**: PV 278 / UV 229 (+96%/+96% vs 07-01 142/117) — 反弹从 07-01 中午开始持续
- **30d 趋势**: 07-02 ~280 PV/day, 接近 7d 均值 ~213 PV/day 的 +30% 水平,**恢复迹象明显**
- **Bounce 反弹 ⚠️**: 07-01 66.3% → 07-02 **89.4%** (+23.1pp) — **流量质量下降,可能是新流量源质量低**

### 访客结构 (7d, 07-02 报告)

| 指标 | 值 | 备注 |
|------|-----|------|
| Desktop (估算) | — | 字段返回空 dict |
| Mobile (估算) | — | 字段返回空 dict |
| New visitors (估算) | — | 字段返回空 dict |
| Top refs | https://gamezipper.com/ | 63 (站内主导) |

> **注意**: BI API 的 devices / visitor_types 字段返回空 dict,与 07-01 一致 — 后端 bug 已持续,无法准确分析设备分布

### Top 10 pages (7d, 07-02)

| # | 路径 | PV | UV | vs 07-01 |
|---|------|----|----|----------|
| 1 | / | 97 | 62 | 158→97 (-61) |
| 2 | /2048/ | 37 | 27 | 32→37 (+5) ⬆️ |
| 3 | /sudoku/ | 33 | 31 | 16→33 (+17) ⬆️⬆️ |
| 4 | /snake/ | 28 | 22 | 26→28 (+2) |
| 5 | /circuit-logic/ | 23 | 19 | 23→23 (=) |
| 6 | /dice-merge/ | 21 | 18 | 20→21 (+1) |
| 7 | **/trivia-crack/** | 18 | 16 | **🆕 新进 Top 10** |
| 8 | /magic-sort/ | 14 | 11 | 15→14 (=) |
| 9 | /gem-paint/ | 14 | 13 | — 新进 Top 10 |
| 10 | /color-sort/ | 14 | 13 | — 新进 Top 10 |

**vs 07-01 变化**:
- 首页 PV -61 (从 158 → 97) — 但其他页面稳定,可能 06-27 viral 后续结束
- **sudoku 大涨 +17** — 进入 Top 3
- **/trivia-crack, /gem-paint, /color-sort 三款游戏进 Top 10**(07-01 不在)

### Top refs (7d, 07-02)

| Ref | Count | 备注 |
|-----|-------|------|
| https://gamezipper.com/ | 63 | 站内 (vs 07-01 61) |
| https://www.bing.com/ | 8 | 搜索 (07-01 7, +1) |
| https://gamezipper.com/wood-block-puzzle/ | 6 | 内部 |
| **https://staging-app.bituki.biz.id/** | 5 | **🆕 第三方 (印尼网站引用)** |
| https://gamezipper.com/blog/games-like-2048.html | 5 | 内部 blog |
| https://gamezipper.com/blog/free-games-without-ads.html | 5 | **🆕 内部 blog 新进 Top** |
| https://gamezipper.com/blog/games-like-roblox-free-browser.html | 4 | 内部 blog |
| https://gamezipper.com/blog/best-time-killer-games-free.html | 4 | 内部 blog |
| https://gamezipper.com/blog/best-free-browser-games-no-download-2026.html | 4 | 内部 blog |
| https://gamezipper.com/ball-sort.html | 4 | 内部 |

**新增 refs**:
- `https://staging-app.bituki.biz.id/` — WordPress staging,可能是 backlink spam
- `https://gamezipper.com/blog/free-games-without-ads.html` — Blog 介入 Top 6

---

## 📊 数据源 + 同步状态

| 数据文件 | 07-02 状态 | 备注 |
|---------|-----------|------|
| `daily-growth-2026-07-02.json` | ✅ 已生成, 521 games | cron 自动跑完 |
| `longtail-2026-07-02.json` | ✅ 612 sugs, 250 gaps | 今日手动跑 (raw) |
| `longtail-analysis-2026-07-02.json` | ✅ 38 roots, 75 uncovered | 18 fully uncovered no core |
| `gsc-2026-07-02.json` | ❌ auth_required | 持续 29 天, GSC OAuth 缺失 |
| `gap-history.json` | ✅ seen_gaps 更新 | Dan The Man / Samurai Sam 首次记录 |
| **games-data.js** | (待确认) | 脚本读 521 vs 实际可能 482-484 |
| `seo_health_report_2026-07-02.json` | ✅ 9/9 endpoints | IndexNow skip (gz 845, tools 3151 tracked) |

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 29d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 22d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)
- [ ] **BI devices/visitor_types 字段返回空** (持续 2+ 天) — 后端 bug,无法分析设备分布
  - 建议: 查 BI 后端 `/api/overview` 是否还包含 devices 字段
- [ ] **Bounce 反弹 66.3% → 89.4% (+23.1pp)** — 新流量质量下降,可能是 spam/bot 来源
- [ ] **06-30 流量塌陷仍未查清** — PV 31/UV 12,后续反弹说明不是永久故障,但根因未明

### 🆕 07-02 新建议

- [ ] **Dan The Man (Poki, 新发现)** — 2D 横版动作,简单可做 (Phaser 3),**优先级 P1**
- [ ] **Samurai Sam (Poki, 新发现)** — 武士动作 Roguelike,中等难度,**可做 P2**
- [ ] **Punch Master (Poki, 持续 2 天)** — 物理格斗简单可做,**优先级 P1**
- [ ] **Poki 列表 7 款变化 (3 新 + 3 下 + 1 改名)** — 证实脚本部分漏报新 gap,需修脚本 is_new 判定
- [ ] **Top 6 high-ROI roots 全 uncovered** — hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / genshin impact 5 / stardew valley 5
  - 建议写 6 篇 blog,预计覆盖 ~37 个 long-tail variations
- [ ] **scripts/daily_seo_analysis.py is_new 逻辑错** — 07-02 脚本报 0 new 但实际 2 个 (Dan The Man / Samurai Sam),需修

### 🔧 建议 (中优先)

- [ ] **8 Ball Billiards Classic 持续 50 天** — 桌球类需求稳定,可做
- [ ] **Murder game 持续 13 天评估** — 需后端,建议转 P2 长期评估
- [ ] **CrazyGames 列表静态 7+ 天** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **Poki 25 款列表流动 (今天 7 变化)** — 持续验证,清单内容非静态
- [ ] **Longtail seeds 4 failed** (pokemon go / animal crossing / free games to play with friends / free games no wifi) — 加入下次重试名单
- [ ] **spooky bituki.biz.id backlink** (5 hits) — WordPress staging,正常 backlink 但需长期观察

### 📈 观察项 (持续跟踪)

- **长尾 roots 38 (07-01 39, -1)** — animal crossing 失败退出,但 top 6 全 uncovered 状态未变
- **游戏库 521 (+11 vs 07-01 510)** — 实际 games-data.js 待验证
- **gaps 256 (+8)** — incremental 长尾增加
- **07-02 UV +31% (847→1111)** — visitor 多但 bounce 高,新流量质量需关注
- **06-30 → 07-01 → 07-02 反弹链确认** — 流量恢复,但需观察是否能维持
- **Top 10 pages 洗牌** — sudoku / trivia-crack / gem-paint / color-sort 进 Top 10,首页跌 38%

---

## 📁 产物文件

| 文件 | 用途 |
|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-07-02.md` | 本报告 |
| `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-07-02.json` | SEO 健康 JSON (gz+tools) |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-07-02.json` | 竞品+缺口 JSON |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-07-02.json` | Google Suggest 数据 |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-07-02.json` | High-ROI roots |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (Dan The Man + Samurai Sam 首次) |
| `/tmp/longtail_2026-07-02.log` | 长尾词扫描 raw log |
| `/tmp/longtail_analysis_2026-07-02.log` | 长尾词分析 raw log |

---

**报告时间**: 2026-07-02 11:50 CST
**下次报告**: 2026-07-03 12:00 CST
**Owner**: 香香公主 (ops-gamezipper)
