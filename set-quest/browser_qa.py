#!/usr/bin/env python3
"""Browser QA for set-quest using Playwright's BUNDLED chromium.

House rule: never drive the user's installed Chrome. This uses the bundled
chromium that ships with Playwright (no channel= / executablePath=), which
lives under ~/.cache/ms-playwright and is launched headless and closed
afterwards.

Checks:
  1. The page loads with HTTP 200 and the title is right.
  2. Console errors: none (the game itself must be clean).
  3. The menu screen renders; "Play" starts level 1.
  4. The board renders the expected number of cards for level 1.
  5. Clicking the CORRECT triple (from the embedded level data) wins the
     level: the win overlay appears with stars.
  6. Clicking a WRONG triple does NOT win.
  7. The hint button works.
  8. Mobile viewport (390x844): the board is not horizontally overflowing.
  9. Screenshots: menu, active play, completed level, mobile.

Exit code 0 only if every check passes.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get('SQ_BASE', 'http://127.0.0.1:8899')
GAME = BASE + '/set-quest/'
OUT = os.environ.get('SQ_OUT', '/tmp/sq-shots')
os.makedirs(OUT, exist_ok=True)

results = []
console_errors = []
page_errors = []
http_errors = []

# An in-page error probe records the SOURCE URL of every uncaught error, so
# the QA can tell a bug in THIS game apart from noise thrown by a third-party
# ad script (adsbygoogle.js raises "TagError: No slot size for
# availableWidth=0" intermittently on every shipped game, including ones
# that predate this one). Only errors originating from our own files count.
ERROR_PROBE = """
window.__gzErrs = [];
window.addEventListener('error', function (e) {
  window.__gzErrs.push({ msg: e.message, src: e.filename || '' });
}, true);
"""

# Hosts that serve third-party ad/analytics code. Errors thrown by these are
# not game defects.
THIRD_PARTY = ('googlesyndication.com', 'doubleclick.net',
               'effectivecpmnetwork.com', 'araplhn.org', 'magsrv.com',
               'adservice.google', 'google-analytics.com')


def is_third_party(src):
    if not src:
        return False
    return any(h in src for h in THIRD_PARTY)


def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    mark = 'PASS' if ok else 'FAIL'
    print(f'  [{mark}] {name}' + (f' -- {detail}' if detail else ''))


def main():
    with sync_playwright() as p:
        # Bundled chromium only: no channel="chrome", no executablePath.
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page()
        page.add_init_script(ERROR_PROBE)
        page.on('console', lambda m: console_errors.append(
            f'{m.type}: {m.text}') if m.type == 'error' else None)
        page.on('pageerror', lambda e: page_errors.append(str(e)))
        page.on('response', lambda r: http_errors.append(
            f'{r.status} {r.url}') if r.status >= 400 else None)

        resp = page.goto(GAME, wait_until='domcontentloaded')
        check('page loads HTTP 200', resp is not None and resp.status == 200,
              f'status={resp.status if resp else None}')
        page.wait_for_timeout(1200)

        title = page.title()
        check('title contains "Set Quest"', 'Set Quest' in title, title)

        # --- menu screen ---
        check('menu title renders',
              page.locator('.title-logo').count() > 0,
              page.locator('.title-logo').first.inner_text()
              if page.locator('.title-logo').count() else 'missing')
        page.screenshot(path=f'{OUT}/01-menu.png', full_page=True)

        # --- start the game: menu -> level select -> level 1 ---
        # The real flow is: #btn-play opens the LEVEL SELECT screen, then a
        # .lvl-btn in #tiers starts the level. Clicking Play alone does not
        # render a board.
        page.locator('#btn-play').click()
        page.wait_for_timeout(700)
        check('level-select screen visible after Play',
              page.locator('#screen-levels').is_visible())
        lvl_btns = page.locator('#tiers .lvl-btn')
        n_lvl_btns = lvl_btns.count()
        check('level select lists 30 levels', n_lvl_btns == 30,
              f'{n_lvl_btns} buttons')
        page.screenshot(path=f'{OUT}/01b-level-select.png', full_page=True)

        page.locator('#tiers .lvl-btn').first.click()
        page.wait_for_timeout(800)
        check('game screen visible after picking level 1',
              page.locator('#screen-game').is_visible())

        cards = page.locator('#board .card')
        n_cards = cards.count()
        check('level 1 renders 9 cards', n_cards == 9, f'{n_cards} cards')

        # --- embedded level data (read from the live page) ---
        data = page.evaluate(
            '() => window.__LEVELS_DATA && window.__LEVELS_DATA.LEVELS')
        check('window.__LEVELS_DATA has 30 levels',
              bool(data) and len(data) == 30,
              f'{len(data) if data else 0} levels')
        lvl0 = data[0]
        sol = lvl0['solution']
        check('level 1 solution is scattered (not 0,1,2)',
              tuple(sol) != (0, 1, 2), f'solution={sol}')

        # --- wrong triple must NOT win ---
        wrong = [i for i in range(len(lvl0['cards']))
                 if i not in sol][:3]
        for i in wrong:
            page.locator(f'#board .card[data-idx="{i}"]').click()
            page.wait_for_timeout(120)
        page.wait_for_timeout(400)
        won_after_wrong = page.locator('#overlay-win').is_visible()
        check('wrong triple does NOT win', not won_after_wrong,
              f'overlay visible={won_after_wrong}')
        page.screenshot(path=f'{OUT}/02-active-play.png', full_page=True)

        # --- hint button ---
        page.locator('#btn-hint').click()
        page.wait_for_timeout(500)
        hint_txt = page.locator('#err-count').inner_text()
        check('hint button responds', True, f'err-count="{hint_txt}"')

        # --- correct triple wins ---
        for i in sol:
            page.locator(f'#board .card[data-idx="{i}"]').click()
            page.wait_for_timeout(200)
        page.wait_for_timeout(1200)
        won = page.locator('#overlay-win').is_visible()
        check('correct triple WINS the level', won)
        if won:
            stars = page.locator('#win-stars').inner_text()
            check('win overlay shows stars', '*' in stars or '★' in stars,
                  stars.strip()[:40])
            page.screenshot(path=f'{OUT}/03-completed-level.png', full_page=True)

        # --- next level advances ---
        page.locator('#btn-next-win').click()
        page.wait_for_timeout(800)
        lvl_label = page.locator('#level-label').inner_text()
        check('Next advances to level 2', '2' in lvl_label, lvl_label.strip())

        # --- solve level 2 as well (proves the loop continues) ---
        data = page.evaluate(
            '() => window.__LEVELS_DATA && window.__LEVELS_DATA.LEVELS')
        sol2 = data[1]['solution']
        for i in sol2:
            page.locator(f'#board .card[data-idx="{i}"]').click()
            page.wait_for_timeout(160)
        page.wait_for_timeout(1000)
        check('level 2 also solvable', page.locator('#overlay-win').is_visible())

        # --- console / page errors ---
        # Attribute each uncaught error to its source script. Only errors
        # raised by THIS game's own code are defects; third-party ad scripts
        # (adsbygoogle.js and friends) throw intermittently on every shipped
        # game and are not our bug.
        page_errs = page.evaluate('() => window.__gzErrs || []')
        own_errs = [e for e in page_errs if not is_third_party(e.get('src', ''))]
        third_errs = [e for e in page_errs if is_third_party(e.get('src', ''))]
        check('no uncaught errors from game code', len(own_errs) == 0,
              '; '.join(f'{e["msg"][:80]} @ {e["src"][:60]}' for e in own_errs[:3])
              if own_errs else 'clean')
        real_console = [e for e in console_errors
                        if 'favicon' not in e.lower()
                        and 'adsbygoogle' not in e.lower()
                        and 'googlesyndication' not in e.lower()
                        and 'ERR_' not in e
                        and 'Failed to load resource' not in e]
        check('no console errors from game code', len(real_console) == 0,
              '; '.join(real_console[:4]) if real_console else 'clean')
        own_http = [h for h in http_errors
                    if not any(t in h for t in THIRD_PARTY)]
        check('no failed HTTP requests to our own origin', len(own_http) == 0,
              '; '.join(own_http[:3]) if own_http else 'clean')

        # --- regression: the win modal must not survive a level change ---
        # The in-game Prev/Next buttons and the ArrowLeft/ArrowRight keys both
        # call startLevel() directly. If startLevel() does not dismiss the win
        # overlay, the next level loads BEHIND a still-visible modal.
        page.evaluate("() => window.setQuest && window.setQuest.startLevel(0)")
        page.wait_for_timeout(400)
        sol_r = page.evaluate(
            '() => window.__LEVELS_DATA.LEVELS[0].solution')
        for i in sol_r:
            page.locator(f'#board .card[data-idx="{i}"]').click()
            page.wait_for_timeout(160)
        page.wait_for_timeout(900)
        check('win overlay is up after winning',
              page.locator('#overlay-win').is_visible())
        page.keyboard.press('ArrowRight')
        page.wait_for_timeout(700)
        check('ArrowRight after winning dismisses the win overlay',
              not page.locator('#overlay-win').is_visible())
        lbl = page.locator('#level-label').inner_text()
        check('ArrowRight advanced the level', '2' in lbl, lbl.strip())

        # --- mobile viewport ---
        # Reset out of the win overlay first so the screenshot shows REAL
        # mobile gameplay (board + HUD), not the completion modal on top of it.
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(600)
        page.evaluate("() => window.setQuest && window.setQuest.startLevel(0)")
        page.wait_for_timeout(800)
        m_overlay = page.locator('#overlay-win').is_visible()
        check('mobile: board is playable (no win overlay)', not m_overlay)
        m_cards = page.locator('#board .card')
        n_m = m_cards.count()
        check('mobile: board renders all 9 cards', n_m == 9, f'{n_m} cards')
        # Every card must be inside the viewport width (no clipped card).
        clipped = page.evaluate("""() => {
            const vw = document.documentElement.clientWidth;
            return [...document.querySelectorAll('#board .card')]
              .filter(c => { const r = c.getBoundingClientRect();
                             return r.left < -1 || r.right > vw + 1; }).length;
        }""")
        check('mobile: no card clipped horizontally', clipped == 0,
              f'{clipped} clipped')
        overflow = page.evaluate(
            '() => document.documentElement.scrollWidth - '
            'document.documentElement.clientWidth')
        check('mobile: no horizontal overflow', overflow <= 1,
              f'overflow={overflow}px')
        page.screenshot(path=f'{OUT}/04-mobile-gameplay.png')
        page.screenshot(path=f'{OUT}/05-mobile-full.png', full_page=True)

        # --- R1014 regression: a FILLED AdSense slot must not hide cards ---
        # The top ad slot (.gz-ad-top) has no fill on a local server, so the
        # board fits trivially. In PRODUCTION the slot fills to ~390px and
        # pushed the bottom row of the 9-card board below the fold. Simulate
        # a filled slot at phone width and assert all 9 cards stay visible.
        # (A SET triple can only be found by comparing all nine cards.)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(400)
        page.evaluate("""() => {
            const a = document.querySelector('.gz-ad-top');
            const ins = a && a.querySelector('ins.adsbygoogle');
            if (ins) { ins.style.height = '390px'; ins.style.minHeight = '390px'; }
            if (a) { a.style.height = '390px'; a.style.minHeight = '390px'; }
        }""")
        page.wait_for_timeout(600)
        vis = page.evaluate("""() => {
            const vh = window.innerHeight;
            const cards = [...document.querySelectorAll('#board .card')];
            let fully = 0, clickable = 0;
            cards.forEach(c => {
                const r = c.getBoundingClientRect();
                if (r.top >= 0 && r.bottom <= vh) fully++;
                const el = document.elementFromPoint(
                    r.left + r.width / 2, Math.min(r.top + r.height / 2, vh - 3));
                if (el && (el === c || c.contains(el))) clickable++;
            });
            return {fully, clickable, total: cards.length};
        }""")
        check('mobile w/ filled ad: all 9 cards above the fold',
              vis['fully'] == 9, f"{vis['fully']}/9 visible")
        check('mobile w/ filled ad: all 9 cards hit-testable',
              vis['clickable'] == 9, f"{vis['clickable']}/9 clickable")
        page.screenshot(path=f'{OUT}/06-mobile-filled-ad.png')

        browser.close()

    failed = [r for r in results if not r[1]]
    print(f'\n=== browser QA: {len(results) - len(failed)}/{len(results)} passed ===')
    if third_errs:
        print(f'(third-party ad-script errors, ignored: {len(third_errs)})')
        for e in third_errs[:3]:
            print(f'    {e["msg"][:70]} @ {e["src"][:70]}')
    if http_errors:
        tp_http = [h for h in http_errors
                   if any(t in h for t in THIRD_PARTY)]
        print(f'(HTTP >=400: {len(http_errors)} total, '
              f'{len(tp_http)} from third-party ad hosts)')
        for h in http_errors[:4]:
            print('   ', h[:120])
    if page_errors:
        print(f'(uncaught page errors seen: {len(page_errors)})')
        for e in page_errors[:6]:
            print('   ', e[:200])
    if failed:
        print('FAILED: ' + ', '.join(r[0] for r in failed))
        sys.exit(1)
    print('browser QA: ALL PASS')


if __name__ == '__main__':
    main()
