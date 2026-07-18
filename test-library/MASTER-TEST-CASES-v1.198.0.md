# GameZipper 100% Master Test Case Library
**Version**: 1.198.0
**Effective Date**: 2026-07-18 (v1.198.0 auto-research, 4h cycle 77)
**Build**: R315 (Dynamic Test Intelligence 4h cron evolution)

**Version Note**: v1.198.0 = R315 Dynamic Test Intelligence cron — 9 new, machine-verifiable test cases from 2026-07-18 research. This cycle converts Chrome 150 and Firefox 152/153 platform changes plus a real 2026 negative-currency game bug into executable browser-game regressions: declarative keyboard focus, dark-mode asset switching, scroll-completion promises, opaque-origin workers, SVG-filter anti-clickjacking behavior, Firefox scrollbar capability false-positives, split interim/final response timing, large-reward economy overflow, and raw Pointer Lock movement.

**Previous Version Note (v1.197.0)**: v1.197.0 = R314 Dynamic Test Intelligence cron — 7 new test cases (S-443 through S-448 and W-379). See MASTER-TEST-CASES-v1.197.0.md for canonical definitions.

**Review Cycle**: Every 4 hours (auto-update via Dynamic Test Intelligence)

---

## New Test Cases Added in v1.198.0 (R315 — July 18 2026, 4h cycle 77)

### Web Platform / Browser (W)

- [W-380] **[P1] Chrome 150 `focusgroup` Declarative Arrow-Key Navigation and Single-Tab-Stop Regression** — For every DOM toolbar, menu, level grid, or settings cluster that uses `focusgroup`, automate Tab plus ArrowLeft/Right/Up/Down in Chrome 150 and at least one non-supporting engine; assert exactly one tab stop enters the composite widget, arrow keys reach every enabled member in DOM order, `wrap` wraps at both ends, disabled controls are skipped, and re-entry restores the last-focused member. If native behavior is unavailable, the same assertions must pass through a roving-`tabindex` fallback. Source: Chrome 150 stable release notes, 2026-06-30, https://developer.chrome.com/release-notes/150.

- [W-381] **[P2] Chrome 150 `light-dark()` Image Values — Dark-Mode Game Art Must Switch Without Broken or Transparent Assets** — For any `background-image`, `content`, `cursor`, `border-image-source`, or `list-style-image` using `light-dark(url(light),url(dark))`, emulate `prefers-color-scheme: light` and `dark`; assert the computed image URL changes to the expected asset, each selected request returns HTTP 200 with a non-zero body, the rendered element has non-zero RGB pixels, and unsupported browsers receive an equivalent `@media (prefers-color-scheme: dark)` fallback. Source: Chrome 150 stable release notes, 2026-06-30, https://developer.chrome.com/release-notes/150.

- [W-382] **[P2] Chrome 150 Programmatic Smooth-Scroll Promises — Level Carousels Must Distinguish Completion from Interruption** — On every programmatically scrolled level list, shop, tutorial, or modal, call `scrollTo`/`scrollBy`/`scrollIntoView` with smooth behavior and assert the returned Promise resolves only after scrolling settles; run one uninterrupted case and one wheel/touch interruption case, verify the resolved status differs as specified, the final `scrollTop` stays within 1 CSS pixel of the intended destination only for the completed case, and no completion callback fires twice. Older engines must use a feature-detected fallback without throwing. Source: Chrome 150 stable release notes, 2026-06-30, https://developer.chrome.com/release-notes/150.

### Security (S)

- [S-449] **[P1] Chrome 150 Opaque Origin for `data:` URL Workers — No Creator Storage or BroadcastChannel Inheritance** — Launch dedicated and shared workers from `data:` URLs in a controlled test page; assert each reports an opaque/`null` origin, cannot read creator same-origin storage, and cannot exchange a same-named `BroadcastChannel` message with the creator within a bounded timeout. Then verify production code does not rely on inherited origin for `data:` workers and uses a same-origin external worker URL when storage or channel access is required. Source: Chrome 150 stable release notes, 2026-06-30, https://developer.chrome.com/release-notes/150.

- [S-450] **[P1] Chrome 150 Blocks SVG Filters on Cross-Origin or Restricted Iframes — Clickjacking Visual-Transform Regression** — In an attacker-origin harness, attempt to apply `filter:url(#attack-filter)` to a cross-origin game iframe and to a sandboxed iframe; compare screenshot hashes with an unfiltered baseline and assert Chrome 150 does not apply the SVG filter, iframe hit-testing remains aligned with its visible controls, and no transformed-pixel side channel is observable. Independently assert sensitive game pages reject unauthorized framing through `Content-Security-Policy: frame-ancestors` or `X-Frame-Options`. Source: Chrome 150 stable release notes, 2026-06-30, https://developer.chrome.com/release-notes/150.

### Browser Compatibility / Bug Patterns (B)

- [B-222] **[P1] Firefox 153 `::-webkit-scrollbar` Capability False-Positive — Nested Game Panels Must Remain Reachable** — In Firefox 153, assert `CSS.supports('selector(::-webkit-scrollbar)')` returns true while a probe confirms WebKit scrollbar styling is not actually applied; therefore no game may use that `@supports` result as its only capability gate. For each nested scrollable level list, inventory, or modal, automate wheel, PageDown, and End, assert `scrollTop` reaches `scrollHeight-clientHeight`, and verify controls at the bottom become focusable and clickable. Source: Firefox 153 developer release notes (Beta), retrieved 2026-07-18, https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/153.

### Performance (P)

- [P-174] **[P2] Firefox 152 Resource Timing Interim/Final Header Split — Detect CDN 103 Early-Hints Stalls Separately from Origin TTFB** — On a controlled game-resource endpoint that sends `103 Early Hints` followed by final response headers, capture `PerformanceResourceTiming`; assert `firstInterimResponseStart > 0`, `finalResponseHeadersStart >= firstInterimResponseStart`, `responseStart >= finalResponseHeadersStart`, and all timestamps are monotonic. Repeat through the production CDN and on a no-interim control; flag an early-hints stall when `finalResponseHeadersStart-firstInterimResponseStart` exceeds 500 ms, while the control must expose zero/no interim timing. Export both intervals so a “slow game load” is attributed to interim-to-final waiting rather than collapsed into one TTFB number. Source: Firefox 152 developer release notes, 2026-06-16, https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/152.

### Gameplay / UX (G)

- [G-196] **[P1] Large Reward Economy Overflow — Coin or Score Grants Must Never Wrap Negative** — Seed each game economy at `2^31-2`, grant rewards crossing `2^31-1`, then repeat near `Number.MAX_SAFE_INTEGER`; assert displayed, in-memory, and persisted balances remain finite, non-negative, monotonic, and arithmetically exact within the supported range, no bitwise coercion (`|0`, `~~`, signed typed array) wraps the value, purchase validation still rejects overspend, and reload reproduces the same balance. Beyond the supported maximum, the game must use BigInt/string serialization or an explicit saturation/error path rather than silent precision loss. Real-world trigger: *Virus Hunter* patched a large one-time coin grant that displayed the held balance as negative on 2026-06-07; source https://news.17173.com/content/06072026/154037735.shtml.

### Compatibility / Input (C)

- [C-216] **[P2] Firefox 152 Pointer Lock `unadjustedMovement` — Raw-Mouse Games Need Deterministic Fallback** — From a trusted automated click, request pointer lock with `{unadjustedMovement:true}` and dispatch identical physical mouse paths with OS acceleration enabled and disabled; in Firefox 152+, assert raw `movementX/Y` totals remain within a fixed tolerance, camera/aim displacement is deterministic, Escape releases lock, and relock succeeds. On engines that reject the option, assert a caught `NotSupportedError` immediately retries standard pointer lock without freezing input or leaving a fullscreen overlay. Source: Firefox 152 release notes, 2026-06-16, https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/152.

### Summary — v1.198.0 New Test Cases

| ID | Cat | P | Machine-verifiable focus |
|----|-----|---|--------------------------|
| W-380 | W | P1 | `focusgroup` single tab stop, arrow traversal, wrap, disabled skip, last-focus memory |
| W-381 | W | P2 | Light/dark computed image URL, HTTP 200, non-zero rendered pixels, fallback |
| W-382 | W | P2 | Smooth-scroll Promise completion vs interruption and single callback |
| S-449 | S | P1 | Opaque `data:` worker origin, storage isolation, BroadcastChannel isolation |
| S-450 | S | P1 | SVG filter blocked on cross-origin/restricted iframe plus anti-framing headers |
| B-222 | B | P1 | Firefox scrollbar `@supports` false-positive and bottom-content reachability |
| P-174 | P | P2 | Interim/final-header timing monotonicity, early-hints stall threshold, and no-interim control |
| G-196 | G | P1 | Signed-integer and JS-safe-integer economy boundary persistence |
| C-216 | C | P2 | Pointer Lock raw movement determinism, release/relock, graceful fallback |

*(9 new test cases this cycle. All acceptance criteria are executable through browser automation, static instrumentation, response-header checks, pixel hashes, or persistence assertions; no case depends on subjective visual scoring.)*

---

## Previous Version Test Cases (v1.197.0 — R314, July 17 2026, 4h cycle 76)

See MASTER-TEST-CASES-v1.197.0.md for S-443 through S-448 and W-379.

## Previous Version Test Cases (v1.196.0 — R313, July 16 2026, 4h cycle 75)

See MASTER-TEST-CASES-v1.196.0.md for S-440 through S-442, W-377, W-378, PC-011, and G-195.

## Previous Version Test Cases (v1.195.0 — R312, July 16 2026, 4h cycle 74)

See MASTER-TEST-CASES-v1.195.0.md for S-437 through S-439, W-375, W-376, and PC-010.
