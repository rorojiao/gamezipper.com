// 游戏页底部固定 Banner 广告测试
(function(){
    'use strict';
    if (window.GZGameBannerAd) return;
    
    var GAME_ZONE = 10687757;  // gamezipper.com zone
    var loaded = false;
    var gameAdShown = false;
    
    function onGamePage() {
        return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
    }
    
    function loadScript(zone) {
        if (loaded) return true;
        loaded = true;
        
        // Monetag script
        var s = document.createElement('script');
        s.src = 'https://a.magsrv.com/ad-provider.js';
        s.async = true;
        s.setAttribute('data-zone', String(zone));
        s.onload = function() {
            console.log('[GZGameBannerAd] Monetag loaded');
            createBanner();
        };
        s.onerror = function() {
            console.error('[GZGameBannerAd] Monetag failed');
            createBanner();
        };
        document.head.appendChild(s);
    }
    
    function createBanner() {
        // 如果已存在则不重复创建
        if (document.getElementById('gz-banner-ad')) return;
        
        var banner = document.createElement('div');
        banner.id = 'gz-banner-ad';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(100%);
            transition: all 0.3s ease;
            padding: 10px;
            box-sizing: border-box;
        `;
        
        banner.innerHTML = `
            <div style="flex: 1; text-align: center;">
                <span style="opacity: 0.8;">支持游戏开发 - 点击查看更多游戏</span>
            </div>
            <button id="gz-banner-close" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 0 10px;
                opacity: 0.8;
           ">×</button>
        `;
        
        document.body.appendChild(banner);
        
        // 延迟显示动画
        setTimeout(function() {
            banner.style.opacity = '1';
            banner.style.transform = 'translateY(0)';
        }, 100);
        
        // 关闭按钮
        document.getElementById('gz-banner-close').addEventListener('click', function() {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(100%)';
            setTimeout(function() {
                banner.remove();
            }, 300);
        });
    }
    
    function init(zone){
        zone = zone || GAME_ZONE;
        
        if (onGamePage()) {
            // 游戏页面：5秒后显示banner（用户已经进入游戏，不会干扰开始）
            setTimeout(function(){
                loadScript(zone);
            }, 5000);
            
            window.GZGameBannerAd = {
                showNow: function(){
                    if (!loaded) loadScript(zone);
                },
                close: function(){
                    var banner = document.getElementById('gz-banner-ad');
                    if (banner) {
                        banner.style.opacity = '0';
                        banner.style.transform = 'translateY(100%)';
                        setTimeout(function(){
                            banner.remove();
                        }, 300);
                    }
                }
            };
        }
    }
    
    window.GZGameBannerAd = {
        init: function(zone){ init(zone); },
        showNow: function(zone){ loadScript(zone || GAME_ZONE); },
        close: function(){ /* placeholder */ }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ init(); }, { once:true });
    } else {
        init();
    }
})();