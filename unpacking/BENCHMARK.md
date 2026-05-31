# BENCHMARK.md — Unpacking 品类竞品分析

## 1. 原版 Unpacking 游戏信息

**Unpacking** 是由澳大利亚独立工作室 **Witch Beam**（布里斯班）开发的解压收纳整理游戏。

| 项目 | 详情 |
|------|------|
| 开发商 | Witch Beam |
| 发行商 | Humble Bundle |
| 发行年份 | 2021年11月2日（PC/Switch/Xbox），2022年5月（PS4/PS5），2023年8月（iOS/Android） |
| 引擎 | Unity |
| 平台 | Windows, macOS, iOS, Android, Linux, Nintendo Switch, Xbox One, PlayStation 4/5 |
| 类型 | Puzzle / Zen / Narrative |
| 售价 | Steam $19.99 |

### 获奖荣誉
- **BAFTA Games Awards 2022** — EE Game of the Year + Best Narrative（双项 BAFTA）
- **D.I.C.E. Awards** — Outstanding Achievement for an Independent Game
- **Eurogamer** — Game of the Year

### 核心玩法
游戏分为 **8 个关卡**（1997年→2018年），玩家将箱子中的物品拖放到新居的各个房间合适的位置。
叙事完全依靠物品摆放来讲述一位女性角色的生活故事（无声叙事）。
共 35 个房间，物品有指定的必须放置位置，全部物品放好后关卡完成。

---

## 2. 浏览器端竞品列表

> 以下游戏均可通过浏览器直接访问，无需下载安装。

### 2.1 高度相似品类（直接模仿 Unpacking 机制）

| 游戏名 | 平台 | 地址 | 特点 |
|--------|------|------|------|
| **Unpacking** (官方HTML5移植) | HTML5 | unpackinggame.com | 官方原版，唯一正版网页版本（需购买） |
| **Interior Designer: Unpacking House** | HTML5 | crazygames.com | 模拟室内设计+拆箱，自由度高 |
| **Unpacking** (free clone) | HTML5 | playgamor.com/unpacking/ | 仿制版，免费体验 |
| **Unpacking Online** | HTML5 | kickoutgames.com/game/unpacking-online/ | 线上版本 |
| **Unpacking** @ OnlineGames.io | HTML5 | onlinegames.io/unpacking/ | 聚合平台分发 |

### 2.2 免费/开源类似游戏（itch.io 标签：unpacking）

| 游戏名 | 平台 | 特点 |
|--------|------|------|
| **Top free games tagged "unpacking"** | itch.io | 多款独立开发者制作的免费 HTML5 小游戏，品质参差不齐 |

### 2.3 同类整理解压玩法（非拆箱但机制相近）

| 游戏名 | 平台 | 地址 | 特点 |
|--------|------|------|------|
| **Cozy Sorting** | Yandex Games | yandex.com/games/app/403879 | 分类整理玩法，轻度解谜 |
| **Organize It** | GirlsGoGames | girlsgogames.com/game/organize-it | 女孩向整理游戏，拖拽操作 |
| **A Little to the Left** | Web (Poki/CrazyGames) | 多平台 | 整理排序类益智游戏，叙事风格相近 |
| **Chill Out & Tidy Up 系列** | YouTube 推荐列表 | - | 多款 Tidy Up 手游的网页替代品稀缺 |

### 2.4 Tidy Up 品类移动应用（参考）

| 游戏名 | 平台 | 特点 |
|--------|------|------|
| **Tidy Up: Relaxing Organizing Puzzle Game** | Amazon Appstore | 收纳整理解谜 |
| **Tidy UP!** | Google Play | 益智整理类 |
| **SatisPuzzle: Tidy Up** | Google Play | 满意度类整理 |
| **Tidy Games - Perfect Organize** | Google Play | 完美整理系列 |

---

## 3. 浏览器端实现策略分析

### 3.1 渲染技术选型

| 技术方案 | 适用场景 | 优点 | 缺点 |
|----------|----------|------|------|
| **Canvas 2D** | 物品绘制、拖拽轨迹 | 性能好，轻量，适合 2D 物品 | 需要手写碰撞/放置逻辑 |
| **CSS Grid + DOM** | 房间布局槽位系统 | 天然对齐，响应式简单 | 复杂动画成本高 |
| **DOM + CSS Transform** | 拖拽交互（最常用） | 开发快，事件完善 | 大量物品时性能下降 |
| **WebGL（Three.js）** | 3D 房间场景 | 沉浸感强 | 开发成本高，权重包大 |

**推荐方案：Canvas 2D 核心渲染 + DOM 拖拽层叠加**（分离交互层和渲染层）

### 3.2 拖拽系统实现

```
关键要素：
1. 拖拽开始：记录物品初始位置，变更 z-index
2. 拖拽中：实时跟随鼠标，更新碰撞检测区域
3. 拖拽结束：
   a. 检测放置位置（网格/房间槽位）
   b. 判断是否"正确位置"（范围/类型匹配）
   c. 吸附动画（snap to grid）
   d. 若位置错误，弹回原位或提示
```

**关键技术点**：
- 物品碰撞箱（hitbox）定义
- 房间"热区"（hotzone/placement zone）定义
- 吸附阈值（snap threshold）
- 物品旋转（90度增量）

### 3.3 房间场景设计

- 每个关卡 = 1个房间（或多个子房间）
- 背景：静态插图/照片级渲染
- 前景：可交互物品层
- 箱子作为物品来源面板（通常在画面底部或侧面）
- UI：关卡进度指示、时间/步数限制（可选）

### 3.4 物品放置逻辑

```javascript
// 伪代码示例
item.placementRules = {
  bookshelf: { category: 'books', zones: ['shelf'] },
  bed: { category: 'furniture', zones: ['bedroom-floor'] }
}

function checkPlacement(item, zone) {
  return zone.accepts.includes(item.category)
}
```

---

## 4. GameZipper 版本差异化设计建议

### 4.1 关卡制搬家故事线

| 差异化点 | 原版 Unpacking | GameZipper 建议 |
|----------|----------------|-----------------|
| 关卡结构 | 8个年代章节（1997-2018） | 10-15个搬家故事（大学毕业、首次租房、结婚、生子、换城市…） |
| 叙事载体 | 单一角色的人生旅程 | 多角色家庭故事线（可解锁角色） |
| 结局 | 单一结局 | 多结局（根据摆放质量解锁不同叙事片段） |
| 收藏要素 | 无评分 | 收集隐藏物品/照片触发彩蛋剧情 |

### 4.2 Star Rating 系统

| 星级 | 条件 |
|------|------|
| ★ | 完成关卡（所有物品放置完毕） |
| ★★ | 正确位置率 ≥ 80%（无越界/错误放置） |
| ★★★ | 正确位置率 = 100% + 速度达标（参考时间内完成） |
| 隐藏★ | 发现所有彩蛋物品 |

**速度评分**：每关卡设定参考时间，超时则无法获得速度分，但仍可完成关卡。

### 4.3 Hint System（提示系统）

| 提示类型 | 效果 | 代价 |
|----------|------|------|
| 闪烁高亮 | 下一件正确物品轻微发光 | 无代价 |
| 区域提示 | 正确区域轮廓发光 | 扣 0.5x 该物品得分 |
| 直接放置 | 自动将物品放到正确位置 | 扣 1x 该物品得分 |
| 跳过物品 | 跳过当前物品（不推荐） | 扣分+降低最终评级 |

**每日挑战模式**：每日发布一个关卡挑战，全服玩家竞速，排行榜展示。

### 4.4 社交与UGC扩展

- **关卡编辑器**：玩家自制关卡并分享（高DAU留存设计）
- **截图分享**：一键生成精美装箱对比图分享社交媒体
- **排名系统**：全球/好友排行榜（星级总分）

---

## 5. 结论与建议

Unpacking 品类在浏览器端**供给严重不足**：
- 原版无免费网页版
- 现有免费仿制品品质低、无评分系统
- Tidy Up 类手游无网页版对应

**GameZipper 的机会窗口**：
1. **质量差距大**：现有竞品体验远不及原版，品质提升空间显著
2. **品类蓝海**：浏览器端几乎无强力竞争者
3. **差异化清晰**：关卡制故事线 + Star Rating + Hint System 三位一体可形成护城河

**技术实现推荐**：Canvas 2D 核心渲染，DOM 交互层，3-4人小团队可在 4-6 个月内完成 MVP。
