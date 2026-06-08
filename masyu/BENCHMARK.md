# Masyu Puzzle Game — Competitor Benchmark

> **Date:** June 8, 2026  
> **Purpose:** Competitive analysis for a browser-based HTML5 Masyu puzzle game targeting Western audiences.

---

## Table of Contents

1. [Market Overview](#market-overview)
2. [Top 3 Competitors (Detailed)](#top-3-competitors)
   - [1. puzzle-masyu.com (Web)](#1-puzzle-masyucom--web)
   - [2. Masyu Infinite (iOS)](#2-masyu-infinite--ios)
   - [3. Puzzle by Nikoli W: Masyu (Xbox / Windows)](#3-puzzle-by-nikoli-w-masyu--xbox--windows)
3. [Other Notable Competitors](#other-notable-competitors)
4. [Feature Comparison Matrix](#feature-comparison-matrix)
5. [Key Takeaways & Opportunities](#key-takeaways--opportunities)

---

## Market Overview

Masyu (ましゅ) is a Japanese logic puzzle created by Nikoli in 2000. It is a loop-drawing puzzle with simple rules: draw a single continuous loop through all black and white circles on a grid. Black circles require a 90° turn; white circles require a straight passage with a turn in an adjacent cell. No numbers or letters are used — pure visual logic.

The competitive landscape for Masyu is **fragmented and niche**, with no single dominant player. Most implementations are simple web games or small mobile apps. The puzzle is most popular in Japan but has a dedicated Western following among logic puzzle enthusiasts.

### Competitor Categories
- **Web-based puzzle portals** — largest number of implementations
- **Mobile apps (iOS/Android)** — a handful of dedicated apps
- **Console/PC (Xbox, Switch)** — official Nikoli-branded releases
- **Print/PDF puzzle books** — KrazyDad, Amazon books

---

## Top 3 Competitors

### 1. puzzle-masyu.com — Web

**URL:** https://puzzle-masyu.com  
**Platform:** Web (mobile-responsive), companion iOS/Android apps at puzzles-mobile.com  
**Publisher:** Puzzle Team Club (puzzle network with 30+ puzzle types)

#### Grid Sizes & Levels
| Grid Size | Easy | Normal | Hard |
|-----------|------|--------|------|
| 6×6       | ✅   | —      | —    |
| 8×8       | ✅   | ✅     | ✅   |
| 10×10     | ✅   | ✅     | ✅   |
| 15×15     | ✅   | ✅     | ✅   |
| 20×20     | ✅   | ✅     | ✅   |
| 25×25     | ✅   | ✅     | ✅   |

- **Total size+difficulty combos:** 16
- **Special puzzles:** Daily, Weekly, Monthly
- **Unlimited puzzles:** Server-generated, never runs out

#### Core Gameplay Mechanics
- Click between dots to draw line segments
- Right-click to mark with X (elimination notation)
- Standard Masyu rules (black circles turn, white circles go straight)
- Single continuous loop, no crossings or branches

#### Scoring System
- **Timer:** Competitive timer (global) + optional non-competitive personal timer
- **Achievements:** Star icon for solving 100 consecutive puzzles in a category
- **Hall of Fame:** Global leaderboard for fastest solves
- **Statistics:** Personal solve statistics tracked
- **Checkpoints:** Save/restore puzzle progress mid-solve (Ctrl+S)

#### UI/UX Features
- ✅ **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- ✅ **Zoom slider** (0.15x to 6x) with fit-to-screen option
- ✅ **Auto-submit** when solution is complete
- ✅ **Night/dark mode**
- ✅ **Board coordinates** (row/column labels)
- ✅ **Highlight last change**
- ✅ **Highlight wrong moves** (error detection)
- ✅ **Color-blind mode** (blue for errors instead of red)
- ✅ **Ghost lines mode** (preview line segments)
- ✅ **Magnifier** for precise drawing on mobile
- ✅ **Left-handed mode**
- ✅ **Progress saving** (localStorage, resumes on revisit)
- ✅ **Share** (permalink + screenshot URL)
- ✅ **Print** (mass print support)
- ✅ **Video tutorial** (YouTube playlist)
- ✅ **5 drawing modes**: Rotate, Black (draw line), Cross (X mark), Eraser, Fill/Hatch
- ✅ **Hide/show game controls**, sticky toolbar option
- ✅ **Multi-language** (15+ languages: EN, FR, DE, ES, IT, RU, JA, KO, ZH, NL, etc.)

#### Visual Style
- Clean, minimal design with dot-grid layout
- Light theme default with dark mode toggle
- Lines drawn as solid black segments between grid dots
- Black circles = filled, White circles = hollow
- Sidebar navigation with puzzle size selector
- Ad banners on top and right sidebar (desktop)

#### Music/Sound
- ❌ No music or sound effects

#### Monetization
- **Free to play** with ads (Freestar ad network)
- Banner ads: leaderboard top (320×100 / 970×90) + right sidebar (160×600 / 300×250 / 300×600)
- **"Become a Patron"** option to remove ads
- **"Report This Ad"** option for user control
- **Pin ads** option to keep ads in place while scrolling

#### Key Numerical Values
- Puzzle ID counter at **3,000,000+** (millions of unique puzzles served)
- 16 size × difficulty categories
- 3 special timed puzzle types (daily/weekly/monthly)
- Companion mobile apps (iOS App Store + Google Play)

---

### 2. Masyu Infinite — iOS

**URL:** https://apps.apple.com/us/app/masyu-infinite/id1192493351  
**Platform:** iOS (iPhone/iPad)  
**Developer:** kakuro-online.com (same as kakuro-online.com/masyu web version)  
**Launch:** January 2017

#### Grid Sizes & Levels
| Feature | Details |
|---------|---------|
| Generator grid sizes | 5×5 to 18×18 |
| Difficulty levels | 3 (Easy, Medium, Hard) |
| Daily puzzle sizes | 18×10 (Mon) → 36×20 (Sun) |

- **Unlimited puzzles** via procedural generator
- **Free daily puzzle** that scales in difficulty throughout the week

#### Core Gameplay Mechanics
- Tap/drag to draw line segments on grid
- Standard Masyu rules
- Auto-detection of solving progress (recognizes when loop is complete)
- Related web version at kakuro-online.com/masyu has a "Guess Mode" for trying logic branches

#### Scoring System
- **Daily puzzle** provides a benchmark challenge
- No explicit scoring, stars, or leaderboard system found

#### UI/UX Features
- ✅ **Zoomable and draggable** playing grid (critical for large puzzles)
- ✅ **Auto-detection** of solving progress
- ✅ **Puzzle generator** — new puzzles on demand
- ✅ **Daily puzzle** — free, rotating difficulty
- ❌ No explicit undo/redo mentioned
- ❌ No hint system mentioned
- ❌ No tutorial

#### Visual Style
- Minimal, utilitarian interface
- Designed for touch interaction
- Grid-focused with limited chrome

#### Music/Sound
- ❌ No music or sound features mentioned

#### Monetization
- Free download
- Ad-supported (likely — standard for free iOS puzzle apps)
- No IAP mentioned explicitly

#### Key Numerical Values
- Grid sizes: **5×5 to 18×18** (generator), **18×10 to 36×20** (daily)
- 3 difficulty levels
- Released January 2017

---

### 3. Puzzle by Nikoli W: Masyu — Xbox / Windows

**URL:** https://xbox.com/en-CA/games/store/puzzle-by-nikoli-w-masyu/9PFVSBZNGV5X  
**Platform:** Xbox One, Xbox Series X\|S, Windows PC  
**Developer/Publisher:** Hudson Soft / Nikoli  
**Release:** March 2023

#### Grid Sizes & Levels
| Feature | Details |
|---------|---------|
| Total puzzles | **50** |
| Difficulty range | Beginner to Advanced (tiered progression) |

- Curated puzzles from Nikoli's editorial team (premium hand-crafted quality)
- No procedural generation — finite puzzle set

#### Core Gameplay Mechanics
- Draw lines through spaces on the grid per standard Masyu rules
- No numbers or letters — only black and white circles as hints
- Controller-optimized interface

#### Scoring System
- **Xbox Achievements:** 1000 Gamerscore (1000 GS completable in 1–1.5 hours)
- No in-game timer or leaderboard system
- Completion tracking (puzzles solved / 50)

#### UI/UX Features
- ✅ **Tutorial** for learning circle rules
- ✅ **Undo** support
- ✅ **Hint system** (built into puzzle presentation)
- ✅ **Progress tracking** (which puzzles completed)
- ❌ No daily puzzles
- ❌ No puzzle generator
- ❌ No multiplayer

#### Visual Style
- Clean, console-polished presentation
- Likely uses Nikoli's signature Japanese aesthetic
- Controller-friendly UI optimized for TV

#### Music/Sound
- ✅ Background music (typical of Nikoli console puzzle games)
- ✅ Sound effects for placing/clearing lines
- Generally calm, meditative audio per Nikoli puzzle game tradition

#### Monetization
- **Paid game** (~$7.99 USD, standard pricing for Nikoli puzzle titles on Xbox)
- No ads, no IAP
- One-time purchase for all 50 puzzles

#### Key Numerical Values
- **50 hand-crafted puzzles**
- **1000 Gamerscore** (Xbox achievements)
- Review: **4/5** from TheXboxHub
- Part of the "Puzzle by Nikoli W" series (multiple puzzle types available separately)

---

## Other Notable Competitors

### GridPuzzle.com/masyu (Web)
- **URL:** https://gridpuzzle.com/masyu
- Free online Masyu with multiple grid sizes and difficulty levels
- Daily new challenges
- Browser-based, no signup required
- Part of a larger puzzle portal (GridPuzzle.com)
- Training and logic skill improvement focus

### KrazyDad.com/masyu (Web + Printable)
- **URL:** https://krazydad.com/masyu
- Printable PDF booklets + interactive browser puzzles
- **Grid sizes:** 6×6 (Easy/Medium/Hard), 8×8, 10×12, 14×14
- **32 puzzles per booklet**, 4 books per size = ~128+ per size tier
- **Volumes:** Multiple volumes per size category
- Tutorial available on how to solve Masyu
- Completely free, no ads, no account needed
- Created by Jim Bumgardner (puzzle constructor)
- Interactive version available at derp.krazydad.com

### PZL.org.uk/masyu (Desktop)
- **URL:** https://pzl.org.uk/masyu.html
- Desktop application (Windows/Mac/Linux)
- **1,000 puzzles** ordered by difficulty score
- Hints system with two-letter codes
- Timer display
- Video demonstration available
- Free download, open-source-ish

### MindGames.com Daily Masyu (Web)
- **URL:** https://mindgames.com/game/Daily+Masyu
- **3 new puzzles daily** in 3 different sizes
- Free browser play
- Part of a large brain games portal

### Masyu.zone (Web)
- **URL:** https://masyu.zone
- Free online Masyu
- Note: mathematically NP-complete on arbitrarily sized grids
- Typically small grids for reasonable solve times

### Masyu Logic Loop Puzzle Game (Android)
- **Package:** com.rooftop.masyu (Google Play)
- Free Android app
- Current version: 1.1.14
- Multiple skill levels
- Relaxation-focused positioning

### Masyu Classic (iOS)
- **Developer:** Leah Stewart
- Elegant logic puzzle for "thoughtful minds"
- Simple iOS app

### Masyu Puzzle (iOS)
- **App Store ID:** 1071607348
- Popular Japanese puzzle game
- User reviews note: crashes, segment-by-segment drawing (no continuous line), progress maintained between sessions
- Returns to start screen after level completion (UX issue)

---

## Feature Comparison Matrix

| Feature | puzzle-masyu.com | Masyu Infinite (iOS) | Nikoli W (Xbox) | KrazyDad | GridPuzzle |
|---------|:-:|:-:|:-:|:-:|:-:|
| **Platform** | Web | iOS | Xbox/Win | Web/PDF | Web |
| **Grid sizes** | 6×6–25×25 | 5×5–18×18 (gen) | Fixed set | 6×6–14×14 | Multiple |
| **Difficulty levels** | 3 per size | 3 | Tiered | 3 per size | Multiple |
| **Unlimited puzzles** | ✅ | ✅ (gen) | ❌ (50) | ✅ (print) | ✅ |
| **Daily puzzle** | ✅ (+weekly/monthly) | ✅ | ❌ | ❌ | ✅ |
| **Timer** | ✅ (competitive + personal) | ❌ | ❌ | ❌ | ✅ |
| **Undo/Redo** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Hints** | ❌ | ❌ | ✅ | Tutorial | ❌ |
| **Error highlighting** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Progress saving** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Zoom** | ✅ (0.15x–6x) | ✅ | — | ❌ | ❌ |
| **Dark mode** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tutorials** | ✅ (video) | ❌ | ✅ | ✅ (written) | ❌ |
| **Achievements** | ✅ | ❌ | ✅ (1000GS) | ❌ | ❌ |
| **Leaderboard** | ✅ (Hall of Fame) | ❌ | ❌ | ❌ | ❌ |
| **Multi-language** | ✅ (15+) | ❌ | ❌ | EN only | ✅ |
| **Music/Sound** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Ads** | ✅ (Freestar) | Likely | ❌ | ❌ | Unknown |
| **Price** | Free (+patron) | Free | ~$7.99 | Free | Free |
| **Mobile app** | ✅ (iOS+Android) | ✅ | ❌ | ❌ | ❌ |
| **Print support** | ✅ | ❌ | ❌ | ✅ (primary) | ❌ |

---

## Key Takeaways & Opportunities

### Market Gaps

1. **No polished HTML5 Masyu with modern UX exists.** puzzle-masyu.com is the closest but has an aging interface with heavy ad presence. A clean, modern web experience is wide open.

2. **Sound and music are universally absent** in web/mobile Masyu games (only the Nikoli Xbox version has audio). This is a significant differentiator.

3. **No web Masyu game combines all of:** tutorial system + hint system + undo/redo + error highlighting + timer + achievements + dark mode. puzzle-masyu.com comes closest but lacks hints and sound.

4. **Daily challenges with streak/reward mechanics** are underexploited. Only puzzle-masyu.com offers daily/weekly/monthly specials.

5. **Progressive difficulty with guided onboarding** is missing everywhere. Most games assume you already know Masyu rules.

### Competitive Advantages to Pursue

| Opportunity | Details |
|------------|---------|
| **Modern visual design** | Clean, animated, satisfying visual feedback (loop completion animations, particle effects) |
| **Audio experience** | Ambient music + satisfying line-drawing sounds + completion jingles |
| **Guided tutorial system** | Interactive step-by-step tutorial that teaches rules through play, not just text |
| **Hint system** | Progressive hints (highlight a cell → show a segment → reveal area) — nobody does this well on web |
| **Star/scoring system** | Time-based stars (⭐⭐⭐) per puzzle, visible progress — more engaging than a raw timer |
| **Level progression** | Curated level packs with increasing difficulty, not just random generation |
| **Responsive design** | Touch-optimized for mobile browsers, no app download needed |
| **No heavy ads** | Minimal or no advertising; cleaner experience than puzzle-masyu.com |
| **Share & social** | Share completed puzzle images, daily challenge comparisons |
| **Accessibility** | Color-blind mode, keyboard navigation, screen reader support |

### Benchmark Numbers for Our Game

Based on competitor analysis, recommended targets:

| Metric | Competitor Range | Our Target |
|--------|-----------------|------------|
| Grid sizes | 5×5 to 36×20 | 5×5 to 20×20 |
| Level count | 50–1000+ | 200+ curated + daily |
| Difficulty tiers | 3 | 4 (Tutorial → Easy → Medium → Hard) |
| Tutorial levels | 0–5 | 10+ interactive guided puzzles |
| Hint granularity | None or basic | 3-level progressive hints |
| Star rating | None | ⭐⭐⭐ per puzzle (time-based) |
| Languages | 1–15 | EN + expand later |
| Audio | None (web) or full (console) | Ambient music + SFX |
| Ads | Heavy or none | Optional rewarded ads only |

---

*End of benchmark document.*
