/**
 * GameZipper Ad Interstitial System
 * 在游戏关键时刻（首次访问、游戏结束返回首页前）插入DOM层点击区域
 * 确保Monetag OnClick/Popunder广告能够触发
 * 同时提高Vignette Banner和In-Page Push的展示机会
 */
(function() {
  'use strict';
  
  // 配置
  var AD_COOLDOWN = 180000; // 3分钟冷却（避免过度打扰）
  var LAST_AD_KEY = 'gz_last_ad';
  var VISIT_COUNT_KEY = 'gz_visits';
  
  // 记录访问次数
  var visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0') + 1;
  localStorage.setItem(VISIT_COUNT_KEY, visits);
  
  function canShowAd() {
    var last = parseInt(localStorage.getItem(LAST_AD_KEY) || '0');
    return (Date.now() - last) > AD_COOLDOWN;
  }
  
  function markAdShown() {
    localStorage.setItem(LAST_AD_KEY, Date.now());
  }
  
  // 创建"More Games"推荐overlay — 真实有用的内容，同时给广告触发机会
  function showMoreGamesOverlay(reason) {
    if (!canShowAd()) return;
    
    var games = [
      {name:'2048', emoji:'🔢', url:'/2048/'},
      {name:'Snake', emoji:'🐍', url:'/snake/'},
      {name:'Flappy Wings', emoji:'🐦', url:'/flappy-wings/'},
      {name:'Color Sort', emoji:'🎨', url:'/color-sort/'},
      {name:'Word Puzzle', emoji:'📝', url:'/word-puzzle/'},
      {name:'Whack-a-Mole', emoji:'🔨', url:'/whack-a-mole/'},
      {name:'Memory Match', emoji:'🧠', url:'/memory-match/'},
      {name:'Sushi Stack', emoji:'🍣', url:'/sushi-stack/'},
      {name:'Ocean Gem Pop', emoji:'💎', url:'/ocean-gem-pop/'},
      {name:'Typing Speed', emoji:'⌨️', url:'/typing-speed/'},
      {name:'Brick Breaker', emoji:'🧱', url:'/brick-breaker/'},
      {name:'Dessert Blast', emoji:'🍰', url:'/dessert-blast/'}
    ];
    
    // 随机选4个（不含当前游戏）
    var currentPath = window.location.pathname;
    var filtered = games.filter(function(g) { return g.url !== currentPath; });
    var shuffled = filtered.sort(function() { return 0.5 - Math.random(); }).slice(0, 4);
    
    var overlay = document.createElement('div');
    overlay.id = 'gz-more-games';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,26,0.95);z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:gzFadeIn 0.3s ease';
    
    var title = reason === 'back' ? '🎮 Before you go...' : '🎮 You might also like';
    
    var html = '<div style="text-align:center;max-width:400px;padding:20px">';
    html += '<h2 style="color:#4ecdc4;font-size:24px;margin-bottom:20px;font-family:sans-serif">' + title + '</h2>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">';
    
    for (var i = 0; i < shuffled.length; i++) {
      var g = shuffled[i];
      html += '<a href="' + g.url + '" style="display:block;background:#1a1a3e;border-radius:16px;padding:20px 12px;text-decoration:none;color:#fff;font-family:sans-serif;transition:transform 0.2s;border:2px solid #333" onmouseover="this.style.transform=\'scale(1.05)\';this.style.borderColor=\'#4ecdc4\'" onmouseout="this.style.transform=\'scale(1)\';this.style.borderColor=\'#333\'">';
      html += '<div style="font-size:40px;margin-bottom:8px">' + g.emoji + '</div>';
      html += '<div style="font-size:14px;font-weight:600">' + g.name + '</div>';
      html += '</a>';
    }
    
    html += '</div>';
    html += '<button id="gz-dismiss" style="background:transparent;border:2px solid #555;color:#888;padding:12px 32px;border-radius:25px;font-size:14px;cursor:pointer;font-family:sans-serif;transition:all 0.2s" onmouseover="this.style.borderColor=\'#4ecdc4\';this.style.color=\'#4ecdc4\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#888\'">Continue Playing ▶</button>';
    html += '</div>';
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    if (window.GZMonetagSafe) { window.GZMonetagSafe.maybeLoad(216786); }
    markAdShown();
    
    document.getElementById('gz-dismiss').addEventListener('click', function() {
      overlay.style.animation = 'gzFadeOut 0.2s ease';
      setTimeout(function() { overlay.remove(); }, 200);
    });
  }
  
  // 添加动画CSS
  var style = document.createElement('style');
  style.textContent = '@keyframes gzFadeIn{from{opacity:0}to{opacity:1}}@keyframes gzFadeOut{from{opacity:1}to{opacity:0}}';
  document.head.appendChild(style);
  
  // 触发时机1: 首页返回（用户点浏览器后退）
  if (window.location.pathname !== '/') {
    window.addEventListener('popstate', function() {
      showMoreGamesOverlay('back');
    });
  }
  
  // 触发时机2: 页面可见性变化（用户切回tab时）— 轻量级，不打扰
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && visits > 2 && canShowAd()) {
      // 只在用户回来时偶尔显示
      if (Math.random() < 0.3) {
        showMoreGamesOverlay('return');
      }
    }
  });
  
  // 触发时机3: 监听canvas game over事件（自定义事件）
  window.addEventListener('gz-game-over', function() {
    setTimeout(function() {
      showMoreGamesOverlay('gameover');
    }, 2000); // 游戏结束2秒后显示
  });
  
  // 触发时机4: 首页"Back to Home"链接拦截
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href="/"]');
    if (link && window.location.pathname !== '/') {
      if (canShowAd()) {
        e.preventDefault();
        showMoreGamesOverlay('back');
        // 5秒后自动跳转
        setTimeout(function() {
          window.location.href = '/';
        }, 5000);
      }
    }
  });
  
})();

// 通用Game Over检测
// 很多游戏在game over时会在canvas上绘制按钮文字如"Restart","Play Again","Retry"
// 但canvas内容无法检测。改用时间策略：
// 如果用户在游戏页面停留超过3分钟没有交互，显示推荐
(function() {
  if (window.location.pathname === '/') return; // 首页不需要
  
  var lastInteraction = Date.now();
  var idleCheckDone = false;
  
  ['click', 'touchstart', 'keydown', 'mousemove'].forEach(function(evt) {
    document.addEventListener(evt, function() {
      lastInteraction = Date.now();
    }, {passive: true});
  });
  
  // 每30秒检查一次
  setInterval(function() {
    if (idleCheckDone) return;
    var idle = Date.now() - lastInteraction;
    if (idle > 120000) { // 2分钟无交互
      idleCheckDone = true;
      window.dispatchEvent(new Event('gz-game-over'));
    }
  }, 30000);
})();
