# GameZipper — Gap Analysis

**Date:** 2026-06-05
**Method:** Direct comparison of `target_site_audit.md` vs `competitor_benchmark.md`
**Scoring:** P0 (release-blocker) / P1 (high) / P2 (medium) / P3 (low)

---

## P0 Gaps (release blockers)

| # | Gap | Where | Action | Status |
|---|---|---|---|---|
| — | (none after Round 0–3) | — | — | — |

---

## P1 Gaps (high priority — competitive differentiators)

| # | Gap | Where | Recommendation | Effort |
|---|---|---|---|---|
| 1 | **No global leaderboard** | all games | Add lightweight leaderboard (Supabase / Firebase free tier or Cloudflare KV) — opt-in, "best score this week" | 2–3 days |
| 2 | **No in-page related-games renderer** | every game detail page | Add 4–6 related-game cards at the bottom of each `/<slug>/`, pulled from registry (same cat, exclude self) | 0.5 day |
| 3 | **No in-page rating / "Was this fun?"** | all games | Simple 5-emoji rating, localStorage-backed, optional backend later | 0.5 day |
| 4 | **No bug-report button** | all games | "Report a problem" mailto: + optional "copy diagnostic info" button | 0.25 day |
| 5 | **Share only on 24% of games** | 182 games | Add `gzShare` overlay/button to all 241 (Round 1's overlay approach generalized) | 0.5 day |
| 6 | **Multiplayer discovery weak** | home | "2-player" filter chip, dedicated "2-player" landing page linking to chess/checkers/connect-four/reversi/etc. | 0.5 day |
| 7 | **No Content-Security-Policy** | all pages | Add strict-but-compatible CSP via `Content-Security-Policy-Report-Only` first, then enforce | 1 day |

---

## P2 Gaps (medium priority — UX / growth)

| # | Gap | Where | Recommendation | Effort |
|---|---|---|---|---|
| 8 | **Mute button missing on 73% of games** | 176 games | Most don't have audio so N/A; for those that do (95% have Web Audio), surface the mute toggle in a global HUD (similar to gz-tap-start but persistent) | 0.5 day |
| 9 | **Tap-to-play hint missing on 75% of games** | 180 games | Only needed for canvas games (62% of canvas games lack it). Generalize gz-tap-start to remaining canvas games | 0.25 day |
| 10 | **No service worker / offline** | global | Add minimal SW: cache home + 5 most-recent games + manifest. Skip cross-game SW cache for stale data risk. | 1 day |
| 11 | **No achievements system** | all games | Optional badge system — "First Win", "10 Levels Cleared", "Daily Streak 7" — localStorage only, no backend | 1 day |
| 12 | **No "Daily Challenge"** | home | Pick 1 game/day, 1 deterministic level (seed by date), everyone plays the same | 1 day |
| 13 | **No "Continue where you left off" across devices** | all games | localStorage is device-bound. To go cross-device, need optional email magic link or QR | 2 days |
| 14 | **No developer upload pipeline** | admin | Currently manually add game. A semi-automated "register new game" admin form would let the team scale faster | 2–3 days |
| 15 | **No real "Top today" / "Trending" data** | home | Either pipe in real analytics (1d) or replace "trending" with "most-played-this-week" localStorage-aggregated, no backend | 1 day |
| 16 | **English only** | global | Auto-translate with DeepL/Google API + cached translations; start with top 5 games in 5 languages | 3 days |

---

## P3 Gaps (low priority — polish)

| # | Gap | Where | Recommendation | Effort |
|---|---|---|---|---|
| 17 | **Cookie banner — accept/decline copy could be richer** | global | A/B test with consent UX research; defer 30d | — |
| 18 | **No keyboard shortcut help overlay (?)** | global | Add `?` key → modal showing all shortcuts (`/`, `Cmd+K`, `R`, `Esc`, `M`, `S`, `F`, `T`, `1-3`) | 0.25 day |
| 19 | **No focus-trap in modals** | global | gzShowRestart / exit-intent modal needs focus-trap | 0.5 day |
| 20 | **Theme switcher not on every page** | category + games | Add to category pages and to all game pages (currently only on home) | 0.5 day |
| 21 | **No exit-intent popup** | home | Implement as "Before you go, try this game" with cookie-aware suppression | 0.5 day |
| 22 | **PWA icons only 256x256** | global | Generate 192, 384, 512 | 0.25 day |
| 23 | **No Lighthouse CI in pipeline** | dev | Add `lighthouserc.json` to GitHub Actions on PR | 0.5 day |
| 24 | **No automated E2E** | dev | Create Playwright suite for the smoke + per-game boot test (gateway exists: `test-all-games.js` but flaky) | 1–2 days |
| 25 | **No "Recently updated" badge on home** | home | Add `dateModified` from schema, show "Updated 2 days ago" on home carousels | 0.25 day |

---

## Internal Consistency — Pre-existing P0s found in Round 0 (now FIXED)

| # | Old gap | Fix | Status |
|---|---|---|---|
| I-1 | Homepage claimed "19+ games" (23 occurrences) while registry had 241 | Replaced all → "241+" in title / meta / OG / Twitter / JSON-LD / search placeholder / share / hero | ✅ Fixed (commit `5a90fe5e`) |
| I-2 | Homepage claimed "238+ games" (11 occurrences) | Replaced → "241+" | ✅ Fixed |
| I-3 | Homepage claimed "20+ Free Online Games" (4 occurrences) | Replaced → "241+ Free Online Games" | ✅ Fixed |
| I-4 | JSON-LD `ItemList.numberOfItems: 26` (only 26 items declared) | Updated → 241 | ✅ Fixed |
| I-5 | `save-the-doge` missing from sitemap despite being in registry | Added to sitemap.xml | ✅ Fixed |
| I-6 | `merge-kingdom` referenced dead jsDelivr monetag CDN (404) | Removed dead tag | ✅ Fixed (commit `7e9649bb`) |
| I-7 | 7 games missing `<h1>` | Added visually-hidden h1 with `aria-label` | ✅ Fixed (commit `121d0aa1`) |
| I-8 | `mo-yu-fayu` missing canonical | Added | ✅ Fixed |
| I-9 | 20 canvas games without restart UI | Added `gz-restart-overlay` (throttled 600ms poll, R key, exposes `window.gzShowRestart`) | ✅ Fixed |
| I-10 | 9 canvas games without "Tap to start" hint | Added `gz-tap-start` overlay (auto-dismisses on first interaction) | ✅ Fixed |
| I-11 | 7 category pages rendered 1–12 hard-coded games vs 1–169 actual | Dynamic load from `/js/categories/{cat}.json`, full coverage | ✅ Fixed |
| I-12 | 2048 page had internal TODO "This page now needs stronger strategy language…" in body | Replaced with concrete corner-stack strategy | ✅ Fixed (commit `721fa8bd`) |
| I-13 | `tidy-up-3d` orphan directory (assets but no index.html) | Removed | ✅ Fixed |
| I-14 | `.gitignore` missing `magic-sort/gen_log*.txt` (runtime log committed by accident) | Added | ✅ Fixed |

---

## Recommendations — Prioritized Backlog

### Sprint 1 (1–2 weeks) — close top P1s
- P1-2 (related-games renderer) — biggest SEO+UX win
- P1-5 (share everywhere) — completes Round 1's overlay effort
- P1-3 (in-page rating) — fun low-effort social signal
- P1-4 (bug-report) — important for user trust

### Sprint 2 (2–4 weeks) — quality + retention
- P1-1 (leaderboards) — biggest competitive gap; needs backend decision
- P2-10 (service worker) — low-hanging offline + speed
- P2-11 (achievements) — pure localStorage, no backend
- P2-12 (Daily Challenge) — retention driver

### Sprint 3 (1+ month) — scale
- P1-6 (multiplayer discovery) — landing page + filter
- P1-7 (CSP) — security maturity
- P2-16 (multi-language) — growth unlock
- P2-13 (cross-device continue) — premium feature
- P2-14 (dev upload pipeline) — operational scale

---

## What GameZipper Should NOT Copy

- **Poki's aggressive 4–6 ad placements per page** — we currently have ~2 (pre-roll + commercial-break on game-over), well-spaced
- **Y8's 10,000+ flash library** — we'd be importing legacy debt
- **CrazyGames' rewarded-video gating** — we don't gate content, we want friction-free play
- **Itch.io's tip-jar model** — our traffic doesn't lean enthusiast/donor
- **Poki accounts** — anonymous UX is a real differentiator
