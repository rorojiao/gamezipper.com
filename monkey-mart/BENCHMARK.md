# Monkey Mart — Competitive Benchmark Report

> Target: Monkey Mart-style supermarket management idle game for GameZipper
> Reference: TinyDobbins original (Poki) + browser/platform competitors
> Format: English
> Updated: 2026-05-31

---

## Executive Summary

Monkey Mart is a top-5 Poki idle/management hybrid that has generated 3.4M likes and 3.76M votes. It combines supermarket simulation with character-driven idle progression, featuring 6 unlockable mart regions, 4 worker types, multi-step product processing chains, and worker fatigue mechanics. The genre sits at the intersection of idle tycoon and arcade management.

**Key Findings:**
- Browser idle management games are a proven, high-retention genre on Poki and CrazyGames
- Product processing chains (raw crop → processed goods) add significant depth vs. pure tycoon/clicker games
- Worker management with fatigue/sleep creates emergent micro-challenge loops
- 6-region progression structure provides clear long-term goals
- Mobile ports (iOS/Android) have validated monetization through ads + IAP
- Canvas 2D top-down is the recommended rendering approach for browser parity

---

## 1. Original Monkey Mart Analysis

### 1.1 Game Overview

| Attribute | Data |
|-----------|------|
| **Developer** | TinyDobbins |
| **Publisher/Distribution** | TinyBuild? (TinyDobbins is the dev studio, published via Poki + native apps) |
| **Platform** | Browser (Poki exclusive), iOS App Store, Google Play Store |
| **Genre** | Idle + Supermarket Management Simulation |
| **Rating** | 4.6 / 5 (3,765,096 votes on Poki) |
| **Likes** | 3.4M |
| **Dislikes** | 401.2K |
| **Release** | Active development ongoing; iOS app released |
| **URL (Poki)** | https://poki.com/en/g/monkey-mart |
| **iOS App** | https://apps.apple.com/us/app/monkey-mart/id6480208265 |
| **Android App** | https://play.google.com/store/apps/details?id=com.tinydobbin |

### 1.2 Core Gameplay Mechanics

**Player Control Loop:**
- Guide a monkey character with WASD / arrow keys (desktop) or touch joystick (mobile)
- Auto-action when standing near an object: no explicit action button required
- Proximity-based job triggering: harvest crops, stock shelves, operate register

**Core Jobs:**
1. **Harvest crops** — stand by crop plots to collect raw produce
2. **Stock shelves** — carry produce from source to shelf to restock
3. **Operate cash register** — stand at till to collect payment from queued customers
4. **Wake workers** — tap/click sleeping workers to get them back on task
5. **Clean messes** — rowdy monkeys occasionally knock items off shelves

**Customer AI:**
- Customers enter the mart, grab items from shelves, and queue at the register
- If shelves are full, flow is smooth; if empty, queues back up
- Queues overflow if not managed → lost sales potential

**Worker AI:**
- Hire monkey workers: Cashiers, Assistants, Farmers, Chefs
- Workers auto-assign to relevant stations
- Workers fatigue over time and fall asleep mid-task
- Player must wake them or take over manually
- Unchecked fatigue → shelf empties + queue overflow

### 1.3 Game Progression Flow

**Phase 1 — Startup:**
- One shelf, one crop (bananas), simple customer flow
- Player does all tasks manually
- Learn auto-action mechanic naturally

**Phase 2 — Expansion:**
- New crop types unlock (corn, wheat, coffee beans, cocoa beans)
- Processing appliances unlock (yoghurt machine, popcorn maker, oven, coffee roaster, chocolate press)
- Customer frequency increases → multitasking pressure rises

**Phase 3 — Worker Hiring:**
- Hire monkey workers to automate tasks
- Workers start falling asleep → manage or replace
- Multiple aisles open simultaneously

**Phase 4 — Multi-Mart Progression:**
- 6 marts total, each with distinct theme and new products
- Mart icons: Banana → Chocolate bar → Chocolate muffin → Fish → Apple → Coconut drink
- Must fully unlock current mart before accessing next
- Each mart adds new products, layouts, and challenges

**Phase 5 — Optimization:**
- Upgrade systems (Stamina, Stack, Speed)
- Accessory customization (hats for monkey)
- Daily quests for diamond rewards

### 1.4 Product Processing Chains

| Raw Material | Direct Sale | Processed Output | Further Processed |
|---|---|---|---|
| Bananas | Yes | Yogurt | — |
| Corn | Yes | Popcorn | Eggs (from fed chickens), Milk (from fed cows) |
| Wheat | Flour | Baked goods | — |
| Coffee beans | Yes | Ground coffee | Brewed coffee |
| Cocoa beans | Yes | Chocolate | — |

### 1.5 Upgrade System

**3 upgrade types, each with max level 4:**

| Upgrade | Effect |
|---------|--------|
| **Stamina** | Workers fall asleep less often; appliances break down less |
| **Stack** | Carry more items per trip; larger appliance output storage |
| **Speed** | Workers move faster; processing time reduced |

### 1.6 Monetization Model

- **Platform:** Freemium with ads + optional IAP
- **Ad Format:** Rewarded video ads (diamonds, continue after game over)
- **IAP:** Remove ads, buy diamonds, accessory packs
- **Soft Currency:** Coins (earned from sales)
- **Premium Currency:** Diamonds (earned via daily quests, spent on accessories + coin conversion)

---

## 2. Competitor Analysis

### Competitor 1: My Perfect Hotel (SayGames)

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki), iOS, Android |
| **URL** | https://poki.com/en/g/my-perfect-hotel |
| **Developer** | SayGames |
| **Rating** | 4.5 / 5 (1,619,972 votes on Poki) |
| **Likes** | 1.4M |
| **Dislikes** | 199.1K |
| **Genre** | Idle + Hotel Management |
| **Content** | Unlimited guest turnover; room upgrades; employee hiring |

**Core Mechanics:**
- Hotel room management: check in guests, clean rooms, collect payments and tips
- Ensure bathrooms are stocked (toilet paper)
- Upgrade hotel rooms, expand hotel size, hire employees
- Similar idle progression to Monkey Mart but vertical (hotel floors/rooms vs. mart aisles)

**Advantages:**
- Cleaner, more focused loop (one building type vs. complex multi-product mart)
- Proven SayGames idle framework
- Strong visual feedback on guest satisfaction
- Lower learning curve

**Disadvantages:**
- Less product/process depth than Monkey Mart
- No "mess" or "worker fatigue" secondary mechanics
- Less variety in upgrade paths
- All guests are identical, less personality than monkey workers

---

### Competitor 2: Idle Supermarket Tycoon (Codigames)

| Attribute | Data |
|-----------|------|
| **Platform** | iOS, Android (mobile-first) |
| **URL** | https://apps.apple.com/app/idle-supermarket-tycoon/id1341491515 |
| **Developer** | Codigames |
| **Genre** | Idle/Tycoon — pure management |
| **Content** | Multiple cities (Beverly Hills, Paris, London, Tokyo, Dubai); express lanes; self-checkout; cafe departments |
| **Downloads** | 1M+ on App Store |

**Core Mechanics:**
- Pure idle/tycoon: set up departments, hire managers, earn offline
- Each city has different products and challenges
- Prestige/reset mechanic with global coin multiplier
- Upgrades: shelf quantity, product pricing, store layout, cosmetics

**Advantages:**
- True idle — works 24/7 without player input
- Prestige system provides long-term replayability
- Multi-city progression gives massive content depth
- Proven monetization through IAP and ad watching

**Disadvantages:**
- No player-controlled character — fully automated
- No "mess" or worker management
- 3D cartoon isometric style requires more rendering resources
- No browser version — mobile-only

---

### Competitor 3: Cow Bay

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki) |
| **URL** | https://poki.com/en/g/cow-bay |
| **Genre** | Idle + Farm/Dairy Management |
| **Rating** | Similar to Monkey Mart (top Poki title) |

**Core Mechanics:**
- Manage a cow farm/dairy
- Milk cows, process dairy products, sell to customers
- Hire farm workers
- Expand farm and unlock new product types
- Similar to Monkey Mart Mart 1 (Banana) but with dairy focus

**Advantages:**
- Proven browser-based idle farm management on Poki
- Clear product chain (cow → milk → processed dairy)
- Cute animal theme resonates with casual audience
- Worker fatigue similar to Monkey Mart

**Disadvantages:**
- Narrower product variety than Monkey Mart
- Less upgrade depth
- No multi-region progression (single farm)
- Less known than Monkey Mart on Poki

---

### Competitor 4: Bunny Bistro

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki) |
| **URL** | https://poki.com/en/g/bunny-bistro |
| **Genre** | Idle + Restaurant Management |

**Core Mechanics:**
- Manage a rabbit-themed bistro/restaurant
- Prepare food dishes, serve customers, earn tips
- Hire animal workers (rabbits)
- Food processing chain (raw ingredients → cooked meals)
- Upgrade kitchen equipment and seating

**Advantages:**
- Food prep theme similar to Monkey Mart's processing chains
- Cute animal characters (consistent with Monkey Mart's appeal)
- Browser-playable, free, no download required
- Growing popularity on Poki

**Disadvantages:**
- Less product depth (single food type vs. multi-chain mart)
- No worker fatigue mechanic
- No mess/cleanup secondary mechanic
- Smaller scale than Monkey Mart

---

### Competitor 5: Papa's Freezeria (Flipline Studios)

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki, Coolmath), iOS, Android |
| **URL** | https://poki.com/en/g/papas-freezeria |
| **Developer** | Flipline Studios |
| **Rating** | 4.5 / 5 on Poki |
| **Genre** | Time-management + Restaurant |
| **Content** | 15+ restaurant locations; hundreds of order combinations |

**Core Mechanics:**
- Take ice cream/frozen dessert orders from customers
- Build orders on a multi-step station system (build → serve → pay)
- Customer patience meter (time pressure)
- Tips used for upgrades and customizations
- No idle/auto elements — fully active time-management

**Advantages:**
- Extremely polished time-management loop
- Hundreds of order combinations for high replayability
- Strong franchise (multiple Papa's games)
- Proven retention (players return for new toppings/items)

**Disadvantages:**
- No idle/automation — 100% active play
- No worker hiring or management
- No product processing chain (single station orders)
- No character movement — station-based interface
- Different genre entirely (time-management vs. idle tycoon)

---

### Competitor 6: Idle Mining Empire (Better Games)

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki), iOS, Android |
| **URL** | https://poki.com/en/g/idle-mining-empire |
| **Genre** | Idle + Mining Tycoon |
| **Rating** | 4.4 / 5 on Poki |

**Core Mechanics:**
- Mine minerals, process ore, sell for profit
- Hire miners and managers
- Expand mine shafts deeper
- Upgrade equipment and processing facilities
- Offline earnings (true idle)

**Advantages:**
- Deep idle loop with meaningful offline progression
- Multi-step processing (raw ore → refined minerals)
- Hire-and-forget manager system (true idle)
- Multi-floor/layer progression

**Disadvantages:**
- No character movement or player control of individual tasks
- No customer AI or queue management
- Different theme (mining vs. supermarket)
- No worker fatigue mechanic

---

### Competitor 7: Mall Tycoon

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki) |
| **URL** | https://poki.com/en/g/mall-tycoon |
| **Genre** | Idle + Mall Management |

**Core Mechanics:**
- Manage a shopping mall with multiple stores
- Earn rent from stores, upgrade mall facilities
- Serve shoppers, manage parking, expand mall size
- Hire staff to run individual stores

**Advantages:**
- Multi-store management gives scale similar to Monkey Mart
- Mall theme is broadly relatable
- Idle elements with active management mix
- Expansion/progression loop mirrors mart unlocking

**Disadvantages:**
- Less product/process depth than Monkey Mart
- No worker fatigue mechanic
- Simpler processing chains
- Less polished than Monkey Mart's visual style

---

### Competitor 8: Idle Success

| Attribute | Data |
|-----------|------|
| **Platform** | Browser (Poki) |
| **URL** | https://poki.com/en/g/idle-success |
| **Genre** | Idle + Restaurant/Food Management |
| **Rating** | 4.3 / 5 on Poki |

**Core Mechanics:**
- Manage a food establishment
- Prepare and serve food to customers
- Upgrade kitchen, hire workers
- Expand seating and menu items
- Offline idle earnings

**Advantages:**
- Idle loop with active management elements
- Food processing chain (ingredients → cooked dishes)
- Worker hiring system
- Daily rewards and quest system (similar to Monkey Mart)

**Disadvantages:**
- Less character/personality than Monkey Mart
- Fewer upgrade categories
- Smaller content scope
- No worker fatigue or mess mechanics

---

## 3. Competitive Summary Table

| Competitor | Platform | Rating | Genre | Idle? | Worker Mgmt | Product Chain | Multi-region | Monetization |
|---|---|---|---|---|---|---|---|---|
| Monkey Mart (TinyDobbins) | Browser/iOS/Android | 4.6★ | Supermarket Idle | Hybrid | Yes (fatigue) | Deep (5 chains) | 6 marts | Ads + IAP |
| My Perfect Hotel (SayGames) | Browser/iOS/Android | 4.5★ | Hotel Idle | Hybrid | Yes | Simple | No | Ads + IAP |
| Idle Supermarket Tycoon | Mobile | N/A | Supermarket Tycoon | Full idle | No | Medium | Multiple cities | Ads + IAP |
| Cow Bay | Browser | N/A | Farm Dairy | Hybrid | Yes | Medium | No | Ads |
| Bunny Bistro | Browser | N/A | Restaurant | Hybrid | Yes | Medium | No | Ads |
| Papa's Freezeria | Browser/Mobile | 4.5★ | Time-mgmt | No | No | Station-based | No | Ads + IAP |
| Idle Mining Empire | Browser/Mobile | 4.4★ | Mining Idle | Full idle | Managers | Deep | Multi-floor | Ads + IAP |
| Mall Tycoon | Browser | N/A | Mall Idle | Hybrid | Simple | Simple | No | Ads |
| Idle Success | Browser | 4.3★ | Food Idle | Hybrid | Yes | Medium | No | Ads |

---

## 4. Differentiation Opportunities

### 4.1 Features Missing from Most Competitors

**Star Rating / Performance Scoring:**
- Most competitors lack a per-session star rating (1-3 stars based on performance)
- Monkey Mart has no star system — pure progression
- Opportunity: Add star rating at end of each day/session to encourage optimization
- Drives replayability and mastery motivation

**Tutorial System:**
- Monkey Mart teaches through doing but lacks structured tutorial UI
- Many competitors have no tutorial at all
- Opportunity: Add a guided tutorial with highlighted UI elements and tooltips

**Achievement System:**
- Monkey Mart has daily quests but no persistent achievement badges
- Opportunity: Add Steam-style achievements for milestones (100 customers served, 10 of each product sold, etc.)

**Offline Progression:**
- Monkey Mart is browser-based with no true offline earning
- Most browser idle games lack offline income
- Opportunity: Allow limited offline earnings (e.g., 30 min of worker income while away)

**Seasonal Events:**
- None of the primary competitors have seasonal content
- Opportunity: Add limited-time events (holiday themes, special products) for retention spikes

### 4.2 Improved Areas Over Monkey Mart

| Area | Monkey Mart | Improvement Opportunity |
|------|-------------|----------------------|
| **Performance feedback** | No score/stars per session | Add 1-3 star rating based on customer satisfaction |
| **Visual variety** | 6 mart layouts, repeating products | Add seasonal visual themes |
| **Tutorial** | Inferred through gameplay | Structured multi-step tutorial with tooltips |
| **Save system** | localStorage | Add cloud save + guest play option |
| **Social features** | None | Add friend leaderboards |
| **Event system** | Daily quests only | Add limited-time seasonal events |
| **Product variety** | 5 raw + 5 processed | Add more product types (drinks, snacks, frozen foods) |

### 4.3 Mobile-First Opportunities

- **Touch joystick** — Monkey Mart's Poki version has basic touch; dedicated mobile app should have premium touch controls
- **Haptic feedback** — Vibration on harvest, customer arrival, register cha-ching
- **Push notifications** — Remind player their workers need attention
- **Quick actions** — One-tap resume to last task
- **Orientation lock** — Portrait mode option for mobile play

---

## 5. Technical Implementation Recommendations

### 5.1 Recommended Rendering Approach

**Canvas 2D Top-Down (recommended):**

Rationale:
- Monkey Mart itself uses a top-down 2D perspective
- Canvas 2D is universally supported, no WebGL compatibility issues
- Sprite-based rendering is lighter than WebGL for this art style
- Easier cross-platform deployment (web, mobile web, desktop)
- Phaser.js or native Canvas 2D API both suitable

**Alternative: WebGL with Phaser.js:**
- Better for particle effects, smooth animations
- Required if adding complex visual effects (glow, blur)
- Recommended if targeting 60fps with many on-screen entities

### 5.2 Game Loop Design

```
Game Loop (60fps target):
├── Input Processing (keyboard, touch, mouse)
├── Update Phase:
│   ├── Player movement + action proximity check
│   ├── Customer AI (spawn, pathfind, queue, purchase)
│   ├── Worker AI (assign, fatigue, sleep, wake)
│   ├── Product processing (harvest → stock → depleted)
│   ├── Economy (coins earned, upgrade costs)
│   └── Timer/Progression (day cycle, unlock thresholds)
└── Render Phase:
    ├── Background tile layer
    ├── Shelves, appliances, stations
    ├── Characters (player, workers, customers)
    ├── UI overlay (coins, upgrades, quests)
    └── Particle effects (optional)
```

### 5.3 State Structure

```javascript
GameState = {
  player: { x, y, carrying, carryingCount },
  mart: { currentMart, unlockedMarts, unlockedAisles },
  products: { bananas, corn, wheat, coffee, cocoa },
  shelves: [{ productType, stock, maxStock }],
  appliances: [{ productType, processing, outputStock }],
  workers: [{ type, x, y, fatigue, task, isSleeping }],
  customers: [{ state, wantsProduct, queuePosition }],
  coins: number,
  diamonds: number,
  upgrades: { stamina: 0-4, stack: 0-4, speed: 0-4 },
  quests: [{ id, progress, completed, reward }],
  stats: { customersServed, totalEarned, daysPlayed }
}
```

### 5.4 AI Customer Behavior (FSM)

```
Customer States:
1. ENTERING → Walk into store
2. BROWSING → Move toward shelf with desired product
3. GRABBING → Take item from shelf (if in stock)
4. QUEUEING → Walk to register queue
5. PAYING → Wait at front of queue for player/service
6. LEAVING → Walk out of store
7. ANGRY (optional) → Leave without buying if wait too long
```

**Pathfinding:** Simple tile-based A* or direct vector movement toward target waypoint. No complex navigation mesh needed for single-screen layouts.

### 5.5 AI Worker Behavior

```
Worker States:
1. IDLE → No task assigned, wait for job
2. WORKING → Performing assigned task (harvest, stock, cashier)
3. FATIGUED → Progress bar filling (fatigue meter)
4. SLEEPING → Stopped working, needs wake-up
5. WALKING → Moving to task location
```

- Fatigue rate per level of Stamina upgrade
- Wake-up: player click/tap on sleeping worker
- Fallback: player can perform any worker task manually

### 5.6 Level / Progression System

**3 Mart Regions (simplified from original 6):**

| Mart | Products | Appliances | Customers |
|------|----------|-------------|-----------|
| **Mart 1: Fresh Produce** | Bananas, Apples | None (direct sale) | 10-20 |
| **Mart 2: Bakery & Dairy** | Wheat, Corn, Eggs, Milk | Flour, Popcorn, Yogurt | 20-40 |
| **Mart 3: Specialty** | Coffee, Cocoa, Chocolate | Coffee Roaster, Chocolate Press | 40-80 |

**Progression Triggers:**
- Coins earned threshold → unlock new aisle/shelf
- All shelves stocked in current section → unlock next section
- Total coins earned → unlock next mart

### 5.7 Recommended Tech Stack

| Component | Recommendation |
|-----------|---------------|
| **Engine** | Phaser 3 (Canvas 2D or WebGL renderer) |
| **Language** | TypeScript (compile to JS) |
| **Build** | Vite or esbuild |
| **Hosting** | Static files (S3/Cloudflare Pages/Vercel) |
| **Save** | localStorage (primary) + JSON export/import |
| **Audio** | Howler.js or native Web Audio API |
| **Mobile** | Responsive canvas scaling + touch joystick plugin |
| **Ads** | Poki SDK for browser; AdMob for mobile native |

### 5.8 Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60fps (desktop), 30fps minimum (mobile) |
| Load time | < 3 seconds on 4G |
| Memory | < 128MB RAM |
| Bundle size | < 2MB JS (excluding assets) |
| Assets | Lazy-load per mart/level |

---

## 6. Recommended Feature Set for GameZipper Version

### Must-Have (MVP)
1. Player monkey movement (WASD / touch joystick)
2. Auto-harvest and auto-stock on proximity
3. Customer AI (enter, browse, queue, pay, leave)
4. Register cash collection
5. 3 product chains (banana→yogurt, corn→popcorn, wheat→baked goods)
6. Worker hiring: Cashier, Farmer
7. Worker fatigue + wake-up mechanic
8. Shelf stocking system
9. 3 upgrade types (Stamina, Stack, Speed), max level 4
10. 3 mart regions with unlock progression
11. Coins + diamond currency
12. Daily quests (3 quests, diamond rewards)
13. localStorage save
14. Responsive canvas (desktop + mobile)
15. Tutorial overlay (3-4 steps)

### Nice-to-Have (Post-MVP)
1. Star rating per session
2. Achievements system
3. Seasonal events
4. Cloud save
5. Friend leaderboards
6. Offline earnings (30 min)
7. More worker types (Chef, Farmer)
8. Animal helpers (chickens, cows)
9. Accessory hats for monkey
10. Mess cleanup mechanic (knocked items)

---

## 7. Sources

- Monkey Mart Poki page: https://poki.com/en/g/monkey-mart
- My Perfect Hotel Poki page: https://poki.com/en/g/my-perfect-hotel
- Cat Pizza Poki page: https://poki.com/en/g/cat-pizza
- Cow Bay Poki page: https://poki.com/en/g/cow-bay
- Bunny Bistro Poki page: https://poki.com/en/g/bunny-bistro
- Idle Mining Empire Poki page: https://poki.com/en/g/idle-mining-empire
- Idle Success Poki page: https://poki.com/en/g/idle-success
- Mall Tycoon Poki page: https://poki.com/en/g/mall-tycoon
- Papa's Freezeria Poki page: https://poki.com/en/g/papas-freezeria
- TinyDobbins developer site: https://www.tinydobbins.com/
- Monkey Mart iOS App: https://apps.apple.com/us/app/monkey-mart/id6480208265
- Monkey Mart Google Play: https://play.google.com/store/apps/details?id=com.tinydobbin
