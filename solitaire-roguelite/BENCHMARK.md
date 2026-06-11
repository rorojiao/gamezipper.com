# Competitive Benchmark: Solitaire Roguelite

> **Document Purpose:** Competitive analysis for a browser-based HTML5 Canvas "Solitaire Roguelite" game combining classic solitaire card mechanics with roguelike progression. This document catalogs the key competitors, their systems, numerical values, art/music direction, and design patterns to inform our game's development.

**Date:** June 2026  
**Genre:** Solitaire Card Game × Roguelike Progression  
**Target Platform:** Browser (HTML5 Canvas), Web  
**Target Audience:** Western/English-speaking casual-to-midcore gamers  

---

## Table of Contents

1. [Competitor Overview Matrix](#1-competitor-overview-matrix)
2. [Detailed Competitor Profiles](#2-detailed-competitor-profiles)
   - [Solitairica](#21-solitairica)
   - [Slay the Spire](#22-slay-the-spire)
   - [Balatro](#23-balatro)
   - [Card Crawl](#24-card-crawl)
   - [Ring of Pain](#25-ring-of-pain)
   - [Meteorfall: Journey](#26-meteorfall-journey)
3. [System-by-System Comparison](#3-system-by-system-comparison)
4. [Numerical Values Reference](#4-numerical-values-reference)
5. [Art Style References](#5-art-style-references)
6. [Music & Audio References](#6-music--audio-references)
7. [Key Takeaways & Design Recommendations](#7-key-takeaways--design-recommendations)

---

## 1. Competitor Overview Matrix

| Feature | Solitairica | Slay the Spire | Balatro | Card Crawl | Ring of Pain | Meteorfall |
|---|---|---|---|---|---|---|
| **Core Mechanic** | Golf solitaire | Deck-building combat | Poker hands | Solitaire dungeon crawl | Card ring navigation | Swipe deck-builder |
| **Platform** | iOS, Android, Steam (PC) | PC, Console, Mobile | PC, Console, Mobile | iOS, Android, Steam | PC (Steam), Switch | iOS, Android, Steam |
| **Price** | $6.99–$9.99 | $24.99 | $14.99 | $2.99 | $14.99 | $4.99 |
| **Art Style** | Fantasy cartoony 2D | Stylized dark fantasy 2D | Retro pixel art | Dark minimalist 2D | Dark atmospheric pixel | Cartoony 2D |
| **Run Length** | 15–45 min | 30–90 min | 20–60 min | 5–15 min | 15–45 min | 10–30 min |
| **Encounters per Run** | 18 battles | ~50 encounters (4 acts) | 24 rounds (8 antes × 3) | 1 deck (54 cards) | ~15–20 rooms | ~20 encounters |
| **HP System** | Hearts (varies by class) | 70–80 HP per character | No HP (score-based) | Hearts (limited) | Hearts | Stamina + HP |
| **Meta-Progression** | Wildstones → unlock heroes | Card unlocks, Ascension | Deck/Stake unlocks | Ability card unlocks | Item unlocks | Hero unlocks |
| **Key USP** | Solitaire × RPG combat | Pure deck-building depth | Poker × insane combos | Quick solitaire sessions | Atmospheric exploration | Swipe-based speed |
| **Steam Rating** | Very Positive | Overwhelmingly Positive | Overwhelmingly Positive | Mostly Positive | Very Positive | Very Positive |
| **Release Year** | 2016 | 2019 (1.0) | 2024 | 2015 | 2020 | 2019 |

---

## 2. Detailed Competitor Profiles

### 2.1 Solitairica

**Developer:** Righteous Hammer Games  
**Platform:** iOS, Android, PC (Steam)  
**Release:** 2016  

**Core Mechanics:**
- Based on **golf solitaire** — remove cards one rank above/below the revealed card
- Instead of 4 standard suits, cards use **4 energy types**: Attack (⚡), Defense (🛡), Agility (💨), Willpower (🔮)
- Matching cards of a given energy type generates energy of that type
- Energy is spent on **spells** that deal damage, heal, shield, or manipulate the board
- Enemy attacks occur on a timer after player actions (each card removal = 1 action)

**Level/Encounter System:**
- **18 battles** across **6 sections** (3 battles per section):
  - Sections 1–3: Findlehooven → Meadows of Madness → Blandlands
  - Sections 4–6: Ruinous Bog → ??? → Castle Stuck
- Difficulty escalates through enemy HP (card count), damage output, and traits
- Final boss: **Emperor Stuck** (section 18)
- Enemy **traits** (1–3 per encounter) randomize difficulty: Armored, Colossal, Fire, Ice, Poison, Raging, Exploding, etc.

**Heroes (6 classes):**
| Hero | Starting HP | Specialty |
|---|---|---|
| Warrior | ~15 hearts | Attack-focused, bonus attack energy |
| Wizard | ~12 hearts | Willpower-focused, spell-heavy |
| Paladin | ~14 hearts | Defense/healing hybrid |
| Rogue | ~11 hearts | Agility-focused, quick combos |
| Monk | ~13 hearts | Balanced, discipline mechanics |
| Bard | ~12 hearts | Utility, combo bonuses |

**Spells (categorized by energy type):**

| Category | Spell | Cost (Energy) | Gold Price | Effect |
|---|---|---|---|---|
| **Attack** | Cleave | 6 | 70g | Damage front card + adjacent |
| | Blade Storm | 10 | 90g | Damage ALL front cards |
| | Berserk | 4 | 30g | Damage front card, lose 2 HP, damage another |
| | Pierce | 4 | 30g | Damage column ×2 |
| | Impale | 5 | 50g | Damage column ×3 |
| | Overwhelm | 6 | 50g | Damage all front cards of chosen type |
| | Spear of Light | 7 | 90g | Destroy entire column |
| **Willpower** | Arcane Missiles | 6 | 50g | Damage 3 front cards |
| | Comet Storm | 8 | 70g | Damage target + surrounding cards |
| | Minor Heal | 3 | 30g | Restore 2 HP |
| | Alchemy | 1 | 30g | Convert front cards to triple coin cards |
| | Cosmic Inversion | 8 | 90g | Next enemy attack heals instead |
| **Defense** | Block | 6 | 70g | Prevent all damage from next attack |
| | Reversal | 8 | 90g | Bounce next attack back |
| | Resilience | 3 | 30g | Convert all Willpower → Armor |
| | Raise Shield | 5 | 50g | Gain 4 armor |
| | Shove | — | — | Stun enemy 1 turn |
| **Agility** | Disengage | 3 | 30g | Split longest column |
| | Strategy | 5 | 70g | Convert all front cards to chosen type |
| | Backflip | 5 | 90g | Redeal all cards +1 column (max 7) |
| | Perceive I | 3 | 30g | Reveal second card in each column |
| | Dodge | 6 | 50g | Double cooldown of enemy ability |
| | Haste | 6 | 10g | Reduce another spell cost by 1 (min 2) |

**Items (passive equipment, up to 4–6 slots):**

| Item | Cost | Effect |
|---|---|---|
| Heart Choker | 20g | +2 max HP |
| Heart Locket | 40g | +3 max HP |
| Healing Salve | 30g | Numeral 2 cards heal 2 HP |
| Healing Potion | 60g | Numeral 4 cards heal 4 HP |
| Fractal Clover | 80g | Coin card rewards doubled |
| Topaz Shard | 20 Wildstone | Start +2 Attack energy |
| Topaz Ring | 40 Wildstone | Start +3 Attack energy |
| Spinning Top | 50 Wildstone | Start +1 all energy |
| Turtle | 80g | +1 to all armor gains |
| Leather Patch | 15g | Start +2 armor |
| Spectacles | 30g | Block first stun per battle |
| Celestial Hourglass | 175g / 15 WS | Revive if killed (once per run) |

**Enemy Damage Scaling (selected):**
| Enemy | Damage | Cooldown |
|---|---|---|
| Dirty Guppy | 1 (Nibble) | — |
| Claw Fiend | 2 (Night Claw) | [1] |
| Bjord | 3 (Pointy Stick) | [1] |
| Gremlin | 4 (Prismatic Zap) | [2] |
| Hug Bug | 4 (Big Hug) | [2] |
| Man-Cat | 4 (Yarn Flail) | [1] |
| Megabarb | 4 (Thunder Axe, destroys 2 armor) | — |
| Skelezoid | 6 (Bone Club) | [2] |
| Jam Cube | 4 (Spit Armor) | — |
| Burlypup | 8 (Driftwood Club) | [3] |
| Ogger | 15 (Stomp) | [5] |

**Meta-Progression:**
- **Wildstones** earned on death/completion → permanent unlocks
- 2 deck upgrades per hero (enhanced starting energy)
- 2 extra item slots per hero (up to 6 slots: 4 base + 20 WS + 40 WS)
- 6 heroes to unlock
- Limited grinding — upgrades cap quickly

---

### 2.2 Slay the Spire

**Developer:** Mega Crit Games  
**Platform:** PC, PlayStation, Xbox, Switch, iOS, Android  
**Release:** 2019 (1.0), Early Access 2017  

**Core Mechanics:**
- Turn-based **deck-building combat**: play cards from hand, each costs Energy
- Energy regenerates each turn (base: **3 Energy/turn**)
- Card types: Attack, Skill, Power, Curse, Status
- Enemies telegraph their next action (intent system)
- Block (armor) carries over within combat only; resets between fights

**Character Starting Values:**

| Character | Starting HP | Starting Energy/Turn | Starting Deck | Starting Relic |
|---|---|---|---|---|
| Ironclad | **80 HP** | 3 | 5 Strike, 5 Defend, 1 Bash | Burning Blood (heal 6 HP after combat) |
| Silent | **70 HP** | 3 | 5 Strike, 5 Defend, 1 Survivor, 1 Neutralize | Ring of the Snake (draw +2 cards) |
| Defect | **75 HP** | 3 | 4 Strike, 4 Defend, 1 Zap, 1 Dualcast | Cracked Core (Channel 1 Lightning) |
| Watcher | **72 HP** | 3 | 4 Strike, 4 Defend, 1 Eruption, 1 Vigilance | Pure Water (add Miracle to hand) |

**Card Costs & Values:**
- Card energy costs: **0, 1, 2, 3** (rarely X or unplayable)
- Typical damage: Strike = 6(9) damage for 1 Energy
- Typical block: Defend = 5(8) block for 1 Energy
- Common cards: 0–2 cost, ~5–12 damage or 5–10 block
- Rare cards: 1–3 cost, powerful effects (up to 30+ damage or complex multi-hit)
- Upgraded cards (shown in parentheses): ~30–50% improvement

**Level/Encounter System:**
- **4 Acts** (base game) + Act 4 (post-game boss rush)
- Each act has **~15 rooms**: ~3 elite fights, ~5 normal fights, ~3 events, ~2 shops, ~2 rest sites, 1 boss
- Map is branching (choose your path)
- **3 bosses** per act (randomly selected from pool of 2–3 each act)
- Ascension levels 0–20 add increasing difficulty modifiers

**Relics (170+ total):**
- **Starter relics:** Character-specific (1 per character)
- **Common relics:** e.g., Anchor (start combat with 10 Block), Akabeko (first attack deals +8 damage)
- **Boss relics:** Game-changing but often with drawbacks, e.g.,:
  - +1 Energy/turn but lose a card slot
  - At start of each combat, gain 1 Strength
- Rarity distribution: Common 50% / Uncommon 33% / Rare 17%

**Ascension Difficulty Modifiers (selected):**
| Level | Effect |
|---|---|
| 1 | Elites spawn more |
| 5 | -5 max HP |
| 10 | -1 potion slot |
| 15 | -10% gold earned |
| 20 | Double boss HP |

**Meta-Progression:**
- Card unlocks per character (progressive unlock through runs)
- Ascension difficulty levels (0–20, beat one to unlock next)
- Achievements unlock new seeds/content
- No power grinding — skill-based

---

### 2.3 Balatro

**Developer:** LocalThunk (solo developer)  
**Publisher:** Playstack  
**Platform:** PC, Console (all), iOS, Android, Switch 2  
**Release:** February 20, 2024  
**Sales:** 5+ million copies by January 2025  
**Awards:** GDC Game of the Year 2025, TGA nominated  

**Core Mechanics:**
- Play **poker hands** from a standard 52-card deck to score points
- Score = **Chips × Mult** (multiplied further by XMult jokers)
- Each round: limited **hands** (default 4) and **discards** (default 3)
- Beat the blind's target score or the run ends
- **No enemy HP** — pure score chase against escalating targets

**Scoring Formula:**
```
Final Score = (Base Chips + Added Chips) × (Base Mult + Added Mult) × XMult₁ × XMult₂ × ...
```

**Card Rank Chip Values:**
| Rank | Chips |
|---|---|
| 2–9 | Face value (2=2, 9=9) |
| 10, J, Q, K | 10 |
| Ace | 11 |

**Poker Hand Base Values:**

| Hand | Base Chips | Base Mult |
|---|---|---|
| High Card | 5 | 1 |
| Pair | 10 | 2 |
| Two Pair | 20 | 2 |
| Three of a Kind | 30 | 3 |
| Straight | 30 | 4 |
| Flush | 35 | 4 |
| Full House | 40 | 4 |
| Four of a Kind | 60 | 7 |
| Straight Flush | 100 | 8 |
| Royal Flush | 100 | 8 |
| Five of a Kind | 120 | 12 |
| Flush House | 140 | 14 |
| Flush Five | 160 | 16 |

**Ante System (8 Antes = full run):**
Each ante has 3 rounds: Small Blind → Big Blind → Boss Blind

| Ante | Small Blind Target | Big Blind Target | Notes |
|---|---|---|---|
| 1 | 300 | 450 | Tutorial range |
| 2 | 800 | 1,200 | |
| 3 | 2,800 | 4,000 | |
| 4 | 6,000 | 9,000 | Difficulty spike |
| 5 | 12,000 | 18,000 | |
| 6 | 25,000 | 36,000 | |
| 7 | 50,000 | 72,000 | |
| 8 | 100,000 | 150,000 | Win condition |

- Target scores roughly **double each ante** (exponential curve)
- Boss Blinds have special abilities (e.g., "all face cards are debited," "cards play face-down")
- Ante 8+ enters **Showdown** tier with unique bosses

**Joker System (150 Jokers at launch, 200+ total):**
- **5 Joker slots** (base, expandable with Negative edition)
- Joker editions: Base, Foil (+50 Chips), Holographic (+10 Mult), Polychrome (×1.5 Mult), Negative (+1 Joker slot)
- Key Joker archetypes:
  - **+Chips:** Flat chip bonuses (e.g., +4 per card played)
  - **+Mult:** Flat mult bonuses (e.g., +3 per hand type)
  - **×Mult:** Multiplicative (e.g., ×3 if hand contains a pair) — **these break runs**
  - **Economy:** Generate money (e.g., +$1 per hand played)
  - **Utility:** Modify deck, copy cards, etc.

**Economy:**
- Money ($) earned from beating blinds, interest (up to $5 per $25 held), and joker effects
- Shop between rounds: Jokers (~$4–$8), Tarot cards (~$3), Planet cards (~$3), Vouchers (permanent upgrades)

**Card Enhancement System:**
| Enhancement | Effect |
|---|---|
| Bonus Card | +30 Chips when scored |
| Mult Card | +4 Mult when scored |
| Wild Card | Counts as any suit |
| Glass Card | ×2 Mult when scored (1/4 break chance) |
| Steel Card | ×1.5 Mult while held in hand |
| Stone Card | +50 Chips always, no suit/rank |
| Gold Card | +$3 at end of round if held |
| Lucky Card | 1/5: +20 Mult; 1/15: +$20 |

**Planet Cards:** Permanently upgrade a poker hand's base Chips/Mult for the run  
**Tarot Cards (22):** One-time effects — change suits, enhance cards, destroy cards  
**Spectral Cards (18):** Powerful one-time effects with trade-offs  
**Vouchers (32):** Permanent run upgrades (shop improvements, extra hand/discard)  
**Tags (24):** Rewards for skipping blinds  

**Difficulty Scaling (Stakes):**
8 difficulty levels per deck, each adding a modifier (e.g., less money, fewer hands, ante score increases)

**Meta-Progression:**
- 15 unlockable decks (each with unique starting modifiers)
- 100+ unlockable items for collection
- 8 stake levels per deck (beat one to unlock next)
- Seeded and unseeded runs

---

### 2.4 Card Crawl

**Developer:** Arnold Rauers / Tinytouchtales  
**Platform:** iOS, Android, PC (Steam)  
**Release:** 2015  

**Core Mechanics:**
- Solitaire-style dungeon crawler played with a **modified 54-card deck**
- 4 columns of cards dealt from the deck; player has limited inventory (3 slots)
- Card types: **Monsters** (deal damage = their number), **Swords** (weapon, store in inventory), **Shields** (block damage), **Health Potions** (restore HP), **Gold** (score)
- Play by dragging cards: monster → sword (attack), monster → shield (block), potion → self (heal)
- Simple rock-paper-scissors decision making with inventory management

**Systems:**
- **HP:** Player starts with limited hearts (typically matching card values)
- **Sword durability:** Each sword has uses equal to its face value
- **Shield:** Absorbs damage equal to its face value
- **Gold:** Earned from coin cards and leftover HP; tracked as high score
- **Inventory:** 3 slots for swords, shields, potions

**Deck Structure (54 cards):**
- Monster cards (various values)
- Sword cards (attack value = face)
- Shield cards (defense value = face)
- Health potion cards
- Coin/gold cards
- Special ability cards

**Ability Cards (mini deck-building):**
- Equip **5 ability cards** before each run from a collection of **35+ abilities**
- Abilities provide unique skills (heal, damage, redraw, etc.)
- Unlock more ability cards through play/gold

**Level/Encounter System:**
- Single continuous run through 54 cards
- No discrete levels — just one dungeon deck
- Runs are **5–15 minutes** (very quick sessions)
- High score tracking per run

**Meta-Progression:**
- Unlock new ability cards
- Gold earned → purchase Red and Black Joker cards (game-changing)
- Complete high score tracking and run history
- Minimal grind — emphasis on skill and luck

---

### 2.5 Ring of Pain

**Developer:** Simon Boxer / Twice Different  
**Platform:** PC (Steam), Nintendo Switch  
**Release:** October 2020  

**Core Mechanics:**
- Card-based roguelike where encounters are displayed in a **ring formation** around the player
- Cards represent: enemies, items, equipment, and events
- Player can move between adjacent cards, choosing which to engage
- Turn-based: each action (movement/interaction) allows enemies to act
- Equipment and items are found during runs — no separate deck construction
- Light sources and visibility mechanics add tactical depth

**Systems:**
- **HP/Hearts:** Player has a fixed heart container; damage reduces it
- **Attack/Defense stats:** Modified by equipment cards
- **Equipment slots:** Weapon, armor, and accessory slots
- **Fleeing:** Can choose to avoid encounters by positioning
- **Souls/Leveling:** Defeating enemies grants XP for stat upgrades

**Level/Encounter System:**
- Multiple **floors** (rooms), each with a ring of cards
- Each floor has different enemy pools and difficulty
- **~15–20 rooms** per run
- Boss encounters at key intervals
- Branching paths between floors
- Difficulty escalates with each room/floor

**Items & Equipment:**
- Weapons: Modify attack damage (e.g., +2 damage, +1 damage but -1 HP)
- Armor: Reduce incoming damage
- Artifacts: Passive bonuses (varied effects)
- Consumables: One-time healing, damage, etc.

**Meta-Progression:**
- Unlock new item pools
- Unlock new characters (different starting stats)
- Mild permanent progression

**Art Style:**
- Dark, hand-drawn pixel art with heavy atmospheric lighting
- Muted earth tones with bright accent colors
- Eerie, oppressive dungeon aesthetic

---

### 2.6 Meteorfall: Journey

**Developer:** Slothwerks  
**Platform:** iOS, Android, PC (Steam)  
**Release:** 2019  

**Core Mechanics:**
- **Swipe-based** roguelike deckbuilder (Tinder-style card interactions)
- Cards are played by swiping left or right (each direction = different choice)
- Timed turns: **sand timer** creates urgency (8–10 seconds per decision)
- Simple one-handed play optimized for mobile
- Limited hand management — choose which cards to play vs. discard

**Systems:**
- **HP:** Character health, varies by class
- **Stamina:** Resource to play cards (regenerates)
- **Gold:** Currency to buy cards/upgrades at shops
- **Deck:** Built during run through rewards and shops

**Character Classes:**
- Multiple heroes with unique starting decks and abilities
- Each class has a preferred playstyle (aggro, control, combo)

**Level/Encounter System:**
- Linear progression through **nodes on a map**
- ~20 encounters per run
- Node types: Monster, Elite, Shop, Event, Rest, Boss
- **4 areas** with a boss at the end of each
- Runs last **10–30 minutes**

**Meta-Progression:**
- Unlock new heroes through achievements
- Unlock new cards for the card pool
- Cosmetic unlocks

---

## 3. System-by-System Comparison

### 3.1 HP / Damage Systems

| Game | Player HP | Damage Range | Healing | Armor/Shield |
|---|---|---|---|---|
| **Solitairica** | 11–15 hearts (by class) | 1–15 per attack | Spells (2–4 HP), items | Armor (stacks, absorbed) |
| **Slay the Spire** | 70–80 HP | 5–40+ per attack | Rest sites (30% max), cards, relics | Block (per combat, 5–30+) |
| **Balatro** | None (score-based) | N/A | N/A | N/A |
| **Card Crawl** | Hearts (card-based) | 1–10 (card values) | Health potions | Shields (absorb damage) |
| **Ring of Pain** | Hearts (fixed container) | 1–15+ | Consumables, abilities | Equipment-based defense |
| **Meteorfall** | HP (class-dependent) | 3–20+ | Cards, rest nodes | Temporary block cards |

### 3.2 Deck Management

| Game | Deck Size | How Modified | Card Types |
|---|---|---|---|
| **Solitairica** | Fixed per class | Items modify card properties | 4 energy suits (standard card values) |
| **Slay the Spire** | 10 starting → 25–35 typical | Add cards (rewards/shop), remove (events/shop) | Attack, Skill, Power, Curse, Status |
| **Balatro** | 52 starting | Add/remove (Tarot, shop), enhance (Tarot) | Standard playing cards + enhancements |
| **Card Crawl** | 54 fixed | 5 ability cards selected pre-run | Monster, Sword, Shield, Potion, Gold |
| **Ring of Pain** | No deck | Equipment found during run | Equipment, consumables, enemies |
| **Meteorfall** | 10 starting → 15–20 typical | Add (rewards/shop), thin (events) | Attack, Skill, Item |

### 3.3 Artifacts / Relics

| Game | Count | How Obtained | Effect Range |
|---|---|---|---|
| **Solitairica** | ~20+ items | Shop (gold/wildstones) | +2 energy, +3 max HP, double coins, revive |
| **Slay the Spire** | 170+ relics | Chests, elites, bosses, events, shop | +6 HP heal after combat, +1 energy, +8 damage, +10 block |
| **Balatro** | 150+ Jokers | Shop between rounds | +Chips, +Mult, ×Mult, economy, utility |
| **Card Crawl** | 35+ ability cards | Unlocks | Unique per-run skills |
| **Ring of Pain** | 30+ items/equipment | Found in rooms | +attack, +defense, passive bonuses |
| **Meteorfall** | ~20+ unlockables | Progression | New cards, heroes |

### 3.4 Economy / Currency

| Game | Currency | Earn Rate | Spent On |
|---|---|---|---|
| **Solitairica** | Gold (per-run) + Wildstones (meta) | 10–100g per battle | Items, spells; Wildstones → permanent upgrades |
| **Slay the Spire** | Gold (per-run) | 15–50g per fight | Cards, relics, potions, card removal |
| **Balatro** | Dollars ($) (per-run) | $3–$5 per blind + interest | Jokers, Tarot, Planet, Vouchers |
| **Card Crawl** | Gold (per-run) | Coin cards in deck | Joker cards, ability unlocks |
| **Ring of Pain** | Gold (per-run) | Room rewards | Shop items |
| **Meteorfall** | Gold (per-run) | Battle rewards | Cards, upgrades at shops |

### 3.5 Meta-Progression

| Game | Persistent Unlocks | Grind Required | Power Ceiling |
|---|---|---|---|
| **Solitairica** | Heroes, item slots, energy shards | Low (capped upgrades) | Moderate (limited advantage) |
| **Slay the Spire** | Card unlocks, Ascension levels | Low–Medium | Low (skill matters more) |
| **Balatro** | Decks, stakes, collection items | Medium | Low (variety, not power) |
| **Card Crawl** | Ability cards, Jokers | Low | Low |
| **Ring of Pain** | Characters, item pool | Low | Low |
| **Meteorfall** | Heroes, card pool | Low | Low |

---

## 4. Numerical Values Reference

### 4.1 Solitairica — Key Numbers

```
Player HP (hearts):          11–15 (varies by class)
Max item slots:              4 (base) → 6 (with upgrades)
Spell energy costs:          1–10 energy
Spell gold costs:            10–90 gold
Item costs:                  15–175 gold or 10–50 wildstone
Starting energy per battle:  Varies by class + items (base ~3 per type)
Enemy damage range:          1–15 per attack
Number of battles per run:   18
Sections:                    6 (3 battles each)
Enemy traits:                1–3 per encounter
Max columns:                 4–7 (depends on abilities)
Coin value per card:         1–3 gold base (doubled with Fractal Clover)
HP heal (Minor Heal):        2 hearts
HP heal (Healing Salve):     2 hearts (on numeral 2 cards)
Armor gains:                 1–4 base (+1 with Turtle item)
```

### 4.2 Slay the Spire — Key Numbers

```
Starting HP:                 Ironclad 80 / Silent 70 / Defect 75 / Watcher 72
Base Energy/turn:            3
Card costs:                  0–3 Energy (typically)
Starting deck size:          10–12 cards
Typical deck size (end):     25–35 cards
Strike damage:               6 (upgraded: 9)
Defend block:                5 (upgraded: 8)
Rest heal:                   30% of max HP
Shop card removal cost:      75–100+ gold (increasing)
Relic rarity odds:           Common 50% / Uncommon 33% / Rare 17%
Boss relic choices:          3 options per act boss
Gold per battle:             ~15–50
Ascension levels:            0–20
Map rooms per act:           ~15
Total encounters per run:    ~50
```

### 4.3 Balatro — Key Numbers

```
Starting deck:               52 cards
Base hands per round:        4
Base discards per round:     3
Base Joker slots:            5
Antes to win:                8
Blinds per ante:             3 (Small, Big, Boss)
Ante 1 target scores:        300 / 450
Ante 8 target scores:        100,000 / 150,000
Score growth rate:           ~2.5× per ante (exponential)
Card chip values:            2–11 (face value)
Poker hand base chips:       5–160
Poker hand base mult:        1–16
Shop joker cost:             ~$4–$8
Tarot card cost:             ~$3
Planet card cost:            ~$3
Interest rate:               $1 per $5 held (max $5/round)
Joker count:                 150+ (200+ with DLC)
Total collectible items:     200+
Total decks:                 15
Stake (difficulty) levels:   8 per deck
```

### 4.4 Card Crawl — Key Numbers

```
Deck size:                   54 cards
Inventory slots:             3
Ability cards per run:       5 (selected pre-run)
Total collectible abilities: 35+
Monster damage:              Equal to card face value (1–10)
Sword damage:                Equal to card face value (1–10)
Shield block:                Equal to card face value (1–10)
Health potion:               Restores HP equal to face value
Run length:                  5–15 minutes
```

---

## 5. Art Style References

### 5.1 Solitairica
- **Style:** Fantasy cartoon 2D with bold colors
- **Palette:** Bright, saturated colors — greens, blues, purples, oranges against dark dungeon backgrounds
- **Card Design:** Custom suits represented by colored energy icons (gem-like crystals)
- **Characters:** Chibi-style fantasy heroes with distinct class silhouettes
- **Enemies:** Whimsical monster designs (guppies, gremlins, bugs, ogres) with personality
- **UI:** Clean, card-game oriented with HP hearts, energy bars, spell icons
- **Reference Feel:** "Adventure Time meets solitaire" — lighthearted but strategic

### 5.2 Slay the Spire
- **Style:** Dark fantasy 2D with gothic influences
- **Palette:** Muted, atmospheric — deep blues, grays, browns with red/gold accents
- **Card Design:** Elegant frames with clear iconography; rarity colors (white/green/blue/gold)
- **Characters:** Distinct silhouettes — Ironclad (bulky warrior), Silent (slender rogue), etc.
- **Enemies:** Varied monster designs from cute slimes to terrifying bosses
- **UI:** Minimal, focused on card play area with enemy intent indicators
- **Reference Feel:** "Dark fantasy dungeon crawler" — serious, atmospheric

### 5.3 Balatro
- **Style:** Retro pixel art with psychedelic/cryptid twist
- **Palette:** Deep purples, blacks, neon highlights; CRT-like effects
- **Card Design:** Standard playing cards with pixel-art Joker illustrations
- **Jokers:** Each has a unique pixel art portrait — surreal, characterful
- **UI:** Casino-inspired with score counters, chip animations
- **Special Effects:** Screen shake, color flashes on big scores
- **Reference Feel:** "Underground poker club meets cosmic horror" — hypnotic, addictive
- **Artist:** Handmade pixel art

### 5.4 Card Crawl
- **Style:** Dark minimalist 2D illustration
- **Palette:** Monochrome with color accents — black, gray, red, gold
- **Card Design:** Simple but expressive card illustrations
- **UI:** Extremely clean, minimal — card grid dominates the screen
- **Reference Feel:** "Dark fairy tale tavern" — cozy yet ominous

### 5.5 Ring of Pain
- **Style:** Dark atmospheric pixel art
- **Palette:** Muted earth tones (brown, dark green) with bright accent lighting (fire, magic)
- **Card Design:** Detailed pixel art illustrations for each enemy and item
- **UI:** Ring layout is the centerpiece; minimal HUD
- **Reference Feel:** "Darkest Dungeon meets card game" — oppressive, mysterious

### 5.6 Meteorfall
- **Style:** Colorful cartoon 2D, mobile-friendly
- **Palette:** Bright, varied colors per area; warm and inviting
- **Card Design:** Large, readable card faces with character art
- **UI:** Swipe-centric, Tinder-style layout
- **Reference Feel:** "Casual mobile roguelike" — accessible, friendly

### Recommended Art Direction for Solitaire Roguelite (Browser)

Given the browser/casual target audience:

| Element | Recommendation |
|---|---|
| **Overall** | Clean 2D cartoon style — Solitairica-level whimsy with Balatro-level readability |
| **Cards** | Clear suit/value indicators; custom suits with colored energy icons |
| **Characters** | Distinct class silhouettes; 2–3 frame idle animations |
| **Enemies** | Personality-driven monster designs; clear threat indicators |
| **Backgrounds** | Layered parallax (2–3 layers); themed per encounter area |
| **UI** | Minimal HUD; HP bar, score/money, inventory slots, energy indicators |
| **Palette** | Dark background (#1a1a2e) with bright card/enemy accents |
| **Animations** | Card flip, damage shake, heal glow, score pop — all <300ms |
| **Resolution** | Scalable canvas (800×600 base, scales up) |

---

## 6. Music & Audio References

### 6.1 Solitairica
- **Music:** Fantasy adventure — lighthearted orchestral with medieval instruments (lute, flute)
- **SFX:** Card flip/clear sounds, spell casting effects, enemy growls, damage thuds
- **Feel:** Cheerful dungeon crawling

### 6.2 Slay the Spire
- **Music:** Dark ambient with orchestral swells; each act has distinct music
- **Composer:** Clark Aboud
- **SFX:** Card play swooshes, damage impacts, relic pickup chimes, boss roars
- **Feel:** Tense, strategic, atmospheric
- **Notable:** Music intensity increases during boss fights

### 6.3 Balatro
- **Music:** Lo-fi jazzy/lounge — exactly 5 tracks, looped seamlessly
- **Composer:** Luis Clemente (LouisF)
- **SFX:** Card deal sounds, chip counting clicks, score multiplier whooshes, slot-machine jingles
- **Feel:** Hypnotic, casino-smooth, "just one more hand" vibes
- **Notable:** Minimal soundtrack — extremely effective through repetition and quality

### 6.4 Card Crawl
- **Music:** Tavern-style ambient — simple, looping acoustic guitar/melody
- **SFX:** Card drag sounds, sword clashes, shield blocks, potion gulps
- **Feel:** Cozy tavern dungeon crawling

### 6.5 Ring of Pain
- **Music:** Dark ambient drone — eerie, minimal, atmospheric
- **SFX:** Card movement, combat impacts, ambient dungeon sounds
- **Feel:** Oppressive, mysterious, tense

### Recommended Audio Direction for Solitaire Roguelite (Browser)

| Element | Recommendation |
|---|---|
| **Music** | 3–5 looping tracks: menu, battle (normal), battle (boss), shop, victory |
| **Style** | Fantasy adventure — Balatro-esque lo-fi approachable, with Solitairica's lightheartedness |
| **Instruments** | Synth + acoustic blend; medieval flavor (lute, flute) with modern beats |
| **SFX Priority** | Card flip, card clear/combo, damage taken, heal, spell cast, item pickup, victory fanfare, defeat sting |
| **Format** | MP3/OGG, <500KB per track, loopable |
| **Total Audio Budget** | <5MB (critical for browser loading) |

---

## 7. Key Takeaways & Design Recommendations

### 7.1 What Works in the Genre

1. **Quick runs (5–30 min)** drive replayability — Solitairica's 18 battles and Card Crawl's single-deck runs are ideal session lengths
2. **Clear scoring/progress** — Balatro's Chips × Mult formula is instantly readable and satisfying
3. **Synergy discovery** — Finding a broken Joker combo in Balatro or relic synergy in StS is the core dopamine loop
4. **Limited meta-grind** — All top competitors cap permanent progression; skill > grind
5. **Simple core, deep systems** — Golf solitaire (Solitairica), poker hands (Balatro) are familiar foundations with RPG layers on top

### 7.2 Recommended Numerical Baselines for Solitaire Roguelite

Based on competitor analysis, here are suggested starting values:

```
Player HP:                   10–12 hearts (browser-friendly scale)
Starting energy/turn:        3 base (matching StS/Balatro standard)
Card energy costs:           0–5 range
Encounters per run:          15–20 (Solitairica range; good for browser sessions)
Run length target:           15–30 minutes
Difficulty scaling:          1.5–2.0× per tier (between Balatro's 2.5× and StS's linear)
Artifact/relic slots:        4–5 (Solitairica/StS range)
Shop visits per run:         5–7 (between encounters)
Enemy damage range:          1–3 early → 5–10 late → 12–20 boss
Healing per source:          2–4 HP (Minor Heal standard)
Max deck size:               Flexible (not a deck-builder; solitaire stack)
Boss encounters:             3–5 per run (section bosses + final boss)
Gold per encounter:          10–50
Shop item costs:             15–100 gold
Meta-currency per run:       0–10 (on death/completion)
```

### 7.3 Competitive Positioning

| Aspect | Our Game | Nearest Competitor |
|---|---|---|
| **Platform** | Browser (no install) | Most require install |
| **Core mechanic** | Classic solitaire (Klondike/TriPeaks variant) | Solitairica (golf solitaire) |
| **Session length** | 15–30 min | Solitairica (15–45 min) |
| **Monetization** | Free-to-play (browser) | Most are paid |
| **Accessibility** | Instant play, no download | Requires app/store |
| **Art** | Clean 2D, browser-optimized | Solitairica / Balatro level |
| **Depth** | Roguelite progression + deck modifiers | StS depth in Solitairica format |

### 7.4 Gaps in the Market

1. **No major browser-based solitaire roguelike exists** — this is an underserved niche
2. **Solitairica is mobile-only (not browser)** and hasn't been updated significantly
3. **Card Crawl is extremely simple** — room for a deeper browser experience
4. **Balatro proved** that card games with "familiar" mechanics + roguelike layers = massive appeal
5. **Free-to-play browser** with S-grade quality would be a unique offering in this space

### 7.5 Must-Have Features (Based on Competitor Analysis)

1. ✅ Clear HP system with visible hearts/health bar
2. ✅ Energy-based spell/ability system (like Solitairica's 4 energy types)
3. ✅ Artifact/relic system with stacking effects (like StS/Balatro relics)
4. ✅ Shop between encounters (universal in all competitors)
5. ✅ Score/combo feedback (Balatro's satisfying score pop)
6. ✅ Meta-progression with unlocks (all competitors)
7. ✅ Multiple difficulty tiers / Ascension-like system
8. ✅ Distinct encounter zones with themed enemies
9. ✅ Boss encounters with unique mechanics
10. ✅ Clear card visual hierarchy (suit, value, status effects)

---

## Sources

- Solitairica Fandom Wiki: https://solitairica.fandom.com
- Solitairica Steam Community Guide (Battle Planning Tool): https://steamcommunity.com/sharedfiles/filedetails/?id=1603676550
- Slay the Spire Fandom Wiki: https://slay-the-spire.fandom.com
- Slay the Spire Wiki (wiki.gg): https://slaythespire.wiki.gg
- Balatro Wiki: https://balatrowiki.org
- Balatro Wikipedia: https://en.m.wikipedia.org/wiki/Balatro
- Balatro Scoring Guide: https://dood.gg/en/balatro/guides/scoring-guide
- Card Crawl Steam: https://store.steampowered.com/app/745000/Card_Crawl/
- Card Crawl Google Play listing
- Ring of Pain Steam: https://store.steampowered.com/app/1107820/Ring_of_Pain/
- General web research via multiple search engines

---

*Document generated: June 2026 | For internal development use*
