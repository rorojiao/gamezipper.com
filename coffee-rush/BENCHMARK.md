# Coffee Rush — Competitive Benchmark

**Slug:** coffee-rush
**Genre:** Time-management / drink-assembly matching puzzle
**Selected:** Round 34 (score 23/25: D4 S5 R4 F5 Z5)

## Market Data
- **Papa's Freezeria / Papa's Cheeseria (Flipline):** 50M+ plays on web portals; the gold standard for order-assembly time-management. Multi-station build, customer patience, tips, upgrades.
- **Cook, Serve, Delicious! (Vertigo Gaming):** 2M+ sales; high-pressure single-screen order fulfillment with keyboard input and combo systems.
- **Good Pizza, Great Pizza (TapBlaze):** 50M+ downloads; order-matching + ingredient assembly + upgrades.
- **Starbucks / barista hyper-casual (My Coffee Shop, Idle Coffee):** 10M+ downloads each; proves the "make coffee drinks" theme has strong demand.
- **GZ coverage:** `grep -c "coffee|barista|espresso|latte" js/games-data.js` = 0 across 358 games. TRUE gap.

## Systems to Match (all required)
1. **Customer queue with patience timers** — customers wait, leave angry if neglected (Papa's, CSD).
2. **Order ticket display** — visual ingredient/icon sequence per customer.
3. **Ingredient assembly bar** — tap ingredients in order to build the drink.
4. **Serve + accuracy check** — correct order = coins + tip; wrong = penalty.
5. **Combo / streak multiplier** — consecutive correct serves (CSD).
6. **Coins + best score** — localStorage persistence.
7. **Level progression** — 20+ levels with escalating difficulty (more recipes, faster patience, more customers).
8. **Star rating** — per-level performance grade.
9. **Upgrade shop** (optional depth) — spend coins on patience/speed/tip multipliers.
10. **Tutorial** — first-level onboarding overlay, skippable.
11. **Pause + mute** — accessibility controls.
12. **Audio feedback** — click, correct, wrong, serve, combo, level-up (Web Audio API).
13. **Juice** — particles, screen shake, combo popups, celebration on level clear.

## Visual Style Reference
- Warm coffee-shop palette: cream, caramel, espresso-brown, with neon accent (GameZipper dark base).
- Customer avatars: cute cup/blob characters (emoji-based for single-file feasibility).
- Order tickets: rounded cards with ingredient icon sequence + depleting patience bar.
- Glass-morphism HUD, rounded ingredient buttons, satisfying tap feedback.

## Music
- Lo-fi / acoustic cafe vibe: moderate tempo, warm guitar, soft keys. Procedural via Web Audio API (MiniMax key not configured).

## Scoring Formula
- Base coins per correct serve: 10
- Tip bonus: scales with remaining patience (0–15 coins)
- Combo multiplier: 1 + (streak × 0.2), capped at 3×
- Level target: serve N customers; star rating by total coins.
