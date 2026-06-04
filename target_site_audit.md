# GameZipper — Target Site Audit

**Date:** 2026-06-05
**Site:** https://gamezipper.com
**Scope:** 241 live games, 7 category pages, 4 static pages (about, privacy, cookie-policy, terms), 1 blog index, ~80 blog posts, sitemap, robots, ads.txt, manifest

---

## 1. Inventory Snapshot (post-Round-3)

| Item | Count | Source of truth |
|---|---|---|
| Live games in registry (`js/games-data.js`) | 241 | `GAMES` const, all `status: "live"` |
| Game directories on disk | 241 | one per slug |
| Game pages in sitemap | 241 | every registry entry |
| Blog posts | ~80 | `blog/*.html` |
| Category landing pages | 7 | puzzle/arcade/card/idle/simulation/word/casual |
| Top-level marketing pages | 4 | about / privacy / cookie-policy / terms |
| Other sitemap URLs | 5 | /, /sitemap.html, /blog, /contact, /fun-web-games |

Categories in registry (by `cat` field):
- puzzle: 169 (70.1%)
- arcade: 39 (16.2%)
- card: 14 (5.8%)
- idle: 5 (2.1%)
- board: 5 (2.1%)
- casual: 3 (1.2%)
- racing: 2 (0.8%)
- skill: 1 (0.4%)
- sports: 1 (0.4%)
- simulation: 1 (0.4%)
- word: 1 (0.4%)

---

## 2. Content Quality (post-Round-3, 241 games)

| Property | Coverage |
|---|---|
| 200 OK on live URL | 100% (sampled) |
| `<!DOCTYPE html>` | 100% |
| `<h1>` (semantic) | 100% |
| `<link rel="canonical">` | 100% |
| `<meta property="og:*">` (OpenGraph) | 100% |
| Twitter Card meta | 81% (rest use OG fallback) |
| JSON-LD structured data | 100% (Game schema + FAQPage on most) |
| How-to-Play section | 95% |
| FAQ section | 95% |
| Restart UI or documented R-key/F5 | 100% (overlay added to 20 in Round 1) |
| Mute UI | 27% (canvas games with audio; rest correctly have no audio) |
| localStorage save | 92% |
| Web Audio | 92% (canvas games) |
| Share button | 24% (gating: top games only — growth product decision) |
| Tap-to-play hint | 25% (rest are DOM / auto-start) |
| "No TODO / placeholder" in body | 100% (2048 cleaned in Round 3) |
| `lang="en"` on `<html>` | 100% |
| Theme switcher (light/dark/auto) | yes, on home (2026-06-04 refactor) |

---

## 3. Asset Sweep (live CDN, 406 unique gamezipper.com URLs)

| Status | Count | Detail |
|---|---|---|
| 200 | 404 | all working |
| 301 | 1 | `/baba-is-you` (no trailing slash) — browser follows |
| 404 | 1 (now fixed) | `//cdn.jsdelivr.net/npm/monetag@latest` in merge-kingdom — removed in Round 2 |
| 5xx | 0 | |

External 3rd-party hosts referenced: 138x `site-analytics.gamezipper.com` (own analytics), 26x `fonts.googleapis.com`, 1x `cdnjs.cloudflare.com` (jquery), 1x `cdn.jsdelivr.net` (now removed), 1x `ads.monetag.com`, 1x `googletagmanager.com`, 1x `site-analytics.rye.io`. All within expected scope for an HTML5 game portal.

---

## 4. SEO Audit (per-game, sampled 30)

| Check | Status |
|---|---|
| `<title>` unique per page | yes (template: "Play X Online Free - [theme] | GameZipper") |
| `<meta name="description">` present | 100% |
| `<link rel="canonical">` self-references correct URL | 100% |
| OpenGraph `og:title` matches `<title>` | yes |
| OpenGraph `og:image` set | yes (most use `/og-preview.webp`) |
| Twitter Card `summary_large_image` | 81% |
| JSON-LD `VideoGame` schema | yes (most) |
| JSON-LD `FAQPage` schema | 95% |
| JSON-LD `BreadcrumbList` | 95% |
| Image `alt` attributes | most (sample 30: 100% have meaningful alt) |
| Sitemap includes all games | 100% (post Round 0 fix of save-the-doge) |
| `robots.txt` allows game pages | yes |
| `ads.txt` valid | yes (Monetag + AdSense entries) |

---

## 5. Performance & Modern Web

| Check | Status |
|---|---|
| `Cache-Control` headers (HTML) | `max-age=600` (10 min CDN) |
| `Cache-Control` headers (assets) | per-asset / immutable for `/og-images/`, `/favicon.svg` |
| `Content-Security-Policy` | not yet set (P1 for next iteration) |
| Service worker | not yet registered (P2 — offline would be nice) |
| `prefers-reduced-motion` respected | yes (`gz-scroll-progress` and animations have `@media` override) |
| Dark/light theme auto-switch | yes (theme-color meta, gz-theme-pref localStorage) |
| Viewport meta with `viewport-fit=cover` | yes (iPhone notch) |
| Apple PWA meta | yes (`apple-mobile-web-app-capable`, status-bar-style, application-name) |
| `Accept-CH` for client hints | yes (DPR, Width, Sec-CH-UA) |
| Speculation rules | yes (CDN-level) |

---

## 6. Accessibility (sample 20 games)

| Check | Status |
|---|---|
| `<html lang="en">` | 100% |
| Skip nav / focus management | home page yes, individual games partial |
| `aria-label` on icon buttons | partial (top nav yes) |
| Color contrast on dark theme | needs axe-core check (not run in browser due to MCP failure) |
| `prefers-reduced-motion` | respected globally |
| Keyboard nav for top nav | yes |
| Keyboard for game itself | depends on game (most canvas games ignore keyboard) |
| Alt text on `<img>` | 100% sampled |
| Form labels | N/A (no forms) |

---

## 7. Monetization

- **Monetag** (primary) — `monetag-manager.js` v5 (Poki-style), adaptive pre-roll + commercial breaks + rewarded
- **Google AdSense** — `ca-pub-8346383990981353`
- **Affiliate / sponsored** — none currently
- **Subscription** — none
- **No IAP** — all free

---

## 8. Multi-Language / Internationalization

- Content: English only
- `<html lang="en">` and hreflang="x-default" / hreflang="en" to self
- No localized versions, no translation pipeline

---

## 9. PWA

- `manifest.json` referenced
- Theme colors (light + dark) set
- `apple-mobile-web-app-capable` set
- Icons: `apple-touch-icon.png` 256x256 (other sizes not yet generated)
- Service worker: not registered (would enable offline + faster repeat visits)

---

## 10. Strengths (what GameZipper does better than peers)

1. **Anonymous-first UX** — no account, no login, all progress in localStorage. Lower friction than Poki / CrazyGames / Y8.
2. **Chromebook / school network positioning** — explicit copy in hero and SEO.
3. **Cookie / privacy compliance** — consent banner with accept/decline, no tracking without consent.
4. **PWA foundation** — installable on iOS + Android, theme switcher.
5. **SEO depth** — every game has Game schema + FAQPage + Breadcrumb + tips. Better than most peers' thin landing pages.
6. **Triple-source consistency** — registry / directories / sitemap perfectly aligned (241 == 241 == 241).
7. **Poki-style ad system** — Monetag manager with 45s/20-in-30-min/60-in-day frequency caps, more polished than typical.

---

## 11. Weaknesses vs Competitors

1. **Library size** — 241 vs Poki's 5,000+. Hard gap, but quality > quantity niche.
2. **No leaderboards** — most peers have them; we don't (would need backend).
3. **No achievements** — most peers have them; we don't.
4. **No multiplayer** — limited social play (only "Pong 2-player on same device").
5. **English only** — most peers have 6–30 languages.
6. **No developer upload** — peers let studios submit; we curate.
7. **No ratings / reviews** — peers have 5-star systems; we don't.
8. **No in-page related-games renderer** — registry has the data, but the detail-page renderer isn't wired.
9. **No bug-report button** — peers have it; we don't.
10. **No service worker / offline** — would let mobile users play on the bus.

---

## 12. Internal Hygiene (post-QA)

- ✅ No "19+" / "238+" / "20+ Free" stub numbers on home (all 241+)
- ✅ No internal TODO in production copy (2048 was the last one, fixed Round 3)
- ✅ No 404 game assets (merge-kingdom jsDelivr was the last one, fixed Round 2)
- ✅ All 7 category pages render the full category, not 1–12 hard-coded items
- ✅ Sitemap covers all 241 live games
- ✅ robots.txt clear, allows all user-agents except scrapers, references sitemap
- ✅ ads.txt valid
- ✅ Triple-source registry/dirs/sitemap match: 100%
