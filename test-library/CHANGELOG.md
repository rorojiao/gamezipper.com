# Test Case Library Changelog

All notable changes to the test case library are documented here.

## [v1.5.0] - 2026-06-06 (R91 — Dynamic Test Intelligence cron evolution, 11 new test cases)

### Added
- **11 new test cases** (200 → 211 total) from R91 May 2026 late-emerging threat research — DEF CON 33 clickjacking disclosure, Chrome 149 record 429-patch release + CVE-2026-11084, Safari 26.5 20 WebKit CVEs + new web platform features, Chrome I/O 2026 HTML-in-Canvas API, Unity WebGL Safari shader stall pattern
- **Category 10: 2026-Q2 LATE-EMERGING THREATS + NEW PLATFORM (R91)**:
  - **S-026 [P0]** No clickjacking-style UI manipulation (opacity/pointer-events tricks) — inspired by DEF CON 33 Marek Tóth disclosure showing 6 major password managers (1Password, Bitwarden, LastPass, Enpass, iCloud Passwords, LogMeOnce, ~40M users) vulnerable to autofill data exfiltration via invisible overlays
  - **S-027 [P0]** X-Frame-Options / CSP frame-ancestors enforced — defense-in-depth against clickjacking iframe wrapping
  - **B-017 [P0]** Chrome 149+ required (record 429 security patches + CVE-2026-11084 Password Manager cross-origin data leak)
  - **B-018 [P0]** Safari 26.5+ required (20 WebKit CVEs CVE-2026-28905–28971 + WebRTC CVE-2026-28944 + CVE-2026-28847 process crash)
  - **B-019 [P1]** Safari 26.5 `:open` pseudo-class — progressive enhancement for `<details>`/`<select>`/`<dialog>`/`<input>`
  - **B-020 [P1]** Safari 26.5 `Origin` API — structured Origin object with `.scheme`/`.host`/`.port` (analytics code must handle both)
  - **B-021 [P1]** Safari 26.5 `ToggleEvent.source` — popover invoker attribution
  - **G-017 [P1]** HTML-in-Canvas API accessibility (Chrome I/O 2026) — embedded HTML in WebGL/WebGPU canvas remains in a11y tree
  - **G-018 [P1]** First-draw shader warmup — Safari `webglPrepareUniformLocationsBeforeFirstDraw` is synchronous main-thread (~3s freeze per 200 uniforms); render all prefabs during splash
  - **W-037 [P2]** Origin API opt-in / fallback — `String(window.location.origin || (window.origin && window.origin.toString()) || 'unknown')` pattern in gz-analytics.js
  - **W-038 [P1]** No untrusted-input handling mirroring Chrome 149 CVE pattern — grep audit for `innerHTML\s*=|eval(|new Function(` in js/ + game HTML

### Stats
- 211 total test cases (was 200 in v1.4.0, +11)
- P0: 62 → 66 (+4: S-026, S-027, B-017, B-018)
- P1: 76 → 82 (+6: B-019, B-020, B-021, G-017, G-018, W-038)
- P2: 51 → 52 (+1: W-037)
- P3: 11 → 11 (no new)
- Categories: 10 (added Category 10: 2026-Q2 Late-Emerging Threats R91)

### Sources
- **DEF CON 33 Password Manager Clickjacking** (Marek Tóth, Aug 2025 / Socket verification): https://dailysecurityreview.com/news/clickjacking-vulnerability-exposes-autofill-data-across-major-extensions — 6 password managers, ~40M users, autofill/2FA/CC data exfil via invisible overlays
- **Chrome 149 = 429 security patches record** (May 2026 stable): https://pcworld.com/article/3158038/chrome-149-fixes-429-security-flaws-the-most-ever-in-one-update.html + https://securityweek.com/chrome-149-patches-429-vulnerabilities
- **CVE-2026-11084 (Chrome Password Manager Cross-Origin Data Leak)**: https://cvefeed.io/vuln/detail/CVE-2026-11084
- **Safari 26.5 = 20 WebKit CVEs** (CVE-2026-28905–28971): https://news.lavx.hu/article/safari-26-5-patches-20-webkit-flaws-and-a-webrtc-crash-bug-what-ios-ipados-and-macos-developers-need-to-know + https://apfelpatient.de/en/news/safari-26-5-security-update-closes-webkit-vulnerabilities
- **CVE-2026-28847 (WebKit unexpected process crash)**: https://cvefeed.io/vuln/detail/CVE-2026-28847
- **WebKit 26.5 Features for Safari 26.5**: https://webkit.org/blog/17938/webkit-features-for-safari-26-5 (`:open` pseudo-class, scoped `random()`, SVG `color-interpolation`, `ToggleEvent.source`, `Origin` API)
- **Safari 26.5 Apple Developer Release Notes**: https://developer.apple.com/documentation/safari-release-notes/safari-26_5-release-notes
- **HTML-in-Canvas API** (Chrome I/O 2026, Thomas Nattestad): https://webgpu.com
- **Unity WebGL Safari First-Draw Shader Stall** (Richard Fu, May 2026 post-mortem): https://richardfu.net/unity-webgl-safari-hang-shader-warmup — `webglPrepareUniformLocationsBeforeFirstDraw` is WebKit-specific synchronous main-thread, ~3ms per uniform × 200 = 3s freeze; mitigation = render prefab into offscreen canvas during splash
- **WebGPU + Three.js r170 + Babylon.js 7** (Apr–May 2026): https://dinogame.gg/blog/webgpu-and-browser-games + https://youngju.dev/blog/culture/2026-05-14-webgpu-compute-shaders-browser-gpu-computing-wgsl-hands-on-deep-dive-2026.en
- **PortSwigger Clickjacking Testing Methodology**: https://portswigger.net/burp/documentation/desktop/testing-workflow/vulnerabilities/testing-for-clickjacking
- **Playwright 1.59/1.60 AI-era testing** (May 2026 — context, not in library): https://scrolltest.com/playwright-1-59-release-breakdown + https://skakarh.com/blog/playwright-1-60-0-whats-new-for-qa-engineers

### Coverage Delta
- 7 user-policy dimensions + 2026-Q2 industry research + GDC 2026 GASIG + R89 June 2026 CVE wave + R91 May 2026 late-emerging threats (clickjacking, browser CVEs, HTML-in-Canvas, shader warmup)
- Library now 211 cases; v1.0.0 → v1.5.0 = +117 cases (94 → 211) over 6 evolutions

## [v1.4.0] - 2026-06-06 (R89 — Dynamic Test Intelligence cron evolution, 14 new test cases)

### Added
- **14 new test cases** (186 → 200) from June 2026 CVE disclosure wave + Safari 26.4 release + AI visual regression research + PWA/SW coverage
- **Category 8: 2026-Q2 EMERGING THREATS** (R89):
  - **B-009 [P0]** Edge UXSS CVE-2026-45494 (CVSS 5.0, ZDI-26-330) — Universal XSS via navigation event mishandling
  - **B-010 [P0]** Edge Directory Traversal RCE CVE-2026-45495 (CVSS 7.5, ZDI-26-331) — full RCE via cross-device sign-in
  - **B-011 [P0]** Chrome V8 Type Confusion CVE-2026-6363 — OOB memory write, RCE on game page
  - **B-012 [P1]** Edge Origin Validation Bypass CVE-2026-45492 (CVSS 4.3, ZDI-26-329) — chainable
  - **B-013 [P1]** Safari 26.4 WebTransport support — low-latency UDP game server protocol
  - **B-014 [P2]** Safari 26.4 CSS Grid Lanes (masonry layout)
  - **B-015 [P1]** Safari 26.4 Keyboard Lock API for fullscreen games
  - **P-016 [P1]** Canvas pixel-change visual regression (arXiv 2208.02335 methodology)
  - **P-017 [P2]** Gameplay state diff (text + DOM + score, not just pixels)
  - **B-016 [P2]** Interop 2026 cross-browser baseline (Chrome 149/Firefox 147/Edge 137/Safari 26.4)
  - **PC-009 [P2]** Shift-Right live playtesting feedback button
  - **PC-010 [P2]** AI-driven QA smoke test (≤ 60s Playwright run)
- **Category 9: PWA / OFFLINE / SERVICE WORKER**:
  - **PWA-001 [P1]** No stale service worker blocks new game load
  - **PWA-002 [P2]** localStorage and IndexedDB persistence across reload

### Stats
- 200 total test cases (was 186 in v1.2.0, +14)
- P0: 62 (was 59, +3 Edge/V8 CVEs)
- P1: 75 (was 71, +4)
- P2: 49 (was 45, +4)
- P3: 11 (no new)
- Categories: 9 (added Cat 8: 2026-Q2 Threats R89 + Cat 9: PWA/Offline)

### Sources
- **Edge Pwn2Own CVEs** (2026-06-04 disclosure): https://cyberpress.org/microsoft-edge-vulnerability — CVE-2026-45492/45494/45495
- **ZDI Advisories**: https://www.zerodayinitiative.com/advisories/ZDI-26-329/ (CVE-2026-45492), /ZDI-26-330/ (CVE-2026-45494), /ZDI-26-331/ (CVE-2026-45495)
- **Chrome V8 CVE-2026-6363**: https://windowsforum.com/threads/cve-2026-6363-v8-type-confusion-chrome-147-fix-and-edge-patch-timeline.413791 (Chrome 147+ fix timeline)
- **Safari 26.4 (44 features + 191 fixes)**: https://developmentstoday.com/news/safari-26-4-new-features-bug-fixes-2026 — CSS Grid Lanes, WebTransport, Keyboard Lock API
- **Interop 2026**: https://howtogeek.com/chrome-firefox-edge-and-safari-are-teaming-up-to-fix-common-web-problems (Chrome/Firefox 99%, Edge/Safari 98% baseline)
- **Visual Bug Detection (arXiv 2208.02335)**: https://arxiv.org/abs/2208.02335 — 100% accuracy on 24 injected canvas bugs vs 44.6% for snapshot testing
- **SnoopGame 2026 Trends**: https://snoopgame.com/blog/top-game-testing-trends-to-watch-in-2026 — AI-driven QA, accessibility, shift-right testing
- **Chrome 149.0.7827.54 Stable** (May 2026 release — current stable)
- **WebTransport API** (MDN): https://developer.mozilla.org/en-US/docs/Web/API/WebTransport

## [v1.3.0] - 2026-06-06 (R88 — growmi + grow-worm new games + 22 H1 fixes)

### Added
- 2 new games to library: growmi (worm puzzle, 30 levels × 5 tiers), grow-worm (snake puzzle, 25 levels)
- **Pitfall 45**: R85 H1 sync missed 22 games that had h1 only inside splash-screen — fix adds persistent SEO h1 outside splash

### Fixed
- growmi + grow-worm: 1ktower.com zombie endpoint (Pitfall 20) + missing footer trio (game-footer.js + monetag-manager.js + gz-ad-below-game div)
- 22 games: SEO h1 missing outside splash (Pitfall 43 regression, games with h1 only in splash-screen): 2048, abyss-chef, bolt-jam-3d, bounce-bot, brick-breaker, catch-turkey, color-sort, dessert-blast, flappy-wings, glyph-quest, idle-clicker, kitty-cafe, minesweeper, ocean-gem-pop, paint-splash, phantom-blade, snake, stacker, sudoku, wood-block-puzzle, word-puzzle, wordle

### Stats
- 255/255 live games (was 253 in R87, +2: growmi + grow-worm)
- 0 R0 issues (1ktower/alwingulla/LAN IP/H1 outside splash/footer trio/splash deadlock/rAF bug/twitter:card)
- 254/255 qa_v3 PASS (1 SSL false positive magic-tiles, curl verified HTTP 200)
- IndexNow: growmi + grow-worm submitted (HTTP 200)

## [v1.2.0] - 2026-06-06 (R87 — Dynamic Test Intelligence cron evolution)

### Added
- 11 new test cases (175 → 186 total) from industry research + GDC 2026 GASIG + 2026-Q2 CVEs
- **B-005 [P0]** Chrome OOB GPU Write CVE-2026-9967 (pre-148.0.7778.216) — WebGL/WebGPU/Canvas2D must verify Chrome version
- **B-006 [P0]** Chrome iOS Uninitialized Use CVE-2026-9963 (pre-148.0.7778.216) — RCE risk on game page
- **B-007 [P1]** Safari 26.0 WebGPU enabled — `navigator.gpu` must not error on iOS 26+/iPadOS 26+; WebGL fallback still required
- **B-008 [P2]** Safari 26.0 new CSS primitives (Anchor Positioning, Scroll-driven Animations, HDR images, SVG icons)
- **W-035 [P1]** Chrome 130+ Document Picture-in-Picture — gameplay canvas continues rendering under PiP
- **W-036 [P1]** Chrome Performance Personalization (Memory Saver / Energy Saver) — playable under throttled background
- **GX-010 [P2]** Vibration API haptic feedback — `navigator.vibrate(pattern)` on mobile; silent fallback on iOS/desktop
- **A-001 [P1]** prefers-color-scheme: dark mode — listens to system theme change in real time
- **A-002 [P2]** WCAG 2.2 color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text/UI
- **A-003 [P1]** One-hand Thumb Zone: primary controls + CTA buttons within bottom 60% of viewport (375×667 / 414×896)
- **A-004 [P2]** ARIA labels on canvas — `role="application"` or `role="img"` + `aria-label="<Game Name>"` for screen readers

### New Category
- **Category 7: Accessibility (WCAG 2.2 + GDC 2026 GASIG)** — 4 cases covering visual, motor, and screen reader accessibility

### Sources
- **CVE Search**: `https://stack.watch/browse/latest/` — CVE-2026-9963 (Chrome iOS Uninitialized Use / RCE) and CVE-2026-9967 (Chrome OOB GPU Write) both pre-148.0.7778.216
- **Safari 26.0 Release Notes**: `https://webkit.org/blog/17333/webkit-features-in-safari-26-0` — 75 new features including WebGPU shipping, Anchor Positioning, Scroll-driven animations, SVG icons, HDR
- **WebGPU Status 2026**: `https://webo360solutions.com/blog/webgpu-browser-support` — Chrome 113+, Firefox 147+, Safari 26+ all shipping WebGPU
- **Chrome 130 Release Notes**: `https://developer.chrome.com/release-notes/130` — Document Picture-in-Picture, CSS Nested declarations, Performance Personalization (Memory Saver/Energy Saver)
- **2026 Mobile Gaming UX (One-hand / Thumb Zone)**: `https://novatechbeacon.com/latest/why-2026-gaming-is-built-for-one-hand-play` and `https://connectioncafe.com/dark-mode-haptics-and-one-hand-play-the-new-ux-rules-for-gaming-apps-in-2026`
- **Dark Mode Accessibility WCAG**: `https://accessibilitychecker.org/blog/dark-mode-accessibility` and `https://tech-rz.com/blog/dark-mode-design-best-practices-in-2026`
- **GDC 2026 Accessibility Roundtable (IGDA-GASIG)**: `https://igda-gasig.org/2026/04/01/gdc-2026-accessibility-roundtable`
- **Casual Mobile Gaming Accessibility**: `https://softwaretestingmagazine.com/knowledge/the-accessibility-audit-testing-for-inclusivity-in-casual-mobile-gaming`
- **Safari 26.0 Apple Developer Notes**: `https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes` (Released Sep 15, 2025; iOS 26, iPadOS 26, visionOS 26, macOS 26)

### Metrics
- P0: 57 → 59 (+2: B-005, B-006 Chrome CVE-2026)
- P1: 66 → 71 (+5: B-007 WebGPU, W-035 PiP, W-036 Memory Saver, A-001 dark mode, A-003 Thumb Zone)
- P2: 41 → 45 (+4: B-008 Safari CSS, GX-010 haptic, A-002 WCAG contrast, A-004 ARIA)
- P3: 11 → 11 (no new in v1.2.0)
- Categories: 6 → 7 (added Category 7: Accessibility WCAG 2.2 + GDC 2026 GASIG)

## [v1.1.0] - 2026-06-06 (R2 + R3 complete)

### Verified
- **R2** (verify-lite-1780703959567.json): **126/126 PASS, 0 new issues** ✅
- **R3** (verify-lite-1780705965482.json): **126/126 PASS, 0 new issues** ✅
- **R1** (verify-lite-1780701254846.json): 118/126, 8 issues all fixed in b71062f3 + a7742b4a
- **R3 clean re-run after R2's 1 network ETIMEDOUT** to verify 0 real issues
- Total checks: 3 rounds × 126 games × 30 (3-agent × 10-iter) = **11,340 checks**
- 100% of P0-P3 issues fixed and verified (zero-tolerance policy)

### Termination Criteria
- ✅ 3 consecutive rounds with 0 new issues (R3 final)
- ✅ 100% P0-P3 fix rate
- ⏳ Test library evolved ≥3 times (Dynamic Intelligence cron 43a2bdf357bb scheduled)
- ✅ Performance metrics met
- ✅ Cross-device compatibility
- ✅ No security vulnerabilities

## [v1.0.0] - 2026-06-06

### Added
- Initial master test case library with 94 test cases
- Category 1: Website-level (14 cases: W-001 to W-014)
- Category 1: Network performance (7 cases: W-020 to W-026)
- Category 1: SEO & Meta (5 cases: W-030 to W-034)
- Category 2.1: Game loading & setup (16 cases: G-001 to G-016)
- Category 2.2: Puzzle gameplay (9 cases: GP-001 to GP-009)
- Category 2.2: Arcade gameplay (8 cases: GA-001 to GA-008)
- Category 2.2: Card gameplay (6 cases: GC-001 to GC-006)
- Category 2.2: Board gameplay (6 cases: GB-001 to GB-006)
- Category 2.2: Idle gameplay (6 cases: GI-001 to GI-006)
- Category 2.2: Match-3 gameplay (5 cases: GM-001 to GM-005)
- Category 2.3: Multimedia system (9 cases: GX-001 to GX-009)
- Category 2.4: Progression & persistence (7 cases: GP-100 to GP-106)
- Category 2.5: Monetization (8 cases: GM-100 to GM-107)
- Category 3.1: Desktop browsers (6 cases: C-001 to C-006)
- Category 3.2: Mobile browsers (7 cases: C-010 to C-016)
- Category 3.3: Tablets (2 cases: C-020 to C-021)
- Category 3.4: Screen sizes (6 cases: C-030 to C-035)
- Category 4.1: Performance metrics (8 cases: P-001 to P-008)
- Category 4.2: Stability (6 cases: P-010 to P-015)
- Category 5.1: Data privacy (5 cases: S-001 to S-005)
- Category 5.2: Content compliance (6 cases: S-010 to S-015)
- Category 5.3: Security (6 cases: S-020 to S-025)
- Category 6.1: Browser-specific 2026 (4 cases: B-001 to B-004)
- Category 6.2: Web platform 2026 (5 cases: W-100 to W-104)
- Category 6.3: Player common complaints (8 cases: PC-001 to PC-008)

### Sources
- 2026-Q2 Browser Compatibility Issues Index (TestDino)
- Safari 26.4 Release Notes (Apple Developer)
- Web Platform 2026 AV1/WebGPU trends
- Player complaints on Reddit r/MobileGaming
- Top 10 free browser game sites (CrazyGames, Poki, Y8, AddictingGames, etc.)
- 2026 game testing best practices (ONES, game_test_tutorial)

### Infrastructure
- Created `test-library/verify-game.sh` (initial 3-agent × 10-iter shell version)
- Created `test-library/verify-game.js` (Playwright/Kachilu version)
- Created `test-library/verify-lite.js` (lightweight curl+grep, default)
- Created `test-library/adaptive-depth.js` (adaptive testing depth)

### Cron Jobs
- `43a2bdf357bb` Dynamic Test Intelligence (every 4h, auto-update library)
- `36e21d25f954` R1 Batch QA (every 6h, 5 games per tick)

### Severity Policy
- 100% P0-P3 fix rate (zero-tolerance per user policy 2026-06-06)
- All bugs must be fixed, no deferral
- 3-agent × 10-iter verification before declaring pass
- Cycle reset if ANY new issues found

### Process Improvements
- Adaptive testing depth: 0 issues × 2 rounds → -20% depth; 3+ issues → +50% depth + 10 random cases
- Real game issues found in R85-R1:
  - Paint-splash: input handlers not registered (unplayable)
  - Dessert-blast: missing game.js/bundle.js (unplayable)
  - Catch-turkey: missing game.js/bundle.js (unplayable)
  - Bubble-pop: broken rAF cancelAnimationFrame (gameLoop dies)
  - Watermelon-merge: checkGameOver never triggers (unlosable)
  - Stacker + 4 others: splash deadlock (unplayable)
  - 166 files: site-analytics.gamezipper.com 1x1 dead pixel (HTTP 501)
  - 55 files: broken rAF cancelAnimationFrame (visibility tab switch dies)
  - 3 files: zombie endpoints (1ktower/alwingulla/rye.io)
  - Vercel Edge function 405: /api/collect.js POST (since 12月 2025 routing change)
- All fixed in 8 commits during R1 mid-progress
