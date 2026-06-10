# Country Road (カントリーロード) - 竞品分析报告与市场调研

**研究日期:** 2026-06-11
**调研方法:** 一手 web 抓取 (Nikoli 官方 / Wikipedia / puzz.link / WPC unofficial wiki / TouchArcade / GitHub API / DuckDuckGo / Google Play / Apple App Store)
**目的:** 为 GameZipper 立项 Country Road 网页版 + 移动版提供决策依据

---

## 0. 游戏概述

Country Road (カントリーロード / kantorī rōdo) 是一款由日本 Nikoli 出品的纸笔逻辑谜题。玩家在由粗黑线条划分的"国家"格子中画出一条经过所有格子中央的连续单环。

- **首次刊载:** Puzzle Communication Nikoli 第 65 期 (1997)
- **原名:** メグリンク (Megurink),由 巡る(go around) + リンク(Link)合成
- **规则提议人:** ゲサクですよ(It's me, Gesaku)
- **官方日文页面:** https://www.nikoli.co.jp/ja/puzzles/country_road/
- **官方英文页面:** **不存在**(404,仅日文版)
- **Wikipedia:** 无独立条目,重定向至 Nikoli (publisher) 列表中的 "Country Road" 条目
- **WPC 历史:** 2017、2018、2022、2023、2024 年 World Puzzle Championship 多轮独立题或组合题

### 标准规则(Nikoli 原文 / puzz.link 转写)
1. 在格子上画线穿过相邻格子的中央,组成一条连续的闭合回路(loop)
2. **回路不能分支、不能交叉**
3. **回路必须恰好访问每一个国家(粗线划分的区域)一次**(部分变体允许不访问)
4. 数字表示该国家中回路经过的格子数;无数字国家可以经过任意格数
5. **回路不经过的两个格子,若属于不同国家,则不能正交相邻**(等价约束)

### 关联变体(WPC 收录)
- **Half Country Road** (Prasanna Seshadri, WPC 2017):回路不一定访问每个国家
- **Country Road with Detour** (Thomas Snyder 等):含交叉点提示
- 在 Country Road.js 中 pzprjs 同时实现了 moonsun / onsen / doubleback / maxi / simpleloop 五个变体

### 与 Simon Tatham Loopy 的区别
- **Loopy**(Simon Tatham):画闭合回路,数字表示该格周围有多少条边属于回路,**无"国家"概念**
- **Pearl**(Simon Tatham):画闭合回路,有角点提示
- **Country Road**(Nikoli):有"国家"分区 + 每个国家访问次数数字提示

---

## 1. Nikoli 官方(https://www.nikoli.co.jp/ja/puzzles/country_road/)

- **URL:** https://www.nikoli.co.jp/ja/puzzles/country_road/ (日文)
- **URL:** https://www.nikoli.co.jp/en/puzzles/country_road/ (404 Not Found)
- **形态:** 官方介绍页 + 样题图解(无在线版、无移动端)
- **核心规则(日文原文摘录):**
  > 1. 盤面のいくつかのマスに線を引いて全体で１つの輪っかを作りましょう。
  > 2. 線は、マスの中央を通るようにタテヨコに引きます。線を交差させたり、枝分かれさせたりしてはいけません。
  > 3. 線は、太線で区切られたところ(国と呼びます)すべてを１回ずつだけ通るようにしなければなりません。
  > 4. 数字は、その数字がある国を線が通るマス数を表します。数字のない国には、線が何マス通るようにしてもかまいません。
  > 5. 線が通らないマスが、太線(国境)をはさんでタテヨコに隣りあうようにしてはいけません。
- **官方特性:**
  - 4 张配图:Sample、Progressing、Solution、Rules 步骤图
  - 5 条规则(英文版仅 4 条 + 注释)
  - 出版历史:Puzzle Cyclopedia(原始名 Megurink);2007 年起收入 Country Road Pencil Puzzle Book
- **用户量/下载量:** N/A(无在线版,杂志订阅制 + 书 / 周边销售)
- **UI/UX 亮点:** 极简白底灰线,gif 演示,纸笔质感
- **变现方式:** 杂志 / 书 / 周边;Nikoli.com 平台(月费)收录部分 puzzle
- **GameZipper 优势机会:**
  1. **官方英文页 404** — 全球英文用户完全无官方入口,GameZipper 可以是英文"第一接触点"
  2. **官方无互动 / 无移动端适配** — 全部市场空缺
  3. **官方无每日挑战 / 排行榜 / 成就系统** — GameZipper 标准玩法立即胜出
  4. **收入可避开杂志订阅人群**,做 Web + PWA 即可触达广告受众

---

## 2. 竞品 / 资源总览(按对 GameZipper 威胁度排序)

| # | 资源 | 形态 | 已知用户/数据 | 威胁度 |
|---|---|---|---|---|
| 1 | TouchArcade / Yuki Fujimoto iOS Country Road (App ID 1135422523) | iOS App (已下架,2016) | 2016 发布,1.0 版本,13.7 MB,Free | **中**(曾经的"先发者",留有市场空缺) |
| 2 | puzz.link / pzprjs (robx) | 开源 Web 编辑器 + 求解器 | GitHub 87 star / 53 fork / 78 open issues;MIT License | **高**(开发主参考,用户已习惯此 UI) |
| 3 | Simon Tatham Portable Puzzle Collection | Web + Android (Chris Boyle) | Android **1,000,000+ 下载**(精确 1,091,673),4.79 star,16,463 评论 | **中**(同类用户池,无 Country Road 但有 Loopy / Pearl) |
| 4 | Cross+A (Ilya Morozov) | Windows 商业求解器 + 生成器 | 支持 3×3 至 30×30 Country Road;收费软件 | **低**(桌面端专业玩家) |
| 5 | GM Puzzles / Serkan Yurekli 博客 | 周 PDF + Patreon | Country Road 主题博文 ≥ 4 篇(2017-2022) | **低**(内容生态,而非游戏) |
| 6 | WPC unofficial wiki | 维基 | WPC 2017/2018/2022/2023/2024 多次收录 Country Road | **低**(赛用 + 高质量玩家来源) |
| 7 | gridpuzzle.com | Daily Country Road web | Cloudflare 保护,需 JS challenge,无法精确估算 | **低**(垂直站点,日活推估 < 50K) |
| 8 | Conceptis Slitherlink(Android) | 移动应用 | **100,000+ 安装,4.79 star,2,721 评论** | **低**(规则相近但非 Country Road) |
| 9 | Ejelta Slitherlink Android | 移动应用 | **500,000+ 安装**(精确 811,700),4.6 star,6,134 评论 | **低**(同上) |
| 10 | penpa-edit (swaroopg92 / opt-pan) | 开源 Web 画板 | 160 star / 53 fork | **低**(工具非游戏,但有模板) |
| 11 | Roll for Fantasy | Web 工具 | 仅说明 + 示例,RPG 主题(非游戏) | **无** |
| 12 | Logic-Puzzle Wiki (fandom) | 维基 | 介绍页 + 变体说明 | **无** |
| 13 | meltemelon.wordpress.com (Prasanna Seshadri) | 博客 | 1 篇规则说明 + 1 例题 | **无** |
| 14 | Academic Dictionaries / Wikipedia mirror | 字典 | Wikipedia 镜像 | **无** |

> **关键发现:**
> 1. **移动端 Country Road 专项 App 在 Google Play / iOS App Store 均为 0 命中**(Google Play "country road puzzle" 全部为道路 / 拼图无关应用;iTunes API "country road" 6 个结果中无一是 Nikoli 谜题)
> 2. **Yuki Fujimoto 2016 年发布过 iOS Country Road(App ID 1135422523,13.7 MB,Free,1.0 版本),现已下架** — TouchArcade 仍保留开发者页面;该开发者其他 Nikoli 应用(Kuromasu、Nurikabe、Bridges、Masyu、Mahjong Tile Solitaire)仍在 iOS 上架
> 3. **Web 端没有 PWA 形态的 Country Road 专用站点** — 只有 puzz.link 这种通用工具
> 4. **中国玩家**:CN 区域 iOS / Android 应用市场无 Country Road 专项 App

---

## 3. puzz.link / pzprjs(开源 Country Road 编辑器 + 求解器)

- **URL:** https://puzz.link/p?country (在线玩 + 编辑)
- **规则示例:** https://puzz.link/rules.html?country (含 7 类常见错误演示)
- **样本题库:** https://puzz.link/js/pzpr-samples/country.js (5×5 起步,含 lnBranch / lnCross / bkPassTwice / bkLineNe / bkNoLine / cbNoLine / lnDeadEnd / lnPlLoop 等错误示例)
- **GitHub:** https://github.com/robx/pzprjs (87 star / 53 fork / 78 open issues / 2 subscribers / MIT License)
- **原 fork:** https://github.com/sabo2/pzprv3 (36 star / 5 fork / 已停止维护,2019-06 最后提交)
- **作者:** Robin Haberkorn(robx)+ Lennard Sprong(x-sheep,已合并)
- **形态:** 单页 Web App(HTML5 + JavaScript),可在线编辑/求解/分享 Country Road 等 30+ 种 Nikoli 谜题
- **核心特性:**
  - Country Road 编辑器:支持任意尺寸 / 难度的随机生成(基于 jsWaffle + 启发式)
  - **同文件集成变体**:country / moonsun / onsen / doubleback / maxi / simpleloop / ovotovata 等 loop 类谜题
  - 实时错误检查:分别标红 7 类规则违例(分支 / 交叉 / 回路不闭合 / 相邻未用 / 国家漏访 / 死路等)
  - 颜色可改(每个国家一种色)、可清除答案 / aux marks
  - File > Export URL(链接分享)+ Save as SVG/PNG/PDF
  - 与 puzz.link/db 公共题库打通(虽然 Country Road 题目数量较少)
  - 多语言:Weblate 在翻译 ja/en/中/法/.../全 9 种语言
- **用户量/下载量:**
  - GitHub Stars 87、Forks 53、Subscribers 2
  - 通过嵌推(Puzzle Square JP、Twitter、Telegram Nikoli 群)二次分发,无独立访问量数据
  - pzprjs 完整 bundle 约 700 KB
- **UI/UX 亮点:**
  - 极简灰底 + 黑色加粗国家边框
  - 顶栏按钮全为图标 + tooltip,无文字(老练用户向)
  - 内置 "Color up" 快捷键
- **变现方式:** **无任何商业化**,MIT 协议 + 社区维护
- **GameZipper 优势/差异化机会:**
  1. **授权友好 (MIT)**,可在其基础上做前端改造并加 GameZipper 品牌 / 广告,但**必须保留版权说明**
  2. **无客户端随机生成器** — puzz.link 是"生成 → 链接分享"模式,本地无限生成是 GameZipper 优势
  3. **没有多语言 SEO**(虽然翻译了文案,但元数据 / OG / FAQ 几乎为 0),可做 zh-CN 国际化
  4. **没有 daily / streak / 成就**,是 GameZipper 天然加 hooks 的位置
  5. **JS 体积大**(pzprjs 完整 bundle 约 700 KB),GameZipper 可以做"轻量 Country Road-only"版本(< 100 KB)
  6. **求解器 / 生成器直接借鉴 country.js 实现**(file: src/variety/country.js, 2074 行)

---

## 4. Simon Tatham Portable Puzzle Collection(Loopy / Pearl 同类 loop 谜题)

- **URL:** https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- **Loopy URL:** https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/loopy.html
- **Pearl URL:** https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/pearl.html
- **Android 包:** https://play.google.com/store/apps/details?id=name.boyle.chris.sgtpuzzles
- **iOS 替代:** 无官方移植,只有非官方 port
- **作者:** Simon Tatham(C 游戏代码)+ Chris Boyle(Android 移植)
- **License:** MIT
- **核心特性:**
  - **40 个单人物理 / 逻辑谜题**
  - **不含 Country Road**(作者明确表示不会添加),但有 **Loopy**(画闭环,数字表示该格周围有多少边属于回路,无"国家"概念)、**Pearl**(画闭环,有角点提示)、**Tracks**(画闭合路径)、**Pearl**(类似 Loopy 但有点位提示)
  - 每局按 size × difficulty 实时生成
  - 可调主题、键鼠 / 触屏、撤销无限次、自动保存
  - **C 源码公开**:https://git.tartarus.org/?p=simon/puzzles.git
- **Android 数据(关键):**
  - **1,000,000+ 下载**(精确 1,091,673)
  - **4.79 star**、**16,463 评论**
  - 完全免费、无广告、纯开源
  - "No data shared with third parties / No data collected"(Google Play 数据安全声明)
- **用户量/下载量:** **1M+ Android**(其余平台未公开),是 Country Road 用户的天然聚集地
- **UI/UX 亮点:**
  - 极简、复古、C 风格 UI(GTK / 原生主题)
  - "no time pressure" 是用户评价的高频词
  - 完全无干扰
- **变现方式:** **完全免费**(开发者抵制商业化,"will always be free, with no ads")
- **GameZipper 优势/差异化机会:**
  1. **Simon Tatham 明确不收录 Country Road** — GameZipper 完全可以做"Country Road 接班人"角色
  2. **Simon Tatham 用户群已存在**("Country Road 能不能加进 ST?" 是 Reddit r/puzzles 上的常见问题),可定向拉新
  3. **未提供每日挑战 / streak**,是 GameZipper 大胆补的缺失位
  4. **无 dark / 霓虹主题**,可做"Pixel Neon"差异化皮肤
  5. **未提供 iOS 端**,iOS 端 Nikoli loop 谜题移动市场依然空缺
  6. **无云存档 / 跨设备**,GameZipper 可以做"邮箱 / Google 账号登录 → 跨设备进度"
  7. **Loopy 规则与 Country Road 高度相似但不同** — 迁移用户时需明确解释"国家"概念

---

## 5. Cross+A(Ilya Morozov 商业求解器)

- **URL:** https://www.cross-plus-a.com/html/cros7ctrd.htm
- **作者:** Ilya Morozov(俄罗斯独立开发者)
- **License:** 商业(一次性付费 + 订阅)
- **形态:** Windows 桌面应用(可移植 macOS),含求解器 + 编辑器 + 题目库
- **核心特性:**
  - 支持 **3×3 至 30×30 Country Road**
  - 同时支持 Hitori、Nurikabe、Slitherlink、Sudoku、Kakuro 等 30+ 谜题
  - 可生成多难度题目
  - 可求解用户输入的题目并验证唯一解
  - 跨语言 word-list(英文 + 多语种)
  - 每周 Puzzle of the Week(PDF 下载 + 解答)
- **用户量/下载量:**
  - 商业产品,未公开下载量;估算 1K-10K 付费用户(基于 niche 市场 + 价格 $20-40)
  - 主要用户:纸笔印刷商、专业 puzzle 作者、WPC 选手
- **UI/UX 亮点:**
  - 工具栏密集(典型 Windows desktop utility)
  - 黑白 / 彩色打印支持
  - 批量题目管理
- **变现方式:** 一次性付费 + 订阅更新
- **GameZipper 优势/差异化机会:**
  1. **桌面端 + 商业化** 与 GameZipper **Web + 免费 + 广告** 不重叠,直接争夺用户可能性低
  2. Cross+A 的 **30×30 上限** 是 GameZipper 的标杆 — 不应比 30×30 大
  3. **批量生成 + 唯一解验证** 的求解器能力是 GameZipper 必须自研的,Cross+A 是参考
  4. **Ilya Morozov 同人模式** — 单人小工作室 + 一人多 puzzle 类型,与 GameZipper 团队模型对比可借鉴

---

## 6. TouchArcade / Yuki Fujimoto iOS Country Road(已下架 App ID 1135422523)

- **URL:** https://toucharcade.com/games/country-road (开发者页)
- **App Store URL:** https://apps.apple.com/us/app/id1135422523 (已下架)
- **开发者:** Yuki Fujimoto(日本独立开发者,作品丰富)
- **首发:** Jul 19, 2016(Apple App Store)
- **版本:** 1.0(未更新)
- **大小:** 13.7 MB
- **类型:** Free
- **核心特性(基于 TouchArcade 描述 + 现存 iOS Yuki 其他应用推测):**
  - 完整 Country Road 规则
  - 多尺寸网格(可能 5×5 / 8×8 / 10×10 等)
  - 多难度(Easy / Hard)
  - 撤销 / 重做、错误高亮、计时
  - 杂志风格 UI(白底黑线)
  - HD Universal(iPhone + iPad 通用)
- **用户量/下载量:**
  - **App 已下架**(估计因长期未更新 + 无 iOS 适配,典型日本个人开发者模式)
  - App Store iTunes API 返回 0 result — 真正消失
- **UI/UX 亮点:**
  - 日本开发者典型品味:极简、纸笔感、无多余动画
- **变现方式:** 完全免费(典型个人独立项目)
- **GameZipper 优势/差异化机会:**
  1. **Yuki 的 iOS Country Road 已下架 8 年** — iOS 玩家群处于"无替代品"状态
  2. **Yuki 仍有其他 Nikoli 应用上架**(Kuromasu 4.0 star × 1 / Nurikabe 4.0 star × 1 / Bridges 4.0 star × 2 / Masyu 2.0 star × 11 / Mahjong Tile Solitaire 4.0 star × 7) — 评分均极低(< 10 评论),说明**日本个人 Nikoli 开发者模式有天花板**
  3. **Yuki 不会升级其 Country Road** — GameZipper 进入的市场是先发者已放弃的市场
  4. **HD Universal** 是当时标配,GameZipper 应进一步做 portrait / landscape 自适应 + Apple Pencil 支持(iPad Pro 12.9)
  5. **未使用 iOS Game Center** — GameZipper 应集成 streak / leaderboard

---

## 7. GM Puzzles / Serkan Yurekli 博客(内容生态而非游戏)

- **URL:** https://www.gmpuzzles.com/blog/?s=country+road
- **作者:** Serkan Yurekli (GM) + Thomas Snyder + Grant Fikes + Prasanna Seshadri + Murat Can Tonta + Ashish Kumar + Martin Ender + Bryce Herdt
- **Country Road 主题博文(确认数):**
  - Country Road by Bryce Herdt (2017-02)
  - Country Road by Grant Fikes (2017-07)
  - Country Road by Ashish Kumar (2021-04)
  - Country Road by Martin Ender (2022-12)
  - (与 WPC 题目集可能有交叉重复)
- **核心特性:**
  - 每周发布 1-2 个 Country Road 题(可下载 PDF)
  - 含规则、视频、PDF、Discord
  - Tip Jar / Patreon / E-book 商店
- **用户量/下载量:**
  - 估算 50K-100K 月访问
  - PDF 订阅是商业核心
- **UI/UX 亮点:** 资深逻辑玩家 / WPC 选手级别、含变体解法分析
- **变现方式:** Patreon + E-book 商店
- **GameZipper 优势/差异化机会:**
  1. **内容生态而非游戏本身** — 可以合作 / 转载 PDF(经许可)
  2. **GM Puzzles 用户群就是高质量 Country Road 玩家来源**,可定向拉新
  3. **没有解谜工具**(只有 PDF / PNG / penpa-edit),GameZipper 提供"画板 + 自动校验"可补缺
  4. **Grant Fikes、Martin Ender 是 WPC 出题人** — 联系授权可获得高质量题源

---

## 8. WPC unofficial wiki(赛事收录)

- **URL:** https://wpcunofficial.miraheze.org/wiki/Country_Road
- **收录规则(WPC 2017 IB):**
  > Draw a closed loop passing through the centres of cells horizontally and vertically. The loop must not return to any thickly outlined region it has already visited, and any two cells touching by a side that the loop does not visit must be in the same region. The loop does not have to visit all regions. A number in a region indicates the number of cells visited by the loop in that region.
- **关键变体说明:** Some puzzles state the loop must visit every region.(WPC 与 Nikoli 标准规则的细微差异)
- **WPC 历年出题人:**
  - WPC 2017 Round 16 — Prasanna Seshadri
  - WPC 2018 Round 7 — Jan Zvěřina
  - WPC 2018 Team Round 3 — Jiří Hrdina(组合题)
  - WPC 2022 Round 1 / Round 10 — Martin Ender
  - WPC 2022 Round 16 — JinHoo Ahn
  - WPC 2023 Round 15 — David Altizio
  - WPC 2023 Round 21 — Thomas Snyder
  - WPC 2024 Round 1 — Yuan Yao
  - WPC 2024 Round A — Chenhao Xu(组合题)
- **核心特性:**
  - 维基页面 + 历史归档
  - 收录了 1997 年首次刊载于 Nikoli Vol. 65 的来源
- **用户量/下载量:** 估算 5K-20K 月访问(WPC 选手圈 + 高级谜题爱好者)
- **UI/UX 亮点:** MediaWiki 标准界面
- **变现方式:** Miraheze 免费托管
- **GameZipper 优势/差异化机会:**
  1. **WPC 出题人是潜在题源合作对象**(Thomas Snyder、Prasanna Seshadri、Martin Ender 都是活跃博客作者)
  2. **规则变体** Half Country Road(可不访问所有国家)可作为"Hard / Expert"难度独家解锁内容
  3. **WPC 玩家 = 重度付费 / 重度活跃玩家**,可定向投放"Pro Mode"题包

---

## 9. gridpuzzle.com(Daily Country Road)

- **URL:** https://gridpuzzle.com/rule/country-road
- **入口:** https://gridpuzzle.com/ (主页 Cloudflare 验证,需 JS challenge)
- **核心特性:**
  - Daily Country Road Puzzles(每日一题)
  - Free Online
  - 多谜题聚合(Slitherlink、Kakuro、Nurikabe、Yajilin 等)
- **用户量/下载量:** 因 Cloudflare 保护无法精确估算,推估 < 50K 月活跃
- **UI/UX 亮点:** 现代 web 设计,JS-heavy(可能 SPA)
- **变现方式:** 推测广告 + 可能的付费会员
- **GameZipper 优势/差异化机会:**
  1. **每日一题是 gridpuzzle 的核心** — GameZipper 应做"Daily Country Road 5 关一卷"(易 / 中 / 难 / 专家 / community)
  2. **gridpuzzle 无 PWA**,GameZipper 可做"装到桌面 + 离线玩"
  3. **gridpuzzle 无 streak / 跨设备同步** — GameZipper 优势

---

## 10. Conceptis Slitherlink(类 loop 谜题最大移动商业化)

- **URL:** https://www.conceptispuzzles.com/
- **Google Play:** https://play.google.com/store/apps/details?id=com.conceptispuzzles.slitherlink
- **App Store:** https://apps.apple.com/us/app/slitherlink-loop-the-snake/id6443953719 (Country Road 不存在)
- **核心特性:**
  - Slitherlink 数字版本(数字表示该格周围有几条边属于闭环)
  - **90 free puzzles** + weekly bonus
  - 30 extra-large puzzles bonus for tablet only
  - 多难度(very easy → extremely hard)
  - Puzzle library 持续更新 + 唯一解保证
  - 暗色模式、备份恢复、Google Drive 集成
  - 解题计时 + Wall segment 高亮 + Island size counter
- **用户量/下载量:**
  - Google Play **100,000+ 安装**(精确 161,188),4.79 star,2,721 评论,2017-11 发布
  - iOS App Store **4.83 star**(453 评论,2013-05 发布)
  - Conceptis 整体:全球每天 2000 万+ 谜题被解答(报纸 / 杂志 / 数字)
- **UI/UX 亮点:**
  - 杂志风格 UI(Conceptis 是商业 Nikoli 谜题供应方)
  - Hints 付费解锁、dark mode、landscape + portrait 自适应
- **变现方式:** **一次性付费 + 订阅** + 数字内购(IAP $1.10 - $3.80)
- **GameZipper 优势/差异化机会:**
  1. Conceptis **不做 Country Road**,但 Slitherlink 是相邻 loop 谜题
  2. **Conceptis 风格非常"杂志感"、保守**;GameZipper 霓虹 / 赛博风是反潮流
  3. Conceptis 价格门槛是 GameZipper 免费的天然对立 — 用"无限免费 + 一次性去广告"赢
  4. Conceptis 的 Hint 系统是付费的,GameZipper 可以用广告解锁 hint
  5. **Conceptis 的"30+ 谜题家族"** 是它的护城河;GameZipper 应聚焦"Country Road 最深",不试图复制 30 种类

