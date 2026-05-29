# Crossmath — Competitive Benchmark Research
## Market Overview

Crossmath 是一种结合填字格(Crossword)和数学方程的解谜游戏。玩家在网格中填入数字，使横向和纵向的数学方程都成立。

**市场规模:**
- Mathler + Nerdle 合计数百万日活用户
- Crossmath (Guru Puzzle Game) 在 Google Play 有 500K+ 下载
- "math crossword puzzle" / "crossmath" 搜索量持续上升
- Poki, CrazyGames, Coolmath 等主要浏览器游戏平台 **零覆盖** — 这是重大空白
- 教育类解谜是增长最快的休闲游戏子品类之一

**核心差异化:**
Mathler 和 Nerdle 都是猜方程游戏(Wordle变体)。真正的 Crossmath 格式（填字格 + 横纵向方程同时成立）只在移动端App存在，浏览器端是空白。

---

## Competitor Analysis

### 1. Mathler (mathler.com)
- **URL**: https://www.mathler.com
- **Platform**: Web (desktop + mobile)
- **Mechanic**: Wordle变体 — 猜一个数学方程使其等于目标数。每次猜测后，正确位置的数字/运算符显示绿色，存在但位置不对显示黄色
- **Grid**: 单行方程输入（5-8个格子）
- **Levels**: 每日一题 + 无限练习模式
- **Operations**: +, -, ×, ÷
- **Difficulty**: 4种模式 — Easy(5格), Mathler(6格), Hard(8格), Expert(任意长方程)
- **Hints**: 无提示系统
- **Monetization**: 纯广告（底部banner）
- **Visual**: 极简暗色主题，Wordle风格颜色反馈（绿/黄/灰）
- **Unique**: Wordle数学版，单方程猜谜，每日挑战社交分享
- **Rating**: 8/10

### 2. Nerdle (nerdlegame.com)
- **URL**: https://nerdlegame.com
- **Platform**: Web (desktop + mobile)
- **Mechanic**: 猜完整的数学方程（含答案），6次机会。方程必须数学有效（等号在中间或右侧）
- **Grid**: 8字符固定宽度
- **Levels**: 每日一题（Mini Nerdle = 6字符, Classic = 8字符, Instant Nerdle）
- **Operations**: +, -, ×, ÷, =
- **Difficulty**: 3种变体（Mini, Classic, Instant/Micro）
- **Hints**: 无提示系统
- **Monetization**: 无广告
- **Visual**: 暗色极简，紫色主题，标准Wordle反馈风格
- **Unique**: 强制方程有效性检查，"等于号必须在中间或右侧"规则
- **Rating**: 8/10

### 3. Crossmath by Guru Puzzle Game (Google Play)
- **URL**: Google Play / iOS App Store
- **Platform**: Mobile (Android + iOS)
- **Mechanic**: 填字格格式 — 网格中预填部分数字，玩家填入剩余数字使横向和纵向方程都成立。支持笔记模式，可标记候选数字
- **Grid**: 4x4 (Easy), 5x5 (Medium), 6x6 (Hard), 7x7 (Expert)
- **Levels**: 200+ 关卡，5个难度等级
- **Operations**: +, -, ×, ÷（随难度递进）
- **Difficulty**: 5级递进（ Beginner → Normal → Hard → Expert → Master）
- **Hints**: 有提示系统（显示正确数字）
- **Monetization**: IAP（去广告 $2.99）+ 插页广告 + Banner
- **Visual**: 彩色明亮主题，方程格有彩色背景区分，数字键盘在底部
- **Unique**: 真正的填字格+数学格式，笔记系统，多难度网格
- **Rating**: 9/10

### 4. Crossmath by Studio K (iOS)
- **URL**: iOS App Store
- **Platform**: Mobile (iOS only)
- **Mechanic**: 类似 Guru 版本，填字格数学方程
- **Grid**: 5x5 为主
- **Levels**: 100+ 关卡
- **Operations**: +, -, ×, ÷
- **Difficulty**: 简单/中等/困难
- **Hints**: 有提示
- **Monetization**: 订阅制
- **Visual**: 柔和色彩，方程格高亮
- **Unique**: 更简洁的UI
- **Rating**: 7/10

### 5. Math Crossword Puzzle (各种小开发者的变体)
- **Platform**: Web (各种小站) + Mobile
- **Quality**: 多数质量较低，广告重，关卡少
- **Rating**: 5/10 (平均)

---

## Feature Comparison Matrix

| Feature | Mathler | Nerdle | Crossmath (Guru) | Crossmath (Studio K) |
|---|---|---|---|---|
| **Format** | 猜方程 | 猜方程 | 填字格 | 填字格 |
| **Grid** | 5-8 单行 | 8字符行 | 4x4-7x7 | 5x5 |
| **Equations** | 单方程 | 单方程 | 横+纵交叉 | 横+纵交叉 |
| **Levels** | 无限生成 | 每日 | 200+ | 100+ |
| **Operations** | +-×÷ | +-×÷= | +-×÷ | +-×÷ |
| **Hints** | ❌ | ❌ | ✅ | ✅ |
| **Notes** | ❌ | ❌ | ✅ | ❌ |
| **Daily** | ✅ | ✅ | ❌ | ❌ |
| **Share** | ✅ | ✅ | ❌ | ❌ |
| **Difficulty** | 4 modes | 3 variants | 5 levels | 3 levels |
| **Offline** | ✅ | ✅ | ✅ | ✌️ |
| **Browser** | ✅ | ✅ | ❌ | ❌ |

---

## Best Practices

1. **填字格格式是核心**: 横+纵交叉方程比单行猜谜更有深度和沉浸感
2. **难度递进**: 从3x3简单格到7x7困难格，逐步引入更多运算符
3. **预填提示**: 给出部分数字作为起点，降低初始难度
4. **笔记功能**: 允许标记候选数字，帮助解复杂关卡
5. **每日挑战**: 增加留存和社交分享
6. **即时验证**: 填入数字后立即显示方程是否正确（绿色=正确，红色=错误）
7. **程序化生成**: 无限关卡 = 无限内容 = 高留存

## Pitfalls to Avoid

1. **不要做成 Wordle 变体**: Mathler/Nerdle 已占该位置，Crossmath 的核心差异化是填字格
2. **方程验证要严格**: 必须确保每个关卡有且仅有一个有效解
3. **避免负数和分数**: 保持所有答案为正整数，降低认知负担
4. **数字范围要合理**: 初级关卡用1-9，高级可以用到1-20
5. **运算符引入要渐进**: Easy只用+和-，Medium加×，Hard加÷
6. **不要太难**: Math Crossword 的乐趣在"解谜"不在"受挫"，提示系统必须有

---

## Recommended Feature Set for GameZipper

### Core
- 填字格格式（crossword grid + 数学方程）
- 程序化关卡生成（无限内容）
- 横+纵交叉方程验证
- 数字键盘输入（1-9, 清除）

### Grid Sizes
- 3x3 (Tutorial/Easy) — 5关
- 4x4 (Easy) — 15关
- 5x5 (Medium) — 20关
- 6x6 (Hard) — 10关
- 总计: 50+ 关卡（可无限生成）

### Operations by Difficulty
- Easy: +, - only
- Medium: +, -, ×
- Hard: +, -, ×, ÷

### Features
- 即时方程验证（正确=绿色，错误=红色）
- 提示系统（每关3次，揭示一个正确数字）
- 撤销功能
- 星级评价（基于提示使用次数: 0次=3星, 1-2次=2星, 3次=1星）
- 每日挑战（固定种子生成的5x5关卡）
- 分享结果
- 教程（3-5关引导）
- 统计面板（已完成关卡, 3星数, 连续天数）
- 设置页面（音效开关）
- Web Audio 程序化BGM + SFX
- Canvas 渲染，响应式设计
- MiniMax 图标

### Visual Theme
- 暗色霓虹主题（与 GZ 其他游戏一致）
- 方程格用不同颜色区分横/纵
- 正确方程绿色发光效果
- 数字输入动画
- 完成关卡庆祝粒子效果
