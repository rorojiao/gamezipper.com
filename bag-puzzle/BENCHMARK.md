# Bag / Corral 谜题 - 竞品基准研究 (BENCHMARK)

> 调研日期: 2026 年 6 月 11 日
> 目的: 为 HTML5 浏览器版 Bag/Corral Nikoli 逻辑谜题产品进行竞品分析
> 目标受众: 西方 + 东亚逻辑谜题玩家
> 撰写人: GameZipper 谜题产品研究组

---

## 目录 (Table of Contents)

1. [谜题定义与规则 (Puzzle Definition)](#谜题定义与规则-puzzle-definition)
2. [市场总览 (Market Overview)](#市场总览-market-overview)
3. [顶级竞品详细分析 (Top Competitors)](#顶级竞品详细分析-top-competitors)
4. [其它值得关注的竞品 (Other Notable Competitors)](#其它值得关注的竞品-other-notable-competitors)
5. [功能对比矩阵 (Feature Comparison Matrix)](#功能对比矩阵-feature-comparison-matrix)
6. [关键洞察与机会 (Key Takeaways & Opportunities)](#关键洞察与机会-key-takeaways--opportunities)
7. [基准数据表 (Benchmark Numbers)](#基准数据表-benchmark-numbers)

---

## 谜题定义与规则 (Puzzle Definition)

### 基本信息

| 字段 | 内容 |
|------|------|
| 日文名 | バッグ (Baggu) |
| 英文别名 | Bag, Corral, Cave |
| 类型 | 二元判定逻辑谜题 (Binary-determination logic puzzle) |
| 起源 | 日本 Nikoli 出版社, 首次刊载于《Puzzle Communication Nikoli》第 58-60 期 (1996 前后) |
| 发明者 | ゲサク (Gesaku) — 日文原意为"戏作" |
| 计算复杂度 | NP-complete (Erich Friedman, 2002 证明) |
| 解法相似度 | 与 Kurodoko/Kuromasu 高度相似, 主要差异在于"环"作为解的一部分, 而 Kuromasu 是"染色" |

### 核心规则 (来自 Wikipedia 与 pzprjs 规则定义)

1. **绘制单条连续环**: 在网格的格线 (dotted lines) 上, 沿水平和垂直方向画线, 形成一个**单一、闭合、连续**的环 (Single continuous closed loop)。
2. **环必须包含所有数字**: 所有标注数字的格子必须位于环的**内部** (inside the loop)。
3. **数字的含义**: 数字 N 表示 — 从该数字所在格出发, 沿上下左右四个方向**直线延伸**, 视线所及的所有格子 (含自身) 数量总和等于 N. 视线会被**环** (环线本身) 或网格边界阻挡。
4. **环外格子不计**: 环外的格子不参与数字可见性的计数。
5. **唯一解**: 合格谜题必须存在且只存在一个解。

### 关键变体 (Variants)

| 变体 | 说明 |
|------|------|
| **Cave (现代常用名)** | 等价规则, 但通常以"染色"形式呈现 — 黑格构成"洞外", 白格构成"洞内"。puzz.link / pzprjs 即用此呈现。 |
| **Product Cave (积)** | 水平可见数 × 垂直可见数 = 谜面数字 |
| **Canal View (运河景)** | 数字在外面, 计数洞内被遮挡的格子 |
| **Line of Sight (视线, pzprjs 内另名)** | 数字附带方向箭头, 表明"第一个见到的线段长度" (与 Bag 不同) |
| **Kuromasu (黑哪里)** | 极相似但用染色, 黑色格彼此不相邻 |

### 与其他 Nikoli 谜题的辨识

- **vs Slitherlink (数回/围回)**: Slitherlink 数字在格子上, 范围 0-3, 含义是"该格四边有几条是环的一部分"。Bag 数字也在格子上但表示"视线长度", 可大于 3, 通常是 2 ~ 网格尺寸之和。
- **vs Masyu (真珠/魔手)**: Masyu 没有数字, 用黑白圆圈和直线提示。
- **vs Yajilin (天龙/夜路)**: Yajilin 用箭头方向。

---

## 市场总览 (Market Overview)

Bag / Corral / Cave 是 Nikoli 家族中的**中等知名度谜题**: 在日本和欧美解谜圈有忠实受众, 但**远不及** Sudoku、Slitherlink、Akari、Nurikabe 那样的家喻户晓。其市场呈现**高度碎片化、几乎无强势玩家**的状态, 是非常适合**新进入者**填补空白的蓝海品类。

### 关键市场事实

1. **Nikoli 官方主页未列出 Bag**: 在 Nikoli 官网 (nikoli.co.jp/en/puzzles/) 列出的 46 种主要谜题中, **Bag/Corral/Cave 已不在当前主页**。这表明该谜题虽然起源于 Nikoli 杂志, 但**目前不是 Nikoli 推广的核心品类**。
2. **pzprjs / puzz.link 以 "cave" 之名收录**: pzprjs (puzzle-js 引擎, 维护者 robx, GitHub 87 stars, MIT 协议) 将其命名为 `cave`, 附有完整日英文规则、示例、错误检查器。
3. **移动端几乎无独立 App**: 在 iOS App Store 和 Google Play 搜索 "Bag puzzle / Corral / Cave logic puzzle", **只有 1 个 iOS 独立 App** (jp.twocats.Bag, Yuki Fujimoto 开发, 仅 3 条评分, 2017 年 1 月发布后无更新)。这是巨大的市场空白。
4. **概念巨头 Conceptis 没有 Bag 独立 App**: Conceptis (业界最知名的逻辑谜题商业公司, 每天全球 2000 万+ 用户解其谜题) 推出了 Slitherlink (评分 4.82, 453 评分)、Nurikabe、Kakuro 等多款 Nikoli 谜题独立 App, 但**没有 Bag/Corral App**。说明厂商层面也认为该品类偏小众。
5. **专业博客内容数量表明受众规模**: GM Puzzles (gmpuzzles.com) 收录 131 个 Cave 谜题, 与 Masyu (121)、Slitherlink (121) 相当, 显著高于 Nurikabe (84)。这表明**解谜圈的硬核玩家有稳定需求**, 但大众市场未启动。

### 竞品分类

- **Web 浏览器版 (主要战场)**: 多个小站提供 pzprjs/类似引擎的免费 Cave
- **移动 App (稀缺)**: 仅 1-2 个独立 iOS App, Google Play 几乎为零
- **跨谜题合集 App**: Simon Tatham / PuzzleManiak / 100 Logic Games 等包含多类 Nikoli 谜题, 但**未收录** Cave (Simon Tatham 的 Loopy 实际是 Slitherlink)
- **解谜创作平台**: penpa-edit (作者用工具, 非游戏) 提供 Cave 题型
- **PDF/印刷书**: 销量低, 通过亚马逊和 Nikoli 杂志发行
- **PC 端独立软件**: 与 web 引擎基本同源, 用户重叠

---

## 顶级竞品详细分析 (Top Competitors)

依据 **触达用户规模、产品质量、行业代表性** 三个维度, 选出以下 5 个核心竞品, 按重要性降序排列。

---

### 1. puzz.link / pzprjs — 开源引擎 + 社区门户 (Web)

**URL**: https://puzz.link/p?cave (以 "cave" 命名)
**GitHub**: https://github.com/robx/pzprjs (87 stars, 53 forks, MIT 协议, 最新更新 2026-06)
**原始作者**: sabo2 (peteronrails 等社区贡献者)
**平台**: 纯 Web (HTML5/JS), 桌面与移动浏览器均支持

#### 网格尺寸与关卡

- 自由调整, 无固定关卡库
- 创作者/解谜者可自由生成任意尺寸 (5×5 ~ 30×30 常见)
- 谜题数据通过 URL 编码, 可永久分享
- **无内置"每日谜题"**, 但社区在 Discord 举办定期赛

#### 核心玩法机制

- 点击格线 (dotted lines) 切换为环线 (line)
- 右键标记"非环线" (X 排除标记)
- 实时错误检测 (例如: 形成 2 个独立环 = 错误)
- 内置**解算器 + 唯一性验证器**
- **可作为编辑器** (作者模式: 放置数字、设置数字边框)

#### 计分系统

- **完成时间记录** (solve timer) — 在 puzz.link 的后端记录全球玩家排名
- **匿名模式**: 无需注册即可记录时间
- **注册用户**: 完整个人统计、解题历史、最佳成绩
- **联网对战 (network play)**: 同一谜题与朋友实时比拼
- 排行榜以"已解谜题数"和"平均完成时间"为指标

#### UI/UX 特性

| 类别 | 支持情况 |
|------|----------|
| Undo/Redo | ✅ |
| 多语言 | ✅ 完整支持 EN/JA, 通过 Weblate 平台招募翻译 |
| 夜间模式 | ✅ |
| 错误高亮 | ✅ (实时) |
| 缩放/平移 | ✅ (网格可缩放, 大尺寸谜题可平移) |
| 自动完成检测 | ✅ (环闭合时自动判定) |
| 进度保存 | ✅ (localStorage, 匿名 ID) |
| 分享/复制谜题 | ✅ (URL 即谜题定义) |
| 教程 | ✅ (rules 页面 + 实例错误示例) |
| 提示系统 | ❌ (无) |
| 暗色主题 | ✅ |
| 网格坐标 | ✅ |
| 多种输入模式 | ✅ 旋转、X 标记、橡皮、填充 |
| 多格式导出 | ✅ pzv 编码 |

#### 视觉风格

- 极简、纯白底, 适合长时间解题
- 环线为深灰/黑色, 数字为蓝/黑色
- 无装饰性元素, 完全功能化
- 移动端通过 CSS 响应式适配
- 平面化 (flat design) 风格

#### 音乐/音效

- ❌ 无
- 纯安静解题体验 (日本解谜传统)

#### 货币化 (Monetization)

- **完全免费**
- 无广告
- 无内购
- 接受 Patreon / GitHub Sponsors 资助开发
- 源码开放, 任何人都可托管

#### 关键数值

- 引擎支持 **100+ 种** Nikoli 及变体谜题
- pzprjs GitHub: 87 stars, 53 forks, 78 个开放 issue
- 维护者: robx (开源社区, 持续活跃维护, 最近更新 2026-06)
- 谜题数据库: 公开的 URL 编码方案 `p?cave/6/6/数据` 可永久存档
- Weblate 翻译项目: 支持社区翻译

---

### 2. Sudoku.one / Corral — WordPress 博客内置游戏 (Web)

**URL**: https://sudoku.one/corral
**平台**: Web (WordPress + 自定义 JS)
**运营商**: 独立谜题网站 (主站为 sudoku.one, 收录 Sudoku 变体及逻辑谜题)

#### 网格尺寸与关卡

- 提供 5×5, 7×7, 9×9, 10×10, 12×12, 32×32 等多种网格
- 难度分为: Simple (简单), Easy (容易), Medium (中等) 三档 (部分页面)
- **Corral #90** 等已编号的题目库 (累计上百道)

#### 核心玩法机制

- 点击格线切换环线
- 实时错误检测
- 自动完成检测
- 与 sudoku.one 其他谜题共享 UI 框架

#### 计分系统

- 无显式积分/星级
- 跟踪完成时间
- 包含解答排行榜 (sudoku.one 全站共享)

#### UI/UX 特性

- ✅ Undo/Redo
- ✅ 多种难度
- ✅ 多种网格尺寸
- ✅ 帮助页面 (含"用户手册")
- ✅ 完成示例
- ✅ 多语言 (主要为英文, 部分欧洲语)
- ❌ 提示系统
- ❌ 音效
- ✅ Cookie 合规 (GDPR)

#### 视觉风格

- 简约博客风, 浅色背景
- 蓝色/红色高亮, 现代网页设计
- 移动端响应式

#### 货币化

- 免费 + 广告
- 横幅广告 + Cookies 同意提示
- 推测使用 Google AdSense 或类似广告联盟

#### 关键数值

- 域名权威度: 中 (类似 sudoku 系博客)
- 已知谜题编号最高: #90+
- 主要流量来源: 搜索引擎, "corral puzzle" 关键词排名较前

---

### 3. Bag puzzle — Yuki Fujimoto (iOS 独立 App)

**App Store ID**: 1191713366
**Bundle ID**: jp.twocats.Bag
**URL**: https://apps.apple.com/jp/app/bag-puzzle/id1191713366
**开发者**: Yuki Fujimoto (个人开发者, 旗下有 ~13 款 Nikoli 谜题 App, 包括 Hitori、LITS、Heyawake、Bridges 等)
**平台**: iOS (iPhone/iPad), 最低 iOS 8.0
**首发日期**: 2017-01-05
**当前版本**: 1.0 (无更新)

#### 网格尺寸与关卡

- 提供多尺寸网格 (具体需 App 内确认)
- 内置固定关卡库 (数十至上百道)

#### 核心玩法机制

- 点击/拖动绘制环线
- 标准 Bag 规则
- 估计包含撤销功能 (该开发者其它 App 普遍支持)

#### UI/UX 特性 (根据 Yuki Fujimoto 旗下系列 App 推断)

- ✅ Undo (大部分 Nikoli 系列 App 都支持)
- ✅ 错误检测 (自动)
- ✅ 进度保存
- ✅ 多语言: EN + JA
- ❌ 提示系统 (无)
- ❌ 每日谜题 (无)
- ❌ 教程 (无, 仅规则说明)
- ❌ 暗色模式 (1.0 版本时 iOS 12 以下不普及)
- ✅ 简洁的日式 UI 风格
- 屏幕截图 5 张

#### 视觉风格

- 极简日式设计
- 浅色背景, 黑色环线, 蓝色数字
- 单一主屏 + 关卡列表

#### 音乐/音效

- ❌ 无

#### 货币化

- **完全免费** (无内购, 无广告)
- 该开发者所有 Nikoli 谜题 App 都采用免费 + 无广告模式 (典型日本解谜开发者风格)

#### 关键数据 (App Store 公开)

| 指标 | 数值 |
|------|------|
| 平均评分 (US) | 4.0 / 5 |
| 评分人数 (US) | 3 |
| 平均评分 (JP) | 4.0 / 5 |
| 评分人数 (JP) | 4 |
| App 大小 | ~15 MB |
| 当前版本 | 1.0 (2017 年首发, 无更新) |
| 下载量 | **未公开**, 但作为冷门 Nikoli 谜题 + 多年无更新, 估计 < 10,000 |
| 内容分级 | 4+ |
| 售价 | 0 USD / 0 JPY |

#### 评价洞察

- 评分样本极少 (3-4 人), 无法代表真实用户感受
- 应用久未更新 (2017 年 1 月), 极可能已下架或被遗忘
- 这恰恰表明**该品类缺乏持续运营者**

---

### 4. en.grandgames.net / Daily Puzzle Corral (Web)

**URL**: https://en.grandgames.net/dailypuzzles/corral
**平台**: Web (HTML5 游戏门户)
**运营商**: GrandGames.net (大型游戏门户, 含 Brain Teasers, Jigsaw, Daily Puzzles, Tournaments, Arena 等)

#### 核心玩法机制

- 与 sudoku.one 类似
- 每日新题
- 实时错误检测
- 计时器

#### 计分系统

- **每日排行榜** (Daily)
- **锦标赛模式 (Tournaments)**
- **竞技场 (Arena)** — 实时对战
- **任务系统 (Missions)** — 完成特定条件获得奖励
- **成就系统 (Achievements)**
- **工艺/养成 (Craft)** — 游戏化元素, 通过解题收集材料

#### UI/UX 特性

- ✅ 每日新题
- ✅ 计时器
- ✅ 排行榜
- ✅ 多语言 (EN/RU 等)
- ✅ 错误高亮
- ✅ 移动端响应式
- ❌ 教程

#### 货币化

- 免费 + 广告
- 锦标赛可能含付费入口

#### 关键数值

- 单一 URL 提供每日谜题, 无明确关卡总数
- 流量主要来自 GrandGames 门户主站
- 受众偏俄罗斯/东欧 (GrandGames 起源)

---

### 5. Conceptis Slitherlink — 顶级 Nikoli 谜题 App (iOS, 对标参照)

> **重要说明**: Conceptis 没有推出独立的 Cave/Bag App。以下数据用于**对比基准**, 展示同类型 (Nikoli 环类) 谜题在主流商业产品中的表现。

**App**: Slitherlink: Loop the Snake
**Bundle ID**: com.conceptispuzzles.Slitherlink
**URL**: https://apps.apple.com/us/app/slitherlink-loop-the-snake/id605918324
**开发者**: Conceptis Ltd. (全球最大的逻辑谜题供应商之一)
**平台**: iOS (iPhone/iPad)
**首发**: 2013-05-02
**当前版本**: 5.4

#### 网格尺寸与关卡

- 200+ 免费谜题
- 每周新增 1 个免费 Bonus
- 难度 5 档 (极易 → 极难)
- 网格尺寸高达 16×22
- 持续内容更新

#### 核心玩法机制

- 点击/拖动绘制环
- 自动完成检查
- "线段高亮"功能 (帮助避免形成独立环)

#### UI/UX 特性

| 类别 | 支持 |
|------|------|
| Undo/Redo | ✅ 无限制 |
| 错误检测 | ✅ |
| 暗色模式 | ✅ |
| 进度保存 | ✅ iCloud 备份/恢复 |
| 双指缩放 | ✅ |
| 多任务并行 | ✅ |
| 教程 | ✅ 完整 |
| 提示 | ❌ (无, 但提供 unlimited check) |
| 计时器 | ✅ |
| 屏幕旋转 | ✅ (iPad) |
| 进度可视化 | ✅ 网格预览图 |

#### 视觉风格

- 精致印刷风, 极简
- 完美暗色模式
- 大量 iPad 优化

#### 货币化

- 免费 + **订阅制 / 单次购买** (典型 Conceptis 模式)
- **无广告** (干净体验)
- 一次性买断可解锁全部谜题 + 去除广告

#### 关键数据 (App Store 公开)

| 指标 | 数值 |
|------|------|
| 平均评分 | 4.83 / 5 |
| 评分人数 | **453** |
| App 大小 | ~50 MB |
| 当前版本 | 5.4 (持续维护) |
| 多语言 | EN, JA, KO, ZH |
| 最低 iOS | 15.6 |
| 售价 | 免费 (内购) |
| 概念公司每天全球解题量 | 2000 万+ |

#### 重要发现

- **Slitherlink 作为最相似 Nikoli 环类谜题, 453 条评分, 4.83 星** — 这是 Bag/Corral 可参考的"上限"
- Bag/Corral 因玩法更复杂 (需理解"视线"概念) 受众更小, 但**长尾忠实用户**可观
- Conceptis 不出 Bag App 表明该品类商业化难度较大

---

## 其它值得关注的竞品 (Other Notable Competitors)

### 6. puzzles.wiki / Cave (Wiki 文档 + 教程)

- **URL**: https://www.puzzles.wiki/wiki/Cave
- **类型**: Wiki 解谜知识库, 收录 Cave/Bag/Corral 规则、变体 (Product Cave, Canal View)、解法策略、示例
- **价值**: 高质量 SEO 内容, 是玩家学习 Cave 的主要英文资料来源之一
- **重要事实**: 指出 Cave 首次出现于《Puzzle Communication Nikoli》第 **60** 期 (与 pzprjs 称的第 58 期略有差异)
- **货币化**: 无 (Wiki)
- **流量**: 中 (解谜 SEO 长尾)

### 7. enclose.horse (Web)

- **URL**: https://enclose.horse/
- **类型**: 极简网页版 Cave 谜题解谜器
- **特色**: 干净单页, 无广告, 适合快捷解谜
- **来源**: 推测基于 pzprjs 引擎
- **价值**: 适合"一次一题"的用户

### 8. sugurupuzzles.com / Cave-Corral (Web)

- **URL**: https://sugurupuzzles.com/cave-corral-puzzle-online.html
- **类型**: Suguru 类谜题站点的 Cave/Bag 扩展页
- **特色**: 提供 "Cave, Corral, Baggu" 三种叫法都可达, SEO 友好
- **货币化**: 广告支持

### 9. sortedpuzzles.com (Web)

- **URL**: https://sortedpuzzles.com/corral-cral-4-009p/
- **类型**: 难题集分享站
- **特色**: 收录"难题"系列 (corral-cral-4-009p 等命名风格)
- **价值**: 适合高级玩家

### 10. puzzles.covering.space (Web)

- **URL**: https://puzzles.covering.space/genres/cave
- **类型**: 解谜创作/分享平台
- **价值**: 作者工具 + 解谜社区

### 11. rollforfantasy.com (Web)

- **URL**: https://rollforfantasy.com/puzzles/corral.php
- **类型**: RPG 主题免费谜题站
- **特色**: 简单 PHP 实现的 PDF/打印友好版
- **价值**: 长尾 SEO 流量

### 12. Conceptis Slitherlink (Google Play) — 对比基准

- 与 iOS 版同步发布
- 评分与下载量与 iOS 相近
- 进一步验证 Slitherlink 的市场基准

### 13. nikoli.co.jp/en/puzzles/ — 官方 Nikoli

- 主页**未列出 Bag/Cave** (目前)
- 这表明该谜题虽起源于 Nikoli 但已非推广重点
- 玩家需要在日文档案或第三方资源查找

### 14. Yuki Fujimoto 系列 (iOS) — 对比参照

该开发者还推出了多款 Nikoli 谜题 App, 可作为 Bag App 的"姐妹"参考:

| App | Bundle | 发布 | 评分 | 评分数 |
|-----|--------|------|------|--------|
| ひとりにしてくれ (Hitori) | jp.twocats.Hitori | 2015-11 | 3.71 | 21 |
| LITS | jp.twocats.LITS | 2017-02 | 2.33 | 3 |
| バッグ (Bag) | jp.twocats.Bag | 2017-01 | 4.0 | 3 |
| ぬりかべ (Nurikabe) | jp.twocats.Nurikabe | - | - | - |
| 美術館 (Akari) | jp.twocats.Akari | - | - | - |
| 波及効果 (Ripple Effect) | jp.twocats.RippleEffect | - | - | - |

**洞察**: 该开发者 Nikoli 谜题 App 普遍**评分样本极少 (< 25), 评分中等**, 反映该品类在 App Store 的长尾状态。

### 15. 100 Logic Games - Time Killers (iOS) — 跨谜题合集

- **开发者**: Andrea Sabbatini
- **App Store ID**: 500243153
- **包含**: 100+ 种逻辑谜题
- **包含 Slitherlink, Masyu, Nurikabe, Hitori, Akari** 等 Nikoli 热门谜题
- **但未包含 Bag/Corral**
- 平均评分: 4.70 (688 评分)
- **关键洞察**: 即使是顶级的逻辑谜题合集 (全球 1000 万+ 玩家) 也未收录 Bag/Corral, 表明该谜题在**主流移动市场认知度低**

### 16. PuzzleManiak (iOS) — Simon Tatham 移植

- **开发者**: Alexandre Minard
- 移植 Simon Tatham 的开源谜题集
- **包含 24 种谜题**: Loopy (实为 Slitherlink), LightUp (实为 Akari), Nurikabe, Masyu, Slitherlink, ...
- **未包含 Bag/Corral**
- 平均评分: 3.09 (23 评分) — 评分偏低
- 关键洞察: **Simon Tatham 的"Loopy"是 Slitherlink, 不是 Bag/Corral**, 业界常混淆

### 17. GM Puzzles / The Art of Puzzles (博客 + PDF)

- **URL**: https://www.gmpuzzles.com/blog/2024/10/cave-by-grant-fikes-7/
- **创始人**: Thomas Snyder, Serkan Yürekli, Grant Fikes 等
- **Cave 谜题数量**: 131 道 (与 Masyu 121, Slitherlink 121, Yajilin 114 相当)
- **特色**: 高质量 PDF 周赛, Discord 社区活跃
- **货币化**: PDF 书销售, Patreon, 付费订阅 (~$5/月)
- **价值**: 硬核玩家聚集地, 风格化艺术性强

---

## 功能对比矩阵 (Feature Comparison Matrix)

| 功能 | puzz.link | sudoku.one | Yuki Bag App | grandgames | Conceptis Slitherlink | 100 Logic Games |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| **平台** | Web | Web | iOS | Web | iOS, Android | iOS, Android |
| **网格尺寸** | 自定义 | 5×5~32×32 | 多尺寸 (App 内) | 自定义 | 4×4~16×22 | 5×5~10×10 |
| **难度等级** | 自定义 | 3 档 (S/E/M) | 未明确 | 多档 | 5 档 | 多档 |
| **无限谜题** | ✅ (URL 生成) | ❌ (有限库) | ❌ (有限) | ✅ (每日) | ✅ (持续) | ✅ |
| **每日谜题** | ❌ | ❌ | ❌ | ✅ | ✅ (Weekly Bonus) | ❌ |
| **计时器** | ✅ | ✅ | 估计无 | ✅ | ✅ | ✅ |
| **排行榜** | ✅ (全球) | ✅ | ❌ | ✅ | GameCenter | GameCenter |
| **Undo/Redo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **错误高亮** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **提示系统** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **教程** | ✅ (规则页) | ✅ | ❌ | ❌ | ✅ | ✅ |
| **夜间/暗色模式** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **进度保存** | ✅ | ✅ | ✅ | ✅ | ✅ iCloud | ✅ |
| **多语言** | EN/JA + Weblate | EN 主 | EN/JA | 多语 | EN/JA/KO/ZH | 多语 |
| **音乐/音效** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **自动完成** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **多任务并行** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **iCloud 同步** | ❌ | ❌ | ❌ | ❌ | ✅ | 部分 |
| **广告** | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **价格** | 免费 | 免费 | 免费 | 免费 | 免费 (内购) | 免费 (内购) |
| **移动 App** | ❌ | ❌ | ✅ iOS | ❌ | ✅ | ✅ |
| **离线可玩** | ✅ (PWA) | ❌ | ✅ | ❌ | ✅ | ✅ |

**最突出的功能差距**:
1. **提示系统**: 几乎所有 Cave 竞品都没有, 这是**最大空白**
2. **教程**: 除 puzz.link 外, 多数无系统教程
3. **每日谜题**: 仅 grandgames 提供
4. **音乐/音效**: 全部缺失 (日本解谜传统)

---

## 关键洞察与机会 (Key Takeaways & Opportunities)

### 市场空白 (Market Gaps)

1. **移动端完全真空**: iOS 仅 1 款独立 App (2017 年首发, 已无更新), Google Play 几乎为零。这是**最显著的进入机会**。
2. **没有任何 Cave 跨谜题合集 App 收录 Cave**: 100 Logic Games, PuzzleManiak, Simon Tatham 都没有。即使 Slitherlink 这种同类型 Nikoli 环类已大量被收录, Cave 仍被遗忘。
3. **概念巨头 Conceptis 不出 Cave App**: 这意味着 Cave 商业化空间对独立开发者来说相对平等 — 没有强势玩家占据市场。
4. **无现代 UI/UX 体验**: puzz.link 极简但偏向工具, sudoku.one 简陋无音频, 全部竞品都缺乏现代游戏化设计 (粒子、动画、关卡奖励等)。
5. **无系统提示系统**: 这是所有 Cave 玩家的痛点 (环类谜题卡住时极易放弃), 谁先做出来谁就赢。
6. **Nikoli 自身不再重点推广**: 主页未列出 Cave — 玩家需要从第三方资源学习, 任何优质新作品都会被老玩家视为"久违"。

### 竞争优势策略 (Competitive Advantages to Pursue)

| 机会 | 描述 |
|------|------|
| **现代视觉设计** | 干净的网格、流畅的环线绘制动画、环闭合时的粒子特效、关卡完成的庆祝动画 |
| **渐进式提示系统** | 三档提示: 1) 高亮一个必须填的格线; 2) 显示一个区域的所有线; 3) 完全揭示一步推理。当前所有竞品都没有, 这是 GameZipper 的核心差异化 |
| **系统化教程** | 6-10 步交互式引导, 教玩家理解"视线"概念, 而非死板的文字规则 |
| **每日谜题 + 连续打卡** | 每日新题, 7/30 天连续打卡奖励, 弥补 grandgames 之外的空白 |
| **星级评分** | 基于时间 + 错误次数的 1-3 星, 玩家追求完美解 |
| **多语言** | 至少 EN + JA + ZH, 利用 pzprjs 现有的 Weblate 翻译基础 (可省 30% 工作量) |
| **无广告纯净体验** | 与 puzz.link 风格一致, 提供赞助人 (Patreon) 选项, 而非堆广告 |
| **暗色模式 + 色盲模式** | 现代可访问性标配 |
| **iOS + Android 同步** | 一次开发, 多端发布 |
| **离线可玩 (PWA)** | 移动浏览器即可玩, 不需要下载 App |
| **可分享/可打印** | URL 分享 + 打印 PDF, 接入 pzprjs 现有的 pzv 编码方案 |
| **解谜创作器** | 内置编辑器, 让玩家自创谜题并分享 (puzz.link 的核心价值) |

### 核心目标人群画像 (Target Personas)

1. **硬核解谜玩家 (核心)**: 已熟悉 Slitherlink, 寻找新挑战
2. **Nikoli 爱好者 (核心)**: 收集所有 Nikoli 谜题玩法
3. **数学/逻辑训练者 (次要)**: 寻求 Sudoku 替代品的中年用户
4. **东方文化爱好者 (次要)**: 对日本解谜文化感兴趣
5. **教育场景 (机会)**: NP-complete 性质可作为计算机科学教学案例

---

## 基准数据表 (Benchmark Numbers)

### 我们 GameZipper Bag/Corral 产品的目标设定

基于以上竞品分析, 推荐以下基准:

| 指标 | 竞品范围 | 我们的目标 |
|------|----------|------------|
| 网格尺寸 | 5×5 ~ 32×32 | 5×5 ~ 20×20 |
| 难度等级 | 3-5 档 | 4 档 (教程 → 简单 → 中等 → 困难) |
| 关卡总数 | 50-200 | **200+ 精选 + 每日新题** |
| 每日新题 | 仅 grandgames | ✅ 每日 UTC 0 点 |
| 教程关卡 | 0-5 | **10+ 交互式引导关卡** |
| 提示粒度 | 0 级 (无) | **3 级渐进式提示** (我们的杀手锏) |
| 星级评分 | 0 | ⭐⭐⭐ 每关 (基于时间 + 错误) |
| 连续打卡 | 0 | 7/30/100 天奖励 |
| 语言数 | 1-4 | EN + JA + ZH (3 语言起步) |
| 音乐/音效 | 0 (web) | ✅ 环境音 + 完成音效 (差异化) |
| 广告 | 多数有 | 零广告, 可选赞助人 |
| 平台 | Web/iOS/Android | Web (PWA) + iOS + Android |
| 离线支持 | 部分 | ✅ 完全离线 |
| 加载时间 | 1-3 秒 | < 1.5 秒 (Core Web Vitals) |
| 解题保存 | localStorage | localStorage + 云端备份 |

### 12 个月关键指标 KPI

| 指标 | 目标 |
|------|------|
| 月活用户 (MAU) | 50,000+ (参考 Slitherlink 453 评分的体量, 转化率目标 5-10%) |
| 留存率 D7 | > 20% (逻辑谜题行业基准) |
| 留存率 D30 | > 8% |
| 平均会话时长 | 8-12 分钟 (一次解一题) |
| 每用户每日解题数 | 1-3 |
| Lighthouse 性能分 | > 90 |
| 移动端占比 | > 60% |
| 搜索引擎流量 | "corral puzzle", "cave puzzle", "bag puzzle" 关键词首页排名 |

### 与 Conceptis Slitherlink 的差距评估

| 维度 | Slitherlink (行业顶级) | 我们的目标 |
|------|----------------------|-----------|
| 评分人数 | 453 | 12 个月内 50+ |
| 平均评分 | 4.83 | > 4.5 |
| 内容规模 | 200+ 谜题 | 200+ 起步 |
| 网格最大 | 16×22 | 20×20 (略胜) |
| 价格 | 免费 + 内购 | 免费 + 赞助人 |
| 广告 | 无 | 无 |
| 维护频率 | 持续 | 月度 |

### 风险与缓解 (Risks & Mitigations)

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|----------|
| Cave 认知度低, 自然流量小 | 高 | 中 | 主动 SEO + Reddit/HN 推广, 与 puzz.link 建立反向链接 |
| NP-complete 谜题, 部分玩家觉得"太难" | 中 | 中 | 系统化教程 + 渐进式提示系统 |
| iOS App 审核对"逻辑"类应用无特别扶持 | 低 | 低 | 主推 PWA, App 作为补充 |
| 现有 puzz.link 玩家不愿意迁移 | 中 | 低 | 提供数据导入/导出, 互操作性 |
| 商业化难度大, Conceptis 都不出 App | 中 | 中 | 多渠道 (赞助人 + 教育机构 + 印刷书) |

---

## 参考链接 (References)

- Wikipedia Bag (puzzle): https://en.wikipedia.org/wiki/Bag_(puzzle)
- Wikipedia Cave (puzzle): https://en.wikipedia.org/wiki/Cave_(puzzle)
- pzprjs GitHub: https://github.com/robx/pzprjs
- puzz.link Cave: https://puzz.link/p?cave
- nikoli.co.jp (官方): https://www.nikoli.co.jp/en/puzzles/
- puzzles.wiki Cave: https://www.puzzles.wiki/wiki/Cave
- Erich Friedman 论文 (NP-complete 证明): https://erich-friedman.github.io/papers/corral/corral.html
- Yuki Fujimoto Bag iOS App: https://apps.apple.com/jp/app/bag-puzzle/id1191713366
- Conceptis Slitherlink (基准): https://apps.apple.com/us/app/slitherlink-loop-the-snake/id605918324
- 100 Logic Games (跨谜题合集): https://apps.apple.com/us/app/100-logic-games-time-killers/id500243153
- GM Puzzles: https://www.gmpuzzles.com/

---

*本研究文档由 GameZipper 谜题产品研究组撰写, 数据采集截至 2026 年 6 月。文档将随竞品动态季度更新。*
