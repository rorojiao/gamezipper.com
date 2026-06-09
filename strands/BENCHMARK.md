# NYT Strands — Competitive Benchmark

## Game Overview
NYT **Strands** is a daily themed word-search puzzle from The New York Times Games team. Released March 4, 2024. The player is given a 6×8 grid of letters and a one-line theme clue; the goal is to trace theme words hidden in the grid and to find a special "spangram" that summarises the theme and stretches between two opposite edges of the board. Once all letters are used, the puzzle is solved.

Sources cross-checked:
- https://help.nytimes.com/28214352967700-Strands (official)
- https://www.techradar.com/computing/websites-apps/nyt-strands (rules + tips)
- https://www.wikihow.com/Play-Strands (step-by-step + spangram def.)
- https://strands.game / strandsgame.net / strands-nyt.com (clones surveyed)

---

## Key Competitors

### 1. NYT Strands (the canonical version — nytimes.com/games/strands)
- **6×8 grid, 48 letters**
- Theme clue at top of board (cryptic, punny)
- **6 theme words (turn blue) + 1 spangram (turns yellow) = 7 words total**
- Spangram must touch **two opposite sides** of the board (top↔bottom OR left↔right; can bend)
- Letters connect in **8 directions** (orthogonal + diagonal), may change direction mid-word
- Each letter used exactly once; words **never overlap**; full board must be consumed
- Hint rule: **every 3 non-theme words = 1 hint** (highlights one theme word on the board)
- Result label: **"Perfect"** (no hints used) / **"Great"** (used ≥1 hint) — no public star rating
- Daily at **midnight local timezone**; archive back to Mar 4, 2024 (subscribers only)
- Account stats: Completed, Solve%, Current Streak, Max Streak, Spangram First, Solved Without Hints
- Sound: subtle click/swoosh on selection, sparkle on theme-word, chime on spangram, soft piano BGM
- Aesthetic: clean cream background, large rounded letter tiles, NYT brand typography (Cheltenham / Franklin Gothic)

### 2. strands.game (most polished free clone)
- Mirror of NYT rules: 6×8 grid, blue/yellow highlights, 3-non-theme-words hint meter
- Adds: **Strands Unlimited** (random on-demand puzzles) + **Strands Multiplayer** (race a bot)
- Light/dark mode toggle, sound on/off, single static theme per session
- Free, no login, ad-supported

### 3. strandsgame.net
- Same 6×8 grid, same mechanics
- Differentiators: **Easy / Daily / Hard** difficulty modes, **Reveal Answer** button, archive of past puzzles
- Less polished UI, heavy ads, no daily reset enforcement (loose "daily" feel)

### 4. strands-nyt.com / strands-nyt.cc / nyt-strands.org / strandsgame.me / strands.today
- Direct NYT reskins with no new mechanics
- All carry: 6×8 grid, drag-to-select, theme + spangram, hint meter, ad-monetised
- None have account-synced streaks; all rely on localStorage only

### Summary Table

| System                      | NYT          | strands.game | strandsgame.net | Our Implementation |
|----------------------------|--------------|--------------|------------------|-------------------|
| Daily seeded puzzle        | ✅           | ✅           | ✅ (loose)       | ✅ Seeded daily   |
| Practice / Random          | ❌           | ✅ Unlimited | ✅ Reveal/Hard   | ✅ Random + Archive |
| Difficulty levels          | ❌           | ❌           | ✅ Easy/Daily/Hard | ✅ 3 levels     |
| Multi-difficulty theme gen | ❌           | ❌           | partial          | ✅ Auto-generator |
| Hint meter (3 non-theme=1) | ✅           | ✅           | ✅               | ✅               |
| Spangram (yellow edge→edge)| ✅           | ✅           | ✅               | ✅               |
| Statistics + streak        | ✅ Account   | localStorage | localStorage     | ✅ localStorage  |
| Share emoji grid           | ✅           | ✅           | ✅               | ✅               |
| Archive (history)          | ✅ Sub-only  | ✅ Unlimited | ✅               | ✅ Built-in      |
| Tutorial / onboarding      | ✅           | partial      | minimal          | ✅ Multi-step    |
| Sound effects + BGM        | ✅           | ✅           | partial          | ✅ Web Audio     |
| Mobile drag-to-select      | ✅           | ✅           | ✅               | ✅ Touch + mouse |
| 6×8 grid                   | ✅           | ✅           | ✅               | ✅ (configurable) |

---

## Core Gameplay Mechanics (核心玩法机制)

### Grid (网格)
- **6 columns × 8 rows = 48 letters** (4×8 is used in some beginner variants)
- Each cell holds a single capital letter A–Z
- Letters are pre-shuffled at puzzle generation so every word is reachable but no obvious anchor

### Word Selection (单词选择方式)
1. Player **drags** (touch) or **click-drags** (mouse) across adjacent letters
2. Adjacency rule: each next letter must be **orthogonally or diagonally adjacent** (8-neighbour) to the previous
3. The selected path can **change direction at every step** — no straight-line requirement
4. **No backtracking** to the same letter within one word; **no letter reused across the whole board**
5. Release / lift to submit; invalid words give a subtle shake but no penalty
6. Found theme word → tiles turn **blue** and remain locked in place
7. Found spangram → tiles turn **yellow**, locked

### Spangram Rules (spangram 规则)
- Exactly **one** spangram per puzzle
- It is **the puzzle's theme made generic** (e.g. theme "Can I have my quarter back?" → spangram "TEAMPLAYERS", theme words = PATRIOT, COWBOY, DOLPHIN…)
- Geometric rule: **must touch two opposite edges** of the grid (top↔bottom OR left↔right; can also be top↔left↔bottom etc. as long as two opposing edges are hit)
- Highlight colour: **yellow** (vs theme blue)
- Often 2 words concatenated (e.g. "SIGNINGOFF", "SOCIALMEDIA")
- Usually longer than theme words (8–14 letters typical)
- Often the **last** word found because of its winding shape

### Hint System (hint 系统)
- **Earn rate**: find any valid English word on the board that is **not** a theme word / not the spangram
- **Cost**: every **3 non-theme words** unlocks **1 hint**
- **Effect**: tapping the hint button **highlights all letters of one remaining theme word** on the board
- Highlights stay visible until the word is found
- **No additional hint earned until that highlighted word is found**
- Result card reveals how many hints were used (0 = "Perfect")

---

## Scoring System (计分系统)

NYT Strands does **not** publish a numeric score or star rating. The published scoring concept is **qualitative**:

| Outcome           | Display      | When                                     |
|-------------------|--------------|------------------------------------------|
| Perfect           | "Perfect"    | All 7 words found, 0 hints used          |
| Great             | "Great"      | All 7 found, used at least 1 hint        |
| Puzzle complete   | (silent)     | All 7 found, any hint count              |

### What competitors add (optional for our version)
- 1–3 star rating (1 star = solved with hints, 2 = clean solve, 3 = clean + speed bonus)
- Timer-based bonus (e.g. <3 min = +500, 3–6 min = +300, >6 min = +100)
- "Spangram First" bonus achievement
- Streak tracking (current / max)
- Per-level best-time leaderboard

---

## Level System (关卡系统)

### NYT model — Daily Only
- One puzzle per day, shared globally, releases at **midnight local timezone**
- Subscribers can play the **archive** going back to **March 4, 2024**
- Archive puzzles count for stats (Completed, Solve%, Spangram First, Solved Without Hints) but **NOT** for streaks

### Clone model — Daily + Unlimited + Difficulty
- **Daily**: same seed for everyone that day
- **Unlimited / Random**: procedurally generated, playable any time
- **Difficulty selector** (strandsgame.net): Easy / Daily / Hard
  - Easy: 4×6 grid, 4 theme words, no spangram (or simpler spangram)
  - Normal (Daily): 6×8 grid, 6 theme + spangram
  - Hard: 6×8 grid, denser letter pack, fewer shared stems, longer spangrams
- **Reveal Answer** escape hatch (anti-frustration)

### Our Recommendation
- **3-tier difficulty selector** in the lobby: Easy (4×6) / Normal (6×8) / Hard (8×8 with longer words)
- **Daily seeded puzzle** (deterministic by date)
- **Unlimited Random** (procedural generator with our word-pool)
- **Built-in Archive** of all dailies played by the user (localStorage)
- No login required; everything stored locally

---

## Tutorial / Onboarding (教程/新手引导)

### NYT approach
- **No mandatory modal**. The board is the tutorial — players discover by trying.
- Hint button tooltip explains "Find 3 non-theme words to unlock a hint."
- Spangram is **never explicitly explained upfront** — players discover its yellow colour and edge-to-edge property by stumbling on it.
- Onboarding is essentially: "drag to connect letters that fit the theme."
- The lightbulb icon opens Strands Sidekick (community forum) where experienced players share strategies.

### What works / what to copy
✅ Drop the player in immediately — first frame = playable board
✅ Use a single example board ("Try connecting letters that match the theme")
✅ Show hint button hinting "Find 3 non-theme words"
✅ Animate the spangram visually distinct from theme words

### What we should add (differentiation)
- 3-step **interactive tutorial overlay**:
  1. "Drag to connect adjacent letters" (animated finger demo)
  2. "Theme words turn BLUE, the spangram turns YELLOW and touches two edges" (highlight demo)
  3. "Find 3 random words to earn a hint" (interactive mini-puzzle where the player does this once)
- Skip button for returning players
- Persistent "?" icon in corner that re-opens the tutorial

---

## Visual Style Reference (美术风格参考)

### NYT Strands (target look-and-feel)
- **Background**: cream / off-white (#F7F2E8 ish), warm paper feel
- **Letter tiles**: large rounded squares (~64–80 px), subtle drop shadow, single capital letter in serif (Georgia / Cheltenham style)
- **Theme word highlight**: NYT blue (#3A76F0 / #1A73E8)
- **Spangram highlight**: warm yellow / gold (#F4C430)
- **In-progress selection**: lighter tint over the selected letters + connecting line
- **Top bar**: minimalist — theme text left, stats (bar graph) icon + lightbulb right
- **Bottom bar**: hint button (lightbulb), 3-dot hint meter
- **Result screen**: centred text ("Perfect" / "Great"), share button, emoji grid

### GameZipper overlay (our house style)
- Dark gradient background (#0F1424 → #1B2240)
- Neon accent palette (cyan #5BE3FF, magenta #FF6BC1, gold #FFD25B)
- Glowing letter tiles with subtle inner light
- Particle effects on word-found / puzzle-complete
- Bounce + scale animations on selection

### Recommended visual blend for our Strands
- **Board background**: dark gradient (GameZipper) but keep **letter tiles cream/off-white** for readability
- Use the same NYT-style blue/gold for theme/spangram (instant recognition)
- Add subtle **glow** around found words (cyan glow = theme, gold pulse = spangram)
- Spangram reveal = a brief gold particle burst along the traced path
- Mobile-first: tiles 56–72 px, generous touch targets, vertical layout

---

## Audio Style Reference (音效风格参考)

### NYT Strands audio feel
- **BGM**: soft ambient piano, very low volume, loops indefinitely, never distracts
- **Letter select**: subtle "tick" or "swoosh" — almost a brush stroke sound
- **Theme word found**: gentle **sparkle/chime** (rising arpeggio, ~0.4 s)
- **Spangram found**: longer, warmer **chime + shimmer** (~0.8 s, slightly triumphant)
- **Hint used**: brief **pop** sound + visualisation of the highlighted word
- **Puzzle complete**: short **fanfare** (3–5 note arpeggio, ~1.5 s)
- **Error / invalid**: subtle **thud** or no sound at all (NYT is forgiving)

### Implementation notes for us
- Web Audio API procedural (no MP3 dependencies — matches our other games)
- All sounds <1 s, sample-rate 44.1 kHz
- BGM as a 30–60 s loopable arpeggio in C-major / A-minor (calming)
- Sound toggle in settings; BGM toggle separate from SFX toggle
- Mute state persists in localStorage

---

## Differentiation Recommendations (我们版本的差异化设计建议)

### 1. Difficulty Selector (核心差异化)
- **Easy**: 4×6 grid, 4 theme words, simpler spangram (6–8 letters)
- **Normal**: 6×8 grid, 6 theme + spangram (matches NYT)
- **Hard**: 7×8 or 8×8 grid, 7–8 theme words + harder spangram (10–16 letters), denser filler
- Toggle in lobby; persistence via localStorage

### 2. Procedural Puzzle Generator (核心差异化)
- Seeded random with our **themed word-pool** (animals / food / sports / tech / cinema / nature / music / travel … 30+ categories)
- Validation pipeline:
  1. Pick category + 6–8 words
  2. Place spangram first (must touch 2 opposite edges)
  3. Backfill theme words with non-overlapping paths
  4. Fill remaining cells with filler letters (frequency-matched English distribution, avoid forming extra valid English words that would over-easy the hint meter)
  5. Verify uniqueness (no second valid solution)
  6. Verify no unintended extra long words
- Daily = `seed = date.toDateString()` so everyone gets the same board that day

### 3. Built-in Archive + Streak (vs NYT subscriber-only)
- **All dailies auto-saved to localStorage** for any logged-in / returning player
- Streak counter (current + max)
- Best-time per puzzle
- Hints-used history
- No paywall — keep it free (Monetag ads are our revenue)

### 4. Visual Polish Beyond NYT
- Gold **particle trail** along the spangram when found (NYT just shows the word; we make it celebratory)
- **Subtle screen pulse** when the full board is consumed (the "aha" moment)
- **Letter-tile glow** that intensifies as you approach the spangram
- Confetti on puzzle complete

### 5. Theme Variety (vs NYT editor-curated only)
- 12+ theme categories baked into our generator
- Each daily puzzle is tagged with its category
- Players can filter the archive by category
- Themed icon (small SVG) next to the daily clue

### 6. Replayable "Strands Mini" (vs NYT no-practice)
- 4×6 quick-play for <60 second sessions
- Mobile session-length friendly

### 7. Educational Tooltips
- Floating tooltip on hover for any letter: "This letter appears in N common English words"
- Optional "letter heat-map" toggle — green = common, red = rare (helps new players)

### 8. Multi-language Foundation (future)
- All strings in JSON for easy translation
- Word-pool structured by language: English first, add ES/FR/DE later

### 9. Anti-Frustration Features (battle-tested in clones)
- **Reveal Answer** button (consumes 1 hint, shows one theme word)
- **Hint preview** before spending (lets you see how many you've banked)
- **Auto-save** of in-progress selection (refresh-safe)

### 10. SEO / Discoverability
- Title: "Strands — Daily Themed Word Search Puzzle | GameZipper"
- Meta description targeting: "strands game, nyt strands, spangram, daily word puzzle, theme word search"
- JSON-LD: VideoGame + HowTo + FAQPage
- Landing page lists **30+ theme categories** so we index for long-tail searches

---

## Technical / Asset Notes
- **Stack**: vanilla HTML + CSS + JS (single file, matches GameZipper convention)
- **Audio**: Web Audio API, procedural (oscillator + gain envelopes)
- **Tile rendering**: CSS Grid + absolute-positioned divs, OR Canvas (Canvas preferred for >48-cell animations)
- **Touch handling**: pointer events (mouse + touch unified)
- **Word validation**: bundled JSON dictionary (`/dict/en.json`, ~60K words)
- **Daily seed**: `seedrandom(dateStr)` → Mulberry32 PRNG
- **localStorage schema**:
  ```json
  {
    "version": 1,
    "difficulty": "normal",
    "stats": { "played": 0, "solved": 0, "streak": 0, "maxStreak": 0, "noHintStreak": 0 },
    "history": [{ "date": "2026-06-09", "difficulty": "normal", "hintsUsed": 0, "timeMs": 142000 }],
    "settings": { "sfx": true, "bgm": true, "reducedMotion": false }
  }
  ```

---

## Open Questions for Design
1. **Grid sizes**: lock to 6×8 only, or ship 3 difficulty sizes?
2. **Dictionary size**: ship full ~60K English words, or curated ~10K?
3. **Daily seed**: date-string based (everyone same) or random-per-device (no spoilers in shared screenshots)?
4. **Spangram animation**: simple gold pulse or full particle trail?
5. **Mobile drag UX**: test with 56 px tiles vs 64 px tiles on a 6.1" iPhone viewport

---

## Bottom Line
NYT Strands has **3 winning primitives** we must keep:
1. **Edge-to-edge spangram** (the unique hook — no other word search has this)
2. **Theme clue + colour-coded words** (blue = theme, yellow = spangram)
3. **3-non-theme-words = 1 hint** economy (genuinely clever "wrong answers are useful" feedback loop)

Our **3 differentiators** vs NYT:
1. **Free built-in archive** (no paywall)
2. **3-tier difficulty selector** (NYT has one fixed difficulty)
3. **Procedural unlimited mode** + theme-category variety (NYT is editor-curated daily only)

That combo gives us a strong SEO/landing position ("free unlimited Strands with archive") while respecting the design language Strands players already know.