(function(){
  // BI tracker — hosted on gamezipper.com, proxies to internal BI server
  // Endpoint determined by script origin (same origin)
  var EP = (document.currentScript && document.currentScript.src)
    ? new URL(document.currentScript.src).origin + '/api/collect'
    : 'https://gamezipper.com/api/collect';

  // Visitor ID (persistent)
  var vid = localStorage.getItem('gz_vid');
  if(!vid){vid=crypto.randomUUID?crypto.randomUUID():('v'+Math.random().toString(36).substr(2,9)+Date.now().toString(36));localStorage.setItem('gz_vid',vid);}

  // Session ID (tab-scoped)
  var sid = sessionStorage.getItem('gz_sid');
  if(!sid){sid='s'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);sessionStorage.setItem('gz_sid',sid);}

  // Parse UA
  var ua = navigator.userAgent;
  var dev = /Mobile|Android|iPhone|iPad/.test(ua) ? (/iPad|Tablet/.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  var br = /Edg/.test(ua)?'Edge':/OPR/.test(ua)?'Opera':/Chrome/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':/Firefox/.test(ua)?'Firefox':'Other';
  var os = /Windows/.test(ua)?'Windows':/Mac/.test(ua)?'macOS':/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Linux/.test(ua)?'Linux':'Other';

  // Active time tracking
  var activeTime = 0;
  var lastVisible = Date.now();
  var hasSentFinal = false;

  function send(evt, meta){
    var d = {vid:vid,sid:sid,site:location.hostname,path:location.pathname,
             ref:document.referrer,dev:dev,scr:screen.width+'x'+screen.height,
             br:br,os:os,evt:evt||'page_view',dur:0,meta:meta||{}};
    if(evt==='duration') d.dur=Math.round(activeTime/1000);
    try{navigator.sendBeacon(EP,JSON.stringify(d));}catch(e){
      fetch(EP,{method:'POST',body:JSON.stringify(d),keepalive:true}).catch(function(){});}
  }

  // Auto page view
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){send('page_view');});}
  else{send('page_view');}

  // Track active time using Page Visibility API
  function updateActiveTime(){
    if(document.visibilityState==='visible'){
      lastVisible = Date.now();
    } else {
      activeTime += Date.now() - lastVisible;
    }
  }

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden' && !hasSentFinal){
      updateActiveTime();
      if(activeTime > 0){
        send('duration');
        hasSentFinal = true;
      }
    } else if(document.visibilityState==='visible'){
      lastVisible = Date.now();
    }
  });

  window.addEventListener('beforeunload',function(){
    if(!hasSentFinal){
      updateActiveTime();
      if(activeTime > 0){
        send('duration');
        hasSentFinal = true;
      }
    }
  });

  // Global API
  window.gzTrack = function(evt, meta){send(evt, meta);};
})();
