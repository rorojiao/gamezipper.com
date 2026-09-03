#!/usr/bin/env python3
"""R642 AdSense onboarding for 2 no-slot game pages (star-loom + tilt-maze).

Adds R347+R383+R389+R384+R451 template:
  - adsbygoogle.js async script tag in <head>
  - 1st AdSense slot (1099212472) wrapped in R383+389+384+347 div
  - 2nd AdSense slot (7373732357) wrapped in R383+389+384+347 div

For tilt-maze: insert 109-ins inside existing empty gz-ad-below-game div
               (R383 reservation already applied) + parallel 737-ins div after close.
For star-loom: insert new <div id="gz-ad-above-game"> above #game-container with 109-ins,
               replace empty <div id="gz-ad-below-game"> with 737-ins wrap.
"""
import os
import re
import sys

SITE_DIR = '/tmp/r642-worktree'
ADSENSE_CLIENT = 'ca-pub-8346383990981353'
SLOT_109 = '1099212472'
SLOT_737 = '7373732357'

R642_MARKER = '<!-- R642 2026-09-03 ADS-OPT: 2 AdSense slots (109+737) added to zero-slot game page. R347+R383+R389+R384+R451+R634 template. Star-loom PV=14/7d, Tilt-maze PV=2/7d. -->'

# Mobile media query overrides for the new slots (60px mobile, 90px desktop)
MOBILE_MEDIA_QUERY = (
    '<style>@media(max-width:600px)'
    '{#gz-ad-above-game,#gz-ad-below-game{min-height:60px!important;max-height:280px!important;margin:8px auto!important;line-height:60px!important}}'
    '</style>'
)

ADSENSE_SCRIPT_TAG = (
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='
    + ADSENSE_CLIENT + '" crossorigin="anonymous"></script>'
)


def wrap_ins(slot_id, label):
    """Generate R347+R383+R389+R384+R451 wrapped ins unit (R636 pattern)."""
    div_open = (
        '<div id="gz-ad-' + label + '" style="position:relative;min-height:90px;max-height:280px;'
        'margin:16px auto;max-width:728px;text-align:center;overflow:hidden;'
        'contain:layout paint style;color:#666;font-size:.7em;background:transparent;'
        'border-radius:6px;box-sizing:border-box;line-height:90px">'
    )
    placeholder_span = (
        '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;'
        'transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;'
        'font-weight:500;pointer-events:none;transition:opacity .15s ease">'
        'Sponsored &middot; Advertisement</span>'
    )
    comment = (
        '<!-- UX-OPT 2026-08-05 R384: ins moved inside R383 div so position:absolute '
        'finds positioned ancestor. R642 onboard -->\n  '
        '<!-- AdSense display ad R642 -->\n  '
    )
    ins_tag = (
        '<ins class="adsbygoogle" style="position:absolute!important;top:0!important;'
        'left:0!important;width:100%!important;max-width:728px!important;height:100%!important;'
        'max-height:280px!important;margin:0 auto!important;text-align:center;display:block" '
        'data-ad-client="' + ADSENSE_CLIENT + '" data-ad-slot="' + slot_id + '" '
        'data-ad-format="auto" data-full-width-responsive="true"></ins>'
    )
    push_script = '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
    div_close = '</div>'
    return div_open + placeholder_span + comment + ins_tag + push_script + div_close


def add_adsense_to_page(slug):
    idx = SITE_DIR + '/' + slug + '/index.html'
    with open(idx, 'r', encoding='utf-8') as f:
        html = f.read()
    orig = html

    # Idempotency guard
    if 'R642' in html or SLOT_109 in html or SLOT_737 in html:
        return slug + ': ALREADY HAS AdSense ins, skip'

    # Step 1: Add adsbygoogle.js script + meta tag in <head>
    if 'googlesyndication.com/pagead/js/adsbygoogle.js' not in html:
        html = html.replace(
            '</head>',
            R642_MARKER + '\n'
            '<meta content="' + ADSENSE_CLIENT + '" name="google-adsense-platform-account">\n'
            + ADSENSE_SCRIPT_TAG + '\n'
            '</head>'
        )

    if slug == 'star-loom':
        # CLS-safe plan: don't add above-game slot (would push game-container down).
        # Replace empty gz-ad-below-game with 109-ins wrap + parallel 737-ins div.
        empty_below = (
            '<div id="gz-ad-below-game" style="min-height:100px;margin:16px auto;'
            'max-width:728px;text-align:center"></div>'
        )
        if empty_below in html:
            ins_109 = wrap_ins(SLOT_109, 'below-game')
            ins_737 = wrap_ins(SLOT_737, 'star-loom-r642')
            html = html.replace(
                empty_below,
                ins_109 + '\n' + ins_737 +
                '<!-- R642: replaced empty placeholder with 109 + parallel 737 R347 wrap. '
                'Both BELOW game-container, no impact on above-game layout. -->'
            )
        else:
            return slug + ': COULD NOT FIND expected empty gz-ad-below-game div, abort'

        # Mobile media query override for new gz-ad-star-loom-r642 slot
        html = html.replace('</body>',
            '<style>@media(max-width:600px)#gz-ad-star-loom-r642{min-height:60px!important;line-height:60px!important}</style>\n</body>'
        )

    elif slug == 'tilt-maze':
        # tilt-maze already has R383 reservation on gz-ad-below-game. Insert ins + add parallel div.
        empty_below = (
            '<div id="gz-ad-below-game" style="position:relative;min-height:100px;max-height:280px;'
            'margin:16px auto;max-width:728px;text-align:center;overflow:hidden;'
            'contain:layout paint style;color:#666;font-size:.7em;background:transparent;'
            'border-radius:6px;box-sizing:border-box;line-height:100px"></div>'
        )
        if empty_below in html:
            ins_below = wrap_ins(SLOT_109, 'below-game')
            ins_737_parallel = wrap_ins(SLOT_737, 'tilt-maze-r642')
            html = html.replace(
                empty_below,
                ins_below + '\n' + ins_737_parallel +
                '<!-- R642: tilt-maze had empty R383-reserved div, '
                'added 109 ins + parallel 737 div -->'
            )
        else:
            return slug + ': COULD NOT FIND expected empty gz-ad-below-game div, abort'

    # Save
    with open(idx, 'w', encoding='utf-8') as f:
        f.write(html)

    # Verify balance
    opens = len(re.findall(r'<div[\s>]', html))
    closes = len(re.findall(r'</div>', html))
    return slug + ': OK opens=' + str(opens) + ' closes=' + str(closes) + \
        ' balanced=' + str(opens == closes)


if __name__ == '__main__':
    for slug in ['star-loom', 'tilt-maze']:
        result = add_adsense_to_page(slug)
        print(result)
