# Codewords (Codebreaker) — Competitive Benchmark

## Game Overview
Codewords (also called Codebreakers, Code-Crackers, Cipher Crosswords) is a cipher-based
word puzzle where each letter of the alphabet is assigned a number. The grid shows numbers
in each cell, and the player must deduce which number corresponds to which letter to reveal
the hidden words.

## Market Research (Phase 0)
- **Category**: Word puzzle / Logic puzzle
- **Popularity**: Featured on Puzzle.org, Codewords.com, BrainBashers, Lovatts, PuzzleMagazine
- **SEO keywords**: "codewords", "codeword puzzle", "codebreaker puzzle", "cipher crossword"
- **Zero overlap**: NOT on GameZipper (closest is Cryptograms, which uses quote-based ciphers)
- **Demand driver**: Popular in puzzle magazines, newspapers, and puzzle apps worldwide

## Competitor Analysis

### 1. Codewords.com / Codewords Online
- Grid sizes: 13x13 to 15x15
- Features: Timer, hint system (reveal letter), check progress, daily puzzle
- Monetization: Ads + premium subscription
- Key mechanic: Click cell → select letter from keyboard; numbers shown in cells

### 2. Lovatts Codewords
- Grid sizes: 15x15 standard crossword grid with black squares
- Features: Stuck button (reveal letter), error highlighting, completion animation
- Multiple difficulty levels
- Print + digital versions

### 3. Puzzle.org Codewords
- Clean web interface
- Daily challenge + archive
- Letter frequency analysis tool
- Progress tracking

### 4. BrainBashers Codewords
- Smaller grids (beginner-friendly)
- Multiple sizes
- Hint system

## Game Design Decisions

### Core Mechanic
- Rectangular grid filled with words (no black squares in the simplified format)
- Each cell shows a number (1-26 representing letters A-Z)
- Player clicks/taps a cell, then selects a letter
- Correct letters fill in; the number-letter mapping is global
- 2-3 starting hints per puzzle (revealed letters)

### Difficulty Tiers (27 levels)
| Tier | Grid Size | Word Len | Hints | Levels |
|------|-----------|----------|-------|--------|
| Beginner | 4 rows | 4 letters | 3 | 4 |
| Easy | 5 rows | 5 letters | 3 | 4 |
| Medium | 6 rows | 5 letters | 2 | 5 |
| Hard | 6 rows | 6 letters | 2 | 5 |
| Expert | 7 rows | 6 letters | 1 | 5 |
| Master | 7 rows | 7 letters | 1 | 4 |

### Features (benchmarked from competitors)
- Numbered grid display
- Letter selection (on-screen keyboard + physical keyboard)
- Hint system (reveal one more letter)
- Error detection (wrong letters highlighted)
- Timer
- Progress save (localStorage)
- Completion celebration
- Alphabet key panel (shows solved letters)
- Undo functionality

## Scoring
- Base score per level (tier-dependent)
- Time bonus (faster = more points)
- Hint penalty (-50 per hint used)
- Best score saved per level

## Art Style
- Dark gradient background (GameZipper standard)
- Gold/amber accent (cipher/treasure theme)
- Clean monospace font for grid numbers
- Glass-morphism panels

## Music
- Ambient mysterious theme (Web Audio API procedural)
- SFX: letter place, correct word, error, hint, complete
