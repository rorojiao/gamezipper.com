# BENCHMARK.md — NYT Spelling Bee Competitive Analysis
**GameZipper.com — Honeycomb Word Game Clone**
**Date: 2026-06-02 | Research by dev-gamezipper**

---

## 1. NYT Spelling Bee — Core Mechanics

### Game Setup
- **Grid**: Hexagonal honeycomb grid with exactly **7 letters** (1 center + 6 surrounding)
- **Center letter rule**: Every valid word MUST contain the center letter
- **Word length**: Minimum **4 letters**
- **Letter reuse**: Letters can be repeated within a word
- **Only available letters**: Words can only use the 7 honeycomb letters

### Scoring
| Word Length | Points |
|-------------|--------|
| 4 letters   | 1 pt   |
| 5+ letters  | 1 pt per letter |
| Pangram (all 7 letters) | +7 bonus pts |

- A 7-letter pangram scores: 7 + 7 = 14 points total
- Pangram guaranteed to exist in every puzzle

### Modes
1. **Daily Puzzle**: One per day (date-seeded, deterministic)
2. **Archive**: Free access to past puzzles (key differentiator vs NYT paywall)

---

## 2. Competitor Analysis

### NYT Spelling Bee (Original)
- URL: nytimes.com/puzzles/spelling-bee
- Monetization: ~$40/year subscription
- DAU: 500K-1M+
- Features: 9-tier ranking, badges, leaderboard, hints, shareable scorecard

### Browser Clones — CRITICAL MARKET GAP
- **Poki**: NO honeycomb Spelling Bee clone found in word games catalog
- **CrazyGames**: NO honeycomb Spelling Bee clone found
- **Conclusion**: Zero free browser-based honeycomb Spelling Bee games on major platforms

### App Store/Play Store
- Most "Spelling Bee" apps are quiz/test format, NOT honeycomb word-building
- None match NYT Spelling Bee mechanics

---

## 3. Game Systems to Implement

### 3.1 Ranking System (9 Tiers)
| Rank | Description |
|------|-------------|
| Beginner | Starting rank |
| Good Start | 1–2 words |
| Moving Up | 3–4 words |
| Good | 5–6 words |
| Great | 7–9 words |
| Amazing | 10–14 words |
| Genius | 15–19 words |
| Queen Bee | All words found |

### 3.2 Core Features
- Shuffle letters (unlimited)
- Delete/Backspace
- Hint: reveal one unfound word
- Found words list (sortable)
- Pangram highlight/celebration
- Progress bar toward next rank
- Score display

### 3.3 Puzzle Sets
- **Daily Puzzle**: Date-seeded deterministic puzzle
- **Puzzle Packs**: Multiple themed sets for free play
- **Endless Mode**: Play through curated puzzle sets

### 3.4 Achievements
- Pangram First, Queen Bee, streak badges, milestone badges

---

## 4. Art Style Reference

### Color Palette
| Element | Color | Hex |
|---------|-------|-----|
| Center Hex | Gold | #F4D03F |
| Outer Hex | Cream Yellow | #F9E79F |
| Background | Dark Charcoal | #1C1C1C |
| Valid Word | Green | #27AE60 |
| Invalid Word | Soft Red | #E74C3C |
| Pangram | Gold | #F39C12 |

### UI Layout
- Honeycomb hex grid (center) — 7 letters
- Word input display above grid
- Rank + score below grid
- Found words panel (scrollable)
- Action buttons: Shuffle, Delete, Enter

---

## 5. Music Style
- Calm ambient (soft piano, gentle synth pads)
- SFX: letter click, valid word chime, invalid buzz, pangram sparkle, rank up fanfare

---

## 6. Technical Approach
- Vanilla Canvas API for hex grid rendering
- HashSet for O(1) word validation
- Date-seeded PRNG for daily puzzles
- Pre-validated puzzle sets with known word lists
- Embedded word dictionary (~50KB compressed)
