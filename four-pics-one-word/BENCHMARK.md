# BENCHMARK.md — Competitive Analysis: "4 Pics 1 Word" Puzzle Genre

> **Project:** Emoji-based 4 Pics 1 Word game for gamezipper.com  
> **Platform:** Web (HTML5 Canvas)  
> **Date:** June 2026  

---

## Competitor Overview

| Feature | 4 Pics 1 Word (LOTUM) | Pictoword (Kooapps) | Wordie/Apensar | PixWords | Wordscapes |
|---|---|---|---|---|---|
| **Release** | Feb 2013 | Mar 2013 | 2013 | May 2013 | Jun 2017 |
| **Core Mechanic** | 4 photos → 1 word | 2 photos → compound | 4 images/GIFs → 1 word | 1 photo → crossword | Letter wheel → crossword |
| **Total Levels** | 9,000+ | 1,000+ | 3,500+ | 1,000+ | 6,000+ |
| **Ratings** | 4.7★ iOS, 4.6★ Android | 4.5★ | 4.2★ | 4.3★ | 4.7★ |
| **Downloads** | 50M+ | 10M+ | 5M+ | 10M+ | 100M+ |
| **Hint Cost** | 60 coins each | Varies | Varies | 15-30 coins | Varies |
| **Daily Puzzle** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Leaderboard** | ✅ (Lvl 20) | ✅ | ✅ | ❌ | ✅ |

## Key Design Patterns

1. **Zero-friction start** — No tutorial needed, just look and tap
2. **Generous early game** — First 20 levels are easy wins
3. **Visible progress** — Level numbers, progress bars, coin counters always visible
4. **Daily habit loop** — Daily puzzles + streaks + login rewards
5. **Social viral loop** — "Ask friends" shares the game

## Recommended Economy (Emoji Web Version)

| Action | Coin Reward/Cost |
|---|---|
| Solve a puzzle (no hints) | +10 coins |
| Solve with 1 hint used | +5 coins |
| Daily puzzle completion | +25 coins |
| Reveal a letter | -25 coins |
| Remove wrong letters | -25 coins |
| Skip puzzle | -50 coins |

## Recommended Sound Effects (Web Audio API Procedural)

| Event | Sound Type |
|---|---|
| Tap letter | Soft click/pop (200Hz, 50ms) |
| Correct word | Ascending chime C5→E5→G5 |
| Wrong word | Gentle buzz (100Hz, 200ms) |
| Level complete | Celebration jingle |
| Coin earned | Coin sparkle (800Hz→1200Hz) |
| Hint used | Whoosh |
| Achievement | Triumphant chord |

## Level Design

- Minimum 20 levels for launch
- Word length: 3-8 letters, increasing with difficulty
- Difficulty via emoji abstraction: concrete objects → abstract concepts
- Themed packs: Animals, Food, Colors, Emotions, etc.
