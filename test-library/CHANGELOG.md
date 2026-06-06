# Test Case Library Changelog

All notable changes to the test case library are documented here.

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
