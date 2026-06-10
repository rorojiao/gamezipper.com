# BENCHMARK.md — Letter Boxed (NYT-style daily word-chain puzzle)

Slug: letter-boxed
Category: puzzle / word
Format: single-file HTML5 Canvas game
Asset budget: zero images; one inline word-list only
Authoritative sources cross-checked for this benchmark:
- NYT Help Center, "Letter Boxed" article (help.nytimes.com/360011158491-.../28527193547028-Letter-Boxed)
- Wikipedia, "Letter Boxed" (en.wikipedia.org/wiki/Letter_Boxed) — 2019 by Sam Ezersky, third NYT puzzle after Crossword and Spelling Bee
- NYT Crosswords, "How to Beat Letter Boxed at Its Own Game" (nytimes.com/2022/01/19/crosswords/letter-boxed-tips-and-tricks.html) — #2solve culture
- WordTips Letter Boxed daily solver (word.tips/letterboxed-todays-hints-answers/) — observed solver output for NYT #2744 (June 9 2026) and #2743 (June 8 2026)
- Alex-Gberg/letter-boxed-solver on GitHub — reference Python greedy solver using a filtered word list
- letter-boxed.com (MyArcadePlugin clone) and letterboxedgames.com (live playable clone)
- Beebom "8 Best Letter Boxed Alternatives" (April 2026)
- letterborder.com (free archive clone)
- squaredle.me/letter-boxed-solver (input-by-side solver UI)

---

## 1. Target Game Overview

### What is NYT Letter Boxed?

NYT **Letter Boxed** is a daily word-chain puzzle published by The New York Times Games team. It was created by Sam Ezersky (the same editor who later created Spelling Bee's sibling mechanics) and soft-launched in 2018 before official release on February 1, 2019 — the third puzzle added to nytimes.com/games after the daily Crossword and Spelling Bee. The game is a subscription feature (NYT Games / All Access / Home Delivery).

### Board layout

- A **square with 4 sides** (top, right, bottom, left)
- **3 letters per side = 12 letters total** (letters may repeat across sides but are placed once each)
- Letters sit on the four edges, drawn as colored dots or tile glyphs in the NYT color palette
- The center of the square is empty and used to render the current word being typed

### Word-formation rules (verbatim from NYT Help Center)

1. **Connect letters to spell words.** Pick any letter on the box to start; each next letter must come from the square (no off-board letters).
2. **Words must be at least 3 letters long.**
3. **Letters can be reused, but consecutive letters cannot be from the same side.** This is the defining constraint. It forbids words like "BRILLIANTLY", "FORMATTED", "DAZZLE" — any word whose two adjacent letters live on the same edge of the box.
4. **The last letter of a word becomes the first letter of the next word.** Canonical NYT example: HERE > EVERY > YEAR (H starts on side A, lands on E from side B, then R must come from a different side from E, then E from a different side from R, etc.).
5. **Select Enter after creating a word** to commit it to the bank and start the next word.
6. **Words cannot be proper nouns or hyphenated; adjectives are accepted.**
7. **Letter Boxed words are curated by editors — the game may not include all words present in a dictionary.** This is critical for our word-list strategy.

### Win condition

- **Use all 12 letters at least once**, in **as few words as possible**.
- NYT publishes a daily **par score** ("try to solve in N words"). Most days par is **3, 4, 5, or 6**. A **2-solve** is the community's badge of honor (the #2solve hashtag on X/Twitter); a **1-solve is impossible** because a single word cannot contain all 12 distinct letters while staying ≥3 and respecting the side-switch rule.
- NYT tracks a single in-game label at completion: "perfect" / "great" / "good" style descriptors keyed off whether you matched par. **NYT does NOT publish per-account statistics for Letter Boxed** as of June 2026 (per the official help article: "Letter Boxed does not have statistics at this time") — this is a major differentiator vs. Spelling Bee/Wordle/Connections and an opportunity for us.

### Daily cadence

- One puzzle published **daily at 3:00 a.m. EST**.
- After completion, a "Yesterday" menu item reveals a **two-word solution for the previous day's puzzle** (a built-in spoiler-protected second chance).

### Where it ships

- Web: nytimes.com/puzzles/letter-boxed
- iOS/Android: NYT Games app and News app
- No public API; the daily puzzle is gated by NYT auth cookies and not exposed to third parties.

### Aesthetic & feel

- Cream / off-white background, NYT brand typography (Cheltenham serif headers + Franklin Gothic sans for UI)
- Letters drawn as large rounded circles in the four signature colors (one color per side — typically red/yellow/blue/green or similar)
- Subtle click on letter pick, soft chime on word commit, satisfying completion flourish
- Dark theme toggle available in app; web is light-mode only

### Cultural footprint

- Cited by Harvard Crimson, Vanity Fair, Axios, and Press Gazette as one of the quiet revenue drivers behind the NYT's "casual games" subscription strategy (~300k net new digital subs in a single quarter, partly attributed to games).
- Spawned an active Twitter/X community posting **2-solves** (often encoded in binary or emoji to avoid spoiling other players).
- Featured in NYT Crosswords' own "How to Beat Letter Boxed" column (Jan 2022).

---
