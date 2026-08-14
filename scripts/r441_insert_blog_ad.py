#!/usr/bin/env python3
"""
R441 — Add 2nd AdSense slot (7373732357) to top blog pages (R417 pattern).
Background: Slot 1099212472 (R372/R384) gives 0-1 fills/day on blog/*. Slot
7373732357 (R417 home) gives 7 fills/day. Add a 2nd slot in mid-content area.

Targets (PV >= 10 in 7d, 0 AdSense fills):
  - /blog/free-games-no-wifi-no-download.html (43 PV, 32 UV)
  - /blog/free-games-to-play-on-airplane-no-wifi.html (14 PV, 9 UV)
  - /blog/free-antistress-online.html (10 PV, 4 UV)
"""
import sys
from pathlib import Path

ROOT = Path("/home/junze/gamezipper.com/blog")

# (file, line of the H2 after which to insert, anchor for uniqueness)
TARGETS = [
    ("free-games-no-wifi-no-download.html",
     "Why Browser Games Are Perfect for No-WiFi",
     "r441-wifi"),
    ("free-games-to-play-on-airplane-no-wifi.html",
     "How to Play Offline on a Plane",
     "r441-airplane"),
    ("free-antistress-online.html",
     "Why People Use Antistress",
     "r441-antistress"),
]

AD_BLOCK = '''<!-- ADS-OPT 2026-08-14 R441: 2nd AdSense slot for high-PV blog pages. Slot 7373732357 (proven FALLBACK 7/day vs 1099212472's 1-2/day). R417 R383 pattern: position:relative wrapper + position:absolute ins (CLS-safe, 100px min-height). -->
<div id="gz-ad-r441-{anchor}" style="position:relative;min-height:100px;max-height:280px;margin:24px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:100px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span>
<ins class="adsbygoogle" style="position:absolute!important;top:0!important;left:0!important;width:100%!important;max-width:728px!important;height:100%!important;max-height:280px!important;margin:0 auto!important;text-align:center;display:block" data-ad-client="ca-pub-8346383990981353" data-ad-slot="7373732357" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script>
</div>
'''

for filename, anchor_h2, anchor in TARGETS:
    path = ROOT / filename
    text = path.read_text()
    if f"gz-ad-r441-{anchor}" in text:
        print(f"SKIP {filename} — already has gz-ad-r441-{anchor}")
        continue
    # Find the H2 line
    h2_marker = f'<h2>{anchor_h2}'
    h2_idx = text.find(h2_marker)
    if h2_idx < 0:
        print(f"ERROR {filename} — anchor '{anchor_h2}' not found")
        sys.exit(1)
    # Insert AD_BLOCK immediately before this H2
    block = AD_BLOCK.format(anchor=anchor)
    new_text = text[:h2_idx] + block + "\n\n" + text[h2_idx:]
    # Update comment header to mention R441
    if "R441" not in text[:500]:
        pass  # Skip header update for surgical change
    path.write_text(new_text)
    print(f"OK {filename} — added gz-ad-r441-{anchor} ({h2_idx} bytes -> +{len(new_text) - len(text)} bytes)")
