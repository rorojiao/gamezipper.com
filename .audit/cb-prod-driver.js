(() => {
  const gid = id => document.getElementById(id);
  const active = id => gid(id).classList.contains('active');
  const c = gid('c');
  const S = window.__P = { panels: 0, hands: 0, gameOver: false, occluded: 'none', panelSeq: [], errs: [], done: false, scores: [0,0] };
  window.addEventListener('error', e => S.errs.push(e.message.slice(0, 60)));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const geom = () => {
    const rect = c.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const cardW = Math.min(60, W / 8), cardH = cardW * 1.45;
    const handY = H - cardH - 15;
    return { rect, W, H, cardW, cardH, handY };
  };
  const slots = n => {
    const g = geom();
    const maxW = g.W - 40;
    const overlap = Math.min(g.cardW * 0.65, (maxW - g.cardW) / Math.max(1, n - 1));
    const startX = (g.W - (g.cardW + (n - 1) * overlap)) / 2;
    return Array.from({ length: n }, (_, i) => g.rect.left + startX + i * overlap + g.cardW / 2);
  };
  const pd = (x, y) => c.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true, pointerId: 1 }));
  const hitCard = async () => {
    const g = geom();
    const top = g.rect.top + g.handY + g.cardH * 0.55;
    const hit = document.elementsFromPoint(g.rect.left + g.W / 2, top)[0];
    if (!hit || hit.id !== 'c') S.occluded = (hit && (hit.id || hit.className || hit.tagName)) || 'null';
  };
  const doDiscard = async () => {
    for (const x of slots(6)) { pd(x, geom().rect.top + geom().handY + geom().cardH * 0.55); await sleep(190); if (/2\/2/.test(gid('bDiscardDone').textContent)) break; }
    if (/2\/2/.test(gid('bDiscardDone').textContent)) { gid('bDiscardDone').click(); await sleep(500); return true; }
    return false;
  };
  window.__run = async (budgetMs) => {
    const t0 = Date.now();
    await hitCard();
    document.querySelector('.diff-btn')?.click();
    gid('bStart').click(); await sleep(600);
    if (active('tutOverlay')) { gid('bTutClose').click(); await sleep(300); }
    while (Date.now() - t0 < budgetMs && !S.gameOver) {
      if (active('gameOverOverlay')) { S.gameOver = true; break; }
      if (active('scoreOverlay')) {
        S.panels++; S.panelSeq.push(gid('scoreTitle').textContent.slice(0, 14));
        gid('bScoreContinue').click(); await sleep(500); continue;
      }
      if (gid('discardBar').style.display === 'flex') { S.hands++; if (!(await doDiscard())) { S.errs.push('discard-stuck'); break; } continue; }
      for (let n = 6; n >= 1; n--) {
        for (const x of slots(n)) { pd(x, geom().rect.top + geom().handY + geom().cardH * 0.55); await sleep(160); }
        if (active('scoreOverlay') || active('gameOverOverlay') || gid('discardBar').style.display === 'flex') break;
      }
      S.scores = [parseInt(gid('sYou').textContent) || 0, parseInt(gid('sAI').textContent) || 0];
    }
    return JSON.stringify(S);
  };
  return 'prod-driver ready';
})()
