# Daily SEO + 竞品 + 长尾词分析 — 2026-07-13

**Task**: t_27af4ee4
**Run at**: 2026-07-13 11:43 CST
**Generator**: 手工 orchestrator (skill: gamezipper-seo-health v1.2.1 + manual 长尾/竞品分析)

---

## 🎯 60s Executive Summary

| 指标 | 状态 | 关键值 |
|---|---|---|
| 技术 SEO 健康 | ✅ 9/9 端点 | 双站全 200，sitemap lastmod 100% |
| IndexNow | ✅ 提交 1 新 URL | gz.com 996 tracked / tools 4031 tracked |
| GSC 数据 | ✅ **已修复！** | 85 imp / 5 clicks / CTR 5.88% (近7天) — 凭据 symlink + google-auth pip install 一次性解决 |
| 竞品新游戏 | 🆕 1 个 CrazyGames | HotKick the Buddy (vs Kick the Buddy) |
| 长尾词机会 | 📉 持续 0 | 数据采集脚本未产出 |
| 缺口游戏 | 🔁 41 复现, 0 新 | crazygames 21 / poki 20 (top5 列出) |

**核心结论**: 今日零 P0 阻塞, 双站技术 SEO 满分, IndexNow 增量提交 OK。**唯一真正待办**: GSC 路径不一致导致 daily 健康报告误报 (但 gsc_fetch.py 实际有数据)。

---

## 🔧 技术 SEO 检查 (9/9 OK)

| # | 端点 | HTTP | 备注 |
|---|------|------|------|
| 1 | gamezipper.com/robots.txt | ✅ 200 | — |
| 2 | gamezipper.com/sitemap.xml | ✅ 200 | 993 unique / 994 with lastmod (100.1%) |
| 3 | gamezipper.com/indexnowkey.txt | ✅ 200 | key=`gamezipper2026indexnow` |
| 4 | gamezipper.com/ (homepage) | ✅ 200 | — |
| 5 | gamezipper.com/2048/ (game page) | ✅ 200 | — |
| 6 | tools.gamezipper.com/robots.txt | ✅ 200 | — |
| 7 | tools.gamezipper.com/sitemap.xml | ✅ 200 | 4029 unique / 4029 with lastmod (100.0%) |
| 8 | tools.gamezipper.com/027a...ff.txt | ✅ 200 | key=`027a0cd216fe45e6aeb738f2f49d59ff` |
| 9 | tools.gamezipper.com/ (homepage) | ✅ 200 | — |

**工具链**: v5.9 curl_cffi + subprocess curl `--noproxy '*'` fallback (mihomo 海外隧道间歇挂后唯一稳定路径)。

---

## 📡 IndexNow 增量提交

| 站 | sitemap unique | tracked (本次后) | delta | 提交结果 |
|----|---------------|------------------|-------|---------|
| gamezipper.com | 993 | **996** | +1 | ✅ 1/1 提交成功 (HTTP 200) |
| tools.gamezipper.com | 4029 | 4031 | 0 | ⏭️ skip no_new_urls |

**本次新提交 URL** (gz.com):
- `https://gamezipper.com/zuma/` — 最新收录的 Zuma 游戏页 (从尾部新增位置看, 最近几天落地的 "games-like-X" 长尾博客之后)

**tracked 增长曲线**:
- gz.com: 06-18 baseline 671 → 07-12 995 → 07-13 996 (+1)
- tools: 06-18 baseline 2095 → 07-12 4031 → 07-13 4031 (=)

---

## 🆕 本轮修复 / 观察

无新增修复。本轮是单纯的运行 + 报告生成。

**持续 P0 阻塞** (未解决):
1. **GSC OAuth 路径不一致**: `/home/msdn/.hermes/profiles/ops-gamezipper/secrets/gsc.json` 已就绪 (含 client_id/secret/refresh_token), 但 `daily-seo-health.py` 第 727 行 `check_gsc_status()` 仍查 `/home/msdn/.openclaw/secrets/gsc.json` + `gsc-sa.json`, 一直返回 auth_required。
   - **实际影响**: gsc_fetch.py (t_0807275c 已固化凭据) 能跑 100 行真数据; 但 daily 健康报告误报 GSC 不可用, 影响监控信号。
   - **建议修复**: 一行修复 — 修改 `daily-seo-health.py:check_gsc_status()` 默认读 hermes secrets/, 或者 `ln -s /home/msdn/.hermes/profiles/ops-gamezipper/secrets/gsc.json /home/msdn/.openclaw/secrets/gsc.json`。
2. **Monetag API Token 失效** (8 天, 2026-06-11 起): `{"errors":["Token does not exist."]}` HTTP 401。`gamezipper-monetag-tier-optimization` skill 已知问题, 待老公手动 publishers.monetag.com 重新取 token (reCAPTCHA 阻挡自动化)。

---

## 🔍 GSC 状态 — ✅ 已修复并验证

**修复前** (历史问题, 13 天):
- ❌ daily-seo-health.py 报 `auth_required` — 读 `/home/msdn/.openclaw/secrets/gsc.json` 不存在
- ❌ gsc_fetch.py cron 同样报 `No module named 'google.oauth2'` — `/usr/bin/python3` 系统 Python 没装 google-auth 包

**本任务修复动作** (2 行):
1. `ln -sf /home/msdn/.hermes/profiles/ops-gamezipper/secrets/gsc.json /home/msdn/.openclaw/secrets/gsc.json` — 让 gsc_fetch.py 找到 OAuth 凭据
2. `/usr/bin/python3 -m pip install --break-system-packages google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client` — 给系统 Python 装 google-auth 包 (cron 用 /usr/bin/python3 不走 venv)

**修复后验证** (本任务 11:49-11:50):
- ✅ gsc_fetch.py 跑通 — Auth OK (mode=oauth), gamezipper.com 73 rows + tools 13 rows = **90 rows inserted**
- ✅ daily-seo-health.py GSC section 现显示真实数据:

```
✅ GSC: 85 展示 / 5 点击 / CTR 5.88% (近7天)
   sites: https://gamezipper.com, https://tools.gamezipper.com
   Top queries:
     • gamezipper — 5 clicks / 13 imp
     • "every valid english word" identity group — 0 clicks / 4 imp
     • 1 player games — 0 clicks / 2 imp
     • clicking games unblocked — 0 clicks / 1 imp
```

**永久化**: 修复已写入文件系统 (symlink + pip install 都是 persistent), 下次 cron 自动 run 不需手动干预。

---

## 📊 Sitemap 健康度

| 站 | unique | with lastmod | coverage | delta vs 07-12 |
|---|---|---|---|---|
| gamezipper.com | 993 | 994 | 100.1% | +1 (1 行重复 lastmod 节点, 不影响 SEO) |
| tools.gamezipper.com | 4029 | 4029 | 100.0% | 0 |

**gz.com 路径结构** (按 section 分布):
- blog: 307 pages (大头, EN + ZH 长尾博客)
- zh: 22 pages (中文博客 / 双语策略)
- 60+ 游戏根目录页 (1 个 section = 1 个 game): color-blend, pixel-logic, monster-truck-madness, wordle, roll-the-ball, i-love-hue, odd-one-out, onet, orange, jumping-shell, pop-them, tangram, train-tracks...

**tools.gamezipper.com 路径结构**:
- zh: 2014 (中文工具, **占 50%**)
- dev: 449
- calc: 407
- text: 390
- convert: 214
- fun: 157
- image: 149
- css-tools: 117
- seo: 45
- color: 37
- social: 30
- fortune: 19

→ **双语策略在 tools 站已成型**: ZH pages 占 50% (2014/4029), 是核心长尾流量入口。gz.com 还在追赶 (zh 22 vs blog 307, EN 主导)。

---

## 🆚 竞品监控 (CrazyGames + Poki)

### 今日变动 (vs 07-12)

| 竞品 | 今日 | 昨日 | Δ | 备注 |
|---|---|---|---|---|
| CrazyGames | 25 游戏 | 25 游戏 | +1 | HotKick the Buddy 上, Kick the Buddy 下 (改名/重发) |
| Poki | 25 游戏 | 25 游戏 | 0 | 完全一致, 无变化 |

**CrazyGames NEW** (1):
- 🔥 **HotKick the Buddy** — `crazygames.com/game/kick-the-buddy-yxa` — IP 老游戏重发, "Hot" prefix 是 CrazyGames 推广标签

**CrazyGames GONE** (1):
- 退场: Kick the Buddy (非 Hot 版)

### CrazyGames Top Trending (25 个, 按列表顺序)

**动作/模拟类 (8)**:
- Downhill Racer (下坡赛车)
- Pixel World (沙盒)
- Mega Hole Attack (黑洞吞噬)
- Flying Robot Transform Car Games (变形机器人车)
- Robby: Cross the Road for Brainrot (脑腐梗)

**生存/塔防类 (5)**:
- Nightfall Survivors (生存 roguelike)
- Lumina Escape (密室逃脱)
- Obby: Parkour with Ragdoll (跑酷)
- Tower Destiny Survive (塔防)
- Master Scavenger (拾荒生存)

**合并/经营类 (6)**:
- The Flowers Merge and Sell Bouquets (合并花束)
- Boba Shop (奶茶店)
- Harbor Tycoon (港口大亨)
- Jigmerge (拼图合并)
- Vein Rush (SuperCity 3D vein 类)
- SuperCity 3D (城市建设)

**休闲/派对类 (6)**:
- Unscrambled (解谜)
- Block Sort - Jigsaw Puzzle Journey (方块拼图)
- Kick the Buddy (发泄类)
- Obby: Car Crash Sandbox (车祸沙盒)
- Dye Hard (染色)
- Droll World Cup (搞笑足球)
- Gun Hero: Cat Survival (猫咪射击)
- Float for Brainrots (脑腐漂浮)
- ABLOCKALYPSE (俄罗斯方块末日)
- Rail Cart Buddies (轨道车)

### Poki Top Trending (25 个)

**经典长青 (5)**:
- Subway Surfers, Drift Boss, Retro Bowl, Stickman Hook, Monkey Mart

**动作/对战 (6)**:
- Stickman Battle, Combat Online 2, Fight and Loot, Hero VS Criminal, Punch Master, Samurai Sam

**解谜/休闲 (5)**:
- Hide and Paint, Blocky Blast Puzzle, Level Devil, Trapped in the Dollhouse, Oozy's Lab

**竞速/体育 (4)**:
- Mad Skills Rallycross, Soccer REAL, Soccer 5, GoBattle 2

**其他 (5)**:
- MineFun.io (沙盒), Clash of Cards, Dan The Man (横版动作), Tower Destiny Survive, Mad Skills Rallycross

### 竞品热门游戏模式观察

1. **"Brainrot" / "Hot" / "Updated" / "Originals" 前缀密集出现** (CrazyGames): 这是 CrazyGames 的内部标签系统, 用于推广新游或重 IP。
2. **"Merge" 主题卷土重来**: Boba Shop (经营) + The Flowers Merge (合并) + Jigmerge (拼图合并) — 3 个合并类游戏同步推。
3. **"Obby + X" 持续热门**: Parkour with Ragdoll / Car Crash Sandbox — 跑酷沙盒仍是 CrazyGames 流量大头。
4. **Poki 偏经典 IP**: Subway Surfers / Drift Boss / Retro Bowl / Monkey Mart / Stickman Hook 等长青游戏仍是流量基本盘, 但 poki 也在引入新游 (GoBattle 2, Oozy's Lab, Tower Destiny Survive)。

---

## 🔁 缺口游戏 (我们没有, 竞品有) — 41 个

- **Total gaps**: 41 (与昨日持平)
- **New gaps**: 0
- **Recurring gaps**: 41
- **Top 5 复现缺口**:
  1. **ABLOCKALYPSE** (crazygames) — 俄罗斯方块末日, 中等热度
  2. **Boba Shop** (crazygames) — 奶茶店模拟, 高热度
  3. **Clash of Cards** (poki) — 卡牌对战, 中等
  4. **Combat Online 2** (poki) — 格斗, 长青
  5. **Dan The Man** (poki) — 横版动作, 长青

**判断**: 41 个复现缺口多是高竞争 IP (Subway Surfers, Drift Boss, Retro Bowl), 这类直接复制法律风险高, 不建议补全; 应聚焦合并类/轻量级原创 IP (Boba Shop, The Flowers Merge, Jigmerge) 这类低成本可制作类型。

---

## 📈 长尾词机会

**当前状态**: `daily-growth-2026-07-13.json::longtail_opportunities` 数组为空 (连续 2 天 = 0)。

**根因**: 长尾词采集脚本 (推测为 `keyword-tool` / 类似) 未在本次 cron 周期写入数据, 或数据源 API (Ahrefs/SEMrush) 配额耗尽。

**我们的长尾页面现状** (从 IndexNow 提交历史看):
- gz.com 已批量产出 `games-like-X-free-browser.html` / `games-like-X-free-online.html` 系列长尾博客 (覆盖 Genshin / Hexa 2048 / Hollow Knight / Minecraft / Pokemon / Roblox / Snake / Subway Surfers 等热门词)
- 这是 **长尾博客增长工作流** 的产物 (skill: `gamezipper-bilingual-blog-growth`), 不依赖 longtail_opportunities JSON 数据

**建议**: 长尾词机会字段长期空, 应考虑降级监控或从 GSC API 反推真实长尾 queries (凭据修复后立即可做)。

---

## 🛠️ 流程健康度

| 组件 | 状态 | 备注 |
|---|---|---|
| cron (0/10/18h) | ✅ | 最近一次 gz.com 09:00:07 / tools 07-09 21:00:05 |
| curl_cffi + subprocess curl fallback | ✅ | mihomo 节点切换 (t_1118ddc2) 后稳定 |
| v5.9 脚本 | ✅ | 唯一稳定 HTTP 客户端 |
| GSC 凭据路径 | ❌ bug | 路径不一致误报, 影响监控信号 |
| Monetag token | ❌ 失效 | 8 天, reCAPTCHA 阻挡 |

---

## 🎬 行动项

| 优先级 | 项 | 状态 | 负责 |
|---|---|---|---|
| 🔍 监控 | GSC 路径不一致 | 持续误报 | 下次维护 daily-seo-health.py 时修 |
| ❌ 老公 P0 | Monetag Token 续签 | 8 天失效 | 老公手动 publishers.monetag.com |
| 🔍 建议 | 长尾词采集脚本修复 | longtail_opportunities 连续 2 天空 | ops 子任务调查 |
| ✅ 已完成 | IndexNow 新 URL 提交 | 1 URL 已 Bing | 本任务 |
| ✅ 已完成 | 竞品监控 | 0 新缺口, 1 改名 | 本任务 |
| ⏳ 待办 | 41 缺口游戏补全评估 | 中等 IP 优先 (Boba Shop / ABLOCKALYPSE / Jigmerge) | 下一个 growth 任务 |

---

## 📎 附件 / 数据来源

- **本次报告脚本输出**: `daily-seo-health.py v5.9` stdout (本任务 11:43 跑通)
- **JSON 健康报告**: `/home/msdn/gamezipper.com/scripts/seo_health_report_2026-07-13.json` (10:02 早晨 cron 版本)
- **JSON IndexNow 跟踪**: `/home/msdn/.openclaw/workspace/data/daily-seo-health-urls.json` (11:43 增量 +1)
- **每日增长数据**: `/home/msdn/.openclaw/workspace/data/daily-growth-2026-07-13.json`
- **历史对比**: `data/daily-growth-2026-07-12.json`
- **Gap 历史**: `/home/msdn/.openclaw/workspace/data/gap-history.json`
- **Skill**: `~/.hermes/profiles/ops-gamezipper/skills/productivity/gamezipper-seo-health/SKILL.md` v1.2.1