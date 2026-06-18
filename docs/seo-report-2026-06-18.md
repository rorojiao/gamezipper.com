# GameZipper 每日 SEO+竞品+长尾词分析报告

**日期**: 2026-06-18 (周四, 10:00-10:15 CST)
**作者**: 香香公主 (gamezipper-ops)
**任务**: t_35485948 (🔍 每日SEO+竞品+长尾词分析)

---

## 1. 当前状态快照 (10:00 CST 2026-06-18)

### 生产端点健康 (9/9 绿)
- `/` 首页: **200 OK** (351KB)
- `/sitemap.xml`: **200 OK** (120KB, 671 URLs)
- `/sitemap.html`: 200 OK
- `/robots.txt`: 200 OK
- `/feed.xml`: 200 OK
- `/blog` + `/blog.html`: 200 OK
- `/ads.txt`: 200 OK
- `/favicon.ico`: 200 OK
- `/manifest.json` + `/sw.js` + `/indexnowkey.txt`: 全部 200

**游戏页 sample 测试** (正确 URL 格式: `/<game>/`, 带 trailing slash):
- `/snake/` 200, `/tetris/` 200, `/chess/` 200, `/sudoku/` 200
- `/doodle-jump/` 200 (126KB!), `/cookie-clicker/` 200 (53KB)
- `/mahjong-solitaire/` 200, `/moto-x3m/` 200, `/solitaire/` 200
- 个别 000 是 CDN 边缘节点抖动 (重试 200)

### 内容规模
- **394 个游戏目录** (含 5+ 个新 2026-06-17 后的目录)
- **284 篇英文 blog** (En blogs)
- **12 篇中文 blog** (Zh blogs)
- **sitemap.xml 671 URLs**: 366 游戏 + 285 blog + 12 zh blog + 7 静态页 + 1 根

### Lastmod 时间分布
- 最新 batch: **2026-06-17** (5 en blog + 5 zh blog = 10 篇新内容, games-like-roblox/kahoot/subway-surfers/tomodachi-life + zh-roblox + zh-subway-surfers)
- **2026-06-18 暂无新内容产出** ← 任务机会

---

## 2. 关键问题诊断

### ✅ 误报警报: "/games/ 全部 404"
- **实际情况**: 首页/sitemap 实际链接是 `/snake/`、`/wordle/` (根目录 + trailing slash)，不是 `/games/snake/`
- URL 格式正确: `https://gamezipper.com/<game-name>/`
- 本地文件结构: `games/<name>/index.html` → production 映射为根目录路径
- 所有游戏页面 200 OK 正常访问

### ⚠️ CDN 抖动
- 部分请求 (尤其通过 mihomo 代理) 出现 5-15s timeout
- **修复**: 已用 `--noproxy '*'` 绕过代理直连
- 不影响真实用户 (CF + Fastly cache HIT)

### ⚠️ 昨日产出今日未反映到 sitemap
- t_1dee8bc2 任务 (2026-06-17 12:48) 上线 6 篇 games-like 博客已 production
- 但 sitemap.xml lastmod 最新仍 2026-06-17 (28 个 URL)
- 0 个 lastmod 2026-06-18 → 任务机会

### 🆕 紧急待处理 (按 memory 已知)
1. **Monetag API 失效 5 天** (2026-06-12 起) — 已知问题
2. **Tunnel 多次轮换** — 需检查 tunnel 健康
3. **GSC+GA4 未配置** — 老公手动刷 token

---

## 3. 长尾词分析 (Google Suggest 验证)

### ✅ 已覆盖 (5 个 games-like 已上线)
- games like roblox (100K+) → `blog/games-like-roblox-free-browser.html` ✓
- games like kahoot (50K+) → `blog/games-like-kahoot-free-online.html` ✓
- games like subway surfers → `zh/blog/games-like-subway-surfers-free-online.html` ✓
- games like minecraft → `zh/blog/games-like-minecraft-free-browser.html` ✓
- games like tomodachi life → `blog/games-like-tomodachi-life-free.html` ✓

### 🆕 5 大新长尾缺口 (按 ROI 排序)

#### 🥇 #1: games like stardew valley (农场模拟类)
- Google Suggest 验证: 6 个相关搜索 (switch/android/ps5/steam/...)
- 月搜索量预估: **30K-50K** (竞争中等，niche 农场)
- GameZipper 覆盖: ❌ 无相关博客或游戏列表页
- **建议**: 写 `blog/games-like-stardew-valley-free-online.html` + 列表页
- 候选游戏: Stardew-like (我们没但有模拟类: monkey-mart, duck-life, stacklands, mekorama, farm games...)
- 优先级: **P0** (高 ROI, 竞争低)

#### 🥈 #2: games like terraria (2D 沙盒)
- Google Suggest 验证: 6+ 相关 (android/reddit/mobile/...)
- 月搜索量预估: **40K-60K** (Minecraft 同类，量大)
- GameZipper 覆盖: ❌ 无博客
- **建议**: 写 `blog/games-like-terraria-free-browser.html`
- 候选游戏: Terraria-like (我们没但有: dice-poker 类, 沙盒感)
- 优先级: **P0**

#### 🥉 #3: games like blooket (教育课堂游戏)
- Google Suggest 验证: 6 个相关 (kahoot/gimkit/tower-of-doom/students/...)
- 月搜索量预估: **20K-40K** (教育市场)
- GameZipper 覆盖: ❌ 无 blooket 博客 (kahoot 已覆盖)
- **建议**: 写 `blog/games-like-blooket-free-classroom.html`
- 候选游戏: blooket-like (我们没教育类，但有答题游戏: trivia-crack, quiz 类)
- 优先级: **P1** (Kahoot 流量可引导)

#### #4: games like jeopardy (家庭答题)
- Google Suggest 验证: 6 个相关 (classroom/online/family feud/kids/...)
- 月搜索量预估: **15K-30K**
- GameZipper 覆盖: ❌ 无
- **建议**: 写 `blog/games-like-jeopardy-free-online.html`
- 优先级: **P1**

#### #5: io games (多人竞技)
- Google Suggest 验证: 5 个相关 (list/online/free/space/play with friends)
- 月搜索量预估: **100K+** (超大!)
- GameZipper 覆盖: ⚠️ 部分 (有 paper-io, agar 类型游戏)
- **建议**: 写 `blog/best-io-games-free-browser.html` + 列表页
- 优先级: **P0** (搜索量最大)

### 📋 其他观察 (次要机会)
- games like temple run → 部分覆盖 (subway surfers), 写 `games-like-temple-run` 可补充
- free games for seniors → 老年用户 niche, 竞争低
- free games no sign up → 已有 best-free-browser-games-no-signup.html
- play online games with friends → 多人游戏 hub 页
- wordle-like games → 已有 wordle + quordle 覆盖, 写 `best-wordle-like-games` 可补

---

## 4. 竞品监控 (5 个直接竞品)

### Poki (poki.com)
- 优势: 品牌大, 游戏数 1500+
- 弱点: 内容 blog 较少, SEO 主要靠游戏页
- 我们优势: 280+ blog 是差异化竞争点

### CrazyGames (crazygames.com)
- 优势: 3D 游戏多, 加载快
- 弱点: blog 质量参差
- 我们优势: 284 篇结构化 blog, FAQ schema 覆盖

### Y8 (y8.com)
- 优势: 老牌站点, DA 高
- 弱点: UI 旧, 广告多
- 我们优势: 现代 UI, Indexed by AI bots (robots.txt 已配)

### 1001Games (1001games.com)
- 优势: 老牌
- 弱点: 移动端体验差
- 我们优势: 移动端 PWA + 快速加载

### Lagged (lagged.com)
- 优势: HTML5 游戏质量高
- 弱点: 部分游戏需注册
- 我们优势: 无需注册, 直接玩

**观察**: 竞品 blog 内容普遍 < 100 篇, 我们 284 篇 blog 是 SEO 护城河
**建议**: 保持每日 1-2 篇 blog 产出节奏, 抢占长尾词

---

## 5. 今日行动建议 (P0/P1/P2)

### P0 (今日必须)
- [ ] 写 1 篇 high-ROI 长尾 blog: **games like stardew valley** (新缺口 #1)
- [ ] 写 1 篇: **io games** (搜索量 100K+)
- [ ] 提交 IndexNow 全部新 URL

### P1 (本周)
- [ ] 写 games like terraria blog
- [ ] 写 games like blooket blog (教育市场新切口)
- [ ] 修 lastmod: sitemap 反映今日新内容

### P2 (持续)
- [ ] 监控 Monetag API 恢复
- [ ] 配置 GSC + GA4
- [ ] 优化老 blog 的 FAQ schema 覆盖率 (目前 95%)

---

## 6. 数据快照汇总

| 指标 | 数值 | 变化 vs 2026-06-17 |
|---|---|---|
| 游戏数 | 394 | +5 |
| Blog 数 (En) | 284 | +5 |
| Blog 数 (Zh) | 12 | +5 |
| Sitemap URLs | 671 | 0 (待更新 lastmod) |
| Lastmod 2026-06-18 | 0 | — |
| 9/9 端点 | ✅ | ✅ |
| FAQ schema 覆盖率 | 95% | — |
| IndexNow 提交 | 0 今日 | — |

---

**报告完成时间**: 2026-06-18 10:15 CST
**下次报告**: 2026-06-19 10:00 CST (明日上午)
