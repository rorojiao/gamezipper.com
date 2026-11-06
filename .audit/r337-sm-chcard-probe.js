/* R337 slice-master — is the `DIV.ch-card` dead_click a REAL defect or a
 * detector false positive?
 *
 * The BI events say sel = "DIV.ch-card" (NOT "DIV.ch-card locked"), so the
 * clicked card was an UNLOCKED chapter. Its handler navigates to the level
 * screen — but the CARD element itself never mutates its className /
 * aria-expanded / inline style, so gz-analytics' dead_click detector (which
 * re-reads only the clicked node at +1500 ms) reports DEAD_CLICK.
 *
 * This probe reproduces the detector byte-faithfully and ALSO measures
 * whether the page actually responded (screen switch, level grid populated).
 */
(async () => {
  const r = { href: location.href, vw: window.innerWidth, vh: window.innerHeight };
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // ---- byte-faithful copy of gz-analytics' dead_click detector ----
  function makeDetector() {
    return function (t, clickedAt) {
      const snapClass = t.className.toString();
      const snapAria = t.getAttribute('aria-expanded') || '';
      const snapInline = t.getAttribute('style') || '';
      return new Promise(resolve => {
        setTimeout(() => {
          const nowClass = t.className.toString();
          const nowAria = t.getAttribute('aria-expanded') || '';
          const nowInline = t.getAttribute('style') || '';
          const stateChanged = (snapClass !== nowClass) || (snapAria !== nowAria) || (snapInline !== nowInline);
          resolve({ changed: stateChanged, stillInDOM: document.contains(t), nowClass, snapClass });
        }, 1500);
      });
    };
  }
  const detect = makeDetector();

  // ---- enter the game: menu -> chapters ----
  const play = document.getElementById('btn_play');
  r.playFound = !!play;
  if (play) play.click();
  await sleep(700);
  r.chapterCards = document.querySelectorAll('#chGrid .ch-card').length;
  r.cardClasses = [...document.querySelectorAll('#chGrid .ch-card')].map(c => c.className);
  r.chaptersUnlocked = (() => { try { return JSON.parse(localStorage.getItem('sliceMaster_v2') || '{}').chaptersUnlocked; } catch (e) { return 'err'; } })();

  // pick an UNLOCKED card
  const cards = [...document.querySelectorAll('#chGrid .ch-card')];
  const unlocked = cards.find(c => !c.className.includes('locked'));
  r.pickedClass = unlocked ? unlocked.className : null;
  if (!unlocked) return { ERROR: 'no unlocked chapter card', ...r };

  // observe the page state BEFORE the click
  const scrBefore = [...document.querySelectorAll('.scr')].filter(s => s.classList.contains('active')).map(s => s.id);
  const lvBefore = document.querySelectorAll('#lvGrid .lv-btn').length;
  r.scrBefore = scrBefore;
  r.lvBtnsBefore = lvBefore;

  // click + run the detector concurrently
  const clickedAt = Date.now();
  const detP = detect(unlocked, clickedAt);
  unlocked.click();
  await sleep(300);
  r.scrAfter = [...document.querySelectorAll('.scr')].filter(s => s.classList.contains('active')).map(s => s.id);
  r.lvBtnsAfter = document.querySelectorAll('#lvGrid .lv-btn').length;
  r.lvTitle = (document.getElementById('lvChapterTitle') || {}).textContent;
  r.pageResponded = (r.scrAfter.join() !== scrBefore.join()) || r.lvBtnsAfter !== lvBefore;
  r.detector = await detP;
  r.detectorVerdict = r.detector.changed ? 'ALIVE' : 'DEAD_CLICK';

  // ---- negative control: a genuinely dead div ----
  const dead = document.createElement('div');
  dead.className = 'ch-card';
  dead.style.cursor = 'pointer';
  document.body.appendChild(dead);
  const detP2 = detect(dead, Date.now());
  await sleep(50);
  dead.click();
  r.deadControl = await detP2;
  r.deadControlVerdict = r.deadControl.changed ? 'ALIVE' : 'DEAD_CLICK';
  dead.remove();

  return r;
})()
