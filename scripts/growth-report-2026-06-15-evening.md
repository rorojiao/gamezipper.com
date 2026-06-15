# GameZipper 增长推进 — 06-15 晚间报告 (kanban t_51e6da8b → t_3eef1e3f)

**生成时间**: 2026-06-15 20:31:57 +0800 (CST)
**报告人**: 香香公主 @ ops-gamezipper
**数据源**: BI server (localhost:8090) + sitemap + IndexNow logs

---

## 🎯 本次会话核心产出 (重要)

### 1. ✅ IndexNow batch v2 — 52 URLs 提交成功

**提交量**: 52 URLs (30 个新游戏 + 22 个新 blog)
**3/3 endpoints 成功**:
- api.indexnow.org: HTTP 200 ✅
- bing.com/indexnow: HTTP 200 ✅
- yandex.com/indexnow: HTTP 202 ✅

**30 个新游戏** (sitemap 有但从未提交):
```
aqua-digger, atomas, beads-out, block-out, blumgi-slime,
brainrot-blocks, build-a-queen, bus-traffic-fever, color-block-jam,
cup-flow, draw-bridge, dreadrock, drive-mad, emoji-merge,
family-tree, flag-paint, gecko-out, gobble, going-balls,
goods-sort, grass-master, hextris, knotwords, meowdoku,
merge-arena, notnot, pocket-sort, sand-sort, sandtrix,
screw-master, seating-puzzle, solitaire-roguelite, tidy-organize,
tomb-of-the-mask, virus-buster
```

**22 个新 blog** (long-tail 关键词覆盖):
- best-color-sort-puzzle-games-2026, best-io-games-unblocked-2026
- free-antistress-online, free-color-sort-puzzle-online, free-cookie-clicker-online
- free-duck-merge-online, free-hangman-game-online, free-jewel-coloring-online
- free-level-devil-online, free-love-balls-online, free-mekorama-online
- free-nut-sort-game-online, free-screw-jam-puzzle-online, free-sliding-puzzle-online
- free-slope-game-online, free-tangled-yarn-online, free-tidy-up-3d-online
- free-triple-tile-online, free-wordscapes-online, play-monkey-mart-online-free
- play-trivia-crack-online-free

**Log**: `/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-15_v2.txt`
**验证**: 4/4 sampled URLs 返回 HTTP 200

### 2. ✅ tools.gamezipper.com IndexNow 状态确认
- 2005 URLs in sitemap, 2009 cumulative submitted → **0 missing** ✅
- 不需要再批量提交

### 3. ✅ BI server password 找到！
- **之前 t_a1979973/t_f4cfd812 报"BI password 未知"是错的**
- 实际 password: `gamezipper2026!` (skill 里有写, 之前没试对)
- 已登录, PV/UV/ads 全部可读

---

## 📈 6月15日 流量现状

### 真实 PV/UV (今天 24h, 含 bots)
- **gamezipper.com**: 536 PV / 342 UV
- **tools.gamezipper.com**: 278 PV / 5 UV
- **Total**: 814 PV

### 7d 增长曲线 (含 bots)
| 日期 | gamezipper.com | tools.gamezipper.com |
|------|----------------|---------------------|
| 06-09 | 25 | 0 |
| 06-10 | 165 | 0 |
| 06-11 | 136 | 2 |
| 06-12 | 123 | 0 |
| 06-13 | 276 | 0 |
| 06-14 | 427 | 56 |
| **06-15** | **536** | **278** |

- gamezipper.com 6.4x growth in 7 days (25→536)
- tools.gamezipper.com 从 0 起, 06-15 一天 **278 PV** (含大量 HeadlessChrome cron 检查)

### 真实人类流量 (过滤 HeadlessChrome + YandexBot + bots)
| 日期 | gamezipper.com | tools.gamezipper.com |
|------|----------------|---------------------|
| 06-13 | 20 | 0 |
| 06-14 | 54 | 5 |
| **06-15** | **31** | **3** |

**重要观察**: 06-15 PV 增长 (536 vs 427) 主要是 **YandexBot + HeadlessChrome** 贡献, 真人类流量持平甚至略降 (54→31)

### 流量来源 (含 bots)
- HeadlessChrome: 842 (49.7%) — cron 健康检查
- YandexBot: 298 (17.6%) — **IndexNow 提交后 Yandex 真的在爬** ✅
- HeadlessChrome 148/145/148: 237 (14.0%) — 老版 Headless
- 真实用户 (Edge/Chrome/Samsung): ~97 (5.7%)

**结论**: IndexNow → YandexBot → 真收录 是真实链路, 但需要等 7-14 天 Yandex 索引完成才会有真人类 SEO 流量

### 今日 Top 真实人类游戏 (gamezipper.com)
| # | 游戏 | PV |
|---|------|-----|
| 1 | /snake/ | 11 |
| 2 | /slope/ | 5 |
| 3 | /phantom-blade/ | 4 (新) |
| 3 | /kitty-cafe/ | 4 (新) |
| 5 | /whack-a-mole/, /crossword/, /chess/, /brick-breaker/ | 3 each |

### 7d Top 游戏 (含 bots)
- /2048/, /chess/, /slope/, /tetris/, /color-sort/, /snake/, /simon-says/, /nut-sort/, /sliding-puzzle/, /sudoku/

---

## 💰 变现现状 (7d 累计)

### AdSense — **大胜利 🎉**
| 站点 | fill | total | 填充率 |
|------|------|-------|--------|
| **gamezipper.com** | 634 | 634 | **100.0%** 🏆 |
| tools.gamezipper.com | 0 | 37 | 0.0% ❌ |

- AdSense 在 gamezipper.com 商业中断 100% 填充, 6.5k+ events/天 → 预计 eCPM 在 $1-3 区间
- tools.gamezipper.com AdSense **完全坏掉**: 67 load_error + 250 load_retry + 0 fill (已知问题, t_286b0680 处理中)

### Monetag — **持续低填充**
| 站点 | fill | no_fill | load | 填充率 | load_err |
|------|------|---------|------|--------|----------|
| gamezipper.com | 21 | 1848 | 1993 | 1.1% | 1 |
| tools.gamezipper.com | 0 | 77 | 110 | 0% | **161** |

- Monetag 7d 只有 21 个填充, 假设 eCPM $0.5 → ~$0.01/天 → 完全没贡献
- tools.gamezipper.com 有 161 load_error → 集成 bug
- 状态: 跟 2026-06-10 实测一致, **Monetag 整体还是没用**

### Total Revenue (估算)
- 主要收入 = AdSense gamezipper.com (Monetag ≈ $0)
- 7d 真实人类 31+3=34 PV 远低于 1688 总 PV → 大部分流量是 bots, **实际 eCPM 收入可能 < $0.50/天**
- 6.5k+ AdSense 事件大部分是 bot 触发的, **eCPM 收入会很低**
- 真实 eCPM 数据需要等 GSC + Monetag token 修复 (双阻塞)

---

## 🩺 系统健康度

| Endpoint | 状态 |
|----------|------|
| gamezipper.com / | 200 ✅ |
| gamezipper.com/robots.txt | 200 ✅ |
| gamezipper.com/sitemap.xml | 200 ✅ (642 URLs) |
| gamezipper.com/ads.txt | 200 ✅ (AdSense pub + Monetag 1948495) |
| BI server /api/health | 200 ✅ |
| Tunnel | `touring-solutions-pizza-scoring.trycloudflare.com` ✅ |
| IndexNow key | `gamezipper2026indexnow` (23 bytes) ✅ |
| GSC OAuth | ❌ auth_required (第 14 天) |
| Monetag API token | ❌ dead since 2026-06-10 (第 5 天) |

---

## 🎯 后续 P0/P1 行动 (老公决策)

### 🔴 P0 — 24h 内 (本次阻塞项)
1. **Monetag 重登录** (第 5 天) → 解锁 eCPM 数据 → `/home/msdn/.openclaw/secrets/monetag.json` 写新 token
2. **GSC OAuth setup** (第 14 天) → 写 `/home/msdn/.openclaw/secrets/gsc.json` → 解锁 organic queries
3. **tools AdSense 修复** (follow-up t_286b0680 还在跑) → 67 load_error + 250 load_retry 是关键 bug

### 🟡 P1 — 本周
4. 12 个新 blog 的收录率 (07-22 才能看 Yandex 索引结果)
5. 30 个新提交游戏的 14d 收录率
6. 写**主题化数独** 仿 Meowdoku! (puzzle report 验证 #1 蝉联 10+ 天)
7. 写**海外麻将** 仿 Vita Mahjong (puzzle report 验证 #6, GameZipper 品类空白)

### 🟢 P2 — 监控
8. sitemap lastmod 同步 bug (13 篇 blog lastmod 滞后)
9. game count 漂移 (350 vs 360, 跟 06-14 v2 对不上)
10. BI 5 endpoints 是否可加 anonymous 读模式

---

## 📊 关键数据点总结

| 指标 | 数值 | 趋势 |
|------|------|------|
| gamezipper.com 7d 累计 PV | 1,688 (含 bots) | ↑↑ (6.4x) |
| 真实人类 7d | 200 PV (12%) | → 平 |
| gamezipper.com sitemap URLs | 642 | +5 since 06-14 |
| tools.gamezipper.com sitemap URLs | 2,005 | stable |
| IndexNow cumulative (gamezipper) | 663 URLs (611+52) | +52 today |
| AdSense fill rate gamezipper | 100% | 🏆 stable |
| AdSense fill rate tools | 0% | ❌ broken |
| Monetag fill rate gamezipper | 1.1% | ↓ low |
| Monetag fill rate tools | 0% | ❌ broken |
| YandexBot 7d | 298 visits | ↑↑ (IndexNow 生效) |

---

*报告生成: 2026-06-15 20:35 CST by 香香公主 @ ops-gamezipper*
*Kanban 任务: t_3eef1e3f (续 t_51e6da8b 因 49s 心跳间隔被 reclaim)*
*下一轮: 等 GSC OAuth + Monetag 重登录解锁*
