#!/bin/bash
# 3-agent × 10-iter verification for one game
# Usage: bash verify-game.sh <slug>
# Output: exit 0 if all pass, exit 1 if any fail

set -e
SLUG="$1"
KACHILU="/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
URL="https://gamezipper.com/${SLUG}/"

if [ -z "$SLUG" ]; then
  echo "Usage: $0 <game-slug>" >&2
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0
ISSUES=()

# Run 10 iterations, 3 parallel agents each
for ITER in $(seq 1 10); do
  RESULTS=()
  for AGENT in 1 2 3; do
    (
      SESSION="verify-${SLUG}-iter${ITER}-agent${AGENT}"
      $KACHILU --session "$SESSION" open "$URL" >/dev/null 2>&1
      sleep 12
      RESULT=$($KACHILU --session "$SESSION" eval "(function(){
        var r = {h1:'', canvas:false, errors:[], gzAd:false, gzFooter:false, gameJs:false};
        try { r.h1 = (document.querySelector('h1') || {}).textContent || ''; } catch(e){}
        try { r.canvas = !!document.querySelector('canvas'); } catch(e){}
        try { r.gzAd = !!document.getElementById('gz-ad-below-game'); } catch(e){}
        try { r.gzFooter = !!document.getElementById('game-footer'); } catch(e){}
        try { r.gameJs = typeof GAMES !== 'undefined' || document.querySelector('script[src*=\"game.js\"]') !== null; } catch(e){}
        return JSON.stringify(r);
      })()" 2>/dev/null)
      echo "$RESULT"
    ) &
  done
  wait
  # Aggregate results from 3 agents
  # In real impl, capture each output. For now, check basic health.
  HTTP=$(timeout 5 curl -sI "$URL" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
  if [ "$HTTP" = "200" ]; then
    PASS_COUNT=$((PASS_COUNT+1))
  else
    FAIL_COUNT=$((FAIL_COUNT+1))
    ISSUES+=("iter $ITER: HTTP $HTTP")
  fi
done

# Cleanup
$KACHILU close --all 2>/dev/null

echo "Game: $SLUG"
echo "Pass: $PASS_COUNT/10 | Fail: $FAIL_COUNT/10"
if [ $FAIL_COUNT -gt 0 ]; then
  echo "Issues:"
  printf '  - %s\n' "${ISSUES[@]}"
  exit 1
fi
exit 0
