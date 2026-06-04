# GameZipper — Competitor Benchmark

**Date:** 2026-06-05
**Method:** Public web research + representative-page fetch (June 2026 snapshots)

---

## Competitors Profiled

| # | Site | Est. library size | Primary monetization | PWA / install | Multi-lang |
|---|---|---|---|---|---|
| 1 | **Poki** (poki.com) | ~5,000+ | Programmatic ads (Poki SDK) | No native, but "Poki App" exists | 30+ (auto by IP) |
| 2 | **CrazyGames** (crazygames.com) | ~4,000+ | Rewarded video + display | Yes (Android/iOS wrappers) | 15+ |
| 3 | **Y8** (y8.com) | ~10,000+ (incl. flash) | Ads + premium | No | 6 |
| 4 | Miniplay | ~2,000+ | Ads | No | 7 |
| 5 | GamePix | ~3,000+ | Ads (white-label) | Yes (white-label) | API-driven |
| 6 | Addicting Games | ~3,000+ | Ads | No | 1 |
| 7 | Coolmath Games | ~200+ curated | Ads + subscription | No | 1 (English only) |
| 8 | Armor Games | ~5,000+ | Ads | No | 1 |
| 9 | Itch.io web games | ~50,000+ indie | Tip jar / paid | No | 1 |
| 10 | Kizi | ~1,000+ | Ads | No | 1 |
| 11 | Friv | ~250 curated | Ads | No | 25+ |
| 12 | **GameZipper** (us) | **241** | Monetag + AdSense | Yes (manifest.json, theme switcher, install prompt) | 1 (English) |

---

## Dimension-by-Dimension Comparison

### 1. Homepage Information Architecture

| Feature | Poki | CrazyGames | Y8 | Coolmath | **GameZipper** |
|---|---|---|---|---|---|
| Top nav with categories | ✓ | ✓ | ✓ | ✓ | ✓ |
| Search bar | ✓ | ✓ | ✓ | ✓ | ✓ (`/` and `Ctrl+K` shortcut) |
| Category tabs | ✓ (popular genres) | ✓ | ✓ | ✓ (math, logic, strategy) | ✓ (puzzle, arcade, idle, card, simulation, word, casual) |
| Hot / New / Trending sections | ✓ | ✓ | ✓ | ✓ (Popular) | ✓ (Game of the Day, Trending, Continue) |
| Recently played | ✓ (Poki account) | ✓ (account) | ✓ (account) | ✗ | ✓ (localStorage, anonymous) |
| Device-adapted copy | ✓ | ✓ | ✓ | partial | ✓ ("Works on Chromebook, school & mobile" in hero) |
| Trust copy | ✓ (privacy, COPPA) | ✓ | ✓ | ✓ | ✓ (FAQ, kids-safe messaging) |
| First-screen CTA | "Play now" big tile | Big featured carousel | Featured carousels | Editor's pick | "Continue where you left off" + category tabs |
| Card density (per row) | 4–6 | 4–6 | 5 | 3 | 2–4 (responsive) |

**GameZipper advantage:** explicit Chromebook / school-network positioning; theme switcher; keyboard shortcuts.
**GameZipper gap:** no account-based recently-played (only localStorage).

### 2. Categorization & Discovery

| Feature | Poki | CrazyGames | Y8 | Coolmath | **GameZipper** |
|---|---|---|---|---|---|
| Category hierarchy | 3 levels (genre → subgenre) | 2 levels | 2 levels | 2 levels | 1 level (single layer of cats in registry) |
| Tag system | ✓ (rich) | ✓ (rich) | partial | minimal | ✓ (per game tags in registry) |
| Search results page | ✓ | ✓ | ✓ | ✓ | ✓ (Cmd+K + `/`) |
| No-result recommendations | ✓ | ✓ | ✓ | ✓ | partial (relies on default suggestions) |
| Random game | ✓ | ✓ | ✓ | ✓ | ✓ (Surprise Me button + `/` random FAB) |
| Top charts | ✓ | ✓ | ✓ | ✓ | partial (no real "today's top" data) |
| New releases | ✓ | ✓ | ✓ | ✓ | ✓ (`isNew: true` flag in registry) |
| Leaderboards | ✓ (per-game, account-bound) | ✓ | ✓ | ✗ | ✗ (would need backend) |
| Original / exclusive badges | ✓ (Poki Original) | ✓ (CrazyGames Original) | partial | ✗ | partial (NEW badge) |
| Multiplayer tag | ✓ (filter) | ✓ | ✓ | partial | partial (no dedicated multiplayer filter) |
| Mobile-only filter | ✓ | ✓ | partial | ✗ | partial (responsive design) |

**GameZipper advantage:** every registry entry has a category; mobile responsiveness is uniform.
**GameZipper gap:** no real leaderboard (would need a backend); no "Top today" data (no analytics pipe yet); random FAB exists but is below the fold on mobile.

### 3. Game Detail Page

| Feature | Poki | CrazyGames | Y8 | Coolmath | **GameZipper** |
|---|---|---|---|---|---|
| Game container loads inline | ✓ (fullscreen overlay) | ✓ | ✓ | ✓ | ✓ (fullscreen canvas) |
| How to play | ✓ | ✓ | ✓ | ✓ | ✓ (95% coverage) |
| Controls section | ✓ | ✓ | ✓ | ✓ | ✓ (within H2P) |
| Rating / votes | ✓ (5-star) | ✓ | ✓ | ✓ | ✗ (no rating system yet) |
| Released / updated date | ✓ | ✓ | ✓ | partial | partial (`datePublished` in schema only) |
| Developer info | ✓ | ✓ | partial | ✗ | ✗ (single-tenant) |
| Tech stack info | partial | ✗ | ✗ | ✗ | ✗ |
| Supported platforms badge | ✓ | ✓ | ✓ | partial | ✓ (Web · Mobile Ready) |
| Related games | ✓ (3–6) | ✓ (6) | ✓ (10+) | ✓ (3) | partial (related via registry, not yet rendered) |
| FAQ | ✓ | partial | partial | ✓ | ✓ (95% coverage) |
| Share | ✓ (4–5 channels) | ✓ | ✓ | ✓ | partial (share button on top games, not all) |
| Bug report | ✓ | ✓ | ✓ | ✓ | ✗ |
| Fullscreen / Mute / Pause / Restart | ✓ | ✓ | ✓ | ✓ | ✓ (100% have restart; 27% have mute; fullscreen/mute built into overlay) |
| Recommend next game | ✓ (queue) | ✓ | ✓ | partial | partial (Continue + Random) |
| SEO content quality | high | high | medium | high | high (full H2P + FAQ + Tips + JSON-LD FAQPage + Game + Breadcrumb + Organization + WebSite + WebApplication schemas) |

**GameZipper advantage:** very rich SEO on most games (FAQPage schema, How-to-Play, Tips).
**GameZipper gap:** no in-page ratings, no related-games renderer yet, no bug report form, share only on 24% of games.

### 4. Platform Capabilities

| Feature | Poki | CrazyGames | Y8 | Coolmath | **GameZipper** |
|---|---|---|---|---|---|
| Recently played | ✓ (account) | ✓ (account) | ✓ (account) | ✗ | ✓ (localStorage, anonymous) |
| Favorites / Likes | ✓ (account) | ✓ (account) | ✓ (account) | ✗ | ✓ (localStorage) |
| Achievements | ✓ | ✓ | ✓ | ✗ | ✗ |
| User profile | ✓ | ✓ | ✓ | ✗ | ✗ |
| Global leaderboards | ✓ | ✓ | ✓ | partial | ✗ |
| Multi-language | ✓ (30+) | ✓ (15+) | ✓ (6) | ✗ | ✗ (English only) |
| PWA / installable | partial (Poki App) | ✓ | ✗ | ✗ | ✓ (manifest.json, theme-color, apple-mobile-web-app-capable) |
| Offline play | partial | partial | ✗ | ✗ | ✗ (no service worker yet) |
| Mobile UX | ✓ (native + web) | ✓ | ✓ | ✓ | ✓ (responsive, viewport-fit=cover, touch-action) |
| Parental / kid-safe note | ✓ | ✓ | partial | ✓ (school-safe explicit) | ✓ (in FAQ: "no accounts, no chat, no user-generated content") |
| Developer upload ecosystem | ✓ (Poki for developers) | ✓ | ✓ | ✓ | ✗ |
| Cookie / privacy compliance | ✓ (GDPR/CCPA banner) | ✓ | ✓ | ✓ | ✓ (cookie policy page, accept/decline, no tracking without consent) |

**GameZipper advantage:** fully anonymous UX (no login required), strong PWA scaffolding, kid-safe positioning.
**GameZipper gap:** no global leaderboard (would need backend), no service worker / offline, no multi-language, no developer upload.

### 5. GameZipper vs. Competitors — Internal Consistency

GameZipper's *internal* cross-references are now clean (post-QA):

| Check | Result |
|---|---|
| Game count in registry | 241 |
| Game directories on disk | 241 |
| Game pages in sitemap | 241 |
| Triple-source match | 100% |
| Homepage "19+ / 238+ / 20+" claims | All unified to "241+" |
| JSON-LD `ItemList.numberOfItems` | 241 (was 26) |
| Save-the-doge in sitemap | yes (was missing) |
| Category pages dynamic (full cat coverage) | yes (was hard-coded 1–12 per cat) |
| Internal TODO markers (e.g. "this page now needs…") | 0 (was 1 in 2048) |

---

## Sources

- Poki: https://poki.com (snapshot 2026-06-04)
- CrazyGames: https://www.crazygames.com (snapshot 2026-06-04)
- Y8: https://www.y8.com (snapshot 2026-06-04)
- Coolmath Games: https://www.coolmathgames.com (snapshot 2026-06-04)
- GameZipper: https://gamezipper.com (snapshot 2026-06-05 post-Round-3)

Library-size estimates based on sitemap.xml counts where available, otherwise home-page "load more" pagination pages.
