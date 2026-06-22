# 🧩 Puzzle 推荐日报 · 2026-06-22 (周一) 午间刷新

> 📅 数据时间：2026-06-22 12:05 (UTC+8)
> 📊 数据规模：**100 免费 + 50 付费 = 150 款**（iTunes legacy RSS US, genre=7012 纯 Puzzle）
> 🔄 RSS 更新：2026-06-21T21:05:57-07:00（即北京时间 12:05 刚刷新）
> ⚠️ 核心脚本 puzzle_collector.py / puzzle_report.py 缺失第 18 天，RSS 兜底模式

---

## 📊 今日采集

| 平台 | 榜单 | 数量 | 状态 |
|------|------|------|------|
| App Store | 免费榜 (genre=7012) | **100 款** | ✅ iTunes RSS 实时拉取 |
| App Store | 付费榜 (genre=7012) | **50 款**  | ✅ iTunes RSS 实时拉取 |
| Google Play | — | 0 款 | ❌ Kachilu 依赖缺失 |

**合计 150 款**（纯 App Store，iOS 100% / Android 0%）

---

## 🏆 TOP 5 推荐（免费榜，纯 Puzzle）

| # | 游戏 | 开发商 | 上线 | 趋势 |
|---|------|--------|------|------|
| 1 | **Meowdoku!** | Oakever Games | 2026-05-19 | 持平（连续守 #1）|
| 2 | **Block Out! - Color Sort Puzzle** | Grand Games A.Ş. | 2025-10-31 | 持平 |
| 3 | **Magic Sort!** | Grand Games A.Ş. | 2024-05-28 | 持平 |
| 4 | **Block Blast！** | Hungry Studio | 2022-04-03 | **↑#5→#4**（回升）|
| 5 | **Arrows – Puzzle Escape** | Lessmore GmbH | 2025-08-09 | **↓#4→#5** |

**核心信号**：
- 🎯 **TOP 5 同款第 10 天**：Meowdoku!/Block Out!/Magic Sort!/Block Blast!/Arrows 五款连续 10 天霸榜，超稳态延续
- 🔄 **午间刷新捕获真实位次变化**：Block Blast! 与 Arrows 互换 4/5 位（早报 09:03 尚为旧 RSS，午间 12:05 RSS 刚更新）
- 🏆 **Grand Games 双款稳 TOP 3**（Block Out! #2 + Magic Sort! #3）= Color Sort 品类统治

### TOP 5 付费榜

| # | 游戏 | 开发商 | 价格 | 趋势 |
|---|------|--------|------|------|
| 1 | **Red's First Flight** | Rovio | $0.99 | 持平 ⚠️ 跨类目 |
| 2 | **Nubby's Number Factory** | MogDogBlog | $4.99 | 持平 |
| 3 | **Where's My Water?** | Disney | $1.99 | 持平 ⚠️ 跨类目 |
| 4 | **Zyl** | Fleon Labs | $1.99 | 守 #4（4 天龄极简路径，续升）|
| 5 | **Purple Place - Classic Games** | Semyon Popov | ? | 新进 TOP 5 |

---

## 📈 与昨日对比

- 🆕 **新上榜**：无（免费 TOP 5 同款第 10 天）
- 🆙 **排名上升**：Block Blast! ↑#5→#4（午间 RSS 刚更新捕获）
- 🔻 **排名下降**：Arrows ↓#4→#5
- 💰 **付费榜亮点**：Zyl（4 天龄极简路径追踪）守 #4 续升；Purple Place（7 年老游戏）新进 TOP 5

---

## 💡 适合 gamezipper.com 开发的游戏建议

### 🥇 首选：Block Blast!（经典方块消除）
- **理由**：TOP 5 中唯一**回升**趋势款，排名 ↑#5→#4 说明热度回归；经典 8×8 方块放置消除机制，规则简单、受众极广、HTML5 Canvas 易实现；gamezipper 现有 40+ 游戏中缺爆款级 block puzzle，填补品类空白。
- **开发要点**：单文件 HTML、触屏拖拽放置、3 种方块随机生成、消除行/列、分数+连击系统、localStorage 排行。

### 🥈 次选：Zyl（极简路径追踪）
- **理由**：付费榜 4 天龄新游持续爬升，**机制新颖**（一笔画路径追踪 + 极简美术）；做免费 HTML5 版可抢滩免费市场；开发成本低、风格清新适合休闲定位。
- **开发要点**：单文件 HTML、路径绘制 + 碰撞检测、关卡递进、极简几何美术、Web Audio 音效。

---

## ⚠️ 运维提示
- `gamezipper-bi/` 核心脚本 `puzzle_collector.py` / `puzzle_report.py` 缺失第 18 天（自 2026-06-04），建议尽快从 CapRover tarball 或 git 恢复，以重启 Google Play 采集 + 30 天去重 + 跨平台评分。
- 本报告由 iTunes legacy RSS（genre=7012）兜底生成。
