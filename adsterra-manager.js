/**
 * GameZipper Tools — Adsterra Ad Manager
 * ─────────────────────────────────────
 * Adsterra integration for tools.gamezipper.com
 * ACTIVE — Zone IDs configured via Adsterra Publisher API (2026-07-07).
 */

(function () {
  'use strict';
  if (window.GZToolsAdsterraManager) return;
  window.GZToolsAdsterraManager = true;

  /* ── CONFIGURATION ─────────────────────────────────────── */
  var ADS_ENABLED = (window.GZ_ADS_ENABLED !== undefined) ? window.GZ_ADS_ENABLED : true;
  if (!ADS_ENABLED) {
    console.log('[GZToolsAdsterra] PAUSED — set window.GZ_ADS_ENABLED=true to enable');
    return;
  }

  // Zone IDs from Adsterra Publisher API (2026-07-07)
  var ADSTERRA_PID = 'gz_5896870';

  var ZONES = {
    popunder:    '30130929',
    inpagePush:  '30130931',
    interstitial: '30130930',
    socialBar:   '30130931',
    banner:      '30130932',
    banner468:   '30130927',
    banner320:   '30130933',
    nativeBanner:'30130930'
  };

  function isHubPage() {
    return location.pathname === '/' || /\/$/.test(location.pathname);
  }

  function loadScript(zone, container) {
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-zone', String(zone));
    s.src = 'https://www.profitabledisplaynetwork.com/' + zone;
    if (container) {
      container.appendChild(s);
    } else {
      document.head.appendChild(s);
    }
    console.log('[GZToolsAdsterra] Zone ' + zone + ' loaded');
  }

  /* ── Popunder ───────────────────────────────────────────── */
  var _bc = null;
  try { _bc = new BroadcastChannel('gz_tools_adst_popunder'); } catch(e) {}

  var POP_KEY = 'gz_tools_adst_pop_ts';
  var POP_INTERVAL = 25 * 60 * 1000; // v5.13: 25min (was 20min, align with tools, Poki-like restraint)

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

  var popPending = false;
  var popLoaded = false;

  function loadPopunder() {
    if (popLoaded || !canShowPopunder()) return;
    if (ZONES.popunder.indexOf('YOUR_') === 0) return;
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

  /* ── In-Page Push ──────────────────────────────────────── */
  var ippLoaded = false;

  function loadInPagePush() {
    if (ippLoaded) return;
    if (ZONES.inpagePush.indexOf('YOUR_') === 0) return;
    ippLoaded = true;
    loadScript(ZONES.inpagePush);
  }

  /* ── Container Ad Fill ────────────────────────────────── */
  function fillContainerAd(containerId, zone, delay) {
    setTimeout(function () {
      var container = document.getElementById(containerId);
      if (!container || container.getAttribute('data-filled')) return;
      if (zone.indexOf('YOUR_') === 0) return;
      container.setAttribute('data-filled', '1');
      loadScript(zone, container);
      console.log('[GZToolsAdsterra] Container ad filled: ' + containerId);
    }, delay || 3000);
  }

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    if (isHubPage()) {
      armPopunder();
      setTimeout(loadInPagePush, 3000);
    } else {
      armPopunder();
      setTimeout(loadInPagePush, 5000);
    }
    fillContainerAd('gz-tools-ad-below', ZONES.banner, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GZToolsAdsterra = {
    loadPopunder: loadPopunder,
    loadInPagePush: loadInPagePush,
    zones: ZONES,
    pid: ADSTERRA_PID
  };

  console.log('[GZToolsAdsterra] Initialized — Adsterra manager ACTIVE (popunder=' + ZONES.popunder + ', social=' + ZONES.socialBar + ', banner=' + ZONES.banner + ')');
})();
