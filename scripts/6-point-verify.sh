#!/bin/bash
# 6-point verify script for new games (Pitfall 48)
# Usage: bash scripts/6-point-verify.sh <slug>
# Must be 0 output for all 6 checks = game ready to ship

set -e
SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  echo "Usage: $0 <slug>"
  exit 1
fi
DIR="$SLUG"
IDX="$DIR/index.html"
if [ ! -f "$IDX" ]; then
  echo "FAIL: $IDX not found"
  exit 1
fi
FAILS=0
# 1. No 1ktower zombie
if grep -q '1ktower\.com' "$IDX"; then
  if ! grep -q '1ktower.*removed' "$IDX"; then
    echo "❌ 1. 1ktower zombie endpoint present"
    FAILS=$((FAILS+1))
  fi
fi
# 2. No alwingulla
if grep -qE 'alwingulla|cdn\.monetag\.com' "$IDX"; then
  echo "❌ 2. alwingulla/monetag-cdn present"
  FAILS=$((FAILS+1))
fi
# 3. H1 outside splash
H1_OUTSIDE=$(python3 -c "
import re
with open('$IDX') as f: html=f.read()
no_splash = re.sub(r'<div[^>]*id=[\"\\']splash-screen[\"\\'][^>]*>.*?</div>', '', html, flags=re.DOTALL)
h1s = re.findall(r'<h1[^>]*>([^<]+)</h1>', no_splash)
print(len(h1s))
")
if [ "$H1_OUTSIDE" -lt 1 ]; then
  echo "❌ 3. No H1 outside splash"
  FAILS=$((FAILS+1))
fi
# 4. Footer trio
if ! grep -q 'game-footer\.js' "$IDX"; then
  echo "❌ 4a. game-footer.js missing"
  FAILS=$((FAILS+1))
fi
if ! grep -q 'monetag-manager\.js' "$IDX"; then
  echo "❌ 4b. monetag-manager.js missing"
  FAILS=$((FAILS+1))
fi
if ! grep -q 'gz-ad-below-game' "$IDX"; then
  echo "❌ 4c. gz-ad-below-game div missing"
  FAILS=$((FAILS+1))
fi
# 5. <title> tag
if ! grep -q '<title>.*</title>' "$IDX"; then
  echo "❌ 5. <title> tag missing"
  FAILS=$((FAILS+1))
fi
# 6. games-data.js entry
if ! grep -q "url:[\"']/$SLUG/[\"']" js/games-data.js; then
  echo "❌ 6. Not in games-data.js"
  FAILS=$((FAILS+1))
fi
if [ $FAILS -eq 0 ]; then
  echo "✅ All 6 checks PASS for $SLUG"
fi
exit $FAILS
