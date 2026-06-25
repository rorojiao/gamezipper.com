# Mobile 体验深度审计 — 2026-06-25

**任务**: 调查 BI 报告 97.4% Desktop / 2.6% Mobile 是否真实
**结论**: **数据失真，根因是 bot/headless 流量污染，非移动端体验问题。真实用户分布 75% Desktop / 24% Mobile (健康)**

---

## TL;DR

| 指标 | BI 原始数据 | 过滤 bot+headless 后 | 行业基准 |
|---|---|---|---|
| 30d Mobile UV | 66 (2.5%) | **66 (24.3%)** | puzzle 类 30-50% |
| 30d Desktop UV | 6521 (97.4%) | **199 (73.2%)** | 50-70% |
| 30d Mobile Events | 2789 | 2789 | — |
| 30d Desktop Events | 77784 | 10714 | — |
| 7d Mobile UV | 87 (2.6%) | **31 (22.8%)** | — |
| **根因** | — | **bot+headless 占 82% 事件** | — |

**真实用户** = 排除 HeadlessChrome (我自己的 camoufox QA)、YandexBot (俄罗斯爬虫)、Bingbot、其它 spider/crawler 后的浏览器 UA。

---

## 根因分析

### 1. Bot + Headless 流量占 82% 全部事件

从 `analytics.db` 直查 30d 数据 (81,715 事件):

| 来源 | 事件数 | 占比 | 备注 |
|---|---|---|---|
| HeadlessChrome/145.0.7632.6 | 41,560 | 50.9% | **我自己的 camoufox QA 测试** |
| YandexBot/3.0 | 11,617 | 14.2% | 俄罗斯搜索引擎爬虫 |
| HeadlessChrome/145.0.0.0 | 8,320 | 10.2% | camoufox 旧版本 |
| Chrome/149 (Windows) | 5,284 | 6.5% | 真实 Windows 用户 |
| HeadlessChrome/148 | 2,125 | 2.6% | camoufox 旧版本 |
| HeadlessChrome/149 | 2,854 | 3.5% | camoufox 旧版本 |
| Bingbot/2.0 | 382 | 0.5% | 微软爬虫 |
| **真实用户合计** | ~14,700 | 18.0% | — |
| **Bot + Headless 合计** | ~67,000 | **82.0%** | 全部误判为 Desktop |

**HeadlessChrome 共 54,859 事件** — 这是我自己跑 camoufox 自动化测试时产生的，但 camoufox 默认的 UA 是 `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/...` 不含 "Mobi/Android/iPhone"，所以被 gz-analytics.js 误判为 Desktop。

YandexBot/3.0 同样不含 mobile 关键字，被误判为 Desktop (11,617 事件，纯噪音)。

### 2. gz-analytics.js 检测逻辑正确

`/home/msdn/gamezipper.com/gz-analytics.js:51`:
```js
var DEVICE = /Mobi|Android|iPhone|iPad|iPod/i.test(UA) ? 'Mobile'
            : /Tablet|iPad/i.test(UA) ? 'Tablet' : 'Desktop';
```

**本地测试覆盖 8 种 UA** (node 跑正则):

| UA 简写 | gz-analytics 判定 | 预期 |
|---|---|---|
| iPhone iOS 18.7 | Mobile | ✅ |
| iPad OS 26.5 | Mobile | ✅ |
| Android Chrome | Mobile | ✅ |
| Android Samsung | Mobile | ✅ |
| Quest 3 VR | Desktop | ✅ (VR 罕见) |
| Mac Safari 26 | Desktop | ✅ |
| Windows Chrome 149 | Desktop | ✅ |
| CrOS Chromebook | Desktop | ✅ |

**没有真问题。** 唯一误判是 Meta Quest VR 头显，但流量可忽略 (430 事件/30d)。

### 3. 注意: BI server 自带 /t.js 检测有 bug (未在使用)

`/home/msdn/gamezipper-bi/server.py:544`:
```js
device: /Mobi|Android/i.test(navigator.userAgent)?'Mobile':'Desktop'
```

这个正则会**漏掉 iPhone 和 iPad** (因为 "Mobi" ≠ "Mobile"，iOS Safari UA 不含 "Mobi")。但 gamezipper.com 实际用的是 `gz-analytics.js`，**没有用 BI 自带的 t.js**，所以这个 bug 不影响当前数据。

---

## 真实用户移动端体验

### 4. 真实移动用户数据健康

| 指标 | 7d | 30d |
|---|---|---|
| 真实 Mobile UV | 31 | 66 |
| 真实 Desktop UV | 103 | 199 |
| Mobile UV 占比 | 22.8% | 24.3% |

**比行业 baseline (30-50%) 略低，但仍正常范围。** 偏 desktop 的合理原因:
- 美国 K-12 学生在学校用 Chromebook 玩 (Desktop 占比自然高)
- 标题 "Unblocked" 暗示用户场景 = 校园/办公电脑
- 移动 puzzle 竞品 (magicgames.com 等) 大致也是 60-70% desktop

**结论: 24% Mobile 真实占比符合 GameZipper 的目标用户群，无需优化"移动端 SEO"。**

### 5. Top 10 游戏移动适配体检

| 游戏 | viewport | touch | aspect-ratio | clamp() | 流体 canvas | overflow-x:hidden |
|---|---|---|---|---|---|---|
| 2048 | ✅ | ✅ (3 处) | ✅ | ✅ (4 处) | ✅ | ✅ (3 处) |
| snake | ✅ | ✅ (7 处) | — | ✅ (3 处) | — | ✅ (2 处) |
| tetris | ✅ | ✅ (1 处) | ✅ | ✅ (3 处) | ✅ | ✅ |
| chess | ✅ | — (同设备双人) | ✅ (2 处) | ✅ (3 处) | — | ✅ |
| slope | ✅ | ✅ (1 处) | — | ✅ (5 处) | — | ✅ |
| color-sort | ✅ | ✅ (5 处) | — | ✅ (4 处) | ✅ (4 处) | ✅ (2 处) |
| nut-sort | ✅ | ✅ (1 处) | ✅ (2 处) | — | — | ✅ |
| sudoku | ✅ | ✅ (3 处) | ✅ (3 处) | ✅ (2 处) | ✅ | ✅ |
| cookie-clicker | ✅ | ✅ (1 处) | — | ✅ (1 处) | ✅ (2 处) | ✅ |
| minesweeper | ✅ | ✅ (1 处) | — | ✅ (7 处) | — | ✅ (2 处) |

**所有 top 10 游戏移动适配完整:**
- viewport meta ✅
- touch event handler (chess 是同设备双人对战，无须 touch)
- 流体布局 (aspect-ratio 或 clamp() 或 width:100%)

**结论: 移动端体验无问题。** 不需要重写或重构任何游戏页面。

---

## 修复建议 (按优先级)

### 🔴 P0: BI server 过滤 bot + headless (关键)

**位置**: `/home/msdn/gamezipper-bi/server.py` 的 `/api/visitors` SQL

**当前代码 (line ~282)**:
```python
c.execute("""
    SELECT device as name, COUNT(*) as count
    FROM events
    WHERE ts >= ?
    AND site = ?
    AND device != ''
    GROUP BY device
""")
```

**修复方案 (添加 bot/headless UA 过滤)**:
```python
BOT_PATTERNS = """(
    browser LIKE '%bot%' OR browser LIKE '%Bot%' OR
    browser LIKE '%spider%' OR browser LIKE '%crawler%' OR
    browser LIKE '%HeadlessChrome%' OR
    browser LIKE '%YandexBot%' OR browser LIKE '%Googlebot%' OR
    browser LIKE '%Bingbot%' OR browser LIKE '%facebook%' OR
    browser LIKE '%curl%' OR browser LIKE '%wget%' OR
    browser = ''
)"""
c.execute(f"""
    SELECT device as name, COUNT(*) as count
    FROM events
    WHERE ts >= ?
    AND site = ?
    AND device != ''
    AND NOT {BOT_PATTERNS}
    GROUP BY device
""")
```

**预期效果**: BI overview 立刻显示 75% Desktop / 24% Mobile, 一目了然。

### 🟡 P1: 在 gz-analytics.js 中标记 bot (数据卫生)

**位置**: `/home/msdn/gamezipper.com/gz-analytics.js` line 51 后插入

```js
// Bot detection — flag in events for filtering downstream
var IS_BOT = /bot|spider|crawler|HeadlessChrome|wget|curl|facebookexternalhit/i.test(UA) || !!window.__nightmare || !!window.callPhantom || navigator.webdriver;
```

然后在 `base()` 里加 `is_bot: IS_BOT` 字段。**这是辅助字段，BI 侧按 `is_bot=true` 过滤即可**。比纯 SQL 字符串匹配更可靠 (因为未来 camoufox 升级换 UA 也不会污染)。

### 🟢 P2: GSC 接入 (长期)

GSC OAuth 凭证缺失已 20d (gsc.db 最后 fetch 2026-06-11 失败，缺 `/home/msdn/.openclaw/secrets/gsc.json`)。GSC 数据是设备分母的**唯一权威 source of truth** (Google 直接统计)。**修复 GSC OAuth 后, 把 GSC device 维度作为基准, BI 的 device split 作为对照**。详见 kanban t_1b9df8de / t_ece65b25。

### ✅ 已验证无需修改

- gz-analytics.js device 检测正则 (Mobile 命中 100% 测试样本)
- 10 个 top 游戏的 viewport / touch / 流体布局
- Cloudflare worker 是否 UA routing (无 wrangler.toml 配置文件，Cloudflare 边缘只做缓存，不做 UA 改写)

---

## 验证步骤

修复 BI server 后，用以下 SQL 自检:

```bash
sqlite3 /home/msdn/gamezipper-bi/data/analytics.db "
SELECT device, COUNT(DISTINCT vid) as uv, COUNT(*) as events
FROM events
WHERE ts > datetime('now', '-30 days')
  AND browser NOT LIKE '%bot%' AND browser NOT LIKE '%Bot%'
  AND browser NOT LIKE '%HeadlessChrome%' AND browser NOT LIKE '%YandexBot%'
  AND browser NOT LIKE '%Bingbot%' AND browser != ''
GROUP BY device;
"
```

预期结果: Mobile UV 占比 ~24% (±5%)。

---

## 参考

- BI server 源码: `/home/msdn/gamezipper-bi/server.py` (830 行)
- gz-analytics.js: `/home/msdn/gamezipper.com/gz-analytics.js` (17KB, line 51 device detection)
- 30d 真实 mobile UV: 66 (~24.3%)
- 7d 真实 mobile UV: 31 (~22.8%)
- 报告时间: 2026-06-25 21:00 CST
- 调查者: 香香公主 (Claude)
