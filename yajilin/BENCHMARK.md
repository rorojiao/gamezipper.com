# Yajilin Puzzle Game — Competitive Benchmark & Analysis

> **Date:** June 2026  
> **Purpose:** Competitive analysis for building a commercial-quality Yajilin HTML5 game  
> **Puzzle Origin:** Yajilin (ヤジリン), first published in Puzzle Communication Nikoli #86 (June 1999) by 猫山天歩 (Nekoyama Tenpo). Name = ヤジルシ (yajirushi = arrow) + リンク (rinku = link). Also known as "Arrow Ring" (2005 WPC qualifier).

---

## Executive Summary

**Yajilin is significantly underserved online.** Unlike Sudoku, Slitherlink, or Nurikabe, there is no major polished web implementation with modern UI, progressive difficulty, hints, tutorials, and progress tracking. The biggest gaps are:

- **No modern, mobile-responsive web game** exists
- **No ad-supported or freemium Yajilin game** on any platform
- **Only 1 dedicated mobile app** ("loopr"), launched June 2026 with ~10 downloads
- **Major puzzle networks** (puzzle-X.com, BrainBashers, Conceptis, puzzlemix, Simon Tatham's) either lack Yajilin entirely or bury it as one-of-many
- **Clear market opportunity** for a well-built HTML5 Yajilin game with tutorial, progressive levels, hints, undo, progress save, and daily challenges

---

## Summary Comparison Table

| Feature | Nikoli (Official) | Janko.at | Simon Tatham's "Pearl" | loopr (Mobile App) | GM Puzzles |
|---------|-------------------|----------|----------------------|---------------------|------------|
| **Platform** | Print / Web (subscription) | Web (desktop) | Web / Desktop / Android/iOS | Android / iOS | Web (Penpa-Edit) |
| **Price** | Paid subscription | Free (CC BY-NC-SA) | Free (open source) | ~$2.99 paid | Free + e-books |
| **Puzzle Count** | Hundreds (decades of magazines) | **600+** | Unlimited (procedural) | Hundreds + daily | 114+ |
| **Grid Sizes** | 7×7 to 25×25+ | 7×7 to 45×31 | Adjustable (any size) | Multiple (easy/med/hard) | 10×10+ (recommended) |
| **Interactive Solving** | ✅ (subscription only) | ✅ (basic toolbar) | ✅ (full) | ✅ (touch-optimized) | ✅ (via Penpa-Edit) |
| **Tutorial** | ❌ (rules only) | ✅ (illustrated techniques) | ❌ | ✅ (interactive lessons) | ❌ |
| **Hints System** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Undo/Redo** | ❌ | ❌ | ✅ | ✅ | ✅ (Penpa) |
| **Progress Save** | ❌ | ❌ | ❌ (session only) | ✅ (accounts) | ❌ |
| **Timer** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Mobile Optimized** | ❌ | ❌ | Partial | ✅ | ❌ |
| **Difficulty Rating** | Progressive | By logical step count | Adjustable params | Easy/Medium/Hard | 1–5 stars (community) |
| **Scoring** | None | None | Time-based | Streaks + badges | Solving times |
| **Music/Sound** | None | None | None | Unknown | None |
| **Monetization** | Magazine/book sales | Donations | None (volunteer) | Paid upfront | E-book sales |

---

## Official Nikoli Rules (Canonical)

**Source:** nikoli.co.jp/en/puzzles/yajilin/

### Core Rules

1. **Draw a single continuous loop.** Lines pass through the centers of cells, horizontally or vertically. The loop never crosses itself, branches off, or goes through the same cell twice.
2. **Numbers with arrows indicate how many black cells exist in the arrow's direction.** The count extends to the edge of the grid (not just to the next number).
3. **The loop does not pass through black cells or cells with numbers.** Black cells cannot touch horizontally or vertically (no orthogonally adjacent black cells).
4. **All cells that are neither black nor numbered must be visited by the loop.** There may be black cells not accounted for by any arrow clue.

### Visual Conventions
- Arrow cells contain a number + directional arrow (up/down/left/right)
- Black cells are filled/shaded
- Loop segments are drawn through cell centers

### Grid Size Conventions
- No fixed size; rectangular grids of any dimension
- Easy/introductory: 6×6 to 8×8
- Standard: 10×10 to 15×15
- Expert: 17×17 to 25×25+
- Maximum recommended aspect ratio: 2:1

### Rule Variants
- **GM Puzzles variant:** Black cells may exist without arrow clues (more liberal than standard)
- **Competition variants:** Various hybrids appear in WPC events
- **Yajisan-Kazusan:** Related but distinct Nikoli puzzle with arrow-based shading but different loop rules

---

## Competitor 1: Janko.at — Largest Free Online Collection

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.janko.at/Raetsel/Yajilin/index.htm |
| **Platform** | Web (desktop-focused, not mobile-responsive) |
| **Price** | Free (Creative Commons BY-NC-SA 3.0) |

### Puzzle Library
- **600+ puzzles** — the largest free Yajilin collection found online
- Grid sizes: 7×7, 10×10, 11×11, 12×12, 13×13, 14×14, 15×15, 16×16, 17×17, 19×19, 25×25, 30×30, plus rectangular (18×10, 36×20, 45×31)
- Sorted by: Date, Size, Difficulty
- Difficulty measured by logical step count (~100 to ~1000+ steps, with granular bands)

### Interactive Features
- Toolbar with multiple tools: keep, reverse black, Japanese arrows, directional arrows, link/path drawing
- Online solving + print option
- Rules available in DE/EN/JA

### Tutorial System
- **Only site with structured solving tutorials** — "Wie löst man Yajilin Rätsel"
- Named techniques: neighbor rule, two-neighbors rule, dead-end avoidance, particle rules, meta-rules
- Visual walkthrough examples for each technique

### Weaknesses
- Dated early-2000s web design
- No user accounts or progress tracking
- No undo/redo system
- Not mobile-responsive
- No hints system
- No timer or scoring
- No sound or music

### Monetization
- Completely free, no ads, donation-supported

---

## Competitor 2: Simon Tatham's Portable Puzzle Collection — "Pearl"

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.chiark.greenend.org.uk/~sgtatham/puzzles/ (web) / Google Play (Android) |
| **Platform** | Web (JS/WebAssembly), Windows, macOS, Android, iOS |
| **Price** | Free, fully open-source (MIT license) |
| **Rating** | 4.9 stars (16.5K reviews) on Google Play |
| **Downloads** | 1M+ (entire collection) |

### Core Implementation
- Yajilin is included as **"Pearl"** — one of 40 puzzle types
- Procedurally generated on demand with adjustable grid size and difficulty
- **Unlimited puzzles** — never runs out

### UI/UX Features
- Undo/redo support
- Timer display
- Pinch-to-zoom on mobile
- On-screen arrow keys for small screens
- Press/long-press swap option
- Offline playable
- Cross-platform consistency

### Weaknesses (for Yajilin specifically)
- Yajilin is **buried** among 40 other puzzles — not discoverable by Yajilin searchers
- No Yajilin-specific tutorial or rules explanation
- No progressive difficulty or curated level order
- Minimal visual feedback
- No community or sharing features
- Occasional freezing on very large grids

### Monetization
- Completely free, no ads, no IAP, no data collection
- Volunteer-maintained open-source project

---

## Competitor 3: loopr — Yajilin Logic Puzzles (Mobile App)

| Attribute | Details |
|-----------|---------|
| **Developer** | leoncross |
| **Platform** | Android (Google Play) + likely iOS |
| **Price** | ~$2.99 (HK$23.00) — paid upfront |
| **Launch** | June 2, 2026 (very new) |
| **Downloads** | 10+ |

### Core Features
- **Daily puzzles** at 3 difficulty levels
- **Endless mode** — hundreds of handcrafted puzzles across easy/medium/hard
- **"The Gauntlet"** — massive weekly puzzle
- **Dedicated tutorial** with interactive lessons and tips
- **Hints system**
- **Badges and milestones** — achievement tracking
- **Streaks tracking** — daily engagement mechanic
- **Accessibility:** Adjustable text size, high contrast mode, reduced animations

### Visual Design
- Clean, minimal design with dark theme
- Touch-optimized for mobile

### Monetization
- Paid upfront (~$2.99), no ads, no IAP mentioned
- Data: No third-party sharing, encrypted in transit

### Weaknesses
- Extremely new with minimal user base
- Unknown puzzle quality and generation approach
- Not available on web
- Single developer, sustainability uncertain

### Key Takeaway
This is the **closest competitive model** to a commercial Yajilin game. It validates the market: someone built a dedicated Yajilin app with modern features and is charging for it.

---

## Competitor 4: GM Puzzles / Grandmaster Puzzles

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.gmpuzzles.com |
| **Platform** | Web |
| **Price** | Free puzzles + paid e-books |

### Core Features
- 114+ Yajilin puzzles (classic + variants)
- Community-rated from 1 to 5 stars
- Interactive solving via Penpa-Edit integration
- Competition-grade puzzles from WPF events and expert authors
- Puzzle variants and hybrids not available elsewhere

### Weaknesses
- Penpa-Edit interface is complex and not beginner-friendly
- No curated difficulty progression
- No mobile optimization
- No tutorial for Yajilin specifically

### Monetization
- Free puzzles on website
- Paid e-book compilations

---

## Competitor 5: Logic Masters Deutschland (Rätselportal)

| Attribute | Details |
|-----------|---------|
| **URL** | https://logic-masters.de/Raetselportal/ |
| **Platform** | Web |
| **Price** | Free (community-run) |

### Core Features
- Large community-contributed Yajilin puzzle library
- User accounts with solving statistics
- Community ratings and solving times
- Discussion/comments on puzzles
- Competition-grade puzzles from WPF events
- Penpa-Lite editor for interactive solving
- Print option

### Weaknesses
- German-language focused (international barrier)
- Not a polished game experience
- Penpa-Edit has steep learning curve

---

## Confirmed Non-Competitors

The following major puzzle platforms were verified to **NOT** offer Yajilin:

| Platform | What They Offer Instead |
|----------|----------------------|
| **puzzle-X.com network** (30+ domains) | Bridges, Slitherlink, Masyu, Heyawake, Tents, Nurikabe, Dominosa, Shingoki — but NO Yajilin |
| **BrainBashers.com** | 20+ daily Japanese puzzles (Bridges, Slitherlink, Light Up, etc.) — no Yajilin |
| **Conceptis Puzzles** | 20+ types (Hashi, Slitherlink, Nurikabe, etc.) — no Yajilin |
| **puzzlemix.com** | Sudoku variants, Hanjie, Kakuro, Nurikabe, Slitherlink — no Yajilin |
| **KrazyDad** | Many puzzle types — no Yajilin |
| **PuzzlesAndBrains.com** | Masyu, Nurikabe, Kuromasu — no Yajilin |

**This is remarkable.** Yajilin is one of Nikoli's classic puzzles, yet it is absent from nearly every major puzzle platform. This underscores the market gap.

---

## Solver & Generator Technology Analysis

### Open-Source Solvers

| Repository | Language | Algorithm | Notes |
|------------|----------|-----------|-------|
| **SmilingWayne/puzzlekit** | Python | OR-Tools CP-SAT with circuit constraint | Best option; actively maintained; 100+ puzzle types; MIT license |
| **ytakata69/yajilin-sat** | Python | SAT (CNF → MiniSAT) | Detailed SAT encoding; pivot optimization |
| **jolyonb/blog_puzzles** | Python + Clingo | Answer Set Programming | Supports variants (full-lane, one-off, closed-loop) |
| **xenix1337/YajilinSolver** | C++ | Logic strategies + backtracking | Human-like deduction before brute force |
| **Copris** (Naoyuki Tamura) | Scala | Constraint Programming (Sat4j) | Solver + generator for 20+ types |
| **noq.solutions** | Web | Web-based solver | Interactive grid input |

### Recommended Solver Architecture: OR-Tools CP-SAT

The **puzzlekit** approach is recommended for production:
- Uses `add_circuit_constraint_from_undirected()` for single-loop enforcement
- Boolean `node_active` per cell: 0 = black/given, 1 = loop passes through
- Arrow clue constraint: `sum(cells) + num + occupied_cnt == len(cells)`
- No-adjacent-black: `node_active[i][j] + node_active[i+1][j] >= 1`
- MIT license, pip-installable (`pip install puzzlekit`)
- 41,000+ puzzle datasets included

### Puzzle Generation Technique (Generate-and-Test)

The standard approach for pencil puzzle generation:

1. **Generate a random valid loop** on the grid (Hamiltonian-like cycle using randomized DFS or Wilson's algorithm)
2. **Assign black cells:** Cells not on the loop become black cells
3. **Add clues:** For some black cells, add arrow+number clues
4. **Verify uniqueness:** Use solver to confirm exactly one solution exists
5. **Adjust difficulty:** Remove clues iteratively until desired difficulty reached
   - More clues = easier for humans (more constrained, but counterintuitively faster for computers)
   - Fewer clues = harder (less constrained, may require advanced techniques)

### Existing Infrastructure

| Resource | License | Use Case |
|----------|---------|----------|
| **puzzlekit** (PyPI) | MIT | Solver, verifier, 41k+ datasets |
| **ppbench** (approximatelabs) | MIT | Step-level verifiers, Gym environment, 62k dataset |
| **pzprjs** | MIT | JavaScript puzzle engine for web rendering |

### Complexity

- Yajilin is **NP-complete** (combines Hamiltonian cycle + exact cover)
- Practical limits: 7×7 solves in milliseconds; 20×20 in seconds; 25×25+ may need optimization
- SAT encoding variables: O(W²H²) — dominated by reachability constraints

---

## puzzle-X.com Network as Reference UX Model

Although puzzle-X.com doesn't offer Yajilin, it represents the **gold standard** for commercial-quality web puzzle games and should be the UX benchmark:

| Feature | Implementation |
|---------|---------------|
| **Grid sizes** | 5×5 to 25×25 (4 options) |
| **Difficulty** | Easy / Normal / Hard / Dense |
| **Daily specials** | Daily / Weekly / Monthly unique puzzles |
| **Controls** | Undo/Redo, Zoom, Settings |
| **Social** | Share, Print, Hall of Fame |
| **Statistics** | Per-puzzle solving stats |
| **Platform** | Web + iOS + Android apps |
| **Monetization** | Display ads + Patreon support |
| **Puzzle count** | 30+ puzzle types across 30+ domains |

---

## Recommendations for Commercial Yajilin HTML5 Game

### Must-Have Features (based on competitive gap analysis)

1. **Interactive tutorial** — Only loopr and Janko.at have this; a guided, step-by-step interactive tutorial is a key differentiator
2. **Progressive difficulty** — Curated levels from 6×6 (tutorial) through 25×25 (expert)
3. **Hints system** — Only loopr offers hints; use the logic-strategy solver to provide contextual hints
4. **Undo/Redo** — Critical for puzzle games; missing from most competitors
5. **Progress save** — Only loopr has this; essential for engagement
6. **Mobile-responsive design** — No competitor has a polished mobile web experience
7. **Timer + statistics** — Basic gamification that most competitors lack
8. **Daily challenges** — Proven engagement mechanic from puzzle-X.com model
9. **Clean, modern visual design** — Every existing competitor has dated or utilitarian aesthetics

### Differentiation Opportunities

1. **Procedural generation** with guaranteed unique solutions (unlike handcrafted-only competitors)
2. **Streak and achievement systems** (loopr has this; no web competitor does)
3. **Solving technique library** — Teach players advanced strategies (Janko.at's tutorial content but interactive)
4. **Sound design and ambient music** — No competitor has any audio
5. **Dark/light theme toggle** with accessibility options
6. **Share puzzle** feature (social media image export)

### Monetization Options

| Model | Pros | Cons |
|-------|------|------|
| **Ad-supported (free)** | Maximum reach; proven by puzzle-X.com | Revenue depends on traffic |
| **Freemium** (free daily + paid unlock) | Balances reach + revenue | Complexity in implementation |
| **Patreon/subscription** | Recurring revenue | Requires sustained content |
| **Paid upfront** (like loopr) | Simple; no ads | Limits discoverability |
| **Hybrid** (ads + remove-ads IAP) | Flexible; user choice | Most complex to implement |

### Technical Stack Recommendations

- **Frontend:** HTML5 Canvas or SVG for grid rendering; touch + mouse input
- **Solver backend:** OR-Tools CP-SAT (Python) via WASM or server API, OR port logic to JavaScript
- **Generator:** Generate-and-test pipeline with difficulty grading
- **Storage:** LocalStorage for progress; optional cloud sync
- **Reference implementations:** pzprjs (MIT) for rendering patterns, puzzlekit (MIT) for solving logic

---

## Conclusion

The Yajilin puzzle game market is wide open. Despite being a classic Nikoli puzzle since 1999, there is no dominant digital implementation. The only dedicated app (loopr) launched days ago with minimal traction. The largest web collection (Janko.at) has a dated interface with no modern UX features. Simon Tatham's collection buries Yajilin as "Pearl" among 40 other puzzles.

A well-built HTML5 Yajilin game with modern UI, interactive tutorial, progressive difficulty, hints, undo, progress tracking, and mobile responsiveness would fill a clear market gap and face minimal direct competition.
