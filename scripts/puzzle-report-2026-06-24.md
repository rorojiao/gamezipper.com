# 🧩 IAA Puzzle 市场日报 — 2026-06-24 (周三)

> 📅 数据时间：2026-06-24 12:04 (UTC+8)
> 📊 数据规模：**100 免费 + 96 付费 + 100 畅销 + 106 新游 = 402 款**（iTunes legacy RSS US, genre=7012 纯 Puzzle）
> 🔬 对比基准：2026-06-23（周二）早报 → 当前连续第 11 天 RSS 兜底模式
> 📌 飞书群：IAA 群 / Webhook: 48986480-e9f4-48f1-9c58-6d2c7b556567
> ⚠️ 备注：本报告由 cron agent 直接渲染（gen_report.py 的 yesterday 字典为 06-22 基线，已过期，未运行以免产出误导性「10 天持平」归档）

---

## 📊 今日采集

| 平台 | 榜单 | 数量 | 状态 |
|------|------|------|------|
| App Store | 免费榜 (genre=7012) | **100 款** | ✅ itunes.apple.com RSS 实时拉取 |
| App Store | 付费榜 (genre=7012) | **96 款**  | ✅ itunes.apple.com RSS 实时拉取 |
| App Store | 畅销榜 (genre=7012) | **100 款** | ✅ itunes.apple.com RSS 实时拉取 |
| App Store | 新游榜 (genre=7012) | **106 款** | ✅ itunes.apple.com RSS 实时拉取 |
| Google Play | — | 0 款 | ❌ Kachilu 依赖缺失 |

**合计 402 款**（纯 App Store，iOS 100% / Android 0%）

---

## 🏆 TOP 5 推荐（免费榜，纯 Puzzle）

| # | 游戏 | 开发商 | 价格 | 趋势 |
|---|------|--------|------|------|
| 1 | **Meowdoku!** | Oakever Games | Get | 持平 |
| 2 | **Block Out! - Color Sort Puzzle** | Grand Games A.Ş. | Get | 持平 |
| 3 | **Magic Sort!** | Grand Games A.Ş. | Get | 持平 |
| 4 | **Arrows – Puzzle Escape** | Lessmore GmbH | Get | 持平 |
| 5 | 🆕 **Bus Traffic Fever!** | GOODROID,Inc. | Get | ↑新进（首入 TOP5）|

**TOP 5 核心信号**：
- 🎯 **Meowdoku! 连续 6 天 #1**：35 天龄周三再守位
- 💥 **10 天超稳态打破**：Block Blast!（Hungry Studio，1542 天经典）自 06-14 起稳坐 #5 共 10 天，今日**首次跌出 TOP 5**，被 Bus Traffic Fever! 取代。这是 30 天内免费榜 TOP 5 首次成员变动。
- 🚌 **Bus Traffic Fever! 双榜信号**：同时进入免费榜 #5 + 畅销榜 #97，下载与营收双驱动 = 真实趋势，非刷榜。
- 🏆 **Grand Games 双款稳 TOP 3**（Block Out! #2 + Magic Sort! #3）= Color Sort 品类统治延续

### TOP 5 付费榜
| # | 游戏 | 开发商 | 价格 |
|---|------|--------|------|
| 1 | **Red's First Flight** | Rovio Entertainment Oyj | $0.99 |
| 2 | **Nubby's Number Factory** | MogDogBlog Productions | $4.99 |
| 3 | **Where's My Water?** | Disney | $1.99 |
| 4 | **Zyl** | Fleon Labs | $1.99 |
| 5 | **Monument Valley** | ustwo games | $3.99 |

### TOP 5 畅销榜
| # | 游戏 | 开发商 |
|---|------|--------|
| 1 | **Royal Match** | Dream Games |
| 2 | **Candy Crush Saga** | King |
| 3 | **Gossip Harbor®: Merge & Story** | Microfun |
| 4 | **Royal Kingdom** | Dream Games |
| 5 | **Township** | Playrix |

---

## 📈 与昨日（2026-06-23 周二）对比

| 变化类型 | 游戏 | 详情 |
|----------|------|------|
| 🆕 新进 TOP5 | **Bus Traffic Fever!** | GOODROID 日本厂，103 天龄（2026-03-13 上线），交通调度解谜，首入免费 TOP5 |
| 🔻 跌出 TOP5 | **Block Blast！** | Hungry Studio 1542 天经典，连坐 #5 共 10 天后让位 |

**关键洞察**：免费榜 TOP 5 自 06-14 起连续 10 天「同款同位置」的超稳态平台期**终于结束**。Block Blast!（俄罗斯方块变体，老牌霸主）让位于 Bus Traffic Fever!（交通调度新品类）——可能预示玩家从「单方块消除」向「场景化调度解谜」的口味迁移。

---

## 💡 适合 gamezipper.com 开发的游戏建议

### 🎯 首选：交通调度/堵车逃脱解谜（仿 Bus Traffic Fever!）

**为什么**：
- 微品类正在升温：免费榜 TOP100 内至少 4 款同品类（Bus Traffic Fever #5、Wool Crush-Escape Traffic Jam #29、Bubble Bus Parking Jam #72、Color Block Jam），且 #5 是今日最大黑马
- 机制简单：拖拽车辆疏通路口/停车场，天然适配触屏
- 关卡递增空间大：车辆数量、路口复杂度、车型（小车/卡车/消防车）可无限扩展
- 重玩率高 = 广告位天然契合 IAA 变现
- gamezipper 现有 40+ 游戏中**无交通调度品类**，存在品类空白

**开发要点**：单文件 HTML + Canvas；20-30 关递增难度；3 星评分 + 步数计数；localStorage 存档；程序化音效。

### 🥈 次选：Color Sort 衍生（守住 Grand Games 品类红利）
Block Out! + Magic Sort! 双款稳 TOP 3 已 11 天，Color Sort 品类仍有流量红利。可做差异化变体（如「形状分拣」「双层分拣」）。

---

## ⚠️ 系统状态

- ❌ **gamezipper-bi/ 核心脚本仍缺失**（puzzle_collector.py / puzzle_report.py 自 06-04 起）；当前依赖 kanban workspace `t_2aa6e4ba` 的 RSS 兜底管线
- ❌ **Google Play 数据仍为 0**（Kachilu Browser 依赖未恢复）
- ✅ App Store 4 榜实时拉取正常（402 款）

---

**采集时间**：2026-06-24 12:04 (UTC+8)
**下期报告**：2026-06-25 (周四) 自动生成
