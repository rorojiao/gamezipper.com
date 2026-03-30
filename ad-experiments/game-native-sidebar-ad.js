// 侧边栏原生广告测试
(function(){
    'usestrict';
    if (window.GZNativeSidebarAd) return;
    
    var GAME_ZONE = 216786;  // gamezipper.com zone
    var loaded = false;
    
    function onGamePage() {
        return location.pathname !== '/' && /\/$/.test(location.pathname) && !/games\.html$/.test(location.pathname);
    }
    
    function hasNativeAd() {
        // 检查Monetag是否加载了原生广告
        var elements = document.querySelectorAll('[data-magsrv-ad], [data-native-ad], .native-ad');
        return elements.length > 0;
    }
    
    function createSidebarAd() {
        // 如果已存在侧边栏广告，则不重复创建
        if (document.getElementById('gz-sidebar-ad-container')) return;
        
        // 创建容器
        var container = document.createElement('div');
        container.id = 'gz-sidebar-ad-container';
        container.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 200px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 100;
            opacity: 0;
            transform: translateY(-50%) translateX(20px);
            transition: all 0.3s ease;
        `;
        
        // 关闭按钮
        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #999;
        `;
        
        closeBtn.addEventListener('click', function() {
            container.style.opacity = '0';
            container.style.transform = 'translateY(-50%) translateX(20px)';
            setTimeout(function() {
                container.remove();
            }, 300);
        });
        
        // 内容区域
        var content = document.createElement('div');
        content.id = 'gz-sidebar-content';
        content.style.cssText = `
            margin-top: 25px;
            text-align: center;
        `;
        
        // 加载状态
        var loading = document.createElement('div');
        loading.innerHTML = '<div style="color: #999;">加载广告...</div>';
        content.appendChild(loading);
        
        container.appendChild(closeBtn);
        container.appendChild(content);
        document.body.appendChild(container);
        
        // 显示动画
        setTimeout(function() {
            container.style.opacity = '1';
            container.style.transform = 'translateY(-50%) translateX(0)';
        }, 100);
        
        // 尝试插入原生广告
        setTimeout(function() {
            if (hasNativeAd()) {
                insertNativeAd(content);
            } else {
                // 如果没有原生广告，显示占位符
                content.innerHTML = `
                    <div style="border: 1px solid #eee; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">推荐游戏</div>
                        <div style="font-size: 12px; color: #666;">更多精彩游戏等你来玩</div>
                    </div>
                    <div style="font-size: 12px; color: #999;">点击查看更多</div>
                `;
            }
        }, 2000);
    }
    
    function insertNativeAd(content) {
        // 清空加载状态
        content.innerHTML = '';
        
        // 创建原生广告容器
        var nativeAd = document.createElement('div');
        nativeAd.className = 'gz-native-ad';
        nativeAd.style.cssText = `
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
        `;
        
        nativeAd.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">推荐内容</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 15px;">与您喜欢的内容相关</div>
            <div style="background: #f5f5f5; height: 100px; border-radius: 5px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <div style="font-size: 12px; color: #999;">广告内容</div>
            </div>
            <button style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">了解详情</button>
        `;
        
        content.appendChild(nativeAd);
        
        // 添加点击事件
        nativeAd.addEventListener('click', function() {
            console.log('[GZNativeSidebarAd] Native ad clicked');
        });
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
            console.log('[GZNativeSidebarAd] Monetag loaded');
            createSidebarAd();
        };
        s.onerror = function() {
            console.error('[GZNativeSidebarAd] Monetag failed');
            createSidebarAd(); // 即使失败也显示占位符
        };
        document.head.appendChild(s);
    }
    
    function init(zone){
        zone = zone || GAME_ZONE;
        
        if (onGamePage()) {
            window.GZNativeSidebarAd = {
                showNow: function(){
                    loadScript(zone);
                },
                hide: function(){
                    var container = document.getElementById('gz-sidebar-ad-container');
                    if (container) {
                        container.style.opacity = '0';
                        container.style.transform = 'translateY(-50%) translateX(20px)';
                        setTimeout(function() {
                            container.remove();
                        }, 300);
                    }
                }
            };
            
            // 10秒后自动显示侧边栏广告
            setTimeout(function(){
                createSidebarAd();
            }, 10000);
        }
    }
    
    window.GZNativeSidebarAd = {
        init: function(zone){ init(zone); },
        showNow: function(zone){ loadScript(zone || GAME_ZONE); },
        hide: function(){ /* placeholder */ }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ init(); }, { once:true });
    } else {
        init();
    }
})();