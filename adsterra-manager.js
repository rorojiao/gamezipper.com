/**
 * GameZipper — Adsterra Ad Manager
 * ─────────────────────────────────
 * Adsterra integration as secondary/parallel ad network.
 * Currently pending account setup — zone IDs are placeholders.
 *
 * TO COMPLETE SETUP:
 *  1. Register at https://adsterra.com/publishers/
 *  2. Add gamezipper.com as a website
 *  3. Create zones for: Popunder, In-Page Push, Interstitial
 *  4. Replace ZONES values below with real Adsterra zone IDs
 *  5. Replace ADSTERRA_PID with your actual Publisher ID
 */

(function () {
  'use strict';
  if (window.GZAdsterraManager) return;
  window.GZAdsterraManager = true;

  /* ── CONFIGURATION ──────────────────────────────────────── */
  var ADS_ENABLED = (window.GZ_ADS_ENABLED !== undefined) ? window.GZ_ADS_ENABLED : true;
  if (!ADS_ENABLED) {
    console.log('[GZAdsterra] PAUSED — set window.GZ_ADS_ENABLED=true to enable');
    return;
  }

  /* ── Adsterra Publisher ID — REPLACE WITH REAL PID ──────── */
  var ADSTERRA_PID = 'YOUR_PUBLISHER_ID_HERE';

  /* ── Zone IDs — REPLACE WITH REAL ZONE IDs ─────────────── */
  /* Available formats: PopUnder, InPage Push, Interstitial, Social Bar, Banners */
  var ZONES = {
    popunder:    'YOUR_POPUNDER_ZONE_ID',
    inpagePush:  'YOUR_INPAGE_PUSH_ZONE_ID',
    interstitial:'YOUR_INTERSTITIAL_ZONE_ID',
    socialBar:   'YOUR_SOCIAL_BAR_ZONE_ID',
    banner:      'YOUR_BANNER_ZONE_ID'
  };

  /* ── Helpers ────────────────────────────────────────────── */
  function isGamePage() {
    var p = location.pathname;
    return p !== '/' && !/\.[a-z]{2,5}$/.test(p) && !/games\.html$/.test(p) && !/blog\.html$/.test(p);
  }

  function isHubPage() {
    return location.pathname === '/';
  }

  function loadScript(zone, container) {
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(zone));
    s.src = 'https://adsterra.com/ads.php?zone_id=' + zone + '&pid=' + ADSTERRA_PID;
    if (container) {
      container.appendChild(s);
    } else {
      document.head.appendChild(s);
    }
    console.log('[GZAdsterra] Zone ' + zone + ' loaded');
  }

  /* ── BroadcastChannel for cross-tab frequency cap ──────── */
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_adsterra_popunder'); } catch(e) {}

  var POP_KEY = 'gz_adst_pop_ts';
  var POP_INTERVAL = 30 * 60 * 1000; // 30 min

  function canShowPopunder() {
    try {
      var ts = localStorage.getItem(POP_KEY);
      if (ts && Date.now() - parseInt(ts, 10) < POP_INTERVAL) return false;
    } catch (e) {}
    return true;
  }

  function markPopunderShown() {
    try { localStorage.setItem(POP_KEY, String(Date.now())); } catch (e) {}
    if (_bc) try { _bc.postMessage(Date.now()); } catch(e) {}
  }

  /* ── Popunder (click-triggered) ─────────────────────────── */
  var popPending = false;
  var popLoaded = false;

  function loadPopunder() {
    if (popLoaded || !canShowPopunder()) return;
    if (ZONES.popunder.indexOf('YOUR_') === 0) {
      console.log('[GZAdsterra] Popunder: zone ID not configured yet');
      return;
    }
    popLoaded = true;
    popPending = false;
    markPopunderShown();
    loadScript(ZONES.popunder);
  }

  function armPopunder() {
    if (popLoaded || !canShowPopunder()) return;
    popPending = true;
  }

  document.addEventListener('click', function () {
    if (popPending) {
      popPending = false;
      loadPopunder();
    }
  }, { passive: true });

  /* ── In-Page Push ────────────────────────────────────────── */
  var ippLoaded = false;

  function loadInPagePush() {
    if (ippLoaded) return;
    if (ZONES.inpagePush.indexOf('YOUR_') === 0) {
      console.log('[GZAdsterra] InPage Push: zone ID not configured yet');
      return;
    }
    ippLoaded = true;
    loadScript(ZONES.inpagePush);
  }

  /* ── Interstitial ─────────────────────────────────────────── */
  var interstitialLoaded = false;

  function loadInterstitial() {
    if (interstitialLoaded) return;
    if (ZONES.interstitial.indexOf('YOUR_') === 0) {
      console.log('[GZAdsterra] Interstitial: zone ID not configured yet');
      return;
    }
    interstitialLoaded = true;
    loadScript(ZONES.interstitial);
    console.log('[GZAdsterra] Interstitial triggered');
  }

  /* ── Container Ad Fill ──────────────────────────────────── */
  function fillContainerAd(containerId, zone, delay) {
    setTimeout(function () {
      var container = document.getElementById(containerId);
      if (!container || container.getAttribute('data-filled')) return;
      if (zone.indexOf('YOUR_') === 0) return; // skip if not configured
      container.setAttribute('data-filled', '1');
      loadScript(zone, container);
      console.log('[GZAdsterra] Container ad filled: ' + containerId);
    }, delay || 3000);
  }

  /* ── Page Routing ────────────────────────────────────────── */

  if (isHubPage()) {
    armPopunder();
    setTimeout(loadInPagePush, 3000);
    fillContainerAd('gz-ad-mid-grid', ZONES.banner, 2500);

  } else if (isGamePage()) {
    armPopunder();
    window.addEventListener('gameover', function () {
      armPopunder();
    });
    window.addEventListener('level-complete', function () {
      armPopunder();
    });
    setTimeout(function () {
      if (!popLoaded) armPopunder();
    }, 120000);

    setTimeout(loadInPagePush, 5000);

    window.addEventListener('gameover', function () {
      setTimeout(loadInterstitial, 1500);
    });

    fillContainerAd('gz-ad-below-game', ZONES.banner, 3000);

  } else {
    armPopunder();
    setTimeout(loadInPagePush, 3000);
    fillContainerAd('gz-ad-below-game', ZONES.banner, 3000);
  }

  /* ── API ──────────────────────────────────────────────────── */
  window.GZAdsterra = {
    loadPopunder: loadPopunder,
    loadInPagePush: loadInPagePush,
    loadInterstitial: loadInterstitial,
    zones: ZONES,
    pid: ADSTERRA_PID
  };

  console.log('[GZAdsterra] Initialized — Adsterra manager loaded (zone IDs: PENDING CONFIGURATION)');
})();
