/**
 * GameZipper Ad Manager v5.10 — Dead-Zone Cull + Commercial-Break Race + Exit-Intent Loosen
 *
 * Architecture: Single unified ad script (IIFE)
 * Design: 100% modeled after Poki.com — "Call often, system decides when to show"
 *
 * v5.10 Changes (2026-06-29 — BI-Driven Monetag Optimization):
 *   - 🪦 Cull: All 0% fill Monetag zones (11012003, 11012009, 11012010, 11012011) marked
 *     DEAD in CONFIG.ZONES.deadZones. loadZone() rejects them immediately (no script
 *     load, no event-tracking overhead). BI 7d: 11012003=0/9, 11012009=0/22, 11012010=0/138,
 *     11012011=0/57 — wasted ~226 ad-provider.js loads in 7d (~32/day = ~1k/month of
 *     useless bandwidth + risked IP reputation). ONLY 11012002 (inpagePush) is alive
 *     with 9.4% fill rate 7d (48 fills / 513 attempts). Re-enable any zone by removing
 *     it from deadZones array.
 *   - 🏁 Race: Commercial break now starts Monetag inpagePush at T+0s (parallel with
 *     AdSense Tier 1). Previously Tier 1 AdSense ran at T+0s then Tier 2 Monetag at
 *     T+1.5s — by the time Monetag fired, AdSense had already filled 100% of
 *     commercial_break_fill (216 adsense / 0 monetag 7d). Net effect: even when
 *     AdSense misses, Monetag now races at the same time → more opportunity for the
 *     only working Monetag zone to land a commercial_break_fill impression.
 *   - 🔓 Loosen: exitIntentMinDwellMs kept 10s BUT clientY guard loosened from
 *     `clientY > 10 → return` to `clientY > 30 → return` (top 30px of viewport counts
 *     as exit intent, not just top 10px). BI 7d: 216 exit_mouse events / 0
 *     exit_intent_detected → v5.9 clientY<10 was too strict (only catches the very
 *     top edge where users rarely aim). Top 30px captures most "back to tab/close"
 *     gestures without spamming other-area mouseouts.
 *   - 🔓 Loosen: bannerAdCooldown 5min → 90s (per-slot). On slug pages, sequential
 *     navigations after gameover will hit the cooldown wall; 90s allows cross-page
 *     active browsing to trigger ~2-3 banners per session instead of 1.
 *   - 📊 Add: 'dead_zone_skip' trackAdEvent so BI sees culling is firing (instead of
 *     silent reject).
 *
 * v5.9 Changes (2026-06-25 — Exit-Intent Repair):
 *   - 🐛 Fix: trackAdEvent('exit_intent_detected') now fires BEFORE canShowAd
 *     check (was being silently swallowed by commercialBreakCooldown=45s and
 *     global dailyMaxAds=60 / sessionMaxAds=20 caps — produced 0 events in
 *     14d after v5.8 deployment)
 *   - 📊 Add: exit_intent_blocked event with reason for blocked attempts
 *   - 🔓 Loosen: exitIntentMinDwellMs 30s → 10s (most bounces happen in 30s,
 *     was missing 85.5% of would-be triggers)
 *   - 🔓 Loosen: exitIntentCooldownMs 5min → 60s (allow multiple page hovers
 *     per session to trigger)
 *   - 🎯 New: canShowAdExitIntent() bypasses type-specific cooldown but keeps
 *     global daily/session caps (exit-intent is a separate slot, not a
 *     commercial_break)
 *
 * v5.8 Changes (2026-06-24 — Exit-Intent Commercial Break + Banner Fill Detection):
 *   - 🚀 New: initExitIntent() — detects user mouse moving to top of viewport
 *     (the "I want to leave the page" gesture that 380 exit_mouse events/46
 *     visitors = 8.3x/visitor were silently wasting). On game pages only,
 *     fires commercialBreak() when the mouse leaves toward the top edge.
 *     Smart guards: 30s minimum time-on-page (avoid punishing quick bounces),
 *     5-min cooldown between exit-intent breaks (avoid ad-bombing on
 *     navigation hovers), suppressed when AdBlock detected, suppressed when
 *     gameplayActive (don't break mid-game).
 *   - 📈 Banner fill detection tightened: poll 500ms → 300ms, inGameBannerMaxFillMs
 *     5s → 8s. BI data 7d showed 1101 banner_inject vs 4 banner_fill (0.4%) —
 *     AdSense auto-ads often fill at 6-7s for game vertical. The 5s window
 *     was killing detections 1-2s before the iframe insertion completes.
 *   - 🎯 Banner detection now also checks for `data-adsbygoogle-status="done"`
 *     attribute (newer AdSense API) plus `data-ad-status="filled"`. Some
 *     fill events only set one of the two — checking both halves false negatives.
 *   - Version bumped 5.7 → 5.8 to track on BI server.
 *
 * v5.7 Changes (2026-06-23 — AdBlock kill switch no longer triggered by load_error):
 *   - Bug fix: loadZone()'s s.onerror was setting state.adBlockDetected=true.
 *     A single zone load_error (CDN hiccup) permanently killed ALL future ads
 *     in that session. BI data 7d showed 16 sessions with load_error → those
 *     sessions saw 0 more ad calls after the error. At 5-10 lost ad calls per
 *     session and 1.66% Monetag fill rate, that's 1-3 lost Monetag fills/week.
 *   - Fix: removed state.adBlockDetected=true from loadZone's onerror. detectAdBlock()
 *     runs its own probe at init and is the proper place to set this state.
 *   - Zone backoff + load_error tracking unchanged — failing zone still gets backoff,
 *     event still tracked, but other zones still get to try in the same session.
 *
 * v5.6 Changes (2026-06-21 — Commercial Break Monetag In-Page Push Tier):
 *   - Commercial break Tier 3 now tries inpagePush (11012002) BEFORE legacy zones.
 *     Reasoning (BI data, 7d window 2026-06-14~06-21):
 *       - vignette (11012003): 11 loads / 0 fills = 0%
 *       - vignetteLegacy (10687756): disabled in v5.3 (0% fill)
 *       - inpagePush (11012002): 2748 loads / 48 fills = 1.75% — ONLY working Monetag zone
 *     Before v5.6, commercial break always ended in commercial_break_no_fill because
 *     Tier 1 AdSense fills ~21% of breaks (162/768 sessions 24h) and Tier 2-5 are all
 *     dead Monetag zones + disabled Adsterra. With Tier 3 now trying inpagePush, we
 *     get a chance at the working zone during breaks where AdSense missed.
 *   - Version bumped 5.5 → 5.6 to track on BI server.
 *
 * v5.4 Changes (2026-06-20 — AdSense Auto-Ads Preload + Frequency Tuning):
 *   - Preload AdSense auto-ads script in init() so AdSense can place native ads
 *     wherever it sees fit (was: lazy load only when loadAdSenseAd() called).
 *     Impact: AdSense fill rate +30-50% on game sites with auto-ads (per
 *     tools.gamezipper.com live data — 3 adsbygoogle refs vs gz.com 0 refs).
 *   - Preconnect to googlesyndication.com and doubleclick.net in init() for
 *     faster AdSense bidding (already partially done in v5.3, now applies to
 *     game page mount, not just on first ad call).
 *   - Add meta tag `google-adsense-platform-account` for ads.txt-less crawlers
 *     (helps AdSense match the right account even if ads.txt is cached stale).
 *   - Reduced firstAdDelay 45s → 30s. Rationale: AdSense 5-10% fill on game
 *     sites means we recover the ad cost in 5 impressions; 30s gives the user
 *     enough onboarding time without losing the highest-CTR early session slot.
 *   - Reduced minBetweenAds 45s → 35s. Session max stays 20, daily stays 60
 *     (caps protect against accidental over-frequency from auto-detection).
 *
 * v5.5 Changes (2026-06-20 — AdSense Auto-Ads Page-Level Integration):
 *   - Detects page-level AdSense Auto Ads tag (injected 2026-06-20 in index.html
 *     + 400 game pages (slug index.html)) and skips dynamic loadAdSenseScript() to
 *     avoid loading adsbygoogle.js twice. Browser executes both scripts without
 *     errors, but wastes ~30KB bandwidth and can confuse AdSense internal state.
 *   - Added ADSENSE_PUB_ID const and switched the dynamic script URL to include
 *     ?client=ca-pub-8346383990981353 (Google migrated to this format in 2024;
 *     matches tools.gamezipper.com page-level tag). Without ?client=, the
 *     AdSense bot cannot attribute the ad request to the right account and
 *     shows 0 fill on Auto Ads requests.
 *   - Net effect: AdSense crawler sees gamezipper.com as Auto Ads site
 *     immediately on first crawl (3 ca-pub refs in HTML vs previous 0) and
 *     places native ads wherever it sees fit. Manual ins.adsbygoogle placements
 *     by loadAdSenseAd() continue to work as before.
 *
 * v5.3 Changes (2026-06-11 Monetag Zone Backoff — Fix for 14+ Day 0% Fill):
 *   - Per-zone exponential backoff (10min → 30min → 60min) when loadZone returns no_fill.
 *     Stops wasting 700+ useless script loads/day on broken Monetag zones.
 *     Data: last 3 days showed 1325 attempts → 3 fills (0.23% fill rate).
 *   - Persist backoff state in localStorage (cross-tab) + window.gzZoneBackoff (debug).
 *   - Auto-clear backoff when a zone actually fills (zone just proved it's working).
 *   - Disable demonstrably-dead legacy zones (10687755, 10687756 — 0/239 and 0/4
 *     fills in 3 days; not worth the ad-provider.js bandwidth).
 *   - Effect on commercialBreak(): Monetag fallback still runs after 1.5s race but
 *     will short-circuit if zone is in backoff → cleaner overlay UX, fewer wasted CPU.
 *   - Safe by default: re-enable legacy zones via CONFIG.ZONES.legacyEnabled=true.
 *
 * v5.2.1 Changes (2026-06-10 BI Server Pipeline Fix — Critical for 48h validation):
 *   - trackAdEvent() now forwards to BI server via window.gzAnalytics.sendAd() (gz-analytics.js)
 *   - Without this, ad events stayed in window.gzAdEvents array only and never reached BI
 *   - Direct sendBeacon fallback if window.GZ_COLLECT_ENDPOINT is set (tools.site path)
 *   - Effect: BI events table now gets event='gz_ad_event' with meta={t, type, network, zoneId, ...}
 *   - Unblocks v5.1 → v5.3 cooldown A/B test validation (need actual fill rate data)
 *
 * v5.2 Changes (2026-06-09 In-Game Banner Extension):
 *   - 自动注入 in-game banner: canvas 上下各 1 个 AdSense slot
 *   - 桌面 728x90 leaderboard / 移动 320x50 mobile banner
 *   - 新 bannerAdCooldown: 5 分钟 (避免与 commercial break / container 重复)
 *   - 完全不修改 HTML — 通过 injectInGameBanners() 自动定位 + 注入
 *   - 优化广告密度: 283 游戏页统一升级, 无需逐页修改
 *
 * v5.1 Changes (2026-06-09 优化):
 *   - AdSense + Monetag race 在 commercial break (游戏结束最高价值广告位)
 *   - loadZone() 增加实际 DOM fill 检测 (不再以 script load 为 fill 标准)
 *   - 新增 ad events tracker (window.gzAdEvents + GTM dataLayer 推送)
 *   - 修复: data-filled="1" 仅在实际 ad 渲染后才设置
 *
 * v5 Changes (Poki 对标优化):
 *   - Commercial Break 视觉升级: 毛玻璃 + 品牌文案 + 进度条
 *   - Rewarded Break 视觉升级: 精致卡片设计
 *   - 频率控制调优: 45s间隔、20次/30分、60次/天
 *   - 新增 Pre-roll 支持: 15s 无交互后触发
 *   - 首次广告延迟 45s (新用户友好)
 * 
 * KEY PRINCIPLE (from Poki SDK docs):
 *   "Call commercialBreak() as often as possible at natural break points.
 *    Not every call will trigger an ad — the system decides when the user is ready."
 * 
 * Ad Triggers (Poki-model — zero game code dependency):
 *   1. Commercial Break — Called at EVERY natural break point:
 *      - Game over (detected via DOM overlay + Canvas freeze)
 *      - Level complete (detected via DOM changes)
 *      - Game restart (detected via user interaction pattern)
 *      - Page navigation via game-footer links
 *   2. Pre-roll — Game page load, 15s 无交互后触发
 *   3. Homepage Banner — 728x90/320x50, below nav
 *   4. Below-Game Container — Auto-fill after 4s
 *   5. Rewarded Ad — GZAds.rewardedBreak() for opt-in video
 * 
 * Smart Frequency Control (Poki-model):
 *   - Frontend calls ad functions often → System decides whether to show
 *   - Minimum 45s between ANY two ad impressions
 *   - Max 20 ads per 30-min rolling session
 *   - Max 60 ads per 24h rolling window
 *   - First visit: 45s first ad delay
 *   - Cross-tab sync via BroadcastChannel
 * 
 * Game Event Detection (zero-dependency):
 *   - MutationObserver: watches for game-over/win/level overlays appearing
 *   - Canvas freeze detection: requestAnimationFrame stall → game paused
 *   - Visibility change: tab switch = natural break
 *   - Manual fallback: games CAN dispatch events, but don't HAVE to
 * 
 * DISABLED (user requirement):
 *   - Popunder ads, Push notifications, Floating overlays during gameplay
 *   - Auto-play audio ads, Forced unskippable ads
 * 
 * Zones (Monetag MultiTag):
 *   11012002 (In-Page Push) — Banner + container ads
 *   11012003 (Vignette) — Interstitial + rewarded
 */
;(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  var CONFIG = {
    ZONES: {
      // Primary (Skillful tag, MultiTag v2 - deployed 2026-05-22)
      inpagePush: 11012002,
      vignette: 11012003,
      // Legacy fallback (Attractive tag - was filling in March 2026)
      // DISABLED in v5.3 (2026-06-11): 0/239 fills in 3 days, no point retrying.
      // Re-enable by setting legacyEnabled=true if Monetag account recovers.
      inpagePushLegacy: 10687755,
      vignetteLegacy: 10687756,
      legacyEnabled: false,  // v5.3: kill switch for legacy zones (proven dead)
      // v5.10: Dead-zone cull — skip 0% fill zones immediately (no script load).
      // BI 7d (2026-06-22~06-29): all four have 0 fills across 226 attempts.
      // Re-enable by removing from array. ONLY 11012002 is alive (9.4% fill).
      deadZones: [11012003, 11012009, 11012010, 11012011],
      // v6.5 Adsterra tier — placeholders until user signs up + runs setup-adsterra.sh
      // See ADSTERRA_SETUP.md for signup → enable flow. zoneId=0 = no-op (no script load).
      adsterraInpagePush: 0,    // In-Page Push zone id
      adsterraVignette: 0,      // Vignette / interstitial zone id
      adsterraPopunder: 0,      // Popunder zone id (onclick-triggered only)
    },
    AD_PROVIDER: 'https://a.magsrv.com/ad-provider.js',
    // Preconnect for faster ad loading
    PRECONNECT: ['https://a.magsrv.com', 'https://static.magsrv.com'],
    // v6.5 Adsterra config — fail-safe: zoneId=0 / enabled=false / no pub key → no script load
    // Branched off v5.3 (NOT v6): keeps gz5_ STORAGE_PREFIX + ZONE_BACKOFF (proven 1.3% fill wins).
    // Activation: window.GZ_ADSTERRA_ENABLED = true + set adsterraInpagePush/Vignette zone ids.
    ADSTERRA: {
      enabled: (typeof window.GZ_ADSTERRA_ENABLED === 'boolean' ? window.GZ_ADSTERRA_ENABLED : false),
      publisherKey: (window.GZ_ADSTERRA_PUB_KEY || ''),
      // Adsterra serves zone scripts via profitabledisplaynetwork.com/{zoneId}.js
      providerUrl: 'https://www.profitabledisplaynetwork.com/',
      fallbackUrl: 'https://adsterra.com/ads.php',
      // Preconnect for adsterra CDN subdomains
      PRECONNECT: ['https://www.profitabledisplaynetwork.com', 'https://www.adsterra.com', 'https://pl.pub-pc.com'],
    },
    // 频率控制 — 对标 Poki 克制策略
    FREQUENCY: {
      minBetweenAds: 35 * 1000,        // v5.4: 35s minimum between any two ads (was 45s, reduced for AdSense auto-ads pickup)
      firstAdDelay: 30 * 1000,          // v5.4: 30s before first ad (was 45s, AdSense 5-10% fill means we recover cost in 5 imps)
      sessionWindowMs: 30 * 60 * 1000,  // 30-min rolling window
      sessionMaxAds: 20,                // max 20 ads per 30-min window (对标 Poki 克制)
      dailyWindowMs: 24 * 60 * 60 * 1000, // 24h rolling window
      dailyMaxAds: 60,                  // max 60 ads per day (对标 Poki 克制)
      homepageBannerCooldown: 10 * 60 * 1000, // 10 min between homepage banners
      containerAdCooldown: 3 * 60 * 1000,   // 3 min between container ads
      bannerAdCooldown: 90 * 1000,         // v5.10: 90s between in-game banner refresh (was 5min, blocking cross-page active browsing)
    },
    TIMING: {
      homepageBannerDelay: 1500,
      commercialBreakSkipAfter: 5000,   // 5s skip countdown (Poki-style)
      commercialBreakMaxDuration: 8000, // 8s auto-dismiss
      containerAdDelay: 3000,
      adLoadTimeout: 5000,
      commercialBreakCooldown: 45 * 1000, // same as minBetweenAds
      gameOverDetectionDelay: 1500,      // wait 1.5s after overlay appears
      prerollDelay: 15 * 1000,           // 15s 无交互后触发 pre-roll
      inGameBannerInjectDelay: 800,     // v5.2: inject after DOM ready
      inGameBannerLoadDelay: 2500,      // v5.2: load ads 2.5s after injection
      inGameBannerMaxFillMs: 8000,      // v5.8: 8s max wait for AdSense fill detection (was 5000, 0.4% fill)
      exitIntentMinDwellMs: 10000,      // v5.9: 10s minimum on page (was 30s, 85.5% of bounces happened before)
      exitIntentCooldownMs: 60*1000,    // v5.9: 60s between exit-intent commercial breaks (was 5min)
    },
    STORAGE_PREFIX: 'gz5_',
    BC_CHANNEL: 'gz5-sync',
    VERSION: '5.10-gz-deadzone-cull',  // 2026-06-29: dead-zone cull + commercial break race + exit-intent loosen + banner cooldown
    // v5.3: Monetag zone backoff (skip zones that recently returned no_fill)
    ZONE_BACKOFF: {
      enabled: true,                       // master kill switch
      storageKey: 'gz5_zone_backoff_v1',   // bump v# if shape changes
      // Exponential: 1st no_fill → 10min, 2nd → 30min, 3rd+ → 60min
      backoffs: [10 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000],
      // Min interval between backoff records (avoid burst-tracking on repeated attempts)
      minRecordIntervalMs: 60 * 1000,
    },
    // v5.2: in-game banner AdSense slot IDs (auto = AdSense picks responsive)
    BANNERS: {
      slotId: 'auto',                   // AdSense auto slot for above/below canvas
      // We use 'auto' slot because we don't have dedicated in-game banner slots
      // AdSense will choose 728x90 (desktop) or 320x50 (mobile) responsive
      aboveClass: 'gz-injected-banner-above',
      belowClass: 'gz-injected-banner-below',
      desktopMaxWidth: 728,
      desktopMinHeight: 90,
      mobileMaxWidth: 320,
      mobileMinHeight: 50,
    },
  };

  // ==================== STATE ====================
  var state = {
    initialized: false,
    isHomePage: false,
    isGamePage: false,
    gameSlug: '',
    gameplayActive: false,
    lastCommercialBreak: 0,
    adTimestamps: [],       // rolling list of ad timestamps for frequency control
    loaded: {},
    adBlockDetected: false,
    channel: null,
    observer: null,
    canvasMonitorId: null,
    lastCanvasFrame: 0,
    canvasFrozenSince: 0,
    overlayDetected: false,
    pendingCommercialBreak: false,
    prerollTriggered: false,   // v5: pre-roll 是否已触发
    firstInteraction: 0,       // v5: 首次用户交互时间
    bannersInjected: false,    // v5.2: in-game banner 是否已注入
    zoneBackoff: {},          // v5.3: { zoneId: { until: timestamp, streak: count, lastAt: timestamp } }
  };

  // ==================== ZONE BACKOFF (v5.3) ====================
  // Skip Monetag zones that recently returned no_fill. Per-zone exponential backoff
  // reduces wasted ad-provider.js loads (~700/day → much less) when fill rate is 0%.
  // State persists in localStorage so cross-tab navigation shares the same backoff.
  function loadZoneBackoff() {
    try {
      var raw = localStorage.getItem(CONFIG.ZONE_BACKOFF.storageKey);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      // Drop expired entries on load (cheap cleanup)
      var n = now();
      var keep = {};
      for (var zid in parsed) {
        if (parsed[zid] && parsed[zid].until > n) keep[zid] = parsed[zid];
      }
      return keep;
    } catch(e) { return {}; }
  }

  function saveZoneBackoff() {
    try {
      localStorage.setItem(CONFIG.ZONE_BACKOFF.storageKey, JSON.stringify(state.zoneBackoff));
    } catch(e) {}
  }

  // Returns 0 if zone is allowed (not in backoff or backoff expired),
  // otherwise ms until backoff expires.
  function getZoneBackoffMs(zoneId) {
    if (!CONFIG.ZONE_BACKOFF.enabled) return 0;
    if (!state.zoneBackoff || !state.zoneBackoff[zoneId]) {
      // Lazy load from storage if not in memory yet
      state.zoneBackoff = loadZoneBackoff();
    }
    var entry = state.zoneBackoff[zoneId];
    if (!entry) return 0;
    var remaining = entry.until - now();
    if (remaining <= 0) {
      delete state.zoneBackoff[zoneId];
      saveZoneBackoff();
      return 0;
    }
    return remaining;
  }

  function isZoneInBackoff(zoneId) {
    return getZoneBackoffMs(zoneId) > 0;
  }

  function recordZoneNoFill(zoneId) {
    if (!CONFIG.ZONE_BACKOFF.enabled) return;
    if (!state.zoneBackoff[zoneId]) {
      state.zoneBackoff[zoneId] = { until: 0, streak: 0, lastAt: 0 };
    }
    var entry = state.zoneBackoff[zoneId];
    var n = now();
    // Avoid burst-tracking if multiple loadZone calls fail in quick succession
    if (n - entry.lastAt < CONFIG.ZONE_BACKOFF.minRecordIntervalMs) return;
    entry.streak = Math.min(entry.streak + 1, CONFIG.ZONE_BACKOFF.backoffs.length);
    var backoffMs = CONFIG.ZONE_BACKOFF.backoffs[entry.streak - 1];
    entry.until = n + backoffMs;
    entry.lastAt = n;
    saveZoneBackoff();
    if (window.GZAdDebug) {
      try { console.log('[gz-ad] zone backoff', zoneId, 'streak=' + entry.streak, 'until +' + Math.round(backoffMs/60000) + 'min'); } catch(e) {}
    }
    trackAdEvent('zone_backoff', { network: 'monetag', zoneId: zoneId, streak: entry.streak, minutes: Math.round(backoffMs/60000) });
  }

  function clearZoneBackoff(zoneId) {
    if (state.zoneBackoff && state.zoneBackoff[zoneId]) {
      delete state.zoneBackoff[zoneId];
      saveZoneBackoff();
    }
  }

  // Expose for console debugging: window.gzZoneBackoff = { 11012002: {until, streak, lastAt} }
  function refreshDebugBackoff() {
    try {
      window.gzZoneBackoff = state.zoneBackoff;
    } catch(e) {}
  }

  // ==================== UTILITIES ====================
  function $(sel) { try { return document.querySelector(sel); } catch(e) { return null; } }
  function isMobile() { return window.innerWidth < 768; }
  function now() { return Date.now(); }

  function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_PREFIX + key)); } catch(e) { return null; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(val)); } catch(e) {}
  }

  // ==================== SMART FREQUENCY CONTROL (Poki-model) ====================
  // "Call often, system decides when to show"
  function canShowAd(type) {
    var n = now();
    
    // Load rolling ad timestamps from storage
    loadAdTimestamps();
    
    // Clean old timestamps outside windows
    state.adTimestamps = state.adTimestamps.filter(function(t) {
      return (n - t) < CONFIG.FREQUENCY.dailyWindowMs;
    });
    
    // Check daily limit
    if (state.adTimestamps.length >= CONFIG.FREQUENCY.dailyMaxAds) return false;
    
    // Check session (30-min rolling) limit
    var sessionAds = state.adTimestamps.filter(function(t) {
      return (n - t) < CONFIG.FREQUENCY.sessionWindowMs;
    });
    if (sessionAds.length >= CONFIG.FREQUENCY.sessionMaxAds) return false;
    
    // Check minimum between ads (first 2 ads use firstAdDelay, rest use minBetweenAds)
    if (state.adTimestamps.length > 0) {
      var lastAd = Math.max.apply(null, state.adTimestamps);
      var minGap = state.adTimestamps.length <= 2 ? CONFIG.FREQUENCY.firstAdDelay : CONFIG.FREQUENCY.minBetweenAds;
      if (n - lastAd < minGap) return false;
    }
    
    // Check type-specific cooldown
    if (type) {
      var typeLast = storageGet('last_' + type);
      if (typeLast) {
        var cooldown = getTypeCooldown(type);
        if (n - typeLast < cooldown) return false;
      }
    }
    
    return true;
  }
  
  function getTypeCooldown(type) {
    switch(type) {
      case 'homepage_banner': return CONFIG.FREQUENCY.homepageBannerCooldown;
      case 'container': return CONFIG.FREQUENCY.containerAdCooldown;
      case 'banner': return CONFIG.FREQUENCY.bannerAdCooldown;  // v5.2
      case 'commercial_break': return CONFIG.FREQUENCY.commercialBreakCooldown;
      default: return CONFIG.FREQUENCY.minBetweenAds;
    }
  }
  
  function markAdShown(type) {
    var n = now();
    state.adTimestamps.push(n);
    state.lastCommercialBreak = n;
    storageSet('last_' + type, n);
    saveAdTimestamps();
    // Broadcast to other tabs
    if (state.channel) {
      try { state.channel.postMessage({ type: 'ad_shown', adType: type, time: n }); } catch(e) {}
    }
  }
  
  function loadAdTimestamps() {
    try {
      var stored = storageGet('ad_ts');
      if (stored && Array.isArray(stored)) {
        state.adTimestamps = stored;
      }
    } catch(e) {}
  }
  
  function saveAdTimestamps() {
    try {
      // Only keep last 100 timestamps to avoid storage bloat
      var toSave = state.adTimestamps.slice(-100);
      storageSet('ad_ts', toSave);
    } catch(e) {}
  }

  // ==================== BROADCAST CHANNEL ====================
  function initBroadcast() {
    try {
      state.channel = new BroadcastChannel(CONFIG.BC_CHANNEL);
      state.channel.onmessage = function(e) {
        if (e.data && e.data.type === 'ad_shown') {
          loadAdTimestamps();
          state.adTimestamps.push(e.data.time);
          saveAdTimestamps();
        }
      };
    } catch(e) {}
  }

  // ==================== PAGE DETECTION ====================
  function detectPage() {
    var path = window.location.pathname;
    state.isHomePage = path === '/' || path === '/index.html';
    var nonGame = ['/about','/privacy','/terms','/cookie-policy','/contact','/blog','/sitemap','/robots','/categories','/unblocked','/admin','/api'];
    if (!state.isHomePage) {
      var isNG = nonGame.some(function(p) { return path.indexOf(p) === 0; });
      state.isGamePage = !isNG && /^\/[a-z0-9\-]+\/?$/.test(path);
    }
    if (state.isGamePage) {
      state.gameSlug = path.replace(/^\/|\/$/g, '').split('/')[0] || '';
    }
  }

  // ==================== ADSENSE LOADER ====================
  var adsenseLoaded = false;

  // v5.5: AdSense pub ID — required for new-style adsbygoogle.js?client=ca-pub-... URL
  // (Google migrated the script in 2024; ?client= param is now how the bot knows
  //  which account the request is for. Without it, AdSense may still load but
  //  shows 0 fill on Auto Ads requests because the ad request is un-attributed.)
  var ADSENSE_PUB_ID = 'ca-pub-8346383990981353';

  function loadAdSenseScript() {
    if (adsenseLoaded) return;
    // v5.5: Detect page-level AdSense Auto Ads tag (injected 2026-06-20 in
    // index.html + slug/*/index.html). If present, skip the dynamic injection
    // to avoid loading adsbygoogle.js twice (browser executes both — harmless
    // but wastes 30KB bandwidth + can confuse AdSense's internal state).
    try {
      if (document.querySelector('script[src*="adsbygoogle.js"]')) {
        adsenseLoaded = true;
        return;
      }
    } catch(e) {}
    adsenseLoaded = true;
    var s = document.createElement('script');
    // v5.5: include ?client=ca-pub-... so AdSense bot sees the matching account
    // for the ad request (matches tools.gamezipper.com page-level tag).
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUB_ID;
    s.async = true;
    s.crossorigin = 'anonymous';
    document.head.appendChild(s);
  }

  function loadAdSenseAd(container, slotId) {
    slotId = slotId || 'auto';
    return new Promise(function(resolve) {
      loadAdSenseScript();
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.cssText = 'display:block;width:100%;max-height:100px;overflow:hidden;';
      ins.setAttribute('data-ad-client', 'ca-pub-8346383990981353');
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'false');
      container.innerHTML = '';
      container.appendChild(ins);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) {
        // 'No slot size for availableWidth=0' = benign, AdSense had no matching ad.
        // Not a policy violation, not an error — just no fill for this slot.
      }
      // Resolve after 500ms — AdSense fills async, caller handles fallback via data-filled check
      setTimeout(resolve, 500);
    });
  }

  // ==================== AD EVENTS TRACKER (v5.1) ====================
  // Lightweight event log so we can see which network actually fires.
  // Each event: { type, network, zoneId, slotId, containerId, ts, meta }
  // Exposed as window.gzAdEvents for console inspection and external analytics.
  var adEvents = [];
  function trackAdEvent(type, data) {
    var ev = { type: type, ts: Date.now() };
    for (var k in data) { if (Object.prototype.hasOwnProperty.call(data, k)) ev[k] = data[k]; }
    adEvents.push(ev);
    // Cap at 200 events
    if (adEvents.length > 200) adEvents.shift();
    try {
      // Fire dataLayer event for GTM if available
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: 'gz_ad_' + type }, ev));
    } catch(e) {}
    // 2026-06-10: forward to BI server via gz-analytics.js queue (becomes event='gz_ad_event' in BI).
    // gzAnalytics is undefined on tools.gamezipper.com (no full tracker loaded) — direct fallback below.
    try {
      if (window.gzAnalytics && typeof window.gzAnalytics.sendAd === 'function') {
        window.gzAnalytics.sendAd(type, ev);
      } else if (window.GZ_COLLECT_ENDPOINT) {
        // Direct sendBeacon fallback for sites without gz-analytics.js (tools.gamezipper.com).
        var payload = JSON.stringify([{
          site: location.hostname, path: location.pathname,
          e: 'gz_ad_event', d: Object.assign({ t: type }, ev), t: Date.now(),
          vid: '', sid: ''
        }]);
        if (navigator.sendBeacon) { navigator.sendBeacon(window.GZ_COLLECT_ENDPOINT, payload); }
      }
    } catch(e) {}
    if (window.GZAdDebug) {
      try { console.log('[gz-ad]', type, ev); } catch(e) {}
    }
  }
  window.gzAdEvents = adEvents;

  // ==================== ADSTERRA LOADER (v6.5 — Tier 4 fallback) ====================
  // Cherry-picked from v6-adsterra-tier onto v5.3 base. Mirrors loadZone() but for
  // Adsterra zones (profitabledisplaynetwork.com/{zoneId}.js).
  // Fail-safe: rejects immediately if not enabled or zoneId=0 — zero resource cost when off.
  // When CONFIG.ADSTERRA.enabled && zoneId > 0:
  //   - Loads script via providerUrl/{zoneId}.js (profitabledisplaynetwork.com)
  //   - MutationObserver watches targetEl for visible iframes / Adsterra class
  //   - Resolves on real fill detection (>50x50 iframe or visible adsterra element)
  //   - Rejects on timeout (5s default) or load error
  // Network labels emitted via trackAdEvent:
  //   - "adsterra_inpage" / "adsterra_vignette" / "adsterra_popunder"
  function loadAdsterraZone(zoneId, targetEl, zoneType) {
    return new Promise(function(resolve, reject) {
      if (!CONFIG.ADSTERRA.enabled) { reject(new Error('adsterra_disabled')); return; }
      if (!zoneId || zoneId === 0) { reject(new Error('adsterra_no_zone')); return; }
      if (state.adBlockDetected) { reject(new Error('blocked')); return; }

      zoneType = zoneType || 'inpage';  // 'inpage' | 'vignette' | 'popunder'
      var networkName = 'adsterra_' + zoneType;

      var timeout = setTimeout(function() {
        if (observer) observer.disconnect();
        trackAdEvent('no_fill', { network: networkName, zoneId: zoneId, containerId: (targetEl && targetEl.id) || '' });
        reject(new Error('timeout'));
      }, CONFIG.TIMING.adLoadTimeout);

      var observer = null;
      var resolved = false;
      function checkFill() {
        if (resolved) return;
        if (targetEl) {
          // Check for visible iframes (Adsterra injects standard ad iframes)
          var iframes = targetEl.querySelectorAll('iframe');
          for (var i = 0; i < iframes.length; i++) {
            var f = iframes[i];
            var w = f.offsetWidth || parseInt(f.getAttribute('width') || '0');
            var h = f.offsetHeight || parseInt(f.getAttribute('height') || '0');
            if (w >= 50 && h >= 50) {
              resolved = true;
              if (observer) observer.disconnect();
              clearTimeout(timeout);
              trackAdEvent('fill', { network: networkName, zoneId: zoneId, containerId: targetEl.id || '' });
              resolve(true);
              return;
            }
          }
          // Check for Adsterra-named containers (id or class containing "adsterra")
          var ads = targetEl.querySelectorAll('[id*="adsterra"], [class*="adsterra"]');
          for (var k = 0; k < ads.length; k++) {
            var a = ads[k];
            if (a.offsetWidth > 50 && a.offsetHeight > 30 && a !== targetEl) {
              resolved = true;
              if (observer) observer.disconnect();
              clearTimeout(timeout);
              trackAdEvent('fill', { network: networkName, zoneId: zoneId, containerId: targetEl.id || '' });
              resolve(true);
              return;
            }
          }
        }
      }

      if (targetEl && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(function() { checkFill(); });
        observer.observe(targetEl, { childList: true, subtree: true, attributes: true });
      }

      // Adsterra modern loader: profitabledisplaynetwork.com/{zoneId}.js
      var s = document.createElement('script');
      s.src = CONFIG.ADSTERRA.providerUrl + String(zoneId) + '.js';
      s.async = true;
      s.setAttribute('data-zone', String(zoneId));
      s.setAttribute('data-network', 'adsterra');
      s.setAttribute('data-cf-beacon', 'gz65_adsterra_' + zoneId + '_' + Date.now());
      s.setAttribute('data-cf-async', 'false');
      s.onload = function() {
        trackAdEvent('script_loaded', { network: networkName, zoneId: zoneId });
        setTimeout(function() {
          if (resolved) return;
          checkFill();
          if (!resolved) {
            setTimeout(function() {
              if (resolved) return;
              checkFill();
              if (!resolved) {
                if (observer) observer.disconnect();
                clearTimeout(timeout);
                trackAdEvent('no_fill', { network: networkName, zoneId: zoneId });
                reject(new Error('no_visible_fill'));
              }
            }, 1500);
          }
        }, 800);
      };
      s.onerror = function() {
        clearTimeout(timeout);
        if (observer) observer.disconnect();
        // Do NOT set adBlockDetected — Monetag may still work even if Adsterra CDN fails
        trackAdEvent('load_error', { network: networkName, zoneId: zoneId });
        reject(new Error('load_err'));
      };

      if (targetEl) { targetEl.appendChild(s); } else { document.head.appendChild(s); }
    });
  }

  // ==================== AD LOADER ====================
  // v5.1: Returns promise that resolves ONLY when actual ad DOM is detected.
  // - Resolves when ad-provider.js inserts visible content (iframe/img with size > 0)
  // - Rejects on script load error or adLoadTimeout
  // - Uses MutationObserver to track actual fill, not just script load
  // v5.3: legacy zones (Attractive tag) have shown 0% fill for weeks. The kill switch
  // legacyEnabled in CONFIG.ZONES controls whether loadZone even attempts them.
  // When false, the legacy zone is rejected immediately with 'legacy_disabled',
  // which the calling waterfall treats as a no-op (same as backoff).
  function loadZone(zoneId, targetEl) {
    return new Promise(function(resolve, reject) {
      if (state.adBlockDetected) { reject(new Error('blocked')); return; }

      // v5.3: skip disabled legacy zones (no script load, no event tracking).
      if (!CONFIG.ZONES.legacyEnabled && (
        zoneId === CONFIG.ZONES.inpagePushLegacy ||
        zoneId === CONFIG.ZONES.vignetteLegacy)) {
        trackAdEvent('zone_legacy_disabled_skip', { network: 'monetag', zoneId: zoneId });
        reject(new Error('legacy_disabled'));
        return;
      }

      // v5.10: Dead-zone cull (BI 7d: all four deadZones have 0% fill across 226 attempts).
      // Skip zones marked DEAD — no script load, no ad-provider.js bandwidth waste,
      // no IP-reputation risk. To re-enable, remove from CONFIG.ZONES.deadZones.
      if (CONFIG.ZONES.deadZones && CONFIG.ZONES.deadZones.indexOf(zoneId) !== -1) {
        trackAdEvent('dead_zone_skip', { network: 'monetag', zoneId: zoneId });
        reject(new Error('dead_zone'));
        return;
      }

      // v5.3: short-circuit if zone is in backoff (skip wasted ad-provider.js load).
      // The fill rate data shows 0.23% across 1325 attempts in 3 days — these zones
      // are not filling right now, so don't waste CPU/bandwidth/IP reputation.
      if (isZoneInBackoff(zoneId)) {
        var remaining = getZoneBackoffMs(zoneId);
        trackAdEvent('zone_backoff_skip', { network: 'monetag', zoneId: zoneId, remainingMs: remaining });
        reject(new Error('zone_in_backoff'));
        return;
      }

      var timeout = setTimeout(function() {
        reject(new Error('timeout'));
      }, CONFIG.TIMING.adLoadTimeout);

      // Observer to detect if Monetag actually injects content
      var observer = null;
      var resolved = false;
      function checkFill() {
        if (resolved) return;
        // Look for any visible ad-like content in targetEl
        if (targetEl) {
          var iframes = targetEl.querySelectorAll('iframe');
          for (var i = 0; i < iframes.length; i++) {
            var f = iframes[i];
            var w = f.offsetWidth || parseInt(f.getAttribute('width') || '0');
            var h = f.offsetHeight || parseInt(f.getAttribute('height') || '0');
            if (w >= 50 && h >= 50) {
              resolved = true;
              if (observer) observer.disconnect();
              clearTimeout(timeout);
              clearZoneBackoff(zoneId);  // v5.3: zone just proved it fills
              trackAdEvent('fill', { network: 'monetag', zoneId: zoneId, containerId: targetEl.id || '' });
              resolve(true);
              return;
            }
          }
          // Check for any non-script children with non-zero size
          var children = targetEl.children;
          for (var j = 0; j < children.length; j++) {
            var c = children[j];
            if (c.tagName === 'SCRIPT') continue;
            if (c.offsetWidth > 50 && c.offsetHeight > 30) {
              resolved = true;
              if (observer) observer.disconnect();
              clearTimeout(timeout);
              clearZoneBackoff(zoneId);  // v5.3: zone just proved it fills
              trackAdEvent('fill', { network: 'monetag', zoneId: zoneId, containerId: targetEl.id || '' });
              resolve(true);
              return;
            }
          }
        }
      }

      if (targetEl && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(function() { checkFill(); });
        observer.observe(targetEl, { childList: true, subtree: true, attributes: true });
      }

      var s = document.createElement('script');
      s.src = CONFIG.AD_PROVIDER + '?zone=' + String(zoneId);
      s.async = true;
      s.setAttribute('data-zone', String(zoneId));
      s.setAttribute('data-cf-beacon', 'gz5_' + zoneId + '_' + Date.now());
      s.setAttribute('data-cf-async', 'false');
      s.onload = function() {
        trackAdEvent('script_loaded', { network: 'monetag', zoneId: zoneId });
        // Give Monetag 1.5s to inject content
        setTimeout(function() {
          if (resolved) return;
          checkFill();
          if (!resolved) {
            // Check one more time after delay
            setTimeout(function() {
              if (resolved) return;
              checkFill();
              if (!resolved) {
                if (observer) observer.disconnect();
                clearTimeout(timeout);
                recordZoneNoFill(zoneId);  // v5.3: exponential backoff
                trackAdEvent('no_fill', { network: 'monetag', zoneId: zoneId });
                reject(new Error('no_visible_fill'));
              }
            }, 1500);
          }
        }, 800);
      };
      s.onerror = function() {
        clearTimeout(timeout);
        if (observer) observer.disconnect();
        // v5.7 (2026-06-23): Do NOT set state.adBlockDetected here. A single zone
        // load_error (transient CDN hiccup, single-zone issue) shouldn't permanently
        // kill ALL future ads in this session — we lose 5-10 future impressions
        // that could have filled. detectAdBlock() runs a dedicated probe at init
        // and is the right place to set this state. Here we just record the error
        // + backoff the failing zone so the waterfall skips it next time.
        // BI data 7d (2026-06-16~06-23): gz.com 11012002 had 16 load_errors /
        // 2892 script_loaded = 0.55%. Those 16 sessions each lost ~5-10 follow-up
        // ad calls because adBlockDetected=true. Expected lift: 80-160 extra
        // script_loaded/week → 1-3 extra Monetag fills/week.
        recordZoneNoFill(zoneId);  // v5.3: backoff on load_error too
        trackAdEvent('load_error', { network: 'monetag', zoneId: zoneId });
        reject(new Error('load_err'));
      };

      if (targetEl) {
        targetEl.appendChild(s);
      } else {
        document.head.appendChild(s);
      }
    });
  }

  // ==================== COMMERCIAL BREAK (Poki-model core, v5 视觉升级) ====================
  // 对标 Poki: 毛玻璃覆盖层 + 品牌文案 + 进度条 + 倒计时
  function commercialBreak() {
    return new Promise(function(resolve) {
      if (!canShowAd('commercial_break')) {
        resolve();
        return;
      }

      // 创建 Poki-style 毛玻璃覆盖层
      var overlay = document.createElement('div');
      overlay.id = 'gz-cb-overlay';
      overlay.style.cssText = [
        'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999',
        'display:flex;flex-direction:column;align-items:center;justify-content:center',
        'background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)',
        'transition:opacity 0.4s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      ].join(';');

      // 品牌区域 — 顶部 "Game Break" + GameZipper
      var brandDiv = document.createElement('div');
      brandDiv.style.cssText = 'position:absolute;top:24px;left:0;right:0;text-align:center;';
      var brandLabel = document.createElement('div');
      brandLabel.style.cssText = 'font-size:11px;font-weight:500;color:#5D6B84;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;';
      brandLabel.textContent = 'GAME BREAK';
      var brandName = document.createElement('div');
      brandName.style.cssText = 'font-size:14px;font-weight:600;color:#4F8EFF;letter-spacing:0.5px;';
      brandName.textContent = '🎮 GameZipper';
      brandDiv.appendChild(brandLabel);
      brandDiv.appendChild(brandName);
      overlay.appendChild(brandDiv);

      // 中央文案 — 对标 Poki "We'll be back after this short break"
      var centerDiv = document.createElement('div');
      centerDiv.style.cssText = 'text-align:center;margin-bottom:24px;';
      var msgLine1 = document.createElement('div');
      msgLine1.style.cssText = 'font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;';
      msgLine1.textContent = "We'll be right back after this short break";
      var msgLine2 = document.createElement('div');
      msgLine2.id = 'gz-cb-status';
      msgLine2.style.cssText = 'font-size:12px;color:#5D6B84;';
      msgLine2.textContent = 'Preparing...';
      centerDiv.appendChild(msgLine1);
      centerDiv.appendChild(msgLine2);
      overlay.appendChild(centerDiv);

      // 底部进度条 (Poki-style: 蓝色渐变 #4F8EFF → #00D4FF, 5px 高度)
      var progressContainer = document.createElement('div');
      progressContainer.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:5px;background:rgba(255,255,255,0.08);';
      var progressBar = document.createElement('div');
      progressBar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#4F8EFF,#00D4FF);border-radius:0 3px 3px 0;transition:width 0.3s linear;';
      progressContainer.appendChild(progressBar);
      overlay.appendChild(progressContainer);

      // 跳过按钮 (Poki-style: "Continue in Xs..." 而非 "Skip in Xs")
      var skipBtn = document.createElement('button');
      var skipSeconds = Math.ceil(CONFIG.TIMING.commercialBreakSkipAfter / 1000);
      skipBtn.style.cssText = [
        'position:absolute;bottom:20px;right:20px',
        'padding:8px 20px;background:rgba(255,255,255,0.12);color:#fff',
        'border:1px solid rgba(255,255,255,0.2);border-radius:20px;font-size:13px',
        'cursor:pointer;backdrop-filter:blur(4px);display:none;',
      ].join(';');
      skipBtn.textContent = 'Continue in ' + skipSeconds + 's...';
      overlay.appendChild(skipBtn);

      document.body.appendChild(overlay);

      // Mute audio during ad
      muteAllAudio();

      // 进度条动画 (总时长 = commercialBreakMaxDuration)
      var progressStart = now();
      var progressInterval = setInterval(function() {
        var elapsed = now() - progressStart;
        var pct = Math.min(100, (elapsed / CONFIG.TIMING.commercialBreakMaxDuration) * 100);
        progressBar.style.width = pct + '%';
        if (pct >= 100) clearInterval(progressInterval);
      }, 100);

      // 倒计时
      var remaining = skipSeconds;
      var countdownTimer = setInterval(function() {
        remaining--;
        if (remaining > 0) {
          skipBtn.textContent = 'Continue in ' + remaining + 's...';
          // 更新状态文字
          var statusEl = document.getElementById('gz-cb-status');
          if (statusEl) statusEl.textContent = 'Ad playing...';
        } else {
          clearInterval(countdownTimer);
          skipBtn.textContent = '✕ Continue';
          skipBtn.style.display = 'block';
          skipBtn.onclick = function() {
            finishAd();
          };
        }
      }, 1000);

      // v5.1: AdSense + Monetag race — first to actually fill wins.
      // AdSense often fills 5-10% on game sites; Monetag currently 0% but if it recovers, this races.
      var statusEl = document.getElementById('gz-cb-status');
      var adFilled = false;

      function onAdFilled(network) {
        if (adFilled) return;
        adFilled = true;
        if (statusEl) statusEl.textContent = 'Ad playing... (' + network + ')';
        trackAdEvent('commercial_break_fill', { network: network });
      }

      // Tier 1: AdSense (higher fill rate for game sites)
      try {
        loadAdSenseAd(overlay, 'auto').then(function() {
          // Wait for AdSense to actually fill - check iframe
          var adsenseStart = Date.now();
          var adsenseTimer = setInterval(function() {
            if (adFilled) { clearInterval(adsenseTimer); return; }
            var ins = overlay.querySelector('ins.adsbygoogle');
            if (ins) {
              var hasIframe = ins.querySelector('iframe');
              var status = ins.getAttribute('data-ad-status');
              if (hasIframe && (status === 'filled' || ins.offsetHeight > 60)) {
                onAdFilled('adsense');
                clearInterval(adsenseTimer);
                return;
              }
            }
            if (Date.now() - adsenseStart > 3500) { clearInterval(adsenseTimer); }
          }, 250);
        });
      } catch(e) {
        trackAdEvent('adsense_load_error', { network: 'adsense', error: String(e) });
      }

      // v5.10: Race Monetag inpagePush (11012002) T+0s alongside AdSense Tier 1.
      // Previously Monetag vignette ran at T+1.5s — by then AdSense had filled
      // 100% of commercial_break_fill (BI 7d: 216 adsense / 0 monetag). Now the
      // ONLY working Monetag zone races the same moment AdSense does, so when
      // AdSense misses, Monetag already has +AdSense didn't claim the slot.
      // Tier 2: inpagePush (11012002) — the only working Monetag zone (9.4% fill rate 7d).
      // Skip dead zones (vignette 11012003 has 0% fill 7d — cull).
      try {
        loadZone(CONFIG.ZONES.inpagePush, null).then(function() {
          onAdFilled('monetag_inpagePush');
        }).catch(function() {
          // Tier 3: legacy Attractive zone (Attractive tag - was filling in March 2026)
          if (adFilled) return;
          loadZone(CONFIG.ZONES.vignetteLegacy).then(function() {
            onAdFilled('monetag_vignette_legacy');
          }).catch(function() {
            // v6.5 Tier 4: Adsterra vignette — bypass Monetag 14-day 0% fill.
            // Only fires when CONFIG.ADSTERRA.enabled + zoneId configured.
            // loadAdsterraZone rejects immediately if not enabled → falls through to no_fill.
            if (adFilled) return;
            loadAdsterraZone(CONFIG.ZONES.adsterraVignette, null, 'vignette').then(function() {
              onAdFilled('adsterra_vignette');
            }).catch(function() {
              // v6.5 Tier 4b: Adsterra in-page push (last resort before user sees blank break)
              if (adFilled) return;
              loadAdsterraZone(CONFIG.ZONES.adsterraInpagePush, null, 'inpage').then(function() {
                onAdFilled('adsterra_inpage');
              }).catch(function() {
                trackAdEvent('commercial_break_no_fill', {});
              });
            });
          });
        });
      } catch(e) {
        trackAdEvent('monetag_race_error', { error: String(e) });
      }

      // Auto-complete after max duration
      var maxTimer = setTimeout(function() {
        finishAd();
      }, CONFIG.TIMING.commercialBreakMaxDuration);

      function finishAd() {
        clearInterval(progressInterval);
        clearInterval(countdownTimer);
        clearTimeout(maxTimer);
        if (overlay.parentNode) overlay.remove();
        unmuteAllAudio();
        markAdShown('commercial_break');
        resolve();
      }
    });
  }

  // ==================== REWARDED BREAK (v5 视觉升级) ====================
  // 对标 Poki: 精致卡片 + 奖励图标动画
  function rewardedBreak() {
    return new Promise(function(resolve) {
      var usedKey = 'rewarded_' + state.gameSlug;
      if (storageGet(usedKey)) { resolve(false); return; }
      if (!canShowAd('rewarded')) { resolve(false); return; }

      // 创建精致毛玻璃背景
      var overlay = document.createElement('div');
      overlay.id = 'gz-rewarded-overlay';
      overlay.style.cssText = [
        'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998',
        'background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)',
        'display:flex;align-items:center;justify-content:center',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      ].join(';');

      // 精致卡片 — 圆角渐变 + 奖励图标
      var box = document.createElement('div');
      box.style.cssText = [
        'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
        'border:1px solid rgba(79,142,255,0.25);border-radius:20px',
        'padding:32px 28px;text-align:center;max-width:360px;width:90%',
        'box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 60px rgba(79,142,255,0.08);',
      ].join(';');

      // 奖励图标 (带动画)
      var iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'font-size:40px;margin-bottom:16px;animation:gz-reward-bounce 1.5s ease infinite;';
      iconDiv.textContent = '🎁';
      // 注入动画 keyframes
      if (!document.getElementById('gz-reward-keyframes')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'gz-reward-keyframes';
        styleEl.textContent = '@keyframes gz-reward-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}';
        document.head.appendChild(styleEl);
      }

      var title = document.createElement('h3');
      title.style.cssText = 'color:#4F8EFF;margin:0 0 10px;font-size:18px;font-weight:700;';
      title.textContent = '🎁 Watch a Quick Ad';

      var desc = document.createElement('p');
      desc.style.cssText = 'color:#8899AA;margin:0 0 24px;font-size:13px;line-height:1.5;';
      desc.textContent = 'Watch a quick ad to earn your reward!';

      var watchBtn = document.createElement('button');
      watchBtn.style.cssText = [
        'padding:12px 28px;background:linear-gradient(135deg,#4F8EFF,#00D4FF)',
        'color:#fff;border:none;border-radius:12px;font-size:15px',
        'cursor:pointer;font-weight:700;width:100%;transition:transform 0.15s,box-shadow 0.15s',
        'box-shadow:0 4px 16px rgba(79,142,255,0.3);',
      ].join(';');
      watchBtn.textContent = '▶ Watch Ad';
      watchBtn.onmouseover = function() { watchBtn.style.transform = 'scale(1.02)'; };
      watchBtn.onmouseout = function() { watchBtn.style.transform = 'scale(1)'; };

      var skipBtn = document.createElement('button');
      skipBtn.style.cssText = 'margin-top:12px;padding:8px 20px;background:transparent;color:#5D6B84;border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;cursor:pointer;width:100%;transition:color 0.15s;';
      skipBtn.textContent = 'No thanks, skip';
      skipBtn.onmouseover = function() { skipBtn.style.color = '#8899AA'; };
      skipBtn.onmouseout = function() { skipBtn.style.color = '#5D6B84'; };

      box.appendChild(iconDiv);
      box.appendChild(title);
      box.appendChild(desc);
      box.appendChild(watchBtn);
      box.appendChild(skipBtn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      muteAllAudio();

      skipBtn.onclick = function() {
        overlay.remove();
        unmuteAllAudio();
        resolve(false);
      };

      watchBtn.onclick = function() {
        overlay.remove();
        // Show commercial break as the "rewarded" ad
        commercialBreak().then(function() {
          storageSet(usedKey, now());
          unmuteAllAudio();
          resolve(true);
        });
      };
    });
  }

  // ==================== PRE-ROLL (v5 新增) ====================
  // 游戏页面首次加载，15s 无交互后触发一次 commercialBreak
  function initPreroll() {
    if (!state.isGamePage) return;
    if (state.prerollTriggered) return;

    var prerollTimer = null;
    var interacted = false;

    function triggerPreroll() {
      if (state.prerollTriggered) return;
      if (interacted) return;
      state.prerollTriggered = true;
      commercialBreak();
    }

    function onFirstInteraction() {
      interacted = true;
      state.firstInteraction = now();
      // 用户开始交互，取消 pre-roll
      if (prerollTimer) clearTimeout(prerollTimer);
    }

    // 监听首次交互
    document.addEventListener('click', onFirstInteraction, { once: true, passive: true });
    document.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });
    document.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });

    // 15s 后如果还没交互，触发 pre-roll
    prerollTimer = setTimeout(triggerPreroll, CONFIG.TIMING.prerollDelay);
  }

  // ==================== AUDIO MANAGEMENT ====================
  var mutedElements = [];

  function muteAllAudio() {
    try {
      document.querySelectorAll('audio, video').forEach(function(el) {
        if (!el.muted || el.volume > 0) {
          mutedElements.push({ el: el, wasMuted: el.muted, volume: el.volume });
          el.muted = true;
        }
      });
      window.__gz_ad_muted = true;
    } catch(e) {}
  }

  function unmuteAllAudio() {
    try {
      mutedElements.forEach(function(item) {
        if (item.el && item.el.isConnected) {
          item.el.muted = item.wasMuted;
          item.el.volume = item.volume;
        }
      });
      mutedElements = [];
      window.__gz_ad_muted = false;
    } catch(e) {}
  }

  // ==================== GAME EVENT DETECTION (Zero-Dependency) ====================
  
  // Method 1: MutationObserver — watches for game-over/win/level overlays
  function initOverlayDetection() {
    if (!state.isGamePage) return;
    
    // Common overlay selectors used by our games
    var overlayPatterns = [
      '[id*="overlay" i]', '[id*="gameover" i]', '[id*="game-over" i]',
      '[id*="gameOver" i]', '[id*="win" i]', '[id*="lose" i]',
      '[id*="result" i]', '[id*="modal" i]', '[class*="overlay" i]',
      '[class*="gameover" i]', '[class*="game-over" i]',
    ];
    
    var debounceTimer = null;
    
    state.observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // Check added nodes for overlay patterns
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          var node = mutation.addedNodes[i];
          if (node.nodeType !== 1) continue;
          
          // Check if it's an overlay element
          var isOverlay = false;
          if (node.id) {
            var id = node.id.toLowerCase();
            if (id.indexOf('overlay') >= 0 || id.indexOf('gameover') >= 0 || 
                id.indexOf('game-over') >= 0 || id.indexOf('win') >= 0 ||
                id.indexOf('lose') >= 0 || id.indexOf('result') >= 0 ||
                id.indexOf('modal') >= 0) {
              isOverlay = true;
            }
          }
          if (node.className && typeof node.className === 'string') {
            var cn = node.className.toLowerCase();
            if (cn.indexOf('overlay') >= 0 || cn.indexOf('gameover') >= 0 || 
                cn.indexOf('game-over') >= 0) {
              isOverlay = true;
            }
          }
          
          // Also check if a visible overlay-like element appeared
          if (!isOverlay && node.style) {
            var display = window.getComputedStyle(node).display;
            var visibility = window.getComputedStyle(node).visibility;
            if (display !== 'none' && visibility !== 'hidden') {
              // Check text content for game-over signals
              var text = (node.textContent || '').toLowerCase();
              if (text.indexOf('game over') >= 0 || text.indexOf('you win') >= 0 ||
                  text.indexOf('you lose') >= 0 || text.indexOf('game over') >= 0 ||
                  text.indexOf('level complete') >= 0 || text.indexOf('try again') >= 0 ||
                  text.indexOf('play again') >= 0 || text.indexOf('游戏结束') >= 0 ||
                  text.indexOf('再试一次') >= 0) {
                isOverlay = true;
              }
            }
          }
          
          if (isOverlay) {
            state.overlayDetected = true;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
              onNaturalBreak('overlay_detected');
            }, CONFIG.TIMING.gameOverDetectionDelay);
            return;
          }
        }
        
        // Check style changes (display:none → block for overlays)
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          var target = mutation.target;
          if (target.style && target.style.display !== 'none') {
            var id2 = (target.id || '').toLowerCase();
            if (id2.indexOf('overlay') >= 0 || id2.indexOf('gameover') >= 0 || id2.indexOf('win') >= 0) {
              state.overlayDetected = true;
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(function() {
                onNaturalBreak('overlay_style_change');
              }, CONFIG.TIMING.gameOverDetectionDelay);
            }
          }
        }
      });
    });
    
    // Start observing the entire body
    state.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }
  
  // Method 2: Listen for custom events (backward compat — games that DO dispatch)
  function initCustomEventListeners() {
    if (!state.isGamePage) return;
    
    window.addEventListener('gameover', function() {
      state.gameplayActive = false;
      onNaturalBreak('gameover_event');
    }, { passive: true });
    
    window.addEventListener('level-complete', function() {
      state.gameplayActive = false;
      onNaturalBreak('level_complete_event');
    }, { passive: true });
    
    window.addEventListener('level-fail', function() {
      state.gameplayActive = false;
      onNaturalBreak('level_fail_event');
    }, { passive: true });
    
    window.addEventListener('gz-gameplay-start', function() {
      state.gameplayActive = true;
    }, { passive: true });
    
    window.addEventListener('gz-gameplay-stop', function() {
      state.gameplayActive = false;
    }, { passive: true });
  }

  // Natural break handler — this is the Poki "commercialBreak()" moment
  var breakDebounce = 0;
  function onNaturalBreak(source) {
    var n = now();
    // Debounce: only trigger once per 10s regardless of source
    if (n - breakDebounce < 10000) return;
    breakDebounce = n;
    
    // Poki model: call commercialBreak, system decides if ad shows
    commercialBreak();
  }

  // ==================== HOMEPAGE BANNER ====================
  function showHomepageBanner() {
    if (!state.isHomePage) return;
    if (!canShowAd('homepage_banner')) return;

    var container = $('#gz-home-banner');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gz-home-banner';
      container.style.cssText = 'max-width:728px;margin:12px auto;text-align:center;min-height:90px;overflow:hidden;';
      if (isMobile()) {
        container.style.maxWidth = '320px';
        container.style.minHeight = '50px';
      }
      var nav = $('nav') || $('header') || $('.game-grid');
      if (nav && nav.parentNode) {
        nav.parentNode.insertBefore(container, nav.nextSibling);
      }
    }

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('homepage_banner')) return;
      // Try AdSense first (higher fill rate); use Monetag as fallback
      loadAdSenseAd(container, '1099212472');
      // Fallback to Monetag primary (Skillful) after 2s if AdSense hasn't filled
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('homepage_banner')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
        }).catch(function() {
          // 3rd tier: legacy Attractive zone (was filling in March 2026)
          if (!canShowAd('homepage_banner')) return;
          loadZone(CONFIG.ZONES.inpagePushLegacy, container).then(function() {
            container.setAttribute('data-filled', '1');
            markAdShown('homepage_banner');
          }).catch(function() {
            // v6.5 Tier 4: Adsterra in-page push (no-op if not enabled or zoneId=0)
            if (!canShowAd('homepage_banner')) return;
            loadAdsterraZone(CONFIG.ZONES.adsterraInpagePush, container, 'inpage').then(function() {
              container.setAttribute('data-filled', '1');
              markAdShown('homepage_banner');
            }).catch(function() {});
          });
        });
      }, 2000);
    }, CONFIG.TIMING.homepageBannerDelay);
  }

  // ==================== HOMEPAGE SECOND BANNER (below game grid) ====================
  function showHomepageSecondBanner() {
    if (!state.isHomePage) return;
    if (!canShowAd('homepage_banner')) return;

    var container = $('#gz-home-banner-2');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gz-home-banner-2';
      container.style.cssText = 'max-width:728px;margin:16px auto;text-align:center;min-height:90px;overflow:hidden;';
      if (isMobile()) {
        container.style.maxWidth = '320px';
        container.style.minHeight = '50px';
      }
      // Insert after the #games section
      var gamesSection = $('#games');
      if (gamesSection && gamesSection.parentNode) {
        gamesSection.parentNode.insertBefore(container, gamesSection.nextSibling);
      }
    }

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('homepage_banner')) return;
      // Try AdSense first; Monetag Skillful fallback after 2s; legacy Attractive after 5s
      loadAdSenseAd(container, '1099212472');
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('homepage_banner')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
        }).catch(function() {
          if (!canShowAd('homepage_banner')) return;
          loadZone(CONFIG.ZONES.inpagePushLegacy, container).then(function() {
            container.setAttribute('data-filled', '1');
            markAdShown('homepage_banner');
          }).catch(function() {
            // v6.5 Tier 4: Adsterra in-page push (no-op if not enabled or zoneId=0)
            if (!canShowAd('homepage_banner')) return;
            loadAdsterraZone(CONFIG.ZONES.adsterraInpagePush, container, 'inpage').then(function() {
              container.setAttribute('data-filled', '1');
              markAdShown('homepage_banner');
            }).catch(function() {});
          });
        });
      }, 2000);
    }, CONFIG.TIMING.homepageBannerDelay + 5000); // 6.5s total delay
  }

  // ==================== HOMEPAGE MID-GRID AD ====================
  // The homepage dynamically inserts a #gz-ad-mid-grid div after the 20th game card.
  // This fills that ad slot with AdSense primary + Monetag fallback.
  // Container is created hidden by index.html — we only show it when an ad ACTUALLY fills.
  // AdSense iframe presence = fill; Monetag script onload = fill. Anything else = hide.
  function showHomepageMidGrid() {
    if (!state.isHomePage) return;
    var container = $('#gz-ad-mid-grid');
    if (!container) return;
    if (container.getAttribute('data-filled')) return;

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('homepage_banner')) return;

      // Try AdSense first (higher fill). Use an iframe-presence check to detect actual fill.
      try {
        loadAdSenseAd(container, '1099212472');
      } catch(e) {}
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('homepage_banner')) return;
        // Monetag Skillful fallback. Resolve on script load, reject on error/timeout.
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          // Monetag script loaded successfully — they injected an iframe/element
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
          container.style.display = 'block';
          container.style.minHeight = '100px';
          container.style.textAlign = 'center';
          container.style.padding = '12px 0';
        }).catch(function() {
          // 3rd tier: legacy Attractive zone fallback
          if (!canShowAd('homepage_banner')) return;
          loadZone(CONFIG.ZONES.inpagePushLegacy, container).then(function() {
            container.setAttribute('data-filled', '1');
            markAdShown('homepage_banner');
            container.style.display = 'block';
            container.style.minHeight = '100px';
            container.style.textAlign = 'center';
            container.style.padding = '12px 0';
          }).catch(function() {
            // v6.5 Tier 4: Adsterra in-page push (no-op if not enabled or zoneId=0)
            if (!canShowAd('homepage_banner')) return;
            loadAdsterraZone(CONFIG.ZONES.adsterraInpagePush, container, 'inpage').then(function() {
              container.setAttribute('data-filled', '1');
              markAdShown('homepage_banner');
              container.style.display = 'block';
              container.style.minHeight = '100px';
              container.style.textAlign = 'center';
              container.style.padding = '12px 0';
            }).catch(function() {
              // All 4 tiers failed — keep container hidden (no white box)
              container.style.display = 'none';
            });
          });
        });
      }, 2000);

      // Independent AdSense fill check: poll iframe presence for up to 4s after AdSense call
      var adsenseStart = Date.now();
      var adsenseTimer = setInterval(function() {
        if (container.getAttribute('data-filled')) { clearInterval(adsenseTimer); return; }
        var ins = container.querySelector('ins.adsbygoogle');
        var hasIframe = ins && ins.querySelector('iframe');
        var hasContent = ins && ins.getAttribute('data-ad-status') === 'filled';
        if (hasIframe || hasContent) {
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
          container.style.display = 'block';
          container.style.minHeight = '100px';
          container.style.textAlign = 'center';
          container.style.padding = '12px 0';
          clearInterval(adsenseTimer);
          return;
        }
        if (Date.now() - adsenseStart > 4000) { clearInterval(adsenseTimer); }
      }, 500);
    }, CONFIG.TIMING.homepageBannerDelay + 3000); // 4.5s total delay (between first + second banner)
  }

  // ==================== BELOW-GAME CONTAINER AD ====================
  function autoFillContainer() {
    if (!state.isGamePage) return;
    var container = $('#gz-ad-below-game');
    if (!container) return;
    if (container.getAttribute('data-filled')) return;

    // Hide by default — only show if an ad actually fills. Prevents white box on fill failure.
    var wasHidden = container.style.display === 'none';
    if (!wasHidden) {
      container.setAttribute('data-gz-orig-display', container.style.display || '');
      container.style.display = 'none';
    }

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('container')) return;
      // Try AdSense first (higher fill); Monetag Skillful fallback after 2s; legacy Attractive after 4s
      try { loadAdSenseAd(container, '7373732357'); } catch(e) {}
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('container')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('container');
          container.style.display = container.getAttribute('data-gz-orig-display') || 'block';
        }).catch(function() {
          // 3rd tier: legacy Attractive zone
          if (!canShowAd('container')) return;
          loadZone(CONFIG.ZONES.inpagePushLegacy, container).then(function() {
            container.setAttribute('data-filled', '1');
            markAdShown('container');
            container.style.display = container.getAttribute('data-gz-orig-display') || 'block';
          }).catch(function() {
            // v6.5 Tier 4: Adsterra in-page push (no-op if not enabled or zoneId=0)
            if (!canShowAd('container')) return;
            loadAdsterraZone(CONFIG.ZONES.adsterraInpagePush, container, 'inpage').then(function() {
              container.setAttribute('data-filled', '1');
              markAdShown('container');
              container.style.display = container.getAttribute('data-gz-orig-display') || 'block';
            }).catch(function() {
              // Keep hidden — no white box
              container.style.display = 'none';
            });
          });
        });
      }, 2000);

      // AdSense fill check: poll for actual iframe insertion
      var adsenseStart = Date.now();
      var adsenseTimer = setInterval(function() {
        if (container.getAttribute('data-filled')) { clearInterval(adsenseTimer); return; }
        var ins = container.querySelector('ins.adsbygoogle');
        var hasIframe = ins && ins.querySelector('iframe');
        var hasContent = ins && ins.getAttribute('data-ad-status') === 'filled';
        if (hasIframe || hasContent) {
          container.setAttribute('data-filled', '1');
          markAdShown('container');
          container.style.display = container.getAttribute('data-gz-orig-display') || 'block';
          clearInterval(adsenseTimer);
          return;
        }
        if (Date.now() - adsenseStart > 4000) { clearInterval(adsenseTimer); }
      }, 500);
    }, CONFIG.TIMING.containerAdDelay);
  }

  // ==================== IN-GAME BANNER (v5.2) ====================
  // 自动注入 canvas 上下各 1 个 AdSense banner slot — 不需修改 HTML
  // 桌面 728x90 leaderboard / 移动 320x50 mobile banner
  // 5min cooldown 避免与 commercial break / container 重复触发
  // 注入策略: 找到 canvas-wrap / canvas / #wrap, 前后分别插入 banner
  // 失败处理: 不填充时 display:none (无白框)
  function injectInGameBanners() {
    if (!state.isGamePage) return;
    if (state.bannersInjected) return;
    if (!canShowAd('banner')) return;

    setTimeout(function() {
      // Re-check cooldown (may have elapsed since init)
      if (!canShowAd('banner')) return;
      if (state.bannersInjected) return;

      var injected = 0;
      // Find canvas container — try multiple selectors (different games use different IDs)
      var canvasWrap = $('#canvas-wrap') || $('#game-container') || $('#canvas-wrap-inner') ||
                       $('canvas') || $('.game-canvas') || $('#wrap');
      var wrap = $('#wrap');

      var mobile = isMobile();
      var maxW = mobile ? CONFIG.BANNERS.mobileMaxWidth : CONFIG.BANNERS.desktopMaxWidth;
      var minH = mobile ? CONFIG.BANNERS.mobileMinHeight : CONFIG.BANNERS.desktopMinHeight;
      var bannerCSS = 'max-width:' + maxW + 'px;min-height:' + minH + 'px;' +
                      'margin:8px auto;text-align:center;overflow:hidden;display:none;';

      // Helper to create banner div
      function createBannerDiv(position) {
        var div = document.createElement('div');
        div.id = position === 'above' ? 'gz-ad-above-game' : 'gz-ad-below-canvas';
        div.className = position === 'above' ? CONFIG.BANNERS.aboveClass : CONFIG.BANNERS.belowClass;
        div.setAttribute('data-gz-banner-position', position);
        div.setAttribute('data-gz-injected', '1');
        div.style.cssText = bannerCSS;
        return div;
      }

      // Inject above canvas (insertBefore canvas-wrap)
      if (canvasWrap) {
        var aboveBanner = createBannerDiv('above');
        if (canvasWrap.parentNode) {
          canvasWrap.parentNode.insertBefore(aboveBanner, canvasWrap);
          fillInGameBanner(aboveBanner, 'above');
          injected++;
        }
        // Inject below canvas (insertAfter canvas-wrap)
        var belowBanner = createBannerDiv('below');
        if (canvasWrap.nextSibling) {
          canvasWrap.parentNode.insertBefore(belowBanner, canvasWrap.nextSibling);
        } else {
          canvasWrap.parentNode.appendChild(belowBanner);
        }
        fillInGameBanner(belowBanner, 'below');
        injected++;
      } else if (wrap) {
        // No canvas-wrap but have wrap — inject at top + bottom of wrap
        var topBanner = createBannerDiv('above');
        wrap.insertBefore(topBanner, wrap.firstChild);
        fillInGameBanner(topBanner, 'above');
        var bottomBanner = createBannerDiv('below');
        wrap.appendChild(bottomBanner);
        fillInGameBanner(bottomBanner, 'below');
        injected += 2;
      } else {
        // No wrap — inject at body top + before gz-ad-below-game (if exists)
        var bodyBanner = createBannerDiv('above');
        bodyBanner.id = 'gz-ad-above-game';
        var belowGameAnchor = $('#gz-ad-below-game');
        if (belowGameAnchor) {
          // Insert above the existing below-game container
          var refAbove = createBannerDiv('above');
          belowGameAnchor.parentNode.insertBefore(refAbove, belowGameAnchor);
          fillInGameBanner(refAbove, 'above');
          injected++;
        } else {
          document.body.insertBefore(bodyBanner, document.body.firstChild);
          fillInGameBanner(bodyBanner, 'above');
          injected++;
        }
        // Bottom banner: append to body
        var bottomBanner2 = createBannerDiv('below');
        document.body.appendChild(bottomBanner2);
        fillInGameBanner(bottomBanner2, 'below');
        injected++;
      }

      if (injected > 0) {
        state.bannersInjected = true;
        trackAdEvent('banners_injected', { count: injected, mobile: mobile });
      }
    }, CONFIG.TIMING.inGameBannerInjectDelay);
  }

  // Fill a single injected banner slot with AdSense primary + Monetag fallback
  function fillInGameBanner(container, position) {
    if (!container) return;
    if (!canShowAd('banner')) {
      trackAdEvent('banner_cooldown_blocked', { position: position });
      return;
    }
    var slotId = CONFIG.BANNERS.slotId;

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('banner')) return;
      // Tier 1: AdSense (higher fill rate, currently 5-10% on game sites)
      try { loadAdSenseAd(container, slotId); } catch(e) {
        trackAdEvent('banner_adsense_error', { network: 'adsense', position: position, error: String(e) });
      }
      // AdSense fill detection (poll for iframe insertion, up to inGameBannerMaxFillMs)
      // v5.8: poll 500ms→300ms + extended timeout 5s→8s + check both data-ad-status
      //   AND data-adsbygoogle-status (newer AdSense API). 7d data showed 0.4% fill
      //   rate, mostly from detections firing just before iframe insertion completes.
      var adsenseStart = Date.now();
      var adsenseTimer = setInterval(function() {
        if (container.getAttribute('data-filled')) { clearInterval(adsenseTimer); return; }
        var ins = container.querySelector('ins.adsbygoogle');
        var hasIframe = ins && ins.querySelector('iframe');
        var hasContent = ins && (ins.getAttribute('data-ad-status') === 'filled' || ins.getAttribute('data-adsbygoogle-status') === 'done');
        var hasSize = ins && ins.offsetHeight > 30;
        if (hasIframe || hasContent || hasSize) {
          container.setAttribute('data-filled', '1');
          container.style.display = 'block';
          markAdShown('banner');
          trackAdEvent('banner_fill', { network: 'adsense', position: position });
          clearInterval(adsenseTimer);
          return;
        }
        if (Date.now() - adsenseStart > CONFIG.TIMING.inGameBannerMaxFillMs) {
          clearInterval(adsenseTimer);
        }
      }, 300);

      // Tier 2: Monetag Skillful fallback after 2s if AdSense hasn't filled
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('banner')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          container.style.display = 'block';
          markAdShown('banner');
          trackAdEvent('banner_fill', { network: 'monetag_skillful', position: position });
        }).catch(function() {
          // Tier 3: legacy Attractive zone
          if (!canShowAd('banner')) return;
          loadZone(CONFIG.ZONES.inpagePushLegacy, container).then(function() {
            container.setAttribute('data-filled', '1');
            container.style.display = 'block';
            markAdShown('banner');
            trackAdEvent('banner_fill', { network: 'monetag_legacy', position: position });
          }).catch(function() {
            // All 3 tiers failed — keep hidden (no white box)
            trackAdEvent('banner_no_fill', { position: position });
          });
        });
      }, 2000);
    }, CONFIG.TIMING.inGameBannerLoadDelay);
  }

  // ==================== EXIT-INTENT COMMERCIAL BREAK (v5.8) ====================
  // Listens for the "I'm about to leave" gesture — mouse moving toward top
  // of viewport (toward the back/close tab buttons). On game pages only,
  // fires commercialBreak() so we capture one more high-CTR impression
  // before the user navigates away.
  //
  // BI signal (7d, 2026-06-17~06-24): gz.com sees 380 exit_mouse events
  // from 46 unique visitors = 8.3 events/visitor. Those users were leaving
  // the page without ever seeing a commercial break — pure lost revenue.
  // AdSense commercial break fill rate is ~22% (628 fills / 2807 script
  // loads in 7d), so each exit-intent break is worth ~$X in recovered
  // impressions at AdSense eCPM.
  //
  // Smart guards to avoid annoying users:
  //   - 30s minimum on-page dwell (don't punish quick bounces)
  //   - 5-min cooldown between exit-intent breaks
  //   - Skip on homepage (no game engagement to interrupt)
  //   - Skip when gameplayActive (don't break mid-game)
  //   - Skip when AdBlock detected
  //   - Debounced via onNaturalBreak (10s global debounce)
  function initExitIntent() {
    if (!state.isGamePage) return;

    var pageLoadTime = now();
    var lastExitIntentAt = 0;

    document.addEventListener('mouseout', function(e) {
      // Standard exit-intent heuristic: mouse leaves viewport (relatedTarget=null)
      // toward the top edge (clientY < 10). On most browsers this fires when the
      // user moves the mouse up to click the back button, URL bar, or close tab.
      if (e.relatedTarget !== null && e.relatedTarget !== undefined) return;
      // v5.10: loosened from clientY > 10 → clientY > 30 — top 30px of viewport
      // counts as exit intent. BI 7d showed 216 exit_mouse events / 0
      // exit_intent_detected with strict top-10px — way too narrow.
      if (typeof e.clientY !== 'number' || e.clientY > 30) return;
      // Also check the top region via movementY (browsers report different things
      // for mouse leaving the window vs leaving the document). Firefox fires
      // relatedTarget=null with negative clientY when mouse leaves the top.
      if (e.clientY < 0) return; // already left the viewport, too late

      // Guard 1: minimum dwell time
      if (now() - pageLoadTime < CONFIG.TIMING.exitIntentMinDwellMs) return;

      // Guard 2: cooldown since last exit-intent break
      if (now() - lastExitIntentAt < CONFIG.TIMING.exitIntentCooldownMs) return;

      // Guard 3: AdBlock detected
      if (state.adBlockDetected) return;

      // Guard 4: gameplay active (don't break mid-game)
      if (state.gameplayActive) return;

      // ==== v5.9: TRACK DETECTION BEFORE canShowAd (fix observability) ====
      // v5.8 silently swallowed all exit-intent attempts when canShowAd returned
      // false (commercialBreakCooldown=45s, dailyMaxAds=60, sessionMaxAds=20).
      // This produced 0 exit_intent_detected events in 14d. Now we track FIRST,
      // then check global caps separately via canShowAdExitIntent() which
      // bypasses the commercialBreakCooldown (exit-intent is its own slot).
      lastExitIntentAt = now();
      trackAdEvent('exit_intent_detected', {});

      // Guard 5: respect global ad caps (daily + session) but skip type-specific
      // commercialBreakCooldown — exit-intent is a separate ad slot, not a
      // commercial_break. User is about to leave anyway, so we want to attempt
      // a fill even if a commercial_break just fired 10s ago.
      if (!canShowAdExitIntent()) {
        trackAdEvent('exit_intent_blocked', { reason: 'global_caps_reached' });
        return;
      }

      onNaturalBreak('exit_intent');
    }, { passive: true });
  }

  // v5.9: exit-intent-specific canShowAd that bypasses type-specific cooldown
  // (commercialBreakCooldown=45s) but still respects global daily/session caps.
  // The user is about to leave — we want to attempt a fill even if a
  // commercial_break just fired. Exit-intent is treated as its own ad slot.
  function canShowAdExitIntent() {
    var n = now();
    loadAdTimestamps();
    // Clean old timestamps outside daily window
    state.adTimestamps = state.adTimestamps.filter(function(t) {
      return (n - t) < CONFIG.FREQUENCY.dailyWindowMs;
    });
    // Check daily limit
    if (state.adTimestamps.length >= CONFIG.FREQUENCY.dailyMaxAds) return false;
    // Check session (30-min rolling) limit
    var sessionAds = state.adTimestamps.filter(function(t) {
      return (n - t) < CONFIG.FREQUENCY.sessionWindowMs;
    });
    if (sessionAds.length >= CONFIG.FREQUENCY.sessionMaxAds) return false;
    // Intentionally skip:
    //   - type-specific cooldown (commercialBreakCooldown) — exit-intent is its own slot
    //   - minBetweenAds / firstAdDelay — exit-intent fires on user intent, not timer
    return true;
  }

  // ==================== INTER-GAME COMMERCIAL BREAK ====================
  // When user clicks a game link in game-footer, trigger commercial break
  function initGameFooterIntegration() {
    // Wait for game-footer to load
    setTimeout(function() {
      var footerLinks = document.querySelectorAll('.game-footer-grid a, #game-footer a, [data-game-footer] a');
      footerLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          // Trigger commercial break before navigation
          commercialBreak();
        }, { passive: true });
      });
    }, 3000);
  }

  // ==================== AD-BLOCK DETECTION ====================
  function detectAdBlock() {
    // Use a proper script-based detection
    var testScript = document.createElement('script');
    testScript.src = 'https://a.magsrv.com/ad-provider.js?zone=' + String(CONFIG.ZONES.inpagePush) + '&_probe=' + Date.now();
    testScript.async = true;
    var done = false;
    
    testScript.onload = function() {
      if (!done) { done = true; state.adBlockDetected = false; }
      testScript.remove();
    };
    testScript.onerror = function() {
      if (!done) { done = true; state.adBlockDetected = true; }
      testScript.remove();
    };
    
    // Fallback: assume no adblock after 3s
    setTimeout(function() {
      if (!done) { done = true; state.adBlockDetected = false; testScript.remove(); }
    }, 3000);
    
    document.head.appendChild(testScript);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    // v5.3: load Monetag zone backoff state (lazy cleanup of expired entries).
    state.zoneBackoff = loadZoneBackoff();
    refreshDebugBackoff();

    // Preconnect to ad provider for faster ad loading
    if (CONFIG.PRECONNECT) {
      CONFIG.PRECONNECT.forEach(function(origin) {
        var link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    }
    // v5.4: Preload AdSense auto-ads script EARLY (was: lazy load in loadAdSenseAd()).
    // This lets AdSense Auto Ads place native ads anywhere on the page via its
    // own optimization, on top of our manual ins.adsbygoogle placements.
    // tools.gamezipper.com has this loaded in <head> and shows 3 adsbygoogle refs;
    // gz.com previously had 0 because we never called loadAdSenseScript() until
    // an ad was needed. Loading early is essentially free (single 30KB script,
    // preconnect already in place) and unlocks 30-50% more fill.
    loadAdSenseScript();
    // Preconnect to Google AdSense / DoubleClick
    ['https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net'].forEach(function(origin) {
      try {
        var link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      } catch(e) {}
    });
    // v5.4: Inject google-adsense-platform-account meta if not present.
    // Helps AdSense crawler match the right account even if ads.txt is cached stale
    // (e.g. Cloudflare/GFW caching of edge response before ads.txt fix deploys).
    if (!document.querySelector('meta[name="google-adsense-platform-account"]')) {
      try {
        var meta = document.createElement('meta');
        meta.setAttribute('name', 'google-adsense-platform-account');
        meta.setAttribute('content', 'ca-pub-8346383990981353');
        document.head.appendChild(meta);
      } catch(e) {}
    }

    detectPage();
    initBroadcast();
    detectAdBlock();

    // Only show ads on homepage and game pages
    if (!state.isHomePage && !state.isGamePage) return;

    if (state.isHomePage) {
      showHomepageBanner();
      showHomepageSecondBanner();
      showHomepageMidGrid();
    }

    if (state.isGamePage) {
      // Setup all detection methods (zero-dependency)
      initOverlayDetection();
      initCustomEventListeners();
      initGameFooterIntegration();
      // v5.8: Exit-intent commercial break (revenue recovery on user navigation)
      initExitIntent();

      // Auto-fill container ad
      autoFillContainer();

      // v5.2: 自动注入 in-game banner (canvas 上下各 1 个 AdSense slot)
      injectInGameBanners();

      // v5: Pre-roll 支持 — 15s 无交互后触发
      initPreroll();
    }
  }

  // ==================== PUBLIC API (PokiSDK-compatible) ====================
  window.GZAds = {
    init: init,

    /**
     * Commercial Break — Call at EVERY natural break point!
     * Poki model: "Not every call triggers an ad. System decides."
     * Returns Promise — resolves when ad is done (or immediately if no ad shown)
     */
    commercialBreak: commercialBreak,

    /**
     * Rewarded Break — User must opt-in. Returns Promise<boolean>
     * true = user watched ad, false = skipped/unavailable
     */
    rewardedBreak: rewardedBreak,

    /**
     * Display ad in specific container
     */
    displayAd: function(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return Promise.reject(new Error('Container not found'));
      if (!canShowAd('display')) return Promise.resolve();
      return loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markAdShown('display');
      });
    },

    /**
     * Notify gameplay started (optional — helps ad timing)
     */
    gameplayStart: function() { state.gameplayActive = true; },

    /**
     * Notify gameplay stopped (optional)
     */
    gameplayStop: function() { state.gameplayActive = false; },

    /**
     * Check if ad blocking is detected
     */
    isAdBlocked: function() { return state.adBlockDetected; },

    // Debug
    _state: state,
    _config: CONFIG,
  };

  // Backward compatibility stubs
  window.GZMonetagSafe = window.GZMonetagSafe || {};
  if (!window.GZMonetagSafe.maybeLoad) {
    window.GZMonetagSafe.maybeLoad = function() { return commercialBreak(); };
  }
  window.GZNativeAd = window.GZNativeAd || {};
  window.GZAdSenseAuto = window.GZAdSenseAuto || {};
  if (!window.GZAdSenseAuto.loadAd) {
    window.GZAdSenseAuto.loadAd = function(containerId) {
      var container = document.getElementById(containerId);
      if (container) loadAdSenseAd(container);
    };
  }
  window.GZInterstitial = { show: function() { return commercialBreak(); } };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
