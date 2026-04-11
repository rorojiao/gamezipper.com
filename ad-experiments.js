(function(){
  'use strict';
  if (window.GZMonetagExperiments) return;

  var GAME_ZONE = 10687757;  // gamezipper.com zone
  var TOOL_ZONE = 10689347;   // tools.gamezipper.com zone
  
  // 广告实验配置
  var EXPERIMENTS = {
    'bottom-banner': {
      name: '底部固定Banner',
      enabled: false,
      priority: 1,
      description: '在游戏页面底部展示非遮挡广告',
      zone: GAME_ZONE
    },
    'interstitial-level': {
      name: '关卡间插屏广告',
      enabled: false,
      priority: 2,
      description: '游戏关卡结束后的2秒插屏广告',
      zone: GAME_ZONE
    },
    'sidebar-ads': {
      name: '侧边栏原生广告',
      enabled: true,
      priority: 3,
      description: '工具站右侧相关工具推荐',
      zone: TOOL_ZONE
    }
  };

  // 工具函数
  function loadScript(zone) {
    var s = document.createElement('script');
    s.src = '//a.magsrv.com/ad-provider.js?zone=' + zone;
    s.async = true;
    s.setAttribute('data-zone', String(zone));
    document.head.appendChild(s);
    console.log('[GZMonetagExperiments] Monetag zone ' + zone + ' loaded');
    return true;
  }

  function createBottomBanner() {
    if (document.getElementById('gz-ad-bottom-banner')) return;
    
    // 检查是否在游戏页面
    if (!isGamePage()) return;
    
    // 创建广告容器
    var banner = document.createElement('div');
    banner.id = 'gz-ad-bottom-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #2a2a4a;
      border-top: 2px solid #4ecdc4;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>📢</span>
        <span>广告支持网站运行 - 点击了解更多</span>
        <span style="margin-left: auto; font-size: 12px;">✕</span>
      </div>
    `;
    
    // 点击事件
    banner.addEventListener('click', function() {
      loadScript(GAME_ZONE);
      banner.remove();
    });
    
    // 关闭按钮
    banner.querySelector('span:last-child').addEventListener('click', function(e) {
      e.stopPropagation();
      banner.remove();
    });
    
    // 检查是否遮挡游戏
    setTimeout(function() {
      if (!isGameAreaObscured()) {
        document.body.appendChild(banner);
        console.log('[GZMonetagExperiments] Bottom banner added');
      }
    }, 3000); // 3秒后检查
  }

  function createInterstitialAd() {
    if (!isGamePage() || !window.GZMonetagSafe) return;
    
    // 监听游戏事件
    document.addEventListener('game-over', function() {
      if (document.getElementById('gz-ad-interstitial')) return;
      
      var overlay = document.createElement('div');
      overlay.id = 'gz-ad-interstitial';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        text-align: center;
      `;
      
      overlay.innerHTML = `
        <div style="max-width: 400px; padding: 40px;">
          <h2 style="margin-bottom: 20px;">🎉 关卡完成！</h2>
          <p style="margin-bottom: 30px;">感谢您的游戏！广告支持我们提供更多免费游戏。</p>
          <button id="continue-btn" style="
            background: #4ecdc4;
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          ">继续下一关</button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // 继续按钮
      document.getElementById('continue-btn').addEventListener('click', function() {
        loadScript(GAME_ZONE);
        overlay.remove();
        // 触发游戏继续事件
        var continueEvent = new CustomEvent('game-continue');
        document.dispatchEvent(continueEvent);
      });
      
      // 2秒后自动加载广告
      setTimeout(function() {
        if (overlay.parentNode) {
          loadScript(GAME_ZONE);
          overlay.remove();
        }
      }, 2000);
      
      console.log('[GZMonetagExperiments] Interstitial ad shown');
    }, { once: true });
  }

  function createSidebarAds() {
    if (!isToolPage()) return;
    
    // 创建侧边栏广告容器
    var sidebar = document.createElement('div');
    sidebar.id = 'gz-ad-sidebar';
    sidebar.style.cssText = `
      position: fixed;
      right: 20px;
      top: 100px;
      width: 300px;
      max-height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 20px;
      z-index: 100;
      overflow-y: auto;
    `;
    
    sidebar.innerHTML = `
      <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <h3 style="color: #333; margin-bottom: 10px;">🔥 热门工具</h3>
        <div id="ad-content" style="color: #666; font-size: 14px; text-align: center;">
          加载中...
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
      ">✕</button>
    `;
    
    // 检查是否遮挡工具
    setTimeout(function() {
      if (!isToolAreaObscured() && !document.getElementById('gz-ad-sidebar')) {
        document.body.appendChild(sidebar);
        console.log('[GZMonetagExperiments] Sidebar ad added');
      }
    }, 5000); // 5秒后检查
    
    // 模拟相关工具加载
    setTimeout(function() {
      var tools = [
        { name: 'JSON格式化', icon: '📄' },
        { name: 'Base64编码', icon: '🔢' },
        { name: '颜色选择器', icon: '🎨' },
        { name: 'CSS生成器', icon: '💻' }
      ];
      
      var content = tools.map(tool => `
        <div style="padding: 10px; margin: 5px 0; border-radius: 8px; background: #f5f5f5; cursor: pointer;" 
             onmouseover="this.style.background='#e8e8e8'" 
             onmouseout="this.style.background='#f5f5f5'">
          <span style="margin-right: 8px;">${tool.icon}</span>${tool.name}
        </div>
      `).join('');
      
      document.getElementById('ad-content').innerHTML = content;
    }, 1000);
  }

  // 页面类型检测
  function isGamePage() {
    return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
  }

  function isToolPage() {
    return location.hostname === 'tools.gamezipper.com' || location.hostname === 'localhost:8081';
  }

  function isGameAreaObscured() {
    var gameElements = document.querySelectorAll('.game-canvas, .game-container, canvas, #game-area');
    return Array.from(gameElements).some(function(el) {
      var rect = el.getBoundingClientRect();
      return rect.bottom > window.innerHeight - 80; // 留出广告空间
    });
  }

  function isToolAreaObscured() {
    var toolElements = document.querySelectorAll('.tool-main, .editor, .output, textarea');
    return Array.from(toolElements).some(function(el) {
      var rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth - 320; // 留出侧边栏空间
    });
  }

  // 实验控制器
  var ExperimentController = {
    init: function() {
      console.log('[GZMonetagExperiments] Initializing experiments...');
      
      // 检查当前实验
      this.checkExperiments();
      
      // 初始化对应实验
      if (EXPERIMENTS['bottom-banner'].enabled && isGamePage()) {
        createBottomBanner();
      }
      
      if (EXPERIMENTS['interstitial-level'].enabled && isGamePage()) {
        createInterstitialAd();
      }
      
      if (EXPERIMENTS['sidebar-ads'].enabled && isToolPage()) {
        createSidebarAds();
      }
    },
    
    checkExperiments: function() {
      console.log('[GZMonetagExperiments] Active experiments:');
      Object.keys(EXPERIMENTS).forEach(function(key) {
        if (EXPERIMENTS[key].enabled) {
          console.log(`  ✓ ${EXPERIMENTS[key].name} (Priority: ${EXPERIMENTS[key].priority})`);
        }
      });
    },
    
    toggleExperiment: function(experimentName) {
      if (EXPERIMENTS[experimentName]) {
        EXPERIMENTS[experimentName].enabled = !EXPERIMENTS[experimentName].enabled;
        console.log(`[GZMonetagExperiments] ${experimentName} ${EXPERIMENTS[experimentName].enabled ? 'enabled' : 'disabled'}`);
      }
    },
    
    getResults: function() {
      var results = {};
      Object.keys(EXPERIMENTS).forEach(function(key) {
        results[key] = {
          name: EXPERIMENTS[key].name,
          enabled: EXPERIMENTS[key].enabled,
          priority: EXPERIMENTS[key].priority
        };
      });
      return results;
    }
  };

  // 暴露到全局
  window.GZMonetagExperiments = ExperimentController;
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ ExperimentController.init(); }, { once: true });
  } else {
    ExperimentController.init();
  }
  
  // 游戏事件钩子
  window.addEventListener('game-complete', function() {
    console.log('[GZMonetagExperiments] Game completed event received');
  });
  
})();