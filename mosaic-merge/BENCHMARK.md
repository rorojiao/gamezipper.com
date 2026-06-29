# Mosaic Tile Merge — Competitive Benchmark Analysis

**Game:** Mosaic Tile Merge (`mosaic-merge`)
**Category:** Puzzle / Merge-Evolution
**Format:** Web-first (HTML5), playable on Poki / CrazyGames / direct
**Concept:** 2048 meets jigsaw — merge mosaic tiles to evolve patterns into completed images

**Last updated:** June 2026

---

## 1. Executive Summary

Mosaic Tile Merge enters a crowded but *growing* market. The merge-puzzle genre has proven to be one of the most durable and monetizable categories in casual gaming — mobile merge titles alone generate **hundreds of millions in annual revenue**, and the original **2048** has been played billions of times across web and mobile since 2014. The opportunity for `mosaic-merge` is to occupy a **differentiated niche** between two proven formulas:

| Axis | 2048 / Tile-merge | Merge Mansion / Merge Dragons | Mosaic Tile Merge |
|---|---|---|---|
| Core loop | Swipe to combine numbers | Drag-to-merge identical items | Merge tiles to reveal/complete mosaic art |
| Session length | 2–10 min | 5–30 min | 3–15 min |
| Visual payoff | Numbers double | Item evolves | Hidden image is revealed |
| Depth | Shallow (score chase) | Deep (meta, story, collection) | Medium (art collection + puzzle) |

**Verdict:** The "reveal a picture" hook is underexploited in the merge space. This is the key differentiator to lean into.

---

## 2. Market Context — Merge & Tile Puzzle Genre

### 2.1 Mobile Gaming Market (The Bigger Picture)
- Global mobile game IAP revenue: **$85.4B in 2025** (Sensor Tower), +6% YoY from 2024
- Global game downloads: **52B in 2025** (Sensor Tower)
- Mobile gaming represents the largest gaming platform by both revenue and downloads
- Puzzle is consistently a **top-3 genre** by download volume on both iOS and Google Play
- Source: Sensor Tower 2025–2026 market reports

### 2.2 Web Game Portals — The Distribution Channel for Mosaic Merge
Web game portals are the primary distribution channel for `mosaic-merge` given its HTML5 web format.

| Platform | Monthly Active Users | Game Count | Revenue Model | Key Notes |
|---|---|---|---|---|
| **Poki** | 50M+ MAU (est. global) | 20,000+ | Rev-share with developers | Industry leader for web games; HTML5 instant-play; strong in puzzle/casual |
| **CrazyGames** | 10M+ MAU (2021 baseline, grown since) | 4,000+ | Rev-share with developers | Founded 2014 by Tomas & Raf Mertens; fast-growing; supports Unity WebGL + HTML5 |
| **Direct web** | varies | — | Ads, sponsorship | gamezipper.com own traffic |

**Takeaway:** Poki and CrazyGames together represent **60M+ monthly players** in the target audience. Getting featured on either platform is the fastest path to scale. Both platforms favor games with: instant load, simple controls, high replayability, and session lengths of 3–15 minutes.

---

## 3. Direct Competitor Deep Dives

### 3.1 2048 (The Genre Originator)

| Metric | Detail |
|---|---|
| **Creator** | Gabriele Cirulli (Italy), March 2014 |
| **Origin** | Open-sourced on GitHub; based on *1024* and *Threes!* |
| **Mobile (Ketchapp version)** | Millions of downloads on iOS/Android; Ketchapp acquired by **Ubisoft in 2016** |
| **Web (original)** | Billions of plays estimated since launch (no exact figure published; widely cited as one of the most-played web games ever) |
| **Player skill ceiling** | Only **~1% of players reach the 2048 tile**; **~0.01% reach 4096** (per community stats) |
| **Monetization** | Original: free/ad-free (MIT license). Ketchapp/mobile: interstitial + rewarded video ads |
| **Mechanics** | 4×4 grid; swipe to move all tiles; identical adjacent tiles merge into one with doubled value; new tile (2 or 4) spawns each move; game over when no moves possible |

**What to copy:**
- One-action gameplay (swipe) — frictionless onboarding
- Exponential progression curve (every merge feels meaningful)
- Game-over clarity — you always know when you're done
- Score persistence (best score tracked)

**What to avoid:**
- No visual progression beyond numbers — players burn out after reaching 2048
- No meta-game, no collection, no reason to return after "beating" it
- No monetization in original — lost revenue

**Relevance to Mosaic Merge:** 2048 proves the merge mechanic is compelling at scale. Mosaic Merge should adopt the swipe/merge core but add the visual payoff 2048 lacks.

---

### 3.2 Merge Dragons! (Zynga / Gram Games)

| Metric | Detail |
|---|---|
| **Developer** | Gram Games (acquired by Zynga, 2018) |
| **Platform** | iOS, Android (mobile-first) |
| **Content volume** | **500+ mergeable items**, **600+ quests**, **140+ levels**, **17 dragon breeds** with **8 growth stages** |
| **Status** | Actively updated as of June 2026 (v13.8.x) — long-running live-ops |
| **Mechanics** | Drag-to-merge 3 identical items → evolves to next tier; camp-building meta; level-based puzzles; dragon collection |
| **Monetization** | IAP (gems, energy, bundles), rewarded video ads, energy/time-gating |

**What to copy:**
- **Collection depth** — 500+ items creates endless content goals
- **Visual evolution** — every merge has a satisfying visual transformation
- **Two modes**: puzzle levels (structured) + open camp (sandbox) — extends retention
- **Hidden levels and secrets** — rewards exploration and discovery

**What to avoid:**
- **Energy/time-gating** — frustrates casual players (though it drives monetization for whales)
- **Bundle bloat** — 280MB+ app size; web games can't afford this
- **Complex tutorial** — Merge Dragons has a long onboarding; web players bounce

**Relevance to Mosaic Merge:** Merge Dragons proves the merge-evolution model sustains multi-year live-ops. The "art collection" angle in Mosaic Merge can serve the same retention function as dragon collection.

---

### 3.3 Merge Mansion (Metacore Games Oy)

| Metric | Detail |
|---|---|
| **Developer** | Metacore Games Oy (Finland) |
| **Platform** | iOS, Android |
| **Status** | Actively updated as of June 2026 (v26.05.x) — extremely long-running |
| **Mechanics** | 2-to-1 merge (simpler than 3-to-1); merge items to produce tools → complete tasks → progress story and renovate mansion |
| **Core appeal** | Resource management in limited space; "organizing" satisfaction; narrative-driven (mystery story) |
| **Monetization** | IAP (gems, energy), rewarded video, energy-gating |
| **Marketing** | Viral "Hide and Seek" ad campaign featuring Kathy Bates — massive UA success |

**What to copy:**
- **Story integration** — merges serve a narrative purpose, not just score
- **Simple 2-to-1 merge** — lower cognitive load than 3-to-1, better for casual/mobile web
- **Visual goal** — renovating the mansion gives players a tangible, visual reason to keep merging

**What to avoid:**
- **Slow early game** — Merge Mansion gates content heavily early on
- **Energy systems** — limits sessions, bad for web platforms where you want long, ad-supported sessions

**Relevance to Mosaic Merge:** The "merge to reveal/renovate" loop maps directly to "merge to reveal mosaic art." Same psychological driver.

---

### 3.4 Dice Puzzle / Dice Merge (CrazyGames)

| Metric | Detail |
|---|---|
| **Platform** | CrazyGames (web) |
| **Mechanics** | Place numbered cubes on a board; merge 3+ adjacent cubes with same number horizontally/vertically; value increases; uses a "storage" mechanic for cubes |
| **Format** | HTML5/Unity WebGL, instant play on CrazyGames |
| **Audience** | Direct overlap with Mosaic Merge's target player |

**What to copy:**
- **Placement-based merge** (not swipe-based) — adds strategic layer vs. pure luck
- **Storage/hand mechanic** — gives player agency over what to place and when
- **CrazyGames-native design** — built for the platform's audience and monetization

**What to avoid:**
- Number-only progression (same problem as 2048 — no visual payoff)

**Relevance to Mosaic Merge:** Dice Merge is the closest mechanical sibling on the target platform. Mosaic Merge should differentiate through visual payoff (art reveal) and a more satisfying progression system.

---

### 3.5 Hexa Mosaic – Block Puzzle

| Metric | Detail |
|---|---|
| **Platform** | Android |
| **Mechanics** | Hexagonal block puzzle (Tetris-like), not a true merge game despite "Mosaic" name |
| **Note** | Uses "mosaic" branding but is a block-placement puzzle, not merge-evolution |

**Takeaway:** The "mosaic" keyword has brand space available for a *true* merge game. SEO/ASO opportunity.

---

## 4. Feature Benchmark Matrix

| Feature | 2048 | Merge Dragons | Merge Mansion | Dice Merge | **Mosaic Merge (Target)** |
|---|---|---|---|---|---|
| Merge mechanic | Swipe (2→1) | Drag (3→1) | Drag (2→1) | Place (3→1) | **Swipe/tap (2→1)** |
| Visual payoff | Numbers only | Item evolves | Item + room evolves | Numbers only | **Art/image revealed** |
| Meta-game | Best score | Camp + dragons | Mansion renovation | Score | **Art gallery collection** |
| Story/narrative | None | Light fantasy | Mystery story | None | **Theme per collection** |
| Session length | 2–10 min | 5–30 min | 5–20 min | 3–10 min | **3–15 min** |
| Tutorial time | 0 sec (self-evident) | 2–3 min | 1–2 min | 30 sec | **< 15 sec** |
| Energy system | No | Yes | Yes | No | **No** |
| IAP monetization | No (original) | Heavy | Heavy | Light (web ads) | **Light (cosmetics, not pay-to-win)** |
| Ad monetization | Interstitial | Rewarded video | Rewarded video | Interstitial + rewarded | **Rewarded video + interstitial** |
| Collection system | No | 500+ items | Tools + mansion | No | **Unlockable art sets** |
| Daily challenges | No | Yes | Yes | No | **Yes — daily mosaic** |
| Social/leaderboards | Community only | Cloud save | Cloud save | Platform leaderboard | **Poki/CrazyGames leaderboard** |

---

## 5. Monetization Analysis & Recommendations

### 5.1 What Competitors Do

| Model | Used By | Typical Revenue | Fit for Web |
|---|---|---|---|
| **Rewarded video ads** (voluntary, for boost/undo/extra) | Merge Dragons, Merge Mansion, Dice Merge | Primary revenue driver for casual web | ✅ Best for Mosaic Merge |
| **Interstitial ads** (between levels/sessions) | 2048 clones, Dice Merge | Secondary; volume-based | ✅ Use sparingly |
| **IAP — currency/gems** | Merge Dragons, Merge Mansion | Highest ARPU; drives whale revenue | ❌ Low ARPU on web portals |
| **IAP — cosmetics/skins** | Rare in merge genre | Low revenue but high engagement | ✅ Differentiator if done well |
| **Energy/time-gate with IAP bypass** | Merge Dragons, Merge Mansion | Strong monetization but hurts retention | ❌ Avoid for web |

### 5.2 Recommended Monetization for Mosaic Merge

1. **Rewarded video** for: undo last move, reveal hint, unlock daily bonus art piece — **primary revenue source**
2. **Interstitial ads** every 2–3 completed mosaics — **secondary revenue**
3. **Cosmetic IAP**: tile themes (seasonal art packs), background skins, particle effects — **low-friction, high-margin**
4. **No energy system** — web players expect unlimited play; monetize through ads, not gates
5. **Poki/CrazyGames rev-share** — align with platform economics rather than fighting them

### 5.3 Revenue Expectations (Web Game)
Based on CrazyGames/Poki developer revenue benchmarks:
- **Average web puzzle game**: $0.50–$3.00 RPM (revenue per 1,000 sessions)
- **Top-performing web puzzle game**: $5–$15+ RPM
- **Target for Mosaic Merge**: $2–$5 RPM with rewarded video + interstitial mix
- At 100K monthly sessions (modest): **$200–$500/month**
- At 1M monthly sessions (Poki feature): **$2,000–$5,000/month**

---

## 6. What to Copy (Steal These)

1. **One-action core loop** (2048) — swipe or tap-to-place; zero-friction entry
2. **Visual evolution on every merge** (Merge Dragons) — tiles should transform, not just change numbers
3. **Collection meta-game** (Merge Dragons' 500+ items → Mosaic Merge's art gallery) — gives long-term reason to play
4. **Story/theme framing** (Merge Mansion) — each art collection tells a mini-narrative
5. **Daily challenge** (industry standard) — drives D1/D7/D30 retention
6. **Platform-native leaderboard** (Dice Merge on CrazyGames) — competitive hook without building your own backend
7. **Best-score persistence** (2048) — always show personal best; cheap retention lever

---

## 7. What to Avoid (Don't Do These)

1. **Energy/time-gating** (Merge Dragons, Merge Mansion) — kills web session length and platform algorithm ranking
2. **Number-only progression** (2048, Dice Merge) — no visual payoff = high churn after initial novelty
3. **Long tutorials** (Merge Dragons' 2–3 min onboarding) — web players bounce in <30 seconds
4. **Large app/game size** (Merge Dragons mobile = 280MB+) — web games must load in <5 seconds
5. **Complex meta-systems** — Merge Dragons' camp management is too deep for a web-first audience; keep meta simple (gallery unlock)
6. **Pay-to-win IAP** — destroys platform trust and review scores on Poki/CrazyGames
7. **5×5 or larger grids** for core play — 4×4 is proven optimal for merge games; larger grids feel chaotic and random

---

## 8. Gap Analysis — Where Mosaic Merge Wins

| Gap in Market | How Mosaic Merge Fills It |
|---|---|
| **2048 has no visual payoff** | Mosaic tiles merge to reveal completed art/images |
| **Merge games have no art/collection angle** | Mosaic Merge = merge game + art gallery |
| **Web merge games are mostly number/dice-based** | Mosaic Merge introduces visual beauty to the web merge space |
| **"Mosaic" keyword is underused in merge games** | SEO/ASO and discoverability advantage |
| **Merge games are complex (camps, dragons, energy)** | Mosaic Merge = simple core, deep collection — right-sized for web |

---

## 9. Key Metrics to Track (Launch & Beyond)

| Metric | Target (Month 1) | Target (Month 6) | Benchmark Source |
|---|---|---|---|
| Sessions/month (Poki + CG + direct) | 100K | 1M+ | Poki avg. puzzle game |
| Avg session length | 4+ min | 6+ min | 2048 web avg: 3–5 min |
| Sessions per user | 1.5 | 3+ | Merge casual web avg |
| D1 retention | 25% | 35%+ | Web casual avg: 20–25% |
| D7 retention | 10% | 18%+ | Web casual avg: 8–12% |
| RPM | $1.00 | $3.00+ | CrazyGames reported range |
| Time to first interaction | < 5 sec | < 3 sec | Poki best practice |

---

## 10. Sources & Methodology

- **Sensor Tower** — 2025–2026 global mobile game market reports ($85.4B IAP, 52B downloads)
- **CrazyGames** — platform data via public pages, SegmentFault industry article (10M+ MAU baseline)
- **Poki** — platform marketing materials, industry coverage (50M+ MAU, 20,000+ games)
- **Ketchapp / Ubisoft** — 2048 mobile acquisition data (Baidu Baike, industry coverage)
- **Gabriele Cirulli** — 2048 original, GitHub (open-source since March 2014)
- **Zynga / Gram Games** — Merge Dragons! official pages (500+ items, 600+ quests, 140+ levels)
- **Metacore Games Oy** — Merge Mansion app store data (v26.x active in 2026)
- **CrazyGames game pages** — Dice Puzzle / Dice Merge mechanics
- Community-sourced stats for 2048 player completion rates (~1% reach 2048)

> **Note:** Mobile-specific revenue figures (individual game revenue) are not publicly disclosed by publishers. Estimates are based on Sensor Tower rankings, app store data, and industry analysis. Web platform RPMs are based on developer community reports and may vary significantly by game quality and audience geography.

---

*BENCHMARK.md — Competitive analysis for Mosaic Tile Merge (`mosaic-merge`). Generated June 2026.*
