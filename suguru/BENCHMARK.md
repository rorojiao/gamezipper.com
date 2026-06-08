# Suguru Puzzle Game - Competitive Benchmark

> **Document purpose:** Research findings for the Suguru puzzle game to be developed for gamezipper.com. Target: S-grade commercial quality, single-file HTML5 Canvas game.
>
> **Research date:** June 8, 2026

---

## Table of Contents

1. [What Is Suguru?](#1-what-is-suguru)
2. [Competitor Landscape Overview](#2-competitor-landscape-overview)
3. [Competitor Deep Dives](#3-competitor-deep-dives)
4. [Feature Comparison Matrix](#4-feature-comparison-matrix)
5. [UI/UX Patterns](#5-uiux-patterns)
6. [Scoring and Progression Systems](#6-scoring--progression-systems)
7. [Monetization Models](#7-monetization-models)
8. [Web-Based Implementations](#8-web-based-implementations)
9. [Music and Sound Design Patterns](#9-music--sound-design-patterns)
10. [Gaps and Opportunities](#10-gaps--opportunities)
11. [Recommendations for gamezipper.com](#11-recommendations-for-gamezippercom)

---

## 1. What Is Suguru?

**Suguru** (also known as **Tectonic**, **Number Blocks**, or **Kemaru**) is a logic-based number-placement puzzle. It was popularized in Japan and is associated with the Nikoli puzzle publishing house.

### Rules
1. The grid is divided into **irregular regions** (blocks) of varying sizes (typically 1-5 cells, sometimes up to 6+).
2. Each region of size N must contain the digits **1 through N** exactly once.
3. No two **identical numbers** may be **orthogonally or diagonally adjacent** - this is the key constraint that differentiates Suguru from Sudoku.
4. Every puzzle has a **unique solution** solvable through pure logic (no guessing required).

### Comparison to Similar Puzzles
| Puzzle | Grid | Constraint Type |
|--------|------|----------------|
| Sudoku | 9x9 with 3x3 boxes | Rows, columns, boxes must contain 1-9 |
| **Suguru** | **Variable grid with irregular regions** | **Region fills 1-N, no same number touches (including diagonal)** |
| Ripple Effect | Variable grid with regions | Region fills 1-N, same number must be k-distance apart |

---

## 2. Competitor Landscape Overview

### Mobile Apps (Google Play / App Store)

| App | Developer | Downloads | Rating | Monetization |
|-----|-----------|-----------|--------|-------------|
| **Suguru: Logic Puzzles** | brennerd | 10K+ | N/A | Ads + IAP |
| **Suguru and Variants by Logic Wiz** | Logic-Wiz | 50K+ | N/A | Ads + IAP |
| **Suguru Master: Logic Puzzles** | PT Apps | 100+ | N/A | Ads only |
| **Suguru Infinite** | CMLabApps | 50+ | N/A | Ads + IAP |
| **Suguru Daily** | Brain Awake | 10+ | N/A | IAP (subscription) |
| **Play Suguru** | Aliaksandr Uvarau | N/A | 4.1 stars | N/A |
| **Arturo Suguru** | Toupeti Studio | N/A | N/A | N/A |
| **SUGURU tectonic** | B20 Conteudo Digital | N/A | N/A | N/A |

### Key Observation
Suguru is a **niche puzzle genre** with relatively low download counts compared to Sudoku/Killer Sudoku. The most popular Suguru app (Logic Wiz) has 50K+ downloads, whereas popular Sudoku apps have millions. **This represents a significant opportunity** for a high-quality web implementation.

### Web Implementations
**No major web-based Suguru implementations were found.** This is a major gap in the market:
- BrainBashers - No Suguru/Tectonic
- Simon Tatham's Portable Puzzle Collection - No Suguru
- Conceptis Puzzles - No Suguru
- puzzle-XXX network (puzzle-bridges, puzzle-shingoki, etc.) - No Suguru
- puzzle-suguru.com - Domain exists but site is unreachable

---

## 3. Competitor Deep Dives

### 3.1 Suguru: Logic Puzzles (brennerd)

| Attribute | Details |
|-----------|---------|
| **Platform** | Android, Windows |
| **Downloads** | 10K+ |
| **Price** | Free |
| **Monetization** | Contains ads, in-app purchases |
| **Puzzles** | Custom handcrafted (all by brennerd) |
| **Difficulty** | Easy to Expert |
| **Features** | Solution check, unlimited hints with explanations, offline, dark mode, multiple color themes |
| **Grid sizes** | Not specified (variable) |
| **Last updated** | April 21, 2026 |
| **Website** | brennerd.com/puzzle_games/ |

**Key strengths:**
- Unlimited hints with logical explanations
- Works fully offline
- Multiple color themes and dark mode
- Clean, focused design philosophy
- Developer creates all puzzles (quality control)

**Weaknesses:**
- No variants or advanced modes
- No daily challenge
- No scoring/star system mentioned
- Relatively basic feature set

---

### 3.2 Suguru and Variants by Logic Wiz (Logic-Wiz)

| Attribute | Details |
|-----------|---------|
| **Platform** | Android, iOS, Windows |
| **Downloads** | 50K+ |
| **Price** | Free |
| **Monetization** | Contains ads, in-app purchases |
| **Puzzles** | Thousands of handcrafted boards |
| **Difficulty** | Beginner to Expert |
| **Features** | See detailed list below |
| **Last updated** | April 22, 2026 |
| **Website** | logic-wiz.com |
| **Awards** | "Best Sudoku App" and "Best Brain Training App" |

**Variants offered (25+):**
Classic, Killer, Thermo, Palindrome, Arrow, XV, Kropki, Ones, Reflection, Bishop, Even-Odd, German Whispers, Dutch Whispers, Renban lines, Little Unique Killer, Between Lines, Lockout lines, Slingshot, Quadruple, Consecutive, Non-consecutive, Diagonal, Chess Knight

**Full feature list:**
- Smart hints (teaching-oriented)
- Weekly Challenge
- Gallery game view
- Play multiple games concurrently
- Cloud Sync across devices
- Keep Screen Awake option
- Light and Dark Theme
- Sticky digit mode
- Remaining cells counter per digit
- Select multiple cells at once
- Multiple pencil marks styles
- Double notation support
- Auto-remove pencil marks
- Highlight matching digits and pencil marks
- Multiple error modes
- Performance tracking per puzzle
- Statistics and Accomplishments
- Unlimited Undo/Redo
- Cell marking (highlights + symbols)
- Board preview
- Mobile phones and tablets support

**Key strengths:**
- Most feature-rich Suguru app on the market
- 25+ puzzle variants - unmatched variety
- Cloud sync for cross-device play
- Award-winning developer with 10M+ total downloads
- Professional-grade UI/UX

**Weaknesses:**
- May be overwhelming for new players
- Ads can be intrusive (IAP to remove)

---

### 3.3 Suguru Master: Logic Puzzles (PT Apps)

| Attribute | Details |
|-----------|---------|
| **Platform** | Android |
| **Downloads** | 100+ |
| **Price** | Free |
| **Monetization** | Contains ads |
| **Puzzles** | 90 handcrafted |
| **Difficulty** | 3 tiers (Easy/Medium/Hard) |
| **Last updated** | March 17, 2026 |

**Difficulty breakdown:**
| Level | Count | Grid Size | Regions |
|-------|-------|-----------|---------|
| Easy | 30 | 6x6 | 8-9 regions |
| Medium | 30 | 8x8 | 14 regions |
| Hard | 30 | 10x12 | 25 regions |

**Features:**
- Clean, colorful interface with clear region visualization
- Smooth animations
- Haptic feedback
- Puzzle statistics and completion tracking
- Progressive difficulty unlocking (complete stage to unlock next)
- No time limits
- Fully offline
- Suitable for ages 8 to 80+
- Completely free (no subscriptions, no purchases to unlock puzzles)

**Key strengths:**
- Well-structured progression system
- Clean, modern UI
- Haptic feedback (mobile-first)
- Age-inclusive design
- Truly free (all 90 puzzles accessible)

**Weaknesses:**
- Only 90 puzzles total (limited content)
- Very few downloads (new app)
- No hints system mentioned
- No daily challenge
- No undo/redo mentioned

---

### 3.4 Suguru Infinite (CMLabApps)

| Attribute | Details |
|-----------|---------|
| **Platform** | Android |
| **Downloads** | 50+ |
| **Price** | Free |
| **Monetization** | Contains ads, in-app purchases |
| **Puzzles** | Infinite (procedurally generated) |
| **Difficulty** | 5 levels (Easy, Classic, Hard, Expert, Master) |
| **Last updated** | May 24, 2026 |

**Features:**
- Infinite procedurally generated puzzles
- Different board sizes per difficulty
- Saved progress for current games
- Personal best times by mode
- Smart hints
- Clean visual design for focused play
- Light and dark themes
- Multiple notes support (improved readability)

**Key strengths:**
- Infinite content (procedural generation)
- 5 difficulty tiers
- Personal best tracking
- Fast, readable design

**Weaknesses:**
- Procedural puzzles may lack the elegance of handcrafted ones
- Very few downloads
- No weekly/daily challenge
- No scoring or star system

---

### 3.5 Suguru Daily (Brain Awake)

| Attribute | Details |
|-----------|---------|
| **Platform** | Android |
| **Downloads** | 10+ |
| **Price** | Free (with premium subscription) |
| **Monetization** | In-app purchases (subscription model) |
| **Puzzles** | 1 per day (shared globally - Wordle model) |
| **Difficulty** | Multiple tiers (premium unlocks hard/expert/extreme) |
| **Last updated** | May 30, 2026 |

**Pricing model:**
- **Free tier:** Daily puzzle, no ads, offline, no account required
- **Premium (monthly/annual subscription):** Expert difficulty levels, 3-week archive, PDF printout, detailed statistics

**Features:**
- Real-time conflict validation
- Same puzzle for all players (shared experience)
- Series tracking
- Statistics by difficulty
- Cross-device sync (optional account)
- No ads ever (free tier)

**Key strengths:**
- Wordle-like daily ritual model (high engagement)
- Completely ad-free (even in free tier)
- Real-time conflict highlighting
- Clean, focused experience
- "No luck, no guessing: only deduction" positioning

**Weaknesses:**
- Extremely limited free content (1 puzzle/day)
- Requires subscription for any depth
- Very few downloads (new niche app)
- No offline archive browsing

---

## 4. Feature Comparison Matrix

| Feature | brennerd | Logic Wiz | PT Apps | CMLabApps | Brain Awake |
|---------|----------|-----------|---------|-----------|-------------|
| **Puzzle count** | Custom | Thousands | 90 | Infinite (generated) | 1/day |
| **Grid sizes** | Variable | Variable | 6x6, 8x8, 10x12 | Variable | Variable |
| **Difficulty tiers** | 4+ | Beginner-Expert | 3 (Easy/Med/Hard) | 5 levels | Multiple |
| **Puzzle variants** | No | 25+ variants | No | No | No |
| **Hints** | Unlimited + explanation | Smart hints | No | Smart hints | No |
| **Undo/Redo** | Yes | Unlimited | No | Yes | Yes |
| **Pencil marks** | Yes | Multiple styles + double notation | No | Yes (multiple notes) | Yes |
| **Error highlighting** | Yes (check) | Multiple modes | Real-time validation | Real-time conflicts | Real-time conflicts |
| **Dark mode** | Yes | Yes | No | Yes | Yes |
| **Color themes** | Multiple | Yes | Clean colorful | Clean | Clean |
| **Daily challenge** | No | Weekly | No | No | Yes (core mechanic) |
| **Timer** | Yes | Yes | No | Personal best | Yes |
| **Scoring/Stars** | No | Statistics | Statistics | Best times | Statistics |
| **Offline play** | Yes | Yes | Yes | Yes | Yes |
| **Cloud sync** | No | Yes | No | No | Yes (optional) |
| **Progressive unlock** | No | No | Yes | No | No |
| **Haptic feedback** | No | No | Yes | No | No |
| **Print** | No | No | No | No | Yes (PDF) |
| **Region coloring** | Yes | Yes | Colorful regions | Yes | Yes |

---

## 5. UI/UX Patterns

### Region Visualization
All competitors use **color-coded regions** as the primary visual mechanism. Each irregular block is shaded with a distinct background color to help players identify region boundaries. This is critical for Suguru since the grid has irregular (non-rectangular) regions.

### Number Input Methods
1. **Tap-to-select, then tap number row** - The most common pattern. Tap a cell to select it, then tap a number from a number pad/row below/beside the grid.
2. **Sticky digit mode** (Logic Wiz) - Select a digit first, then tap cells to place it. Useful for filling in all instances of a specific number.
3. **Pencil marks** - Long-press or toggle to enter "notes mode" where multiple candidate numbers can be placed in a single cell as small digits.
4. **Auto-remove pencil marks** - When a number is placed, automatically remove that number from pencil marks in adjacent cells.

### Error Highlighting
- **Real-time conflict detection** - The most popular approach. When a placed number violates the adjacency rule, the conflicting cells are highlighted in red.
- **Manual check** - Some apps require the player to press a "Check" button to validate.
- **Multiple error modes** (Logic Wiz) - Configurable between no errors shown, conflicts only, or full validation.

### Common UI Elements
| Element | Description |
|---------|-------------|
| Grid | Central play area with colored regions |
| Number pad | Row of numbers (1-5 or 1-max region size) |
| Pencil toggle | Switch between "value" and "notes" mode |
| Undo/Redo | Standard history navigation |
| Hint button | Reveals a cell with explanation |
| Timer | Elapsed solving time |
| Remaining count | Shows how many of each digit remain |
| Progress bar | Percentage completion indicator |
| Region highlight | Tap a cell to highlight its entire region |

### Color Design Patterns
- **Pastel background colors** for regions (light blue, light green, light yellow, light pink, light purple, etc.)
- **Dark mode** with darker region shades
- **Selected cell** highlighted with a bright border or fill
- **Error cells** highlighted in red or with a red border
- **Completed regions** may dim or show a subtle checkmark

---

## 6. Scoring and Progression Systems

### Common Patterns Across Competitors

| System | Description | Used By |
|--------|-------------|---------|
| **Completion tracking** | Track which puzzles have been solved | All |
| **Timer** | Measure solving time | Most |
| **Statistics** | Puzzles solved, average time, streaks | Logic Wiz, PT Apps, Brain Awake |
| **Accomplishments** | Achievement badges | Logic Wiz |
| **Progressive unlock** | Harder levels unlock after completing easier ones | PT Apps |
| **Weekly challenge** | Special weekly puzzle | Logic Wiz |
| **Daily challenge** | One puzzle per day | Brain Awake |
| **Personal bests** | Best time per difficulty | CMLabApps |
| **Star ratings** | 1-3 stars based on performance | **None found** |
| **Leaderboards** | Compare times with others | **None found** |

### Notable Gap
**No Suguru app uses a star rating system** (common in Sudoku apps where you earn 1-3 stars based on time, hints used, or errors). This is a significant opportunity for differentiation.

---

## 7. Monetization Models

| Model | Description | Examples |
|-------|-------------|----------|
| **Free + Banner Ads** | Show ads between puzzles | brennerd, PT Apps |
| **Free + Rewarded Video Ads** | Watch ad for hint/extra puzzle | Logic Wiz, CMLabApps |
| **Free + Remove Ads IAP** | One-time purchase to remove ads | brennerd, Logic Wiz, CMLabApps |
| **Subscription (Premium)** | Monthly/annual for extra features | Brain Awake (archive, expert difficulty, stats) |
| **Completely Free** | No ads, no IAP, all content free | PT Apps (90 puzzles, ad-supported only) |
| **Infinite Free Content** | Procedural generation | CMLabApps |

### Pricing Benchmarks
- Ad removal: Typically USD 2.99-4.99
- Premium subscription: USD 2.99/month or USD 19.99/year (Brain Awake)
- Individual puzzle packs: USD 0.99-2.99 (Logic Wiz)

### For gamezipper.com (Web Game)
Since this is a free web game, monetization will differ from mobile apps. Relevant patterns:
- **No paywalls** for core gameplay
- **Ad placement** - Pre-roll/between puzzles (non-intrusive)
- **Premium cosmetic themes** - Optional paid visual customization
- **Donation/support link** - Optional supporter mechanism

---

## 8. Web-Based Implementations

### Current State: **Major Gap**

No significant web-based Suguru implementation was found during research. Here is the assessment of major puzzle platforms:

| Platform | Has Suguru? | Notes |
|----------|-------------|-------|
| BrainBashers | No | Has 20+ puzzle types but not Suguru |
| Conceptis Puzzles | No | Has Sudoku, Kakuro, Hashi, etc. but not Suguru |
| Simon Tatham's Collection | No | 40+ puzzles but not Suguru |
| puzzle-XXX network | No | 30+ puzzle types, no Suguru |
| puzzle-suguru.com | Possibly | Site is unreachable (connection closed) |
| puzzle-tectonics.com | Possibly | Site is unreachable (connection closed) |
| brennerd.com | Minimal | Lists Suguru as a mobile app, no web play |
| Logic-Wiz.com | No website play | Mobile apps only |

### Opportunity Assessment
The absence of Suguru from major web puzzle platforms represents a **significant market opportunity**. A well-executed web implementation could capture significant organic search traffic for "suguru online", "play suguru free", "tectonic puzzle online", etc.

### Reference Web Puzzle Sites (for UX patterns)

The **puzzle-XXX network** (puzzle-bridges.com, puzzle-futoshiki.com, etc.) provides an excellent reference for web puzzle UX:

**Common features across their sites:**
- Grid sizes: 4x4, 5x5, 7x7, 9x9, 10x10, 15x15, 25x25
- Difficulty: Easy, Normal, Hard, Dense (4 tiers)
- Special puzzles: Daily, Weekly, Monthly
- Timer with manual start
- Undo/Redo buttons with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Zoom controls
- Settings panel
- "Done" button to validate
- "Start Over" button
- Print functionality
- Share button (generates a link)
- "New Puzzle" button for random puzzle
- Hall of Fame / Statistics / Login
- Patreon support
- Mobile apps (iOS + Android)
- 30+ languages supported
- Google Ads (banner + sidebar)
- "Pin Ads" / "Remove Ads" options

---

## 9. Music and Sound Design Patterns

### Logic Puzzle Game Audio Patterns

Based on industry standards for logic puzzle games (Sudoku, nonogram, etc.):

| Audio Element | Description | Best Practice |
|---------------|-------------|---------------|
| **Number placement** | Soft click/tap sound | Short (50-100ms), satisfying, not jarring |
| **Pencil mark toggle** | Subtle paper/pen sound | Different from number placement |
| **Error highlight** | Gentle buzz or low tone | Not punitive, just informational |
| **Region complete** | Short chime or melody fragment | Celebratory but subtle |
| **Puzzle complete** | Victory fanfare (2-3 sec) | Satisfying, uplifting, not annoying on repeat |
| **Hint used** | Whoosh or sparkle sound | Helpful, not shameful |
| **Undo** | Reverse of placement sound | Quick swoosh |
| **Timer tick** | Optional, very subtle | Most games omit this |

### Background Music Patterns
- **Ambient/Lo-fi** - Most common for logic puzzles (Sudoku.com uses calming ambient music)
- **Piano/Classical** - Gentle piano pieces (popular in Japanese puzzle games)
- **Nature sounds** - Rain, forest, ocean (optional toggle)
- **No music** - Many players prefer silence; always include mute option
- **Volume controls** - Separate sliders for music, SFX, and ambient

### Recommended Audio Stack for gamezipper.com
1. **SFX only** (no background music for a single-file game to keep file size small)
2. Web Audio API for generated sounds (no file downloads needed)
3. Short satisfying clicks for placement
4. Gentle error tone
5. Victory sound on completion
6. All sounds toggleable

---

## 10. Gaps and Opportunities

### Market Gaps Identified

| Gap | Opportunity | Priority |
|-----|-------------|----------|
| **No web-based Suguru** | First-mover advantage on web | Critical |
| **No star rating system** | Add 1-3 star scoring based on time/hints | High |
| **No daily challenge on web** | Daily puzzle shared by URL | High |
| **No infinite mode on web** | Procedural generation for unlimited play | High |
| **No tutorials/how-to-play** | Interactive step-by-step tutorial | High |
| **No keyboard support** | Number keys + arrow keys for desktop | High |
| **Limited grid sizes** | Offer 4x4 through 12x12+ | Medium |
| **No leaderboard** | Weekly/monthly leaderboards | Medium |
| **No achievements** | Badges, milestones, streaks | Medium |
| **No print/export** | Print-friendly puzzle layout | Low |

### Unique Value Propositions for gamezipper.com

1. **First quality web Suguru** - Capture underserved web audience
2. **Progressive tutorial** - Teach the puzzle to newcomers (most apps assume you know the rules)
3. **Star rating + achievements** - Retention mechanics missing from all competitors
4. **Daily challenge with sharing** - Viral growth via shareable results
5. **Keyboard-first for desktop** - All current apps are mobile-first
6. **Zero-install, instant play** - No download required, immediate engagement

---

## 11. Recommendations for gamezipper.com

### Must-Have Features (MVP)

| Feature | Details | Reason |
|---------|---------|--------|
| Core Suguru gameplay | Grid with colored regions, number placement, adjacency validation | Core mechanic |
| Multiple grid sizes | 4x4, 5x5, 6x6, 8x8, 10x10 | Match competitor range |
| 3+ difficulty tiers | Easy, Medium, Hard, Expert | Progression |
| Pencil marks / notes | Small candidate numbers in cells | Standard for logic puzzles |
| Undo/Redo | Full move history | Expected feature |
| Hint system | Logical explanation-based hints | brennerd and Logic Wiz differentiator |
| Error highlighting | Real-time conflict detection | Brain Awake and CMLabApps approach |
| Timer | Optional elapsed time | Standard |
| Star rating (1-3) | Based on time + hints used | Unique differentiator |
| Dark mode | Toggle between light/dark | All top apps have it |
| Tutorial | Interactive how-to-play guide | Missing from all competitors |
| Touch + mouse + keyboard | Full input support | Web = desktop + mobile |
| Color-coded regions | Distinct pastel colors per block | Essential for readability |
| Puzzle generation | Procedural + curated puzzles | Infinite content |

### Nice-to-Have Features (Post-MVP)

- Daily challenge with shared seed
- Achievement/badge system
- Statistics dashboard
- Shareable results (image export)
- Region highlighting on tap
- Remaining digit counter
- Custom color themes
- Sound effects (Web Audio API generated)
- Progressive difficulty unlock

### Technical Architecture Notes

| Concern | Recommendation |
|---------|---------------|
| Puzzle generation | Implement a Suguru generator (region partitioning + backtracking solver) |
| File size | Single HTML file; use inline SVG/CSS for visuals, Web Audio for sound |
| Performance | Canvas rendering for grid, requestAnimationFrame for animations |
| Mobile | Responsive design, touch events, viewport meta tag |
| Persistence | LocalStorage for progress, no server required |
| Accessibility | ARIA labels, keyboard navigation, high contrast mode |

---

## Appendix A: Suguru Puzzle Generation Notes

A Suguru puzzle generator needs:
1. **Region partitioning** - Divide the grid into connected regions of sizes 1-N
2. **Solution generation** - Fill the grid satisfying all constraints
3. **Clue removal** - Remove numbers while maintaining unique solvability
4. **Difficulty estimation** - Rate based on solving techniques required

### Region Generation Approaches
- Random walk / flood fill with size constraints
- Voronoi-based partitioning
- Template-based regions with random selection

### Solving Techniques (for difficulty rating)
- **Easy:** Naked singles, hidden singles
- **Medium:** Elimination via adjacency
- **Hard:** Complex deduction chains, uniqueness arguments
- **Expert:** Advanced techniques (X-wing analogs, etc.)

---

## Appendix B: Competitive Positioning Map

```
        COMPLEXITY/FEATURES
                ^
                |
     Logic Wiz  *  (Most features, 25+ variants)
      (50K+ DL) |
                |
                |              * gamezipper.com target
                |             /  (High quality web, star ratings,
                |            /   tutorial, keyboard support)
                |           /
     brennerd   *          /
      (10K+ DL) |
                |
                * CMLabApps     * PT Apps
                (Infinite)       (90 puzzles)
                |
     Brain Awake* (Daily only)
                |
                +-------------------------------------------->
              SIMPLER                        MORE CONTENT
```

---

*End of benchmark document. Research conducted via direct analysis of Google Play Store listings and web puzzle platforms.*
