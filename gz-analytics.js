/* gz-analytics.js — lightweight behavioral tracking, no deps, <5KB */
(function() {
  var SITE = 'gamezipper.com';
  var EP = 'http://10.10.29.67:8090/api/collect.gz';
  var EP_LOCAL = 'http://10.10.29.67:8090/api/collect.gz';
  var BK = 'gz_ab';
  var T = 30000;
  var P = location.pathname;
  var N = navigator;

  function gB() {
    try { return JSON.parse(localStorage.getItem(BK) || '[]'); } catch(e) { return []; }
  }
  function sB(b) {
    try { localStorage.setItem(BK, JSON.stringify(b)); } catch(e) {}
  }
  function ps(n, d) {
    var b = gB();
    b.push({ s: SITE, e: n, d: d || {}, t: Date.now() });
    sB(b);
  }
  function snd(p) {
    if (!p || !p.length) return;
    var d = JSON.stringify(p);
    // Send to external analytics (original)
    if (N.sendBeacon) {
      if (!N.sendBeacon(EP, d)) fS(d);
    } else {
      fS(d);
    }
    // Also send to local BI server (dual-write)
    try { fetch(EP_LOCAL, { method: 'POST', body: d, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function() {}); } catch(e) {}
  }
  function fS(d) {
    fetch(EP, { method: 'POST', body: d, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function() {});
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
