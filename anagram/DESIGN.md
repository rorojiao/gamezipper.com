# Anagram — Competitive Benchmark Analysis

**游戏名称**: Anagram
**分类**: Word Puzzle
**slug**: anagram
**评分**: 23/25 (gap-scan Round 15)

## Market Research (Phase 0)

### Zero-Gap Verification
- grep "anagram" across 512 games = 0 ✅
- 真零缺口关键词

### Market Leaders
1. **Text Twist** (10M+ downloads on Android/iOS)
   - 核心机制: 6 个打乱字母，组成 3-6 字母单词
   - 关卡: 程序化生成，无限关卡
   - 提示系统: 字母频率统计、首字母提示
   - 计分: 按长度（3=10, 4=20, 5=50, 6=100）
   - 特性: 定时挑战、成就系统

2. **Wordscapes Anagram Mode** (2B+ downloads franchise)
   - 核心机制: 6 字母词库 + 交叉网格验证
   - 关卡: 手工设计（2000+ 关卡）
   - 提示系统: 遮盖字母显示、炸弹提示
   - 计分: 单词数量+星星评级
   - 特性: 每日挑战、主题包

3. **Daily Jumble** (报纸经典，网页版)
   - 核心机制: 4-6 个打乱单词，谜题答案
   - 关卡: 每日更新 + 历史存档
   - 提示系统: 提示首字母
   - 计分: 解答时间
   - 特性: 漫画插图

4. **Word Scramble** (Poki/CrazyGames)
   - 核心机制: 拖拽字母卡牌重组
   - 关卡: 无限关卡，难度递增
   - 提示系统: 打乱按钮、跳过
   - 计分: 单词数量
   - 特性: 简单 UI，适合休闲玩家

## Core Mechanic Definition

### Basic Flow
1. **生成谜题**: 从词库选择 1 个 6 字母单词
2. **打乱字母**: 随机打乱 6 个字母顺序
3. **重组单词**: 玩家通过点击/拖拽重组，组成 3-6 字母单词
4. **验证**: 检查是否在词库中，计分
5. **完成**: 找到所有可能单词后进入下一关

### Technical Requirements
- **词库**: 5K-10K 英文单词（3-6 字母）
- **搜索算法**: BFS/DFS 搜索所有可能的单词组合
- **输入方式**: 点击字母卡牌 + 提交按钮（避免复杂的拖拽实现）
- **字典验证**: Trie 或 Set 快速查询

### Level Design (30 Levels, 5 Tiers)

| Tier | 关卡数 | 长度范围 | 特殊规则 | Par (目标单词数) |
|------|--------|----------|----------|------------------|
| 1 (Beginner) | 6 | 3-4 | 无 | 4-6 |
| 2 (Easy) | 6 | 3-5 | 无 | 6-8 |
| 3 (Medium) | 6 | 3-6 | 1 个双字母词 | 8-10 |
| 4 (Hard) | 6 | 4-6 | 2 个双字母词 | 10-12 |
| 5 (Master) | 6 | 4-6 | 1 个 6 字母词 + 1 个双字母词 | 12-15 |

### Differentiation Strategy

#### vs Text Twist
- ✅ **程序化关卡**: 使用 seed 生成每日挑战 + 无限关卡
- ✅ **简化 UI**: Canvas 卡牌渲染 + 触控点击，减少复杂度
- ✅ **单文件**: 词库嵌入（10K words ≈ 80KB）

#### vs Wordscapes
- ✅ **纯 Anagram**: 无交叉网格，专注于单词重组
- ✅ **词库透明**: 显示所有找到的单词
- ✅ **成就系统**: 找到所有 6 字母单词解锁成就

#### vs Daily Jumble
- ✅ **无限关卡**: 不限于每日更新
- ✅ **难度曲线**: 5 tier 渐进式难度
- ✅ **即时反馈**: 实时验证，无需提交等待

## Technical Implementation Plan

### Canvas Rendering
- 卡牌尺寸: 80×120 px
- 间距: 10 px
- 动画: 选中（缩放 1.1x）→ 提交（消失）→ 错误（摇晃）
- 触控: `pointerdown` 事件，支持鼠标+触摸

### Word Dictionary
- 词库来源: /usr/share/dict/words (Linux 系统) + 过滤
- 存储: JavaScript Set（O(1) 查询）
- 大小: ~80KB（10K words, 3-6 字母）

### Search Algorithm
- **BFS**（广度优先搜索）: 按长度递增搜索
- **剪枝**: 跳过无效前缀（无匹配单词）
- **提示**: 字母频率统计（显示还剩哪些字母可用）

### Scoring System
- 单词计分: 3=10, 4=20, 5=50, 6=100
- 评分: 找到单词数 / 总单词数 × 100%
- 星星评级: 1⭐=50%, 2⭐=80%, 3⭐=100%

### Progress Tracking
- localStorage: `{ v:1, best: { level1: 3, ... }, stars: { level1: 2, ... } }`
- 每日挑战: seed = YYYYMMDD（固定当日谜题）

## Expected Deliverables (Phase 3)

### File Structure
```
anagram/
├── index.html          # 单文件游戏（~80KB: 词库+引擎+关卡）
├── DESIGN.md           # 本文档
├── gen_levels.py       # 关卡生成器
├── levels.json         # 30 关卡数据
└── words.txt           # 10K 词库（可选，用于调试）
```

### Game Specs
- **行数**: ~800 lines
- **大小**: ~80KB（词库占 70%，引擎 25%，关卡 5%）
- **关卡数**: 30（5 tiers × 6 levels）
- **词库**: 10K words（3-6 字母）
- **QA**: 40 点代码级清单

## Open Questions

1. **词库大小**: 10K words 是否足够？是否需要扩展到 15K？
   - 决策: 10K 足够（每关 6 字母，最多 20 个单词组合）

2. **提示系统**: 是否需要提示功能（显示 1 个未找到单词的首字母）？
   - 决策: 是，Tier 3+ 提供（消耗 "moves"）

3. **定时模式**: 是否需要倒计时挑战模式？
   - 决策: 否，专注于休闲 puzzle，避免压力

## Timeline Estimate

- Phase 3 (Game Dev): 20-30 min
- Phase 4 (Art): 5 min（PIL procedural）
- Phase 5 (Music): 5 min（Web Audio SFX）
- Phase 6 (Level Verify): 5 min（Python BFS）
- Phase 7 (QA): 10 min（40 点清单）
- Phase 8 (Register): 5 min（games-data.js + git）
- Phase 9 (Report): 2 min

**Total**: ~52-77 min（1-1.5 小时）

---

**生成时间**: 2026-07-01
**Phase**: Round 15 - Phase 2 Benchmark