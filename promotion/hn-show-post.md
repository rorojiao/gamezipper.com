# Hacker News Show HN Post

**Title:** Show HN: GameZipper – 40+ free HTML5 browser games, no signup, no ads during play

**Body:**

I built GameZipper, a collection of 40+ classic browser games that run instantly with no downloads, no accounts, and no ads during gameplay.

https://gamezipper.com

The idea was simple: classic games (Snake, Tetris, 2048, Sudoku, Chess, Minesweeper, etc.) should be one click away. No "Watch this ad to continue." No "Create an account to save your score."

**What it is:**
- 40+ games, all pure HTML5/Canvas/JS — no frameworks, no Flash, no WebAssembly
- Zero ads during gameplay (one small ad between games only)
- Works on mobile with touch/swipe controls
- Games load in ~1-2 seconds
- No signup required

**Technical details:**
- Vanilla JS + HTML5 Canvas
- requestAnimationFrame game loops with delta-time
- Touch input abstraction layer (shared across games)
- Static site deployed on Vercel (edge CDN)
- Service worker for caching played games offline

**Games include:** Snake, Tetris, 2048, Sudoku, Chess (vs AI), Minesweeper, Breakout, Flappy Bird, Solitaire, Memory Match, Word Search, Checkers, Othello, and 25+ more.

Would love feedback on game performance, mobile experience, or game suggestions.

---

## HN Posting Tips
- Post between 8-10 AM EST (US morning, highest visibility)
- Title must start with "Show HN:"
- Be genuine in comments, respond quickly
- Don't use marketing language — HN hates that
- Technical details get more engagement than marketing
