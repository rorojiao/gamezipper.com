# BENCHMARK — Hotel Rush

## Competitor Analysis

### 1. My Perfect Hotel (SayGames Ltd)
- **Downloads**: 100M+ (Google Play)
- **Chart position**: Top-10 casual, 18+ months (2023-2025)
- **Core loop**: Walk to reception → assign guest → walk to room → guest sleeps → clean room → collect cash → build floor → hire staff
- **Systems**: Floor expansion, staff automation (receptionist, maid, builder), VIP guests, star milestones, idle income, daily rewards
- **Monetization**: Rewarded ads for cash boosts, IAP for premium currency
- **Art style**: Bright 3D isometric, cute characters, satisfying particle effects on cash collection
- **Music**: Upbeat casual lobby music, cash-register SFX, level-up fanfare
- **Retention hooks**: Floor 2, 3, 4... unlocks; staff upgrades; "just one more floor" compulsion

### 2. Idle Hotel Empire / Hotel Empire Tycoon
- **Downloads**: 50M+
- **Focus**: Idle/tycoon — more automation, less active management
- **Systems**: Auto-checkin, room upgrades, theme hotels (business, resort, casino)

### 3. Papa's Freezeria (Flipline, on GZ)
- **Web time-management reference**: Order ticket → build station → mix → serve → tip
- **Proves web demand for time-management on GZ**

## Required System Parity (Hotel Rush must implement)
- [x] Guest queue with patience timers (heart/emoji above waiting guests)
- [x] Room lifecycle: empty → occupied (sleeping zZz) → dirty (trash icon) → cleaning (broom spin) → empty
- [x] Tap-to-assign guest to nearest empty room (or tap room then guest)
- [x] Cash economy: earn on checkout, spend on upgrades
- [x] Floor expansion: buy Floor 2, 3, 4, 5 (each adds N rooms)
- [x] Staff system: Receptionist (auto-assigns guests), Maid (auto-cleans), each hireable + upgradeable
- [x] VIP guests: gold-crowned, pay 3x, but 50% less patient
- [x] Idle/offline income: on return, calculate capped earnings
- [x] Star rating: 3-star per level based on guests served without losing any
- [x] Level milestones: reach guest-served thresholds to level up hotel
- [x] Tutorial overlay for first-time players (skippable)
- [x] Sound: check-in ding, cash register cha-ching, cleaning swoosh, level-up fanfare, guest-angry grunt, VIP trumpet
- [x] BGM: upbeat procedural Web Audio (casual lobby loop)
- [x] localStorage save with version field
- [x] Settings: mute BGM, mute SFX, reset progress

## Scoring System
- Base checkout: $10 per guest
- VIP checkout: $30 per guest
- Patience bonus: +$5 if guest served within 50% of patience timer
- Clean bonus: +$2 if room cleaned within 3s of guest leaving
- Daily double: every 10th guest pays 2x
- Floor multiplier: each floor adds +$1 to all checkouts

## Difficulty Curve (30 levels)
- L1-5: 1 floor, 3 rooms, slow guests, no VIP
- L6-10: 2 floors unlock, 6 rooms total, normal patience
- L11-15: VIP guests appear, 3rd floor unlock
- L16-20: Shorter patience, more guests per wave
- L21-25: 4th floor, VIP frequency up
- L26-30: 5th floor, chaos mode — high guest throughput required

## Visual Style
- Isometric/top-down hotel cross-section (like My Perfect Hotel)
- Each floor = horizontal strip with room cells
- Lobby at bottom (entrance + reception desk)
- Cute simple character sprites (circles with faces, drawn in Canvas)
- Gold coins fly to counter on checkout (particle animation)
- Sparkle on VIP guest spawn
- Gradient background (warm hotel lobby palette: cream/gold/navy)
- Floor expansion animation (floor slides in from top)
