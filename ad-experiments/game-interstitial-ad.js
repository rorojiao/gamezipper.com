// 游戏关卡间插屏广告测试
(function(){
    'use strict';
    if (window.GZInterstitialAd) return;
    
    var GAME_ZONE = 216786;  // gamezipper.com zone
    var adLoaded = false;
    var showingInterstitial = false;
    var levelTransitionInProgress = false;
    
    function onGamePage() {
        return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
    }
    
    function loadScript(zone) {
        if (adLoaded) return true;
        adLoaded = true;
        
        // Monetag script
        var s = document.createElement('script');
        s.src = 'https://a.magsrv.com/ad-provider.js';
        s.async = true;
        s.setAttribute('data-zone', String(zone));
        s.onload = function() {
            console.log('[GZInterstitialAd] Monetag loaded');
        };
        s.onerror = function() {
            console.error('[GZInterstitialAd] Monetag failed');
        };
        document.head.appendChild(s);
    }
    
    function showInterstitialAd() {
        if (showingInterstitial || levelTransitionInProgress) return false;
        if (!adLoaded) {
            loadScript(GAME_ZONE);
            return false;
        }
        
        showingInterstitial = true;
        console.log('[GZInterstitialAd] Showing interstitial ad');
        
        // 创建半透明遮罩
        var overlay = document.createElement('div');
        overlay.id = 'gz-interstitial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        var content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        content.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">关卡完成！</h3>
            <p style="color: #666; margin: 15px 0;">继续下一关前观看广告支持我们</p>
            <button id="gz-skip-ad" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">5秒后跳过</button>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // 渐显动画
        setTimeout(function() {
            overlay.style.opacity = '1';
        }, 10);
        
        var skipTimer = 5;
        var skipButton = document.getElementById('gz-skip-ad');
        
        var updateSkipText = function() {
            skipButton.textContent = skipTimer + '秒后跳过';
        };
        
        var countdown = setInterval(function() {
            skipTimer--;
            updateSkipText();
            if (skipTimer <= 0) {
                clearInterval(countdown);
                closeInterstitial();
            }
        }, 1000);
        
        skipButton.addEventListener('click', closeInterstitial);
        
        function closeInterstitial() {
            clearInterval(countdown);
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.remove();
                showingInterstitial = false;
                // 触发关卡继续事件
                window.dispatchEvent(new CustomEvent('gzInterstitialClosed'));
            }, 300);
        }
        
        return true;
    }
    
    function init(zone){
        zone = zone || GAME_ZONE;
        
        if (onGamePage()) {
            window.GZInterstitialAd = {
                showOnLevelComplete: function() {
                    console.log('[GZInterstitialAd] Request to show ad on level complete');
                    // 延迟200ms显示，给页面时间更新状态
                    setTimeout(function(){
                        showInterstitialAd();
                    }, 200);
                },
                skip: function(){
                    var overlay = document.getElementById('gz-interstitial-overlay');
                    if (overlay) {
                        overlay.style.opacity = '0';
                        setTimeout(function(){
                            overlay.remove();
                            showingInterstitial = false;
                            window.dispatchEvent(new CustomEvent('gzInterstitialClosed'));
                        }, 300);
                    }
                },
                setTransition: function(inProgress){
                    levelTransitionInProgress = inProgress;
                }
            };
            
            // 监听自定义关卡完成事件
            window.addEventListener('gzLevelComplete', function() {
                console.log('[GZInterstitialAd] gzLevelComplete event received');
                showInterstitialAd();
            });
        }
    }
    
    window.GZInterstitialAd = {
        init: function(zone){ init(zone); },
        showNow: function(){ showInterstitialAd(); },
        skip: function(){ /* placeholder */ }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ init(); }, { once:true });
    } else {
        init();
    }
})();