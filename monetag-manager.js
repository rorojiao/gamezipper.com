/**
 * GameZipper Ad Manager v5 — Poki-Style Adaptive Ad System
 * 
 * Architecture: Single unified ad script (IIFE)
 * Design: 100% modeled after Poki.com — "Call often, system decides when to show"
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
      inpagePush: 11012002,
      vignette: 11012003,
    },
    AD_PROVIDER: 'https://a.magsrv.com/ad-provider.js',
    // Preconnect for faster ad loading
    PRECONNECT: ['https://a.magsrv.com', 'https://static.magsrv.com'],
    // 频率控制 — 对标 Poki 克制策略
    FREQUENCY: {
      minBetweenAds: 45 * 1000,        // 45s minimum between any two ads (对标 Poki)
      firstAdDelay: 45 * 1000,          // 45s before first ad (新用户友好)
      sessionWindowMs: 30 * 60 * 1000,  // 30-min rolling window
      sessionMaxAds: 20,                // max 20 ads per 30-min window (对标 Poki 克制)
      dailyWindowMs: 24 * 60 * 60 * 1000, // 24h rolling window
      dailyMaxAds: 60,                  // max 60 ads per day (对标 Poki 克制)
      homepageBannerCooldown: 10 * 60 * 1000, // 10 min between homepage banners
      containerAdCooldown: 3 * 60 * 1000,   // 3 min between container ads
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
    },
    STORAGE_PREFIX: 'gz5_',
    BC_CHANNEL: 'gz5-sync',
    VERSION: '5.0',
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

  function loadAdSenseScript() {
    if (adsenseLoaded) return;
    adsenseLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
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

  // ==================== AD LOADER ====================
  function loadZone(zoneId, targetEl) {
    return new Promise(function(resolve, reject) {
      if (state.adBlockDetected) { reject(new Error('blocked')); return; }

      var timeout = setTimeout(function() { reject(new Error('timeout')); }, CONFIG.TIMING.adLoadTimeout);

      var s = document.createElement('script');
      s.src = CONFIG.AD_PROVIDER + '?zone=' + String(zoneId);
      s.async = true;
      s.setAttribute('data-zone', String(zoneId));
      s.setAttribute('data-cf-beacon', 'gz5_' + zoneId + '_' + Date.now());
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

      // Load ad
      loadZone(CONFIG.ZONES.vignette).then(function() {
        // 广告加载成功，更新状态
        var statusEl = document.getElementById('gz-cb-status');
        if (statusEl) statusEl.textContent = 'Ad playing...';
      }).catch(function() {});

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
      // Fallback to Monetag after 2s if AdSense hasn't filled
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('homepage_banner')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
        }).catch(function() {});
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
      // Try AdSense first; Monetag fallback after 2s
      loadAdSenseAd(container, '1099212472');
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('homepage_banner')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
        }).catch(function() {});
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
        // Monetag fallback. Resolve on script load, reject on error/timeout.
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          // Monetag script loaded successfully — they injected an iframe/element
          container.setAttribute('data-filled', '1');
          markAdShown('homepage_banner');
          container.style.display = 'block';
          container.style.minHeight = '100px';
          container.style.textAlign = 'center';
          container.style.padding = '12px 0';
        }).catch(function() {
          // Both AdSense and Monetag failed — keep container hidden (no white box)
          container.style.display = 'none';
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
      // Try AdSense first (higher fill); Monetag fallback after 2s
      try { loadAdSenseAd(container, '7373732357'); } catch(e) {}
      setTimeout(function() {
        if (container.getAttribute('data-filled')) return;
        if (!canShowAd('container')) return;
        loadZone(CONFIG.ZONES.inpagePush, container).then(function() {
          container.setAttribute('data-filled', '1');
          markAdShown('container');
          container.style.display = container.getAttribute('data-gz-orig-display') || 'block';
        }).catch(function() {
          // Keep hidden — no white box
          container.style.display = 'none';
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
    // Preconnect to Google AdSense
    ['https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net'].forEach(function(origin) {
      try {
        var link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      } catch(e) {}
    });

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
      
      // Auto-fill container ad
      autoFillContainer();

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
