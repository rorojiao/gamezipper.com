# Go Fish — Competitive Benchmark

## Game: Go Fish
**Slug**: `go-fish`
**Category**: Card Game / Classic Family
**Target**: Commercial-quality browser Go Fish with AI, local multiplayer, and premium feel

## Competitors Analyzed

### 1. cardgames.io/gofish
- Clean UI, standard rules
- vs Computer + local multiplayer
- Simple card rendering (no fancy effects)
- No sound effects, no animations
- No tutorial

### 2. cardzmania.com/GoFish
- 2-12 players support
- Timer per turn (Fast 7s, Standard 15s, Slow 30s, Very Slow 60s)
- Two deck option (104 cards)
- No ads version
- Leaderboard system

### 3. games.washingtonpost.com/games/go-fish (Arkadium)
- "Books of four matching ranks" mechanic
- Quick, lighthearted gameplay
- Memory + strategy element
- Clean modern UI
- Score tracking

### 4. App Store "Go Fish Card Game" (iOS)
- Single Game Mode vs AI
- Career Mode with leaderboard
- Win/loss tracking
- Score backup

### 5. Google Play "Go Fish" (com.joshsgames.gofish)
- 2-5 players
- vs Computer or online
- Play for pairs OR books (4 of a kind)
- Clean mobile UI

### 6. bicyclecards.com (Official Rules Reference)
- Standard 52-card deck (2-3 players) or 2 decks (4-6 players)
- Deal 7 cards (2 players) or 5 cards (3+ players)
- Ask for specific rank from specific player
- "Go Fish" = draw from stock pile
- Complete sets of 4 = "books"
- Game ends when all 13 books are made
- Most books wins

## Systems to Implement

### Core Mechanics
- [x] Standard 52-card deck (1 deck for 2 players)
- [x] Deal 7 cards for 2-player, 5 cards for 3+ players
- [x] Ask opponent for specific rank
- [x] "Go Fish" draw from stock pile
- [x] Collect books (4 of a kind)
- [x] Turn continues if you get cards from asking
- [x] Game ends when all 13 books collected

### AI System
- [x] Easy: Random asks (picks random rank from hand)
- [x] Medium: Remembers some cards (50% memory)
- [x] Hard: Perfect memory (tracks all asks and responses)
- [x] Strategic asking (prioritize ranks where you have 3)

### Scoring System
- [x] Books = 1 point each (max 13 books)
- [x] Win = most books
- [x] Tiebreaker = highest book (Ace high)
- [x] Win streak tracking
- [x] Statistics (games played, won, books collected)

### Tutorial System
- [x] Step-by-step interactive tutorial
- [x] Highlights clickable elements
- [x] Skip option
- [x] Explains: asking, fishing, books

### UI Features
- [x] Card fan display for player hand
- [x] Face-down cards for opponent
- [x] Stock pile with card count
- [x] Book display area
- [x] Turn indicator
- [x] "Go Fish!" animation
- [x] Card deal animation
- [x] Book completion celebration
- [x] Undo (take back last ask)
- [x] Hint system (suggest best rank to ask)

### Game Modes
- [x] vs AI (Easy/Medium/Hard)
- [x] Local 2-Player (pass device)
- [x] Quick Game (standard)
- [x] Career Mode (track wins/losses)

### Progress & Stats
- [x] localStorage save with version
- [x] Win streak
- [x] Games played / won / lost
- [x] Total books collected
- [x] Best game (most books)
- [x] Career stats

### Audio
- [x] Card deal sound
- [x] Card flip sound
- [x] "Go Fish!" voice-like sound
- [x] Book completion sound
- [x] Victory fanfare
- [x] Button click feedback
- [x] Background music (Web Audio procedural)

### Visual
- [x] Dark gradient background (GameZipper style)
- [x] Card rendering with suits and ranks
- [x] Smooth card animations
- [x] Particle effects on book completion
- [x] Glass-morphism panels
- [x] Neon accent colors
- [x] Responsive (desktop + mobile)
- [x] Touch-friendly card selection
