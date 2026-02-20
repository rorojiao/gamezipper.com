// Global sound toggle - include in all games
(function(){
  var m=localStorage.getItem('gz_muted')==='1';
  var btn=document.createElement('button');
  btn.id='gz-sound-toggle';
  btn.textContent=m?'🔇':'🔊';
  btn.style.cssText='position:fixed;top:2px;right:8px;z-index:999999;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.3);border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;padding:0;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(5px)';
  btn.onclick=function(e){
    e.preventDefault();e.stopPropagation();
    m=!m;
    localStorage.setItem('gz_muted',m?'1':'0');
    btn.textContent=m?'🔇':'🔊';
    if(typeof GameAudio!=='undefined'){
      if(GameAudio.isMuted()!==m)GameAudio.toggleMute();
    }
    document.querySelectorAll('audio').forEach(function(a){a.muted=m;});
    // Handle game-specific AudioContext
    if(window.audioCtx){try{m?window.audioCtx.suspend():window.audioCtx.resume();}catch(e){}}
    if(window.actx){try{m?window.actx.suspend():window.actx.resume();}catch(e){}}
  };
  // Apply initial mute
  function applyMute(){
    if(!m)return;
    if(typeof GameAudio!=='undefined'&&!GameAudio.isMuted())GameAudio.toggleMute();
    document.querySelectorAll('audio').forEach(function(a){a.muted=true;});
    if(window.audioCtx)try{window.audioCtx.suspend();}catch(e){}
    if(window.actx)try{window.actx.suspend();}catch(e){}
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(btn);applyMute();});}
  else{document.body.appendChild(btn);applyMute();}
  // Re-apply on any user interaction (some games create AudioContext lazily)
  var applied=false;
  document.addEventListener('click',function(){if(!applied&&m){applied=true;setTimeout(applyMute,100);}},{once:true});
})();
