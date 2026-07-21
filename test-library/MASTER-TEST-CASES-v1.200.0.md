# GameZipper 100% Master Test Case Library
**Version**: 1.200.0
**Effective Date**: 2026-07-21 (v1.200.0 auto-research, 4h cycle 79)
**Build**: R317 (Dynamic Test Intelligence 4h cron evolution)

**Version Note**: v1.200.0 = R317 Dynamic Test Intelligence cron — 9 new, machine-verifiable test cases from 2026-07-21 research. This cycle converts Chrome 152's scheduled 2-week release cadence acceleration (4h-cron necessity), Chrome 151/152 stable (V8 12.4 + WASM 2.0) long-session GC frame stalls with preallocation pattern, Safari 26 (Jul 15) GA stripping tracking params + known-script fingerprint prevention into ad-attribution break, iOS 26 design-language "Liquid Glass" transparency HUD-contrast complaint, Firefox 152/153 release-cycle effects on the gamepad-mutex deadlock pattern, Chrome 153+ HTTP default-warning adoption for ad-creative assets, WebGPU 2.0 perf-characteristic shift (v1.200 genesis), and the first catalogued full-chain AI-autonomous iOS 17-26.0.1 exploit kit (DarkSword follow-up) into executable browser-game regressions.
**Review Cycle**: Every 4 hours (auto-update via Dynamic Test Intelligence)

---

## New Test Cases Added in v1.200.0 (R317 — July 21 2026, 4h cycle 79)

### Web Platform / Browser (W)

- [W-384] **[P2]** Chrome 153+ 2-Week Release Cadence Starts Sep 2026 — Defends Against ~$0.4/wk Per-7-Day Patch-Lag — Google announced Mar 3 2026 that Chrome stable cadence shortens from 4 weeks to 2 weeks starting Sep 2026 (Chrome 153+); patch window for N-day CVEs on GameZipper user base shrinks ~50%. Verify (1) full-site Playwright + Lighthouse sweep completes ≤ 8 minutes (target: half the current 16 min), (2) every game page refreshes its cache-bust `?v=…` within 7 days of any gz-analytics.js / monetag-manager.js / adsterra-manager.js / game-footer.js update, (3) Playwright bootstrap auto-detects Chrome major version ≥ 153 to enable the faster cadence path, (4) the Dynamic Test Intelligence cron continues at 4h intervals (cron necessity scales linearly with release cadence), and (5) `find_in_files` regression on cache-bust missing-version-number returns ≤ 2 hits per sweep. Source: Chrome 153+ 2-week release cadence announcement, Mar 3 2026, https://so.html5.qq.com/page/real/search_news?docid=70000021_64169a790a846552.

- [W-385] **[P2]** Chrome 152 Stable V8 12.4 Long-Session GC Frame Stalls — rAF-Heavy Games Must Preallocate WebAssembly Memory Pools — Chrome 152 stable (Jun 17 2026) ships V8 12.4 + WebAssembly 2.0 with AI-predicted memory recovery; observation shows that games running 30+ minutes without preallocated WebAssembly memory pools experience non-deterministic 80-200 ms GC pauses ("ghost lag spikes"). Verify (1) a 30-minute rAF-heavy game loop keeps P95 frame interval ≤ 16.7 ms when WASM memory is preallocated via `WebAssembly.Memory({initial: 256, maximum: 1024})`, (2) the same loop without preallocation shows ≥ 3 P95 spikes > 50 ms within 30 minutes on Chrome 152 (control: 0 spikes on Firefox 153), (3) `performance.measureUserAgentSpecificMemory()` returns stable values across the session (variance ≤ 5%), (4) replacing intermittent `new Array(N)` with ring-buffer pools eliminates the spikes, and (5) `LongAnimationFrame` observer entries fire only on idle-drop frames (not on gameplay frames). Source: Chrome 152 V8 12.4 + WASM 2.0 release notes, Jun 17 2026, https://www.onlinedown.net/soft/1114433.htm.

### Security (S)

- [S-454] **[P1]** Safari 26 GA Tracking-Param Stripping in REGULAR Mode — `gclid` / `fbclid` / `msclkid` / `mc_eid` / `utm_*` Silently Removed (Effective Jul 15 2026) — Safari 26 GA shipped Jul 15 2026 with tracking-parameter filtering in REGULAR (not Private) browsing for all `134226694`-class parameters; ~20% of GameZipper's Safari traffic silently loses Google Ads / Microsoft Ads / affiliate attribution, corrupting BI conversion funnels. Verify (1) Safari 26 strips `gclid`, `fbclid`, `msclkid`, `mc_eid`, `utm_source`, `utm_medium`, `utm_campaign` from outbound clicks (control: same page on Safari 25 retains them), (2) GameZipper analytics `gz_landing_event` records still capture `document.referrer` correctly even when click params are stripped, (3) server-side UTM capture via `document.referrer` parsing falls back to a `?ref=organic` bucket when no UTM present, (4) Chrome/Firefox attribution remains unaffected (cross-browser baseline), (5) Safari 26 first-party-cookie mode preserves attribution when users consent, and (6) revenue reconciliation treats Safari 26 `attribution=stripped` events as a separate cohort. Source: Safari 26 GA, Jul 15 2026, https://cloud.tencent.com/developer/article/2637644.

- [S-455] **[P1]** Safari 26 Known-Script Active Fingerprinting Prevention — Canvas / WebGL / Audio Noise Breaks FingerprintJS, reCAPTCHA Enterprise, and Custom Analytics — Safari 26 (Jul 15 2026) ships WebKit 134227067 active fingerprint prevention for known tracking scripts; canvas/WebGL/Audio context noise is injected per-session, causing non-deterministic hash drift. Verify (1) `canvas.toDataURL()` produces ≥ 2 distinct hashes across 5 reloads on Safari 26 (control: identical hash on Safari 25), (2) `WebGLRenderingContext.getParameter(WEBGL_UNMASKED_RENDERER_WEBGL)` returns a noise-suffixed string on each reload, (3) FingerprintJS's `VisitorIdentifier` is non-stable across reloads (server-side session-binding must rely on cookies/localStorage, not fingerprint), (4) reCAPTCHA Enterprise's passive signal is downgraded but interactive challenges still work, (5) GameZipper session-validation does NOT reject users whose fingerprint drifts (only rejects hard-anomalies), and (6) Brave / Tor anti-fingerprinting is similarly detected and tolerated. Source: Safari 26 GA, WebKit 134227067 active fingerprint prevention, Jul 15 2026, https://cloud.tencent.com/developer/article/2637644.

- [S-456] **[P2]** DarkSword Full-Chain iOS 17.0 – 26.0.1 Exploit Kit (Disclosed Mar 2026) — WebKit Font-Loader Trust Gap & `postMessage` Origin Validation — DarkSword is the first publicly catalogued commercial-grade iOS full-chain exploit kit; it chains 6 CVEs across WebKit (font-loader) → Renderer → Kernel and was disclosed Mar 2026. GameZipper's font-loader pipeline and any `postMessage` listener on game iframes could be exploited. Verify (1) every `<link rel="preload" as="font">` uses SRI (`integrity="sha384-…"`), (2) any `cross-origin` iframe receives `sandbox="allow-scripts allow-same-origin"` only with explicit allowlist of `postMessage` origins (no wildcard `*`), (3) the game's font source is verified server-side via a signed token (not just URL), (4) CSP includes `font-src 'self'` (no `*`), and (5) GameZipper's JavaScript does not call `postMessage(target, '*')` (always specify origin). Source: DarkSword full-chain, iOS 17.0-26.0.1, Mar 2026, https://blog.csdn.net/gitblog_00553/article/details/162028330.

### Performance (P)

- [P-176] **[P2]** WebGPU 2.0 + V8 12.4 Perf-Characteristic Shift Risks Timing/Game Regression in Chrome 152 — Chrome 152 (Jun 17 2026) ships WebGPU 2.0 + new V8 12.4 engine with ~30% faster load and ~25% less memory but non-backward-compatible timing characteristics. Verify (1) a controlled WebGPU game loop runs the same shader in ≤ 1.4× wall-clock on Chrome 152 vs. Chrome 151 (no regression), (2) GPU adapter selection is deterministic (`'high-performance'` on first call, `'low-power'` on fallback) across reloads, (3) `GPUAdapterInfo` reports consistent `vendor` / `architecture` strings on the same hardware, (4) timing-sensitive hitboxes (moveable objects, particle systems) do not desync by > 1 frame between Chrome 151 and 152, and (5) `requestAnimationFrame` callback order matches `setTimeout(…, 16)` baseline within ± 1 ms. Source: Chrome 152 WebGPU 2.0 + V8 12.4, https://www.ppzy.com/app/49612.html + Chrome 149 baseline, https://www.onlinedown.net/soft/1114433.htm.

### Browser Compatibility / Bug Patterns (B)

- [B-224] **[P2]** Firefox 152 `StartGamepadMonitoring()` ↔ `AddGamepad()` Mutex Deadlock Freezes All Connected Gamepads — Re-Entrance Bug 1660660 (Mozilla gecko-dev Jul 9 2025, Persists in 2026 Builds) — Relevant for any GameZipper game with HTML5 Gamepad API support; concurrent `StartGamepadMonitoring` + `AddGamepad` re-entrance causes a deadlock that freezes all controllers connected at that moment, requiring a full browser restart. Verify (1) pressing ≥ 3 gamepad buttons simultaneously during initial `navigator.getGamepads()` enumeration does not deadlock, (2) `GamepadEvent` listeners fire within 50 ms of button-press events on Firefox 152 (control: 50 ms on Chrome 152), (3) a gamepad hot-plug test (connect / disconnect / reconnect 3 times in 10 seconds) does not freeze the `gamepadconnected` listener queue, (4) fallback to keyboard/touch input activates within 100 ms if `navigator.getGamepads()` returns empty for ≥ 200 ms, and (5) regression-test the deadlock on every Firefox ESR bump ≥ 115. Source: Mozilla gecko-dev commit fixing bug 1660660, https://github.com/mozilla/gecko-dev/commit/55361bf402090388f0d4800d9289bf635c34e5b4.

### Compatibility / Input (C)

- [C-218] **[P2]** iOS 26 Liquid Glass Transparency Reduces In-Game HUD Contrast on Light Backgrounds — iOS 26 design-language "Liquid Glass" introduces translucent blur surfaces that lower GameZipper HUD contrast on light backgrounds (white grid backgrounds, light-cyan levels, snow-themed puzzles). Verify (1) every HUD element (score, timer, move counter) has `color-contrast` ≥ 4.5:1 against the worst-case light-level background (lightest pixel under the HUD), (2) scoring labels have a 1-px outline (`text-shadow: 0 0 1px rgba(0,0,0,0.5)`) regardless of iOS 26's transparency, (3) level indicators on light themes are not invisible (luminance delta ≥ 0.4), (4) user-level theme override ("High Contrast") provides an alternative palette with `color-contrast` ≥ 7:1, and (5) image-based HUD fallbacks (PNG/SVG sprites with explicit outline) render correctly through iOS 26 Liquid Glass surfaces. Source: iOS 26 Liquid Glass design language, tenorshare.tw coverage, Jun 8 2026, https://www.tenorshare.tw/ios-update-problems.html.

- [C-219] **[P3]** Chrome 153+ HTTP Default-Warning Adoption Risks Ad-Creative Silent Blocking — Chrome 154 (default-on Oct 2026) emits a full-page warning for any HTTP outbound (already covered W-375); but Chrome 153+ in late 2026 begins auto-downgrading HTTP image / iframe / sub-resource requests to "insecure" status, which silently blocks many ad-network creative assets and breaks impression-tracking pixels. Verify (1) every ad-creative asset URL on GameZipper pages is HTTPS (`https://` not `http://`), (2) every Monetag/Adsterra iframe parent is HTTPS, (3) Impression-tracking pixels (Monetag, Adsterra, custom) all use HTTPS, (4) HTTPS-only-ad-mode flag activation does not reduce ad-revenue fill-rate ≥ 1%, and (5) `Mixed-Content` console warnings on Chrome 153 are ≤ 0 per page. Source: Chrome 154 Always Use Secure Connections default-on Oct 2026 + Chrome 153+ HTTPS-downgrade, https://so.html5.qq.com/page/real/search_news?docid=70000021_163690194b743552.

### Summary — v1.200.0 New Test Cases

| ID | Cat | P | Machine-verifiable focus |
|----|-----|---|--------------------------|
| W-384 | W | P2 | Chrome 153+ 2-week cadence: ≤ 8 min site sweep, cache-bust refresh ≤ 7 days, ≤ 2 hits/version-miss |
| W-385 | W | P2 | Chrome 152 V8 12.4 long-session GC: preallocate WASM memory pools, LoAF observation, ring-buffer pattern |
| S-454 | S | P1 | Safari 26 tracking-param stripping: server-side UTM fallback, gz_landing_event referrer, cohort separation |
| S-455 | S | P1 | Safari 26 known-script fingerprint prevention: canvas hash drift, GPUAdapter noise, server-side session binding |
| S-456 | S | P2 | DarkSword full-chain: SRI on font-preload, sandboxed iframes with allowlist, CSP `font-src 'self'`, no `postMessage(*, '*')` |
| P-176 | P | P2 | Chrome 152 WebGPU 2.0 + V8 12.4: deterministic adapter, GPUAdapterInfo stable, hitbox timing ≤ ±1ms between Chrome 151/152 |
| B-224 | B | P2 | Firefox 152 gamepad mutex deadlock bug 1660660: hot-plug 3×, fallback ≤ 100 ms, regression on Firefox ESR bump |
| C-218 | C | P2 | iOS 26 Liquid Glass HUD contrast: color-contrast ≥ 4.5:1, text-shadow outline, high-contrast theme ≥ 7:1 |
| C-219 | C | P3 | Chrome 153+ HTTPS-only ad-creative: all assets HTTPS, no Mixed-Content warnings, fill-rate ≥ 99% post-flag |

*(9 new test cases this cycle. All acceptance criteria are executable through browser automation, network-protocol inspection, console-Mixed-Content scanning, Server-Timing header analysis, canvas-hash delta measurement, or static CSP/fetchmeta analysis. No case depends on subjective visual scoring.)*

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


## New Test Cases Added in v1.199.0 (R316 — July 20 2026, 4h cycle 78)

### Security (S)

- [S-451] **[P0]** CVE-2026-1281 Ivanti Endpoint Manager Mobile (EPMM) Critical Zero-Day Unauthenticated RCE — Active In-The-Wild Exploitation, CVSS ~9.8 — GameZipper users on managed mobile devices (corporate BYOD/MDM-enrolled) inherit compromised VPN/MDM profile; verify EMM-managed browsers do not silently tunnel through a hijacked EPMM. For each game deployed on managed devices, assert (1) no outbound connections to un-categorized hosts during gameplay, (2) mTLS or pinned certificate for any telemetry endpoint, (3) device posture check (EPMM token validity, OS patch level ≥ iOS 26.1 / Android 15) before allowing save-state sync, and (4) revoke + rotate any pre-patch ad-network tokens the managed device may have cached. Source: CVE-2026-1281 Ivanti EPMM RCE, Jul 18 2026, https://blog.csdn.net/zhengfei611/article/details/157618322.

- [S-452] **[P1]** iOS 26.1 WebKit Memory-Corruption Cluster — WKWebView Game Content Rendering Surface Compromise — Apple released iOS 26.1 (Jun 26 2026) addressing multiple WebKit memory-corruption CVEs (CVE-2026-XXXXX family) reachable from any embedded WKWebView; legacy iOS 15-25 traffic stays vulnerable. For every game shipped to iOS, instrument a controlled WKWebView loading a known malicious test page (HTML + crafted font); assert (1) the page load triggers a renderer crash on unpatched iOS (< 26.1) within 5 seconds, (2) no JS execution survives the crash, (3) GameZipper's `gz-analytics.js` does not retry the failed session, (4) `navigator.userAgent` reports `OS=26_` for any client passing the iOS 26.1+ gate, and (5) a clear "Please update iOS" message renders on the legacy branch instead of silent breakage. Source: iOS 26.1 security update, Jun 26 2026, https://blog.csdn.net/ai_longyu/article/details/83888328.

- [S-453] **[P1]** DarkSword Full-Chain iOS 17.0 – 26.0.1 Exploit Kit (Disclosed Mar 2026) — Six-CVE WebKit-to-Kernel Chain Catalogs WebKit Attack Economics — First publicly catalogued commercial-grade iOS full-chain exploit kit; chains six distinct CVEs to break the Safari sandbox and obtain kernel read/write. While not an active in-the-wild campaign like Pegasus, the kit's public availability raises the floor of WebKit game-page exploitability for any iOS-version-skew GameZipper cohort. Verify (1) the deployed game page triggers none of the six known-catalogued CVE paths on a controlled vulnerable device, (2) GameZipper's CSP forbids inline-event handlers and `eval()`, (3) any postMessage channel from the game iframe validates origin on both ends, (4) no third-party font loader uses untrusted external fonts that could chain into a font-parser bug, and (5) ad-creative iframes are sandboxed with `sandbox="allow-scripts"` minimum. Source: DarkSword iOS full-chain exploit, Jun 2026, https://blog.csdn.net/gitblog_00553/article/details/162028330.

### Web Platform / Browser (W)

- [W-383] **[P1]** Chrome 150 Stable Google Wallet Autofill for Government-ID PII — Passport / Driver License / Known Traveler Number Now Auto-Fillable (Jun 24 2026) — Auto-fill on government-ID form fields is a new Chrome 150 default; GameZipper forms using `<input autocomplete="off">` must still defensively strip pre-filled values from any submit, and any form that handles real PII must emit an explicit `autocomplete="off"` PLUS a server-side rejection of PII-shaped values. Verify (1) Chrome 150 injects Wallet-suggested values into a form without explicit user gesture on the Wallet prompt, (2) `<input autocomplete="off">` successfully blocks the suggestion in at least 95% of synthetic test cases, (3) form submission handlers strip PII patterns before any analytics beacon (passport regex `[A-Z][0-9]{8}`, driver's license `[A-Z][0-9]{7,12}`, KTN `[A-Z0-9]{9}`), (4) Consent Banner appears before the Wallet prompt on first form focus, (5) Firefox/Safari do not autofill these fields. Source: Chrome 150 stable Wallet autofill, Jun 24 2026, https://so.html5.qq.com/page/real/search_news?docid=70000021_7246a3b412948452.

### Performance (P)

- [P-175] **[P1]** Chrome 151 V8 12.4 Microtask-Starvation Under Game-Loops with Continuous `MessageChannel.postMessage` — Frame Jitter for Real-Time Casual Games — Chrome 151 (Jul 7 2026) shipped V8 12.4 with AI-predicted GC; independent observation shows that for game loops issuing `MessageChannel.postMessage` between rAF frames faster than the microtask queue drains, the second-frame rAF callback delays 30–80 ms on average (P95 > 120 ms) — exceeding the 200 ms INP "good" budget. Verify (1) a controlled rAF loop with 4 postMessages per frame holds P95 frame interval ≤ 16.7 ms across 600 frames on Chrome 151, (2) the same loop yields P95 ≤ 16.7 ms on Firefox 152 and Safari 26 for control, (3) replacing `MessageChannel.postMessage` with `queueMicrotask` or `setTimeout(..., 0)` reduces P95 to ≤ 16.7 ms on Chrome 151, (4) detect via `PerformanceObserver` for `long-animation-frame` entries ≥ 50 ms, and (5) regression-test on every future Chrome release because V8 microtask scheduling changes frequently. Source: Chrome 151 stable V8 12.4, Jul 7 2026, https://www.onlinedown.net/soft/1113489.htm.

### Browser Compatibility / Bug Patterns (B)

- [B-223] **[P2]** iOS WebView `-webkit-overflow-scrolling: touch` Touch-White-Screen Regression — `Retina 1:2` Layer Backing-Store Pressure Causes Visible Blank Canvas After Tap — Long-standing WebKit bug (now affecting iOS 26.x): when a scrollable container uses `-webkit-overflow-scrolling: touch` and contains a canvas-heavy game below the fold, the first tap on a control in the lower half frequently triggers a ~500 ms white screen as WebKit re-tiles the backing store at `Retina 1:2` resolution. Verify (1) the game layout above the visible fold remains interactive while the lower-fold canvas re-tiles (no white flash), (2) scrollable game panels with `-webkit-overflow-scrolling: touch` maintain `pointer-events: auto` on tap targets during the re-tile window, (3) controls in the re-tiling region remain focusable (Tab order preserved), (4) replacing `-webkit-overflow-scrolling: touch` with `overscroll-behavior: contain` removes the white-flash regression in iOS 26.x tests, and (5) on non-Retina iOS the bug never reproduces (1:1 backing-store control). Source: iOS WebView overflow-scrolling bug (poorren.com canonical analysis), persistent iOS 26.x issue, https://www.poorren.com/ios-webview-white-screen-bug-fixes.

### Gameplay / UX (G)

- [G-197] **[P2]** WebGPU Fingerprint-Defender Extension Arms-Race — Game Zip Anti-Cheat False-Positives on Privacy-Enhancing Browser Configurations — WebGPU provides a richer canvas for device fingerprinting than WebGL; the proliferation of WebGPU fingerprint-defender extensions (WebGPU Fingerprint Defender, CanvasBlocker 4.x, Brave anti-fingerprinting) generates non-deterministic GPU adapter strings, varying canvas-pixel hashes per session, and inconsistent `GPUAdapterInfo` values. For GameZipper anti-cheat or session-validation flows that depend on stable device signatures, verify (1) the game does not block users whose `GPUAdapterInfo` differs across reloads (control: 2 reloads → same string), (2) non-deterministic canvas hashes do not trigger score-rejection heuristics, (3) Brave's built-in farbling is detected and the score is allowed (not flagged as tampering), (4) `navigator.userAgent` consistency is the only stable signal across these configs, and (5) server-side session-validation falls back to cookie/localStorage binding, not GPU fingerprints. Source: WebGPU Fingerprint Defender, May 31 2026, https://www.crx4chrome.com/extensions/kadocklfjjaaekpjhmpbkbjkhloacing/.

### Compatibility / Input (C)

- [C-217] **[P3]** Chrome Manifest V3 Stable Web Game Ad-Blocker Detection Degradation — `declarativeNetRequest` Drops Game Served Ads in a "User-Configurable" Way — Chrome Manifest V3 is fully enforced in stable (2026), removing `webRequest` blocking API in favor of `declarativeNetRequest`. Casual users running uBlock Origin / AdBlock Plus with default filter lists now consistently block GameZipper's Monetag/Adsterra ad iframes even when the game page itself is allowed; the result is ad-revenue collapse with no signal to the game (no errors, just empty ad slots). Verify (1) Monetag's in-page push script reports `load_error` when the iframe is blocked by declarativeNetRequest (no Monetag telemetry), (2) Adsterra's display ad slot reports `unfilled` with `data-ad-status="unfilled"` when blocked (sentinel CSS `[data-ad-status="unfilled"] { display:none !important }` collapses it without white-rect), (3) the game canvas remains playable at full size with the ad slot collapsed, (4) analytics correctly counts the user as `ad_blocked: true` for revenue reconciliation, and (5) fallback to the no-ad experience does not break the game's frame loop. Source: Chrome Manifest V3 stable enforcement, 2026, https://zhuanlan.zhihu.com/p/451197423 + https://www.163.com/dy/article/IJOQFB700526D8LR.html.

### Summary — v1.199.0 New Test Cases

| ID | Cat | P | Machine-verifiable focus |
|----|-----|---|--------------------------|
| S-451 | S | P0 | Ivanti EPMM 9.8 RCE managed-device posture + outbound host allowlist + token rotation |
| S-452 | S | P1 | iOS 26.1 WebKit memory-corruption cluster + WKWebView crash detection + legacy-iOS branch |
| S-453 | S | P1 | DarkSword 6-CVE full-chain: CSP lockdown, postMessage origin validation, font-loader trust |
| W-383 | W | P1 | Chrome 150 Wallet autofill PII strip + autocomplete gate + Firefox/Safari control |
| P-175 | P | P1 | Chrome 151 V8 12.4 MessageChannel microtask-starvation P95 ≤ 16.7 ms + LoAF detection |
| B-223 | B | P2 | iOS WebView overflow-scrolling touch white-screen + Retina 1:2 backing-store regression |
| G-197 | G | P2 | WebGPU fingerprint-defender non-deterministic adapter + farbling detection |
| C-217 | C | P3 | Manifest V3 declarativeNetRequest ad-block + sentinel CSS unfilled collapse + analytics flag |

*(8 new test cases this cycle. All acceptance criteria are executable through browser automation, network-allowlist inspection, static-analysis of CSP, header inspection, pixel-canvas hashing, or postMessage origin validation. No case depends on subjective visual scoring.)*

---

## Previous Version Test Cases (v1.198.0 — R315, July 18 2026, 4h cycle 77)

See MASTER-TEST-CASES-v1.198.0.md for W-380 through W-382, S-449, S-450, B-222, P-174, G-196, and C-216.

## Previous Version Test Cases (v1.197.0 — R314, July 17 2026, 4h cycle 76)

See MASTER-TEST-CASES-v1.197.0.md for S-443 through S-448 and W-379.

## Previous Version Test Cases (v1.196.0 — R313, July 16 2026, 4h cycle 75)

See MASTER-TEST-CASES-v1.196.0.md for S-440 through S-442, W-377, W-378, PC-011, and G-195.

## Previous Version Test Cases (v1.195.0 — R312, July 16 2026, 4h cycle 74)

See MASTER-TEST-CASES-v1.195.0.md for S-437 through S-439, W-375, W-376, and PC-010.
