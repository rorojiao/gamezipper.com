# Nurikabe — Competitive Benchmark

## Game Overview

**Nurikabe** (Japanese: ぬりかべ, "wall painting") is a binary determination logic puzzle invented in **March 1991** by "renin" (Japanese pronunciation of "Lenin") and published by **Nikoli**, the famous Japanese puzzle publisher. The puzzle was named after the *nurikabe* — an invisible wall from Japanese folklore that blocks roads and delays foot travel. By 2005, seven standalone Nurikabe books had been published by Nikoli. Other names for the puzzle include **Cell Structure** and **Islands in the Stream**.

**Goal:** Shade cells to form a connected "sea" (black cells) such that:
1. Each numbered cell is part of an "island" (white region) of exactly that many cells
2. Islands contain exactly one numbered cell
3. The sea (all black cells) must be one connected region
4. No 2x2 block of black cells is allowed

The puzzle is NP-complete (even when only digits 1 and 2 are used), but good human solvers never need to guess.

---

## Top Competitors

### 1. puzzle-nurikabe.com (PuzzleTeam / PuzzleLoop)
- **Platform:** Web (HTML5), also bundled as iOS & Android app (PuzzleMobile)
- **Grid Sizes:** 5x5 Easy, 5x5 Hard, 7x7 Easy, 7x7 Hard, 10x10 Easy, 10x10 Hard, 12x12 Easy, 12x12 Hard, 15x15 Easy, 15x15 Hard, 20x20 Easy — plus Special Daily, Weekly, Monthly Nurikabe
- **Puzzle Count:** Algorithmically generated, **3,000,000+ cumulative solves** (Puzzle ID counter shows 3,056,318+). Effectively infinite random puzzles.
- **Features:** ✅ Tutorial (rules page + YouTube playlist) ✅ Undo/Redo ✅ Timer (with hide option) ✅ Night mode ✅ Zoom slider ✅ Settings: auto-submit, checkpoints, board coordinates, highlight last change, highlight current group, gray out completed numbers, mark error numbers, highlight isolated blacks & 2x2 pools, color-blind mode (blue for errors) ✅ Hall of Fame leaderboard ✅ Mass print ✅ Share (link + screenshot) ✅ Multi-language (22 languages) ✅ Cross-device state sync
- **Monetization:** Free with Snigel display ads; "Become a Patron" / "Remove Ads" link
- **UI/UX:** Clean classic web style, light theme with optional night mode. Light on bells/whistles, heavy on solving tools.
- **Audience/Position:** Long-running, de-facto browser Nurikabe destination for the English-speaking puzzle community. The site is multilingual (bg, th, pt, nl, cz, fr, pl, ru, cn, zh, de, ja, ko, es, ee, si, hu, fi, tr, sv, it, gr, vi).

### 2. Conceptis Nurikabe: Islands & Walls (Google Play)
- **Platform:** Android (also iOS via "Puzzles by Conceptis" app bundle) — id `com.conceptispuzzles.nurikabe`
- **Publisher:** Conceptis Ltd. (the world's leading supplier of logic puzzles — 20M+ solved per day across print + digital)
- **Puzzle Count:** **90 free Nurikabe puzzles** + **30 extra-large tablet bonus puzzles** + 1 free bonus puzzle published every week
- **Grid Sizes:** Multiple difficulty levels from "very easy" to "extremely hard" (no fixed 5x5/7x7 — internal sizing)
- **Features:** ✅ Unlimited check puzzle ✅ Unlimited Undo & Redo ✅ Highlight wall segments (warns before a wall is isolated) ✅ Show island size counter ✅ Concurrently play/save multiple puzzles ✅ Puzzle filtering, sorting, archiving ✅ Dark Mode ✅ Graphic previews of in-progress puzzles ✅ Portrait + landscape (tablet) ✅ Track solving times ✅ Backup & restore to Google Drive ✅ Puzzle library continuously updates
- **Monetization:** Free download with **in-app purchases** (likely per-puzzle-pack or subscription — "In-app purchases" + "Digital Purchases" labels)
- **UI/UX:** Polished, professional, with Conceptis-style handcrafted quality. Same UX as the rest of the Conceptis puzzle line (Hashi, Kakuro, Slitherlink, etc.)
- **Rating:** **5.0 stars** on Google Play (1.45K reviews, 100% 5-star — suspect some bias from very dedicated user base; small denominator)
- **Downloads:** **50,000+**

### 3. PuzzleMadness Nurikabe
- **Platform:** Web (puzzlemadness.co.uk)
- **Grid Sizes:** Four variants — **Small**, **Medium**, **Large**, **Mixed** (each with daily puzzle + archive)
- **Puzzle Count:** 1 fresh puzzle per day per variant + large archive of past dailies
- **Features:** ✅ Rules explanation baked into the page (number-by-number tutorial) ✅ Variant selector dropdown ✅ Reset confirmation ✅ Next puzzle / Archive buttons ✅ Nurikabe leaderboard
- **Monetization:** Google AdSense ads
- **UI/UX:** Lightweight blog/portal style; each puzzle is a static page that loads in under a second. Mobile-friendly.
- **Audience/Position:** A niche but very well-maintained Nurikabe community for daily solvers who want a fresh same-size puzzle every day.

### 4. puzzlemix.com (BrainedUp / Dr. Gareth Moore)
- **Platform:** Web (BrainedUp infrastructure; also feeds into a paid puzzle-book pipeline)
- **Puzzle Count:** Thousands of pre-generated + daily generated, all sizes
- **Features:** ✅ Full online **rating, comment, and save system** (account-based) ✅ Unstarted/Started/Saved/Completed/Given-up state filter ✅ Discussion forum ✅ Free account system ✅ "Easy / Moderate / Hard" rating computed from the community's solve times
- **Grid Sizes:** 5x5, 6x6, 7x7, 10x10 (and other sizes for the rest of the suite)
- **Monetization:** Free; redirects to BrainedUp.com (subscription brain-training) for monetization
- **UI/UX:** Older-school HTML/CSS but fast, dense, and information-rich; the rating database is the real moat
- **Audience/Position:** Power-user / community-driven Nurikabe. The save+rate+comment loop is the closest a free web Nurikabe has gotten to a Wordle-style persistent experience.

### 5. logicgamesonline.com — Nurikabe
- **Platform:** Web (Josh Metzler, 2005-2019)
- **Grid Sizes:** 5x5 default, plus a **Daily 9x9** variant
- **Puzzle Count:** Random generation per page load; archive of past dailies
- **Features:** ✅ Timer (Time 0:00 counter) ✅ Check puzzle button ✅ Tutorial page ✅ Daily archive
- **Monetization:** Google AdSense (468x60 banner + 120x90 button)
- **UI/UX:** Old-school minimal HTML; no save state, no login, no settings. The simplest viable Nurikabe on the open web.
- **Weakness:** No undo visible, no error feedback, no progression — pure "click around until check passes."

### 6. SolitaireParadise Nurikabe
- **Platform:** Web (solitaireparadise.com/games_list/nurikabe.html)
- **Features:** ✅ Lights-off dark mode ✅ Favorites ✅ Fullscreen ✅ Share buttons (FB, WhatsApp, Reddit, email) ✅ Top-10 score leaderboard with name submission modal ✅ Grid rendering at standard size
- **Monetization:** Ads + cross-promotion to the rest of the SolitaireParadise catalog
- **UI/UX:** Modern Material Design (MUI) with light/dark toggle; the leaderboard modal is a nice retention touch
- **Audience/Position:** A clean, modern, single-puzzle-per-load Nurikabe. Not infinite-content, but the UX is the best-in-class of the free web Nurikabe players.

### 7. Puzzle by Nikoli S Nurikabe (Nintendo Switch)
- **Publisher:** HAMSTER (developed under official Nikoli license)
- **Platform:** Nintendo Switch
- **Price:** **$4.99 USD**
- **Release date:** **December 8, 2022**
- **Puzzle Count:** The HAMSTER S-series (Akari, Shikaku, Heyawake, Yajilin, Slitherlink, Nurikabe) typically contains ~400 puzzles (200 Easy + 200 Hard) plus a Time Attack mode; the title is SKU 7100020913 on Nintendo's eShop.
- **Features:** ✅ Time Attack mode (highlighted as a primary feature) ✅ Save Data Cloud ✅ Three play modes (TV, Tabletop, Handheld) ✅ Single-player
- **Monetization:** One-time purchase
- **UI/UX:** Faithful Nikoli/HAMSTER presentation — minimalist, no fluff, Japanese-clean. The grid uses Nikoli's own puzzle art.
- **Audience/Position:** The **only** officially-licensed Nurikabe on a console. The Akari and Shikaku siblings in the same series are very well reviewed on the eShop; reviews of the S-Nurikabe title average a similar high-mark / "fans of Nikoli puzzles will be in heaven" sentiment.
- **Series context:** Other Puzzle by Nikoli S titles released in 2022-2023: S Akari (Oct 20, 2022), S Slitherlink (Nov 10, 2022), S Nurikabe (Dec 8, 2022), S Heyawake (Jan 12, 2023), S Shikaku (Apr 13, 2023), S Yajilin (Jun 1, 2023) — all at $4.99.

### 8. Tastraceur Nurikabe (Google Play)
- **Platform:** Android — id `com.tastraceur.nurikabe`
- **Puzzle Count:** Stated as "a great mental game" with classic Nurikabe rules
- **Features:** Standard left-click-shade / right-click-mark Nurikabe interface
- **Monetization:** Free with ads
- **Downloads:** **10,000+**

### 9. Nurikabe Islands (nurikabe.android on Google Play)
- **Platform:** Android
- **Description:** "Nurikabe Islands is a relaxing Japanese logic puzzle with three fresh daily challenges, handcrafted boards, and offline play."
- **Features:** Daily challenges, handcrafted boards, offline play
- **Monetization:** Free
- **Downloads:** 100+ (likely newer/indie app)

### 10. Eldstorm Nurikabe (Google Play)
- **Platform:** Android — id `com.eldstorm.nurikabe`
- **Description:** "Build islands and connect the sea in this relaxing Nurikabe logic puzzle."
- **Downloads:** 50+

### 11. ATCODESOFT Nurikabe Puzzle - Randomized
- **Platform:** Android — id `com.atcodesoft.nurikabepuzzlerandomized`
- **Description:** "Nurikabe Puzzle, a classic Nurikabe puzzle game" with a simple randomized generator
- **Downloads:** 500+

### 12. Fishtail Games Nurikabe (Google Play)
- **Platform:** Android — id `com.fishtailgames.nurikabe`
- **Description:** "Paint islands of white, seas of black. Nurikabe is a classic Japanese logic puzzle that rewards patience over speed — no timers, no penalties, no guessing required. Every puzzle has exactly one solution."
- **Features:** No timer, no penalties — pure relaxed play
- **Rating:** **4.4 stars** on Google Play
- **Downloads:** 10+ (very small install base)

### 13. King's Nurikabe (Vit, Google Play)
- **Platform:** Android — id `com.vit.kingsnurikabe`
- **Description:** "Each day you can pick between 4 difficulties Easy, Medium, Challenging and Hard. Can you complete them all? All puzzles are human solvable and only a single solution exists."
- **Features:** 4 daily difficulties
- **Downloads:** 1,000+

### 14. Indie / Itch.io Games (PC/Web)
- *Nurikabe C64* (carletonhandley.itch.io/nurikabe-c64) — Commodore 64-style retro port
- *Nurikabe* (error-2018.itch.io) — minimalist indie web
- *Mugen Nurikabe* (sasupernova.itch.io/mugen-nurikabe) — procedurally generated endless
- *Islands* (puzzle video based on Nurikabe, on itch.io)
- *Nurikabe POC in IWSDK* — proof-of-concept
- *Hack through the Nurikabe Grids before time runs out* — timed arcade take

### 15. NOT present on major casual portals
- **Poki** — no Nurikabe game in catalog (404 on /en/nurikabe)
- **CrazyGames** — no Nurikabe game (search returns nothing matching the keyword)
- **CoolMathGames** — no Nurikabe in catalog
- **Apple App Store** — no first-party Nurikabe-only apps (the iOS equivalent of the Puzzle-Loop mobile app carries all 40+ Nikoli-style puzzle types including Nurikabe)

---

## Gap Analysis

| Gap | Notes |
|-----|-------|
| **No quality free browser Nurikabe on Poki/CrazyGames/CoolMathGames** | Three big casual portals all lack Nurikabe. The category has zero "thumb-stopping" browser-native entry. |
| **No dark-neon aesthetic Nurikabe** | All current free web Nurikabe use a light theme; the dark/neon aesthetic has been an open lane for years. |
| **No GameZipper-style "complete level set" experience** | The big free web players (puzzle-nurikabe.com, SolitaireParadise, logicgamesonline) all give you one puzzle per session with no level grid to work through. The hand-curated 30-level progression model is missing on the web. |
| **No daily-challenge + star-rating combo on web** | Puzzlemadness and puzzle-nurikabe have dailies; Conceptis has weekly bonuses. None combine daily + 3-star scoring + hint-budget. |
| **No localStorage-first, install-free, ad-free casual Nurikabe** | The free web options are all ad-supported; the paid Switch title ($4.99) is the only ad-free official offering. |
| **No quality Web mobile Nurikabe** | Mobile web is the weakest surface — the only real options are Conceptis or the Puzzle-Loop mobile site, both wrapped in ad-laden shells. |
| **No themed/daily-event Nurikabe** | None of the free web players do seasonal / themed dailies (e.g. Halloween islands, etc.) — the cultural "what should I play today?" pull is weak. |

---

## Feature Requirements for GameZipper

### Core Mechanics
1. **Grid sizes:** 5x5, 7x7, 9x9, 10x10, 12x12 (matches the spec)
2. **Rules enforcement** (auto-detect, with toggleable strict mode):
   - One connected sea (all black cells form a single polyomino)
   - Each numbered cell is in an island of exactly that many cells
   - Each island contains exactly one numbered cell
   - No 2x2 block of black cells
3. **Controls:** Click to toggle black; right-click (or long-press) to mark "dot" (deduced white)
4. **Two visual themes** at minimum: dark (default for GameZipper) and light

### Levels & Progression
- **30 hand-curated levels** split across three tiers:
  - Tier 1 — **Easy**: 5x5 + 7x7 grids (Levels 1-10)
  - Tier 2 — **Medium**: 7x7 + 9x9 grids (Levels 11-20)
  - Tier 3 — **Hard**: 9x9 + 10x10 + 12x12 grids (Levels 21-30)
- Difficulty curve:
  - L1-3: 5x5, 2-3 islands, no backtracking
  - L4-10: 5x5 / 7x7, 3-4 islands
  - L11-15: 7x7, 4-5 islands
  - L16-20: 9x9, 5-6 islands
  - L21-25: 9x9 / 10x10, 6-7 islands
  - L26-30: 10x10 / 12x12, 7+ islands, multi-step deduction

### Scoring & Stars
- **3-star rating per level** based on `time + hints_used`:
  - 3 stars: solved in <par time, 0 hints
  - 2 stars: solved in <1.5× par time, ≤1 hint
  - 1 star: completed, any time/hint count
- Per-tier and per-level best-time saved in localStorage

### Power-ups
- **Hints:** Up to **3 per level**, reveals a single safe shading/decoration move
- **Undo:** Unlimited, persists across page reloads via localStorage
- **Reset:** Clears the current puzzle state
- **Check:** Highlights currently-broken rules (2x2 block, disconnected sea, wrong island size)

### Daily Challenge
- **One seeded puzzle per day** (date-based seed), 7x7 grid
- Tracks current streak and best time
- Counts toward the "Daily Challenge" sidebar on the gamezipper.com home grid

### Save System
- **localStorage** with `version` field for future migrations
- Saves: level progress, best times, hint usage per level, current streak, daily-challenge history
- No account/login required

### UI/UX
- **Dark neon theme** consistent with the rest of GameZipper (the "30 puzzle games in dark neon" brand)
- Glowing-neon-cyan / magenta accents on the grid (cells, hover state, completed numbers, error highlights)
- Smooth cell toggle animation
- Subtle background particle effect (existing GameZipper pattern)
- Mobile-first responsive layout (works on a 360px phone, scales to desktop)
- Tutorial overlay shown only on first run
- Level-select grid: 3×10 grid with lock icons for un-cleared levels and star indicators (0/1/2/3) for cleared levels

### Audio (optional but aligned with the rest of GameZipper)
- Web Audio API BGM
- 4-6 SFX: cell-tap, error-buzz, level-complete, hint, undo, daily-complete

### SEO / Landing
- Title: "Nurikabe — Free Online Japanese Logic Puzzle | GameZipper"
- H1: "Nurikabe" with one-line tagline referencing Nikoli origin
- Schema.org Game + ItemList markup
- Internal links to sibling games (Hitori, Akari, Tapa, Slitherlink) and to the daily-challenge index

---

## Monetization Plan (AdSense-aligned, like the rest of GameZipper)

- **Primary:** AdSense display ads in the sidebar and below-the-fold (no interstitial, no pre-roll — these destroy retention on puzzle games)
- **Optional stretch:** "Remove Ads" IAP (Google Play / App Store versions) for the mobile port

---

## Scoring Matrix

| Dimension | Score | Notes |
|-----------|-------|-------|
| Market demand | 4 | Nikoli classic; well-known in puzzle community; lower search volume than Sudoku |
| SEO gap | 5 | Zero quality browser Nurikabe on Poki/CrazyGames/CoolMathGames; 5.0 star Conceptis on Play but no free web equivalent |
| Retention potential | 4 | 30 levels + daily challenge; better retention than Hitori due to more complex rules |
| Implementation feasibility | 4 | Needs real Nurikabe constraint solver (island size, 2x2 rule, sea connectivity) — heavier than Hitori/Akari but well-defined |
| Zero overlap | 5 | No game in the existing GameZipper catalog uses binary determination or sea/island logic |
| **Total** | **22/25** |

---

## Reference Game Notes

- **Inventor / Origin:** "renin" (Japanese: れーにん, 1991), published in the 33rd issue of Nikoli's *Puzzle Communication* magazine in March 1991
- **NP-completeness:** Solving Nurikabe is NP-complete even when only digits 1 and 2 are present (this is good — it means interesting puzzles are computationally hard, so the hand-curated 30 levels stay interesting)
- **Cultural spread:** Published in all Nikoli issues from #38 onward. Seven books by 2005. Now present in print, web, mobile, and console (HAMSTER/Nikoli Switch deal in 2022-2023 brought it to Nintendo Switch as Puzzle by Nikoli S Nurikabe)
- **Related Nikoli puzzles using the same binary-determination + connectivity mechanic:** LITS, Mochikoro, Atsumari (hexagonal), Heyawake (room-based)
- **Useful constraint-solver notes:** the order of constraint application matters — solve in (1) island-size-and-2x2 check → (2) sea connectivity check → (3) numbered-cell check. Generating a solvable puzzle requires backtracking + uniqueness verification (a 12x12 with 6+ islands can take seconds to generate naively; consider tabu search or SAT solver if generation perf is an issue)
