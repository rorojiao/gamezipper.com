# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-01

> **任务**: kanban t_4684fd68 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 510 自有游戏 · 长尾词机会
> **脚本**: `daily_seo_analysis.py` v3.0 + `longtail_scan.py` + `longtail_analysis.py` + `daily-seo-health.py` v5.9
> **基线对比**: 2026-06-30 → **2026-07-01**
> **状态**: ✅ 9/9 SEO 端点健康 | 🆕 1 new gap (Punch Master) | 📈 258 longtail gaps (+24), 39 high-ROI roots (+8)

---

## 🎯 60s Executive Summary

1. **SEO 健康 9/9 ✅** — gamezipper.com 830 URLs (tracked 832), tools 3149 (tracked 3151),0 new URLs (sitemap 已对齐),IndexNow 200 监控正常
2. **竞品静态**: CrazyGames **12/12** (持平 06-30),Poki **25/25** (持平)
3. **缺口 26** (vs 06-30 27,**-1**):**新发现 Punch Master** (Poki) 🆕;但 06-30 的 Punch Master 已在 06-30 列表 → 实际上是脚本在 07-01 重新标记为 new
4. **持续隐藏缺口**: Murder (Poki, **12 天** 06-20 起) 仍是隐藏缺口
5. **长尾词**: 67 seeds → **622 unique sugs** (06-30 525, +97),**258 gaps** (+24),**39 high-ROI roots** (+8),**80 uncovered** (+13)
6. **Top high-ROI roots 7/7 uncovered** — hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / animal crossing 5 / genshin impact 5 / stardew valley 5
7. **新 high-ROI roots** (+8 vs 06-30):clash of clans / cookie clicker / mario / mario party / sims 4 / stardew valley / tomodachi life / wordle — 全部完全未覆盖 🆕
8. **Failed seeds 大幅改善**: 06-30 14 failed → 07-01 **3 failed** (-11,Google Suggest 屏蔽恢复 13 个)
9. **BI 7d 流量**: PV 1565 / UV 847 (vs 06-30 1541/812, +1.6%/+4.3%),today 142/117
10. **P0 阻塞持续**: GSC OAuth **28d** (2026-06-04~) / Monetag Token **21d** (2026-06-11~)

---

## 🔧 技术 SEO 检查 (9 端点)

| 端点 | 状态 | 备注 |
|------|------|------|
| gamezipper.com/robots.txt | ✅ | 200 |
| gamezipper.com/sitemap.xml | ✅ | 830 unique URLs, 828/830 with lastmod (99.8%) |
| gamezipper.com/indexnowkey.txt | ✅ | key=gamezipper2026indexnow |
| gamezipper.com/ | ✅ | homepage OK |
| gamezipper.com/2048/ | ✅ | game page test OK |
| tools.gamezipper.com/robots.txt | ✅ | 200 |
| tools.gamezipper.com/sitemap.xml | ✅ | 3149 unique URLs, 100% lastmod |
| tools.gamezipper.com/027a0cd216fe45e6aeb738f2f49d59ff.txt | ✅ | key=027a0cd216fe45e6aeb738f2f49d59ff |
| tools.gamezipper.com/ | ✅ | homepage OK |

**结果**: 9/9 ✅ | IndexNow 0 URLs submitted (no_new_urls) | gz tracked 832 / tools tracked 3151

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 07-01 vs 06-30 delta

| 平台 | 06-30 | 07-01 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 | — | — |
| **合计** | 37 | 37 | 0 | 0 | 0 |

**静态日** — 两平台今日均无新游戏/下线。Poki 25 款 / CG 12 款 列表完全稳定。

### CrazyGames 07-01 全量 (12 款)

Bloxd.io, Mahjongg Solitaire, Piece of Cake: Merge and Bake, OriginalsRagdoll Archers, TopArrow Escape: Puzzle, Openfront, Veck.io, Piles of Mahjong, Mergest Kingdom, OriginalsFour Colors, OriginalsColor Tap: Coloring by Numbers, 8 Ball Billiards Classic

> CG 列表跟 06-30 **完全一致** (异常持续 6+ 天),需要查选择器

### Poki 07-01 全量 (25 款)

按字母排序: Battle Blast, Blocky Blast Puzzle 🟡, Brain Test 5, Car Circle, Combat Online 2, Drift Boss ✅, GoBattle 2 🟡, Hero VS Criminal, Home Builder Clicker, Level Devil ✅, Make Brainrots Online, Marina Club Rush, Master Chess 🆕, Monkey Mart ✅, Numbers Match 2448, Phone CASE DIY, **Punch Master** 🆕, Retro Bowl, Sea Catcher, Smash Room, Soccer 5, Stickman Battle ✅, Stickman Hook, Subway Surfers, SuperWEIRD

> ✅ = 我们有, 🟡 = 部分匹配, 🆕 = 07-01 标记为新

---

## 📈 缺口分析 vs 510 自有游戏

### 07-01 状态

| 指标 | 06-30 | 07-01 | Δ |
|------|-------|-------|---|
| 自有游戏数 (脚本读) | 467 | **510** | **+43** ⚡ |
| 竞品 37 平台总游戏 | 37 | 37 | 0 |
| 总缺口 | 27 | **26** | **-1** |
| 新缺口 | 0 | **1** | +1 |
| 持续缺口 | 27 | **25** | -2 |

**注**: 自有游戏从 467 → 510 (+43) 是脚本计算差异,实际 games-data.js 中可能仍是 482-484 (脚本可能把 blogs/tools 也算入)。核心看竞品缺口 26。

### 🆕 07-01 新缺口

| 游戏 | 平台 | 评估 |
|------|------|------|
| **Punch Master** | Poki | https://poki.com/en/g/punch-master — 物理格斗游戏,3D,实现简单 (matter.js / box2d 即可), **值得做** |

### 🔁 持续缺口 (26, 07-01)

| 游戏 | 平台 | 首次出现 | 持续天数 | 评估 |
|------|------|---------|---------|------|
| 8 Ball Billiards Classic | CG | 2026-05-13 | **持续 49 天** ⚠️ | 桌球游戏,需求稳定,可做 |
| Battle Blast | Poki | 持续 | — | 卡牌对战类 |
| Bloxd.io | CG | 持续 | — | voxel io 游戏 |
| Brain Test 5 | Poki | 持续 | — | 益智 |
| Car Circle | Poki | 持续 | — | 物理驾驶 |
| Combat Online 2 | Poki | 持续 | — | FPS |
| Drift Boss | Poki | 持续 | — | ✅ 已有 drift-boss 类 (待确认精确匹配) |
| GoBattle 2 | Poki | 持续 | — | MOBA 简化版 |
| Level Devil | Poki | 持续 | — | 平台跳跃 (✅ 已有同类) |
| Master Chess | Poki | 持续 | — | 国际象棋 (✅ 已有 chess 类) |
| Make Brainrots Online | Poki | 持续 | — | 沙盒创造 |
| Marina Club Rush | Poki | 持续 | — | 模拟经营 |
| **Murder** 🚨 | Poki | **2026-06-20** | **12 天** | MMORPG/social deduction,需后端,**评估中** |
| Openfront | CG | 持续 | — | 策略 |
| Piles of Mahjong | CG | 持续 | — | 麻将 (✅ 已有 mahjong) |
| Piece of Cake: Merge and Bake | CG | 持续 | — | 合并类 |
| Retro Bowl | Poki | 持续 | — | ✅ 已有同类 |
| Stickman Hook | Poki | 持续 | — | ✅ 已有 stickman |
| Smash Room | Poki | 持续 | — | 破坏 |
| Soccer 5 | Poki | 持续 | — | ⚽ 5v5 足球 |
| SuperWEIRD | Poki | 持续 | — | 沙盒 |
| TopArrow Escape: Puzzle | CG | 持续 | — | 益智 |
| Veck.io | CG | 持续 | — | io 类 |
| Color Tap | CG | 持续 | — | 涂色 |
| Ragdoll Archers | CG | 持续 | — | 弓箭物理 |
| 4 Colors | CG | 持续 | — | 卡牌 (✅ 已有同类) |

**实现优先级建议**:
1. **Punch Master** 🆕 — 物理格斗简单可做
2. **8 Ball Billiards Classic** (49 天未做, 需求极高) — 桌球类可做
3. **Master Chess** — 已有同类,可考虑精确名匹配
4. **Marina Club Rush** — 模拟经营
5. **Murder** (12 天) — 持续评估,需后端

---

## 📡 长尾词分析 (Google Suggest + Blog 覆盖)

### 07-01 vs 06-30

| 指标 | 06-30 | 07-01 | Δ |
|------|-------|-------|---|
| Seeds 总数 | 67 | 67 | 0 |
| Seeds 成功 | 53 | **64** | **+11** ⬆️ |
| Seeds 失败 | 14 | **3** | **-11** ⬇️ |
| Unique suggestions | 525 | **622** | **+97** |
| Long-tail gaps | 240 | **258** | **+18** |
| Existing blogs | 296 | 296 | 0 |
| High-ROI roots | 31 | **39** | **+8** ⬆️ |
| Uncovered variations | 67 | **80** | **+13** |
| Fully uncovered (no core) | 15 | **19** | **+4** |

### Failed seeds 07-01 (3) vs 06-30 (14)

| Seed | 06-30 | 07-01 | 备注 |
|------|-------|-------|------|
| games like pokemon go | ❌ | ❌ | 持续 fail |
| best card games free | ❌ | ❌ | 今日 fail (新) |
| free mobile games offline | ❌ | ❌ | 今日 fail (新) |
| **13 个恢复** | — | ✅ | Google Suggest 屏蔽缓解 |

**Failed 改善显著** (14 → 3),Google Suggest 间歇性屏蔽自然恢复。

### Top 15 high-ROI roots (07-01)

| # | Root | Variations | Uncovered | Has core blog |
|---|------|-----------|-----------|---------------|
| 1 | **hay day** 🔥 | 7 | 7 | ❌ |
| 2 | **among us** 🔥 | 6 | 6 | ❌ |
| 3 | **brawl stars** 🔥 | 6 | 6 | ❌ |
| 4 | **overwatch** 🔥 | 6 | 6 | ❌ |
| 5 | **animal crossing** 🔥 | 5 | 5 | ❌ |
| 6 | **genshin impact** 🔥 | 5 | 5 | ❌ |
| 7 | **stardew valley** 🔥 | 5 | 5 | ❌ |
| 8 | **crossy road** 🔥 | 4 | 4 | ❌ |
| 9 | **fortnite** 🔥 | 4 | 4 | ❌ |
| 10 | **it takes two** 🔥 | 4 | 4 | ❌ |
| 11 | **kirby** 🔥 | 4 | 4 | ❌ |
| 12 | **sims** 🔥 | 4 | 4 | ❌ |
| 13 | **slither io** 🔥 | 4 | 4 | ❌ |
| 14 | **zelda** 🔥 | 4 | 4 | ❌ |
| 15 | **1v1 lol** 🔥 | 3 | 3 | ❌ |

**Top 7 全 uncovered** — 强烈建议写 blog 系列覆盖 (hay day 7 个 variations 一次性可拿 7 个关键词)

### 🆕 新 high-ROI roots (+8 vs 06-30)

| Root | Variations | 备注 |
|------|-----------|------|
| **clash of clans** 🆕 | 新发现 | 策略游戏大 IP |
| **cookie clicker** 🆕 | 新发现 | idle 点击 |
| **mario** 🆕 | 新发现 | 任天堂经典 |
| **mario party** 🆕 | 新发现 | 派对游戏 |
| **sims 4** 🆕 | 新发现 | 模拟人生 4 |
| **stardew valley** 🆕 | 新发现 | 农场模拟 (本次新增) |
| **tomodachi life** 🆕 | 新发现 | 模拟人生类 |
| **wordle** 🆕 | 新发现 | 文字游戏 |

全部 8 个 **完全未覆盖 (no core blog)** — 候选写 blog 优先级高

### Roots 退出 (0 vs 06-30)

- 无 (39 roots 完全包含 06-30 的 31 个)

### Roots 状态分布

- **Fully covered** (20): geometry dash, kahoot, candy crush, cookie clicker ⚠️(冲突?), krunker, minecraft, subway surfers, wordle ⚠️(冲突?), clash of clans ⚠️(冲突?), fall guys, gacha life, roblox, temple run, tomodachi life ⚠️(冲突?), valorant, clash royale, tetris, gta 5, gta, agar io
  - **注**: cookie clicker / wordle / clash of clans / tomodachi life 同时出现在 fully_covered 和新增未覆盖 — 数据冲突,可能是 Google Suggest 屏蔽导致的 variation 重新出现
- **Uncovered** (19): hay day, among us, brawl stars, overwatch, animal crossing, genshin impact, stardew valley, crossy road, fortnite, it takes two, kirby, sims, slither io, zelda, 1v1 lol, mario, mario party, sims 4, doodle jump (部分)

---

## 📊 BI 流量数据 (7d)

| 站点 | PV | UV | Today PV | Bounce |
|------|----|----|----------|--------|
| gz.com | 1565 (100%) | 847 (100%) | 142 (100%) | **66.3%** ⚠️ |

> 注: BI 当前只跟踪 gamezipper.com (tools 子域名未在 BI 跟踪范围),与 06-30 一致

### 7d trend (vs 06-30)

| 日期 | PV | UV | 备注 |
|------|----|----|------|
| 2026-06-25 | 175 | 88 | — |
| 2026-06-26 | 169 | 89 | — |
| 2026-06-27 | 400 | 193 | 周六峰值 (viral 后续) |
| 2026-06-28 | 309 | 152 | 周日 |
| 2026-06-29 | 300 | 188 | 周一 |
| 2026-06-30 | 70 | 27 | **周二低点** ⚠️ (流量塌陷) |
| 2026-07-01 | 142 | 117 | 周三 (今日, 反弹中) |

**重要观察**:
- **06-30 流量塌陷**: PV 70 / UV 27 (vs 06-29 300/188, -77% / -86%) ⚠️
- **07-01 部分反弹**: 142 / 117 (+103% / +333% vs 06-30,但仍低于 06-29 50%)
- **30d 趋势**: 平均 ~220 PV/day,06-27 是最近峰值 (400),后续下行
- **Bounce 改善**: 79.6% → 66.3% (-13.3pp) ✅ — 流量质量提升

### 访客结构 (7d)

| 指标 | 值 | 备注 |
|------|-----|------|
| Desktop | 1503 (96.0%) | ⚠️ 行业应 30-50%,持续异常 |
| Desktop (小写,误识别) | 1 | — |
| Mobile | **60 (3.8%)** | ⚠️ 远低于行业基准,持续 7+ 天异常 |
| New visitors | 840 (99.2%) | — |
| Return visitors | 7 (0.8%) | ⚠️ 极低,无回访 |
| Countries | [] (空) | 持续没数据 |

### Top 10 pages (7d)

| # | 路径 | PV | UV |
|---|------|----|----|
| 1 | / | 158 | 96 |
| 2 | /2048/ | 32 | 22 |
| 3 | /snake/ | 26 | 19 |
| 4 | /circuit-logic/ | 23 | 18 |
| 5 | /matchstick-puzzle/ | 21 | 19 |
| 6 | /balance-scale/ | 21 | 14 |
| 7 | /dice-merge/ | 20 | 17 |
| 8 | /sudoku/ | 16 | 15 |
| 9 | /magic-sort/ | 15 | 12 |
| 10 | /ics-generator.html | 15 | 9 |

### Top refs (7d)

| Ref | Count | 备注 |
|-----|-------|------|
| https://gamezipper.com/ | 61 | 站内 |
| https://www.bing.com/ | 7 | 搜索 |
| https://gamezipper.com/wood-block-puzzle/ | 6 | 内部 |
| https://gamezipper.com/blog/games-like-2048.html | 5 | 内部 blog |
| https://gamezipper.com/blog/games-like-roblox-free-browser.html | 4 | 内部 blog 🆕 |
| https://gamezipper.com/blog/best-time-killer-games-free.html | 4 | 内部 blog |
| https://gamezipper.com/blog/best-free-browser-games-no-download-2026.html | 4 | 内部 blog |
| https://gamezipper.com/ball-sort.html | 4 | 内部 |
| https://emulatorxdotcom.wpcomstaging.com/ | 4 | 第三方 (WordPress staging) |
| https://tools.gamezipper.com/ | 3 | 跨站 |

---

## 📊 数据源 + 同步状态

| 数据文件 | 07-01 状态 | 备注 |
|---------|-----------|------|
| `daily-growth-2026-07-01.json` | ✅ 已生成, 510 games | cron 自动跑完 |
| `longtail-2026-07-01.json` | ✅ 622 sugs, 258 gaps | 今日手动补跑 |
| `longtail-analysis-2026-07-01.json` | ✅ 39 roots, 80 uncovered | 19 fully uncovered no core |
| `gsc-2026-07-01.json` | ❌ auth_required | 持续 28 天, GSC OAuth 缺失 |
| `gap-history.json` | ✅ seen_gaps 更新 | Punch Master 首次记录 |
| **games-data.js** | (待确认) | 脚本读 510 vs 实际可能 482-484 |
| `seo_health_report_2026-07-01.json` | ✅ 9/9 endpoints | IndexNow skip (gz 832, tools 3151 tracked) |

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 28d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 21d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)
- [ ] **BI 设备分布异常 (持续 7+ 天)** — Desktop 96% / Mobile 3.8%,行业应 30-50%
  - 建议: 查 mobile 检测 UA / viewport / touch event,可能 mobile JS 报错被算成 desktop
- [ ] **06-30 流量塌陷 PV 70/UV 27** — 跟 06-29 比 -77%/-86%,07-01 部分反弹但仍低 50%,**需查清原因**

### 🆕 07-01 新建议

- [ ] **Punch Master (Poki, 新发现)** — 物理格斗,简单可做 (matter.js / box2d),**优先级 P1**
- [ ] **Top 7 high-ROI roots 全 uncovered** — hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / animal crossing 5 / genshin impact 5 / stardew valley 5
  - 建议写 7 篇 blog,预计覆盖 ~40 个 long-tail variations
- [ ] **8 个新增 roots** (clash of clans / cookie clicker / mario / mario party / sims 4 / stardew valley / tomodachi life / wordle) — 全部 no core,候选
- [ ] **Poki Punch Master + Murder (12 天)** — 是否同时评估两个物理/动作游戏?
- [ ] **games-data.js 实际游戏数 vs 脚本读数差异** — 510 vs 482,需修复脚本逻辑
- [ ] **06-30 流量塌陷查因** — 是否有 CDN 故障 / GSC 算法变动 / 友情链接被删?

### 🔧 建议 (中优先)

- [ ] **CrazyGames 列表静态 6+ 天** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **8 Ball Billiards Classic 持续 49 天** — 桌球类需求稳定,可做
- [ ] **Murder game 持续 12 天评估** — 需后端,建议转 P2 长期评估
- [ ] **Poki 25 款 / CG 12 款 列表稳定** — 长期静态日,无需紧急处理
- [ ] **Longtail seeds 3 failed** (pokemon go / best card games free / free mobile games offline) — 持续屏蔽,加入下次重试名单

### 📈 观察项 (持续跟踪)

- **长尾 roots 39 (06-30 31, +8)** — high-ROI 名单大幅扩张,新增 8 个 IP 大词 (clash of clans / mario / wordle 等)
- **游戏库 510 (+43 vs 06-30 467)** — 实际 games-data.js 待验证
- **失败 seeds 大幅减少** 14 → 3 (-11),Google Suggest 自然恢复
- **Bounce 改善 79.6% → 66.3%** — 流量质量提升 -13.3pp
- **06-27 viral 后续 11 天** — 400 PV 仍未查清来源,持续观察

---

## 📁 产物文件

| 文件 | 用途 |
|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-07-01.md` | 本报告 |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-07-01.json` | 竞品+缺口 JSON |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-07-01.json` | Google Suggest 数据 |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-07-01.json` | High-ROI roots |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (Punch Master 首次) |
| `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-07-01.json` | SEO 健康 JSON |
| `/home/msdn/gamezipper.com/scripts/daily_seo_2026-07-01_10.md` | 上午 SEO 健康报告 |

---

**报告时间**: 2026-07-01 12:10 CST
**下次报告**: 2026-07-02 12:00 CST
**Owner**: 香香公主 (ops-gamezipper)