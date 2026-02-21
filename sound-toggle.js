// Global sound toggle v2 - 修复：点击🔊时恢复AudioContext + 启动BGM
(function(){
  var m = localStorage.getItem('gz_muted') === '1';

  // 创建声音按钮
  var btn = document.createElement('button');
  btn.id = 'gz-sound-toggle';
  btn.textContent = m ? '🔇' : '🔊';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.style.cssText = [
    'position:fixed',
    'top:2px',
    'right:8px',
    'z-index:9999999',           // 高于导航栏 99999
    'background:rgba(0,0,0,0.6)',
    'border:1px solid rgba(255,255,255,0.35)',
    'border-radius:50%',
    'width:26px',
    'height:26px',
    'font-size:13px',
    'line-height:1',
    'cursor:pointer',
    'color:#fff',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:0',
    '-webkit-tap-highlight-color:transparent',
    'touch-action:manipulation',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
  ].join(';');

  // 获取游戏名（给 playBGM 使用）
  var gameName = window.location.pathname.split('/').filter(Boolean)[0] || '';

  // 恢复 AudioContext（解决 autoplay suspended 问题）
  function resumeAudioCtx() {
    // game-audio.js 内部的 AudioContext（通过调用一个空音效来触发 getCtx + resume）
    if (typeof GameAudio !== 'undefined') {
      try {
        // 用 isMuted() 检查即可触发内部 ctx resume（不发声）
        var wasMuted = GameAudio.isMuted();
        // 如果当前未静音，播放 BGM（如果还没开始）
        if (!wasMuted && !GameAudio.isPlaying() && gameName) {
          GameAudio.playBGM(gameName);
          if (window._gameAudioAutoState) window._gameAudioAutoState.markStarted();
        }
      } catch(e) {}
    }
  }

  // 按钮点击
  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    m = !m;
    localStorage.setItem('gz_muted', m ? '1' : '0');
    btn.textContent = m ? '🔇' : '🔊';

    if (typeof GameAudio !== 'undefined') {
      // 同步 mute 状态
      if (GameAudio.isMuted() !== m) GameAudio.toggleMute();

      // 取消静音时：恢复 AudioContext + 启动 BGM
      if (!m) {
        setTimeout(function() {
          resumeAudioCtx();
        }, 50);
      }
    }

    // 处理 <audio> 元素
    document.querySelectorAll('audio').forEach(function(a){ a.muted = m; });
    // 处理游戏自有 AudioContext
    if (window.audioCtx) { try { m ? window.audioCtx.suspend() : window.audioCtx.resume(); } catch(e){} }
    if (window.actx)     { try { m ? window.actx.suspend()     : window.actx.resume();     } catch(e){} }
  };

  // 首次加载时的静音应用
  function applyMute() {
    if (!m) return;
    if (typeof GameAudio !== 'undefined' && !GameAudio.isMuted()) GameAudio.toggleMute();
    document.querySelectorAll('audio').forEach(function(a){ a.muted = true; });
    if (window.audioCtx) try { window.audioCtx.suspend(); } catch(e){}
    if (window.actx)     try { window.actx.suspend();     } catch(e){}
  }

  // 插入按钮
  function insertBtn() {
    document.body.appendChild(btn);
    applyMute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBtn);
  } else {
    insertBtn();
  }

  // 任意用户点击时也尝试 resume AudioContext（确保 BGM 不被 autoplay policy 卡死）
  document.addEventListener('click', function onFirstClick() {
    document.removeEventListener('click', onFirstClick, true);
    if (!m) setTimeout(resumeAudioCtx, 50);
  }, true);

  document.addEventListener('touchend', function onFirstTouch() {
    document.removeEventListener('touchend', onFirstTouch, true);
    if (!m) setTimeout(resumeAudioCtx, 50);
  }, true);

})();
