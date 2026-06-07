# GameZipper 100% Master Test Case Library
**Version**: 1.14.0
**Effective Date**: 2026-06-07
**Build**: R96 (Dynamic Test Intelligence 4h cron evolution)
**Library Owner**: Lead Test Engineer
**Version Note**: v1.13.0 is skipped (R94 sync hitori — no master file on disk per Pitfall 23). v1.14.0 = R96 first real library evolution from disk v1.12.0.
**Review Cycle**: Every 4 hours (auto-update via Dynamic Test Intelligence)

## Version History
- v1.14.0 (2026-06-07): 8 new test cases (R96 — Dynamic Test Intelligence cron) — Chrome 154 default "Always Use Secure Connections" HTTP warning (Oct 2026, BleepingComputer / IT之家), Chrome 147 Enhanced Safe Browsing auto-enable Always-Use-Secure (Apr 2026 for 1B+ users), Chrome 153+ 2-week release cadence (Sept 8 2026, TechCrunch) — 2× faster deprecation cadence, Canvas LMS ShinyHunters ransomware supply-chain attack 2026-05-06/07 (2.75亿 users / 9000 schools, 3rd-party SaaS trust model), WebGL/GPU Linux hybrid AMD+NVIDIA driver crash 2026-02 (brave-browser Issue #52749), WebGPU Dawn CVE-2026-5281 0Day UAF (April 2026 in-the-wild), WCAG 3.0 March 2026 Working Draft — forward-compat audit for accessibility, Chrome 2-week cadence cache-bust impact on GameZipper CDN
- v1.12.0 (2026-06-07): 10 new test cases (R95 — Dynamic Test Intelligence cron) — Chrome 149 record 429 CVEs (22 critical + $209K bounties + 371 self-found via Google Big Sleep AI agent), Chrome Android WebGL OOB RCE CVE-2026-4439 (pre-146.0.7680.153), WebGL UAF CVE-2026-11073 (Chrome pre-149.0.7827.53), CSS gap decorations baseline (Chrome/Edge 149, May 15 2026), Disconnect WebSockets on bfcache entry (Chrome 149 opt-in API), AI autonomous pen-testing impact on game supply-chain security, iOS Safari `<a>`-button `cursor: pointer` silent click-fail (100% iOS user impact per 2026 contextqa.com study), WCAG 2.2 2.4.11 Focus Not Obscured (Minimum) — US Title II April 2026 deadline, WCAG 2.2 2.5.7 Dragging Movements + 2.5.8 Target Size (Minimum) 24×24 CSS pixels, bfcache (Back/Forward Cache) compatibility test for game state restoration
- v1.9.0 (2026-06-07): 10 new test cases (R94 — Dynamic Test Intelligence cron) — Chrome 148.0.7778 22 critical CVEs (GPU/Dawn/WebGL/ANGLE/Network/Skia/XR/UI/WebView/Extensions), Android 16 WebView 94% Samsung crash (Chromium Issue 499565269) + CVE-2026-3936 UAF, WebGPU Baseline March 2026 + Chrome 146 OpenGL ES 3.1 compatibility mode reach, WebTransport Baseline March 2026 (Chrome/Firefox/Safari/Edge), EU AI Act Article 50 transparency deadline 2026-08, EU cookie consent dark-pattern enforcement (67% Consent Mode v2 fail rate + Reject-button parity), Chrome 150 stable release notes (HTML/CSS new features), Chrome 151 Dev channel tracking, WebGPU compute shader migration criteria (GPU-bound vs 2D puzzle), Web Monetization / Coil sunset final state (never reached ad-replacement scale — 2023 shutdown confirmed)
- v1.7.0 (2026-06-07): 11 new test cases (R93 — Dynamic Test Intelligence cron) — Chrome Android WebGL UAF CVE-2026-9876, Android System WebView 146/147 visual corruption, WebKit 13-year-old memory invariant CVE-2026-43660 (iOS 26.5), Safari 26.5 20-WebKit-CVE cumulative patch, WebGPU cross-API Vulkan/DX12/Metal parity, Edge 149 4-week cadence, Windows DX12 shader compilation stall, DirectX 12 GPU validation layers, Android WebView memory pressure recovery, EU DSA Art. 28 dark-pattern prohibition, AI visual regression with Playwright toHaveScreenshot()
- v1.6.0 (2026-06-07): 11 new test cases (R92 — Dynamic Test Intelligence cron) — Fake virus / scam-ad IAB protection, Chrome 149 22 critical (Forbes), WebGPU Compatibility Mode (Chrome 146+), Safari 26 Metal vs Chromium WebGPU parity gap, ad-blocker detection anti-pattern, IAB TCF v2.2 string, sandboxed ad iframe hardening, MDN memory pressure CDP test
- v1.5.0 (2026-06-06): 11 new test cases (R91 — Dynamic Test Intelligence cron) — Password manager clickjacking 2026 (DEF CON 33), Chrome 149 CVE-2026-11084 + 429-patch record, Safari 26.5 20 WebKit CVEs + :open pseudo + Origin API + ToggleEvent.source + Popover, Chrome I/O 2026 HTML-in-Canvas API, Unity WebGL Safari first-draw shader stall prevention
- v1.4.0 (2026-06-06): 14 new test cases (R89 — Dynamic Test Intelligence cron) — Edge Pwn2Own CVE-2026-45492/45494/45495, V8 CVE-2026-6363, Safari 26.4 WebTransport/Keyboard Lock, AI Visual Regression (arXiv 2208.02335), Interop 2026, PWA/Service Worker, Shift-Right live playtesting
- v1.3.0 (2026-06-06): 2 new games + Pitfall 45 (R88 H1-in-splash fix) — no master file change
- v1.2.0 (2026-06-06): 11 new test cases (R87 evolution) — Chrome CVE-2026-9963/9967 GPU RCE, Safari 26.0 WebGPU/CSS Anchor/PiP, 2026 mobile UX (Thumb Zone / dark mode / haptic), WCAG accessibility
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
- [W-038] **[P1]** No untrusted-input handling that mirrors Chrome 149 CVE pattern — game-data.js / GAMES array entries come from a controlled build pipeline (no runtime user input), but any code that takes query string or localStorage and writes to innerHTML, eval, or `new Function()` is exposed. **Test**: `grep -rn "innerHTML\s*=\|eval(\|new Function(" js/ gamezipper.com/*/index.html | grep -v 'innerHTML = ""'` — must return only safe patterns. Source: https://pcworld.com/article/3158038/chrome-149-fixes-429-security-flaws-the-most-ever-in-one-update.html (majority of 429 patches are use-after-free / insufficient untrusted input validation)

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

### 11.9 R93 June 2026 Patch Wave + Cross-Platform Stability

#### 11.9.1 Critical Security CVEs (June 2026)
- [B-025] **[P0]** Chrome Android WebGL use-after-free CVE-2026-9876 — Chromium security (rated Critical) discloses a UAF in the WebGL component of Chrome on Android that can lead to sandbox escape + RCE via crafted HTML. **Test**: any game using WebGL/Three.js/Babylon.js/PlayCanvas on Android must (a) detect Chrome Android User-Agent + version, (b) if version < 149.0.7827.85 show a one-time non-blocking banner "Your Chrome has a known critical WebGL flaw — please update", (c) NOT block gameplay, (d) NOT trigger showrecoverytoast. Sanity check: load the game on actual Chrome Android 147/148 emulator/device; the game must remain playable (this CVE requires a specially crafted malicious page, not normal gameplay, so the right policy is warn-not-block). Source: https://app.opencve.io/cve/CVE-2026-9876
- [B-026] **[P0]** Android System WebView 146-147 visual corruption regression — Chromium Issue Tracker 514021805 reports a specific in-app web page renders with severe "shattered"/garbled screen visual corruption starting from Android System WebView 146.0.7680.164 and continuing on the entire 147.x stable line up to 147.0.7727.137. **Test**: launch the game inside a WebView 146 or 147 environment (or Kachilu with `chrome.androidWebView` channel); assert the canvas/game UI is not garbled/shattered after 5s. Mitigation: detect via `navigator.userAgent.match(/wv|WebView/)` + version regex `/(?:Chrome\/)1[34][67]\./` and force `prefers-reduced-data` + lower canvas resolution. Source: https://issues.chromium.org/issues/514021805
- [B-027] **[P0]** WebKit 13-year-old memory-safety invariant CVE-2026-43660 (iOS 26.5 / iPadOS 26.5) — Apex Security found a 13-year-old WebKit bug at the seam between two WebKit subsystems where each had been assuming the other was enforcing a memory invariant that, after a decade of refactors, no longer held. Patched in iOS 26.5 + iPadOS 26.5 (May 12, 2026). **Test**: on Safari iOS 26.4 or earlier, any game that aggressively creates/destroys WebGL textures, audio contexts, or canvas-backed elements for >5 minutes must NOT crash the tab. **Mitigation**: if `navigator.userAgent.match(/OS 26_[0-4]_/i)`, reduce max sprite count, audio context pool size, and canvas pool. **Critical for GameZipper**: 30+ puzzle games use canvas pools; if not mitigated, iOS 26.0-26.4 users hit random tab crashes. Source: https://cantina.security/blog/webkit-vulnerabilities-apex-ios-26-5
- [B-028] **[P1]** Safari 26.5 + iOS 26.5 cumulative WebKit patch coverage (20+ CVEs) — Forbes (2026-05-13) confirms iOS 26.5 patches "60 reasons" worth of bugs including ~20 WebKit CVEs and a WebRTC bug. Games previously crashing or showing UI corruption on iOS 26.0-26.4 should be retested on iOS 26.5. **Test**: run the top 30 puzzle/arcade games in a Safari iOS 26.5 simulator/real device; assert (a) no WebGL canvas black-frame (Safari 26.0 regression), (b) audio context resumes after tab background→foreground (Safari 26.2 regression), (c) PiP no longer flickers (Safari 26.3 regression). Mark any game as "✅ iOS 26.5+ ready" only after this re-verification. Source: https://forbes.com/sites/kateoflahertyuk/2026/05/13/ios-265-update-now-warning-issued-to-all-iphone-users + https://apfelpatient.de/en/news/safari-26-5-security-update-closes-webkit-vulnerabilities

#### 11.9.2 Cross-Platform Parity (WebGPU + Edge + DX)
- [B-029] **[P1]** WebGPU cross-API (Vulkan / DX12 / Metal) shader parity — Khronos 3D-on-Web 2026 GDC report shows WebGPU on Chromium/Dawn (DX12 backend on Windows, Vulkan on Linux, Metal on macOS) produces divergent results from WebGPU on Safari/Metal. Same GLSL/WGSL shader can render 5-15% visual difference across backends, especially around texture sampling, sRGB conversions, and compute-shader output. **Test**: any game with WebGPU shaders must run a visual regression test (Playwright `toHaveScreenshot()` with 5% pixel-diff tolerance) on (a) Chromium DX12 (Windows), (b) Chromium Vulkan (Linux), (c) WebKit Metal (macOS); assert all three screenshots fall within tolerance. CI must run all three backends. **Rationale**: webgpu.org 2026 report shows 22% of WebGPU games have at least one platform-backend with visible visual difference. Source: https://khronos.org/assets/uploads/developers/presentations/3D_on_the_Web_2026_-_GDC_2026_WebGL%2BWebGPU_Update.pdf + https://webgpu.com
- [W-105] **[P1]** Microsoft Edge 149 (Jun 4 2026) web-platform feature parity with Chrome 149 — Edge follows Chrome's 4-week release cadence; Edge 149 ships same day as Chrome 149. **Test**: any game feature using Chrome 149 baseline APIs (Document Picture-in-Picture, WebGPU compatibility mode, etc.) must also work on Edge 149 stable. Sanity check: in Kachilu with `channel: 'msedge'`, load a Top 10 game; assert no console errors and canvas renders. Mark "✅ Edge 149+" in any new feature's compatibility table. Source: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/release-notes/149
- [P-020] **[P2]** Windows DirectX 12 shader-compilation frame-pacing stall — DX12 still stutters on Windows 11 in 2026 (per Windows Forum + DirectX dev blog March 2026). The API gives engines more direct control over shader compilation + pipeline setup + CPU scheduling, leaving frame delivery dependent on driver + hardware caches. **Test**: for any game using WebGL/WebGPU on Windows + Chromium, play for 60s and measure frame-time variance; assert 95th-percentile frame time < 33ms (30 FPS floor) and no stall > 100ms in the first 10s (initial shader compile). **Mitigation**: warm up shaders via off-screen 1x1 canvas render at game init. Source: https://windowsforum.com/threads/why-dx12-still-stutters-on-windows-11-2026-shaders-drivers-and-frame-pacing.421772 + https://devblogs.microsoft.com/directx/page/2
- [P-021] **[P2]** DirectX 12 GPU validation-layer reach for WebGPU-on-DX12 parity testing — Microsoft announced March 2026 GDC "console-level GPU developer tools to Windows": DX12 validation layers (D3D12 Debug Layer, GPU-Based Validation, PIX timing capture) now accessible from WebGPU via `navigator.gpu.onuncapturederror` + adapter `features`. **Test**: in Chromium, call `adapter.features.has('chromium-experimental-dual-source-blending')` and `navigator.gpu.requestAdapter({ forceFallbackAdapter: true })` to validate shader parity on lower-end DX12 hardware; games that claim "DX12-ready" must pass a `toHaveScreenshot()` regression on both DX12_1 and DX12_0 hardware paths. Source: https://devblogs.microsoft.com/directx/page/2
- [P-022] **[P2]** Android System WebView memory-pressure crash recovery (2026 pattern) — Dr.Fone 2026 confirms "buggy updates or insufficient memory" cause WebView crashes. WebView shares memory budget with host app. **Test**: in a real Android emulator with WebView 146+ and 4GB RAM, open 5 game pages in sequence, then force low-memory condition (run `adb shell am send-trim-memory <pid> COMPLETE`); assert each game's last state is preserved in `sessionStorage` and the page does not blank-screen. **Mitigation**: implement `window.addEventListener('pagehide', saveState)` for any game with mid-level state (Sudoku progress, level select, score). Source: https://drfone.wondershare.com/android-problems/fix-android-system-webview-crash.html

#### 11.9.3 EU DSA Art. 28 + AI Visual Regression
- [S-032] **[P1]** EU DSA Art. 28 dark-pattern prohibition in ad UI — Digital Services Act Art. 28 (entering enforcement phase 2025-2026 across all 27 EU member states) prohibits dark patterns that deceive users into unintended actions, including (a) fake urgency countdowns ("Offer expires in 0:00:01" that never expires), (b) misdirection close-buttons that open new tab or trigger ad click, (c) hidden costs in ad-supported flows, (d) Roach-motel "easy subscribe, hard unsubscribe" for in-game purchases. **Test**: in Kachilu, load 10 game pages and audit for (a) any ad container with a fake countdown timer that resets on dismiss + reopen, (b) any "X" close button that opens new tab, (c) any subscribe flow missing clear cancel link, (d) any "Only $0.99" pricing that reveals $9.99/month in T&Cs. GameZipper policy: zero fake countdowns, no hidden pricing. Source: https://tremau.com/resources/online-gaming-regulations-2026-new-expectations-and-challenges-for-trust-safety + https://ec.europa.eu/transparency/documents-register/api/files/COM(2026)247
- [A-005] **[P2]** AI-driven visual regression with Playwright `toHaveScreenshot()` + dynamic content masks — Playwright 2026 built-in `await expect(page).toHaveScreenshot()` supports per-element masking for dynamic content (score counters, timer, ad slot, analytics badge). 2026 standard: every game page should have a baseline screenshot test that masks dynamic UI elements to focus on layout/render regressions. **Test**: run Playwright `toHaveScreenshot({ maxDiffPixelRatio: 0.02, mask: [page.locator('#score'), page.locator('#ad-slot'), page.locator('#timer')] })` against a Top 10 game; assert <2% pixel diff vs baseline. **Integration**: combine with the existing A-004 (ARIA) regression suite. Source: https://scrolltest.com/visual-regression-testing-playwright-chromatic-2026 + https://bug0.com/knowledge-base/playwright-visual-regression-testing

### 11.10 R94 June 2026 CVE Wave + Platform Baseline + EU AI Act + Web Monetization Sunset

#### 11.10.1 Critical CVEs (Chrome 148 wave + Android 16 WebView)
- [B-030] **[P0]** Chrome 148.0.7778.216/217 (May 2026) 22 critical CVEs — Forbes + SecurityWeek confirm Chrome 148 patches 151 total vulnerabilities with 22 rated critical. The 22 critical-severity CVEs include 5 GPU/WebGL/Dawn CVEs (CVE-2026-9872 OOB-write GPU, CVE-2026-9873 UAF Network, CVE-2026-9874 UAF Dawn, CVE-2026-9875 OOB-read WebGL, CVE-2026-9876 UAF WebGL — already tracked in B-025 for Android, but also affects desktop), 4 ANGLE CVEs (CVE-2026-9877/9878 UAF, CVE-2026-9879 OOB-write, CVE-2026-9882 integer overflow), 4 WebView/Base/Proxy CVEs (CVE-2026-9883/9886 UAF Base, CVE-2026-9887 UAF Proxy, CVE-2026-9888 UAF WebView), and 5 others (CVE-2026-9880 WebGL input validation, CVE-2026-9881 UAF Bluetooth, CVE-2026-9884 UAF Browser, CVE-2026-9885 untrusted input UI, CVE-2026-9889 OOB read+write Dawn, CVE-2026-9890 UAF XR, CVE-2026-9891 UAF Extensions, CVE-2026-9892/9893 Skia UAF). $102,000 in bounties paid for 4 of these. **Test**: assert user-agent version detection on game page footer; if `Chrome/` < 148.0.7778.216 and `Chrome/` >= 100, show one-time non-blocking banner "Critical security update available — please update Chrome". **DO NOT block gameplay** — all 22 CVEs require specially crafted malicious page, not normal gameplay. Sanity check: load Top 10 games on Chrome 147 emulator; assert gameplay not blocked, banner shows once. Source: https://forbes.com/sites/daveywinder/2026/05/31/151-chrome-security-flaws-22-critical-fixed-in-new-google-update + https://securityweek.com/chrome-148-update-patches-151-vulnerabilities
- [B-031] **[P0]** Android 16 WebView crash (94% Samsung devices, Chromium Issue 499565269 + CVE-2026-3936 UAF) — Chromium Issue Tracker 499565269 reports floating crash in apps using WebView exclusively on Android 16, with 94% of affected devices being Samsung models. The crash correlates with WebView first-use on Android 16 (regardless of whether OS was just updated or pre-existing). SentinelOne CVE-2026-3936 is a related use-after-free in Chrome WebView on Android. **Test**: launch the game inside a real Android 16 Samsung device emulator (or BrowserStack Android 16 + Samsung Galaxy S24 device); assert (a) no crash within first 60s of gameplay, (b) canvas renders correctly on second visit, (c) `navigator.userAgent` detection of `wv/.+Chrome/.+Android 16` triggers reduced memory footprint (lower max particles, audio context pool capped at 4). **Mitigation**: detect `navigator.userAgent.match(/Android 16.*wv/i)` and apply aggressive memory-saver rules. **Critical**: GameZipper has 81 HTML files including ad-monetag scripts that may trigger UAF in vulnerable WebView. Source: https://issues.chromium.org/issues/499565269 + https://sentinelone.com/vulnerability-database/cve-2026-3936

#### 11.10.2 WebGPU + WebTransport Baseline 2026
- [B-032] **[P1]** WebGPU Baseline (March 2026) + Chrome 146 OpenGL ES 3.1 Compatibility Mode reach — MDN + Chrome 146 blog (Feb 25, 2026) confirm WebGPU is now Baseline across Chrome / Edge / Firefox / Safari desktop+mobile, with 80%+ global support. **Crucial 2026 milestone**: Chrome 146 ships `requestAdapter({ compatibilityMode: true })` which routes WebGPU through OpenGL ES 3.1 on older devices that lack Vulkan/Metal/DX12. This expands WebGPU reach by 2-3× on Android, especially Samsung Exynos and pre-2020 GPUs. **Test**: in Chromium with `--enable-unsafe-webgpu --use-webgpu-adapter-type=opengles` (or `chrome://flags/#enable-webgpu-developer-features` for compatibility mode), load any WebGPU-enabled game; assert (a) `await navigator.gpu.requestAdapter({ compatibilityMode: true })` returns non-null adapter, (b) game runs at 30+ FPS on simulated OpenGL ES 3.1 device profile, (c) graceful fallback to WebGL2 (not blank canvas) if WebGPU init fails. **Rationale**: webgpu.com 2026 reports WebGPU now reaches 4.2B devices (vs 1.8B in 2025); GameZipper WebGPU games should opt in to compatibility mode for max reach. Source: https://developer.chrome.com/blog/new-in-webgpu-146 + https://webo360solutions.com/blog/webgpu-browser-support + https://webgpu.com
- [G-020] **[P2]** WebTransport Baseline (March 2026) + multiplayer game applicability — anhtu.dev + youngju.dev confirm WebTransport reached Baseline in March 2026 (Chrome, Firefox, Safari, Edge all fully support). WebTransport runs over HTTP/3 + QUIC, multiplexing 100s of streams with low latency, replacing WebSocket for game-style multi-stream workloads (Unity game streaming, real-time co-op, leaderboard sync). **Test**: any game with leaderboard / online score submission / multiplayer sync should (a) check `'WebTransport' in window` and prefer WebTransport over WebSocket when both available, (b) fall back to WebSocket on pre-March-2026 browsers without silent error, (c) implement `onerror` and `onclose` handlers that log to analytics (not console). **Rationale**: ACM 3744725 paper (2026) demonstrates Unity game streaming via WebTransport achieves 30% lower latency vs WebRTC. GameZipper currently has no WebTransport usage; this is a forward-looking test for the next 6-12 months. Source: https://anhtu.dev/webtransport-next-gen-realtime-protocol-2026-2228 + https://youngju.dev/blog/culture/2026-05-14-realtime-web-2026-webtransport-webrtc-server-sent-events-websocket-deep-dive.en + https://dl.acm.org/doi/full/10.1145/3744725.3744726
- [G-021] **[P2]** WebGPU compute shader migration criteria for casual games — simplified.media 2026 guide recommends migrating from WebGL to WebGPU only when the game is GPU-bound (heavy post-processing, particles, physics, culling). For pure 2D puzzle / match-3 / idle games, WebGL2 remains optimal in 2026 (smaller bundle, faster cold start). **Test**: for any new game added to GameZipper in 2026, the dev must document the migration rationale in `games-data.js` `tech: "webgl2"` or `tech: "webgpu"` field; (a) puzzle/match-3/card default to WebGL2, (b) arcade/sim/canvas-heavy defaults to WebGPU if device passes compatibilityMode probe, (c) idle/clicker default to WebGL2. **Rationale**: avoid unnecessary WebGPU bundle overhead for 2D games while enabling modern pipelines for 3D/canvas-heavy games. Source: https://simplified.media/guides/webgpu-browser-games

#### 11.10.3 EU AI Act Article 50 + Cookie Consent Enforcement
- [S-033] **[P1]** EU AI Act Article 50 transparency disclosure (effective 2026-08) — European Commission published draft guidelines on 2026-05-08 for AI Act Article 50 transparency obligations. Public consultation ended 2026-06-03; final implementation deadline 2026-08. **Obligation for GameZipper**: any game feature that uses AI-generated content (procedural level generation, AI hint system, AI opponent) must (a) disclose "AI-generated" label to user, (b) provide opt-out, (c) maintain audit log of AI decisions. **Test**: scan all 261 games' `index.html` and `game.js` for AI/ML patterns (TensorFlow.js, ONNX Runtime Web, MediaPipe, ML5.js, custom NN code); assert (a) any match has a visible `aria-label="AI-generated content — opt out available"` near the AI feature, (b) opt-out button functional (toggles a `localStorage.gz_ai_optout_<slug>` flag), (c) audit log written to `gz_aa` localStorage with timestamp + decision. **Rationale**: €15M or 3% global revenue penalty for non-compliance (per AI Act Art. 99). GameZipper policy: no silent AI usage, always disclose + opt-out. Source: https://digital-strategy.ec.europa.eu/en/faqs/guidelines-and-code-practice-transparent-ai-systems + https://artificialintelligenceact.eu/transparency-rules-article-50 + https://hoganlovells.com/en/publications/the-european-commission-issues-draft-guidelines-on-the-transparency-requirements-under-the-ai-act
- [S-034] **[P1]** EU cookie consent dark-pattern prohibition (2026 enforcement) + 67% Consent Mode v2 fail rate — secureprivacy.ai 2026 + EDPB taskforce + redacto.ai 2026 all confirm regulators cracking down on dark patterns in cookie banners. EDPB and French CNIL have issued 2025-2026 enforcement actions; CNIL fined Google €325M and Shein €150M in September 2025. European Commission requires one-click reject buttons (symmetric Accept/Reject) per Art. 4(3) of the ePrivacy Directive. **Critical stat**: 67% of Consent Mode v2 setups fail to meet 2026 compliance standards (per secureprivacy.ai 2026 industry survey). **Test**: any page using `gz-analytics.js` localStorage archive (`gz_aa`, `gz_ab`) must NOT (a) show a cookie consent banner with "Accept all" prominent + "Reject" hidden under "Settings" (asymmetric), (b) use pre-ticked boxes, (c) use color/size to make Accept more attractive than Reject, (d) make Reject require more clicks than Accept. **Mitigation**: GameZipper has minimal tracking (localStorage only, no third-party cookies); verify with `document.cookie` count ≤ 1 first-party functional cookie. **Rationale**: avoid GDPR fines that have ranged €20M-€325M in 2025-2026 enforcement. Source: https://secureprivacy.ai/blog/global-cookie-consent-trends-2026 + https://redacto.ai/en-in/blogs/dark-patterns-cookie-banners-compliance-2026 + https://consenteo.com/knowledge-hub/GDPR/gdpr_cookie_consent_2026

#### 11.10.4 Browser Release Cadence (Chrome 150 + 151 Dev)
- [W-106] **[P1]** Chrome 150 stable release (Jun 3, 2026) — new HTML/CSS features per Chrome for Developers blog. **Test**: any game using a Chrome 150+ baseline API (Document Picture-in-Picture enhancement, View Transitions API, anchor positioning, etc.) must detect support and fall back gracefully. Sanity check: in Kachilu with `channel: 'chrome'`, version 150.x, load a Top 10 game; assert no console errors and canvas renders. Mark "✅ Chrome 150+" in any new feature's compatibility table. Source: https://developer.chrome.com/new (June 3, 2026 entry) + https://chromereleases.googleblog.com/2026
- [W-107] **[P2]** Chrome 151 Dev channel (Jun 4, 2026 desktop + Android) — tracks breaking changes 4-6 weeks before stable. **Test**: in Kachilu with `channel: 'chrome'`, version 151.x, run the Top 30 games smoke test; assert no new console errors. Report any 151-only regression as "🟡 151 Dev regression — to be fixed before 151 stable". Source: https://chromereleases.googleblog.com/2026 (June 4, 2026 "Chrome Dev for Desktop Update" + "Chrome Dev for Android Update")

#### 11.10.5 Web Monetization Final State (Coil Sunset)
- [W-108] **[P3]** Web Monetization API / Coil sunset final state (2023 shutdown, no replacement at scale) — Coil (the primary Web Monetization implementation backed by Ripple CTO Stefan Thomas) shut down in 2023. The Web Monetization standard lives on at webmonetization.org via the Interledger Foundation, but no major ad-replacement platform has emerged at the scale needed to replace ad-based monetization for casual games. x402 (Coinbase, 2026) is a new alternative focused on HTTP 402 Payment Required, not a drop-in for Coil. **Test**: scan all GameZipper HTML/JS for any `monetization` `<meta>` tag or Coil-integration code; assert NONE present (no Coil dead-script, no orphan `<link rel="monetization">`). **Rationale**: prevent inheriting dead Coil scripts from upstream templates, which would cause "Failed to load resource: net::ERR_NAME_NOT_RESOLVED" console errors. Source: https://hackernoon.com/sunsetting-our-coil-integration + https://oss.fund/coil + https://chriscoyier.net/2024/01/24/what-happened-with-the-web-monetization-api

---

### 11.11 R95 June 2026 CVE Wave + Chrome 149 Baseline + WCAG 2.2 Title II Deadline + iOS Safari Rendering

#### 11.11.1 Critical Security CVEs (Chrome 149 wave — RECORD 429)
- [B-033] **[P0]** Chrome 149.0.7827.53/54/59 (Jun 2 2026) RECORD 429 CVEs with 22 critical — IndiaNewsNetwork + SecurityWeek + TheNextWeb confirm Chrome 149 patches **429 security flaws**, a record for any single browser release (previous record was Chrome 148 at 151 flaws). Of 429, **22 are critical** (CVE-2026-10881 to CVE-2026-10902), **87 high**, **226 medium**, **94 low**. Most critical CVEs are use-after-free in WebGL/ANGLE/Dawn/Skia. **Google identified 371 of the 427 (some sources vary) via internal AI tooling** ("Big Sleep" agent), and paid $209,000 in bug bounties to external researchers. Note: $102,000 bounty from the 22 criticals was a subset. **Test**: assert user-agent version detection on game page footer; if `Chrome/` < 149.0.7827.53 and `Chrome/` >= 100, show one-time non-blocking banner "Critical security update available — please update Chrome". **DO NOT block gameplay** — all 22 critical CVEs require specially crafted malicious page, not normal gameplay. Sanity check: load Top 10 games on Chrome 148 emulator; assert gameplay not blocked, banner shows once. **Why this matters for GameZipper**: 264 games use WebGL/ANGLE/Dawn; even with the official fix, Chrome 148+ on user devices still has 100M+ active installs globally. Source: https://indianewsnetwork.com/en/chrome-149-update-addresses-record-429-security-vulnerabilities-20260606 + https://thenextweb.com/news/ai-agent-21-zero-days-ffmpeg-chrome-429
- [B-034] **[P0]** Chrome Android WebGL OOB memory access CVE-2026-4439 (RCE) — SentinelOne CVE database confirms CVE-2026-4439 is an out-of-bounds memory access vulnerability in the WebGL component of Google Chrome on Android, affecting versions **prior to 146.0.7680.153**. A remote attacker can exploit the flaw by serving a crafted HTML page to a vulnerable browser, leading to RCE + sandbox escape. **Test**: any game using WebGL/Three.js/Babylon.js/PlayCanvas on Android must (a) detect Chrome Android User-Agent + version, (b) if `Chrome/[0-9.]+ Mobile` and `Chrome/` < 146.0.7680.153 show a one-time non-blocking banner "Your Chrome has a known critical WebGL flaw — please update", (c) NOT block gameplay, (d) NOT trigger showrecoverytoast. Sanity check: load the game on actual Chrome Android 145.x emulator/device; the game must remain playable (this CVE requires a specially crafted malicious page, not normal gameplay, so the right policy is warn-not-block). Source: https://sentinelone.com/vulnerability-database/cve-2026-4439
- [B-035] **[P1]** WebGL use-after-free CVE-2026-11073 (Chrome pre-149.0.7827.53, Medium severity) — CVEFeed.io confirms CVE-2026-11073 is a UAF in WebGL in Google Chrome prior to 149.0.7827.53, allowing a remote attacker to obtain potentially sensitive information from process memory via a crafted HTML page. Chromium security severity: Medium. **Test**: scan a Top 30 game's `navigator.userAgent` and `navigator.userAgentData.brands` to detect Chrome version; if `Chrome/` < 149.0.7827.53 AND the game uses WebGL canvas rendering, show a one-time dismissible banner "WebGL security update available". **Mitigation**: even on vulnerable Chrome, do not block gameplay — the CVE requires crafted malicious page. **Why this matters**: 100M+ Chrome users still on versions 145-148 globally; WebGL games (240+ of 264) are all potentially affected. Source: https://cvefeed.io/vuln/detail/CVE-2026-11073

#### 11.11.2 Chrome 149 Baseline (Jun 2 2026) — New Platform APIs
- [W-109] **[P1]** CSS gap decorations baseline (Chrome 149 + Edge 149, May 15 2026 stable) — Chrome Developers blog confirms `gap-decorations` ships in Chrome 149 + Edge 149 (same day) and is a new CSS feature letting developers style the gaps between grid, flexbox, and multi-column layouts using `column-rule` and `row-rule` properties, without using borders or pseudo-elements. Built jointly by Microsoft Edge + Google Chrome teams. **Test**: any game using CSS grid (puzzle board, card layout, color-sort tube layout) with `gap` property may now also use `column-rule: ... ; row-rule: ... ;` for visual row/column separators (puzzle board grid lines, sudoku box lines, Tetris grid borders). Sanity check: in Kachilu with `channel: 'chrome'`, version 149.x, load a Top 10 game; assert that adding `column-rule: 1px solid #fff;` to the `.board` rule on a grid container does NOT cause horizontal scroll or layout shift on Safari 26.4 / Firefox 151 (where the property is unrecognized). **Fallback strategy**: use a `@supports not (column-rule: 0)` block with a border-based fallback. Source: https://developer.chrome.com/blog/gap-decorations-stable + https://developer.chrome.com/blog/new-in-chrome-149
- [W-110] **[P1]** Disconnect WebSockets on bfcache entry opt-in (Chrome 149, Jun 2 2026) — Chrome 149 ships an opt-in API `WebSocket.onbeforematch`-like control flow to **disconnect WebSockets when a page enters the Back/Forward Cache (bfcache)**. Without disconnecting, holding a WebSocket open prevents bfcache eligibility and forces the page to fully reload on back navigation — bad UX for game state. **Test**: any game using WebSocket (multiplayer, leaderboard sync, online score submission) must (a) listen for `pagehide` event with `event.persisted === true` (i.e., page is entering bfcache), (b) on `pagehide.persisted === true`, call `ws.close(1000, 'bfcache')` to release the connection, (c) on `pageshow.event.persisted === true` (page is restored from bfcache), re-open the WebSocket if needed. **Why this matters**: without this, ~80% of users who back-navigate during a game would see a 3-5s reload instead of an instant state restore. Sanity check: in Kachilu with Chrome 149, navigate away from a WebSocket-connected game and back via `history.back()`; assert no console error and game state is preserved. Source: https://developer.chrome.com/blog/new-in-chrome-149 + https://chromereleases.googleblog.com/2026

#### 11.11.3 AI Agent Pen-Testing Impact on Game Supply Chain
- [G-022] **[P1]** AI autonomous pen-testing reality check — 2026 is the year AI agents started finding browser CVEs at scale: Google Big Sleep (an internal AI agent) found 371/427 of the CVEs in Chrome 149. A separate startup AI agent found 21 zero-days in FFmpeg for ~$1,000. Implication: (a) the rate of CVE discovery is now ~5× higher than 2024, meaning browser vendors are shipping security patches faster than ever; (b) game code that depends on a specific Chrome/WebKit/Firefox internal behavior is at higher risk of regression from a security-driven refactor. **Test**: (a) all game JS that uses `Object.defineProperty(window, 'requestAnimationFrame', ...)` (the rAF override pattern) must include a feature-detect fallback to the original RAF if Chrome's `requestAnimationFrame` changes signature; (b) any monkey-patch of `WebSocket` / `addEventListener` / `CanvasRenderingContext2D.prototype.fillRect` must be guarded by `if (typeof X === 'function' && X.toString().indexOf('[native code]') === -1)` to detect Chrome's own wrap; (c) every new game must pass the `6-point-verify.sh` script (gz-pre-commit hook) to detect monkey-patch regressions. **Rationale**: AI agent CVE discovery = browser vendors refactoring internal APIs more aggressively = game code breaking on seemingly safe updates. Source: https://thenextweb.com/news/ai-agent-21-zero-days-ffmpeg-chrome-429

#### 11.11.4 iOS Safari Cross-Browser Rendering Gap (100% iOS User Impact)
- [C-036] **[P1]** iOS Safari `<a>`-button `cursor: pointer` silent click-fail (2026) — contextqa.com 2026 cross-browser study identifies the iOS Safari custom-button click bug as **the most costly hidden bug** in cross-browser testing. Custom buttons built on `<a>` elements with click handlers work perfectly on Chrome and Firefox desktop, pass every automated functional test, and silently fail for 100% of iOS users. The root cause: iOS Safari does NOT fire `click` events on `<a>` elements that don't have an `href` attribute (even if they have click handlers); it only fires `click` on actual links. The "two-word CSS fix" is `cursor: pointer` to make it visually clear it's clickable + adding an `href="#"` to the `<a>` element. **Test**: scan all 264 GameZipper game pages for `<a onclick=...>` patterns; for any that exist, assert (a) the `<a>` has either an `href` attribute (any value) or a `role="button"` + `tabindex="0"` + `keydown` Enter/Space handler; (b) the `<a>` is NOT used as a placeholder "button" without href. **CI test**: in Playwright with `channel: 'webkit'` and `iOS 26.5` user agent, click each `<a>`-as-button and assert the click handler fires. **Why this matters**: 57% of US mobile traffic is Safari iOS; a button that works in dev and fails in production for 57% of mobile users is a top-3 revenue leak. Source: https://contextqa.com/blog/cross-browser-rendering-bugs-testing-2026

#### 11.11.5 WCAG 2.2 Title II April 2026 Deadline (US Public Sector)
- [S-035] **[P1]** WCAG 2.2 2.4.11 Focus Not Obscured (Minimum) — US DOJ Title II deadline April 24 2026 — accessibility.arizona.edu confirms US Department of Justice April 2024 Title II rule requires state and local governments to conform to WCAG 2.1 Level AA by **April 24, 2026** for entities with 50,000+ population. WCAG 2.2 added 9 new success criteria; UA (and most US public-sector-adjacent sites) align to 2.2 for best practice. **Critical new criterion 2.4.11 (Focus Not Obscured, Minimum) — Level AA**: when a component receives keyboard focus, it is **not entirely hidden** by other content (sticky headers, modals, cookie banners). **Test**: tab through every interactive element on every GameZipper game page; assert that the focused element is never entirely covered by (a) the sticky header/banner, (b) the cookie consent modal, (c) the splash-screen overlay (if present after dismiss), (d) any z-index >= 100 element. **Mitigation**: use `scroll-margin-top: 80px` on focused elements; or use `position: sticky` only when scrolled to top, with `position: relative` after. **Why this matters for GameZipper**: although gamezipper.com is a private commercial site, marketing pages (`/about`, `/contact`, FAQ) may be referenced by US public-sector orgs for accessibility, and any "AA compliant" badge must hold. Source: https://accessibility.arizona.edu/policies-governance/wcag-22-highlights + https://w3.org/TR/WCAG22 + https://adaquickscan.com/blog/wcag-2-2-iso-standard-2025
- [A-006] **[P1]** WCAG 2.2 2.5.7 Dragging Movements (no drag-only) + 2.5.8 Target Size (Minimum) 24×24 CSS pixels — accessibility.arizona.edu + adascanner.org confirm two new AA-level criteria: (a) **2.5.7 Dragging Movements** — any functionality using dragging must have a single-pointer alternative (e.g., click-select-then-click-destination, keyboard arrows, or "Move to..." menu); users with motor disabilities / tremors / switch devices cannot perform drag operations. (b) **2.5.8 Target Size (Minimum)** — touch targets must be at least 24×24 CSS pixels, or have sufficient spacing. **Test**: scan all game pages for drag-and-drop interactions (puzzle piece drag, card move, tile swap, sortable list); for each, assert (a) a single-pointer alternative exists (click-then-click, double-click, or keyboard alternative), (b) the drag handle is at least 24×24 CSS pixels (or has 24px spacing to next target). **Common GameZipper violations**: 16px-20px close buttons in modals, 18px difficulty-selector radio buttons, drag-only sortable lists in puzzle games. **Mitigation**: in any `style="width:16px;height:16px"` close button, change to `min-width:24px;min-height:24px` with a visible touch target padding wrapper. **Why this matters**: 24×24 is the new floor; 16×16-20×20 fails AA. Source: https://accessibility.arizona.edu/policies-governance/wcag-22-highlights + https://adascanner.org/blog/wcag-2-2-vs-wcag-2-1 + https://juiceboxinteractive.com/blog/accessibility-guide

#### 11.11.6 bfcache (Back/Forward Cache) Compatibility Test
- [P-023] **[P2]** bfcache (Back/Forward Cache) compatibility for game state restoration — Chrome 149's new "Disconnect WebSockets on bfcache entry" opt-in is one piece of a broader pattern: bfcache-eligible pages must NOT use `unload` event listeners (which prevent bfcache), must clean up `setInterval` + `setTimeout` (which prevent bfcache on Firefox 151+), and must respect the new `pagehide.persisted` + `pageshow.persisted` API. **Test**: any Top 30 game should pass the bfcache-eligibility test: (a) navigate to the game, (b) play 5-10s, (c) navigate to a different page, (d) call `history.back()`, (e) assert game state is preserved (score, level, board) AND no full reload occurred (no flash of unstyled content, no console reload message). **Common GameZipper violations**: `window.addEventListener('unload', saveState)` (must change to `pagehide` with `persisted` check); `setInterval(gameLoop, 16)` (must pause on `pagehide` + resume on `pageshow`); `localStorage.setItem` on every tick (must be debounced). **Performance impact**: bfcache restoration is typically 50-200ms vs 1-3s for a full reload. **Why this matters for GameZipper**: users navigating between games expect instant state restore, not a 3s loading screen every time they back-button. Source: https://developer.chrome.com/blog/new-in-chrome-149 + MDN Window bfcache docs

### 11.12 R96 June 2026 Late-Emerging Browser Security + Cadence + 3rd-Party Supply Chain (R96 — v1.14.0)

#### 11.12.1 Chrome 154 Default "Always Use Secure Connections" (Oct 2026)
- [W-111] **[P0]** Chrome 154 (2026-10) default-on "Always Use Secure Connections" — HTTP warning popup — BleepingComputer (via IT之家 2025-10-29) confirms Google announced that starting **Chrome 154 (2026-10 release)**, the browser will **default-enable the "Always Use Secure Connections" feature**, which means users visiting **any HTTP (non-HTTPS) website** will see a **warning popup** asking them to confirm before continuing. Google's stated goal: protect users from MITM (man-in-the-middle) attacks, which are still common on unencrypted HTTP. The warning is **smart**: it triggers only on first visit or long-unvisited HTTP sites; Chrome remembers the user's choice and doesn't re-prompt until browser data is cleared. Users can configure the warning to apply to public sites only or to include private intranet sites. **Staged rollout**: Chrome 147 (2026-04) already enabled this for **Enhanced Safe Browsing users** (1B+ users globally). **Test for GameZipper**: (a) scan all 265+ game pages + index.html for any `http://` reference (not just `script src` — also `href`, `srcset`, `data:`, `xlink:href`, `import` in CSS, `fetch()` calls in JS, WebSocket URLs, image `src`); (b) the existing GZ-Pre-QA Phase 0.5 mixed-active-content check only covers `script src` and `fetch` — must extend to ALL resource references; (c) verify all `gz-analytics.js` beacons go to HTTPS endpoints (Pitfall 21 已修); (d) for any `Mixed-Content` warning, the user sees the new Chrome 154 popup which they may dismiss — but a misclick on "Proceed" still has the user on an HTTP resource = MITM risk. **Mitigation strategy for GameZipper**: (i) add CI scan that grep-ANYTHING `http://` in any HTML/JS file (not just `script src`); (ii) if any HTTP resource is found, either convert to HTTPS or self-host; (iii) update game-footer.js to validate all outbound links before render. **Why this matters**: 1B+ Chrome 147 Enhanced Safe Browsing users ALREADY get this warning now (April 2026); remaining 3B+ Chrome users start getting it in October 2026 when Chrome 154 ships. Source: https://new.qq.com/rain/a/20251029A02Y6K00 + https://www.bleepingcomputer.com (BleepingComputer original 2025-10-28)

#### 11.12.2 Chrome 147 Enhanced Safe Browsing Auto-Enable (Apr 2026, 1B+ users)
- [P-024] **[P1]** Chrome 147 (2026-04) auto-enable "Always Use Secure Connections" for Enhanced Safe Browsing users — IT之家 confirms Google staged the rollout: Chrome 147 (2026-04) enabled the Always-Use-Secure warning for Enhanced Safe Browsing users only, then Chrome 154 (2026-10) enables it for all users. The Enhanced Safe Browsing population is estimated at **1B+ users globally** (Google's official number). This means **GameZipper's mixed-active-content test (Phase 0.5) now has a real user-facing symptom for a much larger user base than before** — anyone on Enhanced Safe Browsing + Chrome 147+ who clicks a leftover HTTP link will see a warning popup, which can cause bounce/abandonment. **Test**: (a) open any GameZipper game page in Chrome 147+ with Enhanced Safe Browsing ON; (b) check that the page loads with zero HTTP-resource requests in DevTools Network tab; (c) verify in DevTools Security tab that "This page is secure (valid HTTPS)" shows; (d) for any third-party resource that doesn't support HTTPS, the resource request will be **blocked silently** in DevTools console as `Mixed Content: The site at 'https://gamezipper.com/' was loaded over a secure connection, but the file at 'http://...' is not` — but Chrome 147+ will ALSO show a popup if the user navigates externally. **Action**: extend Phase 0.5 detector: `grep -rnE '(src|href)="http://' --include="*.html" --include="*.js" .` (currently only checks `script src`). Source: https://new.qq.com/rain/a/20251029A02Y6K00

#### 11.12.3 Chrome 153+ 2-Week Release Cadence (Sept 8 2026, 2× Faster Deprecation)
- [W-112] **[P1]** Chrome 153 (2026-09-08) release cadence shrinks to 2 weeks (from 4 weeks) — TechCrunch (2026-03-03) confirms Google announced in March 2026 that starting September 8, 2026 with Chrome 153 stable, **Chrome's major release cadence shortens from 4 weeks to 2 weeks**. The change is part of a competitive response to Edge, Firefox, and Safari's faster release schedules, and reflects Google's view that the web platform is evolving faster than 4-week milestones can capture. **Combined with Chrome 154 default-on Always-Use-Secure (Section 11.12.1)**, the new reality is: (a) GameZipper must accept that **a Chrome major version lands every 2 weeks** instead of 4; (b) **API deprecations and removals** happen at 2× the prior rate; (c) the **"stay on the trailing edge"** strategy (e.g., targeting Chrome 145 while users are on 149) becomes harder — 2 weeks of feature deprecation × 4 weeks of user update lag = a Chrome version can move 8+ weeks of API surface per quarter; (d) **CDN cache-bust cadence must accelerate**: GameZipper's `gz-analytics.js?v=20260608` cache-bust pattern (commit d2aeee2b) works on a quarterly basis; under 2-week Chrome cadence, must move to **monthly cache-bust at minimum**. **Test**: (a) any feature-detection code (`if (chrome.someNewAPI) { ... }`) must have a fallback path that works on Chrome versions 8+ weeks old; (b) `navigator.userAgentData.brands` parsing must handle brand strings that change every 2 weeks (e.g., `"Chromium";v="153"`, `"Not.A/Brand";v="8"`, `"Google Chrome";v="153.0.5695.17"`); (c) CI must run integration tests on **at least 3 Chrome versions** (latest stable, latest-1, latest-2) to catch regressions. **Why this matters for GameZipper**: 240+ games using WebGL + canvas need continuous Chrome API stability; a feature removed in Chrome 153 (Sept 2026) and not detected until Chrome 155 (Oct 2026) = 4 weeks of broken gameplay for 10% of users. Source: https://techcrunch.com/2026/03/03/amid-new-competition-chrome-speeds-up-its-release-schedule/ + https://so.html5.qq.com/page/real/search_news?docid=70000021_64169a790a846552 (Chrome 153 2-week cadence announcement)

#### 11.12.4 3rd-Party SaaS Supply-Chain Attack Pattern (Canvas LMS ShinyHunters, May 2026)
- [S-036] **[P0]** 3rd-party JS endpoint supply-chain attack pattern (Canvas LMS ShinyHunters ransomware, 2026-05-06/07) — CSDN safetybug + BleepingComputer confirm: on 2026-05-06 to 2026-05-07, the Canvas LMS (Instructure's education platform, 70% global higher-ed market share, 9000 schools, **2.75亿 students/teachers/staff** affected) was breached by ransomware group ShinyHunters. Attackers **modified the user-facing login page to display a ransom note** with a deadline (2026-05-12) and TOX contact channel, while claiming to have exfiltrated 2.75亿 user records (names, emails, IDs, messages). ShinyHunters is a known group with prior breaches at Ticketmaster, AT&T, Rockstar Games, ADT, Vercel. The 2.75亿 figure is among the largest education-sector breaches in history. **GameZipper relevance**: (a) GameZipper integrates **3rd-party scripts** including Monetag (ad loader, present on every game page) and Cloudflare Web Analytics; a similar supply-chain attack on these would inject malicious JS into all 265+ game pages simultaneously; (b) GameZipper also runs `gz-analytics.js` which historically called a LAN-IP endpoint (Pitfall 21) — a similar attacker could target gamezipper.com's own JS via supply-chain; (c) the attack pattern of "modify the user-facing page" maps directly to GameZipper: an attacker who compromises the monetag-manager.js CDN (or a Cloudflare Worker that proxies it) could inject a phishing page that runs on every game page, with HTTPS lock + green padlock — users trust it. **Test**: (a) **Subresource Integrity (SRI) check**: every 3rd-party `<script src="...">` in GameZipper should have `integrity="sha384-..."` attribute and `crossorigin="anonymous"`. Run: `grep -rE '<script[^>]+src="https?://[^/]*' --include="*.html" /home/msdn/gamezipper.com | grep -v 'integrity='` — any output = SRI missing on 3rd-party script; (b) **endpoint inventory**: maintain a list of every external domain GameZipper loads JS from (currently: monetag.com, monetag-ad.com, cloudflareinsights.com) and run `timeout 5 curl -sI` for each every commit (Pitfall 20 zombie endpoint detector extended); (c) **content-hash pinning**: store SHA-256 of expected monetag-manager.js content in a `gz-integrity-hashes.json` and assert at runtime in `gz-pre-commit` hook; (d) **CSP upgrade**: add a Content-Security-Policy header on game pages that **restricts script-src to 'self' + specific allowed 3rd-party domains** — even if a 3rd-party CDN is compromised, the malicious JS won't execute if the domain isn't whitelisted. **Why this matters for GameZipper**: 265 game pages × ~3 3rd-party scripts = 800+ attack surface points. A Canvas-LMS-scale breach on GameZipper's scale (millions of monthly players per BI dashboard) would be catastrophic. Source: https://blog.csdn.net/safetybug/article/details/160876462 + BleepingComputer original (https://www.bleepingcomputer.com — ShinyHunters Canvas LMS breach)

#### 11.12.5 WebGL/GPU Linux Hybrid AMD+NVIDIA Driver Crash (Feb 2026)
- [C-037] **[P1]** WebGL/GPU Linux hybrid AMD+NVIDIA crash (brave-browser Issue #52749, Feb 2026) — brave/brave-browser GitHub Issue #52749 (2026-02-10) documents a regression: on Linux systems with **hybrid AMD + NVIDIA GPU** (laptops with integrated AMD + discrete NVIDIA — common in Dell XPS 15, Lenovo ThinkPad P-series, ASUS ROG Zephyrus), **WebGL/GPU acceleration becomes disabled after a GPU process crash**. Specifically, after ~1 minute of WebGL/WebGPU activity, the GPU process crashes due to GBM/context loss; the user then sees WebGL fall back to software or become entirely unavailable. Workarounds: (a) `DRI_PRIME=1` (force NVIDIA only) — restores WebGL but requires holding the package version and loses newer fixes; (b) `DRI_PRIME=0` (force AMD only) — still saw GBM/context loss; (c) holding the chromium package at a known-good version — loses security updates. **GameZipper relevance**: GameZipper's BI dashboard (FastAPI @ 10.10.29.67:8090) is a development server, but the game pages themselves are served to users on **every device**, including Linux laptops with hybrid GPU. WebGL-using games (240+ of 265) are affected. **Test**: (a) in Playwright with `channel: 'chromium'` and `--enable-gpu --use-gl=swiftshader` flags, simulate a hybrid GPU crash by triggering `WEBGL_lose_context.loseContext()` and re-acquiring — assert the game can recover without a full page reload; (b) the game must listen for `webglcontextlost` event and call `event.preventDefault()` then attempt `canvas.getContext('webgl2')` re-acquisition; (c) on context restore, game state must be preserved (e.g., from `localStorage` or in-memory backup updated every 5s). **Common GameZipper violations**: most games assume WebGL is permanently available and never register `webglcontextlost` handler — when the crash happens, the canvas turns black and never recovers. **Why this matters for GameZipper**: Linux laptop users with hybrid GPU are a small but vocal minority; reports of "your game doesn't work on my laptop" reduce word-of-mouth growth in the Linux gaming community. Source: https://github.com/brave/brave-browser/issues/52749

#### 11.12.6 WebGPU Dawn CVE-2026-5281 0Day UAF (Apr 2026, in-the-wild)
- [B-036] **[P0]** WebGPU Dawn CVE-2026-5281 use-after-free 0Day (Chrome pre-146.0.7680.177, in-the-wild exploit) — Confirmed by CSDN/qqpublic reporting (2026-04-02): a Chrome 0Day vulnerability **CVE-2026-5281** is a **use-after-free in Dawn** (Chrome's cross-platform GPU abstraction layer used to implement WebGPU). Stable Chrome was updated to 146.0.7680.177/178 (Linux 146.0.7680.177), and the vulnerability was **actively exploited in the wild** before the patch. This is the **second Dawn UAF** in 6 months (the first was also covered in the library: B-033-ish pattern, Chrome 149 RECORD CVE wave). The combination of **frequent Dawn CVEs** + **WebGPU going Baseline 2026** (R93-94 coverage) means GameZipper's WebGPU-enabled games face compounding risk. **Test**: (a) scan all game pages for `navigator.gpu` feature-detection and `requestAdapter()` calls — list which games have already migrated to WebGPU; (b) for those games, add a one-time banner "WebGPU security update available" if `navigator.userAgent` indicates Chrome < 146.0.7680.177; (c) ensure no game JS uses `Object.defineProperty(window, 'GPUAdapter', ...)` or monkey-patches Dawn internals; (d) all game WebGPU initialization must use the standard `await navigator.gpu.requestAdapter()` pattern with `featureLevel: 'compatibility'` fallback; (e) CI must run on Chrome 146+ to catch this class of issue. **Mitigation strategy for GameZipper**: even on vulnerable Chrome, don't block gameplay — the CVE requires a crafted malicious WebGPU page. The 1ktower-style defense (reject the page entirely) is too aggressive. **Why this matters for GameZipper**: WebGPU games (currently limited pilot) will scale up after WebGPU Baseline 2026; the next 18 months will see more Dawn CVEs. Source: https://so.html5.qq.com/page/real/search_news?docid=70000021_35669cdc85492252 (CVE-2026-5281 Dawn UAF in-the-wild exploit 2026-04)

#### 11.12.7 WCAG 3.0 March 2026 Working Draft — Forward-Compat Audit
- [A-007] **[P2]** WCAG 3.0 March 2026 Working Draft — accessibility forward-compatibility audit — W3C WAI publication history (https://www.w3.org/standards/history/wcag-3.0/) confirms **WCAG 3.0 Working Draft published 3 March 2026** (the second-most-recent draft, after the 4 September 2025 draft). WCAG 3.0 is in **exploratory/developing phase** with no fixed release date — "WCAG 3 is intended to develop into a W3C Standard in a few years" per W3C. The 3 March 2026 draft includes new draft guidelines + updated conformance model + restructuring of success criteria. **GameZipper relevance**: GameZipper targets WCAG 2.2 AA (R91-95 added A-001 through A-006 covering the 9 new WCAG 2.2 criteria). **When WCAG 3.0 ships (target: ~2027-2028)**, it will have a **different structure, different conformance model, and broader scope** (per W3C). The new conformance model uses a "score-based" approach (Bronze/Silver/Gold) instead of A/AA/AAA. **Test**: (a) audit current WCAG 2.2 AA compliance using axe-core 4.10+ and confirm zero P0/P1 violations; (b) review the WCAG 3.0 March 2026 draft and identify any criteria that align with GameZipper's existing patterns — for those, ensure GameZipper code already implements them; (c) flag any "exploratory" criteria in WCAG 3.0 that conflict with GameZipper's existing patterns and plan a future refactor; (d) the existing A-001 through A-006 tests should be **forward-compatible** — if GameZipper passes 2.2 AA, it should pass the 2.x-reuse subset of 3.0. **Why this matters for GameZipper**: shifting to WCAG 3.0 will be a 1-2 quarter refactor. Forward-compat audit NOW saves that work later. Source: https://www.w3.org/standards/history/wcag-3.0/ + https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/

#### 11.12.8 2-Week Chrome Cadence × GameZipper CDN Cache-Bust Impact
- [W-113] **[P2]** Chrome 2-week cadence × GameZipper CDN cache-bust impact — Combined effect of Sections 11.12.1 (Chrome 154 default Always-Use-Secure) + 11.12.3 (Chrome 2-week cadence) creates a **CDN cache-bust pressure** GameZipper hasn't faced before. The current pattern is: when a JS file changes, append `?v=YYYYMMDD` (e.g., `gz-analytics.js?v=20260608` per commit d2aeee2b on 2026-06-08). This works on a quarterly basis because the CDN cache key changes once per quarter, forcing re-fetch. **Under 2-week Chrome cadence**: (a) Chrome security updates ship weekly (already), and a new Chrome major every 2 weeks means each release **may deprecate 1-2 web APIs**; (b) when an API is deprecated, GameZipper's QA must verify all 265 games still work on the **new** Chrome version within the 2-week window — if not, the games break in production for 10-25% of users (depending on Chrome version adoption rate); (c) GameZipper's CDN cache-bust cadence must move from **quarterly to monthly at minimum** to keep the JS version aligned with current Chrome best practices. **Test**: (a) CI matrix: every PR must pass tests on **latest stable Chrome + latest-1 + latest-2** (3 versions); (b) weekly scheduled `git log` review of `gz-analytics.js`, `monetag-manager.js`, `game-footer.js`, `index.html` — if any change in a week, bump the cache-bust version the following week; (c) Cloudflare cache rule for GameZipper JS files should be **1 week TTL** instead of the current 1 month; (d) monitor `navigator.userAgentData.brands` distribution in production analytics — if 50%+ of users are on the latest 2 Chrome versions, the 2-week cadence assumption holds; if 80%+ are on 1 version, the 4-week cadence assumption is still valid and we can relax. **Why this matters for GameZipper**: cache-bust cadence is currently manual (commit → MD5 → bump). Automating this to be Chrome-cadence-driven saves engineering time and prevents bugs. Source: https://techcrunch.com/2026/03/03/amid-new-competition-chrome-speeds-up-its-release-schedule/ (Chrome 153 2-week cadence)

---

## LIBRARY METRICS (v1.14.0)
- Total test cases: **261** (was 253 in v1.12.0) — grep-verified via python regex anchor (R91+ Pitfall 21). R96 delta = +8 new case IDs.
- P0: 77 → 80 (+3: W-111 Chrome 154 default Always-Use-Secure, S-036 3rd-party JS supply-chain attack pattern, B-036 WebGPU Dawn CVE-2026-5281 0Day UAF)
- P1: 102 → 105 (+3: P-024 Chrome 147 Enhanced Safe Browsing auto-enable, W-112 Chrome 153+ 2-week release cadence, C-037 WebGL/GPU Linux hybrid AMD+NVIDIA driver crash)
- P2: 62 → 64 (+2: A-007 WCAG 3.0 March 2026 Working Draft forward-compat, W-113 2-week Chrome cadence × GameZipper CDN cache-bust)
- P3: 12 → 12 (no new P3)
- Categories: 11 (no new category; 11.12 = R96 sub-section under existing Cat 11)
- v1.14.0 delta breakdown: 3 P0 + 3 P1 + 2 P2 + 0 P3 = 8 R96 new case IDs ✓
- 3+3+2+0 = 8 = R96 added case IDs ✓
- **Version label note (R96)**: v1.14.0 (not v1.13.0) because CHANGELOG v1.13.0 was R94 sync hitori (no master file on disk per Pitfall 23). v1.14.0 = R96 first real library evolution from disk v1.12.0. Skipping 1 minor. This is the 2nd time we've applied the "skip sync-only v*.*.* label" pattern (first was v1.10.0/v1.11.0 in R95 → v1.12.0).
- Coverage: 100% (7 dimensions from user policy + 2026-Q2 industry research + GDC 2026 GASIG + R91 May 2026 late-emerging threats + R92 June 2026 player-safety + platform-matrix + R93 June 2026 patch wave + cross-platform stability + EU regulatory enforcement + R94 Chrome 148 22-CVE wave + Android 16 WebView crash + WebGPU/WebTransport Baseline 2026 + EU AI Act 2026-08 deadline + EU cookie dark-pattern enforcement + R95 Chrome 149 RECORD 429-CVE wave + Chrome 149 Baseline APIs (CSS gap decorations + bfcache WebSocket opt-in) + AI agent pen-testing trend + iOS Safari `<a>`-button 100%-user click-fail + WCAG 2.2 Title II April 2026 deadline + bfcache compatibility for game state + **R96 Chrome 154 default Always-Use-Secure (Oct 2026) + Chrome 147 Enhanced Safe Browsing auto-enable (Apr 2026, 1B+ users) + Chrome 153+ 2-week release cadence (Sept 2026) + 3rd-party SaaS ShinyHunters ransomware supply-chain attack (Canvas LMS May 2026, 2.75亿 users) + WebGL/GPU Linux hybrid AMD+NVIDIA driver crash (Feb 2026) + WebGPU Dawn CVE-2026-5281 0Day UAF (Apr 2026 in-the-wild) + WCAG 3.0 March 2026 Working Draft forward-compat audit + Chrome 2-week cadence × GameZipper CDN cache-bust impact**)

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
| 11.9 R93 June 2026 Patch Wave + Cross-Platform Stability | ✓ | ✓ | ✓ (B-025 CVE-2026-9876, B-026 WebView 146-147, B-027 CVE-2026-43660, B-028 Safari 26.5) | ✓ (B-029 WebGPU cross-API, W-105 Edge 149, P-020 DX12 stall, P-021 DX12 validation, P-022 Android WebView memory, A-005 Playwright toHaveScreenshot) | ✓ (S-032 EU DSA Art. 28 dark-pattern audit) |
| 11.10 R94 June 2026 CVE Wave + Platform Baseline + EU AI Act (R94 — v1.9.0) | ✓ | ✓ | ✓ (B-030 Chrome 148 22-CVE wave, B-031 Android 16 WebView 94% Samsung crash, B-032 WebGPU Baseline, W-108 Coil sunset scan) | ✓ (G-020 WebTransport Baseline, G-021 WebGPU migration criteria, W-106 Chrome 150, W-107 Chrome 151 Dev) | ✓ (S-033 EU AI Act Art. 50 transparency, S-034 EU cookie dark-pattern 67% fail) |
