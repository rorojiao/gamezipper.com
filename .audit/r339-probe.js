(async () => {
  const r = { hrefPre: location.href };
  if (location.href === 'about:blank') return { ERROR: 'popunder on open' };
  r.hrefPre = location.href;
  r.h1 = document.querySelector('h1')?.innerText?.slice(0, 70) || null;
  r.h1Class = document.querySelector('h1')?.className || '(none)';

  // site chrome
  const f = document.getElementById('game-footer');
  r.footerLinks = f ? f.querySelectorAll('a').length : 0;
  r.footerPresent = !!f;
  r.gzAdBelow = !!document.getElementById('gz-ad-below-game');
  r.monetag = !!document.querySelector('script[src*=monetag-manager]');
  r.gzErrorToast = !!document.getElementById('gz-error-toast');
  r.adAbove = !!document.getElementById('gz-ad-above-game');

  // canvas inventory (multi-canvas disambiguation)
  const cs = [...document.querySelectorAll('canvas')].map(c => ({
    id: c.id || '(none)', w: c.width, h: c.height,
    dw: Math.round(c.getBoundingClientRect().width),
    dh: Math.round(c.getBoundingClientRect().height),
  }));
  r.canvases = cs;
  r.viewport = { w: innerWidth, h: innerHeight };
  r.scrollW = document.documentElement.scrollWidth;

  // level catalog visible?
  r.hintsVisible = [...document.querySelectorAll('.hint,[class*=hint]')].length;

  // localStorage keys present (persistence surface)
  r.lsKeys = Object.keys(localStorage).filter(k => /save|progress|inertia|numbrix|hidato|slide/i.test(k));

  // duplicate DOM ids
  const ids = {};
  for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1;
  r.dupIds = Object.entries(ids).filter(([, n]) => n > 1).map(([k, n]) => k + 'x' + n);

  // menu CTA reachable + clickable (elementsFromPoint pre-condition, R305)
  const b = document.getElementById('playBtn') || document.getElementById('startBtn')
          || document.getElementById('start-btn') || document.getElementById('btn-play')
          || document.getElementById('btnPlay') || document.getElementById('btnStart')
          || [...document.querySelectorAll('button')].find(x => x.offsetParent !== null
                 && /[\u2000-\uFFFF\w]*(play|start|begin|continue|level)/i.test(x.innerText.trim()));
  r.entryBtn = b ? { id: b.id, text: b.innerText.trim().slice(0, 26) } : null;
  if (b) {
    const rc = b.getBoundingClientRect();
    const cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
    r.btnRect = { top: Math.round(rc.top), bottom: Math.round(rc.bottom), w: Math.round(rc.width) };
    r.btnInView = rc.top >= 0 && rc.bottom <= innerHeight;
    const stack = document.elementsFromPoint(cx, cy);
    r.hitOk = !!stack[0] && (stack[0] === b || b.contains(stack[0]));
    r.hitTag = stack[0] ? (stack[0].tagName + (stack[0].id ? '#' + stack[0].id : '')) : null;
  }
  return r;
})()
