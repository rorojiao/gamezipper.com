# Round 5 — Deep Gameplay Regression Plan

老公说"很多游戏的排版、操作、难度都有问题 1、2、3、4 也全部遇到过"——
意思是**实际游戏内玩法/UI/关卡有问题**，不只是加载/广告。

## 目标

**对每个游戏，真实进入并玩，不是只截图**：
- ✅ 进游戏 + dismiss splash + dismiss difficulty picker (sudoku/board games)
- ✅ 触发游戏开始（click/space/tap）
- ✅ 玩 5-15 步真实操作
- ✅ 检测 score / level / state 是否变化
- ✅ 检测 game-over / win / level-complete 是否可达
- ✅ 检测 UI 排版：canvas 大小 vs 视口、文字溢出、按钮可点、移动端响应
- ✅ 检测 console 错误、网络 404
- ✅ 截图前后对比

## 测什么交互（按游戏类型）

### Canvas 游戏（点击/键盘/swipe）
1. 鼠标点击 canvas 中心
2. Arrow keys × 4
3. Space (jump)
4. 拖拽 (drag start → move → end)
5. 等待 2s + 再截图

### 棋类 / 卡牌 / 桌游 (chess, sudoku, solitaire, ...)
1. Dismiss splash
2. Dismiss difficulty picker (sudoku/wordle)
3. 点击棋盘格子/卡片
4. 玩 5-10 步
5. 检测 score / state 变化

### 模拟/经营 (kitty-cafe, idle-clicker, ...)
1. 多次 click
2. 检测 currency / level
3. 移动端 viewport 测试

### Match-3 / Color Sort (color-sort, magic-sort, sushi-stack)
1. 点 tube 1 → tube 2
2. 多次移动
3. 检测 level 进度

## 检测项

| 指标 | 怎么测 | Pass |
|---|---|---|
| 游戏加载 | domcontentloaded < 10s | ✓ |
| 进游戏 | 2s 内 canvas/DOM 就绪 | ✓ |
| 开始游戏 | 第 1 次交互后 score/state 变 | ✓ |
| 可玩性 | 5+ 步操作后游戏状态合理 | ✓ |
| UI 排版 | canvas 尺寸 ≥ 100×100, 无文字溢出 | ✓ |
| 移动端 | viewport 375px 也能玩 | ✓ |
| Console 错误 | 0 致命错误 | ✓ |
| 资源 404 | 0 | ✓ |
| 难度合理 | 不会卡死 / 不会不可战胜 | ✓ |

## Bug 分类

- **P0**: 游戏完全跑不起来（白屏/崩溃/卡死）
- **P1**: 玩法/规则错误（棋类规则错、color sort 不可解、score 不更新）
- **P2**: UI 排版问题（按钮被挡、文字溢出、移动端无法点）
- **P3**: 难度曲线（太难/太易/死局）

## 范围

老公之前说"1、2、3、4 也全部遇到过"——这"1、2、3、4"我理解是**多种问题的代称**（或某个游戏里第 1/2/3/4 关）。

**Round 5 计划**：
- 跑 30-50 个核心游戏（Top 30 主页/分类页出现 + 老公可能提的）
- 真实玩 5+ 步
- 截图对比（开始 vs 玩后）
- 找真 bug

需要老公**具体说几个有问题的游戏名字**（"xxx 游戏的第几关过不了"或"xxx 游戏的排版在手机乱"），让我精准修。
