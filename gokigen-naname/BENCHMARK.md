# BENCHMARK.md — Gokigen Naname Competitor & Systems Analysis

> **Document purpose:** Comprehensive competitive benchmark for building a commercial-quality Gokigen Naname puzzle game at gamezipper.com.  
> **Date compiled:** June 2026  
> **Target platform:** Web (mobile-first responsive)

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Competitor Analysis](#2-competitor-analysis)
3. [Systems to Implement](#3-systems-to-implement)
4. [Art Style Reference](#4-art-style-reference)
5. [Music Style Reference](#5-music-style-reference)
6. [Key Numerical Values](#6-key-numerical-values)
7. [Recommended Level Count and Difficulty Curve](#7-recommended-level-count-and-difficulty-curve)

---

## 1. Game Overview

### What is Gokigen Naname?

**Gokigen Naname** (also known as **Slant**, **Slalom**, or **Slants**) is a binary-determination logic puzzle invented by the Japanese publisher **Nikoli**. It is played on a rectangular grid where **numbers in circles** appear at intersections of grid lines.

### Rules (official)

1. Draw **exactly one diagonal line** in every cell — either `/` (top-right to bottom-left) or `\` (top-left to bottom-right).
2. Each numbered circle indicates exactly **how many lines meet at that intersection** (clue range: **0–4**).
3. **No closed loops** may be formed by the diagonal lines.

### Key Characteristics

| Property | Detail |
|---|---|
| Puzzle type | Binary-determination, constraint-satisfaction |
| Grid sizes | 3×3 to 15×15+ (typical: 5×5 to 10×10) |
| Clue range | 0, 1, 2, 3, or 4 |
| Solution method | Pure logic — no guessing required |
| Time to solve | 1–20 minutes depending on grid size/difficulty |
| Genre siblings | Slitherlink, Hashi, Nurikabe, Binary puzzles |

### Current Implementations (as of 2026)

| Implementation | Platform | URL / Source |
|---|---|---|
| **gokigen.zone** | Web | https://gokigen.zone |
| **GridPuzzle.com Slant** | Web | https://gridpuzzle.com/slant |
| **Simon Tatham's "Slant"** | Web / Desktop / Mobile | https://chiark.greenend.org.uk/~sgtatham/puzzles/js/slant.html |
| **Schinken's Gokigen Naname** | Web (itch.io) | https://schinken.itch.io/gokigen-naname |
| **Steam (Slants/Gokigen Naname)** | PC/Steam | Steam Community guides available |
| **Cross+A solver** | Desktop | https://cross-plus-a.com/html/cros7gknn.htm |
| **Ubuntu/GNOME Games** | Linux | Pre-installed in some distros |

**Critical gap:** There is **no dedicated, polished, commercial-quality mobile/web app** specifically for Gokigen Naname with scoring, achievements, tutorials, and progressive difficulty. This represents a significant market opportunity.

---

## 2. Competitor Analysis

### Competitor A: Flow Free (Big Duck Games)

| Aspect | Details |
|---|---|
| **Game name** | Flow Free / Flow Free: Bridges / Flow Free: Hexes / Flow Free: Warps |
| **Developer** | Big Duck Games LLC |
| **Platform** | iOS, Android, Web (all major) |
| **Core mechanics** | Connect matching colored dots with continuous pipes that fill every cell on the grid without crossing. |
| **Grid sizes** | 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12, 13×13, 14×14 |
| **Total levels** | **2,500+** across all packs (free + paid) |
| **Free packs** | Regular Pack (150 levels), Bonus Pack, 8×8 Mania (150), and others |
| **Paid packs** | Bridges, Extreme, Jumbo, Variety, and many additional theme packs |
| **Difficulty progression** | Starts at 5×5 trivial, progresses to 14×14 extremely complex; each pack is sorted by grid size then difficulty |
| **Scoring** | ✓ Checkmark = solved; ★ Star = "perfect" (solved in minimum moves) |
| **Hints** | 3 free hints; additional hints purchasable with real money (~$0.99–$4.99 for hint packs) |
| **Achievements** | Game Center achievements for solving levels and completing packs |
| **Tutorials** | First few levels serve as implicit tutorial; no explicit tutorial |
| **Progress saving** | Per-level completion saved locally; pack progress tracked |
| **Leaderboards** | Time Trial leaderboards via Game Center |
| **Time Trial** | Race-the-clock mode with 20 scored variants by board size and duration |
| **Daily puzzles** | Daily puzzle with streak tracking (1000+ day streaks reported) |
| **Undo** | ✓ Full undo available |
| **Art style** | Bright, colorful pipes on dark background; each flow has a distinct saturated color; flat/minimal UI |
| **Music** | Light ambient/electronic; subtle sound effects for pipe connections |
| **Colorblind support** | Flow labels option (numbers inside colored dots) |
| **Monetization** | Free-to-play with ads; IAP for hint packs and paid level packs |
| **Revenue model** | One of the highest-grossing puzzle games; 100M+ downloads |

**Relevance to Gokigen Naname:** Flow Free demonstrates that a simple binary/line-drawing puzzle can achieve massive commercial success with the right systems (packs, stars, time trial, daily puzzles, hints). Its progression model is the gold standard.

---

### Competitor B: Conceptis Slitherlink: Loop the Snake

| Aspect | Details |
|---|---|
| **Game name** | Conceptis Slitherlink (Loop the Snake) |
| **Developer** | Conceptis Ltd. |
| **Platform** | iOS, Android |
| **Core mechanics** | Draw lines between dots to form a single closed loop where each number clue indicates how many lines surround that square. |
| **Grid sizes** | Up to 16×22 |
| **Total levels** | **200 free** puzzles + weekly bonus + paid volumes |
| **Difficulty levels** | Very Easy → Easy → Medium → Hard → Very Hard → Extremely Hard (6 levels) |
| **Scoring** | No explicit scoring; completion-based |
| **Hints** | Unlimited "check puzzle" (highlights errors); no cell-by-cell hints |
| **Achievements** | None explicitly; puzzle library tracks completion |
| **Tutorials** | Implicit through easy puzzles |
| **Progress saving** | Full save state per puzzle; partial progress preserved |
| **Leaderboards** | None |
| **Undo/Redo** | ✓ Unlimited undo and redo |
| **Gaming features** | Auto-complete clues, highlight link segments, quick zoom (2-finger tap) |
| **Weekly content** | Extra bonus puzzle published free each week |
| **Puzzle library** | Continuously updates with new content volumes |
| **Art style** | Clean, professional, minimal; white grid on light background; blue/black lines; subtle color coding |
| **Music** | Minimal/none; focus on silent puzzle solving |
| **Ads** | **No ads** |
| **Monetization** | Free base (200 puzzles) + paid volumes (~$3.99–$7.99 per volume) |
| **Quality** | "Manually selected, top quality puzzles" — each has unique solution |

**Relevance to Gokigen Naname:** Conceptis is the premium standard for logic puzzle apps. Their approach — clean UI, no ads, quality-over-quantity puzzles, unlimited undo, check-puzzle feature, and progressive difficulty — is the model for a "premium" feel. Gokigen Naname is in the same Nikoli puzzle family as Slitherlink, so players overlap heavily.

---

### Competitor C: Simon Tatham's Portable Puzzle Collection — Slant

| Aspect | Details |
|---|---|
| **Game name** | Slant (part of Simon Tatham's Portable Puzzle Collection) |
| **Developer** | Simon Tatham (open source, MIT license) |
| **Platform** | Web (JavaScript), Windows, macOS, Linux, Android (ported) |
| **Core mechanics** | **Exactly Gokigen Naname** — fill diagonal lines so numbered intersections match and no loops form. |
| **Grid sizes** | Configurable (typically 3×3 to 15×15+) |
| **Total levels** | **Unlimited** — procedurally generated |
| **Difficulty levels** | Easy → Medium → Hard → Extreme (configurable via game type/size) |
| **Scoring** | None — pure puzzle solving |
| **Hints** | None explicit |
| **Achievements** | None |
| **Tutorials** | Short rules text on the page |
| **Progress saving** | Save/load game state; browser-based state persists |
| **Leaderboards** | None |
| **Undo** | ✓ Full undo supported |
| **Art style** | Extremely minimal — black lines on white grid, no color, purely functional |
| **Music** | None |
| **Ads** | None |
| **Monetization** | Fully free, open source (MIT) |

**Relevance to Gokigen Naname:** This is the **direct competitor** — it implements the exact same puzzle. However, it has **zero commercial features**: no scoring, no achievements, no tutorials, no progression, no visual polish. It proves the puzzle works digitally but leaves enormous room for a polished commercial version.

---

### Competitor D: Slitherlinks.com (Web)

| Aspect | Details |
|---|---|
| **Game name** | Slitherlinks (Slitherlink Online) |
| **Developer** | Independent web |
| **Platform** | Web |
| **Core mechanics** | Slitherlink — connect dots to form a single loop matching number clues. |
| **Grid sizes** | 5×5 to 15×15 |
| **Total levels** | **3,000+** unique puzzles |
| **Difficulty** | Beginner → Intermediate → Advanced → Expert |
| **Scoring** | Time-based scoring per puzzle |
| **Hints** | Available (details not fully documented) |
| **Achievements** | ✓ Achievement system |
| **Daily challenges** | ✓ Daily puzzle |
| **Leaderboards** | ✓ Global leaderboard |
| **Art style** | Clean web interface, dark/light mode |
| **Monetization** | Free with possible premium features |

**Relevance to Gokigen Naname:** Demonstrates that a web-only logic puzzle can successfully offer 3000+ puzzles, daily challenges, achievements, and leaderboards. This model scales well for a web-based Gokigen Naname.

---

### Competitor E: Slitherlink by Ejelta LLC (Android)

| Aspect | Details |
|---|---|
| **Game name** | Slitherlink / Slitherlink X (paid) |
| **Developer** | Ejelta LLC |
| **Platform** | Android |
| **Core mechanics** | Slitherlink with non-square grid support. |
| **Grid shapes** | Square, hexagon, pentagon, mixed |
| **Grid sizes** | Multiple sizes per grid shape |
| **Total levels** | **Unlimited** — procedurally generated |
| **Difficulty** | Multiple levels |
| **Hints** | Tutorial system + in-game assistance |
| **Achievements** | None documented |
| **Tutorials** | ✓ Built-in tutorials |
| **Undo** | ✓ Unlimited undo/redo |
| **Special features** | Colored lines, colored clues, parity shading (inside/outside), bookmarks, light/dark themes |
| **Art style** | Functional, clean; supports dark theme |
| **Monetization** | Free with ads; Slitherlink X (paid, ~$2.99) removes ads and unlocks "Base Game" grids |

**Relevance to Gokigen Naname:** The parity shading feature (showing inside vs. outside the loop) is an excellent accessibility aid. The tutorial system and dark/light themes are table stakes. For Gokigen Naname, equivalent aids might include highlighting constraint violations or showing "satisfied" numbers.

---

### Competitor F: Binary Puzzle Games (Cross-Genre Comparison)

| Game | Platform | Key Systems |
|---|---|---|
| **Bitwise: Binary Logic Puzzle** | iOS | XP & leveling system, 28 achievements, Game Center, daily challenges, animated XP banner |
| **Puzzle IO: Binary Sudoku** | iOS | Smart point system with time-based multipliers, 6 difficulty levels, Game Center leaderboards, bonuses for efficiency |
| **Binaris 1001** | Android | Real-time multiplayer battles, battle leaderboards, guaranteed unique solutions |
| **Rumba: Daily Binary Puzzle** | Android | Daily puzzles, progress tracking, clean modern design, Takuzu/Binairo variants |
| **Binary Twist (Tango)** | Android | LinkedIn Tango variant, social sharing |
| **Zuzu by Razzle Puzzles** | iOS/Android/Web | Video tutorial, stats tracker (best/average solve times), free online play |

**Relevance to Gokigen Naname:** Binary puzzles share the "binary choice per cell" mechanic with Gokigen Naname. The XP/leveling system (Bitwise), time-based scoring multipliers (Puzzle IO), and multiplayer competition (Binaris 1001) are innovative systems worth considering.

---

### Competitor G: GridPuzzle.com — Gokigen Naname (Slant)

| Aspect | Details |
|---|---|
| **Game name** | GridPuzzle Slant |
| **Developer** | GridPuzzle.com |
| **Platform** | Web |
| **Core mechanics** | Gokigen Naname — exactly the same puzzle. |
| **Grid sizes** | Multiple sizes available |
| **Total levels** | Hundreds of generated puzzles |
| **Features** | Rules & tips page, online play, various sizes |
| **Art style** | Simple web grid, functional |
| **Monetization** | Free, ad-supported |

**Relevance:** Direct competitor offering the same puzzle online. Minimal features — no scoring, no progression, no achievements. A polished version would immediately surpass it.

---

## 3. Systems to Implement

Based on the competitive analysis, the following systems are recommended, organized by priority tier:

### Tier 1 — Essential (MVP)

| System | Description | Competitor Precedent |
|---|---|---|
| **Puzzle engine** | Core Gokigen Naname solver + generator with unique solutions | All competitors |
| **Undo/Redo** | Unlimited undo and redo for all actions | Conceptis, Ejelta, Flow Free, SGT |
| **Error checking** | "Check puzzle" highlights incorrect cells/intersections | Conceptis (unlimited check) |
| **Progress saving** | Per-puzzle save state; overall progress persisted in localStorage/DB | All competitors |
| **Grid size selector** | Choose grid size before starting (3×3 to 12×12) | All competitors |
| **Difficulty selector** | Easy / Medium / Hard / Expert | Conceptis, Ejelta, Slitherlinks.com |
| **Rules/tutorial** | Interactive tutorial for first-time players explaining the 3 rules with animated examples | Ejelta, Zuzu (video), Flow Free (implicit) |
| **Responsive UI** | Mobile-first touch controls + desktop mouse | Flow Free, all mobile apps |

### Tier 2 — Strongly Recommended

| System | Description | Competitor Precedent |
|---|---|---|
| **Star scoring** | ★ = solved perfectly (no errors, no hints used); ✓ = solved | Flow Free (★/✓ model) |
| **Time tracking** | Display solve time per puzzle; track best/average times | Zuzu, Puzzle IO, Slitherlinks.com |
| **Hint system** | Reveals one correct cell diagonal; limited supply (see §6) | Flow Free (3 free + IAP), Slitherlink apps |
| **Level packs** | Group puzzles into themed packs (e.g., "Starter 5×5", "Challenge 8×8") | Flow Free (pack model is its core) |
| **Completion tracking** | Visual progress bar per pack; % complete per grid size | Flow Free, Conceptis |
| **Daily puzzle** | One new puzzle per day, same for all players | Flow Free (daily streaks), Slitherlinks.com, Bitwise |
| **Dark/light theme** | Toggle between themes | Ejelta, Slitherlinks.com |
| **Satisfied-clue highlighting** | When a numbered intersection has the correct number of lines, visually indicate it (green glow) | Equivalent to Conceptis "auto-complete clues" |

### Tier 3 — Differentiating Features

| System | Description | Competitor Precedent |
|---|---|---|
| **XP & leveling** | Earn XP for solving puzzles; level up with animated banner | Bitwise Binary Puzzle |
| **Achievements** | 20–30 achievements (first solve, speed records, perfect streaks, pack completions) | Bitwise (28), Flow Free (Game Center) |
| **Leaderboards** | Global daily puzzle leaderboard; per-grid-size speed rankings | Slitherlinks.com, Puzzle IO |
| **Time-based scoring** | Score = base points × time multiplier (faster = more points) | Puzzle IO |
| **Streak tracking** | Track consecutive daily puzzles solved | Flow Free (1000+ day streaks) |
| **Puzzle generator** | Procedural generation for unlimited puzzles | SGT (unlimited), Ejelta (unlimited) |
| **Pattern tutorial** | Interactive guide to key Gokigen Naname solving patterns (0-corner, 4-corner, edge patterns) | Steam Community guide (patterns with pictures) |
| **Colorblind mode** | Alternative visual indicators beyond just color | Flow Free (flow labels) |

### Tier 4 — Nice-to-Have

| System | Description | Competitor Precedent |
|---|---|---|
| **Sound effects** | Subtle audio feedback for placing lines, completing puzzles, errors | Flow Free, Slitherlink apps |
| **Ambient music** | Soft ambient/lo-fi background music toggle | Harmony Puzzle, reky |
| **Multiplayer** | Real-time head-to-head puzzle solving | Binaris 1001 |
| **Social sharing** | Share completion stats/solve times | Various |
| **Weekly bonus puzzles** | Special weekly puzzle releases | Conceptis (weekly free bonus) |
| **Statistics dashboard** | Detailed personal stats: puzzles solved, total time, best times per size, accuracy rate | Zuzu (best/average tracking) |

---

## 4. Art Style Reference

### Recommended Direction: Minimal Zen

Based on competitor analysis, the most successful logic puzzle games use a **clean, minimal, slightly warm** aesthetic that reduces cognitive load and lets the puzzle be the visual focus.

#### Primary References

| Reference | Game | Key Takeaway |
|---|---|---|
| **Flow Free** | Big Duck Games | Bright colored lines on dark background; each element has a distinct saturated color; rounded UI elements |
| **Conceptis Puzzles** | Conceptis Ltd. | Ultra-clean white grid; professional, almost "printed puzzle" feel; blue accent for interactive elements |
| **reky** | beyondthosehills | Minimalist architecture-inspired; clean geometry; ambient waves of sound for each input |
| **Simon Tatham's Puzzles** | SGT | Pure function over form — proves that even zero decoration works for puzzle enthusiasts |

#### Recommended Visual Language

| Element | Style |
|---|---|
| **Background** | Soft off-white (#F8F7F4) for light mode; deep charcoal (#1A1A2E) for dark mode |
| **Grid lines** | Light gray (#D0D0D0), thin (1px) |
| **Diagonal lines (player input)** | Slate blue (#4A6FA5) for `\`, warm coral (#E07A5F) for `/`; or single accent color |
| **Number clues** | Dark text (#333) in clean sans-serif circles |
| **Satisfied clues** | Subtle green (#81B29A) glow or checkmark |
| **Unsatisfied clues** | Default dark; or subtle pulse animation when focused |
| **Error state** | Soft red (#E63946) highlight on violating intersections |
| **UI chrome** | Rounded corners (8–12px radius), generous whitespace, subtle shadows |
| **Buttons** | Flat or barely-raised; primary action in accent blue (#4A6FA5) |
| **Typography** | Clean sans-serif: Inter, Nunito, or Poppins; 14–18px for body; 24–32px for headers |
| **Icons** | Minimal line icons (Lucide or Feather icon sets) |
| **Animations** | Subtle: line-draw animation when placing diagonals; gentle pulse on completion; confetti burst on pack completion |

#### Color Palette (Recommended)

```
Light Mode:
  Background:  #F8F7F4 (warm white)
  Surface:     #FFFFFF (card white)
  Grid:        #D0D0D0 (light gray)
  Text:        #2D3436 (near-black)
  Accent:      #4A6FA5 (slate blue)
  Success:     #81B29A (sage green)
  Error:       #E63946 (soft red)
  Highlight:   #F2CC8F (warm gold)

Dark Mode:
  Background:  #1A1A2E (deep navy)
  Surface:     #16213E (dark blue-gray)
  Grid:        #2C3E50 (muted gray)
  Text:        #ECF0F1 (off-white)
  Accent:      #6C9BDB (lighter blue)
  Success:     #81B29A (sage green)
  Error:       #E63946 (soft red)
  Highlight:   #F2CC8F (warm gold)
```

---

## 5. Music Style Reference

### Recommended Direction: Ambient / Lo-Fi Chill

The most successful puzzle games use music that **reduces stress and supports focus** without being distracting. Silence should also be a valid option.

#### Primary References

| Reference | Game | Style |
|---|---|---|
| **Flow Free** | Big Duck Games | Light electronic ambient; soft chimes on pipe connections |
| **Harmony: Relaxing Music Puzzle** | Web/Mobile | Guitar-hero-style melody interaction; relaxing tones |
| **reky** | beyondthosehills | Ambient waves + gentle chimes on every input |
| **Conceptis** | Conceptis Ltd. | No music (silence preferred by many puzzlers) |

#### Recommended Audio Design

| Element | Style |
|---|---|
| **Background music** | Soft ambient pads; lo-fi chill beats; gentle piano; 60–80 BPM; seamless looping; volume toggle |
| **Line placement SFX** | Soft percussive "tap" or "click" — satisfying but not jarring |
| **Line removal SFX** | Lighter reverse-tap or swoosh |
| **Clue satisfied SFX** | Gentle ascending chime (subtle) |
| **Puzzle complete SFX** | Short celebratory jingle (2–3 seconds); ascending notes |
| **Error SFX** | Soft low tone (not alarming) |
| **Pack complete SFX** | Longer celebratory melody (5 seconds); achievement-unlock feel |
| **Level up SFX** | XP banner animation with rising tone |
| **All audio** | Toggle on/off separately for music and SFX |

#### Music Sources (royalty-free)

- **Free:** incompetech.com (Kevin MacLeod), freemusicarchive.org, pixabay.com/music
- **Paid/Licensed:** artlist.io, epidemicsound.com, audioblocks.com
- **Custom:** AI-generated ambient loops (Suno, Udio) — budget option
- **Recommended mood keywords for search:** "ambient puzzle," "lo-fi study," "meditation," "zen garden," "soft focus"

---

## 6. Key Numerical Values

### Scoring Formula (Recommended)

Based on competitor analysis, a dual-track scoring system works best:

#### Star Rating (per puzzle)
| Rating | Condition |
|---|---|
| ★★★ (3 stars) | Solved with no errors, no hints, no undo |
| ★★☆ (2 stars) | Solved with ≤3 undos, no hints |
| ★☆☆ (1 star) | Solved (any conditions) |
| ☆☆☆ (0 stars) | Not yet solved |

#### Point Score (per puzzle)

```
Base Score = grid_size × 100
  (e.g., 5×5 = 500 pts, 8×8 = 800 pts, 12×12 = 1200 pts)

Time Bonus = max(0, (par_time - solve_time) × 10)
  where par_time = grid_size × grid_size × 2 seconds

Hint Penalty = -150 per hint used

Error Penalty = -50 per error check that found mistakes

Final Score = Base Score + Time Bonus - Hint Penalty - Error Penalty
Minimum Score = 100 (if solved at all)
```

#### XP System (based on Bitwise model)

| Action | XP Earned |
|---|---|
| Solve any puzzle | Base Score ÷ 10 (rounded) |
| ★★★ completion | +50% bonus XP |
| ★★ completion | +25% bonus XP |
| Daily puzzle solved | +100 bonus XP |
| Streak bonus | +10 XP per consecutive daily solve |
| Pack completed | +500 bonus XP |
| First puzzle of each grid size | +200 bonus XP |

#### Level Progression

| Level | XP Required | Cumulative XP |
|---|---|---|
| 1 | 0 | 0 |
| 2 | 100 | 100 |
| 3 | 150 | 250 |
| 4 | 200 | 450 |
| 5 | 300 | 750 |
| 6 | 400 | 1,150 |
| 7 | 500 | 1,650 |
| 8 | 650 | 2,300 |
| 9 | 800 | 3,100 |
| 10 | 1,000 | 4,100 |
| 11–20 | +200 per level | escalating |
| 21–50 | +500 per level | escalating |

### Hint System Economics (Recommended)

| Parameter | Value | Notes |
|---|---|---|
| Starting hints | **5 free hints** | More generous than Flow Free (3), less than unlimited check |
| Daily hint refill | **+1 hint per day** (if logged in) | Encourages daily engagement |
| Hint earned per 5 puzzles solved | **+1 hint** | Reward for playing |
| Hint cost (IAP) | $0.99 for 10 hints, $2.99 for 50 | Consistent with Flow Free pricing |
| What a hint does | Reveals one unsolved cell's correct diagonal | Targeted, not a full solution |
| "Check puzzle" feature | **Free, unlimited** | Highlights incorrect intersections (like Conceptis) — not the same as a hint |

### Grid Size & Difficulty Parameters

| Grid Size | Difficulty | Puzzle Count | Avg. Solve Time | Par Time |
|---|---|---|---|---|
| 3×3 | Tutorial | 5 | 30 sec | 60 sec |
| 4×4 | Easy | 15 | 1 min | 120 sec |
| 5×5 | Easy | 20 | 2 min | 180 sec |
| 5×5 | Medium | 15 | 3 min | 240 sec |
| 6×6 | Easy | 15 | 3 min | 240 sec |
| 6×6 | Medium | 20 | 4 min | 300 sec |
| 6×6 | Hard | 10 | 5 min | 360 sec |
| 7×7 | Medium | 20 | 5 min | 360 sec |
| 7×7 | Hard | 15 | 7 min | 480 sec |
| 8×8 | Medium | 15 | 7 min | 480 sec |
| 8×8 | Hard | 20 | 10 min | 600 sec |
| 8×8 | Expert | 10 | 12 min | 720 sec |
| 9×9 | Hard | 15 | 12 min | 720 sec |
| 9×9 | Expert | 15 | 15 min | 900 sec |
| 10×10 | Hard | 10 | 15 min | 900 sec |
| 10×10 | Expert | 15 | 20 min | 1200 sec |
| 12×12 | Expert | 10 | 25+ min | 1500 sec |

### Achievements (Recommended 25 achievements)

| # | Achievement | Condition | XP Bonus |
|---|---|---|---|
| 1 | First Steps | Complete your first puzzle | +50 |
| 2 | Getting the Hang of It | Complete 10 puzzles | +100 |
| 3 | Dedicated Solver | Complete 50 puzzles | +250 |
| 4 | Puzzle Master | Complete 100 puzzles | +500 |
| 5 | Century Plus | Complete 200 puzzles | +1000 |
| 6 | Perfect Start | Get ★★★ on 5 puzzles | +100 |
| 7 | Perfectionist | Get ★★★ on 25 puzzles | +300 |
| 8 | Flawless | Get ★★★ on 50 puzzles | +500 |
| 9 | Speed Demon | Solve a 5×5 in under 30 seconds | +150 |
| 10 | Lightning Fast | Solve a 8×8 in under 3 minutes | +250 |
| 11 | Grid Explorer | Complete a puzzle in every grid size | +200 |
| 12 | Small but Mighty | Complete all 3×3 and 4×4 puzzles | +150 |
| 13 | Growing Pains | Complete all 5×5 puzzles | +200 |
| 14 | Middle Ground | Complete all 6×6 and 7×7 puzzles | +300 |
| 15 | Big League | Complete all 8×8 puzzles | +400 |
| 16 | Going Large | Complete all 9×9+ puzzles | +500 |
| 17 | Daily Habit | Solve your first daily puzzle | +50 |
| 18 | Week Strong | 7-day daily puzzle streak | +200 |
| 19 | Monthly Mastery | 30-day daily puzzle streak | +500 |
| 20 | Hint-Free | Complete 10 puzzles without using hints | +200 |
| 21 | No Mistakes | Complete 10 puzzles with zero error checks | +200 |
| 22 | Pack Rat | Complete your first full level pack | +300 |
| 23 | Completionist | Complete all level packs | +1000 |
| 24 | Night Owl | Complete a puzzle between 11pm–6am (local time) | +100 |
| 25 | Marathon | Solve 5 puzzles in one session | +150 |

---

## 7. Recommended Level Count and Difficulty Curve

### Total Level Count: **250 curated puzzles**

This strikes a balance between:
- **Flow Free** (2,500+ — overwhelming for a new IP)
- **Conceptis** (200 — premium feel, too few for free engagement)
- **Simon Tatham's** (unlimited — no curation/progression)

With procedural generation for unlimited play on top.

### Pack Structure

| Pack Name | Grid Sizes | Levels | Difficulty | Unlock Condition |
|---|---|---|---|---|
| **Tutorial** | 3×3, 4×4 | 10 | Introductory | Free |
| **Starter** | 4×4, 5×5 | 25 | Easy | Complete Tutorial |
| **Beginner** | 5×5, 6×6 | 30 | Easy → Medium | Complete Starter |
| **Classic** | 6×6, 7×7 | 30 | Medium | Complete Beginner |
| **Intermediate** | 7×7, 8×8 | 30 | Medium → Hard | Complete Classic |
| **Advanced** | 8×8, 9×9 | 30 | Hard | Complete Intermediate |
| **Expert** | 9×9, 10×10 | 30 | Hard → Expert | Complete Advanced |
| **Master** | 10×10, 12×12 | 25 | Expert | Complete Expert |
| **Grandmaster** | 12×12 | 15 | Expert+ | Complete Master |
| **Daily Mix** | 5×5 to 10×10 | 1/day | Variable | Free |
| **Infinite Play** | 3×3 to 12×12 | Unlimited | Procedural | Free |

**Total curated: 225 puzzles + daily + infinite**

### Difficulty Curve Design

```
Difficulty ▲
           │                                          ████ Grandmaster
           │                                     ████
           │                                ████ Master
           │                           ████
           │                      ████ Expert
           │                 ████
           │            ████ Advanced
           │       ████
           │  ████ Intermediate / Classic
           │ ████
           │██ Beginner / Starter
           │█ Tutorial
           └──────────────────────────────────────────► Levels
```

#### Difficulty is controlled by:

1. **Grid size** — Larger grids = more cells = more constraint interactions
2. **Clue density** — More clues = easier (more constraints to start from); fewer clues = harder
3. **Clue placement** — Clues on edges/corners are more immediately useful; interior clues are trickier
4. **Required techniques** — Easy puzzles need only basic pattern recognition (0-corner, 4-corner); hard puzzles require multi-step deduction chains

#### Par Times for Difficulty Benchmarks

| Difficulty | 5×5 Par | 8×8 Par | 10×10 Par |
|---|---|---|---|
| Easy | 2 min | 5 min | 10 min |
| Medium | 1.5 min | 4 min | 8 min |
| Hard | 1 min | 3 min | 6 min |
| Expert | 45 sec | 2 min | 5 min |

### Level Unlock Progression

- **Sequential within packs:** Must solve puzzle N to unlock puzzle N+1
- **Pack unlock:** Must complete ≥80% of previous pack to unlock next pack
- **Tutorial is mandatory** for new players (but skippable for returning players)
- **Daily puzzles** are always available regardless of progress
- **Infinite play** (procedural generation) is always available as a sandbox

### Content Pipeline

| Phase | Puzzles | Timeline |
|---|---|---|
| **Launch (v1.0)** | 125 puzzles (Tutorial through Advanced) | Initial release |
| **Update 1 (v1.1)** | +50 puzzles (Expert pack) | 1 month post-launch |
| **Update 2 (v1.2)** | +50 puzzles (Master + Grandmaster) | 2 months post-launch |
| **Ongoing** | +1 daily puzzle per day + procedural | Continuous |

---

## Appendix: Feature Comparison Matrix

| Feature | Flow Free | Conceptis Slitherlink | SGT Slant | Slitherlinks.com | Ejelta Slitherlink | **Gokigen Naname (Recommended)** |
|---|---|---|---|---|---|---|
| Scoring (stars) | ✅ ★/✓ | ❌ | ❌ | ✅ time-based | ❌ | ✅ ★★★ system |
| Point score | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ formula-based |
| Hints | ✅ 3 free + IAP | ✅ unlimited check | ❌ | ✅ | ✅ tutorial | ✅ 5 free + refill |
| Error checking | ❌ | ✅ unlimited | ❌ | ❌ | ✅ | ✅ unlimited free |
| Undo/Redo | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Achievements | ✅ GC | ❌ | ❌ | ✅ | ❌ | ✅ 25 achievements |
| Leaderboards | ✅ Time Trial | ❌ | ❌ | ✅ global | ❌ | ✅ daily + speed |
| Daily puzzle | ✅ streak | ✅ weekly | ❌ | ✅ | ❌ | ✅ daily |
| XP/Leveling | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ XP system |
| Tutorial | Implicit | Implicit | Text only | ❌ | ✅ | ✅ interactive |
| Dark mode | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Mobile responsive | ✅ native | ✅ native | ✅ web | ✅ web | ✅ native | ✅ web-first |
| Sound/Music | ✅ | ❌ | ❌ | ❌ | ✅ SFX | ✅ ambient + SFX |
| Stats dashboard | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ detailed |
| Procedural gen | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Pack system | ✅ core | ✅ volumes | ❌ | ❌ | ❌ | ✅ |
| Colorblind mode | ✅ labels | ❌ | ❌ | ❌ | ❌ | ✅ |
| Offline play | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (PWA) |

---

## Summary of Recommendations

1. **Be the first polished, dedicated Gokigen Naname game** — the current market has only bare-bones implementations
2. **Target 225 curated levels** at launch with procedural generation for unlimited replay
3. **Adopt Flow Free's pack model** with the ★★★ star system for engagement
4. **Match Conceptis's premium feel** — clean UI, unlimited undo, unlimited free error checking
5. **Differentiate with XP/leveling** (from Bitwise) and time-based scoring (from Puzzle IO)
6. **Include a daily puzzle** with streak tracking — this drives long-term retention
7. **Interactive tutorial** teaching key patterns — no competitor does this well for Gokigen Naname
8. **Ambient music + SFX** at tasteful volume — most competitors are silent; this adds polish
9. **PWA-first architecture** — works offline, installable, responsive across all devices
10. **Generous free content** (125 puzzles free) with optional IAP for hints and bonus packs

---

*Document generated as part of competitive analysis for gamezipper.com Gokigen Naname development.*
