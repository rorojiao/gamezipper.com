# Word Ladder — Competitor Benchmark

## Concept
A word ladder (also known as a Doublet, word-link, or Wolffian puzzle) is a puzzle
where the player changes one letter at a time to morph a start word into an end word.
Each intermediate word must be a valid English word.

## Reference games surveyed
1. **Wordscapes** (PeopleFun) — word ladder mechanics in a crossword shell
2. **Wordle** (NYT) — daily word guessing, related 1-letter-change puzzles exist
3. **Kitty Letter** (Jackbox) — word-forming letter stacking
4. **Alphabear 2** (Spry Fox) — word puzzle with letter mutations

## Common systems to mirror
- Daily / level based progression
- 4-letter, 5-letter, 6-letter ladders
- Hint system (reveal one letter, or skip a level)
- Star rating by turns / time
- Reset & undo
- Local high score (fewest turns)
- Tutorial / first-run explainer
- BGM + click / correct / wrong SFX
- Smooth UI animations on each mutation

## Difficulty curve (S-grade)
- Levels 1-10:   4-letter ladders, 3-4 steps, 1 hint
- Levels 11-20:  5-letter ladders, 4-5 steps, 1 hint
- Levels 21-30:  6-letter ladders, 5-6 steps, 2 hints
- Levels 31-40:  mixed with letter locks (some positions fixed)
- Levels 41-50:  6+ letter ladders with a "minimum 4 mutation" rule

## Visual style
Dark gradient (GameZipper style), neon purple/teal accent, glassmorphic
panels, modern minimal typography (system font fallback), emoji-free.

## Music
Procedural Web Audio BGM (gentle ambient pad) + 6 SFX (click, success,
wrong, level-complete, hint, level-start).
