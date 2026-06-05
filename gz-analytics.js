/* gz-analytics.js — lightweight behavioral tracking, no deps, <5KB
   2026-06-05 fix: connected to Vercel /api/collect.js → BI server pipeline
   Events flow: gz-analytics → Vercel /api/collect.js → Python BI server (10.10.29.67:8090)
   localStorage archive kept as fallback (gz_aa). */
(function() {
  var SITE = 'gamezipper.com';
  var EP = '/api/collect.js';  // Vercel Edge function (now explicit in vercel.json)
  var BK = 'gz_ab';   // batch buffer (cleared on flush)
  var AR = 'gz_aa';   // long-term archive (capped at 500 events)
  var T = 30000;
  var P = location.pathname;
  var N = navigator;

  function gB() {
    try { return JSON.parse(localStorage.getItem(BK) || '[]'); } catch(e) { return []; }
  }
  function sB(b) {
    try { localStorage.setItem(BK, JSON.stringify(b)); } catch(e) {}
  }
  function archive(p) {
    // Long-term archive: keep last 500 events across all sessions
    try {
      var a = JSON.parse(localStorage.getItem(AR) || '[]');
      a = a.concat(p);
      if (a.length > 500) a = a.slice(a.length - 500);
      localStorage.setItem(AR, JSON.stringify(a));
    } catch(e) {}
  }
  function ps(n, d) {
    var b = gB();
    b.push({ s: SITE, e: n, d: d || {}, t: Date.now() });
    sB(b);
  }
  function snd(p) {
    // Send to Vercel serverless endpoint; archive locally as backup
    if (!p || !p.length) return;
    archive(p);  // always archive locally as fallback
    var d = JSON.stringify(p);
    // Use fetch with keepalive for reliable delivery on page unload
    fS(d);
  }
  function fS(d) {
    // keepalive: true ensures the request completes even if page unloads
    fetch(EP, {
      method: 'POST',
      body: d,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    }).catch(function() {
      // Silently fail — localStorage archive is the fallback
    });
  }

  setInterval(function() {
    var b = gB();
    if (b.length) { snd(b); sB([]); }
  }, T);

  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      var b = gB();
      if (b.length) { snd(b); sB([]); }
    }
  });
  window.addEventListener('pagehide', function() {
    var b = gB();
    if (b.length) { snd(b); sB([]); }
  });

  var st = { fC: 0, mS: 0, en: 0, gL: false, gS: false, gE: false };
  var milestones = { m25: false, m50: false, m75: false, m100: false };
  var timeMilestones = { t30: false, t60: false };

  document.addEventListener('click', function() {
    if (!st.fC) {
      st.fC = Date.now() - t0;
      ps('u_click', { u: P, ev: 'first_click', ms: st.fC });
    }
  }, { passive: true });

  var tk = false;
  function updS() {
    if (tk) return;
    tk = true;
    requestAnimationFrame(function() {
      var sM = Math.max(document.body.scrollHeight - window.innerHeight, 0);
      var dp = sM > 0 ? Math.round((window.scrollY / sM) * 100) : 0;
      if (dp > st.mS) { st.mS = dp; ps('u_scroll', { u: P, d: dp }); }
      // Scroll depth milestone tracking (25/50/75/100%)
      if (dp >= 25 && !milestones.m25) { milestones.m25 = true; ps('scroll_milestone', { u: P, m: 25 }); }
      if (dp >= 50 && !milestones.m50) { milestones.m50 = true; ps('scroll_milestone', { u: P, m: 50 }); }
      if (dp >= 75 && !milestones.m75) { milestones.m75 = true; ps('scroll_milestone', { u: P, m: 75 }); }
      if (dp >= 95 && !milestones.m100) { milestones.m100 = true; ps('scroll_milestone', { u: P, m: 100 }); }
      tk = false;
    });
  }
  window.addEventListener('scroll', updS, { passive: true });

  var t0 = Date.now();

  // Time-based engagement milestones (30s and 60s)
  setTimeout(function() {
    if (!timeMilestones.t30) { timeMilestones.t30 = true; ps('engaged_time', { u: P, s: 30 }); }
  }, 30000);
  setTimeout(function() {
    if (!timeMilestones.t60) { timeMilestones.t60 = true; ps('engaged_time', { u: P, s: 60 }); }
  }, 60000);
  ps('u_enter', { u: P });

  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      st.en = Date.now() - t0;
      ps('u_stay', { u: P, ms: st.en });
    }
  });

  document.addEventListener('visibilitychange', function() {
    ps('v_chg', { u: P, st: document.visibilityState });
  });

  document.addEventListener('mouseout', function(e) {
    var f = e ? e.relatedTarget || e.toElement : null;
    if (!f) ps('exit_mouse', { u: P });
  });

  var pObs = window.PerformanceObserver || window.MozPerformanceObserver || window.webkitPerformanceObserver;
  if (pObs) {
    (function() {
      var pd = {};
      function obsH(list) {
        for (var i = 0; i < list.getEntries().length; i++) {
          var e = list.getEntries()[i];
          if (e.entryType === 'navigation') {
            pd.tf = e.responseStart - e.requestStart;
            pd.dn = e.domainLookupEnd - e.domainLookupStart;
            pd.tc = e.connectEnd - e.connectStart;
            pd.fb = e.responseEnd - e.requestStart;
            pd.dl = e.domContentLoadedEventEnd - e.startTime;
            pd.lo = e.loadEventEnd - e.startTime;
            ps('perf', { u: P, ttfb: pd.tf, dns: pd.dn, tcp: pd.tc, fb: pd.fb, dl: pd.dl, lo: pd.lo });
          } else if (e.entryType === 'paint' && e.name === 'first-contentful-paint') {
            pd.fc = e.startTime;
            ps('perf', { u: P, fcp: pd.fc });
          } else if (e.entryType === 'largest-contentful-paint') {
            pd.lc = e.startTime;
            ps('perf', { u: P, lcp: pd.lc });
          } else if (e.entryType === 'layout-shift' && !e.hadRecentInput) {
            pd.cls = (pd.cls || 0) + e.value;
          }
        }
      }
      var o = new pObs(obsH);
      o.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] });
      window.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && pd.cls) {
          ps('perf', { u: P, cls: pd.cls });
        }
      });
      function chkFS() {
        if (document.readyState === 'complete') {
          ps('perf', { u: P, fcp: Date.now() - t0 });
        } else {
          window.addEventListener('load', function() {
            ps('perf', { u: P, fcp: Date.now() - t0 });
          }, { once: true });
        }
      }
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', chkFS, { once: true });
      } else {
        chkFS();
      }
    })();
  }

  /* INP Observer: Core Web Vitals 2025 */
  (function(){
    try {
      var _po2 = window.PerformanceObserver || window.webkitPerformanceObserver;
      if (_po2) {
        var _inpWorst = 0;
        var _inpObs = new _po2(function(list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (e.duration > _inpWorst) {
              _inpWorst = Math.round(e.duration);
            }
          }
        });
        _inpObs.observe({ type: 'event', buffered: true, durationThreshold: 100 });
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'hidden' && _inpWorst > 0) {
            ps('inp_worst', { u: P, dur: _inpWorst });
          }
        });
      }
    } catch(e) {}
  })();

  /* Active engagement time: measure real user focus time */
  (function(){
    var _aeStart = Date.now();
    var _aeTotal = 0;
    var _aeVisible = !document.hidden;
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        if (_aeVisible) { _aeTotal += Date.now() - _aeStart; }
        _aeVisible = false;
      } else {
        _aeStart = Date.now();
        _aeVisible = true;
      }
    });
    window.addEventListener('beforeunload', function() {
      if (_aeVisible) { _aeTotal += Date.now() - _aeStart; }
      if (_aeTotal > 0) { ps('active_time', { u: P, ms: _aeTotal }); }
    });
  })();

  /* Web Vitals Rating: classify LCP/CLS/INP as good/needs-improvement/poor
     Thresholds (Google official 2024-2026):
     LCP:  good <=2500ms, poor >4000ms
     CLS:  good <=0.1,   poor >0.25
     INP:  good <=200ms,  poor >500ms                                       */
  (function(){
    function rate(metric, value) {
      if (value == null) return null;
      if (metric === 'lcp') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      if (metric === 'cls') return value <= 0.1  ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      if (metric === 'inp') return value <= 200  ? 'good' : value <= 500  ? 'needs-improvement' : 'poor';
      if (metric === 'fcp') return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      if (metric === 'ttfb')return value <= 800  ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      return null;
    }
    var reported = { lcp: false, cls: false, inp: false };
    var pObs2 = window.PerformanceObserver || window.webkitPerformanceObserver;
    if (!pObs2) return;
    try {
      // LCP
      new pObs2(function(list){
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (last && !reported.lcp) { reported.lcp = true; ps('vitals_rating', { u: P, metric: 'lcp', v: Math.round(last.startTime), r: rate('lcp', last.startTime) }); }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      // CLS — sum all shifts, report on hide
      var clsSum = 0;
      new pObs2(function(list){
        for (var i = 0; i < list.getEntries().length; i++) {
          if (!list.getEntries()[i].hadRecentInput) clsSum += list.getEntries()[i].value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'hidden' && !reported.cls && clsSum) {
          reported.cls = true;
          ps('vitals_rating', { u: P, metric: 'cls', v: Math.round(clsSum * 1000) / 1000, r: rate('cls', clsSum) });
        }
      });
      // INP — use existing _inpWorst logic
      var inpW = 0;
      new pObs2(function(list){
        for (var i = 0; i < list.getEntries().length; i++) {
          if (list.getEntries()[i].duration > inpW) inpW = Math.round(list.getEntries()[i].duration);
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      document.addEventListener('visibilitychange', function(){
        if (document.visibilityState === 'hidden' && !reported.inp && inpW > 0) {
          reported.inp = true;
          ps('vitals_rating', { u: P, metric: 'inp', v: inpW, r: rate('inp', inpW) });
        }
      });
    } catch(e) {}
  })();

  /* Rage Click Detection: user rapidly clicks same spot 3+ times in 1s
     — strong signal of broken UI / dead buttons / no feedback              */
  (function(){
    var _rcLastTarget = null;
    var _rcLastTime = 0;
    var _rcCount = 0;
    var _rcLastX = 0, _rcLastY = 0;
    document.addEventListener('click', function(e){
      var now = Date.now();
      var x = e.clientX || 0, y = e.clientY || 0;
      var sameArea = Math.abs(x - _rcLastX) < 30 && Math.abs(y - _rcLastY) < 30;
      if (e.target === _rcLastTarget && now - _rcLastTime < 1000 && sameArea) {
        _rcCount++;
        if (_rcCount >= 3) {
          ps('rage_click', { u: P, tag: e.target.tagName, cls: (e.target.className||'').toString().slice(0,50), x: x, y: y, n: _rcCount });
          _rcCount = 0; // reset, report once per burst
        }
      } else {
        _rcCount = 1;
      }
      _rcLastTarget = e.target;
      _rcLastTime = now;
      _rcLastX = x; _rcLastY = y;
    }, true);
  })();

  /* Dead Click Detection: user clicks but no navigation/event fires within 1s
     — signals non-interactive element that LOOKS clickable (UX confusion)     */
  (function(){
    document.addEventListener('click', function(e){
      var t = e.target;
      var tag = t.tagName;
      // Only flag suspicious elements: divs/spans/labels that aren't links
      if (tag === 'DIV' || tag === 'SPAN' || tag === 'LABEL' || tag === 'LI' || tag === 'IMG' || tag === 'SVG' || tag === 'P') {
        var lookClickable = t.getAttribute('role') === 'button'
          || t.onclick
          || (t.style && t.style.cursor === 'pointer')
          || (t.className && /click|card|btn|tile|thumb/i.test(t.className.toString()));
        if (lookClickable) {
          var clickedAt = Date.now();
          var sel = (t.tagName || '?') + '.' + (t.className||'').toString().slice(0,40);
          // After 1.5s, check if URL changed (no nav = dead click)
          setTimeout(function(){
            if (location.pathname === P && Date.now() - clickedAt >= 1400) {
              ps('dead_click', { u: P, sel: sel });
            }
          }, 1500);
        }
      }
    }, true);
  })();

  window.gzAnalytics = {
    gameLoaded: function() { if (st.gL) return; st.gL = true; ps('g_loaded', { u: P }); },
    gameStart:  function() { if (st.gS) return; st.gS = true; ps('g_start',  { u: P }); },
    gameEnd:    function(sc) { if (st.gE) return; st.gE = true; ps('g_end', { u: P, sc: sc || null }); }
  };

  if (requestIdleCallback) {
    requestIdleCallback(function() {
      var b = gB();
      if (b.length) { snd(b); sB([]); }
    }, { timeout: 5000 });
  }
})();
