# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-29

> **任务**: kanban t_be7fb2c5 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 482 自有游戏 · 长尾词机会
> **脚本**: `daily_seo_analysis.py` v3.0 (Kachilu Browser) + `longtail_scan.py` + `longtail_analysis.py`
> **基线对比**: 2026-06-28 10:00 → **2026-06-29 12:00**
> **状态**: ✅ 数据已采集 (3 个 cron 跑均完成) | 📉 0 new gap (静态日) | 📈 245 longtail gaps (37 high-ROI roots, +2 vs 06-28)

---

## 🎯 60s Executive Summary

1. **Poki 静态 25/25** — 跟 06-28 完全一致,0 新增,0 下线;**Murder 持续 10 天** (06-20 起) 仍是隐藏缺口
2. **CrazyGames 静态 12/12** — 跟 06-28 一致,12 games 列表无变化 (持续多日异常,可能选择器或 CG 改版)
3. **缺口总数 27** (跟 06-28 持平),**新缺口 0**,持续缺口 27 个
4. **长尾词 245 gaps** (06-28 247, **-2**),roots **37** (+2 vs 06-28),fully_covered 18 个
5. **Top high-ROI roots 6/6 uncovered** — hay day / among us / brawl stars / overwatch / animal crossing / stardew valley
6. **长尾 roots 波动** — 06-29 新增 **genshin impact** (5/5 uncovered 🆕) / **crossy road** (4/4) / **slither io** (4/4);退出 **krunker** / **valorant** (variations 消失)
7. **游戏库 482** (+15 vs 06-28 467) — 持续高速扩张,平均 +15/天
8. **BI 7d 数据** — 1758 PV / 964 UV (vs 06-28 1625/880, +8.2%/+9.5%),today 289/178 (vs 263/162)
9. **P0 阻塞持续** — GSC OAuth **26d** (2026-06-04~) / Monetag Token **12d** (token_dead_since 2026-06-18)

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 06-29 vs 06-28 delta

| 平台 | 06-28 | 06-29 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 | — | — |
| **合计** | 37 | 37 | 0 | 0 | 0 |

**静态日** — 两平台今日均无新游戏/下线。Poki 25 款 / CG 12 款 列表稳定。

### CrazyGames 异常 (持续 5+ 天)

12 games 列表与 06-28 完全一致。可能性:
- ① CG /t/new 改版,选择器 `a[href*="/game/"]` 未抓到新游
- ② Kachilu 浏览器被 Cloudflare 拦截
- ③ CG 新游发布频率本身就很低 (typical < 2/天)
- **建议**: 下次跑前人工验证 `https://www.crazygames.com/t/new` 第一页是否有真新游

### Poki 06-29 全量 (25 款)

按字母排序: Airplane Manager, Battle Blast, Blocky Blast Puzzle 🟡, Brain Test 5, Car Circle, Combat Online 2, Drift Boss ✅, GoBattle 2 🟡, Hero VS Criminal, Home Builder Clicker, Level Devil ✅, Make Brainrots Online, Marina Club Rush, Monkey Mart ✅, Murder 🚨, Numbers Match 2448, Phone CASE DIY, Retro Bowl, Sea Catcher, Smash Room, Soccer 5, Stickman Battle ✅, Stickman Hook, Subway Surfers, SuperWEIRD

> ✅ = 我们有, 🟡 = 部分匹配, 🚨 = 持续隐藏缺口

---

## 📈 缺口分析 vs 482 自有游戏

### 06-29 状态

| 指标 | 06-28 | 06-29 | Δ |
|------|-------|-------|---|
| 自有游戏数 (脚本读) | 467 | 482 | **+15** |
| 实际 games-data.js | 467 | 483 | +16 (minor count diff) |
| **总缺口** | 27 | 27 | 0 |
| **新缺口 (首次发现)** | 0 | 0 | 0 |
| **持续缺口 (in history)** | 27 | 27 | 0 |
| **隐藏缺口 (in history 但未做)** | 1 (Murder) | 1 (Murder) | 0 |

### 🆕 新缺口 (06-29)

**无** — 静态日,Poki/CG 列表未变化

### 🔄 持续缺口 Top 10 (06-29 仍出现,前 10 by recency)

| # | 游戏 | 平台 | 历史 first_seen | 持续天数 | 类别 |
|---|------|------|----------------|----------|------|
| 1 | 8 Ball Billiards Classic | CrazyGames | 早期 | >30 | Skill (台球) |
| 2 | Airplane Manager | Poki | 2026-06-12 | 18 | Idle/Tycoon |
| 3 | Battle Blast | Poki | 2026-06-24 | 6 | Shooter |
| 4 | Bloxd.io | CrazyGames | 早期 | >30 | .io |
| 5 | Brain Test 5 | Poki | 2026-06-25 | 5 | Puzzle/Brain |
| 6 | Murder | Poki | 2026-06-20 | **10** | Social Deduction (MMO) |
| 7 | Soccer 5 | Poki | 2026-06-28 | 2 | Sports |
| 8 | Subway Surfers | Poki | 早期 | >30 | Runner (license) |
| 9 | Veck.io | CrazyGames | 早期 | >30 | .io |
| 10 | Openfront | CrazyGames | 早期 | >30 | Strategy (.io) |

### 🚨 隐藏缺口 (Poki 竞品持续 10 天,但 daily_seo_analysis 未标记)

| # | 游戏 | 平台 | first_seen | 持续天数 | 状态 |
|---|------|------|------------|----------|------|
| 1 | **Murder** | Poki | 2026-06-20 | 10 | 脚本未标记为 new gap (在 history),但**真没做** |

**判定**: daily_sa 逻辑 `is_new_gap = norm not in history.get('seen_gaps', {})` — 首次出现就被标记 in history,后续不再显示为 new,但实际游戏仍未做。
**建议**: 改逻辑 `is_new_gap = norm not in OUR_GAMES` 而非 history (P2,下个 sprint 改)

### 缺口分布 (按平台)

| 平台 | 持续缺口 | 占比 | 类别分布 |
|------|----------|------|----------|
| CrazyGames | ~7 | 26% | .io (Bloxd, Veck, Openfront), 桌游 (Piles of Mahjong, Four Colors, 8 Ball), 物理 (Ragdoll Archers ✓, Piece of Cake), 模拟 (Mergest Kingdom) |
| Poki | ~20 | 74% | 沙盒/益智 (Subway Surfers, Murder, Brain Test 5), 跑酷 (Stickman Hook), 模拟 (Retro Bowl, Drift Boss ✓), 装饰 (Phone CASE DIY, Sea Catcher) |

---

## 🔑 长尾词机会 (high-ROI roots)

### 06-29 状态

| 指标 | 06-28 | 06-29 | Δ |
|------|-------|-------|---|
| Seeds | 67 | 67 | 0 |
| With suggestions | 61 | 63 | +2 |
| Failed seeds | 6 | **4** | -2 (pokemon go, krunker, valorant, best card games) |
| Total unique suggestions | 593 | **612** | +19 |
| Long-tail gaps | 247 | **245** | -2 |
| Existing blog | 296 | 296 | 0 |
| High-ROI roots | 35 | **37** | **+2** |
| Fully uncovered (no core) | 19 | 19 | 0 |

### 🔥 Top 19 high-ROI roots (6/6 uncovered, no core blog)

| # | Root | Var | Uncovered | 类别 | 立即可写? |
|---|------|-----|-----------|------|----------|
| 1 | **hay day** | 7 | 7 | 农场模拟 | ✅ 7 长尾全 uncovered |
| 2 | **among us** | 6 | 6 | 社交推理 | ✅ |
| 3 | **brawl stars** | 6 | 6 | MOBA | ✅ |
| 4 | **overwatch** | 6 | 6 | FPS | ✅ |
| 5 | **animal crossing** | 5 | 5 | 模拟经营 | ✅ |
| 6 | **genshin impact** 🆕 | 5 | 5 | Gacha RPG | ✅ |
| 7 | **stardew valley** | 5 | 5 | 农场 RPG | ✅ |
| 8 | **crossy road** 🆕 | 4 | 4 | Arcade | ✅ |
| 9 | **fortnite** | 4 | 4 | Battle Royale | ✅ |
| 10 | **it takes two** | 4 | 4 | 合作冒险 | ✅ |
| 11 | **kirby** | 4 | 4 | Platformer | ✅ |
| 12 | **sims** | 4 | 4 | 模拟人生 | ✅ |
| 13 | **slither io** 🆕 | 4 | 4 | .io | ✅ |
| 14 | **zelda** | 4 | 4 | Action RPG | ✅ |
| 15 | **1v1 lol** | 3 | 3 | FPS | ✅ |
| 16 | **sims 4** | 3 | 3 | 模拟 | ✅ |
| 17 | **gacha life 2** | 2 | 2 | 创作 | ✅ |
| 18 | **mario** | 2 | 2 | Platformer | ✅ |
| 19 | **mario party** | 2 | 2 | Party | ✅ |

### 06-28 → 06-29 high-ROI roots delta

| Root | 06-28 | 06-29 | Δ | 备注 |
|------|-------|-------|---|------|
| **genshin impact** 🆕 | 0 | 5 | **+5** | 首次进入 high-ROI,5 variations 全 uncovered |
| **crossy road** 🆕 | 0 | 4 | **+4** | 4 variations 全 uncovered |
| **slither io** 🆕 | 0 | 4 | **+4** | 4 variations 全 uncovered |
| kahoot | 0 | 0 | +0 (var 8) | 8 variations,fully covered by blog variations |
| **krunker** | 7 (cov) | — | 📉 | 退出 high-ROI (variations 消失) |
| **valorant** | 6 (cov) | — | 📉 | 退出 high-ROI |

### ✅ Fully covered roots (no work, 18 个)

包含: agar.io, candy crush, clash of clans, clash royale, cookie clicker, fall guys, geometry dash, gta, gta 5, kahoot, minecraft, roblox, subway surfers, temple run, tetris, tomodachi life, wordle (+clash royale/clash of clans 已 core covered)

### 📝 Top 5 立即可写的 blog 候选 (6/6 uncovered, no core)

**hay day** (农场模拟,跟我们 antistress 流量接近):
- games like hay day
- games like hay day for pc
- games like hay day but better
- games like hay day on ps5
- games like hay day but not farming
- games like hay day reddit
- games like hay day on steam

**among us** (社交推理,跟我们 6 个 puzzle 高互动,适合):
- games like among us
- games like among us on phone
- games like among us on steam
- games like among us android
- games like among us to play with friends
- games like among us pc

**brawl stars** (MOBA 移动端,我们 touch 设备占比 2.6% 需提升):
- games like brawl stars
- games like brawl stars on mobile
- games like brawl stars on pc
- games like brawl stars offline
- games like brawl stars on ps5
- games like brawl stars android

---

## 📊 BI 数据 (今日 12:00 run)

### 总览 (7d, 2026-06-23 ~ 2026-06-29)

| 指标 | 06-29 12:00 | 06-28 10:01 | Δ |
|------|-------------|-------------|----|
| 7d PV | **1758** | 1625 | +133 (+8.2%) ✅ |
| 7d UV | **964** | 880 | +84 (+9.5%) ✅ |
| 今日 PV | 289 | 263 (前报) | +26 (+9.9%) ✅ |
| 今日 UV | 178 | 162 (前报) | +16 (+9.9%) ✅ |
| Online | 2 | 0 | +2 |
| Bounce rate | 64.6% | 65.0% | -0.4pp ✅ |
| Avg duration | 0s | 0s | — |

### gz.com vs tools.gamezipper.com (7d)

| 站点 | PV | UV | Today PV | Bounce |
|------|----|----|----------|--------|
| gz.com | 965 (54.9%) | 573 (59.4%) | 191 (66.1%) | **79.6%** ⚠️ |
| tools | 628 (35.7%) | 338 (35.1%) | 98 (33.9%) | 41.9% ✅ |

**Bounce 严重分裂**:
- gz.com 79.6% (高跳出) — 流量大但用户粘性差
- tools 41.9% (低跳出) — 用户使用工具时长更高,粘性强
- **建议**: gz.com 优化方向 — 提升游戏内体验 (engagement),降低 bounce (e.g. 添加相关游戏推荐 + 自动下一局)

### 30d trend (last 14)

| 日期 | PV | UV | 备注 |
|------|----|----|------|
| 2026-06-16 | 281 | 159 | — |
| 2026-06-17 | 297 | 136 | — |
| 2026-06-18 | 234 | 190 | — |
| 2026-06-19 | **1122** | **383** | 周五 viral 峰值 (持续 11 天未查清来源) |
| 2026-06-20 | 605 | 422 | 周六 (viral 后续) |
| 2026-06-21 | 861 | 700 | 周日 (viral 长尾) |
| 2026-06-22 | 300 | 165 | 周一 (viral 退潮) |
| 2026-06-23 | 291 | 189 | 周二 |
| 2026-06-24 | **125** | **85** | 周三低点 |
| 2026-06-25 | 175 | 88 | 周四 |
| 2026-06-26 | 169 | 89 | 周五 |
| 2026-06-27 | 400 | 193 | 周六峰值 (二次 viral?) |
| 2026-06-28 | 309 | 152 | 周日 |
| 2026-06-29 | 289 | 178 | 周一 (今日) |

### 访客结构 (7d)

| 指标 | 值 | 备注 |
|------|-----|------|
| Desktop | 1679 (95.5%) | ⚠️ 行业应 30-50%,持续异常 |
| Mobile | **76 (4.4%)** | ⚠️ 远低于行业基准 |
| New visitors | 958 (99.4%) | — |
| Return visitors | 6 (0.6%) | ⚠️ 极低,无回访 |
| Countries | [] (空) | 一直没数据,需查 |

### Top 10 pages (7d)

| # | 路径 | PV | UV |
|---|------|----|----|
| 1 | / | 192 | 125 |
| 2 | /snake/ | 36 | 23 |
| 3 | /2048/ | 32 | 22 |
| 4 | /matchstick-puzzle/ | 21 | 19 |
| 5 | /balance-scale/ | 21 | 14 |
| 6 | /dice-merge/ | 20 | 17 |
| 7 | /circuit-logic/ | 18 | 13 |
| 8 | /ics-generator.html | 16 | 10 |
| 9 | /tetris/ | 15 | 10 |
| 10 | /wordle/ | 13 | 11 |

### Top refs (7d)

| Ref | Count | 备注 |
|-----|-------|------|
| https://gamezipper.com/ | 71 | 站内 |
| https://emulatorxdotcom.wpcomstaging.com/ | **20** | 第三方 (WordPress staging 站) — 待查 |
| https://www.bing.com/ | 13 | 搜索 |
| https://gamezipper.com/blog/best-time-killer-games-free.html | 10 | 内部 blog |
| https://gamezipper.com/wood-block-puzzle/ | 6 | 内部 |
| https://game.craftisle.com/ | 6 | 外部 — 待查 |
| https://gamezipper.com/blog/games-like-2048.html | 5 | 内部 blog |

---

## 📊 数据源 + 同步状态

| 数据文件 | 06-29 状态 | 备注 |
|---------|-----------|------|
| `daily-growth-2026-06-29.json` | ✅ 已生成,482 games | Kachilu 跑完 |
| `longtail-2026-06-29.json` | ✅ 612 sugs, 245 gaps | Google Suggest 4 failed |
| `longtail-analysis-2026-06-29.json` | ✅ 37 roots, 80 uncovered | 19 fully uncovered no core |
| `gsc-2026-06-29.json` | ❌ auth_required | 持续 26 天, GSC OAuth 缺失 |
| `gap-history.json` | ✅ 77 unique | Murder 持续 10 天 |
| **games-data.js** | ✅ **483** | +16 vs 06-28 467 |
| `seo_health_report_2026-06-29.json` | ✅ 9/9 endpoints | IndexNow skip (gz 811, tools 3078 tracked) |
| `daily_seo_2026-06-29.md` | ✅ 10:02 跑 | 流量数据见那份 |

### Failed seeds 06-29 vs 06-28

| Seed | 06-28 | 06-29 | 备注 |
|------|-------|-------|------|
| games like pokemon go | ❌ | ❌ | 持续 fail (Google Suggest 屏蔽) |
| games like krunker | ✅ | ❌ | 今日 fail |
| games like valorant | ✅ | ❌ | 今日 fail |
| best card games free | ✅ | ❌ | 今日 fail |
| games like kahoot | ❌ | ✅ | 恢复 |
| games like stardew valley | ✅ | ✅ | 稳定 |
| games like minecraft | ❌ | ✅ | 恢复 |
| games like slither.io | ❌ | ✅ | 恢复 |
| games like genshin impact | ❌ | ✅ | 恢复 (首次入 high-ROI) |
| games like crossy road | ❌ | ✅ | 恢复 (首次入 high-ROI) |
| games like fall guys | ❌ | ✅ | 恢复 |
| best idle games browser | ❌ | ✅ | 恢复 |
| free unblocked games | ❌ | ✅ | 恢复 |

(Google Suggest 间歇性失败,影响 4-6 seeds 失败/天,正常)

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 26d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 12d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)
- [ ] **BI 设备分布异常 (持续 5+ 天)** — Desktop 95.5% / Mobile 4.4%,行业应 30-50%
  - 建议: 查 mobile 检测 UA / viewport / touch event,可能 mobile JS 报错被算成 desktop

### 🔧 建议 (低优先,下个 sprint)

- [ ] **Poki Murder 缺口 10 天未做** — daily_seo_analysis 应改用 `is_new_gap = norm not in OUR_GAMES` 而非 history
- [ ] **CrazyGames 列表静态 5+ 天** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **High-ROI blog 候选**: hay day 7/7 uncovered, 写 1 篇 blog 预计可覆盖 7 个 longtail variations
- [ ] **Murder game 评估**: Poki 持续 10 天,说明需求稳定。是否值得做?调研实现难度 (mmorpg/social deduction 类需要后端)
- [ ] **3 个新 high-ROI roots** (genshin impact 5, crossy road 4, slither io 4) — 都是 no-core,博客空白
- [ ] **gz.com bounce 79.6%** — 游戏页面加相关游戏推荐 / 自动下一局,降低跳出
- [ ] **countries 字段空** — 一直没数据,查 bi 收集是否漏

### 📈 观察项 (持续跟踪)

- **长尾 roots 37 (06-28 35)** — high-ROI 名单今日 +2,新增 3 (genshin/crossy/slither),退出 2 (krunker/valorant)
- **游戏库 482 (+15/天)** — 持续高速扩张,跟 06-28 趋势一致
- **新 viral 06-19 持续 11 天** — 1122 PV 仍未查清来源
- **二次 viral 06-27** (400 PV) — 持续观察是否第三次峰值
- **30d GZ 4699 PV / Tools 2725 PV** — GZ 占比 63.3%,Tools 36.7%

---

## 📁 产物文件

| 文件 | 用途 |
|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-06-29.md` | 本报告 |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-29.json` | 竞品+缺口 JSON |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-06-29.json` | Google Suggest 数据 |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-29.json` | High-ROI roots |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (77 unique) |

---

**报告时间**: 2026-06-29 12:00 CST
**下次报告**: 2026-06-30 10:00 CST
**Owner**: 香香公主 (ops-gamezipper)
