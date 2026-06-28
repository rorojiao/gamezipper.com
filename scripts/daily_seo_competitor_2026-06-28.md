# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-06-28

> **任务**: kanban t_04f43ec8 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 竞品新游 (CrazyGames + Poki) · 缺口分析 vs 468 自有游戏 · 长尾词机会
> **脚本**: `daily_seo_analysis.py` v3.0 (Kachilu Browser + MiniMax Search) + `longtail_scan.py` + `longtail_analysis.py`
> **基线对比**: 2026-06-27 10:00 → **2026-06-28 10:00**
> **状态**: ✅ 数据已采集 (3 个 cron 跑均完成) | 🆕 1 new gap | 📈 247 longtail gaps (稳定)

---

## 🎯 60s Executive Summary

1. **Poki 新游 +2 / -2** — 新增 **Murder** (6/20 持续 9 天)+ **Soccer 5** (6/28 首次,新缺口);下线 Master Chess + MineFun.io
2. **CrazyGames 静态** — 12 games 列表无变化 (与 06-27 一致),可能 CG /t/new 改版或脚本选择器未抓新游
3. **缺口总数 27** (06-27 26),**新缺口 1 个 (Soccer 5)**,持续缺口 26 个
4. **长尾词 247 gaps** (06-27 250, **-3**),roots 35 个,fully_covered 19 个 (no work)
5. **Top high-ROI roots 6/6 uncovered** — hay day / among us / brawl stars / overwatch / animal crossing / stardew valley
6. **数据漂移已修复** — game-pipeline 同步后,4 处下游 (schema/header/footer/HTML) 都对齐 **468** ✅
7. **长期隐藏缺口 Murder** — Poki 竞品持续 9 天,我们未做,本次未标记为 new(在 history 见过,但仍真没做)
8. **P0 阻塞持续** — GSC OAuth 24d + Monetag Token 11d,影响 queries/收益数据采集

---

## 🎮 竞品新游戏追踪 (CrazyGames + Poki)

### 06-28 vs 06-27 delta

| 平台 | 06-27 | 06-28 | Δ | 新增 | 下线 |
|------|-------|-------|---|------|------|
| CrazyGames | 12 | 12 | 0 | — | — |
| Poki | 25 | 25 | 0 | **+2**: Murder, Soccer 5 | **-2**: Master Chess, MineFun.io |
| **合计** | 37 | 37 | 0 | +2 | -2 |

### 🆕 新增竞品游戏 (06-28)

| # | 游戏 | 平台 | 我们有? | 备注 |
|---|------|------|--------|------|
| 1 | **Murder** | Poki | ❌ | 6/20 首次见,持续 9 天,长期隐藏缺口 |
| 2 | **Soccer 5** | Poki | ❌ | 6/28 首次见,**new gap** |

### 📉 下线竞品游戏 (06-27 → 06-28)

| # | 游戏 | 平台 | 备注 |
|---|------|------|------|
| 1 | Master Chess | Poki | 上线 9 天,下线 |
| 2 | MineFun.io | Poki | 上线 11 天,下线 |

### CrazyGames 异常

12 个游戏列表与 06-27 完全一致。可能性:
- ① CG /t/new 改版,选择器 `a[href*="/game/"]` 未抓到新游
- ② Kachilu 浏览器被 Cloudflare 拦截
- ③ CG 新游发布频率本身就很低 (typical < 2/天)
- **建议**: 下次跑前人工验证 `https://www.crazygames.com/t/new` 第一页是否有真新游

---

## 📈 缺口分析 vs 468 自有游戏

### 06-28 状态

| 指标 | 06-27 | 06-28 | Δ |
|------|-------|-------|---|
| 自有游戏数 | 466 (脚本读) | 467 (脚本读) | +1 |
| 实际 games-data.js | 467 (含 6/28 新增 Nail Art Studio) | **468** (sync 已修) | +1 |
| **总缺口** | 26 | 27 | +1 |
| **新缺口 (首次发现)** | 0 | 1 (Soccer 5) | +1 |
| **持续缺口 (in history)** | 26 | 26 | 0 |

### 🆕 新缺口 (06-28 首次发现)

| # | 游戏 | 平台 | 链接 | 建议 |
|---|------|------|------|------|
| 1 | **Soccer 5** | Poki | https://poki.com/en/g/soccer-5 | 🟡 中 — 体育细分,跟我们 Sports 类目 2 个游戏重合,可能竞争 |

### 🔄 持续缺口 Top 5 (06-28 仍出现)

| # | 游戏 | 平台 | 历史 first_seen | 持续天数 | 类别 |
|---|------|------|----------------|----------|------|
| 1 | 8 Ball Billiards Classic | CrazyGames | 早期 | >30 | Skill (台球) |
| 2 | Airplane Manager | Poki | 2026-06-12 | 17 | Idle/Tycoon |
| 3 | Battle Blast | Poki | 2026-06-24 | 5 | Shooter |
| 4 | Bloxd.io | CrazyGames | 早期 | >30 | .io |
| 5 | Brain Test 5 | Poki | 2026-06-25 | 4 | Puzzle/Brain |

### 🚨 隐藏缺口 (Poki 竞品持续,但 daily_seo_analysis 未标记)

| # | 游戏 | 平台 | first_seen | 持续天数 | 状态 |
|---|------|------|------------|----------|------|
| 1 | **Murder** | Poki | 2026-06-20 | 9 | 脚本未标记为 new gap (因为 in history),但**真没做** |

**判定**: 脚本逻辑 `is_new_gap = norm not in history.get('seen_gaps', {})` 一旦游戏首次出现就被标记 in history,后续不再显示为 new,但实际游戏仍未做。**建议**:
- 改逻辑: `is_new_gap = norm not in OUR_GAMES` (而非 history)
- 或新增 `still_unmade` 字段,显示在 history 但实际未做

---

## 🔑 长尾词机会 (high-ROI roots)

### 06-28 状态

| 指标 | 06-27 | 06-28 | Δ |
|------|-------|-------|---|
| Seeds | 67 | 67 | 0 |
| With suggestions | 61 | 61 | 0 |
| Failed seeds | 6 | 6 | 0 |
| Total unique suggestions | 595 | **593** | -2 |
| Long-tail gaps | 250 | **247** | -3 |
| Existing blog | 296 | 296 | 0 |
| High-ROI roots | 35 | 35 | 0 |
| Fully covered (no work) | n/a | **19** | — |

### 🔥 Top 10 high-ROI roots (按 uncovered_count 排序, 06-28)

| # | Root | Var | Uncovered | Has core blog | 类别 |
|---|------|-----|-----------|---------------|------|
| 1 | **hay day** | 7 | 7 | ❌ | 农场模拟 |
| 2 | **among us** | 6 | 6 | ❌ | 社交推理 |
| 3 | **brawl stars** | 6 | 6 | ❌ | MOBA |
| 4 | **overwatch** | 6 | 6 | ❌ | FPS |
| 5 | **animal crossing** | 5 | 5 | ❌ | 模拟经营 |
| 6 | **stardew valley** 🆕 | 5 | 5 | ❌ | 农场 RPG |
| 7 | **fortnite** | 4 | 4 | ❌ | Battle Royale |
| 8 | **it takes two** | 4 | 4 | ❌ | 合作冒险 |
| 9 | **kirby** | 4 | 4 | ❌ | Platformer |
| 10 | **sims** | 4 | 4 | ❌ | 模拟人生 |

### 06-27 → 06-28 high-ROI roots delta

| Root | 06-27 | 06-28 | Δ | 备注 |
|------|-------|-------|---|------|
| animal crossing | 3 | 5 | +2 📈 | variations 增长 |
| stardew valley | — | 5 | 🆕 | 首次进入 high-ROI |
| sims 4 | — | 3 | 🆕 | 首次进入 high-ROI |
| minecraft | — | 0 | 🆕 | 已有 variations 但 fully covered |
| fall guys | — | 0 | 🆕 | fully covered |
| genshin impact | 5 | — | 📉 | 退出 high-ROI (uncovered 降) |
| crossy road | 4 | — | 📉 | 退出 high-ROI |
| slither io | 4 | — | 📉 | 退出 high-ROI |
| among us | 7 | 6 | -1 | 1 variation 已被现有 blog 覆盖 |
| it takes two | 5 | 4 | -1 | 同上 |
| overwatch | 7 | 6 | -1 | 同上 |

### ✅ Fully covered roots (no work, 19 个)

包含: agar.io, candy crush, clash of clans, clash royale, cookie clicker, fall guys, geometry dash, gta, gta 5, kahoot, krunker, minecraft, roblox, subway surfers, temple run, tetris, tomodachi life, valorant, wordle

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
- games like among us on steam
- games like among us android
- games like among us to play with friends
- games like among us on ps5
- games like among us online

---

## 📊 数据源 + 同步状态

| 数据文件 | 06-28 状态 | 备注 |
|---------|-----------|------|
| `daily-growth-2026-06-28.json` | ✅ 5.9 KB, 27 gaps | Kachilu 跑完 |
| `longtail-2026-06-28.json` | ✅ 新生成,593 sugs | Google Suggest 6/6 seeds failed 略不同 |
| `longtail-analysis-2026-06-28.json` | ✅ 17.9 KB, 35 roots | 247 gaps |
| `gsc-2026-06-28.json` | ❌ auth_required | 持续 24 天, GSC OAuth 缺失 |
| `gap-history.json` | ✅ 77 unique | Soccer 5 新增, Murder 持续 |
| **games-data.js** | ✅ **468** (sync 已修) | 4 处下游全部对齐 |
| `seo_health_report_2026-06-28.json` | ✅ 9/9 endpoints | IndexNow skip |
| `daily_seo_2026-06-28.md` | ✅ 已生成 (10:00 跑) | 流量数据见那份 |

### Failed seeds 06-28 vs 06-27

| Seed | 06-27 | 06-28 |
|------|-------|-------|
| games like kahoot | ✅ | ❌ |
| games like pokemon go | ❌ | — |
| games like stardew valley | — | ✅ |
| games like minecraft | ❌ | — |
| games like slither.io | — | ❌ |
| games like genshin impact | — | ❌ |
| games like crossy road | — | ❌ |
| games like fall guys | ❌ | — |
| best io games | ❌ | — |
| free unblocked games | ❌ | — |
| best idle games browser | — | ❌ |

(Google Suggest 间歇性失败,影响 4-6 seeds 失败/天,正常)

---

## 🚨 阻塞 & 建议

### ❌ 老公 P0 持续

- [ ] **GSC OAuth 24d** — 无法拉 queries/clicks/impressions
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 11d** — 无法拉收益数据
  - publishers.monetag.com 手动取 token (reCAPTCHA 阻挡自动化)

### 🔧 建议 (低优先,下个 sprint)

- [ ] **Poki Murder 缺口 9 天未做** — daily_seo_analysis 应改用 `is_new_gap = norm not in OUR_GAMES` 而非 history
- [ ] **CrazyGames 列表静态** — 验证 `https://www.crazygames.com/t/new` 选择器或加 fallback
- [ ] **High-ROI blog 候选**: hay day 7/7 uncovered, 写 1 篇 blog 预计可覆盖 7 个 longtail variations
- [ ] **Murder game 评估**: Poki 持续 9 天,说明需求稳定。是否值得做?调研实现难度 (mmorpg/social deduction 类需要后端)

### 📈 观察项 (持续跟踪)

- **长尾 roots 35 个稳定** — high-ROI 名单没有剧烈变化,说明我们博客覆盖策略是稳定的
- **数据漂移修复后** — pre-commit hook 重新可工作,后续 SEO 报告可正常 commit
- **周六 (06-27) 流量翻倍** (400 PV) — 持续观察,可能是 viral 触发

---

## 📁 产物文件

| 文件 | 用途 |
|------|------|
| `/home/msdn/gamezipper.com/scripts/daily_seo_competitor_2026-06-28.md` | 本报告 |
| `/home/msdn/.openclaw/workspace/data/daily-growth-2026-06-28.json` | 竞品+缺口 JSON |
| `/home/msdn/.openclaw/workspace/data/longtail-2026-06-28.json` | Google Suggest 数据 |
| `/home/msdn/.openclaw/workspace/data/longtail-analysis-2026-06-28.json` | High-ROI roots |
| `/home/msdn/.openclaw/workspace/data/gap-history.json` | Gap 历史 (77 unique) |

---

**报告时间**: 2026-06-28 10:35 CST
**下次报告**: 2026-06-29 10:00 CST
**Owner**: 香香公主 (ops-gamezipper)
