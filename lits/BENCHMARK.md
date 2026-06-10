# LITS (Nuruomino) - 竞品分析报告与市场调研

**研究日期:** 2026-06-10
**调研方法:** 一手 web 抓取 (Nikoli / Wikipedia / puzz.link / GitHub API / Google Play / App Store / DuckDuckGo)
**目的:** 为 GameZipper 立项 LITS 网页版 + 移动版提供决策依据

---

## 0. 游戏概述

LITS(曾用名 Nuruomino / ヌルオミノ)是一款由日本 Nikoli 出品的纸笔逻辑谜题。

- **发明人:** Naoki Inaba(日本)
- **首次刊载:** Puzzle Communication Nikoli 第 104 期(2004)
- **更名期:** 第 112 期(2005)改名为 LITS(L / I / T / S 四种 tetromino 首字母的合称;O 即方形 tetromino 必违反 2x2 规则所以排除)
- **官方页面:** https://www.nikoli.co.jp/en/puzzles/lits/
- **Wikipedia:** https://en.wikipedia.org/wiki/LITS
- **复杂度:** 解存在性判定为 NP-complete(Biro and Schmidt, EuroCG 2017, https://itn-web.it.liu.se/~chrsc91/papers/norinori-lits.pdf)

### 标准规则(Nikoli 原文)
1. 在每个加粗线条围出的区域里,恰好涂黑 4 个相连方格(必须构成 tetromino)
2. 旋转或镜像后形状相同的两个 tetromino 不能正交相邻
3. 所有涂黑格子必须相互正交连通
4. 任意 2x2 区域不能全部涂黑

### 变体(WPC unofficial wiki 收录)
- **LITS+**(Robert Vollmert, 2014):允许某些区域不涂色
- **Inverse LITSO**(Bram de Laat, 2012):未涂色的格子在每个区域里构成 tetromino

---

## 1. 竞品/资源总览(按对 GameZipper 的威胁度排序)

| # | 资源 | 形态 | 已知用户/数据 | 威胁度 |
|---|---|---|---|---|
| 1 | puzzle-lits.com | 独立站 + iOS App | 唯一完整的 LITS 专项站,含 5 尺寸x2 难度 | **高**(直接竞品) |
| 2 | puzz.link / pzprjs (robx) | 开源 pzprjs applet(含 LITS 编辑器/求解) | GitHub 87 star/53 fork/4,372 commits | **中**(开发参考) |
| 3 | Simon Tatham Puzzles(Chris Boyle) | Android 1M+ / Web / Windows | 4.8 star,16.5K 评分,1M+ 下载;**不含 LITS**,但有 Net/Loopy/Map | **中**(同类用户池) |
| 4 | Conceptis Puzzles / Hashi 移动端 | 移动应用 | 1M+ 下载;但只做部分 Nikoli 变体 | **低** |
| 5 | Brennerd 逻辑解谜系列 | Android(brennerd) | Suguru 4.8 star,Binary Twist 4.6 star,Kuromasu 4.7 star;**无 LITS** | **低**(潜在用户) |
| 6 | gmpuzzles.com(Serkan Yurekli) | 博客 + 周 PDF | 110 篇 LITS 主题博文 | **低**(内容生态) |
| 7 | WPC unofficial wiki | 维基 | WPC 2014-2023 多次收录 LITS | **低**(赛用) |
| 8 | 移动版竞品(Noomino / Tilepaint 等) | 移动/网页 | 各种独立 | **低**(多为非 LITS) |
| 9 | 浏览器聚合站(Poki / CrazyGames / itch.io) | HTML5 聚合 | **搜索 LITS 全部 0 命中** | **无**(市场空白) |

> **关键发现:** 移动端 LITS 专项应用是市场空白点。Google Play "LITS puzzle" 关键词搜索结果全是 Tetris-like 区块填充游戏;"Nuruomino" 在 Google Play 0 命中。App Store iOS 端 iTunes API 返回的 19 个结果中没有任何一个是真正的 LITS 谜题。

---

## 2. Nikoli 官方(nikoli.co.jp/en/puzzles/lits/)

- **URL:** https://www.nikoli.co.jp/en/puzzles/lits/
- **形态:** 官方介绍页 + 样题图解(无在线版)
- **核心规则(原文摘录):**
  > Color four consecutive squares (tetrominoes) in each of the areas surrounded by bold lines.  
  > Similarly shaped rotated or reversed tetrominoes cannot touch, except at corners.  
  > The colored squares must form a connected network.  
  > Colored squares cannot form 2x2 or larger squares.
- **官方特性:**
  - 9 张配图:Sample、Progressing、Solution、Rules 等步骤图
  - 4 条规则 + 1 段 Features 简介
  - 出版历史:Puzzle Cyclopedia(原始名 Nuruomino);2007-11 第一本 LITS Pencil Puzzle Book
- **用户量/下载量:** N/A(无在线版,杂志订阅制)
- **UI/UX 亮点:** 极简白底灰线,gif 演示,纸笔质感
- **变现方式:** 杂志 / 书 / 周边
- **GameZipper 优势机会:**
  1. 官方英文页是 **静态 HTML**,无互动、无移动端适配
  2. 官方不收录玩家解题记录、不发奖牌
  3. **可以做"官方规则官解"镜像 + 工具**(类似 Simon Tatham 与原始发明者无利益冲突的关系)
  4. 收入可避开杂志订阅人群,做 web + PWA 即可触达广告受众

---

## 3. puzzle-lits.com(最直接竞品)

- **URL:** https://www.puzzle-lits.com/
- **形态:** 独立站 + 配套 iOS App("iOS App" 链接位于主页右上)
- **核心特性:**
  - 5 种尺寸:6x6 / 8x8 / 10x10 / 15x15 / 20x20
  - 2 种难度:Normal / Hard(每个尺寸都有)
  - 3 种 Special:Daily / Weekly / Monthly LITS
  - 撤销/重做、自动校验、错误高亮、坐标显示、夜间模式
  - 高级 UI:Sticky toolbar、Auto-submit、Show checkpoints、Highlight last change / current block / current group of cells、Thicker block borders、Color tetrominoes、Auto place X on corners / in completed regions
  - Hall of Fame(速度/胜率排行榜)+ Statistics + Specific puzzle(按 ID 复盘)
  - Mass Print(可打印纸笔卷)
  - **40+ 同站兄弟谜题**(Kurodoko / Binairo+ / Yin-Yang / Norinori / Mosaic / Minesweeper / Slant / Galaxies / Tents / Battleships / Pipes / Hitori / Heyawake / Shingoki / Masyu / Stitches / Aquarium / Tapa / Star Battle / Kakurasu / Skyscrapers / Futoshiki / Renzoku / Shakashaka / Kakuro / Jigsaw Sudoku / Killer Sudoku / Binairo / Nonograms / Slitherlink / Sudoku / Light Up / Hashi / Shikaku / Nurikabe / Dominosa + Lollipops / Thermometers / Chess Puzzles)
  - 50+ 语言的 google translate 横条
- **用户量/下载量:**
  - Puzzle ID 计数器当前已到 **7,927,965**(2026-06-10),自上线来已生成 790 万+ 局(不是独立玩家,但能反映活跃度)
  - iOS App **未在 Google Play 上架**("iOS App" 链接是 Apple App Store 链接,未公开下载量)
- **UI/UX 亮点:**
  - 玩家可高度定制画板、关闭工具栏、自动提交、错误高亮
  - 与多个姐妹谜题共享平台,交叉引流(One Site to Rule Them All)
- **变现方式:**
  - **Patreon**("Become a Patron" 按钮)
  - **Pin Ads**(页内广告)
  - **Remove Ads**(付费去广告)
  - 默认"Remove Ads | Report This Ad" 100% 高度占位
- **GameZipper 优势/差异化机会:**
  1. **没有 Android 应用**,pure iOS 留下 Google Play / 三星 / 海外安卓市场空白
  2. **UI 偏 2014 风**(密集按钮、文字按钮、grid 布局老派),与"GameZipper dark / neon 风格" 形成强对比
  3. **缺乏排行榜/成就系统**,可加 streak、daily challenge、share result
  4. **没有 PWA / 离线模式**,GameZipper 已有 PWA 经验是现成优势
  5. **规则 3 ("connected") 与 "no 2x2" 错误提示常常滞后**,可在客户端提供"易错点高亮"
  6. **没有 tutorial / interactive onboarding**,可做 3 关 intro
  7. **没有每日 / 每周 / 每月多题集合**,可做"月度主题赛"或"LITS 30 天挑战"

---

## 4. puzz.link / pzprjs(开源 LITS 编辑器 + 求解器)

- **URL:** https://puzz.link/p?lits
- **开源代码:** https://github.com/robx/pzprjs (87 star/53 fork,4,372 commits)+ https://github.com/x-sheep/pzprjs (已被 robx 合并)
- **作者:** robx (Robin Haberkorn)
- **形态:** 单页 Web App(HTML5 + JavaScript),可在线编辑/求解/分享 LITS 等 200+ 种 Nikoli 谜题
- **核心特性:**
  - LITS 编辑器:可调尺寸与难度的随机生成器(基于 jsWaffle SAT 求解器)
  - 实时错误检查:分别标红 LITS+ / Inverse LITSO 等变体规则违例
  - 颜色可改(每种 tetromino 一种色)、可清除答案/aux marks
  - File > Export URL(链接分享)+ Save as SVG/PNG/PDF
  - 与 puzz.link/db 公共题库打通(虽然 LITS 题目数量较少)
  - 多语言:Weblate 在翻译 ja/en/中/法/...
- **用户量/下载量:**
  - GitHub Stars 87、Forks 53,**Comments 60 + PR 18**
  - 通过嵌推(Puzzle Square JP、Twitter)二次分发,无独立访问量数据
- **UI/UX 亮点:**
  - 极简灰底 + 黑色加粗区域边框
  - 顶栏按钮全为图标 + tooltip,无文字(老练用户向)
  - 内置 "Color up" 快捷键
- **变现方式:** **无任何商业化**,MIT 协议 + 社区维护
- **GameZipper 优势/差异化机会:**
  1. **授权友好 (MIT)**,可在其基础上做前端改造并加 GameZipper 品牌/广告,但**必须保留版权说明**
  2. **无客户端随机生成器**,puzz.link 实际上是生成 -> 链接分享模式,本地无限生成是 GameZipper 优势
  3. **没有多语言 SEO**(虽然翻译了文案,但元数据/OG/FAQ 几乎为 0),可做 zh-CN 国际化
  4. **没有 daily / streak / 成就**,是 GameZipper 天然加 hooks 的位置
  5. **JS 体积大**(pzprjs 完整 bundle 约 700 KB),GameZipper 可以做"轻量 LITS-only"版本

---

## 5. Simon Tatham Portable Puzzle Collection

- **URL:** https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- **Android 包:** https://play.google.com/store/apps/details?id=name.boyle.chris.sgtpuzzles
- **iOS 替代:** 在 App Store 中无官方移植(仅一些非官方 port)
- **作者:** Simon Tatham(游戏+原生 C 代码)+ Chris Boyle(Android 移植)
- **License:** MIT
- **核心特性:**
  - 40 个单人物理/逻辑谜题
  - **不含 LITS**,但有 **Net**(重组管道)、**NetSlide**(滑动重组)、**Loopy**(画闭环)、**Map**(染色不让相邻)、**Pearl**(画闭环带拐角/直线提示)、**Signpost**(按箭头连路径),这些都涉及"shading/tetromino/region"类思维但不等同
  - 每局按 size x difficulty 实时生成
  - 可调主题、键鼠/触屏、撤销无限次、自动保存
- **Android 数据(关键):**
  - **1,000,000+ 下载**
  - **4.8 star**,**16,500 评论**
  - Teacher Approved(教师认证)
  - 完全免费、无广告、纯开源
  - "No data shared with third parties / No data collected"
- **用户量/下载量:** **1M+ Android**(其余平台未公开),是 LITS 用户的天然聚集地
- **UI/UX 亮点:**
  - 极简、复古、C 风格 UI(GTK/原生主题)
  - "no time pressure" 是用户评价的高频词
  - 完全无干扰
- **变现方式:** **完全免费**(开发者抵制商业化,"will always be free, with no ads")
- **GameZipper 优势/差异化机会:**
  1. **作者明确表示 LITS 不在计划中**,GameZipper 完全可以做"LITS 接班人"角色
  2. **Simon Tatham 用户群已存在**("LITS 能不能加进 ST?" 是 Reddit r/puzzles 上的常见问题),可定向拉新
  3. **未提供每日挑战 / streak**,是 GameZipper 大胆补的缺失位
  4. **无 dark / 霓虹主题**,可做"Pixel Neon"差异化皮肤
  5. **未提供 iOS 端**,iOS 端 LITS 移动市场依然空缺
  6. **无云存档**,GameZipper 可以做"邮箱/Google 账号登录 -> 跨设备进度"

---

## 6. Brennerd 的逻辑解谜系列(最像 GameZipper 应做的形态)

- **开发者:** Brennerd(独立开发者,波兰裔)
- **Google Play 作品:**
  - `com.brennerd.grid_puzzle.suguru` ,Suguru(4.8 star)
  - `com.brennerd.grid_puzzle.tango` ,Binary Twist(4.6 star)
  - `com.brennerd.grid_puzzle.kuromasu` ,Kuromasu(4.7 star)
  - `com.brennerd.grid_puzzle.hashi` ,Hashi(4.x star)
- **核心特性(取自 Suguru / Binary Twist 描述):**
  - 每个应用做**单一 Nikoli 变体**,垂直做深
  - 离线 + 每日挑战 + streak
  - 多尺寸、多难度
  - 极简 UI(白底 / 黑色 grid)
- **用户量/下载量:** 单应用估算 50K-500K(brennerd 不是明星开发者)
- **UI/UX 亮点:** 单类型极致打磨、Material 3 风格、轻量
- **变现方式:** Google AdMob(横幅 + 插屏)+ 一次性去除广告
- **GameZipper 优势/差异化机会:**
  1. **brennerd 也没做 LITS**,再次确认 LITS 移动空缺
  2. brennerd 的产品**不带 daily/weekly theme**,可加
  3. **不做 PWA**,只做 Android
  4. **brennerd 的 UI 是教科书级 Nikoli-style**,GameZipper 的"dark + neon"是反 Nikoli 的视觉差异化
  5. **小厂没有 PWA/Web**,GameZipper 一次发布可以 Web/Android/PWA 全覆盖

---

## 7. Conceptis Puzzles(Hashi / Nurikabe 移动端最成功的商业化 Nikoli)

- **URL:** https://www.conceptispuzzles.com/
- **核心特性:** Hashi、Slitherlink、Kakuro、Nurikabe 等 Nikoli 变体的**付费 / 订阅**版本
  - **未做 LITS**
- **用户量/下载量:** 单应用 1M+ 下载
- **变现方式:** 一次性 $1.99-$4.99 + 订阅
- **UI/UX 亮点:** 跨平台、杂志风格、Hints 付费解锁
- **GameZipper 优势/差异化机会:**
  1. Conceptis 风格非常"杂志感"、保守;GameZipper 霓虹/赛博风是反潮流
  2. Conceptis 价格门槛是 GameZipper 免费的天然对立,需要用"无限免费 + 一次性去广告"赢
  3. Conceptis 的 Hint 系统是付费的,GameZipper 可以用广告解锁 hint

---

## 8. gmpuzzles.com(GM Puzzles / The Art of Puzzles)

- **URL:** https://www.gmpuzzles.com/blog/lits-rules-and-info/
- **作者:** Serkan Yurekli(GM)/ Thomas Snyder / Grant Fikes / Prasanna Seshadri / Murat Can Tonta
- **核心特性:**
  - 110 篇 LITS 主题博文(按周发布 1-2 个 LITS 题,PDF 可下载)
  - 含规则、视频、PDF、Discord
  - Tip Jar / Patreon / E-book 商店
  - LITS 数量在 Shading 分类下是**第二位**(仅次于 Tapa 203 篇)
- **用户量/下载量:** 估算 50K-100K 月访问(PDF 订阅是商业核心)
- **UI/UX 亮点:** 资深逻辑玩家 / WPC 选手级别、含变体解法分析
- **变现方式:** Patreon + E-book 商店
- **GameZipper 优势/差异化机会:**
  1. **内容生态而非游戏本身**,可以合作 / 转载 PDF(经许可)
  2. **GM Puzzles 用户群就是高质量 LITS 玩家来源**,可定向拉新
  3. **没有解谜工具**(只有 PDF/PNG/penpa-edit),GameZipper 提供"画板 + 自动校验"可补缺

---

## 9. GitHub 上的 LITS 求解器与生成器

**关键发现:** GitHub 上 LITS 相关 repo 几乎全是**学生 AI 课程作业**(0-2 star 居多),无成熟库。

代表性 repo(GitHub API 搜索 `LITS solver` + `Nuruomino` 排名):

| Repo | star | 语言 | 说明 | 价值 |
|---|---|---|---|---|
| `puzz.link/robx/pzprjs` | 87 | JS/TS | LITS 编辑器 + 求解(生产级) | **借鉴主源** |
| `x-sheep/pzprjs` (已合并) | - | JS/TS | 现代 fork | 参考 |
| `pedroMVicente/nuruomino-solver` | 1 | Python | 约束传播 + 多 AI 搜索 | 教学 |
| `migpovrap/NuruominoSolver` | 1 | Python | AI 课作业 | 教学 |
| `biiab/AI-nuruomino-solver` | 0 | Python | DFS + backtracking | 教学 |
| `Monteir016/Nuruomino_IA` | 0 | Python | conflict-directed backjumping | 教学 |
| `RodrigojndSantos/ai-nuruomino-solver` | 0 | Python | state-space search | 教学 |
| `Ketki916/LITS-solver-algorithm` | 1 | Python | 未描述 | 教学 |
| `alopes0905/AI-Nuruomino-Solver` | 0 | Python | search + pruning | 教学 |
| `MiguelitoM/Nuruomino-Solver-LITS` | 0 | Python | AI class 2025 | 教学 |
| `robot-mazeee/Automatic-LITS-Puzzle-Solver` | 0 | Python | AI solver | 教学 |
| `jameswmccarty/lits_puzz` | 0 | Python | 针对 puzzle-lits.com 的反向求解 | 启发 |

> **结论:** **无成熟商用 LITS 生成器**,GameZipper 需要自己实现"无限随机生成 + 解唯一性"(可基于 DLX / Z3 SAT,参考 Biro-Schmidt 论文用 CSP 表示)。

- **UI/UX 亮点:** N/A(多为 CLI)
- **变现方式:** 无
- **GameZipper 优势/差异化机会:**
  1. **DLX / SAT 解算自研**(参考 jameswmccarty 的代码作为原型),puzzle-lits.com 的随机生成是弱项,GameZipper 可做"每天 5 关困难 LITS 唯一解"
  2. **可把生成器打包为 WebAssembly 离线库**,离线游戏不靠后端

---

## 10. 浏览器聚合平台(poki.com / crazygames.com / itch.io)

- **poki.com:** 搜索 LITS **0 命中**(已确认 /en/search/lits 无结果)
- **crazygames.com:** 搜索 LITS **0 命中**
- **itch.io:** 搜索 LITS puzzle,**0 命中** LITS 真游戏(结果全是法语 "des lits pour eux" / 英文 "Light in the Shadow" 等同名异义)
- **结论:** **所有浏览器游戏聚合站都没有 LITS**,意味着 LITS 在 HTML5 浏览器市场也是空白

> **GameZipper 机会:** 在 poki / crazygames / y8 / kizi / friv 等聚合站无任何 LITS 竞品。GameZipper 若上架到这些站,可以**独家获取这批用户的 puzzle 搜索 query**。

---

## 11. 其他 WPC 相关资源

- **WPC unofficial wiki:** https://wpcunofficial.miraheze.org/wiki/LITS
  - 收录 LITS+(Robert Vollmert)、Inverse LITSO(Bram de Laat)等变体
  - 列出 WPC 2014/2016/2017/2018/2019/2022/2023 历年 Round 中的 LITS
  - 资深玩家来源
- **Tapa 求解器模式参考:** LITS 与 Tapa / Nurikabe 规则链相似,可借鉴它们的实现
- **Penpa-edit (https://penpa-edit.firebaseapp.com/):** 在线画板(含 LITS 模板),非游戏但被 LITS 高手重度使用

---

## 12. 移动/网页端的"假 LITS"市场(Tetris-like 区块拼图)

| App | 评分 | 真实 LITS? | 备注 |
|---|---|---|---|
| Tangle Master 3D (Rollic) | 4.41 star / 384K | 否 | 拉绳解谜,霸榜 100M+ |
| Blockudoku (Easybrain) | 4.5 star | 否 | 块拼图 |
| BlockPuz (HDuo) | 4.8 star | 否 | 块拼图 |
| Polygrams - Tangram Puzzles (Norma Kohn) | 4.65 star / 4K | **部分**(七巧板/多连块) | 与 LITS 思维最接近 |
| Tangram Block Puzzles (Wixot) | 4.05 star | **部分** | domino/tromino/tetromino/pentomino |
| 18 一大堆 Block Puzzle | 3.8-4.8 star | 否 | 都与 LITS 无关 |

- **市场规模(对比):**
  - Block Puzzle 类目总下载量估算 **5 亿+**(Easybrain Blockudoku 单应用 100M+)
  - LITS 专项下载量估算 **< 50K**(仅 puzzle-lits.com iOS + 极少数小众 app)
- **GameZipper 机会:** LITS 与 Block Puzzle 完全不同的解法(无操作/纯推理),但 LITS 用户会与 Block Puzzle 用户**少量重叠**(轻度移动玩家)。不建议直接争 Block Puzzle 市场,定位"中重度逻辑玩家"更准确。

---

## 13. 核心特性横向对比矩阵

| 维度 | Nikoli | puzzle-lits.com | puzz.link | Simon Tatham (mobile) | Brennerd | **GameZipper 目标** |
|---|---|---|---|---|---|---|
| 完整 LITS 规则 | yes | yes | yes | no(不含) | no | yes |
| 5 尺寸 (6-20) | no | yes | yes | N/A | N/A | yes |
| 难度档 (Easy/Hard) | no | yes | yes | yes(size=difficulty) | yes | yes |
| 每日挑战 | no | yes | no | no | 部分 | yes |
| 排行榜 / Hall of Fame | no | yes | no | no | no | yes |
| Statistics(用时/胜率) | no | yes | no | no | 部分 | yes |
| 撤销/重做 | no | yes | yes | yes | yes | yes |
| 错误高亮 / 提示 | no | yes | yes | no | no | yes |
| Tutorial / 互动教学 | no | no | no | yes(all 40) | 部分 | yes(3 关) |
| iOS | no | yes | yes(web) | no | no | yes (PWA) |
| Android | no | no | yes(web) | yes(1M+) | yes | yes (PWA + TWA) |
| 离线模式 | N/A | 部分 | yes(编辑器) | yes | yes | yes (PWA cache) |
| 多语言 (含 zh-CN) | ja/en | 50+ | Weblate 翻译 | 多语言 | en | zh-CN 优先 |
| 自动生成(无限局) | no | yes | yes | yes | yes | yes |
| 解唯一性保证 | N/A | no | no | yes | yes | yes(DLX) |
| 移动友好 / 触屏 | no | yes | no(密集小按钮) | yes | yes | yes(大按钮) |
| 主题(暗/亮/霓虹) | no | yes | no | yes | no | yes(霓虹招牌) |
| 成就 / Streak | no | no | no | no | no | yes |
| 分享结果卡(可读) | no | yes | yes(链接) | no | no | yes(带 URL + 缩略图) |
| 广告变现 | no | yes | no | no | yes | yes (Monetag) |
| 付费去广告 / 一次性 | no | yes | no | no | yes | yes(可选) |
| PWA / installable | no | no | no | no | no | yes |
| SEO 内容(H2P/FAQ) | 部分 | 部分 | no | yes | no | yes(GameZipper house style) |

---

## 14. GameZipper 的差异化策略(综合建议)

### 14.1 视觉与品牌差异化
- **GameZipper 招牌的 "Dark + Neon" 主题** vs puzzle-lits.com 老派白底、puzz.link 极简灰、Simon Tatham 原生 C 风格,这是 GameZipper 立刻能立住的视觉品牌
- **SVG 粒子动画**:LITS 4 种 tetromino 配色用 L=青 / I=紫 / T=粉 / S=橙 + 边描深色霓虹光晕
- **完成时拼接"完成图"动画**:所有 tetromino 拼成 GameZipper logo(参考 NYT Games 完成动画)

### 14.2 玩法差异化
1. **"Streak Mode"**:连续完成每日 LITS 30 天解锁特殊皮肤(参考 NYT Games streak)
2. **"Hint-by-Hint" 渐进提示**:第一关只提示 1 个 tetromino 位置,第二关给边界推理,第三关给一半解,渐进教学法
3. **"Daily LITS 5 关一卷"**:每天 1 关易 + 1 关中 + 1 关难 + 1 关专家 + 1 关 community submitted(用 DLX 自动校验)
4. **"Puzzle of the Week"**:与 GM Puzzles 合作(or 转载经授权的 PDF)
5. **"Time Trial"**:限时 3 分钟完成 Hard 10x10,进 leaderboard
6. **"Penpa-edit 风格画板"**:玩家自己出题 -> 自动生成题号 -> 分享链接(参考 puzz.link p?lits 但加 PWA 离线保存)

### 14.3 技术差异化
- **DLX / Z3 自研 LITS 生成器 + 解唯一性保证**,puzzle-lits.com 没有此保证,常出现"多解"
- **WebAssembly 离线生成器**,不依赖后端,PWA 体验原生
- **Open Graph / 移动 share sheet / shareable result card**,便于社交裂变
- **GameZipper house 风格 H2P + FAQ + Tips + JSON-LD schema.org**,SEO 直接拿搜索流量
- **每日 localStorage 自动存档 + 可选 cloud save**(与 GameZipper 已有账户系统打通)

### 14.4 内容与生态
- **多语言优先 zh-CN**:Nikoli 官方无中文,puzz.link 翻译进度低;中文 LITS 玩家是**完全空白市场**
- **下载 paper PDF**(打印纸笔卷),吸引纸笔派 + 与 Penpa-edit 用户群交叉
- **Discord 频道**集成 GM Puzzles / puzz.link 社区

### 14.5 变现策略
- **阶段 1 (0-50K MAU):** 100% 免费 + Monetag 横幅/插屏(参考 puzzle-lits.com 路径但更克制)
- **阶段 2 (50K-500K):** 引入"去广告一次性 $1.99"+"Streak Pass 季卡 $0.99" 双轨
- **阶段 3 (500K+):** 与 GM Puzzles 合作出付费 LITS 书籍(实体 + 数字版)
- **不模仿对象:** puzzle-lits.com 的"Patreon 强制去广告",GameZipper 保持 ad-supported free 才是规模化路径

### 14.6 避免陷阱
- **不要做"Tetris-like 块拼图"**,市场已被 Easybrain/Rollic 锁死,新进入者零空间
- **不要试图做"百种 Nikoli 集合"**,puzz.link / pzv.jp / Brennerd / Conceptis 已饱和,做"单点 LITS 最深"
- **不要做"严苛纸笔感" UI**,puzz.link/pzv.jp 已服务该群体,GameZipper 反潮流做"霓虹+流畅动画"

---

## 15. 市场规模速估

| 指标 | 估计值 | 依据 |
|---|---|---|
| 全球 LITS 专项玩家 | 30K-200K 活跃 | puzzle-lits.com 790 万+ Puzzle ID(去重后)+ puzz.link 嵌入分享 + GM Puzzles 订阅 |
| Google Play "LITS puzzle" 关键词搜索量 | 极低(< 1K/月) | 0 LITS 命中结果 |
| "Nuruomino" 搜索量 | 极低 | 0 命中 |
| 邻近市场(logic puzzle / 区域着色)下载量 | Easybrain 类 1 亿+ / Brennerd 类 50K-500K / 单应用 | 类目参考 |
| LITS 移动端预期(CAGR 假设) | 第一年 5K-20K、第二年 50K+ | 空白市场 + Reddit r/puzzles 高频问"LITS 移动 app" + puzz.link 用户转化 |
| iOS 端 LITS 预期 | 10K-40K | puzzle-lits.com iOS 用户迁移 + 新增 |
| Web/PWA 端 LITS 预期 | 50K-200K MAU | GM Puzzles 玩家 + puzz.link 玩家 + Reddit 玩家 |

> **结论:** LITS 是个**小而美**的细分市场(NP-complete 但规则简单),从 0 到 1 的 Mobile + Web 端基本没有强势守门员。GameZipper 立项 LITS 的 ROI 高度依赖**"iOS PWA 突破 puzzle-lits.com 留下的空缺"** + **"中文 LITS 玩家 0 服务的先发位"**。

---

## 16. 立项推荐

**推荐度:** ★★★★☆(高 / 建议立项)

**理由:**
1. **市场空白**:移动端 LITS 专项 App 完全空缺,竞品 puzzle-lits.com 仅 iOS + 老派 UI
2. **技术门槛中等**:规则 4 条,但生成器+唯一性校验需要 DLX/SAT 自研(可参考 pzprjs / Biro-Schmidt 论文)
3. **品牌适配**:GameZipper 的"dark + neon + 流畅动画"在 LITS 全部竞品中无对手
4. **国际化机会**:中文 LITS = 0 服务(Nikoli/puzz.link/puzzle-lits.com 都没有完善的中文版)
5. **聚合站空白**:Poki / CrazyGames / Y8 / itch.io 上 0 个 LITS 游戏,独家占据搜索流量
6. **广告变现清晰**:Monetag 在 logic puzzle 上的 RPM 约 $0.5-$2(参考 puzzle-lits.com 已验证)

**优先级:**
- P0:Web/PWA 版(IndexedDB 离线 + dlx 自研生成 + Daily LITS + Streak)
- P1:移动优化(PWA install + TWA)+ iOS 体验打磨
- P2:每日 / 每周 / 每月多题 + 排行榜 + 分享卡
- P3:变体(LITS+ / Inverse LITSO)扩展 + GM Puzzles 合作

---

## 17. 引用与一手资料

- Nikoli 官方:https://www.nikoli.co.jp/en/puzzles/lits/
- Wikipedia:https://en.wikipedia.org/wiki/LITS
- WPC unofficial wiki:https://wpcunofficial.miraheze.org/wiki/LITS
- Biro and Schmidt 复杂度论文:https://itn-web.it.liu.se/~chrsc91/papers/norinori-lits.pdf
- puzzle-lits.com:https://www.puzzle-lits.com/
- puzz.link LITS editor:https://puzz.link/p?lits
- pzprjs GitHub:https://github.com/robx/pzprjs (87 star/53 fork,4,372 commits)
- pzv.jp(原始 pzprjs 站):http://pzv.jp/
- Simon Tatham Collection:https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- Simon Tatham Puzzles Android:https://play.google.com/store/apps/details?id=name.boyle.chris.sgtpuzzles (1M+ 下载)
- Brennerd 开发者:https://play.google.com/store/apps/dev?id=8561627712988162085
- GM Puzzles LITS:https://www.gmpuzzles.com/blog/lits-rules-and-info/ (110 篇)
- 截屏:puzzlink-lits-editor.png(已附本目录)
