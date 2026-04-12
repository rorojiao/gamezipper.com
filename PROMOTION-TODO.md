# GameZipper 增长清单

> 最后更新：2026-04-12 22:55 CST

## 当前快照
- **近7日流量**：PV 1,037 / UV 711
- **今日流量**：PV 1 / UV 1
- **均停留**：28m52s
- **来源**：站内 55 / 127.0.0.1:8899 52 / Reddit 20
- **设备**：desktop 94% / mobile 5%
- **Monetag**：今日 0 展示 / $0.0000；本月 2 展示 / $0.0000；可提现 $0.06
- **博客量**：239 篇 → 默认停止继续铺量，除非发现明确高价值关键词空缺

## 已确认基础项（不要再作为待办）
- [x] Google Search Console 已验证
- [x] Sitemap 已提交
- [x] robots.txt 正常
- [x] 站内 title / description / canonical / schema 基础已齐
- [x] RSS feed 已部署
- [x] IndexNow key 文件已部署

## 2026-04-12 新结论
- **Bing site:gamezipper.com**：curl 抓取搜索结果页，`b_algo=0`，当前仍无可点击实际收录结果
- **Google site:gamezipper.com**：自动请求落到 Google Search JS/enablejs 中间页，今晚未拿到可靠收录数
- **IndexNow 可用 key 已确认**：`gamezipper2026indexnow`
  - `https://www.bing.com/indexnow?...` → **200**
  - `https://api.indexnow.org/indexnow?...` → **200**
- **失效/不应再默认使用的 key**：`gamezipper20260408053438`
  - curl 直验 Bing / api.indexnow.org 均为 **403 UserForbiddedToAccessSite**
- **本轮已提交**：最近 3 天更新的 **198 个 URL** 已重新提交到 Bing + IndexNow API
- **技术 SEO 回归**：公开页面未发现新的 noindex、title HTML 注入、meta `>>`、孤儿 `</script>` 回归

## 当前最高优先级（按顺序）

### 1. 外链 / 分发（最高杠杆）
> 目标：拿到真实外部链接与平台页，触发抓取，而不是继续堆博客。

#### 第一批：强相关、可落地
- [ ] **indiexpo** — https://www.indiexpo.net/en
  - 现状：站内可见 `upload / submit / developers / contact`
  - 动作：提交 2-3 个最强单页游戏（2048、Brick Breaker、Basketball Shoot）
- [ ] **idev.games** — http://idev.games/
  - 现状：站内可见 `submit / upload / publish / developers / join`
  - 动作：先注册开发者档案，再上 2-3 个热门游戏
- [ ] **Players' Depot** — https://playersdepot.com/
  - 现状：首页明确写着 developers 可 submit games
  - 动作：准备开发者介绍 + 3 个 iframe 友好游戏
- [ ] **POGAME** — https://pogame.com/
  - 现状：首页可见 `Sign Up / Sign In / Publishers / Join Us`
  - 动作：注册后提交 2-3 个最容易审核的休闲游戏

#### 第二批：大平台（审核更严，但价值高）
- [ ] **CrazyGames** — https://developers.crazygames.com/
- [ ] **itch.io** — https://itch.io/game/new
- [ ] **Newgrounds** — https://www.newgrounds.com/portal/
- [ ] **Poki** — https://developers.poki.com/

### 2. 社区引爆
- [ ] **Reddit**：继续养号，优先准备 r/webgames / r/IndieGaming / r/puzzles
- [ ] **Show HN**：主推 `embed-games.html` 或 “39 个免下载浏览器游戏合集”
- [ ] **目录页 / 资源页投稿**：只做能带链接的，不做纯表单消耗

### 3. 持续监控
- [ ] 每轮先看 BI / Monetag / Bing site query，再决定是否继续动作
- [ ] 若无新高价值关键词空缺，**不要新增博客**
- [ ] 若 IndexNow 再报 403，先 curl 验证 key 与 endpoint，再判断

## 本轮不再做的低价值动作
- [ ] ❌ 机械性继续写博客
- [ ] ❌ 重复检查已完成的 robots / schema / GSC 验证
- [ ] ❌ 游戏内弹广告 / 全屏弹窗

## 推荐提交素材包（统一复用）
- 站点简介：39+ free browser games, no download, mobile-friendly, fast load
- 首批游戏：2048 / Brick Breaker / Basketball Shoot
- 备用页面：`/embed-games.html`、`/best-free-browser-games-2026.html`
- 截图：首页 + 单游戏页 + 手机端 390px 视图

## 增长判断
- 当前瓶颈仍然是 **外部信号不足**，不是站内内容数量不足。
- 后续增长动作应优先争取：
  1. 平台页
  2. 外链
  3. 社区点击
  4. 再谈自然收录放量
