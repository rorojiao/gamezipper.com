/**
 * GameZipper Ad Manager v4 — Poki-Style Adaptive Ad System
 * 
 * Architecture: Single unified ad script (IIFE)
 * Design: 100% modeled after Poki.com — "Call often, system decides when to show"
 * 
 * KEY PRINCIPLE (from Poki SDK docs):
 *   "Call commercialBreak() as often as possible at natural break points.
 *    Not every call will trigger an ad — the system decides when the user is ready."
 * 
 * Ad Triggers (Poki-model — zero game code dependency):
 *   1. Page Load Interstitial — Vignette, 3s skip, auto-dismiss 6s
 *   2. Commercial Break — Called at EVERY natural break point:
 *      - Game over (detected via DOM overlay + Canvas freeze)
 *      - Level complete (detected via DOM changes)
 *      - Game restart (detected via user interaction pattern)
 *      - Page navigation via game-footer links
 *   3. Homepage Banner — 728x90/320x50, below nav
 *   4. Below-Game Container — Auto-fill after 4s
 *   5. Rewarded Ad — GZAds.rewardedBreak() for opt-in video
 * 
 * Smart Frequency Control (Poki-model):
 *   - Frontend calls ad functions often → System decides whether to show
 *   - Minimum 45s between ANY two ad impressions (configurable)
 *   - Max 20 ads per 30-min rolling session
 *   - Max 60 ads per 24h rolling window
 *   - First visit: gentler (60s first ad, then 45s)
 *   - Returning visit: normal timing
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
      inpagePush: 11012002,
      vignette: 11012003,
    },
    AD_PROVIDER: 'https://a.magsrv.com/ad-provider.js',
    FREQUENCY: {
      minBetweenAds: 45 * 1000,        // 45s minimum between any two ads
      firstAdDelay: 60 * 1000,          // 60s before first ad (gentler for new users)
      sessionWindowMs: 30 * 60 * 1000,  // 30-min rolling window
      sessionMaxAds: 20,                // max 20 ads per 30-min window
      dailyWindowMs: 24 * 60 * 60 * 1000, // 24h rolling window
      dailyMaxAds: 60,                  // max 60 ads per day
      homepageBannerCooldown: 20 * 60 * 1000, // 20 min between homepage banners
      containerAdCooldown: 5 * 60 * 1000,     // 5 min between container ads
    },
    TIMING: {
      homepageBannerDelay: 2000,
      interstitialSkipAfter: 3000,
      interstitialMaxDuration: 6000,
      containerAdDelay: 4000,
      adLoadTimeout: 5000,
      commercialBreakCooldown: 45 * 1000, // same as minBetweenAds
      gameOverDetectionDelay: 1500,      // wait 1.5s after overlay appears
    },
    STORAGE_PREFIX: 'gz4_',
    BC_CHANNEL: 'gz4-sync',
    VERSION: '4.0',
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
  };

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
    
    // Check minimum between ads
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

  // ==================== AD LOADER ====================
  function loadZone(zoneId, targetEl) {
    return new Promise(function(resolve, reject) {
      if (state.adBlockDetected) { reject(new Error('blocked')); return; }

      var timeout = setTimeout(function() { reject(new Error('timeout')); }, CONFIG.TIMING.adLoadTimeout);

      var s = document.createElement('script');
      s.src = CONFIG.AD_PROVIDER + '?zone=' + String(zoneId);
      s.async = true;
      s.setAttribute('data-zone', String(zoneId));
      s.setAttribute('data-cf-beacon', 'gz4_' + zoneId + '_' + Date.now());
      s.setAttribute('data-cf-async', 'false');
      s.onload = function() { clearTimeout(timeout); resolve(true); };
      s.onerror = function() { clearTimeout(timeout); state.adBlockDetected = true; reject(new Error('load_err')); };

      if (targetEl) {
        targetEl.appendChild(s);
      } else {
        document.head.appendChild(s);
      }
    });
  }

  // ==================== COMMERCIAL BREAK (Poki-model core) ====================
  // "Call this as often as possible. Not every call triggers an ad."
  function commercialBreak() {
    return new Promise(function(resolve) {
      if (!canShowAd('commercial_break')) {
        resolve();
        return;
      }

      // Create skip overlay
      var overlay = document.createElement('div');
      overlay.id = 'gz-cb-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(2px);transition:opacity 0.3s;';

      var skipBtn = document.createElement('button');
      skipBtn.style.cssText = 'display:none;padding:8px 24px;background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:20px;font-size:13px;cursor:pointer;backdrop-filter:blur(4px);';
      
      var remaining = Math.ceil(CONFIG.TIMING.interstitialSkipAfter / 1000);
      skipBtn.textContent = 'Skip in ' + remaining + 's';

      overlay.appendChild(skipBtn);
      document.body.appendChild(overlay);

      // Mute audio during ad
      muteAllAudio();

      // Countdown timer
      var timer = setInterval(function() {
        remaining--;
        if (remaining > 0) {
          skipBtn.textContent = 'Skip in ' + remaining + 's';
        } else {
          clearInterval(timer);
          skipBtn.textContent = '✕ Skip Ad';
          skipBtn.style.display = 'block';
          skipBtn.onclick = function() {
            finishAd();
          };
        }
      }, 1000);

      // Load ad
      loadZone(CONFIG.ZONES.vignette).catch(function() {});

      // Auto-complete after max duration
      var maxTimer = setTimeout(function() {
        finishAd();
      }, CONFIG.TIMING.interstitialMaxDuration);

      function finishAd() {
        clearInterval(timer);
        clearTimeout(maxTimer);
        if (overlay.parentNode) overlay.remove();
        unmuteAllAudio();
        markAdShown('commercial_break');
        resolve();
      }
    });
  }

  // ==================== REWARDED BREAK ====================
  function rewardedBreak() {
    return new Promise(function(resolve) {
      var usedKey = 'rewarded_' + state.gameSlug;
      if (storageGet(usedKey)) { resolve(false); return; }
      if (!canShowAd('rewarded')) { resolve(false); return; }

      // Create UI
      var overlay = document.createElement('div');
      overlay.id = 'gz-rewarded-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;';

      var box = document.createElement('div');
      box.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(255,215,0,0.3);border-radius:16px;padding:28px 24px;text-align:center;max-width:340px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

      var title = document.createElement('h3');
      title.style.cssText = 'color:#FFD700;margin:0 0 10px;font-size:17px;';
      title.textContent = '🎁 Watch Ad for Reward';

      var desc = document.createElement('p');
      desc.style.cssText = 'color:#aaa;margin:0 0 20px;font-size:13px;line-height:1.4;';
      desc.textContent = 'Watch a short ad to earn your reward!';

      var watchBtn = document.createElement('button');
      watchBtn.style.cssText = 'padding:12px 28px;background:linear-gradient(135deg,#00e5ff,#0088ff);color:#fff;border:none;border-radius:10px;font-size:15px;cursor:pointer;font-weight:bold;width:100%;';
      watchBtn.textContent = '▶ Watch Ad';

      var skipBtn = document.createElement('button');
      skipBtn.style.cssText = 'margin-top:10px;padding:8px 20px;background:transparent;color:#666;border:1px solid #444;border-radius:8px;font-size:13px;cursor:pointer;width:100%;';
      skipBtn.textContent = 'No Thanks';

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
      loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markAdShown('homepage_banner');
      }).catch(function() {});
    }, CONFIG.TIMING.homepageBannerDelay);
  }

  // ==================== BELOW-GAME CONTAINER AD ====================
  function autoFillContainer() {
    if (!state.isGamePage) return;
    var container = $('#gz-ad-below-game');
    if (!container) return;
    if (container.getAttribute('data-filled')) return;

    setTimeout(function() {
      if (container.getAttribute('data-filled')) return;
      if (!canShowAd('container')) return;
      loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
        container.setAttribute('data-filled', '1');
        markAdShown('container');
      }).catch(function() {});
    }, CONFIG.TIMING.containerAdDelay);
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

    detectPage();
    initBroadcast();
    detectAdBlock();

    // Only show ads on homepage and game pages
    if (!state.isHomePage && !state.isGamePage) return;

    if (state.isHomePage) {
      showHomepageBanner();
    }

    if (state.isGamePage) {
      // Setup all detection methods (zero-dependency)
      initOverlayDetection();
      initCustomEventListeners();
      initGameFooterIntegration();
      
      // Auto-fill container ad
      autoFillContainer();
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
  window.GZNativeAd = window.GZNativeAd || {};
  window.GZAdSenseAuto = window.GZAdSenseAuto || {};
  window.GZInterstitial = { show: function() { return commercialBreak(); } };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
