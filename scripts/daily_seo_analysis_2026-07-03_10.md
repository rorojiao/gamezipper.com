# 🔍 GameZipper 每日SEO+竞品+长尾词分析 — 2026-07-03 (10:35)

> **任务**: kanban t_483d17a4 (🔍 每日SEO+竞品+长尾词分析)
> **范围**: 2026-07-03 10:35 CST 上午分析 cycle
> **脚本**: `daily_seo_analysis.py` v3.0 (Kachilu Browser + 代理)
> **基线对比**: 2026-07-02 (昨天) → **2026-07-03 (本次)**
> **状态**: ✅ SEO 9/9 健康 | 📊 竞品 12/25 静态 | 📈 缺口 27 (-1) | 🔑 长尾 0 candidates

---

## 🎯 60s Executive Summary

1. **SEO 9/9 健康** (今早 10:00 cycle 已跑, 见 `daily_seo_2026-07-03_10.md`):
   - gz.com 852 URLs (+7 vs 昨晚 845)
   - **tools 3353 URLs (+204, 14h 内 +6.5%)** 🔥 批量新增, 需关注
   - IndexNow 0 new submit (tracked 已对齐)
2. **竞品完全静态** — CrazyGames 12 / Poki 25 (vs 7-02 持平), **0 新发现**
3. **缺口 27** (vs 7-02 27 → -1), 持续缺口 +1 反复出现 = **完全饱和**
4. **长尾词 0 candidates** — MiniMax Search 本轮静默, 与昨日一致, 长尾挖掘枯竭
5. **BI 7d PV 2,402 / UV 1,527** (vs 7-02 2158/1404, +11%/+9%)
6. **P0 阻塞持续**: GSC OAuth 30d (2026-06-04~) / Monetag Token 22d (2026-06-11~)
7. **Top3 游戏稳定**: Tetris 96 / 2048 51 / Sudoku 50 — 经典游戏长期霸榜

---

## 📊 SEO 健康检查 (10:00 cycle 摘要)

| 指标 | 07-02 20:02 | **07-03 10:00** | Δ |
|------|-------------|-----------------|---|
| 端点健康 | 9/9 ✅ | **9/9** ✅ | 持平 |
| gz.com sitemap | 845 | **852** | +7 (新内容) |
| tools sitemap | 3149 | **3353** | **+204 🔥** |
| gz.com tracked | 847 | 854 | +7 |
| tools tracked | 3351 | 3355 | +4 |
| IndexNow 本轮 | 1 | **0** (对齐) | skip |
| lastmod coverage | 100% | 100% | 持平 |

**🔥 异常信号**: tools 14h 内 +204 URL (3149→3353) — 6.5% 增长, 但 tracked 只 +4, **200 条 URL 未走 IndexNow 路径**, 可能是 build bot 批量上线但没注册 sitemap 完整集。建议排查 tools 站 build 流程。

**完整 9 端点表**: 见 `daily_seo_2026-07-03_10.md`

---

## 🎮 竞品监控 (CG + Poki)

### 当前状态 (2026-07-03 10:35)

| 竞品 | /new 页游戏数 | vs 昨日 | 趋势 |
|------|---------------|---------|------|
| CrazyGames /t/new | 12 | 12 | **静态** |
| Poki /en/new | 25 | 25 | **静态** |

### 竞品静态判定
- **连续 2 天 (7-02 + 7-03) 竞品 /new 页完全无变化** — Kachilu Browser 抓取返回 identical 12/25
- 含义: 周末效应 (周末竞品也不爱上新) + 我们没漏抓

### Top5 反复出现缺口 (历史 ≥2 天)

| 缺口 | 来源 | 状态 |
|------|------|------|
| **8 Ball Billiards Classic** | CG | 持续 7+ 天, 我们已有 8-ball 类但不同实现 |
| **Battle Blast** | Poki | 持续 5+ 天 |
| **Bloxd.io** | CG | 持续 3+ 天 (UpdatedBloxd) |
| **Brain Test 5** | Poki | 持续 3+ 天 |
| **Car Circle** | Poki | 持续 3+ 天 |

---

## 📈 缺口分析

### 趋势 (vs 历史)

| 日期 | 总缺口 | 新发现 | 反复 | 备注 |
|------|--------|--------|------|------|
| 07-01 | 26 | 0 | 26 | 周末静态 |
| 07-02 | 27 | 0 | 27 | +1 (UpdatedBloxd.io 标签变) |
| **07-03** | **27** | **0** | **27** | 完全饱和 |

**核心发现**:
- ❌ **0 新发现** = 周末+连续静态, 我们的 532 游戏已覆盖竞品 /new 大部分
- ❌ **27 个反复缺口** 持续 ≥3 天, 说明这些**不是简单的 "竞品刚上"**, 而是**竞品长线榜单**
- 反复缺口分布: 物理格斗 (Punch Master, Battle Blast, Stickman Battle, Hero VS Criminal) + 益智 (Brain Test 5, Numbers Match 2448) + 模拟 (Home Builder Clicker, Car Circle) + io (Bloxd.io, Veck.io)

### Top 反复缺口是否值得做 (P0/P1 评估)

| 游戏 | ROI 评估 | 理由 |
|------|----------|------|
| **8 Ball Billiards Classic** | **P1** ⭐ | CG long-tail, 物理类已成熟 (我们 8-ball 类有), 增量需求中等 |
| **Punch Master** | **P1** ⭐ | Poki 物理格斗类, 简单可做, 上周已标记 (t_4684fd68) |
| **Battle Blast** | **P2** | Poki 格斗类, 风格重复 |
| **Brain Test 5** | **P2** | 益智类需剧情/关卡设计, 工作量大 |
| **Car Circle** | **P2** | 驾驶类需 3D, 中等工作量 |
| **Veck.io** / **Bloxd.io** | **P3** | io 类需要服务器, 不适合纯静态站 |

**结论**: 反复缺口 P1 候选 = **8 Ball Billiards Classic + Punch Master**, 其余 P2/P3 暂缓

---

## 🔑 长尾词分析

### 状态

| 日期 | candidates | 备注 |
|------|-----------|------|
| 07-01 | 0 | MiniMax Search 静默 |
| 07-02 | 0 | 同上 |
| **07-03** | **0** | 同上 |

**核心问题**: MiniMax Search API 在长尾词发现阶段持续 0 candidates, 与昨日一致
- 可能原因: API key 限流 / 搜索引擎本身无可推荐 / 脚本 seeds 池子耗尽
- **影响**: 长尾挖掘**完全停滞**, 无法产生新内容方向

### 替代方案 (建议)
- 改用 **Google Suggest + Ubersuggest 免费层** 做手工补种
- 用 **GA4 Search Terms** (需老公开 GSC OAuth) 拉真长尾 query → 已有页面拓展
- 复用 **bi-report.py 的 top pages** 反推长尾 (Tetris/2048/Sudoku 是 seed, 但 variant 长尾未挖)

---

## 📊 BI 流量对比 (10:35 vs 昨日 20:02)

| 指标 | 07-02 20:02 | **07-03 10:35** | Δ |
|------|-------------|-----------------|---|
| 7d PV | 2158 | **2402** | +244 (+11%) 📈 |
| 7d UV | 1404 | **1527** | +123 (+9%) 📈 |
| today PV | 351 | **244** | 还在累计中 |
| today UV | 258 | **106** | 还在累计中 |
| 实时在线 | 1 | **0** | 上午低谷 |
| bounce rate | 78.0% | **79.9%** | +1.9pp ⚠️ |
| 设备 (7d) | D92/M3 | D92/M7 | +4pp mobile |

### Top pages (7d)

| 路径 | 7d PV | 备注 |
|------|-------|------|
| /tetris/ | **96** | 🆕 Top1 (从 #3 升) |
| /2048/ | 51 | 老牌 #1 → #2 |
| /sudoku/ | 50 | 持平 |

**Top3 总 PV 197** = 占 7d 2402 的 8.2%, 头部集中度高。

### 来源 (7d top)

| 来源 | 次数 |
|------|------|
| gamezipper.com/ (内链) | 87 (+23) |
| ion.xo.je/ | **79** 🆕 (+79 突然出现) |
| www.bing.com/ | 11 (+3) |
| gamezipper.com/wood-block-puzzle/ | (来自昨日) |

**⚠️ ion.xo.je 突然出现 79 次** — 新外部来源, 需查 (可能是镜像/embed/广告)
- 建议: `whois ion.xo.je` + 看 referrer page
- 风险: 如果是 scraper mirror, 需 dmca

---

## 🔍 GSC + Monetag 阻塞 (P0 持续)

### GSC OAuth — 30d 阻塞
- 错误: `missing gsc.json; missing gsc-sa.json`
- 影响: 无 organic query 数据 → 无法针对性做长尾内容
- 修复: 老公 5min 手动 OAuth (Option A) 或 Service Account (Option B 推荐)

### Monetag Token — 22d 阻塞
- 错误: `{"errors":["Token does not exist."]} HTTP 401`
- 影响: BI 报告广告收益一直是 0 占位
- 修复: 老公登录 publishers.monetag.com 重取 token (reCAPTCHA)

---

## 🎬 行动项

### ✅ 已完成 (本轮)
- 跑完 `daily_seo_analysis.py` v3.0
- 生成 `daily-growth-2026-07-03.json`
- SEO 9/9 健康确认 (10:00 cycle)
- 缺口 27 个反复 / 0 个新发现
- 长尾 0 candidates (API 静默)

### ⏳ 等待 / 持续
- 周末持续观察竞品 (周一可能上新)
- tools 站 +204 URL 排查 build 流程
- ion.xo.je 来源追溯

### ❌ 老公 P0 (已发多次, 等手动)
1. **GSC OAuth 5min 设置** (30d 阻塞, 是长尾词挖掘的命脉)
2. **Monetag Token 重新取** (22d 阻塞, 收入监控黑盒)

### 🔍 建议 (本香香公主可做)
1. ✅ 已记录 **Punch Master + 8 Ball Billiards Classic** 为 P1 候选 (反复 ≥3 天)
2. 🔍 **排查 ion.xo.je 79 hits** — 派子代理 1h 内查 whois + referrer page
3. 🔍 **tools 站 +204 URL 异常增长** — 派子代理查 build 脚本是否在批量生成
4. 🔍 **长尾挖掘改用 Ubersuggest 免费层** — 派子代理小脚本跑一下

---

## 🔗 相关产物

- **JSON 数据**: `/home/msdn/.openclaw/workspace/data/daily-growth-2026-07-03.json`
- **SEO 健康 (10:00 cycle)**: `/home/msdn/gamezipper.com/scripts/daily_seo_2026-07-03_10.md`
- **BI 报告 (10:35)**: bi-report.py 本轮输出 (见 chat log)
- **历史对比**: `daily_seo_analysis_2026-07-02.md`, `daily_seo_analysis_2026-07-01.md`

---

_Generated by 香香公主 @ 2026-07-03 10:35 CST · ops-gamezipper profile_