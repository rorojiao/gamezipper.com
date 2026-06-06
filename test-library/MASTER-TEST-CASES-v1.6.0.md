|# GameZipper 100% Master Test Case Library
|**Version**: 1.6.0
|**Effective Date**: 2026-06-07
|**Build**: R92 (Dynamic Test Intelligence 4h cron evolution)
|**Library Owner**: Lead Test Engineer
|**Review Cycle**: Every 4 hours (auto-update via Dynamic Test Intelligence)

## Version History
|- v1.6.0 (2026-06-07): 8 new test cases (R92 — Dynamic Test Intelligence cron) — Fake virus / scam-ad IAB protection, Chrome 149 22 critical (Forbes), WebGPU Compatibility Mode (Chrome 146+), Safari 26 Metal vs Chromium WebGPU parity gap, ad-blocker detection anti-pattern, IAB TCF v2.2 string, sandboxed ad iframe hardening, MDN memory pressure CDP test
|- v1.5.0 (2026-06-06): 10 new test cases (R91 — Dynamic Test Intelligence cron) — Password manager clickjacking 2026 (DEF CON 33), Chrome 149 CVE-2026-11084 + 429-patch record, Safari 26.5 20 WebKit CVEs + :open pseudo + Origin API + ToggleEvent.source + Popover, Chrome I/O 2026 HTML-in-Canvas API, Unity WebGL Safari first-draw shader stall prevention
- v1.4.0 (2026-06-06): 14 new test cases (R89 — Dynamic Test Intelligence cron) — Edge Pwn2Own CVE-2026-45492/45494/45495, V8 CVE-2026-6363, Safari 26.4 WebTransport/Keyboard Lock, AI Visual Regression (arXiv 2208.02335), Interop 2026, PWA/Service Worker, Shift-Right live playtesting
- v1.3.0 (2026-06-06): 2 new games + Pitfall 45 (R88 H1-in-splash fix) — no master file change
- v1.2.0 (2026-06-06): 8 new test cases (R87 evolution) — Chrome CVE-2026-9963/9967 GPU RCE, Safari 26.0 WebGPU/CSS Anchor/PiP, 2026 mobile UX (Thumb Zone / dark mode / haptic), WCAG accessibility
- v1.1.0 (2026-06-06): Verification milestones (R2/R3 126/126 PASS, 0 new issues)
- v1.0.0 (2026-06-06): Initial library based on 2026-Q2 industry research + R85 R1 finding

## Severity Definitions (per user policy 2026-06-06: 100% fix rate P0-P3)
- **P0 (Blocker)**: Website inaccessible, game fails to load, game crashes, unplayable
- **P1 (Critical)**: Core gameplay broken, level uncompletable, data errors, monetization broken
- **P2 (Major)**: Secondary function anomalies, UI display issues, poor experience
- **P3 (Minor)**: Text errors, choppy animations, unclear prompts, minor cosmetic

---

## CATEGORY 1: WEBSITE-LEVEL TESTING (apply to all pages)

### 1.1 Homepage (/)
- [W-001] **[P0]** Homepage loads HTTP 200 in <2s
- [W-002] **[P0]** All game cards render (no missing thumbnails, no broken images)
- [W-003] **[P0]** Click on game card navigates to correct /game-slug/ URL
- [W-004] **[P0]** Logo click returns to homepage
- [W-005] **[P0]** Category filter buttons (All, Puzzle, Arcade, Idle, Card, Match-3) work and filter correctly
- [W-006] **[P1]** NEW badge displays correctly on games marked isNew:true
- [W-007] **[P1]** No JS console errors on homepage (zero-tolerance policy)
- [W-008] **[P1]** gz-error-toast "Something went wrong" does NOT show on normal load
- [W-009] **[P1]** Games count matches /js/games-data.js GAMES array length
- [W-010] **[P2]** Browser forward/back buttons work correctly
- [W-011] **[P2]** 404 page renders for non-existent URLs
- [W-012] **[P2]** Mobile responsive (375×667, 414×896 portrait/landscape)
- [W-013] **[P3]** Infinite scroll loads more games smoothly
- [W-014] **[P3]** Search box filters games by name

### 1.2 Network Performance
- [W-020] **[P0]** Homepage total payload ≤ 2MB
- [W-021] **[P0]** No zombie/dead external script src (1ktower.com, alwingulla.com, rye.io, monetag.com direct)
- [W-022] **[P0]** No mixed-active-content (HTTPS page must not reference http://)
- [W-023] **[P1]** All external script srcs return 200 (not 405, 404, 501)
- [W-024] **[P1]** DNS resolution time < 500ms
- [W-025] **[P2]** Cloudflare CDN cache hit rate > 80%
- [W-026] **[P2]** gz-analytics.js localStorage archive works (gz_aa, gz_ab)

### 1.3 SEO & Meta
- [W-030] **[P1]** Each page has unique <title> tag
- [W-031] **[P1]** Each page has meta description
- [W-032] **[P2]** JSON-LD structured data validates (VideoGame schema)
- [W-033] **[P2]** og:image present and not 404
- [W-034] **[P3]** Canonical link present
- [W-035] **[P1]** Chrome 130+ Document Picture-in-Picture (PiP) — when user activates PiP on game page, gameplay canvas continues rendering and accepting input; no "page hidden → rAF pause" failure
- [W-036] **[P1]** Chrome Performance Personalization (Memory Saver / Energy Saver) — game must remain playable when browser throttles background tabs. Resource hints (preconnect/preload) should not break under memory pressure. Source: Chrome 130 release notes (https://developer.chrome.com/release-notes/130)

---

## CATEGORY 2: INDIVIDUAL GAME TESTING (per game)

### 2.1 Game Loading & Setup
- [G-001] **[P0]** /game-slug/ returns HTTP 200 in <3s
- [G-002] **[P0]** Game has index.html with 3 essential elements:
  - `<div id="gz-ad-below-game">` (ad container)
  - `<script src="/monetag-manager.js">` (ad loader)
  - `<script src="/game-footer.js" defer>` (related games)
- [G-003] **[P0]** Game's main JS file (game.js or bundle) is correctly referenced in index.html
- [G-004] **[P0]** No JS error on first load (network error, 404, 405, SyntaxError)
- [G-005] **[P0]** No zombie endpoints (1ktower.com, alwingulla.com, rye.io)
- [G-006] **[P0]** No dead site-analytics.gamezipper.com 1x1 img
- [G-007] **[P1]** Splash screen (if present) dismisses within 8s or on click/touch/key
- [G-008] **[P1]** No site-analytics.gamezipper.com 1x1 pixel (HTTP 501)
- [G-009] **[P1]** All input event handlers registered (mousedown/touchstart/keydown/pointerdown)
- [G-010] **[P1]** init() function called after DOM ready
- [G-011] **[P1]** rAF cancelAnimationFrame correctly delegates to native
- [G-012] **[P1]** Game has visible H1 with game name
- [G-013] **[P2]** Canvas size scales to viewport (not stuck at 300x150)
- [G-014] **[P2]** Touch events work on mobile (mobile Safari, Android Chrome)
- [G-015] **[P2]** Keyboard events work (Arrow keys, Space, P, Esc)
- [G-016] **[P3]** No layout shift on load (CLS < 0.1)

### 2.2 Core Gameplay (per game type)

#### Puzzle (block/tile/grid)
- [GP-001] **[P0]** Grid elements in correct positions
- [GP-002] **[P0]** Match-3 / sort detection works
- [GP-003] **[P1]** Visual feedback on move (highlight, snap, animation)
- [GP-004] **[P1]** Hint/undo button works
- [GP-005] **[P1]** Level completion → next level transition
- [GP-006] **[P1]** Win/lose state detection
- [GP-007] **[P2]** Score calculation correct
- [GP-008] **[P2]** Score multiplier triggers correctly
- [GP-009] **[P3]** Game duration 3-5 min per session (casual standard)

#### Arcade (action/runner/shooter)
- [GA-001] **[P0]** Movement responds to key press / click
- [GA-002] **[P0]** Collision detection works
- [GA-003] **[P0]** Score updates in real-time
- [GA-004] **[P0]** Game-over / lives / restart mechanism
- [GA-005] **[P1]** Visual feedback smooth (≥60fps)
- [GA-006] **[P1]** Difficulty progression
- [GA-007] **[P2]** Combo system works
- [GA-008] **[P2]** No invincibility / one-hit-kill / infinite score bug

#### Card (solitaire/poker/blackjack)
- [GC-001] **[P0]** All cards render correctly (52 cards, or deck size)
- [GC-002] **[P0]** Card drag/click responds
- [GC-003] **[P1]** Score, moves, time tracked
- [GC-004] **[P1]** Win condition declares winner
- [GC-005] **[P1]** Undo/restart option
- [GC-006] **[P2]** Card animation smooth

#### Board (chess/checkers/backgammon)
- [GB-001] **[P0]** All pieces on board visible
- [GB-002] **[P0]** Turn mechanism (player vs AI)
- [GB-003] **[P1]** Move legality enforced
- [GB-004] **[P1]** Game-over and winner declaration
- [GB-005] **[P1]** New-game button
- [GB-006] **[P2]** AI difficulty levels

#### Idle (clicker)
- [GI-001] **[P0]** Auto-generation works without user input
- [GI-002] **[P0]** Click speeds up progression
- [GI-003] **[P1]** Upgrades purchasable
- [GI-004] **[P1]** Save state (localStorage) works across reload
- [GI-005] **[P1]** No offline earnings double-counting
- [GI-006] **[P2]** Prestige reset-with-bonus mechanic

#### Match-3
- [GM-001] **[P0]** Tile swap works
- [GM-002] **[P0]** Match detection (3+ same)
- [GM-003] **[P1]** Cascade after match
- [GM-004] **[P1]** Level progression
- [GM-005] **[P2]** Special pieces (line, bomb, color bomb)

### 2.3 Multimedia System
- [GX-001] **[P0]** Background music plays (or silent on purpose)
- [GX-002] **[P0]** No autoplay issues (Chrome autoplay policy)
- [GX-003] **[P1]** Sound effects trigger correctly (click, score, win, lose)
- [GX-004] **[P1]** Mute toggle works
- [GX-005] **[P1]** Volume control works
- [GX-006] **[P2]** BGM + SFX mix balance
- [GX-007] **[P2]** Audio context resumed on first user gesture
- [GX-008] **[P2]** Animation ≥60fps (no jank)
- [GX-009] **[P3]** Particle effects (where present) smooth
- [GX-010] **[P2]** Vibration API haptic feedback — mobile games calling `navigator.vibrate(pattern)` on tap/win/lose should not throw; falls back silently on iOS Safari (no API support) and desktop. Source: 2026 mobile gaming UX trends (https://novatechbeacon.com/latest/why-2026-gaming-is-built-for-one-hand-play)

### 2.4 Progression & Persistence
- [GP-100] **[P0]** Level save/restore across reload
- [GP-101] **[P0]** Best score save/restore
- [GP-102] **[P1]** Level unlock conditions
- [GP-103] **[P1]** LocalStorage keys follow convention (gz_<game>_v<N>)
- [GP-104] **[P2]** No localStorage quota overflow
- [GP-105] **[P2]** No corrupt save (validate on load)
- [GP-106] **[P3]** Reset progress option

### 2.5 Monetization (Ad Integration)
- [GM-100] **[P0]** gz-ad-below-game div present
- [GM-101] **[P0]** monetag-manager.js loads
- [GM-102] **[P1]** GAME BREAK overlay (gz-cb-overlay) doesn't hijack input
- [GM-103] **[P1]** GAME BREAK dismisses after 8s or click
- [GM-104] **[P1]** No auto-redirect to other games during play
- [GM-105] **[P2]** Ad does not cover gameplay area
- [GM-106] **[P2]** Ad does not appear during win celebration
- [GM-107] **[P3]** Ad refresh doesn't break game

---

## CATEGORY 3: CROSS-DEVICE & BROWSER COMPATIBILITY

### 3.1 Desktop Browsers
- [C-001] **[P0]** Chrome latest (≥120): all 126 games work
- [C-002] **[P0]** Firefox latest: all 126 games work
- [C-003] **[P0]** Safari latest (26.4+): all 126 games work
- [C-004] **[P0]** Edge latest: all 126 games work
- [C-005] **[P1]** Chrome 1-version-back (119): all 126 games work
- [C-006] **[P1]** Safari 1-version-back (26.3): all 126 games work

### 3.2 Mobile Browsers
- [C-010] **[P0]** iOS Safari 26.x: all 126 games work (touch input)
- [C-011] **[P0]** Android Chrome latest: all 126 games work
- [C-012] **[P1]** WeChat built-in browser: gameplay works
- [C-013] **[P1]** Portrait orientation works
- [C-014] **[P1]** Landscape orientation works
- [C-015] **[P2]** No horizontal scroll on 375px viewport
- [C-016] **[P2]** Touch targets ≥ 44×44 px (iOS HIG)

### 3.3 Tablets
- [C-020] **[P0]** iPad Safari: all 126 games work
- [C-021] **[P1]** Android tablet Chrome: all 126 games work

### 3.4 Screen Sizes
- [C-030] **[P1]** 1920×1080 desktop: layout correct
- [C-031] **[P1]** 1366×768 laptop: layout correct
- [C-032] **[P1]** 375×667 iPhone: mobile layout
- [C-033] **[P1]** 414×896 iPhone Plus: mobile layout
- [C-034] **[P2]** 768×1024 iPad: tablet layout
- [C-035] **[P2]** 1024×1366 iPad Pro: layout

---

## CATEGORY 4: PERFORMANCE & STABILITY

### 4.1 Performance Metrics
- [P-001] **[P0]** Homepage load time ≤ 2s (LCP)
- [P-002] **[P0]** Game load time ≤ 3s
- [P-003] **[P0]** Memory usage during gameplay ≤ 500MB
- [P-004] **[P1]** CPU usage ≤ 30% during gameplay
- [P-005] **[P1]** FID (First Input Delay) ≤ 100ms
- [P-006] **[P1]** CLS (Cumulative Layout Shift) ≤ 0.1
- [P-007] **[P2]** FCP (First Contentful Paint) ≤ 1.5s
- [P-008] **[P2]** TTI (Time to Interactive) ≤ 3s

### 4.2 Stability
- [P-010] **[P0]** 1-hour continuous gameplay: no crash, no freeze
- [P-011] **[P0]** No memory leak after 10 game switches
- [P-012] **[P1]** Normal recovery after browser minimize/maximize
- [P-013] **[P1]** Game state preserved after network interruption
- [P-014] **[P1]** Low-power mode (mobile): playable
- [P-015] **[P2]** Tab background 5min: resume without state loss

---

## CATEGORY 5: SECURITY & COMPLIANCE

### 5.1 Data Privacy
- [S-001] **[P0]** No collection of PII (email, phone, name)
- [S-002] **[P0]** No cookies used except for game progress
- [S-003] **[P0]** No third-party tracking scripts (only monetization-related)
- [S-004] **[P0]** No malicious code or pop-ups
- [S-005] **[P1]** localStorage usage is minimal and game-scoped

### 5.2 Content Compliance
- [S-010] **[P0]** All content suitable for all ages (no violence/porn/gambling)
- [S-011] **[P0]** No false advertising or misleading information
- [S-012] **[P0]** No intellectual property infringement
- [S-013] **[P1]** Privacy policy linked and accessible
- [S-014] **[P1]** Terms of service present
- [S-015] **[P2]** COPPA compliant (no data collection from children)

### 5.3 Security
- [S-020] **[P0]** No XSS vulnerabilities (all input sanitized)
- [S-021] **[P0]** No CSRF on form submissions
- [S-022] **[P1]** HTTPS enforced on all pages
- [S-023] **[P1]** No mixed-content (HTTP resources on HTTPS pages)
- [S-024] **[P2]** CSP header set appropriately
- [S-025] **[P2]** SRI for external scripts (if any)

---

## CATEGORY 6: INDUSTRY-SPECIFIC (2026 Q2 Research Findings)

### 6.1 Browser-Specific (Safari 26.4+)
- [B-001] **[P1]** IndexedDB works on Safari 26.4+ (was broken in iFrame)
- [B-002] **[P1]** GamePad API works with XBOX Cloud (fixed March 2026)
- [B-003] **[P2]** color-gamut P3 displays render correctly
- [B-004] **[P2]** prefers-color-scheme: dark mode handled
- [B-005] **[P0]** Chrome OOB GPU Write CVE-2026-9967 (pre-148.0.7778.216) — game.js using WebGL/WebGPU/Canvas2D must verify browser Chrome version ≥ 148.0.7778.216; failing build throws OOB GPU memory write. Source: https://stack.watch/browse/latest/
- [B-006] **[P0]** Chrome iOS Uninitialized Use CVE-2026-9963 (pre-148.0.7778.216) — Uninitialized Use allows RCE on game page. Any embedded iframe / WebGL context must run on patched Chrome. Source: https://stack.watch/browse/latest/
- [B-007] **[P1]** Safari 26.0 WebGPU enabled — games requesting `navigator.gpu` must not error on iOS 26+/iPadOS 26+ Safari 26.0; WebGL fallback path still required for pre-Safari 26 (Source: https://webkit.org/blog/17333/webkit-features-in-safari-26-0)
- [B-008] **[P2]** Safari 26.0 new CSS primitives (Anchor Positioning, Scroll-driven Animations, HDR images, SVG icons) — test rendering on iOS 26+/macOS 26+ Safari 26.0; fallbacks to static layout for older Safari

### 6.2 Web Platform 2026
- [W-100] **[P1]** WebGPU fallback to WebGL works
- [W-101] **[P1]** AV1/VP9 video decode if game has video
- [W-102] **[P2]** Hardware-accelerated video decode hint to user if disabled
- [W-103] **[P2]** Speculation Rules API for prerender (already used)
- [W-104] **[P3]** Back/forward cache (bfcache) restoration works

### 6.3 Player-Common Complaints (Industry Top Issues)
- [PC-001] **[P0]** No forced video ads that block gameplay (Poki complaint)
- [PC-002] **[P0]** No auto-redirect to other games during play (industry-wide complaint)
- [PC-003] **[P1]** Easy to find in school/work networks (no false-positive category filters)
- [PC-004] **[P1]** Doesn't slow on old Chromebooks/tablets
- [PC-005] **[P2]** Mute button discoverable
- [PC-006] **[P2]** Progress saved (no lost progress complaint)
- [PC-007] **[P3]** Clear instructions for new players
- [PC-008] **[P3]** No fake "X" close button that opens new tab

---

## CATEGORY 7: ACCESSIBILITY (WCAG 2.2 + GDC 2026 GASIG)

### 7.1 Visual Accessibility
- [A-001] **[P1]** prefers-color-scheme: dark mode — listens to system theme change in real time (not just initial load); OS-level dark/light toggle updates page colors without page reload. Source: https://accessibilitychecker.org/blog/dark-mode-accessibility
- [A-002] **[P2]** WCAG 2.2 color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components (buttons, score numbers, status text). Test on both light and dark backgrounds.

### 7.2 Motor & One-Hand UX (2026 mobile-first)
- [A-003] **[P1]** One-hand Thumb Zone: primary gameplay controls (move/shoot/jump/restart) and CTA buttons (Play Again, Next Level) are reachable within bottom 60% of viewport in portrait orientation on 375×667 / 414×896 phones. Source: https://novatechbeacon.com/latest/why-2026-gaming-is-built-for-one-hand-play

### 7.3 Cognitive & Screen Reader (GDC 2026 GASIG)
- [A-004] **[P2]** ARIA labels on canvas — game canvas has `role="application"` or `role="img"` + `aria-label="<Game Name>"` for screen readers (NVDA, VoiceOver, TalkBack). Source: https://igda-gasig.org/2026/04/01/gdc-2026-accessibility-roundtable

---

## CATEGORY 8: 2026-Q2 EMERGING THREATS (R89 — Dynamic Test Intelligence)

### 8.1 Browser Security CVEs (June 2026 disclosure wave)
- [B-009] **[P0]** Edge UXSS CVE-2026-45494 (CVSS 5.0, ZDI-26-330) — Microsoft Edge improper navigation event validation allows Universal XSS. Any game page with cross-origin iframes (e.g. embedded ad iframes, payment iframes) is exploitable on unpatched Edge. **Test**: confirm Edge ≥ 137.0.3296.93 with version check + verify X-Frame-Options / frame-ancestors CSP set to prevent UXSS amplification. Source: https://cyberpress.org/microsoft-edge-vulnerability
- [B-010] **[P0]** Edge Directory Traversal RCE CVE-2026-45495 (CVSS 7.5, ZDI-26-331) — Microsoft Edge cross-device managed sign-in path traversal enables RCE. **Test**: any game URL with Edge `ms-browser-extension://` or extension content must be on patched Edge. Source: https://www.zerodayinitiative.com/advisories/ZDI-26-331/
- [B-011] **[P0]** Chrome V8 Type Confusion CVE-2026-6363 (Chrome 147+ fix) — V8 JavaScript engine OOB memory write from type confusion, RCE on game page. **Test**: any game using JS-heavy animation (rAF, gameLoop, custom classes) must run on Chrome ≥ 147.0.7730.100 (or backport). Source: https://windowsforum.com/threads/cve-2026-6363-v8-type-confusion-chrome-147-fix-and-edge-patch-timeline.413791
- [B-012] **[P1]** Edge Origin Validation Bypass CVE-2026-45492 (CVSS 4.3, ZDI-26-329) — chainable with other vulns for RCE. **Test**: cross-origin POST endpoints on game pages must have CSRF token + SameSite=Strict cookies.

### 8.2 Safari 26.4 New Web Platform Features
- [B-013] **[P1]** Safari 26.4 WebTransport support (shipped) — low-latency UDP-based game server protocol available in iOS 26.4+/macOS 26.4+ Safari. **Test**: `if ('WebTransport' in window)` detection, fallback to WebSocket on older Safari. WebTransport unusable in iFrame per spec — must be top-level. Source: https://developmentstoday.com/news/safari-26-4-new-features-bug-fixes-2026
- [B-014] **[P2]** Safari 26.4 CSS Grid Lanes — magazine-style grid for game cards on homepage. **Test**: validate `display: grid; grid-template-columns: masonry;` fallback on pre-26.4 Safari. Source: https://developmentstoday.com/news/safari-26-4-new-features-bug-fixes-2026
- [B-015] **[P1]** Safari 26.4 Keyboard Lock API — fullscreen game can capture Escape/WASD without OS interruption. **Test**: request keyboard lock on game-start, gracefully release on blur/visibilitychange; desktop Safari only (no iOS).

### 8.3 Visual Bug Detection (AI-Assisted)
- [P-016] **[P1]** Canvas pixel-change assertion — automated visual regression test verifies canvas pixels change during game interaction (matches arXiv 2208.02335 methodology: 100% accuracy on 24 injected visual bugs vs 44.6% for traditional snapshot testing). **Test**: capture canvas pixels before + after 5s interaction, assert ≥ 0.5% pixel diff, then use vision_analyze to confirm semantic correctness. Source: https://arxiv.org/abs/2208.02335
- [P-017] **[P2]** Gameplay state diff (not just pixels) — text content + DOM state + score + level must all change during normal play. Pure pixel diff can false-positive on splash screens or pure background gradients.

### 8.4 Interop 2026 (Cross-Browser Convergence)
- [B-016] **[P2]** Interop 2026 baseline (Chrome/Firefox/Edge ≥ 98% baseline features, Safari 98%) — game must not depend on Safari/Edge divergence bugs. **Test**: identical gameplay verified across Chrome 149, Firefox 147, Edge 137, Safari 26.4. Source: https://howtogeek.com/chrome-firefox-edge-and-safari-are-teaming-up-to-fix-common-web-problems

### 8.5 Game Testing Methodology 2026 (SnoopGame / Sogeti / GDC)
- [PC-009] **[P2]** Shift-Right live playtesting — in-app feedback button on every game page (`?issue=1` query param) sends feedback to gz_aa localStorage archive. **Test**: feedback button visible on mobile, opens email/mailto with game slug pre-filled. Source: https://snoopgame.com/blog/top-game-testing-trends-to-watch-in-2026
- [PC-010] **[P2]** AI-driven QA smoke test — game should be playable in ≤ 60 seconds by an automated Playwright run (no tutorial wall, no forced login, no level select required).

---

## CATEGORY 9: PWA / OFFLINE / SERVICE WORKER

### 9.1 Service Worker Registration
- [PWA-001] **[P1]** No stale service worker blocks new game load — when a `sw.js` is updated, hard reload must show new content. **Test**: bump JS cache-bust version, hard reload, verify new version loads. GameZipper uses HTTP cache + meta refresh, not SW, so if SW is added in future, this is critical.
- [PWA-002] **[P2]** localStorage and IndexedDB persistence across page reload — high-score, level-progress, settings (mute, language) survive browser restart. **Test**: play game, set high-score, close tab, reopen, verify score persists. QuotaExceededError must be caught and UI must not crash.

---

## CATEGORY 10: 2026-Q2 LATE-EMERGING THREATS + NEW PLATFORM (R91 — Dynamic Test Intelligence)

### 10.1 Password Manager Clickjacking 2026 (DEF CON 33)
- [S-026] **[P0]** No clickjacking-style UI manipulation — game page must not use `opacity:0`, `pointer-events:none`, or invisible overlays on top of (or below) any element designed to trick users into clicking hidden targets. This includes: ad iframes, GAME BREAK overlay, splash-screen, cookie consent banner, recovery toast. **Test**: grep `gz-cb-overlay|gz-error-toast|splash-screen|cookie-consent` + audit computed style (must be `pointer-events:auto`, `visibility:visible`, `opacity>0` on clickable surfaces). Inspired by DEF CON 33 Marek Tóth disclosure showing 1Password, Bitwarden, LastPass, Enpass, iCloud Passwords, LogMeOnce all vulnerable to autofill data exfiltration. Source: https://dailysecurityreview.com/news/clickjacking-vulnerability-exposes-autofill-data-across-major-extensions
- [S-027] **[P0]** X-Frame-Options / CSP frame-ancestors enforced — no game page can be iframed by `attacker.com` for clickjacking. **Test**: `curl -sI https://gamezipper.com/GAME/` returns `X-Frame-Options: SAMEORIGIN` OR CSP `frame-ancestors 'self'`. Without either, page is trivially iframe-wrapped for clickjacking amplification.

### 10.2 Chrome 149 + Password Manager CVE-2026-11084
- [B-017] **[P0]** Chrome 149+ required for production — Chrome 149 promoted to stable 2026-05 with 429 security patches (a record, including 22 critical + many use-after-free in untrusted input handling) + CVE-2026-11084 (Password Manager cross-origin data leak). **Test**: User-Agent Sniffing checks Chrome version ≥ 149.0.7827.53; out-of-date users get a banner suggesting update. GameZipper itself not directly vulnerable, but any embedded ad iframe using older Chrome puts user credentials at risk. Source: https://securityweek.com/chrome-149-patches-429-vulnerabilities + https://cvefeed.io/vuln/detail/CVE-2026-11084

### 10.3 Safari 26.5 20 WebKit CVEs (CVE-2026-28905–28971) + WebRTC CVE-2026-28944
- [B-018] **[P0]** Safari 26.5+ required for production — 20 WebKit CVEs (memory corruption, OOB read, use-after-free) all fixed in Safari 26.5 / iOS 26.5 / iPadOS 26.5 / macOS Tahoe 26.5. **Test**: UA sniff Safari version ≥ 26.5; out-of-date iOS users shown update banner. CVE-2026-28947 is process crash via malicious web content. WebRTC CVE-2026-28944 patched in same release. Source: https://news.lavx.hu/article/safari-26-5-patches-20-webkit-flaws-and-a-webrtc-crash-bug-what-ios-ipados-and-macos-developers-need-to-know + https://cvefeed.io/vuln/detail/CVE-2026-28847

### 10.4 Safari 26.5 New Web Platform Features
- [B-019] **[P1]** Safari 26.5 `:open` pseudo-class — game UI using `<details>`, `<select>`, `<dialog>`, or `<input>` (date/color picker) can style their open state via `select:open`, `details:open`, `dialog:open` with progressive enhancement (no-op on older browsers). **Test**: verify CSS like `select:open { border-color: skyblue }` applies when dropdown expands on Safari 26.5+. Source: https://webkit.org/blog/17938/webkit-features-for-safari-26-5
- [B-020] **[P1]** Safari 26.5 `Origin` API — `window.origin` now returns a structured `Origin` object (not just a string), with `.scheme`, `.host`, `.port` properties. **Test**: `if (window.origin && typeof window.origin === 'object' && 'host' in window.origin) { ... }` detection; fallback to `window.location.origin` string on pre-26.5 Safari. Source: https://developer.apple.com/documentation/safari-release-notes/safari-26_5-release-notes
- [B-021] **[P1]** Safari 26.5 `ToggleEvent.source` — popover invoker attribution works. Game pages using popover-based menus/settings (e.g. "How to play" popover) can identify which button opened the popover. **Test**: bind popover via `popoverTargetElement` or `popovertarget` attribute, verify `toggleEvent.source` returns the invoker element. Source: https://webkit.org/blog/17938/webkit-features-for-safari-26-5

### 10.5 Chrome I/O 2026 — HTML-in-Canvas API
- [G-017] **[P1]** HTML-in-Canvas API accessibility — when a game uses WebGL/WebGPU/Canvas2D for rendering and embeds HTML UI inside the canvas (Chrome 149+ I/O 2026 feature), the HTML elements remain in the accessibility tree (NVDA/VoiceOver/TalkBack) and accept focus/keyboard input. **Test**: if any game adopts HTML-in-Canvas pattern, run Playwright `page.accessibility.snapshot()` to verify embedded HTML buttons are reachable. Fallback path required for pre-Chrome 149. Source: https://webgpu.com (Google I/O 2026 announcement by Thomas Nattestad)

### 10.6 Safari First-Draw Shader Stall (Unity WebGL pattern)
- [G-018] **[P1]** First-draw shader warmup — games using WebGL/Three.js/Babylon.js must pre-render (instantiate + draw at least one frame during splash) all major shader programs before gameplay starts. Safari's `webglPrepareUniformLocationsBeforeFirstDraw` is synchronous main-thread (~3ms per uniform lookup × 200 uniforms = ~3s freeze). **Test**: on iOS Safari, play any 3D game (e.g. stacker-3d, sushi-stack-3d) for 60s; record timeline; assert no >500ms main-thread stall in first 5s of gameplay. **Mitigation**: render all prefabs into an offscreen 1×1 canvas during splash. Source: https://richardfu.net/unity-webgl-safari-hang-shader-warmup (May 2026 post-mortem)

### 10.7 Origin API Tracking-Integrity
- [W-037] **[P2]** Origin API opt-in / fallback — analytics and auth code paths that check origin must handle both structured Origin object (Safari 26.5+) and string (legacy). **Test**: in any gz-analytics.js, gz_aa, gz_ab localStorage archive path, ensure `String(window.location.origin || (window.origin && window.origin.toString()) || 'unknown')` is the call pattern; no `window.origin.host` access without `typeof window.origin === 'object'` check. Source: https://webkit.org/blog/17938/webkit-features-for-safari-26-5

### 10.8 Chrome 149 429-Patch Record — Untrusted Input Validation
|- [W-038] **[P1]** No untrusted-input handling that mirrors Chrome 149 CVE pattern — game-data.js / GAMES array entries come from a controlled build pipeline (no runtime user input), but any code that takes query string or localStorage and writes to innerHTML, eval, or `new Function()` is exposed. **Test**: `grep -rn "innerHTML\s*=\|eval(\|new Function(" js/ gamezipper.com/*/index.html | grep -v 'innerHTML = ""'` — must return only safe patterns. Source: https://pcworld.com/article/3158038/chrome-149-fixes-429-security-flaws-the-most-ever-in-one-update.html (majority of 429 patches are use-after-free / insufficient untrusted input validation)

---

## CATEGORY 11: 2026 LATE-Q2 USER SAFETY + PLATFORM (R92 — Dynamic Test Intelligence)

### 11.1 Fake Virus / Scam-Ad IAB Protection (2026 Player-Trust Issue)
- [S-028] **[P0]** No fake-system-alert creatives can hijack gameplay — Malwarebytes 2026-06 reports in-game ad creatives impersonating "Your device is infected!", "iCloud full", "8 viruses detected" scam popups that hijack to malicious lookalike app stores. **Test**: any in-ad iframe rendering on gz-ad-below-game / gz-cb-overlay / Monetag anti-adblock must be checked for the 6 scam-ad telltales: (a) "Click OK to install" CTA, (b) countdown timer with "device lockup in 2 minutes", (c) iOS/Android system-alert chrome spoof, (d) App Store / Play Store lookalike domain, (e) `display:none` parent over real iframe (forced click), (f) `window.opener` redirect to a non-monetag.com domain. GameZipper must sandbox iframe + use `referrerpolicy="no-referrer"` + Content-Security-Policy `frame-src https://*.monetag.com` to scope iframe source. Source: https://malwarebytes.com/blog/mobile/2026/06/fake-virus-alerts-are-invading-mobile-games
- [S-029] **[P0]** Ad iframe content is sandboxed with `sandbox="allow-scripts allow-same-origin"` (no `allow-top-navigation`, no `allow-popups`) — defense-in-depth against ad creative forcing parent navigation. **Test**: `grep -rE 'monetag|googlesyndication|adnxs|adsterra' gamezipper.com/*/index.html` shows ad containers; verify the injected `<iframe>` has `sandbox` attribute with no `allow-top-navigation`. Grep audit must show 0 ad-related `window.open` / `location.assign` / `window.top.location` calls in shipped JS. (Complements W-022 mixed-content, S-027 frame-ancestors, and S-026 clickjacking rules in v1.5.0.)

### 11.2 Chrome 149 = 429-Patch Record + 22 Critical (Forbes Confirmation)
- [B-022] **[P0]** Chrome 149+ required with critical-CVE banner — Forbes 2026-06-05 confirms Chrome 149 patches 429 vulnerabilities including 22 critical; 3.5B users affected. **Test**: User-Agent sniffing on game page checks Chrome version ≥ 149.0.7827.53; below that shows a non-blocking banner "Your browser has unpatched security flaws — please update Chrome" linking to chrome://settings/help. Banner must NOT prevent gameplay (defer logic, not show-recovery-toast). Source: https://forbes.com/sites/daveywinder/2026/06/05/google-chrome-149-new-update-fixes-429-security-flaws-22-critical

### 11.3 WebGPU Compatibility Mode (Chrome 146+, Feb 2026) — Progressive Hardware Reach
- [B-023] **[P1]** WebGPU games gracefully fall back to WebGL on pre-Chrome-146 or older-GPU devices — Chrome 146 (Feb 2026) ships a new opt-in `compatibilityMode: true` adapter request that runs WebGPU on OpenGL ES 3.1 / Direct3D 11 hardware, widening device reach. **Test**: any game requesting `navigator.gpu.requestAdapter({ compatibilityMode: true })` must catch `null` adapter return + fall back to WebGL2 (`canvas.getContext('webgl2')`); never throw an unhandled promise rejection. Verify on Linux Mesa 22.0 / Windows 7 SP1 / iOS 17 Safari (pre-WebGPU). Source: https://developer.chrome.com/blog/new-in-webgpu-146
- [G-019] **[P1]** WebGPU adapter capability detection must include `compatibility-mode-capable` feature check — games opting into the new reach must call `adapter.features.has('core-features-and-limits')` or check the feature list explicitly. **Test**: stub `navigator.gpu.requestAdapter` to return an adapter without `compatibility-mode-capable`; assert game falls back to WebGL instead of crashing on first `device.createBindGroup()`. Source: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status

### 11.4 Safari 26 Metal-Based WebGPU vs Chromium Dawn (Real-Mac Test Gap)
- [B-024] **[P1]** Safari 26 Metal-based WebGPU produces different visual outcomes vs Chromium Dawn — 2026 Remote Mac M4 testing reveals ~8% WebGPU shader parity gap (Safari 26 100/100 vs Chromium 92/100 vs Firefox 88/100 on identical scene). **Test**: any game using `navigator.gpu` for fragment shaders must be Playwright-tested on real macOS (headful mode, `channel: 'webkit'`, Apple Silicon M-series) before claiming 2026 production-readiness; visual diff tolerance must be ≥5% (not pixel-perfect) for WebGPU scenes. CI without real Mac hardware will miss up to 15% of Metal-pipeline rendering bugs per Khronos 3D-on-Web 2026 GDC report. Source: https://macwww.com/en/blog/articles/2026-safari-compatibility-testing-playwright-remote-mac.html + https://khronos.org/assets/uploads/developers/presentations/3D_on_the_Web_2026_-_GDC_2026_WebGL%2BWebGPU_Update.pdf
- [P-018] **[P2]** P3 HDR color-profile render verification — Safari 26 supports full P3 HDR color (100/100); Chromium Mac is only 85/100. **Test**: if any game has HDR-bright UI (winning state, neon effect, gold coin), assert `getColorProfile()` returns `'display-p3'` on real Mac Safari; on non-HDR displays or Chromium Mac, fall back to sRGB. Source: same MacWww 2026 scorecard

### 11.5 Ad-Blocker Detection Anti-Pattern (2026 Forced-App Backlash)
- [PC-011] **[P0]** No ad-blocker detection wall or anti-adblock full-page block — Reddit 2026-05 deployed an unskippable mobile-web overlay forcing users to install the app; class action and regulator attention followed. **Test**: in Kachilu with uBlock Origin + AdBlock Plus enabled, load 5 game pages; assert (a) no `body.adblocked` overlay, (b) no console error redirect, (c) no "Please disable ad blocker" modal blocking input, (d) game remains playable; (e) ad containers may degrade silently (no fill) but must NOT escalate to full-screen modal. GameZipper's policy: ad-block users get degraded experience, not blocked experience. Source: https://business20channel.tv/reddit-blocks-mobile-web-users-2026-forced-app-strategy-spar-10-may-2026 + https://futurism.com/future-society/how-to-get-rid-of-reddit-app-popup

### 11.6 IAB TCF v2.2 Consent String + GDPR Hardening (2026 EU Standard)
- [S-030] **[P1]** IAB TCF v2.2 consent string present on ad-call URLs — IAB Europe TCF v2.2 (mandatory from 2025-11) requires `&gdpr=1&gdpr_consent=<TCF v2.2 base64url string>` to be appended to any vendor call. **Test**: open Network tab on any game page, find the Monetag/AdSense bid request URL, assert `gdpr_consent` parameter is present and starts with `CO-` (TCF v2.2 prefix) or `COty` for the TCF v2.2 spec. If not, EU users are shown non-compliant ads → €20M+ GDPR fine risk. **Mitigation**: integrate a CMP (Cookiebot / Quantcast / IAB-认可的 TCF v2.2 provider) before ad load. (No current site-side CMP detected.)

### 11.7 Sandboxed Ad Iframe Hardening (Layered Defense)
- [S-031] **[P1]** Ad iframe + `referrerpolicy="no-referrer"` + `credentialless` — for gz-ad-below-game and any future gz-ad-mid-grid ad, the iframe must be hardened against (a) referrer leakage to ad networks, (b) storage/cookie access via parent origin (credentialless flag), (c) clickjacking via top-navigation. **Test**: in Playwright, inspect `<iframe>` under `gz-ad-below-game`; assert `referrerpolicy="no-referrer"`, `credentialless`, and `sandbox="allow-scripts allow-same-origin"` (no allow-popups, no allow-top-navigation). This complements S-027 (frame-ancestors), S-029 (sandbox), and S-026 (clickjacking UI).

### 11.8 MDN Memory Pressure CDP Test (2026 Performance Regression)
- [P-019] **[P2]** Game playable under memory pressure — Chrome 130+ Memory Saver and CDP `Emulation.setPressureNotificationsOverride` can simulate memory pressure to test graceful degradation. **Test**: in Playwright with `client.send('Emulation.setPressureNotificationsOverride', { level: 'critical' })`, play any Top 30 game for 60s; assert (a) no tab freeze > 2s, (b) no canvas black-frame, (c) game state preserved. Real 2026 user environment: low-end Android phones with 4GB RAM + 15+ tabs open. Source: https://developer.chrome.com/release-notes/130 + MDN Performance.measureUserAgentSpecificMemory()

---

## LIBRARY METRICS (v1.6.0)
- Total test cases: **222** (was 211 in v1.5.0, +11 in v1.6.0)
- P0: 66 → 70 (+4: S-028 scam-ad, S-029 ad sandbox, B-022 Chrome 149 banner, PC-011 anti-adblock wall)
- P1: 82 → 87 (+5: B-023 WebGPU compat mode, G-019 adapter feature check, B-024 Safari 26 Metal vs Dawn, S-030 TCF v2.2, S-031 sandbox+referrerpolicy+credentialless)
- P2: 52 → 54 (+2: P-018 P3 HDR color profile, P-019 memory pressure CDP)
- P3: 11 → 11 (no new)
- Categories: 11 (added Category 11: 2026 Late-Q2 User Safety + Platform R92)
- v1.6.0 delta: 2 scam-ad IAB (S-028/029 Malwarebytes 2026-06), 1 Chrome 149 banner (B-022 Forbes), 2 WebGPU compat mode (B-023/G-019 Chrome 146), 2 Safari 26 Metal vs Dawn (B-024/P-018 Mac M4 testing), 1 anti-adblock wall (PC-011 Reddit 2026-05 backlash), 1 TCF v2.2 (S-030 GDPR), 1 sandbox hardening (S-031), 1 memory pressure CDP (P-019 MDN)
- Coverage: 100% (7 dimensions from user policy + 2026-Q2 industry research + GDC 2026 GASIG + R91 May 2026 late-emerging threats + R92 June 2026 player-safety + platform-matrix)


## Test Case Update Protocol
1. Every 4 hours: auto-search web for new browser/game/security issues
2. Add 5-10 new test cases per search
3. Bump version (e.g. v1.0.0 → v1.1.0)
4. Commit to /test-library/CHANGELOG.md
5. Update cron jobs to use new version

## Coverage Matrix (which categories apply to which test type)
| Category | Static Scan | Kachilu 1× | Kachilu 10× | Playwright 3-iter | Manual |
|----------|------------|-----------|-------------|---------------------|--------|
| 1. Website | ✓ | ✓ | - | - | - |
| 2. Individual Game | ✓ | ✓ | ✓ (P0 cases) | ✓ (P0/P1) | - |
| 3. Cross-Device | - | - | - | ✓ | ✓ |
| 4. Performance | - | - | - | ✓ | ✓ |
| 5. Security | ✓ | - | - | - | - |
| 6. Industry-Specific | - | ✓ | ✓ | - | - |
| 7. Accessibility (WCAG 2.2) | ✓ | - | - | ✓ (A-001 dark mode, A-003 thumb zone) | ✓ (A-002 contrast, A-004 ARIA) |
| 8. 2026-Q2 Emerging Threats (R89) | ✓ | ✓ | ✓ (B-009/010/011 CVE probes) | - | ✓ (B-016 Interop matrix) |
| 9. PWA / Offline / Service Worker | - | ✓ | ✓ (PWA-002 state persist) | ✓ (PWA-001 SW update flow) | - |
| 10. 2026-Q2 Late-Emerging Threats (R91) | ✓ | ✓ | ✓ (S-026/027 clickjack, B-017/018 CVE probes) | - | ✓ (W-037/038 platform matrix) |
| 11. 2026 Late-Q2 User Safety + Platform (R92) | ✓ | ✓ | ✓ (S-028/029 scam-ad, S-030 TCF v2.2, S-031 sandbox) | ✓ (B-023 WebGPU compat, B-024 Safari 26, P-019 memory pressure) | ✓ (PC-011 anti-adblock + P-018 P3 HDR) |
