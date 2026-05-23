# Rummy — 竞品对标文档

## 竞品分析

### 1. cardgames.io Rummy
- **核心玩法**: Draw 1 from stock/discard, form melds (sets of 3-4 same rank, runs of 3+ same suit consecutive), discard to end turn, go out when all cards are melded
- **计分**: Unmatched cards count as points (Ace=1, 2-9=face, 10/J/Q/K=10). Winner gets 0, losers get unmatched card values
- **模式**: vs Computer (1-3 AI opponents)
- **UI**: Clean card table, click to select, drag to meld area
- **系统**: Undo, hint, auto-sort hand, score tracking, new game

### 2. Poki Rummy
- **核心玩法**: Classic rummy rules, lay melds on table
- **AI**: 3 difficulty levels
- **系统**: Score counter, round tracking, how to play

### 3. BrainPlay Rummy (May 2026)
- **核心玩法**: 2-4 player rummy, standard rules
- **特色**: Clean modern UI, tutorial, AI opponents

### 4. RummyTastic / solitaired.com
- **核心玩法**: First to 200 points wins, can lay off on opponents' melds
- **特色**: Detailed scoring, round history, statistics

## 系统对标清单

| 系统 | 竞品覆盖 | GZ 目标 |
|------|---------|---------|
| 经典 Rummy 规则 | ✅ 所有竞品 | ✅ draw + discard, form melds, go out |
| Gin Rummy 变体 | ✅ 大部分 | ✅ 10-card hand, knock/undercut |
| AI 对手 | ✅ Easy/Medium/Hard | ✅ 3 difficulty levels (strategic AI) |
| 计分系统 | ✅ 所有人 | ✅ Unmatched card values, round scoring |
| 进度保存 | ✅ 部分 | ✅ localStorage with version |
| 手牌自动排序 | ✅ 大部分 | ✅ Auto-sort by suit + rank |
| Undo | ✅ 部分 | ✅ Undo last action |
| Hints | ✅ 部分 | ✅ Highlight playable cards |
| 教程 | ✅ Poki/BrainPlay | ✅ New player tutorial |
| 成就系统 | ❌ 多数无 | ✅ First meld, Win streak, etc. |
| 统计 | ✅ 部分 | ✅ Games won, best score, win rate |
| 视觉反馈 | ✅ 部分 | ✅ Card animations, meld glow |
| 音效 | ✅ 部分 | ✅ Web Audio API SFX |
| 落地(lay off) | ✅ cardgames.io | ✅ Lay off on opponents' melds |
| 拿牌(draw pile/discard pile) | ✅ 所有 | ✅ Click to draw from either |

## 核心数值

- **牌组**: Standard 52 cards (no jokers in basic)
- **发牌**: 7 cards each (2 players: 10 each for Gin Rummy)
- **胜利条件**: All cards melded + 1 discard
- **计分**: Ace=1, 2-9=face value, 10/J/Q/K=10 points
- **特殊**: Going out = 0 points for winner, unmatched = sum of remaining

## 美术风格参考
- Dark green felt table background (classic card game)
- Clean white card faces with rounded corners
- Neon accent for selected/valid plays
- Glass-morphism score panels

## 音乐风格参考
- Relaxed jazz/lounge piano background
- Card flip/click/collect SFX
- Win fanfare + lose sound
