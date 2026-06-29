# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-29

> **任务**: kanban t_7bf58d39 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 483 自有游戏 · 长尾词机会 · SEO 端点健康
> **脚本**: `daily-seo-health.py` v5.9 + `daily_seo_analysis.py` v3.0 (Kachilu Browser + MiniMax Search) + `longtail_scan.py` + `longtail_analysis.py`
> **基线对比**: 2026-06-28 10:00 → **2026-06-29 12:00**
> **状态**: ✅ 数据已采集 (3 个 cron 跑均完成) | 0 new gap (持续 1d) | 📈 **258 longtail gaps (+11)** | 🆕 **483 游戏 (+15)** | 🔧 **data drift 修复**

---

## 🎯 60s Executive Summary

1. **SEO 端点 9/9 OK** — gz.com sitemap **811** (06-28: 811) / tools sitemap **3076** (06-28: 3076),均 100% lastmod 覆盖
2. **IndexNow 增量 0** — gz.com tracked=811 / tools tracked=3078,无新 URL,skip 提交
3. **新增 15 个游戏! 🎉** — games-data.js **467 → 483** (+16),但 06-28 script read 467,实际 js 文件 468,data drift 持续到 06-29,本轮 **sync-game-counts.sh 已修复** ✅
4. **竞品新游 0 增 0 减** — CG 12 / Poki 25 列表完全静态 (与 06-28 一致)
5. **缺口总数 27 (稳定)** — **0 new gap**, 持续 27 (in history 76 unique)
6. **长尾词 258 gaps (+11)** — seeds 67/63,roots 37 (+2 新: crossy road / genshin impact / slither io, -2: krunker / valorant 已 fully covered)
7. **BI 7d 1735 PV / 950 UV** — 06-29 today 266 PV / 164 UV (周六 06-27 400 PV 后周日回落 309 → 266,正常)
8. **P0 阻塞持续** — GSC OAuth **25d** + Monetag Token **12d**,影响 queries/收益数据采集

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 06-29 vs 06-28 delta

| 平台 | 06-28 | 06-29 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 | — | — |
| **合计** | 37 | 37 | 0 | 0 | 0 |

### 🆕 新增竞品游戏 (06-29)

无 (静态 1d)

### 📉 下线竞品游戏 (06-29)

无

### CrazyGames 持续异常

12 个游戏列表与 06-27/06-28 完全一致 (3d 无变化)。可能性:
- ① CG /t/new 改版,选择器 `a[href*="/game/"]` 未抓到新游
- ② Kachilu 浏览器被 Cloudflare 拦截
- ③ CG 新游发布频率本身就很低 (typical < 2/天)
- **建议**: 下次跑前人工验证 `https://www.crazygames.com/t/new` 第一页

---

## 📈 缺口分析 vs 483 自有游戏

### 06-29 状态

| 指标 | 06-28 | 06-29 | Δ |
|------|-------|-------|---|
| 实际 games-data.js | 468 | **483** | **+15** 🎉 |
| 脚本读 our_game_count | 467 | 482 | +15 |
| **总缺口** | 27 | 27 | 0 |
| **新缺口 (首次发现)** | 0 | 0 | 0 |
| **持续缺口 (in history)** | 27 | 27 | 0 |

### 🆕 新缺口 (06-29 首次发现)

无 — 0 new gap (持续 2 天)

### 🔄 持续缺口 Top 5 (06-29 仍出现)

| # | 游戏 | 平台 | 历史 first_seen | 持续天数 | 类别 |
|---|------|------|----------------|----------|------|
| 1 | 8 Ball Billiards Classic | CrazyGames | 早期 | >30 | Skill (台球) |
| 2 | Airplane Manager | Poki | 2026-06-12 | 18 | Idle/Tycoon |
| 3 | Battle Blast | Poki | 2026-06-24 | 6 | Shooter |
| 4 | Bloxd.io | CrazyGames | 早期 | >30 | .io |
| 5 | Brain Test 5 | Poki | 2026-06-25 | 5 | Puzzle/Brain |

**Top 5 持续缺口统计**: Skill 1 / Idle 1 / Shooter 1 / .io 1 / Puzzle 1

### 🚨 隐藏缺口 (Poki 竞品持续,但 daily_seo_analysis 未标记)

| # | 游戏 | 平台 | first_seen | 持续天数 | 状态 |
|---|------|------|------------|----------|------|
| 1 | **Murder** | Poki | 2026-06-20 | 10 | 脚本未标记为 new gap (in history),实际未做 |

**判定**: 脚本逻辑 `is_new_gap = norm not in history.get('seen_gaps', {})` 一旦游戏首次出现就被标记 in history,后续不再显示为 new,但实际游戏仍未做。
- **建议**: 改逻辑: `is_new_gap = norm not in OUR_GAMES` (而非 history)
- 或新增 `still_unmade` 字段,显示在 history 但实际未做

---

## 🔑 长尾词机会 (high-ROI roots)

### 06-29 状态

| 指标 | 06-28 | 06-29 | Δ |
|------|-------|-------|---|
| Seeds | 67 | 67 | 0 |
| Seeds with suggestions | (60) | 63 | — |
| Failed seeds | 6 | **4** | -2 ✅ |
| Total unique suggestions | 593 | 612 | +19 |
| **Longtail gaps** | 247 | **258** | **+11** 📈 |
| Existing blog | 296 | 296 | 0 |
| **High-ROI roots** | 35 | **37** | **+2** |

### 06-28 → 06-29 high-ROI roots delta

| Root | 06-28 | 06-29 | Δ | 备注 |
|------|-------|-------|---|------|
| **crossy road** 🆕 | — | 4 | 🆕 | re-enters (06-28 fully covered) |
| **genshin impact** 🆕 | — | 5 | 🆕 | re-enters (06-28 fully covered) |
| **slither io** 🆕 | — | 4 | 🆕 | re-enters (06-28 fully covered) |
| **kahoot** 🆕 | — | 0 | 🆕 | re-enters but fully covered (no work) |
| krunker | 0 | — | 📉 | 退 (已 fully covered) |
| valorant | 0 | — | 📉 | 退 (已 fully covered) |

### Top 10 high-ROI roots (06-29)

| # | Root | 06-29 variations | Uncovered | Has core blog? | 类别 |
|---|------|------------------|-----------|----------------|------|
| 1 | **hay day** | 7 | **7** | ❌ | 农场模拟 |
| 2 | **among us** | 6 | **6** | ❌ | 社交推理 |
| 3 | **brawl stars** | 6 | **6** | ❌ | MOBA |
| 4 | **overwatch** | 6 | **6** | ❌ | FPS Hero |
| 5 | **animal crossing** | 5 | **5** | ❌ | 生活模拟 |
| 6 | **genshin impact** | 5 | **5** | ❌ | Gacha RPG |
| 7 | **stardew valley** | 5 | **5** | ❌ | 农场 RPG |
| 8 | **crossy road** | 4 | **4** | ❌ | Crossy |
| 9 | **fortnite** | 4 | **4** | ❌ | Battle Royale |
| 10 | **it takes two** | 4 | **4** | ❌ | 合作冒险 |
| 10 | **slither io** | 4 | **4** | ❌ | .io |
| 10 | **zelda** | 4 | **4** | ❌ | Action RPG |

### ✅ Fully covered roots (no work)

包含: agar.io, candy crush, clash of clans, clash royale, cookie clicker, fall guys, gacha life, geometry dash, gta, gta 5, kahoot, minecraft, roblox, subway surfers, temple run, tetris, tomodachi life, wordle (共 18 个)

### 📝 Top 5 立即可写的 blog 候选 (高 ROI + 6/7 uncovered, no core blog)

**hay day** (农场模拟,7/7 uncovered, 0 core):
- games like hay day
- games like hay day for pc
- games like hay day but better
- games like hay day on ps5
- games like hay day but not farming
- games like hay day reddit
- games like hay day on steam

**among us** (社交推理,6/6 uncovered, 0 core):
- games like among us
- games like among us on steam
- games like among us android
- games like among us to play with friends
- games like among us on ps5
- games like among us on roblox

**brawl stars** (MOBA,6/6 uncovered, 0 core):
- games like brawl stars
- games like brawl stars on mobile
- games like brawl stars on ps5
- games like brawl stars reddit
- games like brawl stars android
- games like brawl stars on switch

**overwatch** (FPS Hero,6/6 uncovered, 0 core):
- games like overwatch
- games like overwatch for mobile
- games like overwatch and marvel rivals
- games like overwatch on roblox
- games like overwatch on switch
- games like overwatch on xbox

**stardew valley** (农场 RPG,5/5 uncovered, 0 core):
- games like stardew valley
- games like stardew valley for free
- games like stardew valley on switch
- games like stardew valley on ps5
- games like stardew valley for mobile

### Failed seeds 06-29

| Seed | 状态 | 备注 |
|------|------|------|
| games like pokemon go | ❌ 持续 2d | Google Suggest 阻断 |
| games like krunker | ❌ 1d | 新失败 |
| games like valorant | ❌ 1d | 新失败 |
| best card games free | ❌ 1d | 新失败 |

恢复 (06-28 failed → 06-29 OK):
- ✅ games like kahoot
- ✅ games like slither.io
- ✅ games like genshin impact
- ✅ games like crossy road
- ✅ best idle games browser

---

## 🔧 SEO 端点健康 (daily-seo-health.py v5.9)

### 06-29 12:00 跑

```
🔧 技术SEO检查:
  ✅ gamezipper.com: robots.txt:✅ | sitemap.xml:✅ | indexnowkey.txt:✅ | with lastmod:811/811 (100%)
  ✅ tools.gamezipper.com: robots.txt:✅ | sitemap.xml:✅ | 027a0cd216fe45e6aeb738f2f49d59ff.txt:✅ | with lastmod:3076/3076 (100%)

📡 IndexNow 增量提交:
  [sitemap] gamezipper.com: unique_locs=811 with_lastmod=811 coverage=100.0% tracked=811
  ⏭️ gamezipper.com: 无新URL (811 URLs 已知)
  [indexnow] gamezipper.com: skipped no_new_urls last_status=200 last_ok=2026-06-29T10:00:06 tracked=811
  [sitemap] tools.gamezipper.com: unique_locs=3076 with_lastmod=3076 coverage=100.0% tracked=3078
  ⏭️ tools.gamezipper.com: 无新URL (3076 URLs 已知)
  [indexnow] tools.gamezipper.com: skipped no_new_urls last_status=200 last_ok=2026-06-29T09:00:07 tracked=3078
```

### Sitemap 健康度 (06-29 vs 06-28)

| Host | 06-28 | 06-29 | Δ | Lastmod 覆盖 | Range |
|------|-------|-------|---|--------------|-------|
| gamezipper.com | 811 | **811** | 0 | 100% | 2026-02-19 ~ 2026-06-29 |
| tools.gamezipper.com | 3076 | **3076** | 0 | 100% | 2026-06-29 |

注: tools 跟踪 3078 vs sitemap 3076 = -2 (color-contrast-checker 2 个 URL 06-28 移除,sitemap 已同步)

### Sitemap 增长历史 (gz.com)

| Date | Unique | Δ |
|------|--------|---|
| 2026-06-14 | 624 | — |
| 2026-06-15 | 647 | +23 |
| 2026-06-18 | 671 | +24 |
| 2026-06-29 | 811 | **+140** 🎉 (6d 内大幅增长) |

### IndexNow 跟踪状态

| Host | 06-29 tracked | Last OK | Last Status | 备注 |
|------|---------------|---------|-------------|------|
| gamezipper.com | 811 | 2026-06-29T10:00:06 | 200 | 静态 1d |
| tools.gamezipper.com | 3078 | 2026-06-29T09:00:07 | 200 | -2 vs sitemap (已 sync) |

---

## 🔍 GSC organic 流量

| 指标 | 值 | 备注 |
|------|---|------|
| 状态 | ❌ auth_required | **25 天未解** (since 2026-06-04) |
| 错误 | `missing /home/msdn/.openclaw/secrets/gsc.json; missing /home/msdn/.openclaw/secrets/gsc-sa.json` |
| 影响 | 无法拉 queries/clicks/impressions |
| 修复 | Option A (OAuth 5min) / Option B (Service Account, 推荐) |

---

## 📊 BI 流量 (gamezipper.com 站点)

### 7d / 30d 概览

| 指标 | 7d | 30d | 备注 |
|------|-----|------|------|
| PV | 1,735 | 7,938 | 30d 较 06-21 (6956) **+14%** |
| UV | 950 | 4,746 | 30d 较 06-21 (4239) **+12%** |
| Today PV | 266 | — | 周一 (06-29) |
| Today UV | 164 | — | |
| Bounce rate (7d) | 65.0% | 76.7% | 7d < 30d (新会话质量提升) |
| Online | 2 | — | 实时 |

### 7d 趋势 (BI)

| Date | PV | UV | 备注 |
|------|-----|----|------|
| 06-23 | 291 | 189 | 周二 |
| 06-24 | 125 | 85 | 周三 (低点) |
| 06-25 | 175 | 88 | 周四 |
| 06-26 | 169 | 89 | 周五 |
| 06-27 | **400** | **193** | 周六 🔥 翻倍 (viral?) |
| 06-28 | 309 | 152 | 周日 (回落) |
| 06-29 | 266 | 164 | 周一 (今) |

### 设备分布 7d (持续异常)

| Device | 7d | % |
|--------|-----|---|
| Desktop | 1656 | **95.6%** |
| Mobile | 76 | **4.4%** ⚠️ |
| desktop (lowercase) | 1 | 0.1% |

**判定**: Mobile 占比 4.4% 持续异常,行业 baseline 应 30-50%。可能:
- ① BI 追踪代码 mobile 端未触发 (UA 过滤?)
- ② mobile 流量被 adsense / 浏览器拦截
- ③ 实际就是 desktop 流量 (游戏站,无 mobile-first 设计)
- **建议**: 验证 BI 追踪 snippet 在 mobile viewport 是否加载

### Top 10 页面 7d

| # | Path | PV | UV |
|---|------|-----|-----|
| 1 | / | 186 | 120 |
| 2 | /snake/ | 36 | 23 |
| 3 | /2048/ | 32 | 22 |
| 4 | /matchstick-puzzle/ | 21 | 19 |
| 5 | /balance-scale/ | 21 | 14 |
| 6 | /dice-merge/ | 20 | 17 |
| 7 | /circuit-logic/ | 18 | 13 |
| 8 | /ics-generator.html | 16 | 10 |
| 9 | /tetris/ | 15 | 10 |
| 10 | /wordle/ | 13 | 11 |

### Top 10 来源 7d

| # | Ref | Count |
|---|-----|-------|
| 1 | https://gamezipper.com/ | 71 (内部) |
| 2 | https://emulatorxdotcom.wpcomstaging.com/ | 20 ⚠️ |
| 3 | https://www.bing.com/ | 12 (organic) |
| 4 | https://gamezipper.com/blog/best-time-killer-games-free.html | 10 (内部) |
| 5 | https://gamezipper.com/wood-block-puzzle/ | 6 (内部) |
| 6 | https://game.craftisle.com/ | 6 ⚠️ |
| 7 | https://gamezipper.com/blog/games-like-2048.html | 5 (内部) |
| 8 | https://gamezipper.com/ball-sort.html | 5 (内部) |
| 9 | https://tools.gamezipper.com/ | 4 (cross-domain) |
| 10 | https://gamezipper.com/tetris/ | 4 (内部) |

注: 71/71 内部 ref = 大量用户从首页/博客内链进游戏页 (站内导航健康)

### 用户构成 7d

| Type | Count | % |
|------|-------|---|
| New visitors | 944 | **99.4%** |
| Return visitors | 6 | 0.6% |

**判定**: 99.4% 新访客,极少回访。可能:
- ① 一次性游戏站特性 (snake/2048 玩完就走)
- ② 没有"收藏"价值 (无账号 / 无游戏进度)
- ③ BI 追踪 24h cookie 过期导致回访漏报

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 25d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 12d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)

### 🔧 本轮已修复

- [x] **data drift 1d** (since 06-28) — sync-game-counts.sh 跑完,**483 全对齐** ✅
  - GAMES array: 483
  - Schema numberOfItems: 483
  - Schema itemListElement: 483
  - Header data-count: 483
  - Footer data-count: 483
  - HTML All cat-count: 483
  - 11 个分类全部 match

### 💡 建议 (低优先,下个 sprint)

- [ ] **High-ROI blog 候选**: hay day 7/7 uncovered, 写 1 篇 blog 预计可覆盖 7 个 longtail variations
- [ ] **Poki Murder 缺口 10 天未做** — daily_seo_analysis 应改用 `is_new_gap = norm not in OUR_GAMES` 而非 history
- [ ] **CrazyGames 列表静态 3d** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **BI Mobile 占比异常 4.4%** — 验证 BI 追踪 snippet 在 mobile viewport 是否触发
- [ ] **新游 +15 (06-28 → 06-29)** — Hoop Stack / Claw Master / Nail Art Studio / Sling Smash / Power Wash Puzzle / Zip Tie Untangle / Shogi / Odd One Out / Coin Sort / Pop It Master / Color Switch / Pancake Sort / Tie Dye / Draw One Part / Save the Doge / Slingshot Puzzle / Mr Bullet / Prism Path / Dice Merge / Gear Chain Logic — 大部分是 puzzle 类 (Hoop Stack / Zip Tie Untangle / Pancake Sort 等),符合游戏库方向
- [ ] **reCAPTCHA 6/29 恢复 seeds 5 个** — kahoot / slither.io / genshin impact / crossy road / idle games 全部恢复,Google Suggest 健康

### 📈 观察项 (持续跟踪)

- **sitemap 6d +140 URL** — 大幅增长说明 game pipeline 在持续产出
- **竞品 CG 静态 3d** — 需验证脚本
- **Poki 列表稳定 25** — 内容生态相对稳定
- **周六 (06-27) 400 PV 周日回落** — 持续观察
- **Game 库 483** — 30d 内从 624 增至 811 (gz.com),含 15 个新游 (06-28→06-29)
- **hidden gap 机制** — 改用 `is_new_gap = norm not in OUR_GAMES` 后能看到 Murder 这种"长期缺口"

---

## 📁 产物文件

| 文件 | 用途 | 大小 |
|------|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-06-29.md` | 本报告 | 14 KB |
| `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-06-29.json` | SEO 端点 + BI | 5.6 KB |
| `/home/msdn/gamezipper.com/scripts/seo_health_report_latest.json` | 最新 (覆盖) | 5.6 KB |
| `/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-29.txt` | IndexNow 记录 (0 URLs) | 718 B |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-29.json` | 竞品+缺口 JSON | 5.9 KB |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-06-29.json` | Google Suggest 数据 | 84 KB |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-29.json` | High-ROI roots | 19 KB |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (76 unique) | — |
| `/home/msdn/.openclaw/workspace/data/gsc-2026-06-29.json` | GSC 失败状态 (25d) | 249 B |

---

**报告时间**: 2026-06-29 12:05 CST
**下次报告**: 2026-06-30 10:00 CST
**Owner**: 香香公主 (ops-gamezipper)
