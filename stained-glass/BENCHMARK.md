# Stained Glass 拼图游戏 — 竞品 Benchmark 报告

调研日期：2026-06
目标产品：Stained Glass（gamezipper.com 旗下）
定位：以「图着色 + 数字约束」为核心的治愈系逻辑拼图游戏

==============================================================
一、竞品列表（按相关性排序，至少 5 个核心竞品）
==============================================================

## 1. The Artisan of Glimmith（最直接竞品，必看）
- 平台：Steam（AppID 4160210），桌面 / Steam Deck 已验证
- 价格：付费买断制（约 $9.99 USD）
- 核心玩法：将染色玻璃网格中的每个区域涂上颜色，相邻区域颜色不同，
  同时满足预设的数字约束（数字 = 区域必须使用的颜色编号）
- 玩点：纯粹的"色彩 + 数字 + 邻接"逻辑题，画面极简治愈
- 差异化卖点：手绘艺术风格、剧情驱动、放松型逻辑谜题
- 营销表现：TikTok / YouTube Shorts 病毒式传播（#theartisanofglimmith，
  单条视频百万播放量），被多家媒体评为 "satisfying puzzle"
- 我们的差异：尚未发现同类型有数字约束规则的纯逻辑 App，
  Artisan 是"解谜感"，我们要做"造景感 + 闯关结构"

## 2. Glass Masquerade 4: Constellations（艺术 jigsaw 竞品）
- 平台：Steam（AppID 3845830），iOS/Android（早期系列移植）
- 开发商：Onyx Lute
- 价格：付费买断（约 $5–$7 USD）
- 核心玩法：点击拖拽将彩色玻璃碎片放入对应轮廓，重现图案
- 玩点：触摸玻璃时的 ASMR 反馈、星空/艺术主题
- 与我们区别：是「拼贴」不是「着色 + 数字」，
  无逻辑推演，本质是 jigsaw 的变种
- Steam 评价：特别好评（"Beautiful! - Mici Reviews"）

## 3. Leadlight（Steam 新作）
- 平台：Steam（AppID 3421320）
- 核心玩法：将光线路径穿过网格点亮玻璃窗，类 light-up 变体
- 与我们区别：光路谜题，无区域数字约束

## 4. Glass Mosaic: Jigsaw Puzzle（移动端头部）
- 平台：Google Play，App Store
- 开发商：Absolutist Ltd
- 评分：Google Play 4.2★
- 核心玩法：传统马赛克拼图，每块玻璃碎片拖入正确位置
- 与我们区别：完全无逻辑，无数字约束，纯图片还原

## 5. Glass Art Puzzle（HYPERLAB）
- 平台：Google Play
- 评分：3.3★
- 核心玩法：色彩玻璃拼图，颜色匹配消除
- 与我们区别：偏休闲三消，逻辑性弱

## 6. Through the Glass: Mosaic Game
- 平台：Google Play
- 开发商：Absolutist Ltd
- 评分：3.6★
- 同 Glass Mosaic 系列，差异化程度低

## 7. Stained Glass Coloring Book（TeachersParadise）
- 平台：Google Play
- 评分：3.7★
- 核心玩法：自由涂色 + 模板（非拼图，无逻辑约束）
- 与我们区别：完全自由绘画，无规则

## 8. Window Puzzles（MWM）
- 平台：iOS/Android
- 核心玩法：拼图 + ASMR 玻璃碎片放置
- 发行商 MWM（makeup/game）旗下，主打中度休闲变现

## 9. Color Glass: Mosaic Puzzle（FunWave Studio）
- 平台：Google Play
- 同类马赛克涂色游戏，评分未公开

==============================================================
二、Nikoli 派生的「图着色 + 数字约束」原型玩法
==============================================================

学术上与"染色玻璃邻接着色 + 数字约束"最接近的 Nikoli 谜题：

| 谜题 | 玩法 | 与 Stained Glass 的关系 |
|------|------|-----------------------|
| Tilepaint（タイルペイント） | 区域涂色，相同数字区域合并，邻接不同色 | ★★★★★ 最接近 |
| Five Cells（ファイブセルズ） | 数字表示周围涂色数量 | ★★★★ |
| Hitori（ひとりにしてくれ） | 灰格，相邻同数必灰 | ★★★ |
| Nurikabe（ぬりかべ） | 黑白涂色 + 岛屿连通 | ★★★ |
| Fillomino（フィルオミノ） | 同值区域合并，邻接不同 | ★★★★ |
| Bijutsukan / Art Gallery（美術館） | 放灯照亮，邻接禁灯 | ★★★ |
| Wataridori | 路径分割邻接块 | ★★★（2025 NP-Complete 证明） |

学术结论：Tilepaint、Five Cells、Wataridori 均已被证明是 NP-Complete，
意味着我们的关卡生成器可借鉴"已知难解区域"算法来确保难度梯度。

==============================================================
三、市场分析
==============================================================

## 3.1 SEO 关键词（按搜索量与转化潜力排序）

英文核心词（高搜索量）：
- stained glass puzzle（主关键词）
- mosaic puzzle game
- glass art puzzle
- color puzzle grid
- relaxing puzzle / cozy puzzle
- ASMR puzzle / satisfying puzzle
- logic puzzle for adults
- Nikoli puzzle / Fillomino / Nurikabe / Tilepaint
- glass jigsaw

中文核心词：
- 彩绘玻璃拼图
- 玻璃拼图游戏
- 涂色拼图
- 逻辑填色
- 解谜游戏
- 治愈系游戏
- 数独类游戏（流量入口）

长尾词（竞争低、转化高）：
- "stained glass puzzle game no ads"
- "offline mosaic puzzle"
- "stained glass logic puzzle"

## 3.2 目标用户画像

| 画像 | 占比估计 | 痛点 | 触达渠道 |
|------|--------|------|---------|
| 25–45 治愈系玩家 | 40% | 想要放松、无压力成就感 | TikTok / 小红书 / B站 |
| 35–55 拼图爱好者 | 25% | 寻找新逻辑挑战 | Facebook / Steam 论坛 |
| 18–30 解谜硬核玩家 | 20% | Nikoli / 数独玩家 | Reddit / Discord / App Store |
| ASMR/解压用户 | 15% | 触觉反馈、画面治愈 | YouTube Shorts / TikTok |

## 3.3 市场规模（粗估）
- 全球 Puzzle 类手游年收入约 $15B+（Business of Apps 2026）
- Cozy/Relaxing Puzzle 细分赛道年增长 18%+
- Steam 上"stained glass"标签下活跃产品 < 10 款，竞争空窗

==============================================================
四、差异化策略
==============================================================

我们如何脱颖而出：

1. **明确「数字约束」差异化**
   - 现有竞品（Glass Masquerade / Glass Mosaic）几乎都是纯拼贴或纯涂色
   - 我们加入"数字 = 该区域必须使用的颜色编号"硬约束，
     把产品从「艺术游戏」推向「逻辑游戏」，覆盖 Nikoli 硬核玩家

2. **关卡叙事 + 视觉收藏**
   - 每关完成解锁一件「彩绘玻璃艺术品」（教堂窗、玫瑰窗等真实历史图案）
   - 区别于 Artisan 的"小清新"、Glass Masquerade 的"星空幻想"

3. **零广告 / 一次性付费**
   - Glass Art Puzzle、Stained Glass Coloring Book 等评分低（3.3–3.7）
     的根本原因是广告干扰严重
   - 我们采用 $4.99 一次性解锁 / 7 关免费试用，无广告、无内购

4. **关卡生成器 + 难度自适应**
   - 提供无限关卡模式（借鉴 Nikoli Tilepaint 算法）
   - Artisan 是手工关卡（30–60 关），我们做"无限流"

5. **多端覆盖**
   - Web（gamezipper.com 原生）→ iOS / Android → Steam 三步走
   - 现有竞品要么只 Steam，要么只移动，跨端空缺

6. **SEO 内容营销**
   - 在 gamezipper.com 部署长尾词文章（"best stained glass puzzle",
     "graph coloring puzzle"），抢占 organic 流量

==============================================================
五、技术实现要点
==============================================================

## 5.1 核心算法：图着色 + 数字约束求解

数据结构：
- 网格 G = (V, E)，V 为区域节点，E 为邻接关系
- 每个区域有可选颜色集 C(v)，由数字约束缩小
- 求解：回溯 + 约束传播（类似 Sudoku 求解器）

难度梯度生成（基于 Tilepaint NP-Complete）：
- 小尺寸 5x5 → 大尺寸 12x12
- 数字提示覆盖率从 60% → 25%
- 使用 SAT 求解器（可选）做唯一解校验

## 5.2 渲染层（Web 优先）

技术栈建议：
- 框架：React + Vite（或 Solid.js 以追求性能）
- 渲染：Canvas 2D（关卡网格）+ SVG（玻璃质感）
- 玻璃着色：CSS filter + 高斯模糊模拟透光感
- 着色交互：drag-and-drop 颜色 + 点击区域循环换色

性能要求：
- 单关首屏 < 1s
- 着色反馈 < 50ms

## 5.3 跨端策略
- Web：PWA + IndexedStorage 存关卡进度
- iOS/Android：React Native 或 Flutter 复用核心逻辑
- Steam：Electron / Tauri 包裹 Web 版本

## 5.4 关卡数据结构（建议）
```json
{
  "grid": [[0,0,1,1],[0,2,2,3],...],
  "hints": {"0":2,"3":1,...},
  "palette": ["#c43e3e","#3e7fc4",...],
  "size": 6,
  "difficulty": "medium",
  "artwork": "rose_window_assisi"
}
```

## 5.5 校验与提示系统
- 实时检测：相邻同色高亮提示
- 撤销 / 重做：基于 command pattern
- 自动提示：使用 MRV（最小剩余值）算法给出下一步建议
- 错误容忍：可继续玩，结算时统一判定

## 5.6 数据埋点（上线后）
- 关卡完成率、平均尝试次数、卡关点
- A/B 测试：颜色色板（治愈 vs 写实）
- 分享率：通关后生成分享图（关键获客指标）

==============================================================
六、风险与建议
==============================================================

风险：
1. Artisan of Glimmith 可能在 2026 内移植移动端（Steam Deck 已验证）
2. Nikoli 玩家群体偏小众，需要教育市场
3. 美术成本：彩绘玻璃视觉需要高质量艺术素材

建议：
- 优先 Web 端 MVP（4 周内），验证核心循环
- 与 gamezipper.com 主站流量互通，SEO 协同
- 首批关卡 60 关手工 + 后续 1000+ 程序生成
- 早期与 3–5 位 Nikoli 圈 KOL 合作，建立硬核口碑

==============================================================
附录：参考资料
==============================================================
- Steam: The Artisan of Glimmith (AppID 4160210)
- Steam: Glass Masquerade 4: Constellations (AppID 3845830)
- Steam: Leadlight (AppID 3421320)
- Google Play: Glass Mosaic / Glass Art Puzzle / Stained Glass Coloring Book
- 学术：Five Cells and Tilepaint are NP-Complete (ResearchGate, 2022)
- 学术：Wataridori is NP-Complete (arXiv 2601.09345)
- Wikipedia: Nikoli (publisher)
- Business of Apps: Puzzle Games Market Report 2026