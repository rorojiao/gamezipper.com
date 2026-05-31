# BENCHMARK.md — Baba Is You

## 竞品分析

### 1. 原版游戏信息
- **开发者**: Arvi "Hempuli" Teikari (Hempuli Oy, 芬兰)
- **首发**: 2019年3月13日 (PC/Switch), 2021年6月22日 (iOS/Android)
- **关卡数**: 481关 (3个扩展包)
- **引擎**: Multimedia Fusion 2
- **获奖**: IGF Excellence in Design, D.I.C.E. Outstanding Achievement, GDC Best Design

### 2. 核心玩法
规则即物理对象——玩家可以推动、重新排列文字方块来改变游戏规则。

### 3. 规则系统

#### 3.1 规则语法
```
NOUN IS PROPERTY           → BABA IS YOU
NOUN IS NOUN                → ROCK IS FLAG (转化)
NOUN IS PROPERTY AND PROP   → BABA IS YOU AND PUSH
NOUN IS NOT PROPERTY        → WALL IS NOT STOP (否定)
```

#### 3.2 规则解析
- 水平（左→右）和垂直（上→下）扫描
- 三个或以上文字方块对齐时形成规则
- 规则在移动/销毁/转化时立即重新解析
- 规则形成即生效，打破即失效

### 4. 实体（名词）

| 实体 | 外观 | 默认属性 |
|------|------|----------|
| BABA | 白色羊状生物 | YOU |
| WALL | 深色障碍 | STOP |
| ROCK | 灰色岩石 | PUSH |
| FLAG | 黄色旗帜 | WIN |
| WATER | 蓝色液体 | SINK |
| LAVA | 橙红色岩浆 | HOT |
| SKULL | 白色骷髅 | DEFEAT |
| KEY | 金色钥匙 | PUSH |
| DOOR | 木门 | SHUT/STOP |
| KEKE | 粉色生物 | — |

### 5. 属性（核心15个，用于GZ版本）

| 属性 | 效果 | 说明 |
|------|------|------|
| YOU | 玩家控制 | 箭头键/WASD移动 |
| WIN | 胜利条件 | YOU碰到WIN即过关 |
| STOP | 阻挡移动 | 不可穿越 |
| PUSH | 可推动 | 被推动时移动 |
| PULL | 拉拽 | 离开时跟随 |
| DEFEAT | 致命 | YOU碰到即死 |
| HOT | 灼烧 | 销毁MELT对象 |
| MELT | 易融 | 被HOT销毁 |
| SINK | 沉没 | 共享格子时双双销毁 |
| MOVE | 自移动 | 每回合自动前进 |
| OPEN | 开启 | 与SHUT互消 |
| SHUT | 关闭 | 与OPEN互消 |
| FLOAT | 浮空 | 忽略碰撞 |
| SAFE | 安全 | 不可被销毁 |

### 6. 连接词

| 连接词 | 用法 | 示例 |
|--------|------|------|
| AND | 组合属性 | ROCK IS PUSH AND WIN |
| NOT | 否定属性 | WALL IS NOT STOP |

### 7. 移动机制

1. 玩家按键 → YOU对象移动
2. 检查目标格是否有STOP
3. 如果目标有PUSH对象 → 推动链条
4. 同时解析所有移动
5. 应用碰撞效果（DEFEAT/SINK/HOT-MELT等）
6. 检查WIN条件

### 8. 推动链条
- PUSH暗示STOP（可推动对象也是固体）
- 推动链条：A推B推C...
- 链条碰到不可移动对象时整个推动失败

### 9. 竞品（浏览器端）

#### 9.1 Baba Is You Demake (Lexaloffle)
- PICO-8 风格
- 32关
- 核心机制简化版
- 单文件实现

#### 9.2 类似规则操纵游戏
- **Screeps** (编程策略)
- **TIS-100** (汇编解谜)
- **Shenzhen I/O** (电路解谜)
- **Baba Is You** 在浏览器端无直接竞争对手

### 10. SEO 竞争分析

| 关键词 | 月搜索量 | GZ机会 |
|--------|----------|--------|
| baba is you | 22K+ | 高 — 直接游戏名 |
| baba is you online | 3K+ | 高 — 游戏名+online |
| baba is you free | 2K+ | 高 — 游戏名+free |
| rule puzzle game | 1K+ | 中 |
| push word puzzle | 800+ | 高 |
| logic rule game | 500+ | 中 |

### 11. GZ版本设计决策

#### 11.1 简化策略（原版有59个属性，GZ版本用14个）
原版过于复杂，GZ版本精简为：
- 10个实体：BABA, WALL, ROCK, FLAG, WATER, LAVA, SKULL, KEY, DOOR, KEKE
- 14个属性：YOU, WIN, STOP, PUSH, PULL, DEFEAT, HOT, MELT, SINK, MOVE, OPEN, SHUT, FLOAT, SAFE
- 2个连接词：AND, NOT
- 1个转化动词：IS

#### 11.2 关卡规模
- 总共 50 关，分为 5 个章节
- 第一章：教学关（8关）— 介绍基本规则操纵
- 第二章：推动解谜（10关）— 推动文字改变规则
- 第三章：转化之谜（10关）— NOUN IS NOUN 转化
- 第四章：组合属性（12关）— AND/NOT 使用
- 第五章：终极挑战（10关）— 多规则组合

#### 11.3 技术规格
- 单文件 HTML5 Canvas
- 网格大小：15x11（移动端友好）
- 方块大小：自适应屏幕
- 操作：方向键 + WASD + 触摸滑动
- 撤销 (Z) + 重置 (R) + 提示 (H)
- 星级评价：基于步数

### 12. 与GZ现有游戏的差异化

| 维度 | GZ现有最接近 | Baba Is You |
|------|-------------|-------------|
| 逻辑解谜 | circuit-logic, logic-gates | 规则操纵 vs 电路设计 |
| 文字游戏 | word-puzzle, wordle | 文字方块 vs 单词拼写 |
| 推动解谜 | sokoban | 规则推动 vs 纯推动 |
| 品类 | 零覆盖 | **全新品类** |

### 13. 设计哲学

原版设计理念：
- "先想一个酷的解法，再设计通往它的路径"
- "最满足的瞬间是简单但难以理解的"
- 没有默认对象属性——一切从规则涌现

GZ版本设计理念：
- 保留核心"规则即对象"体验
- 简化属性系统降低学习曲线
- 强化教学关卡引导
- 增加提示系统降低挫败感
