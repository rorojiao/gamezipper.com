#!/bin/bash
# sync-game-counts.sh — Hard Rule #13 enforcement
# Run at Phase 1.5 of every UX round (BEFORE Phase 1 research).
# Validates 4 data sources are in sync, exits 1 on drift.
#
# Sources checked:
#   1. js/games-data.js GAMES array (TRUTH)
#   2. js/itemlist-schema.js JSON-LD numberOfItems + itemListElement.length
#   3. index.html L705 header data-count
#   4. index.html L1791 footer data-count
#   5. index.html L870-881 11 .cat-count spans (sum + per-category match)

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

DRIFT=0
REPORT=""

# 1. GAMES array count — ONLY status:"live" entries (R175 fix)
# Hidden games (status:"hidden") are excluded from display counts
GAMES_COUNT=$(node -e "
const fs = require('fs');
const c = fs.readFileSync('js/games-data.js', 'utf8').replace(/localStorage\\.getItem/g,'(()=>null)');
const ctx = { };
require('vm').createContext(ctx);
require('vm').runInContext(c.replace('const GAMES','var GAMES'), ctx);
const live = ctx.GAMES.filter(g => g && g.status === 'live').length;
console.log(live);
" 2>/dev/null)

# 2. Schema count
SCHEMA_NOI=$(grep -oE 'numberOfItems\":[0-9]+' js/itemlist-schema.js | grep -oE '[0-9]+$')
SCHEMA_ILE=$(node -e "
const fs = require('fs');
const c = fs.readFileSync('js/itemlist-schema.js', 'utf8');
// Count ListItem occurrences (more reliable than split('},{') on compressed JSON)
const matches = c.match(/\"@type\":\"ListItem\"/g);
console.log(matches ? matches.length : 0);
" 2>/dev/null)

# 3. Header data-count
HEADER_DC=$(grep -oE 'id="game-count"[^>]*data-count="[0-9]+"' index.html | head -1 | grep -oE 'data-count="[0-9]+"' | grep -oE '[0-9]+')

# 4. Footer data-count — gz-stat-games wraps a nested span, so match a longer pattern
FOOTER_DC=$(grep -oE 'id="gz-stat-games"><span class="gz-counter" data-count="[0-9]+"' index.html | head -1 | grep -oE 'data-count="[0-9]+"' | grep -oE '[0-9]+')

# 5. Cat counts
declare -A CAT_HYML
ALL_C=$(grep -oE 'cat-count\">[0-9]+' index.html | head -1 | grep -oE '[0-9]+$')
PUZZLE_C=$(grep -E '🧩 Puzzle.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
ARCADE_C=$(grep -E '🕹️ Arcade.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
IDLE_C=$(grep -E '⏰ Idle.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
CARD_C=$(grep -E '🃏 Card.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
BOARD_C=$(grep -E '♟️ Board.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
WORD_C=$(grep -E '📝 Word.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
CASUAL_C=$(grep -E '🎯 Casual.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
SPORTS_C=$(grep -E '⚽ Sports.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
SIM_C=$(grep -E '🔧 Simulation.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
RACING_C=$(grep -E '🏎️ Racing.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)
SKILL_C=$(grep -E '⚡ Skill.*cat-count' index.html | grep -oE 'cat-count\">[0-9]+' | grep -oE '[0-9]+$' | head -1)

# Computed cat counts from GAMES array — ONLY status:"live" (R175 fix)
GAMES_CATS=$(node -e "
const fs = require('fs');
const c = fs.readFileSync('js/games-data.js', 'utf8');
const idx = c.indexOf('const GAMES = [');
const endIdx = c.indexOf('];', idx);
const inner = c.substring(idx + 'const GAMES = ['.length, endIdx);
const cats = {};
// Match each entry: {name:...,cat:\"X\",...,status:\"live\"} or status:\"hidden\"
// Only count entries where status is \"live\" (or has no status field = legacy default live)
const entryRe = /\{[^{}]*name:\"[^\"]*\"[^{}]*cat:\"([^\"]+)\"[^{}]*\}/g;
let m;
while ((m = entryRe.exec(inner)) !== null) {
  const entry = m[0];
  // Check if this entry is hidden
  if (/status:\s*[\"']hidden[\"']/.test(entry)) continue;
  cats[m[1]] = (cats[m[1]] || 0) + 1;
}
console.log(JSON.stringify(cats));
" 2>/dev/null)

GAMES_PUZZLE=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.puzzle||0)}catch(e){console.log(0)}})")
GAMES_ARCADE=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.arcade||0)}catch(e){console.log(0)}})")
GAMES_IDLE=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.idle||0)}catch(e){console.log(0)}})")
GAMES_CARD=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.card||0)}catch(e){console.log(0)}})")
GAMES_BOARD=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.board||0)}catch(e){console.log(0)}})")
GAMES_WORD=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.word||0)}catch(e){console.log(0)}})")
GAMES_CASUAL=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.casual||0)}catch(e){console.log(0)}})")
GAMES_SPORTS=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.sports||0)}catch(e){console.log(0)}})")
GAMES_SIM=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.simulation||0)}catch(e){console.log(0)}})")
GAMES_RACING=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.racing||0)}catch(e){console.log(0)}})")
GAMES_SKILL=$(echo "$GAMES_CATS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log(o.skill||0)}catch(e){console.log(0)}})")

echo "=== GameZipper 4-Source Sync Check (Hard Rule #13) ==="
echo "GAMES array:           $GAMES_COUNT"
echo "Schema numberOfItems:  $SCHEMA_NOI"
echo "Schema itemListElement: $SCHEMA_ILE"
echo "Header data-count:     $HEADER_DC"
echo "Footer data-count:     $FOOTER_DC"
echo "HTML All cat-count:    $ALL_C"
echo "---"
echo "Category (GAMES | HTML | match):"
check_cat() {
  local name="$1"; local g=$2; local h=$3
  if [ "$g" = "$h" ]; then
    echo "  $name: $g | $h | ✅"
  else
    echo "  $name: $g | $h | ❌ DRIFT"
    DRIFT=1
  fi
}
check_cat "Puzzle      " "$GAMES_PUZZLE" "$PUZZLE_C"
check_cat "Arcade      " "$GAMES_ARCADE" "$ARCADE_C"
check_cat "Idle        " "$GAMES_IDLE" "$IDLE_C"
check_cat "Card        " "$GAMES_CARD" "$CARD_C"
check_cat "Board       " "$GAMES_BOARD" "$BOARD_C"
check_cat "Word        " "$GAMES_WORD" "$WORD_C"
check_cat "Casual      " "$GAMES_CASUAL" "$CASUAL_C"
check_cat "Sports      " "$GAMES_SPORTS" "$SPORTS_C"
check_cat "Simulation  " "$GAMES_SIM" "$SIM_C"
check_cat "Racing      " "$GAMES_RACING" "$RACING_C"
check_cat "Skill       " "$GAMES_SKILL" "$SKILL_C"

# Top-level checks
[ "$GAMES_COUNT" = "$SCHEMA_NOI" ] || { echo "❌ GAMES vs Schema numberOfItems DRIFT ($GAMES_COUNT vs $SCHEMA_NOI)"; DRIFT=1; }
[ "$GAMES_COUNT" = "$SCHEMA_ILE" ] || { echo "❌ GAMES vs Schema itemListElement.length DRIFT ($GAMES_COUNT vs $SCHEMA_ILE)"; DRIFT=1; }
[ "$GAMES_COUNT" = "$HEADER_DC" ] || { echo "❌ GAMES vs Header data-count DRIFT ($GAMES_COUNT vs $HEADER_DC)"; DRIFT=1; }
[ "$GAMES_COUNT" = "$FOOTER_DC" ] || { echo "❌ GAMES vs Footer data-count DRIFT ($GAMES_COUNT vs $FOOTER_DC)"; DRIFT=1; }
[ "$GAMES_COUNT" = "$ALL_C" ] || { echo "❌ GAMES vs HTML All cat-count DRIFT ($GAMES_COUNT vs $ALL_C)"; DRIFT=1; }

if [ "$DRIFT" -ne 0 ]; then
  echo "=== DRIFT DETECTED — repair required ==="
  exit 1
fi
echo "=== ALL IN SYNC ==="
exit 0
