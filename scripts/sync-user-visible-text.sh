#!/bin/bash
# sync-user-visible-text.sh — Hard Rule #15 enforcement
# Run at Phase 1.5 of every UX round (alongside sync-game-counts.sh).
# Validates user-visible text sites are not stale relative to GAMES count.
# Exits 1 if any stale number is found in H1, META, JSON-LD descriptions, footer label,
# search placeholder, noscript, share URLs, or cache-bust ?v= suffix.
#
# Companion to scripts/sync-game-counts.sh. Created 2026-06-06 (Hard Rule #15).

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

DRIFT=0
REPORT=""

# 1. GAMES array count — ONLY status:"live" (R175 fix)
GAMES_COUNT=$(node -e "
const fs = require('fs');
const c = fs.readFileSync('js/games-data.js', 'utf8').replace(/localStorage\\.getItem/g,'(()=>null)');
const ctx = { };
require('vm').createContext(ctx);
require('vm').runInContext(c.replace('const GAMES','var GAMES'), ctx);
const live = ctx.GAMES.filter(g => g && g.status === 'live').length;
console.log(live);
" 2>/dev/null)

# The current GAMES count is the ONLY allowed number in user-visible text.
# Any other number (229, 230, 240, 244, ..., 254) means stale.
STALE_PATTERN='\b(230|240|244|245|246|247|248|250|251|252|253|254|255|256|257|258|259|260|261|262|263|264|265|266|267|268|269|270|271)\b'

echo "=== GameZipper User-Visible Text Sync Check (Hard Rule #15) ==="
echo "GAMES array (truth): $GAMES_COUNT"
echo "---"

# 2. H1 text
H1_COUNT=$(grep -oE '<h1[^>]*>[^<]*' index.html | grep -oE '\b[0-9]+\b' | head -1)
if [ -n "$H1_COUNT" ] && [ "$H1_COUNT" != "$GAMES_COUNT" ]; then
  echo "❌ H1 stale: $H1_COUNT (expected $GAMES_COUNT)"
  DRIFT=1
else
  echo "✅ H1: $H1_COUNT"
fi

# 3. META description (catches both attribute orderings: name=...content= and content=...name=)
META_DESC=$(grep -oE '<meta[^>]*name="description"[^>]*>' index.html | head -1 | grep -oE 'Play [0-9]+ free')
if [ -z "$META_DESC" ]; then
  META_DESC=$(grep -oE '<meta[^>]*content="Play [0-9]+ free[^"]*"[^>]*name="description"[^>]*>' index.html | head -1 | grep -oE 'Play [0-9]+ free')
fi
if [ -z "$META_DESC" ]; then
  META_DESC=$(grep -oE 'content="Play [0-9]+ free[^"]*"' index.html | head -1 | grep -oE 'Play [0-9]+ free')
fi
if [ -n "$META_DESC" ]; then
  META_NUM=$(echo "$META_DESC" | grep -oE '[0-9]+')
  if [ "$META_NUM" != "$GAMES_COUNT" ]; then
    echo "❌ META description: $META_NUM (expected $GAMES_COUNT)"
    DRIFT=1
  else
    echo "✅ META description: $META_NUM"
  fi
fi

# 4. Search placeholder
PH_COUNT=$(grep -oE 'placeholder="🔍 Search [0-9]+ Games' index.html | head -1 | grep -oE '[0-9]+')
if [ -n "$PH_COUNT" ] && [ "$PH_COUNT" != "$GAMES_COUNT" ]; then
  echo "❌ Search placeholder: $PH_COUNT (expected $GAMES_COUNT)"
  DRIFT=1
else
  echo "✅ Search placeholder: $PH_COUNT"
fi

# 5. Footer label "N Free Games"
FOOTER_LABEL=$(grep -oE '<strong[^>]*id="gz-stat-games"[^>]*>[^<]*<span[^>]*>[0-9]+' index.html | head -1 | grep -oE '[0-9]+')
# Also check the text after — "Free Games" follows
# (The data-count attr is already checked by sync-game-counts.sh, this is the label only)
# The text right before "Free Games" should match GAMES_COUNT
FOOTER_TEXT=$(grep -oE 'id="gz-stat-games"><span class="gz-counter" data-count="[0-9]+">[0-9]+</span></strong> Free Games' index.html | head -1)
if [ -n "$FOOTER_TEXT" ]; then
  FT_NUM=$(echo "$FOOTER_TEXT" | grep -oE 'data-count="[0-9]+"' | grep -oE '[0-9]+')
  if [ "$FT_NUM" != "$GAMES_COUNT" ]; then
    echo "❌ Footer label data-count: $FT_NUM (expected $GAMES_COUNT)"
    DRIFT=1
  else
    echo "✅ Footer label: $FT_NUM"
  fi
fi

# 6. Wide-net stale scan: any line with a stale number that's NOT in a CSS/JS noise context
STALE_HITS=$(grep -nE "$STALE_PATTERN" index.html 2>/dev/null | \
  grep -vE 'data-count=|cat-count|"position":|indexId|/\*.*\*/|rgba\(|on 244-card|timeout: [0-9]|grid (user|that)|isInputContinuous|setTimeout\(.*,[0-9]+\)' | \
  grep -vE '@keyframes|font-size|opacity:|animation:' | \
  grep -vE '^[0-9]+:[[:space:]]*//' | \
  head -10)
if [ -n "$STALE_HITS" ]; then
  HIT_COUNT=$(echo "$STALE_HITS" | wc -l)
  echo "❌ Wide-net stale scan: $HIT_COUNT stale number(s) found:"
  echo "$STALE_HITS" | head -5 | sed 's/^/    /'
  DRIFT=1
else
  echo "✅ Wide-net stale scan: 0 stale numbers"
fi

echo "---"
if [ "$DRIFT" -ne 0 ]; then
  echo "=== STALE TEXT DETECTED — repair required ==="
  exit 1
fi
echo "=== ALL USER-VISIBLE TEXT IN SYNC ==="
exit 0
