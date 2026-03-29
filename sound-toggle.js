// Global sound toggle v2 - Fix: resume AudioContext + start BGM on 🔊 click
(function(){
  var m = localStorage.getItem('gz_muted') === '1';

  // Create sound button
  var btn = document.createElement('button');
  btn.id = 'gz-sound-toggle';
  btn.textContent = m ? '🔇' : '🔊';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.style.cssText = [
    'position:fixed',
    'top:2px',
    'right:8px',
    'z-index:9999999',           // Above navbar 99999
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

  // Get game name (for playBGM)
  var gameName = window.location.pathname.split('/').filter(Boolean)[0] || '';

  // Resume AudioContext (fix autoplay suspended issue)
  function resumeAudioCtx() {
    if (typeof GameAudio === 'undefined') return;
    try {
      // Resume AudioContext (fix autoplay policy suspended state)
      if (GameAudio.resumeContext) GameAudio.resumeContext();
      // Unmute and start BGM if on game page
      var isGamePage = gameName && window.location.pathname.split('/').filter(Boolean).length > 0;
      if (!GameAudio.isMuted() && isGamePage && !GameAudio.isPlaying()) {
        GameAudio.playBGM(gameName);
        if (window._gameAudioAutoState) window._gameAudioAutoState.markStarted();
      }
    } catch(e) {}
  }

  // Button click
  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    m = !m;
    localStorage.setItem('gz_muted', m ? '1' : '0');
    btn.textContent = m ? '🔇' : '🔊';

    if (typeof GameAudio !== 'undefined') {
      // Sync mute state
      if (GameAudio.isMuted() !== m) GameAudio.toggleMute();

      // On unmute: resume AudioContext + start BGM
      if (!m) {
        setTimeout(function() {
          resumeAudioCtx();
        }, 50);
      }
    }

    // Handle <audio> elements
    document.querySelectorAll('audio').forEach(function(a){ a.muted = m; });
    // Handle game AudioContext
    if (window.audioCtx) { try { m ? window.audioCtx.suspend() : window.audioCtx.resume(); } catch(e){} }
    if (window.actx)     { try { m ? window.actx.suspend()     : window.actx.resume();     } catch(e){} }
  };

  // Apply mute on first load
  function applyMute() {
    if (!m) return;
    if (typeof GameAudio !== 'undefined' && !GameAudio.isMuted()) GameAudio.toggleMute();
    document.querySelectorAll('audio').forEach(function(a){ a.muted = true; });
    if (window.audioCtx) try { window.audioCtx.suspend(); } catch(e){}
    if (window.actx)     try { window.actx.suspend();     } catch(e){}
  }

  // Insert button
  function insertBtn() {
    document.body.appendChild(btn);
    applyMute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBtn);
  } else {
    insertBtn();
  }

  // Also try resume AudioContext on any user click (ensure BGM not blocked by autoplay policy)
  document.addEventListener('click', function onFirstClick() {
    document.removeEventListener('click', onFirstClick, true);
    if (!m) setTimeout(resumeAudioCtx, 50);
  }, true);

  document.addEventListener('touchend', function onFirstTouch() {
    document.removeEventListener('touchend', onFirstTouch, true);
    if (!m) setTimeout(resumeAudioCtx, 50);
  }, true);

})();

// Global mute: intercept all AudioContext creation
(function(){
  window.__gz_muted = localStorage.getItem('gz_muted') === '1';
  var OrigAudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!OrigAudioCtx) return;
  var _origResume = OrigAudioCtx.prototype.resume;
  var _contexts = [];
  
  // Track all created contexts
  var _origConstructor = OrigAudioCtx;
  function PatchedAudioContext(){
    var ctx = new _origConstructor();
    _contexts.push(ctx);
    if(window.__gz_muted) try{ctx.suspend();}catch(e){}
    return ctx;
  }
  // Don't override constructor to avoid breaking things, just observe
  
  // Periodic check: suspend all contexts when muted
  setInterval(function(){
    var muted = localStorage.getItem('gz_muted') === '1';
    window.__gz_muted = muted;
    document.querySelectorAll('audio,video').forEach(function(el){el.muted = muted;});
  }, 500);
})();
