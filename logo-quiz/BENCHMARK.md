# Logo Quiz — Competitive Benchmark

## Market Data

### Top Competitors

1. **Logo Quiz - Guess the Brand** (Lotum GmbH)
   - Downloads: 50M+ (Google Play)
   - Platform: iOS, Android, Web portals
   - Core loop: View logo fragment → guess brand name from scrambled letters
   - Monetization: Hints (reveal letter, remove letters), skip level, ads
   - Difficulty: 800+ levels, progressive unlocking (tiered categories)

2. **Guess the Logo - Trivia Quiz** (Bubble Quiz Games)
   - Downloads: 10M+
   - Platform: iOS, Android
   - Unique feature: Category-based (cars, food, tech, sports, etc.)
   - Hint system: Reveal random letter, remove wrong letters, skip level
   - Scoring: Points based on speed + accuracy

3. **Logo Trivia - Brand Quiz** (GameInsight)
   - Downloads: 5M+
   - Platform: iOS, Android, Web portals (Poki, CrazyGames)
   - Core mechanics: Blurred logo → progressive reveal as user guesses wrong
   - Progression: 15 categories × 20 levels = 300 levels
   - Features: Daily challenge, leaderboard, hint coins

### Key Market Insights

- **Search volume**: "logo quiz" ≈ 500K+ monthly searches, high engagement
- **Puzzle category**: Fits casual/brain teaser — high retention via nostalgia
- **Web portals**: No polished logo quiz game (existing clones low quality)
- **Viral potential**: Brand recognition + trivia = social sharing

---

## Competitor System Breakdown

### 1. Core Mechanics

| Feature | Description |
|---------|-------------|
| Logo presentation | Partial/blurred logos → reveals on wrong guesses |
| Letter pool | Scrambled letters (some correct, some distractors) |
| Input method | Tap letters to fill brand name (auto-reveal correct) |
| Win condition | Correct brand name → reveal full logo + coins |
| Lose condition | No immediate lose → infinite attempts with hints |

### 2. Scoring System

- **Base points**: 10 points per correct guess
- **Speed bonus**: +5 points if guessed within 10 seconds
- **Streak multiplier**: 1.5× for 3+ correct guesses in a row
- **Hint penalty**: -5 points per hint used

### 3. Hint System (3 types)

| Hint Type | Cost | Effect |
|-----------|------|--------|
| Reveal Random Letter | 50 coins | Shows one correct letter in pool |
| Remove Wrong Letters | 75 coins | Removes 3 distractor letters |
| Skip Level | 150 coins | Unlocks next level instantly |

### 4. Progression

- **Unlock mechanism**: Sequential levels → must complete current to unlock next
- **Categories**: Tech, Cars, Food, Fashion, Sports, Media, Airlines, Apps
- **Difficulty curve**: Logos become more obscure, distractor letters increase
- **Daily challenge**: One special logo per day → bonus coins

### 5. Economy

- **Starting coins**: 100
- **Coins per correct guess**: 20
- **Daily bonus**: 50 coins for opening app daily
- **Ads**: Rewarded ads (30-50 coins) or interstitial (forced every 5 levels)

### 6. UI/UX

- **Layout**: Logo centered top, letter pool bottom, answer slots in middle
- **Animations**: Letter reveal animation, coin pop, confetti on correct
- **Sound effects**: Click, correct, wrong, level complete, coin collect
- **Visual style**: Clean white/light gray background, colorful logos

### 7. Monetization (Web Adaptation)

- **Banner ads**: Persistent footer banner (Monetag MultiTag 110120)
- **Native ads**: Between levels (Monetag MultiTag 110121)
- **Interstitial ads**: After every 3 levels (Monetag MultiTag 110122)
- **No IAP**: Web version uses ads only (no real-money purchases)

---

## Implementation Requirements (GZ Version)

### Core Gameplay

- **Grid**: Logo display area (300×300) + answer slots (variable) + letter pool
- **Logo rendering**: Pre-sliced logos (show 30-60% initially) → full reveal on win
- **Letter pool**: 12-15 letters (6-8 correct, rest distractors)
- **Input**: Tap letter → fills next empty slot → auto-reveal correct positions
- **Validation**: Real-time check → correct letters lock, wrong shake red

### Level Structure

- **Total levels**: 30 (minimum for commercial quality)
- **Categories**: 5 categories × 6 levels = 30 levels
  - Tech (Apple, Google, Microsoft, Amazon, Facebook, Twitter)
  - Cars (Mercedes, BMW, Audi, Toyota, Tesla, Ford)
  - Food (McDonald's, Starbucks, KFC, Pizza Hut, Burger King, Subway)
  - Sports (Nike, Adidas, Puma, Reebok, Under Armour, New Balance)
  - Apps (Instagram, YouTube, TikTok, WhatsApp, Spotify, Snapchat)
- **Difficulty curve**:
  - Levels 1-6: High-recognition logos (Apple, Google, Nike) → 12 letters pool
  - Levels 7-12: Medium logos (Microsoft, Amazon, Starbucks) → 14 letters pool
  - Levels 13-18: Obscure logos (Twitter, Tesla, WhatsApp) → 15 letters pool
  - Levels 19-30: International brands (Audi, Pizza Hut, TikTok) → 15 letters pool + partial logo blur

### Systems to Implement

1. **Scoring + Stars**
   - Base score per level: 1000 points
   - Speed bonus: +500 if completed in <30 seconds
   - Star rating:
     - ★★★ (perfect): No hints, completed in <30 seconds
     - ★★ (good): Used 1 hint or completed in <60 seconds
     - ★ (pass): Used 2+ hints or slow completion

2. **Hints System**
   - Hint coins: Start with 100, earn 20 per correct guess
   - 3 hint buttons: Reveal letter (50 coins), Remove wrong (75), Skip (150)
   - Degrade gracefully: Show "Not enough coins" if insufficient funds

3. **Progress Save**
   - Save: Current level index, coins earned, stars per level, last play timestamp
   - Version field: `{v:1, level:5, coins:120, stars:[3,3,2,...], last:1680000000}`
   - Load: Restore to last level, highlight completed levels in level select

4. **Level Select Screen**
   - Grid layout: 6 columns × 5 rows = 30 levels
   - Locked levels: Gray with padlock icon
   - Unlocked levels: Show star rating (★★★/★★/★/none)
   - Click level → game starts

5. **Tutorial (First-Time Guide)**
   - Overlay on first level: "Tap letters to spell the brand name"
   - Auto-dismiss after correct first guess
   - "Tutorial complete!" toast

6. **Settings Modal**
   - Sound toggle (BGM + SFX)
   - Reset progress (with confirmation)
   - "How to play" text

7. **Audio System**
   - BGM: Lo-fi electronic (Web Audio procedural, 2-min loop)
   - SFX: Letter tap, correct answer, wrong answer, level complete, coin collect, button click
   - Separate toggles: Music vs Sound Effects

### Visual Style

- **Background**: Light gray gradient (#f5f7fa → #c3cfe2) for clean contrast
- **Logo area**: White card with shadow, centered
- **Answer slots**: Rounded rectangles with border, auto-filled correct letters
- **Letter pool**: Circle tiles with letters, tap animation
- **Animations**:
  - Letter tap: Scale down-up (0.1s)
  - Correct answer: Green flash + confetti particles
  - Wrong answer: Shake red (0.2s)
  - Level complete: Fade out → star rating popup

### Technical Requirements

- **Canvas rendering**: Main gameplay on canvas (logo, letters, slots)
- **Touch support**: `touch-action:none` on canvas, pointer events
- **Responsive**: Desktop (1280×720) and mobile (390×844)
- **Performance**: 60fps with delta time, cleanup on page unload
- **Single file**: All CSS/JS embedded, no external deps (except fonts via CDN)

---

## Monetization Plan (Monetag Integration)

### Ad Zones

1. **Banner (Zone 110120)**: Fixed footer banner (never overlays game)
2. **Native (Zone 110121)**: Between levels (show after level complete modal)
3. **Interstitial (Zone 110122)**: After every 3 levels (pause before ad, resume after)

### Ad Placement Rules

- **Never block gameplay**: Ads only on level complete/settings/modals
- **Show interstitial before next level**: After level 3, 6, 9, 12, 15, 18, 21, 24, 27, 30
- **Reward ads**: Optional (watch ad for +50 coins) — add as future enhancement

---

## QA Checklist (Post-Development)

- [ ] All 30 levels tested → all solvable
- [ ] Logo recognition matches brand name (case-insensitive)
- [ ] Distractor letters generated correctly (12-15 total, 6-8 correct)
- [ ] Hint system deducts coins, shows correct behavior
- [ ] Speed bonus awarded (<30 seconds)
- [ ] Star rating calculated correctly
- [ ] Progress saved/loaded (localStorage with version)
- [ ] Level select shows locked/unlocked states
- [ ] Tutorial shows on first run only
- [ ] Settings modal works (sound toggle, reset)
- [ ] Audio plays (BGM + all SFX)
- [ ] Mobile touch works (tap letters, scroll level select)
- [ ] No memory leaks (cleanup on unload)
- [ ] Analytics pixel present (`site-analytics.cap.1ktower.com`)
- [ ] SEO meta tags complete (og:title, og:description, canonical)
- [ ] JSON-LD structured data (VideoGame + FAQPage + HowTo + BreadcrumbList)
- [ ] Monetag ads load (zones 110120, 110121, 110122)
- [ ] No Chinese text (all English)
- [ ] File size ≥ 30KB (S-grade)

---

## Next Steps

1. Generate game with Claude Code (Phase 3)
2. Generate art assets via RunningHub (Phase 4)
3. Generate BGM + SFX via MiniMax/Web Audio (Phase 5)
4. Validate all 30 levels (Phase 6)
5. QA testing (Phase 7)
6. Register + deploy (Phase 8)
7. Final report (Phase 9)
