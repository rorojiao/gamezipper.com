/**
 * GameZipper Ad Manager v3 — Poki-Style Ad System
 * 
 * Architecture: Single unified ad script (IIFE)
 * Design: 100% modeled after Poki.com "zero disruption, high conversion, strong retention"
 * 
 * Ad Types:
 *   1. Homepage Banner — 728x90 desktop / 320x50 mobile, 30min cap
 *   2. Game Loading Interstitial — Vignette overlay, 5s max, 3s skip, per-game 30min cap
 *   3. Game Over Container — Below-game banner, every 3 game overs, 2s delay
 *   4. Rewarded Ad — User-initiated Vignette with custom UI, 1 per game session
 * 
 * DISABLED (user requirement):
 *   - Popunder ads (no popups)
 *   - Push notifications (no push)
 *   - Floating ads (no overlays during gameplay)
 *   - Auto-play audio ads
 *   - Forced unskippable ads
 * 
 * Zones (Monetag MultiTag):
 *   11012001 (Popunder)   — DISABLED
 *   11012002 (In-Page Push) — Homepage banner + game-over container
 *   11012003 (Vignette)      — Game loading interstitial + rewarded ads
 *   11012004 (Push Notif)   — DISABLED
 * 
 * Game Integration:
 *   Games dispatch CustomEvents: gameover, level-complete, level-fail
 *   This script listens and shows ads at natural break points
 * 
 * API (for games that want programmatic control):
 *   GZAds.init()
 *   GZAds.commercialBreak()   → returns Promise
 *   GZAds.rewardedBreak()     → returns Promise<boolean>
 *   GZAds.displayAd(containerId) → returns Promise
 *   GZAds.gameplayStart()
 *   GZAds.gameplayStop()
 */
;(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  var CONFIG = {
    ZONES: {
      inpagePush: 11012002,  // Homepage banner + game-over container
      vignette: 11012003,     // Game loading interstitial + rewarded
      // popunder: 11012001,  // DISABLED — no popups
      // pushNotif: 11012004   // DISABLED — no push
    },
    AD_PROVIDER: 'https://a.magsrv.com/ad-provider.js',
    FREQUENCY: {
      homepageBanner: 30 * 60 * 1000,   // 30 min
      gameInterstitial: 30 * 60 * 1000,  // 30 min per game
      gameOverAd: 3,                       // every 3 game overs
      rewardedPerSession: 1,               // 1 per game session
      sessionMaxAds: 15,                   // max 15 ads per session
    },
    TIMING: {
      homepageBannerDelay: 2000,      // 2s after page load
      interstitialSkipAfter: 3000,     // 3s skip button
      interstitialMaxDuration: 5000,   // 5s auto-dismiss
      gameOverAdDelay: 2000,           // 2s after game over
      adLoadTimeout: 3000,             // 3s load timeout
      containerAdDelay: 3000,          // 3s after page load for container ads
    },
    STORAGE_PREFIX: 'gzad_',
    BC_CHANNEL: 'gzad-sync',
  };

  // ==================== STATE ====================
  var state = {
    initialized: false,
    isHomePage: false,
    isGamePage: false,
    gameSlug: '',
    gameplayActive: false,
    gameoverCount: 0,
    rewardedUsedThisSession: false,
    sessionAdCount: 0,
    lastAdTimes: {},
    loaded: { inpagePush: false, vignette: false },
    adBlockDetected: false,
    channel: null,
  };

  // ==================== UTILITIES ====================
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function isMobile() { return window.innerWidth < 768; }
  function now() { return Date.now(); }

  function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_PREFIX + key)); } catch(e) { return null; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(val)); } catch(e) {}
  }
  function canShow(type, cooldown) {
    var last = state.lastAdTimes[type] || 0;
    return (now() - last) >= cooldown;
  }
  function markShown(type) {
    state.lastAdTimes[type] = now();
    state.sessionAdCount++;
    // Persist to localStorage for cross-session
    storageSet('last_' + type, now());
    // Sync across tabs
    if (state.channel) {
      try { state.channel.postMessage({ type: 'ad_shown', adType: type, time: now() }); } catch(e) {}
    }
  }

  // ==================== BROADCAST CHANNEL (cross-tab sync) ====================
  function initBroadcast() {
    try {
      state.channel = new BroadcastChannel(CONFIG.BC_CHANNEL);
      state.channel.onmessage = function(e) {
        if (e.data && e.data.type === 'ad_shown') {
          state.lastAdTimes[e.data.adType] = e.data.time;
        }
      };
    } catch(e) {
      // BroadcastChannel not supported — single-tab mode
    }
  }

  // ==================== SESSION LIMITS ====================
  function checkSessionLimit() {
    if (state.sessionAdCount >= CONFIG.FREQUENCY.sessionMaxAds) return false;
    // Also check from localStorage (cross-tab)
    var sessionStart = storageGet('session_start');
    if (!sessionStart || now() - sessionStart > 30 * 60 * 1000) {
      storageSet('session_start', now());
      state.sessionAdCount = 0;
    }
    return true;
  }

  // ==================== PAGE DETECTION ====================
  function detectPage() {
    var path = window.location.pathname;
    // Homepage: / or /index.html
    state.isHomePage = path === '/' || path === '/index.html';
    // Game page: /game-slug/ pattern (not admin, blog, about, etc.)
    var nonGamePaths = ['/about', '/privacy', '/terms', '/cookie-policy', '/contact', '/blog', '/sitemap', '/robots', '/categories', '/unblocked'];
    if (!state.isHomePage) {
      var isNonGame = nonGamePaths.some(function(p) { return path.indexOf(p) === 0; });
      state.isGamePage = !isNonGame && /^\/[a-z0-9\-]+\/?$/.test(path);
    }
    // Extract game slug
    if (state.isGamePage) {
      state.gameSlug = path.replace(/^\/|\/$/g, '').split('/')[0] || '';
    }
  }

  // ==================== AD LOADER ====================
  function loadZone(zoneId, targetEl, attrs) {
    return new Promise(function(resolve, reject) {
      // Skip if ad-blocker detected
      if (state.adBlockDetected) { reject(new Error('Ad-blocked')); return; }

      var timeout = setTimeout(function() {
        reject(new Error('Ad load timeout'));
      }, CONFIG.TIMING.adLoadTimeout);

      var s = document.createElement('script');
      s.src = CONFIG.AD_PROVIDER + '?zone=' + zoneId;
      s.async = true;
      s.setAttribute('data-zone', String(zoneId));
      if (attrs) {
        Object.keys(attrs).forEach(function(k) { s.setAttribute(k, attrs[k]); });
      }
      s.onload = function() { clearTimeout(timeout); resolve(true); };
      s.onerror = function() { clearTimeout(timeout); reject(new Error('Ad load error')); };

      if (targetEl) {
        targetEl.appendChild(s);
      } else {
        document.head.appendChild(s);
      }
    });
  }

  // ==================== SKIP BUTTON OVERLAY ====================
  function createSkipOverlay(duration, onSkip, onComplete) {
    var overlay = document.createElement('div');
    overlay.id = 'gz-ad-skip-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:80px;background:transparent;pointer-events:none;';

    var skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip Ad ▶';
    skipBtn.style.cssText = 'pointer-events:all;display:none;padding:10px 28px;background:rgba(0,0,0,0.8);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:8px;font-size:14px;cursor:pointer;transition:opacity 0.3s;';

    var countdown = document.createElement('span');
    countdown.style.cssText = 'color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:8px;pointer-events:none;';

    overlay.appendChild(countdown);
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);

    var remaining = Math.ceil(duration / 1000);
    var timer = setInterval(function() {
      remaining--;
      if (remaining > 0) {
        countdown.textContent = 'Skip available in ' + remaining + 's';
      } else {
        clearInterval(timer);
        countdown.style.display = 'none';
        skipBtn.style.display = 'block';
      }
    }, 1000);
    countdown.textContent = 'Skip available in ' + remaining + 's';

    skipBtn.onclick = function() {
      clearInterval(timer);
      overlay.remove();
      if (onSkip) onSkip();
    };

    // Auto-complete after max duration
    setTimeout(function() {
      if (overlay.parentNode) {
        overlay.remove();
        if (onComplete) onComplete();
      }
    }, CONFIG.TIMING.interstitialMaxDuration);
  }

  // ==================== AD: HOMEPAGE BANNER ====================
  function showHomepageBanner() {
    if (!state.isHomePage) return;
    if (!canShow('homepage', CONFIG.FREQUENCY.homepageBanner)) return;
    if (!checkSessionLimit()) return;

    // Check for existing container or create one
    var container = $('#gz-home-banner');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gz-home-banner';
      container.style.cssText = 'max-width:728px;margin:12px auto;text-align:center;min-height:90px;overflow:hidden;';
      // Insert after header/nav
      var nav = $('nav') || $('header') || $('.game-grid');
      if (nav && nav.parentNode) {
        nav.parentNode.insertBefore(container, nav.nextSibling);
      } else {
        document.body.insertBefore(container, document.body.firstChild);
      }
    }

    // Mobile responsive
    if (isMobile()) {
      container.style.maxWidth = '320px';
      container.style.minHeight = '50px';
    }

    setTimeout(function() {
      if (!checkSessionLimit()) return;
      // Only fill if not already filled
      if (container.getAttribute('data-filled')) return;
      loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markShown('homepage');
      }).catch(function() {
        // Silent fail
      });
    }, CONFIG.TIMING.homepageBannerDelay);
  }

  // ==================== AD: GAME LOADING INTERSTITIAL ====================
  function showGameInterstitial() {
    if (!state.isGamePage) return;
    var gameKey = 'interstitial_' + state.gameSlug;
    if (!canShow(gameKey, CONFIG.FREQUENCY.gameInterstitial)) return;
    if (!checkSessionLimit()) return;

    // Check if game is already in active gameplay
    if (state.gameplayActive) return;

    createSkipOverlay(
      CONFIG.TIMING.interstitialSkipAfter,
      function() { markShown(gameKey); },  // skipped
      function() { markShown(gameKey); }   // completed
    );

    // Load Vignette
    loadZone(CONFIG.ZONES.vignette).catch(function() {
      // If ad fails, remove skip overlay
      var overlay = $('#gz-ad-skip-overlay');
      if (overlay) overlay.remove();
    });
  }

  // ==================== AD: GAME OVER CONTAINER ====================
  function showGameOverAd() {
    if (!state.isGamePage) return;
    state.gameoverCount++;

    // Every 3 game overs
    if (state.gameoverCount % CONFIG.FREQUENCY.gameOverAd !== 0) return;
    if (!checkSessionLimit()) return;

    var container = $('#gz-ad-below-game');
    if (!container) return;
    if (container.getAttribute('data-filled')) return;

    setTimeout(function() {
      if (!checkSessionLimit()) return;
      loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markShown('gameover');
      }).catch(function() {});
    }, CONFIG.TIMING.gameOverAdDelay);
  }

  // ==================== AD: REWARDED ====================
  var rewardedResolve = null;

  function showRewardedAd() {
    return new Promise(function(resolve) {
      if (state.rewardedUsedThisSession) {
        resolve(false);
        return;
      }
      if (!checkSessionLimit()) {
        resolve(false);
        return;
      }

      rewardedResolve = resolve;
      state.rewardedUsedThisSession = true;

      // Create custom rewarded UI
      var overlay = document.createElement('div');
      overlay.id = 'gz-rewarded-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;';

      var box = document.createElement('div');
      box.style.cssText = 'background:#1a1a2e;border:1px solid #333;border-radius:16px;padding:32px;text-align:center;max-width:360px;width:90%;';

      var title = document.createElement('h3');
      title.style.cssText = 'color:#FFD700;margin:0 0 12px;font-size:18px;';
      title.textContent = '🎁 Watch Ad for Reward';

      var desc = document.createElement('p');
      desc.style.cssText = 'color:#aaa;margin:0 0 20px;font-size:14px;';
      desc.textContent = 'Watch a short ad to receive your reward!';

      var watchBtn = document.createElement('button');
      watchBtn.style.cssText = 'padding:12px 32px;background:linear-gradient(135deg,#00e5ff,#0088ff);color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold;';
      watchBtn.textContent = '▶ Watch Ad';

      var skipBtn = document.createElement('button');
      skipBtn.style.cssText = 'margin-top:12px;padding:8px 24px;background:transparent;color:#666;border:1px solid #444;border-radius:8px;font-size:14px;cursor:pointer;';
      skipBtn.textContent = 'No Thanks';

      box.appendChild(title);
      box.appendChild(desc);
      box.appendChild(watchBtn);
      box.appendChild(skipBtn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      // Pause game
      pauseGame();

      skipBtn.onclick = function() {
        overlay.remove();
        resumeGame();
        resolve(false);
      };

      watchBtn.onclick = function() {
        overlay.remove();
        // Show Vignette as "rewarded" ad
        createSkipOverlay(
          CONFIG.TIMING.interstitialSkipAfter,
          function() {
            // Ad skipped — partial reward
            resumeGame();
            markShown('rewarded');
            resolve(true);
          },
          function() {
            // Ad completed — full reward
            resumeGame();
            markShown('rewarded');
            resolve(true);
          }
        );
        loadZone(CONFIG.ZONES.vignette).catch(function() {
          resumeGame();
          resolve(false);
        });
      };
    });
  }

  // ==================== GAME STATE MANAGEMENT ====================
  // ==================== AUDIO MUTE (Poki-compliant) ====================
  var mutedElements = [];

  function muteAllAudio() {
    // Mute all <audio> and <video> elements, save their original volume
    try {
      document.querySelectorAll('audio, video').forEach(function(el) {
        if (el.muted === false && el.volume > 0) {
          mutedElements.push({ el: el, wasMuted: el.muted, volume: el.volume });
          el.muted = true;
        }
      });
      // Also pause audio context if Web Audio API is used
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        (function() {
          var AC = typeof AudioContext !== 'undefined' ? AudioContext : webkitAudioContext;
          // The gain node approach: hook into AudioContext.prototype.createGain
          // Simple approach: just set a flag that games can check
          window.__gz_ad_muted = true;
        })();
      }
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

  function pauseGame() {
    state.gameplayActive = false;
    muteAllAudio();
    // Pause any Canvas games by dispatching a pause event
    try {
      window.dispatchEvent(new CustomEvent('gz-ad-pause'));
    } catch(e) {}
  }

  function resumeGame() {
    unmuteAllAudio();
    try {
      window.dispatchEvent(new CustomEvent('gz-ad-resume'));
    } catch(e) {}
  }

  // ==================== GAME EVENT LISTENERS ====================
  function setupGameListeners() {
    if (!state.isGamePage) return;

    // Game Over — show container ad every 3rd
    window.addEventListener('gameover', function(e) {
      state.gameplayActive = false;
      showGameOverAd();
    }, { passive: true });

    // Level Complete — show container ad every 3rd
    window.addEventListener('level-complete', function(e) {
      state.gameplayActive = false;
      showGameOverAd();
    }, { passive: true });

    // Level Fail
    window.addEventListener('level-fail', function(e) {
      state.gameplayActive = false;
      showGameOverAd();
    }, { passive: true });

    // Gameplay Start (called by game code)
    window.addEventListener('gz-gameplay-start', function(e) {
      state.gameplayActive = true;
    }, { passive: true });

    // Gameplay Stop
    window.addEventListener('gz-gameplay-stop', function(e) {
      state.gameplayActive = false;
    }, { passive: true });
  }

  // ==================== CONTAINER AD (auto-fill) ====================
  function autoFillContainerAds() {
    if (!state.isGamePage) return;
    var container = $('#gz-ad-below-game');
    if (!container) return;
    if (container.getAttribute('data-filled')) return;

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!checkSessionLimit()) return;
      loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markShown('container');
      }).catch(function() {});
    }, CONFIG.TIMING.containerAdDelay);
  }

  // ==================== INIT ====================
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    detectPage();
    initBroadcast();

    // Ad-block detection: try loading ad-provider, if blocked → graceful degradation
    state.adBlockDetected = false;
    var testScript = document.createElement('script');
    testScript.src = CONFIG.AD_PROVIDER;
    testScript.onerror = function() {
      // Ad-blocker detected — degrade silently, never punish the player
      state.adBlockDetected = true;
      console.log('[GZAds] Ad-blocker detected — running in silent mode');
    };
    document.head.appendChild(testScript);

    // Only show ads on homepage and game pages (not blog, terms, etc.)
    if (!state.isHomePage && !state.isGamePage) return;

    // Homepage: banner ad
    if (state.isHomePage) {
      showHomepageBanner();
    }

    // Game pages: interstitial + container + listeners
    if (state.isGamePage) {
      setupGameListeners();
      // Show interstitial on first load (before game starts)
      showGameInterstitial();
      // Auto-fill container ad
      autoFillContainerAds();
    }
  }

  // ==================== PUBLIC API ====================
  window.GZAds = {
    init: init,

    /**
     * Show commercial break (interstitial ad)
     * Poki equivalent: PokiSDK.commercialBreak()
     * Returns Promise that resolves when ad is done
     */
    commercialBreak: function() {
      return new Promise(function(resolve) {
        if (!checkSessionLimit()) { resolve(); return; }
        showGameInterstitial();
        // Resolve after max interstitial duration
        setTimeout(resolve, CONFIG.TIMING.interstitialMaxDuration + 1000);
      });
    },

    /**
     * Show rewarded ad (user must opt-in)
     * Poki equivalent: PokiSDK.rewardedBreak()
     * Returns Promise<boolean> — true if ad was watched, false if skipped
     */
    rewardedBreak: function() {
      return showRewardedAd();
    },

    /**
     * Display ad in specific container
     * Poki equivalent: PokiSDK.displayAd()
     */
    displayAd: function(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return Promise.reject(new Error('Container not found'));
      if (!checkSessionLimit()) return Promise.resolve();
      return loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markShown('display_' + containerId);
      });
    },

    /**
     * Notify that gameplay has started
     * Poki equivalent: PokiSDK.gameplayStart()
     */
    gameplayStart: function() {
      state.gameplayActive = true;
    },

    /**
     * Notify that gameplay has stopped
     * Poki equivalent: PokiSDK.gameplayStop()
     */
    gameplayStop: function() {
      state.gameplayActive = false;
    },

    /**
     * Check if ad blocking is detected
     * Poki equivalent: PokiSDK.isAdBlocked()
     */
    isAdBlocked: function() {
      return typeof window.monetag === 'undefined';
    },

    // Internal state (for debugging)
    _state: state,
    _config: CONFIG,
  };

  // Backward compatibility stubs
  window.GZMonetagSafe = window.GZMonetagSafe || {};
  window.GZNativeAd = window.GZNativeAd || {};
  window.GZAdSenseAuto = window.GZAdSenseAuto || {};
  window.GZInterstitial = { show: function() {} };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
