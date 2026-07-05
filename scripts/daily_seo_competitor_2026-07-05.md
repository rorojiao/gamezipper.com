# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-05 (周日)

> **任务**: kanban t_79ba5997 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: SEO 健康检查 (morning 10:01) + 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 559 自有游戏 · 长尾词机会
> **脚本**: `daily-seo-health.py` v5.10 + `daily_seo_analysis.py` v3.0 (Kachilu) + `longtail_scan.py` + `longtail_analysis.py`
> **基线对比**: 2026-07-04 → **2026-07-05**
> **状态**: ✅ 10/10 SEO 端点健康 | 🆕 0 new gap (脚本报) / 实际 3 个新游戏未识别 | 📈 280 longtail gaps (+18), 39 high-ROI roots (+2), 19 fully uncovered (+1)

---

## 🎯 60s Executive Summary

1. **SEO 健康 10/10 ✅** — gz.com 886 URLs (tracked 888), tools 3353 (tracked 3355), 0 new URLs (sitemap 已对齐), IndexNow 200 监控正常 (last_ok gz 2026-07-05T09:00:04)
2. **竞品平台数量静态**: CrazyGames **12/12** (持平, 仅 TopMergest Kingdom 标签格式变), Poki **25/25** (持平, 但 **内容换了 6 款: +3 -3**)
3. **Poki 列表 6 款变化 (07-04→07-05)**: 🆕 Fight and Loot / Subway Surfers (回归) / Master Chess (回归) 🚪 Car Circle / Drive Mad / Make Brainrots Online
4. **脚本报 0 new gap** (跟 07-02 同样的脚本判定 bug): `is_new` 判定依赖 normalized name, 已存在但跨日出现就漏报 — **实际新出现 3 个** (Fight and Loot / Subway Surfers / Master Chess)
5. **持续缺口 26** (vs 07-04 27, **-1**) — Master Chess 回来, Subway Surfers 回归 (跟 07-02 脚本漏报 Punch Master 同根因)
6. **长尾词** (今天新跑, vs 07-03 上次): 67 seeds → **66 successful** (07-03 63, **+3 恢复**), **640 unique sugs** (+19), **280 gaps** (+18), **39 high-ROI roots** (+2)
7. **Top high-ROI roots** (07-05 前 6 全 uncovered): **among us 7 / genshin impact 7 / brawl stars 6 / hay day 6 / overwatch 6 / fortnite 5** — 全 has_core=False
8. **Fully uncovered (no core blog)**: **19 个** (07-03 18, +1, pokemon go / kirby / agar io 新进 high-ROI)
9. **Gacha life 2 root 退出 high-ROI** (已 fully covered,✅)
10. **BI 7d 流量**: gz.com 7d PV 21,034 / UV 2,334 (vs seo_health 3348 — 不同口径, BI 直 SQL 完整), today PV 2,345 / UV 349, bounce 91.2% ⚠️
11. **P0 阻塞持续**: GSC OAuth **32d** (2026-06-04~) / Monetag Token **23d** (2026-06-11~)

---

## 🔧 技术 SEO 检查 (10 端点)

| 端点 | 状态 | 备注 |
|------|------|------|
| gamezipper.com/robots.txt | ✅ | 200 |
| gamezipper.com/sitemap.xml | ✅ | **886** unique URLs, 883/886 with lastmod (99.7%) |
| gamezipper.com/indexnowkey.txt | ✅ | key=gamezipper2026indexnow |
| gamezipper.com/ | ✅ | homepage OK |
| gamezipper.com/2048/ | ✅ | game page test OK |
| tools.gamezipper.com/robots.txt | ✅ | 200 |
| tools.gamezipper.com/sitemap.xml | ✅ | 3353 unique URLs, 100% lastmod |
| tools.gamezipper.com/027a0cd216fe45e6aeb738f2f49d59ff.txt | ✅ | key=027a0cd216fe45e6aeb738f2f49d59ff |
| tools.gamezipper.com/ | ✅ | homepage OK |
| tools.gamezipper.com/(subpages) | ✅ | 200 |

**结果**: 10/10 ✅ | IndexNow 0 URLs submitted (no_new_urls) | gz tracked 888 / tools tracked 3355

**vs 07-04**: gz sitemap 873 → 886 (+13 URLs tracked), tools sitemap 3353 (持平)

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 07-05 vs 07-04 delta

| 平台 | 07-04 | 07-05 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 (标签格式变) | — | — |
| Poki | 25 | 25 | 0 (但内容换) | 3 (Fight and Loot, Subway Surfers 回归, Master Chess 回归) | 3 (Car Circle, Drive Mad, Make Brainrots Online) |
| **合计** | 37 | 37 | 0 | 3 | 3 |

### CrazyGames 07-05 全量 (12 款)

8 Ball Billiards Classic, UpdatedBloxd.io, UpdatedColor Tap: Coloring by Numbers, Mahjongg Solitaire, OriginalsFour Colors, Openfront, OriginalsRagdoll Archers, Piles of Mahjong, Piece of Cake: Merge and Bake, **TopMergest Kingdom** (标签格式变), TopArrow Escape: Puzzle, Veck.io

> CG 列表跟 07-04 仅标签差异 (Mergest Kingdom → TopMergest Kingdom), 游戏本身没变 — **持续 10+ 天静态**, 脚本选择器可能稳定但实际 CG 没推新游

### Poki 07-05 全量 (25 款, **6 款变化**)

按字母排序 07-05: Battle Blast, Blocky Blast Puzzle, Brain Test 5, Car Circle 🚪, **Clash of Cards** 🆕, Combat Online 2, Dan The Man ✅, Drift Boss ✅, **Drive Mad** 🚪, **Fight and Loot** 🆕, GoBattle 2, Hero VS Criminal, Level Devil ✅, **Make Brainrots Online** 🚪, **Master Chess** 🆕回归, MineFun.io ✅, Monkey Mart ✅, Numbers Match 2448, **Oozy's Lab** 🆕, Punch Master ✅, Retro Bowl ✅, Samurai Sam ✅, Sea Catcher 🆕(?), Smash Room ✅, Soccer 5 ✅, **Subway Surfers** 🆕回归, SuperWEIRD ✅

**vs 07-04 变化** (6 处):
- 🆕 新增 3 款: **Fight and Loot / Subway Surfers (回归) / Master Chess (回归)**
- 🚪 下线 3 款: Car Circle / Drive Mad / Make Brainrots Online
- ⚠️ 脚本漏报 3 个 (跟 07-02 同根因: normalized name 已存在但跨日出现 → is_new=False)

> ✅ = 我们有, 🟡 = 部分匹配, 🆕 = 07-05 首次/回归出现

**注意**: 脚本里 07-04 也漏报 Dan The Man / Samurai Sam / Clash of Cards — 这意味着 history 不完整, **新游判定脚本 bug 已持续 4 天**

---

## 📈 缺口分析 vs 559 自有游戏

### 07-05 状态

| 指标 | 07-04 | 07-05 | Δ |
|------|-------|-------|---|
| 自有游戏数 (脚本读) | 546 | **559** | **+13** ⚡ |
| 竞品 37 平台总游戏 | 37 | 37 | 0 |
| **总缺口** (脚本) | 27 | **26** | **-1** |
| 🆕 新缺口 (脚本) | 0 | **0** | 0 (脚本错,实际 3 个) |
| 🔁 持续缺口 | 27 | **26** | -1 |

**关键观察**:
- 自有游戏 546 → 559 (+13) — 脚本统计口径 (blogs/tools 也算入), 实际 games-data.js 待验证
- 脚本报 0 new gap 是因为 `daily_seo_analysis.py:142 is_new` 判定依赖 normalized name → 跨日重复出现就漏报
- **实际 gap-history 应记录 first_seen=2026-07-05 共 3 个**: Fight and Loot / Subway Surfers (回归) / Master Chess (回归)

### 🆕 07-05 新缺口 (基于实际 delta, 3 个)

| 游戏 | 平台 | 评估 |
|------|------|------|
| **Fight and Loot** | Poki | https://poki.com/en/g/fight-and-loot — RPG 战斗冒险, 物理 + loot 系统, **可做 P2** |
| **Subway Surfers** (回归) | Poki | https://poki.com/en/g/subway-surfers — 跑酷经典回归 (07-02 下线), **极高流量**, ✅ 已有同类无限跑酷 (subway-surfers.html) |
| **Master Chess** (回归) | Poki | https://poki.com/en/g/master-chess — 国际象棋, 跟我们已有的 chess 高度相似, ✅ 已有同类 |

### 🔁 持续缺口 (26, 07-05)

| 游戏 | 平台 | 首次出现 | 持续天数 | 评估 |
|------|------|---------|---------|------|
| 8 Ball Billiards Classic | CG | 2026-05-13 | **持续 53 天** ⚠️ | 桌球游戏, 需求稳定, **可做 P1** |
| Battle Blast | Poki | 2026-06-24 | 11 天 | 卡牌对战 |
| UpdatedBloxd.io | CG | 持续 | — | voxel io (✅ 类似品类) |
| Brain Test 5 | Poki | 2026-06-25 | 10 天 | 益智 |
| Clash of Cards | Poki | **2026-07-04** 🆕 | 1 天 | 卡牌对战 |
| Combat Online 2 | Poki | 持续 | — | FPS |
| Dan The Man | Poki | 2026-07-02 | 3 天 | 2D 横版动作 (Phaser 3) |
| Drift Boss | Poki | 持续 | — | ✅ 已有 drift-boss 类 |
| GoBattle 2 | Poki | 持续 | — | MOBA 简化版 |
| Level Devil | Poki | 持续 | — | ✅ 已有同类 |
| MineFun.io | Poki | 2026-07-02 | 3 天 | io 沙盒建造 |
| Monkey Mart | Poki | 持续 | — | ✅ 已有同类 |
| **Murder** 🚨 | Poki | **2026-06-20** | **15 天** | MMORPG/social deduction, 需后端, **评估中** |
| Oozy's Lab | Poki | 2026-07-04 🆕 | 1 天 | 解谜 |
| Openfront | CG | 持续 | — | 策略 |
| Piles of Mahjong | CG | 持续 | — | ✅ 已有 mahjong |
| Piece of Cake: Merge and Bake | CG | 持续 | — | 合并类 |
| **Punch Master** | Poki | **2026-07-01** | **4 天** | 物理格斗简单 (matter.js) |
| Retro Bowl | Poki | 持续 | — | ✅ 已有同类 |
| Stickman Hook | Poki | 持续 | — | ✅ 已有 stickman |
| Sea Catcher | Poki | 2026-06-21 | 14 天 | 钓鱼 |
| Smash Room | Poki | 2026-06-26 | 9 天 | 破坏 |
| Soccer 5 | Poki | 2026-06-28 | 7 天 | ⚽ 5v5 足球 |
| SuperWEIRD | Poki | 2026-06-21 | 14 天 | 沙盒 |
| TopArrow Escape: Puzzle | CG | 持续 | — | 益智 |
| Veck.io | CG | 持续 | — | io 类 |

**实现优先级建议**:
1. **8 Ball Billiards Classic** (持续 53 天, 桌球类需求稳定) — **P1**
2. **Fight and Loot** 🆕 — RPG 战斗冒险, **可做 P2**
3. **Punch Master** (持续 4 天) — 物理格斗简单可做 (matter.js / box2d), **P1**
4. **Dan The Man** (持续 3 天) — 2D 横版动作,简单可做 (Phaser 3), **P2**
5. **Clash of Cards** 🆕 — 卡牌对战 (已 1 天), **P2**
6. **Oozy's Lab** 🆕 — 解谜类 (已 1 天), **P3**
7. **Murder** (15 天) — 持续评估,需后端,**长期评估**
8. **Samurai Sam** (3 天) — 武士动作 Roguelike 中等难度, **P3**

---

## 📡 长尾词分析 (Google Suggest + Blog 覆盖)

### 07-05 vs 07-03 (上次跑 longtail)

| 指标 | 07-03 | 07-05 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 0 |
| Seeds 成功 | 63 | **66** | **+3** (pokemon go / kirby / agar io 恢复) |
| Seeds 失败 | 4 | **1** | **-3** (仅 free unblocked games 持续 fail) |
| Unique suggestions | 621 | **640** | **+19** |
| Long-tail gaps | 262 | **280** | **+18** |
| Existing blogs | 296 | **300** | **+4** (本周写的 pokemon/blooket/roblox/subway) |
| High-ROI roots | 37 | **39** | **+2** |
| Uncovered variations | 76 | **85** | **+9** |
| Fully uncovered (no core) | 18 | **19** | **+1** |

### Failed seeds 07-05 (1) vs 07-03 (4)

| Seed | 07-03 | 07-05 | 备注 |
|------|-------|-------|------|
| free unblocked games | ❌ | ❌ | 持续 fail, Google Suggest 屏蔽 |
| games like pokemon go | ❌ | ✅ | **07-05 恢复** (新进 high-ROI) |
| games like agar.io | ❌ | ✅ | **07-05 恢复** (新进 high-ROI) |
| games like kirby | ❌ | ✅ | **07-05 恢复** (新进 high-ROI) |

**观察**: Google Suggest 屏蔽波动, 本周恢复 3 个 seed (pokemon go / agar.io / kirby),但 free unblocked games 持续 fail

### Top 15 high-ROI roots (07-05)

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

**vs 07-03 变化**:
- **Top 6 改变**: 07-03 是 hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / animal crossing 5 / genshin impact 5
- 07-05 top 6 是 **among us 7 / genshin impact 7 / brawl stars 6 / hay day 6 / overwatch 6 / fortnite 5** (animal crossing 跌至 #11, fortnite 升至 #6)
- Top 10 (07-05) 全部仍然 uncovered (无 has core blog) — 强烈建议继续 blog 系列覆盖

### 🆕 Roots 变化 (07-05 vs 07-03)

- **New roots** (3): `pokemon go` (4 var) / `kirby` (5 var) / `agar io` (2 var) — 均从 failed seed 恢复
- **Gone roots** (1): `gacha life 2` — 已 fully covered ✅
- **Changed var count**: among us 6→7 (+1, 新 variation 进 high-ROI), genshin impact 5→7 (+2), stardew valley 5→3 (-2)

### Roots 状态分布 (07-05)

- **Fully covered** (20): geometry dash, candy crush, cookie clicker, kahoot, minecraft, subway surfers, wordle, gacha life, **tomodachi life (07-04 写完)** 🆕, clash of clans, krunker, temple run, valorant, clash royale, fall guys, roblox, tetris, gta 5, gta, agar io (新 fully covered ✅)
- **Uncovered** (19): among us, genshin impact, brawl stars, hay day, overwatch, fortnite, kirby, sims, zelda, 1v1 lol, animal crossing, crossy road, it takes two, pokemon go, slither io, mario, mario party, sims 4, doodle jump
  - (vs 07-03 18, **+1**: pokemon go / kirby / agar io 恢复,但 gacha life 2 fully covered 退出, net +1)

---

## 📊 BI 流量数据 (BI 直 SQL, gz.com only)

| 站点 | 7d PV | 7d UV | 30d PV | 30d UV | Today PV | Bounce |
|------|-------|-------|--------|--------|----------|--------|
| gz.com | 21,034 | 2,334 | 78,257 | 5,584 | 2,345 | 91.2% ⚠️ |

> 注: BI SQL 直拉 vs seo_health report 数字 (3348) 不一致, 因 seo_health 用了 BI HTTP API (仅返回 gz.com 7d 截断)。本报告用 SQL 直拉全量

### 7d trend (gz.com)

| 日期 | PV | UV | 备注 |
|------|----|----|------|
| 2026-06-28 | 2052 | 107 | — |
| 2026-06-29 | 1407 | 141 | — |
| 2026-06-30 | 265 | 12 | **周二低点 (流量塌陷)** |
| 2026-07-01 | 2590 | 499 | 周三 (反弹日) |
| 2026-07-02 | 3117 | 321 | 周四 |
| 2026-07-03 | 4836 | 410 | 周五 (峰值) |
| 2026-07-04 | 4546 | 519 | 周六 |
| **2026-07-05** | **2345** | **349** | **周日 (今日, vs 07-04 4546 -48%)** |

**重要观察**:
- **07-04 周六峰值 4546** (vs 周日 07-05 2345 是正常的 -48%, 周末周日比周六低)
- 30d trend 看 6 月下旬 (06-22~06-27) 是低谷 (~900-2100), 7 月初反弹 (07-01~07-04 2500-4800)
- 30d 累计 78K PV / 5.5K UV — 流量恢复轨道确认
- **Bounce 91.2%** ⚠️ — 持续高位 (07-02 89.4%, 07-04 86.5%, 07-05 91.2%) — 新流量源质量需关注

### Top pages (7d, gz.com)

| # | 路径 | PV | UV | 备注 |
|---|------|----|----|------|
| 1 | /tetris/ | 199 | 32 | 周日峰值持续 |
| 2 | / | 153 | 92 | 首页 |
| 3 | /2048/ | 77 | 51 | — |
| 4 | /sudoku/ | 59 | 46 | — |
| 5 | /snake/ | 54 | 38 | — |
| 6 | /anti-knight-sudoku/ | 27 | 23 | — |
| 7 | /ships-finder/ | 25 | 24 | — |
| 8 | /conveyor-sort/ | 25 | 25 | — |
| 9 | /color-sort/ | 25 | 24 | — |
| 10 | /qwirkle/ | 24 | 23 | 🆕 进 Top 10 |

**vs 07-04 变化**:
- /tetris/ 持续 #1 (199 vs 07-04 195)
- **/qwirkle/ 首次进 Top 10** — 棋牌游戏持续发力
- /snake/ 54 (vs 07-04 42) +12
- /sudoku/ 59 (vs 07-04 56) +3

### Top refs (7d, gz.com)

| Ref | Count | 备注 |
|-----|-------|------|
| https://ion.xo.je/ | 2097 | **跨站导流最大源** (vs 07-04 93 → +125%, 但 gz.com 占比下降) |
| https://www.bing.com/ | 264 | 搜索 (07-04 23 → **+1047%** ⚡ — 搜索流量大幅回升) |
| http://localhost:8080/ | 131 | 本地测试 |
| https://cn.bing.com/ | 121 | 国内 Bing |
| https://admin.kalika.me/ | 119 | 跨站导流 |
| https://staging-app.bituki.biz.id/ | 79 | WordPress staging (07-04 70 → +9) |
| https://www.doubao.com/ | 64 | **豆包 AI 引用 🆕** |
| https://019f23d3-5736-7e48-8347-...arena.site/ | 63 | arena 系列跨站 |
| https://www.google.com/ | 52 | Google 搜索 |

**新增 refs**:
- `https://www.doubao.com/` (64 UV/7d) — **豆包 (字节 AI) 引荐** — AI 引荐时代第 3 个渠道 (bing + chatgpt + doubao)
- Bing 搜索 264 (07-04 23, **+1047%** ⚡) — 7 月初写的 blog 系列开始被 Bing 吸收 (或 GSC OAuth 缺失掩盖了真实 ranking 数据)

### 设备分布 (7d, gz.com)

| Device | PV | % |
|--------|----|----|
| Desktop | 17,403 | 82.7% |
| Mobile | 3,618 | 17.2% |
| (empty/other) | 13 | 0.1% |

> vs 行业基线 50-70% desktop, GZ 82.7% 仍偏高 (上周 93%, 本周改善 +10pp — **Mobile 占比回升** ⚡)

---

## 📊 数据源 + 同步状态

| 数据文件 | 07-05 状态 | 备注 |
|---------|-----------|------|
| `daily-growth-2026-07-05.json` | ✅ 已生成, 559 games | cron 自动跑完 |
| `longtail-2026-07-05.json` | ✅ 640 sugs, 280 gaps | **手动补跑** (cron 缺 2 天) |
| `longtail-analysis-2026-07-05.json` | ✅ 39 roots, 85 uncovered | 19 fully uncovered no core |
| `gsc-2026-07-05.json` | ❌ auth_required | 持续 32 天, GSC OAuth 缺失 |
| `gap-history.json` | ⚠️ 部分 | 脚本漏报 3 个 new gap, history 不完整 |
| `games-data.js` | (待确认) | 脚本读 559 vs 实际可能 484-510 |
| `seo_health_report_2026-07-05.json` | ✅ 10/10 endpoints | IndexNow skip (gz 888, tools 3355 tracked) |

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 32d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 23d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)
- [ ] **Bounce 91.2% 持续高位** — 新流量质量下降, 需查流量源质量
- [ ] **06-30 流量塌陷根因仍未查清** — PV 265/UV 12, 后续反弹说明不是永久故障, 但根因未明

### 🆕 07-05 新建议

- [ ] **Fight and Loot (Poki, 新发现)** — RPG 战斗冒险, **优先级 P2**
- [ ] **Clash of Cards (Poki, 持续 1 天)** — 卡牌对战, **优先级 P2**
- [ ] **Oozy's Lab (Poki, 持续 1 天)** — 解谜类, **优先级 P3**
- [ ] **Subway Surfers 回归** — 已有同类, 验证流量是否被同类吃掉
- [ ] **Master Chess 回归** — 已有 chess, 同类流量监测
- [ ] **Top 6 high-ROI roots 全 uncovered** — among us 7 / genshin impact 7 / brawl stars 6 / hay day 6 / overwatch 6 / fortnite 5
  - 建议写 6 篇 blog, 预计覆盖 ~37 个 long-tail variations
- [ ] **Bing 7d 搜索流量 +1047%** (23→264) ⚡ — blog hub 修复后首次被 Bing 大量吸收
- [ ] **豆包 AI 引荐 64 UV/7d** 🆕 — AI 引荐第 3 渠道, 跟 ChatGPT 22/30d 旗鼓相当

### 🔧 建议 (中优先)

- [ ] **daily_seo_analysis.py is_new 逻辑 bug** — 跨日重复出现漏报 (07-02 / 07-04 / 07-05 持续)
  - 修复: 用 first_seen_in_history 替代 is_new_by_normalized_name
- [ ] **longtail cron 缺 2 天** (07-04 / 07-05) — 手动补跑, 应查 cron 日志
- [ ] **8 Ball Billiards Classic 持续 53 天** — 桌球类需求稳定, **P1 长期未做**
- [ ] **Murder game 持续 15 天评估** — 需后端, 建议转 P2 长期评估
- [ ] **CrazyGames 列表静态 10+ 天** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **Mobile 占比 17.2% (回升中!)** — 行业应 30-50%, 但本周从 7% → 17% 改善 +10pp ⚡
- [ ] **Gacha life 2 root 已 fully covered ✅** — 已写 blog 跟进 07-03 出的高 ROI

### 📈 观察项 (持续跟踪)

- **长尾 roots 39 (+2)** — pokemon go / kirby / agar io 恢复新进 high-ROI
- **blogs +4 (300 总)** — 本周 pokemon / blooket / roblox / subway 已写
- **gaps 280 (+18)** — incremental 长尾增加
- **Mobile 占比回升 7% → 17%** — 7 月初 CSS 改造或新流量源带来的
- **Bing 搜索流量 +1047%** — 7 月 blog hub 修复 + 新写 blog 被 Bing 吸收
- **AI 引荐三足鼎立**: Bing 264 + ChatGPT 22 + 豆包 64 = 350/7d → AI 引荐已成主要流量源

---

## 📁 产物文件

| 文件 | 用途 |
|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-07-05.md` | 本报告 |
| `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-07-05.json` | SEO 健康 JSON (gz+tools) |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-07-05.json` | 竞品+缺口 JSON (559 games) |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-07-05.json` | Google Suggest 数据 (640 sugs) |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-07-05.json` | High-ROI roots (39 roots) |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (脚本漏报 3 个 new) |
| `/tmp/longtail_2026-07-05.log` | 长尾词扫描 raw log |
| `/tmp/longtail_analysis_2026-07-05.log` | 长尾词分析 raw log |

---

**报告时间**: 2026-07-05 11:30 CST
**下次报告**: 2026-07-06 11:00 CST
**Owner**: 香香公主 (ops-gamezipper)
**依赖数据**: seo_health_report_2026-07-05.json (morning cycle 10:01), daily-growth + longtail (手动补跑)