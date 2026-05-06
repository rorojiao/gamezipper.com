/**
 * GameZipper UX-Safe Interstitial Ad System
 * ─────────────────────────────────────────
 * Shows a non-blocking half-screen ad card at natural game pause points:
 *   - level-complete (player beats a level)
 *   - level-fail (player fails)
 *   - gameover (generic game over)
 *
 * Hard rules:
 *   - NO full-screen popups
 *   - NO mid-game interruption
 *   - NO back-button intercept
 *   - Clear close button always visible
 *   - Auto-dismiss after 2 seconds
 *   - Frequency: every 3rd event only (1 in 3 ratio)
 *   - Session interval: minimum 60 seconds between shows
 *
 * Zone: 10687759 — ⚠️ PLACEHOLDER, create in Monetag dashboard
 */
(function(){
  'use strict';
  if (window.GZInterstitial) return;

  var INTERSTITIAL_ZONE = 10687759; // ⚠️ PLACEHOLDER — create this zone in Monetag dashboard
  var CARD_ID = 'gz-interstitial-card';
  var MIN_INTERVAL_MS = 60000; // 60s between interstitials
  var EVENT_RATIO = 3;          // show 1 ad per 3 events

  var state = {
    eventCount: 0,
    lastShown: 0,
    currentCard: null,
    dismissTimer: null
  };

  function isGamePage() {
    var path = location.pathname;
    return path !== '/' && !/\.[a-z]{2,5}$/.test(path) && !/\/games\.html$/.test(path);
  }

  function canShow() {
    // Only on game pages
    if (!isGamePage()) return false;
    // Minimum interval between shows
    if (Date.now() - state.lastShown < MIN_INTERVAL_MS) return false;
    // Don't show if already visible
    if (document.getElementById(CARD_ID)) return false;
    return true;
  }

  function createCard(eventName) {
    if (!canShow()) return;

    state.eventCount++;
    // Only show every Nth event
    if (state.eventCount % EVENT_RATIO !== 0) {
      console.log('[GZInterstitial] Event #' + state.eventCount + ' — skipped (shows every ' + EVENT_RATIO + ')');
      return;
    }

    state.lastShown = Date.now();

    // Create the ad card container
    var overlay = document.createElement('div');
    overlay.id = CARD_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Sponsored content');

    // Style: half-screen card, centered, with semi-transparent backdrop
    var style = document.createElement('style');
    style.id = 'gz-interstitial-style';
    style.textContent = [
      '#' + CARD_ID + '{position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);animation:gzFadeIn 0.2s ease;pointer-events:auto}',
      '#' + CARD_ID + ' .gz-card{position:relative;max-width:360px;width:90%;background:linear-gradient(135deg,#1a1a3e,#2d1b69);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.4);color:#fff;text-align:center}',
      '#' + CARD_ID + ' .gz-card h3{margin:0 0 8px;font-size:16px;font-weight:700;color:#4ecdc4}',
      '#' + CARD_ID + ' .gz-card p{margin:0 0 16px;font-size:13px;color:#b8b8c8;line-height:1.5}',
      '#' + CARD_ID + ' .gz-ad-slot{background:rgba(255,255,255,0.05);border:1px dashed rgba(78,205,196,0.3);border-radius:10px;min-height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;overflow:hidden}',
      '#' + CARD_ID + ' .gz-ad-slot span{color:#666;font-size:12px}',
      '#' + CARD_ID + ' .gz-close{position:absolute;top:8px;right:12px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;z-index:10;transition:color 0.2s}',
      '#' + CARD_ID + ' .gz-close:hover{color:#fff}',
      '#' + CARD_ID + ' .gz-timer{font-size:11px;color:#666;margin-top:4px}',
      '@keyframes gzFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes gzFadeOut{from{opacity:1}to{opacity:0}}'
    ].join('');
    document.head.appendChild(style);

    var adMsg = eventName === 'level-complete' ? '🎉 Level Complete!'
              : eventName === 'level-fail' ? '💪 Try Again!'
              : '🎮 Great Game!';

    overlay.innerHTML = [
      '<div class="gz-card">',
      '  <button class="gz-close" aria-label="Close">&times;</button>',
      '  <h3>' + adMsg + '</h3>',
      '  <p>Ads help us keep games free. Thanks for playing!</p>',
      '  <div class="gz-ad-slot"><span>Ad loading...</span></div>',
      '  <div class="gz-timer">Closing in 2s</div>',
      '</div>'
    ].join('');

    // Close button handler
    overlay.querySelector('.gz-close').addEventListener('click', function(e) {
      e.stopPropagation();
      dismissCard();
    });

    // Close on backdrop click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) dismissCard();
    });

    document.body.appendChild(overlay);
    state.currentCard = overlay;

    // Load Monetag ad into the slot
    var slot = overlay.querySelector('.gz-ad-slot');
    slot.innerHTML = '';
    var adScript = document.createElement('script');
    adScript.async = true;
    adScript.setAttribute('data-zone', String(INTERSTITIAL_ZONE));
    adScript.src = 'https://a.magsrv.com/ad-provider.js';
    slot.appendChild(adScript);

    console.log('[GZInterstitial] Interstitial shown (event #' + state.eventCount + ', type: ' + eventName + ')');

    // Auto-dismiss after 2 seconds
    state.dismissTimer = setTimeout(function() {
      dismissCard();
    }, 2000);
  }

  function dismissCard() {
    if (state.dismissTimer) {
      clearTimeout(state.dismissTimer);
      state.dismissTimer = null;
    }
    var card = document.getElementById(CARD_ID);
    if (card) {
      card.style.animation = 'gzFadeOut 0.2s ease forwards';
      setTimeout(function() {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 200);
    }
    var style = document.getElementById('gz-interstitial-style');
    if (style) style.parentNode.removeChild(style);
    state.currentCard = null;
  }

  function init() {
    if (!isGamePage()) {
      console.log('[GZInterstitial] Not a game page — disabled');
      return;
    }

    // Listen for game events — these are dispatched by games at natural pause points
    // If a game doesn't dispatch these events, no ad will ever show (safe default)
    var events = ['gameover', 'level-complete', 'level-fail'];
    events.forEach(function(evt) {
      window.addEventListener(evt, function() {
        // Small delay to let the game render its own win/fail screen first
        setTimeout(function() {
          createCard(evt);
        }, 300);
      });
    });

    console.log('[GZInterstitial] Listening for: ' + events.join(', '));
  }

  window.GZInterstitial = {
    init: init,
    show: createCard,
    dismiss: dismissCard,
    getStats: function() {
      return { eventCount: state.eventCount, lastShown: state.lastShown };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
