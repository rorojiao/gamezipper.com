# BENCHMARK: Stacklands / Card-Stacking Village Builder

## Selected: Stack Village (slug: stacklands)
**Candidate Score:** 20/25 (D=4 S=4 R=5 F=3 Z=4)

---

## Competitor 1: Stacklands (Sokpop Collective, 2022)
- **Platform:** Steam ($7.99 base, $3.99 x2 DLC)
- **Reviews:** 28,571 total (Overwhelmingly Positive, 90.5%+)
- **Peak CCU:** 5,135 all-time; 599 avg (still active in 2026)
- **Awards:** Dutch Game Awards Best Innovation, IGF nomination, created "stacklike" subgenre
- **Core Loop:** Buy card packs → place resource cards → cards auto-produce → combine cards to craft → build village → survive night attacks → sell for coins → buy more packs
- **Cards:** 331 cards in 14 color categories (resources, food, ideas, buildings, villagers, enemies, etc.)
- **Recipes:** 191 recipes across 9 Idea categories
- **Booster Packs:** 18 packs across 6 worlds
- **Villagers:** 12 professions (lumberjack, miner, farmer, cook, guard, etc.)
- **Key Systems:** Day/night cycle, combat, cooking, trading, quests, moon-based progression
- **Art Style:** Minimalist flat 2D, warm palette, simple geometric shapes
- **Music:** Chill ambient loops

## Competitor 2: Cardboard Town (2024)
- **Platform:** Steam
- **Reviews:** ~1,528 (Mixed-Positive)
- **Core Loop:** Card-based town builder with deck-building elements
- **Key Difference:** More deck-builder than village-sim; cards drawn from deck

## Competitor 3: Ratropolis (2021)
- **Platform:** Steam ($17.99)
- **Reviews:** ~1,466 (Very Positive)
- **Core Loop:** Card-based defense + city building; real-time card deployment
- **Key Difference:** Tower-defense focused, not pure village builder

## Competitor 4: Loop Hero (2021)
- **Platform:** Steam ($14.99)
- **Reviews:** 50K+ (Overwhelmingly Positive)
- **Core Loop:** Auto-battler with card-based world building
- **Key Difference:** Cards modify an auto-loop, no direct card placement

## Adaptation Spec for GameZipper

### Simplified Core Loop (Browser Puzzle)
1. Start each level with a hand of cards
2. Place resource cards on board → they auto-produce materials (real-time with visual progress)
3. Combine materials to craft buildings/tools (drag-to-combine or tap-tap)
4. Complete level objectives (build X, produce Y, reach population Z)
5. 3-star rating based on speed + efficiency

### Card System (15 types)
**Resources (auto-produce):** Tree (Wood), Bush (Berries), Boulder (Stone)
**Materials:** Wood, Stone, Berries, Coin
**Crafted:** Plank (Wood+Wood), Brick (Stone+Stone), Plank Stack
**Buildings:** Hut (Plank+Plank), House (Plank+Brick), Campfire (Wood+Stone), Farm (Plank+Berries), Sawmill (Wood+Wood+Stone)
**Units:** Villager (auto-collects from nearby sources)

### Level Structure (30 levels, 5 chapters)
- Ch1 Tutorial (1-5): Basic placing and combining
- Ch2 Crafting (6-10): Multi-step crafting chains
- Ch3 Building (11-15): Construct buildings from materials
- Ch4 Economy (16-20): Coins, markets, trading
- Ch5 Master (21-30): Complex multi-objective puzzles

### Scoring
- Base: 1000 pts per objective completed
- Time bonus: remaining seconds x 10
- Efficiency: unused cards x 50
- Stars: 1-star (complete), 2-star (under par time), 3-star (under par + efficient)

### Key Differences from Original
- Level-based puzzle (not open-ended sandbox)
- No combat/monsters (cozy puzzle focus)
- No card packs/shop (cards pre-set per level)
- Simplified crafting tree (15 card types vs 331)
- GZ dark-neon visual style instead of minimalist warm

### Monetization Comparison
- Original: Paid game ($7.99) + DLC
- GZ: Free with Monetag ads (banner + interstitial between levels)
