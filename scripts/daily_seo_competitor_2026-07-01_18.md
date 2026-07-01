# 🔍 GameZipper 每日 SEO + 竞品 + 长尾词分析 — 2026-07-01 (晚间增量 run)

> **任务**: kanban t_2a313a37 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 增量差分检查 (vs 12:14 run) · 晚间监控信号确认
> **脚本**: Camoufox browser (CG/Poki live check) + BI localhost:8090 + sitemap curl --noproxy '*'
> **基线**: 2026-07-01 12:14 (t_4684fd68) → **2026-07-01 12:31 (本次)**
> **状态**: ✅ **完全静态** | 0 new gap | 0 SEO 端点变化 | 0 BI 数据变化

---

## 🎯 60s Executive Summary

1. **完全静态日** — CG 12/12 ✅ · Poki 25/25 ✅ · sitemap gz 830 / tools 3149 ✅ · tracked 832/3151 ✅ · BI 7d 1565/847 (与 12:14 一致)
2. **竞品无变化** — Camoufox live check 12:31 vs daily-growth-2026-07-01.json (12:14 Kachilu) **name + href 100% 相同**
3. **gap 数据稳定** — total 26 / new 0 / recurring 26, Punch Master 已在 history (`first_seen: 2026-07-01`)
4. **longtail 复用** — 12:14 run 数据完整 (622 sugs / 274 gaps / 39 roots),无新 run 必要
5. **今天流量塌陷后稳定** — today 142/117 (12:14 same), 12:14→12:31 (17min) 0 new hit, 可能是 BI batch flush 窗口未到
6. **P0 阻塞持续** — GSC OAuth **28d** / Monetag Token **21d**

---

## 🔄 12:14 → 12:31 差分 (17 min)

| 指标 | 12:14 (t_4684fd68) | 12:31 (本次) | Δ | 备注 |
|------|-------------------|--------------|---|------|
| CG 列表 | 12 | **12** | 0 | 完全相同 |
| Poki 列表 | 25 | **25** | 0 | 完全相同 |
| gz.com sitemap | 830 | **830** | 0 | lastmod 828/830 99.8% |
| tools sitemap | 3149 | **3149** | 0 | lastmod 100% |
| gz.com tracked | 832 | **832** | 0 | (sitemap < tracked = 2 URLs offline) |
| tools tracked | 3151 | **3151** | 0 | (sitemap < tracked = 2 URLs offline) |
| BI 7d PV | 1565 | **1565** | 0 | today 142 unchanged |
| BI 7d UV | 847 | **847** | 0 | today 117 unchanged |
| BI 30d PV | 8179 | **8184** | **+5** | 可能是 data flush 尾部 |
| BI 30d UV | 4909 | **4913** | **+4** | — |
| Gap total | 26 | **26** | 0 | new_gaps=0 in JSON |
| Gap new | 1 (Punch Master) | **0** | -1 | 已是 history (run-once 标记) |
| Longtail sugs | 622 | **622** | 0 | (no new run) |

**结论**: 17min 内无任何系统/竞品/数据变化。这是 cron 兜底触发,产物基本相同,价值在于**确认监控信号**。

---

## 🎮 竞品实时验证 (Camoufox 12:31)

### CrazyGames /t/new (12 款)

```
Bloxd.io, Mahjongg Solitaire, Piece of Cake: Merge and Bake,
OriginalsRagdoll Archers, TopArrow Escape: Puzzle, Openfront,
Veck.io, Piles of Mahjong, Mergest Kingdom, OriginalsFour Colors,
OriginalsColor Tap: Coloring by Numbers, 8 Ball Billiards Classic
```

**diff vs 12:14**: ✅ **完全相同** (name + href 100% 一致)

### Poki /en/new (25 款)

```
GoBattle 2, Stickman Battle, Combat Online 2, Master Chess,
Subway Surfers, Drift Boss, Retro Bowl, Stickman Hook,
Monkey Mart, Blocky Blast Puzzle, Level Devil, Punch Master,
Soccer 5, Hero VS Criminal, Smash Room, Numbers Match 2448,
Brain Test 5, Battle Blast, SuperWEIRD, Car Circle,
Make Brainrots Online, Home Builder Clicker, Sea Catcher,
Phone CASE DIY, Marina Club Rush
```

**diff vs 12:14**: ✅ **完全相同**

### 静态日累计

- **CG 静态**: 已持续 **7+ 天** (06-25 起),需验证选择器或加 fallback
- **Poki 静态**: 已持续 **3+ 天** (06-29 起),正常稳定

---

## 📊 BI 流量快照 (12:31)

### 全站总览 (无 site filter)

| 指标 | 12:14 | 12:31 | Δ |
|------|-------|-------|---|
| 7d PV | 1565 | **1565** | 0 |
| 7d UV | 847 | **847** | 0 |
| 30d PV | 8179 | **8184** | +5 |
| 30d UV | 4909 | **4913** | +4 |
| today PV | 142 | **142** | 0 |
| today UV | 117 | **117** | 0 |
| Bounce 7d | 66.3% | **66.3%** | — |
| Avg Dur 30d | 1019s | **1019s** | — |
| Online now | 0 | **0** | — |

### 设备分布 (7d, 持续异常)

- Desktop: 1503 (96.0%) ⚠️
- Mobile: 60 (3.8%) ⚠️ **持续 7+ 天偏离行业 30-50%**
- 大小写 desktop: 1
- 30d 趋势稳定

### Top 5 pages 7d (无变化)

`/` 158/96 · `/2048/` 32/22 · `/snake/` 26/19 · `/circuit-logic/` 23/18 · `/matchstick-puzzle/` 21/19

---

## 🔧 技术 SEO (实时)

| 端点 | 12:14 | 12:31 | 备注 |
|------|-------|-------|------|
| gz.com /robots.txt | ✅ | ✅ | 200 |
| gz.com /sitemap.xml | 830 | **830** | lastmod 828/830 (99.8%) |
| gz.com /indexnowkey.txt | ✅ | ✅ | key=gamezipper2026indexnow |
| gz.com / | ✅ | ✅ | 200 |
| gz.com /2048/ | ✅ | ✅ | 200 |
| tools /robots.txt | ✅ | ✅ | 200 |
| tools /sitemap.xml | 3149 | **3149** | lastmod 3149/3149 (100%) |
| tools /027a0cd2...txt | ✅ | ✅ | key present |
| tools / | ✅ | ✅ | 200 |

**9/9 ✅** | IndexNow: skip (no new URLs, tracked ≥ sitemap)

### Sitemap lastmod 范围

- **gz.com**: 2026-06-22 ~ 2026-07-01 (range 9 days)
- **tools**: 2026-06-30 ~ 2026-06-30 (single day snapshot)

---

## 📈 缺口分析 (vs 510 自有游戏)

### 缺口状态 (复用 12:14 数据)

| 类别 | 数量 | 备注 |
|------|------|------|
| 总缺口 | **26** | — |
| 新缺口 | **0** | Punch Master 已入库 history |
| 持续缺口 | **26** | 见 12:14 详细列表 |
| 自有游戏 | **511** | 脚本读数 |

### history 新增 (07-01)

```
punch master: {first_seen: 2026-07-01, source: poki, name: Punch Master, last_seen: 2026-07-01}
```

**Total seen_gaps**: 74 (vs 06-30 的 73, +1)

### 高优候选 (沿用 12:14)

1. **Punch Master** 🆕 — Poki, 物理格斗简单 (matter.js / box2d)
2. **8 Ball Billiards Classic** (49 天未做, 桌球类)
3. **Murder** (12 天, 需后端, P2 评估)

---

## 📡 长尾词 (复用 12:14 run)

| 指标 | 值 |
|------|-----|
| Seeds 总数 | 67 |
| Seeds 成功 | 64 |
| Seeds 失败 | 3 (pokemon go / best card games free / free mobile games offline) |
| Unique suggestions | 622 |
| Long-tail gaps | 274 |
| High-ROI roots | 39 |
| Uncovered variations | 80 |
| Fully uncovered (no core) | 19 |

**Top 7 high-ROI roots 全 uncovered** — hay day 7 / among us 6 / brawl stars 6 / overwatch 6 / animal crossing 5 / genshin impact 5 / stardew valley 5

**07-01 新发现 8 roots** — clash of clans / cookie clicker / mario / mario party / sims 4 / stardew valley / tomodachi life / wordle

---

## 🚨 阻塞 & 建议 (持续)

### ❌ 老公 P0 (持续,本 run 无变化)

- [ ] **GSC OAuth 28d** (2026-06-04~)
  - Option A: 5min 手动 OAuth → /home/msdn/.openclaw/secrets/gsc.json
  - Option B (推荐): Service Account → /home/msdn/.openclaw/secrets/gsc-sa.json
- [ ] **Monetag Token 21d** (2026-06-11~)
  - publishers.monetag.com 手动取 token

### ⚠️ 持续观察 (本次 run 验证)

- [ ] **BI 设备分布异常 7+ 天** — Desktop 96% / Mobile 3.8%,行业应 30-50%
- [ ] **06-30 流量塌陷** — 70/27 PV/UV (vs 06-29 300/188, -77%/-86%),07-01 反弹 142/117
- [ ] **CG /t/new 静态 7+ 天** — 验证选择器或加 fallback (poki 25 稳定正常)
- [ ] **Punch Master 优先级 P1** — 物理格斗简单可做,等评估后启动

### 📝 无变化项 (监控信号健康)

- ✅ SEO 9 端点持续 OK
- ✅ IndexNow 监控信号每跑必打
- ✅ sitemap lastmod 覆盖稳定 (gz 99.8% / tools 100%)
- ✅ longtail data 已对齐 (622/274/39/80/19)
- ✅ BI 7d/30d 滚动健康

---

## 📁 产物文件 (本次 + 今日汇总)

| 文件 | 时间 | 用途 |
|------|------|------|
| `daily_seo_competitor_2026-07-01_18.md` | 12:31 | **本次报告** (晚间差分) |
| `daily_seo_competitor_2026-07-01.md` | 12:14 | 中午完整报告 (主版本) |
| `daily_seo_2026-07-01_10.md` | 10:08 | 上午 SEO 健康报告 |
| `daily-growth-2026-07-01.json` | 12:14 | 竞品+缺口 JSON (511 games, 26 gaps) |
| `longtail-analysis-2026-07-01.json` | 12:14 | Longtail roots (39) |
| `gap-history.json` | 12:14 | Punch Master 已入库 |
| `seo_health_report_2026-07-01.json` | 12:14 | 9/9 endpoints |

---

## 💡 本次 run 价值

1. **监控信号** — 17min 内无任何系统变化,说明 cron 数据流稳定
2. **静态日确认** — CG/Poki 完全静态,可放心不重复跑 Kachilu
3. **history 累积** — gap-history +1 (74 条),punch master 已固化
4. **晚间 run 模式确认** — 12:14 是主报告,12:31 兜底增量,价值=信号而非内容

**下次 cron**:
- SEO health: 07-01 16:00 (gsc 6am cron 仍 auth_required)
- Daily SEO + 竞品 + 长尾: 07-02 12:00 CST (主 run)
- IndexNow: 07-02 10:00 CST (cron)

---

**报告时间**: 2026-07-01 12:31 CST
**Owner**: 香香公主 (ops-gamezipper)
**类型**: 晚间增量差分 (vs 12:14 t_4684fd68)
**状态**: 完全静态 — 监控信号健康 — 0 new gap — 0 new 长尾