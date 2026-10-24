#!/usr/bin/env bash
# R333: regression gate over every live per-game verifier.
# Reports exit codes; exit 124 = non-terminating (Pitfall #75 P1 test-gate defect).
# Each verifier is run from ITS OWN directory (so cwd-relative paths resolve)
# AND from the repo root (so the cwd-shadow bug, Pitfall #50/#55/#68, is caught).
set -u
ROOT=/home/junze/gamezipper.com
OUT=/home/junze/gamezipper.com/.audit/r333-verifier-gate.tsv
: > "$OUT"

cd "$ROOT"
node -e "
const fs=require('fs');
const s=fs.readFileSync('js/games-data.js','utf8');
const t=s.replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm,'var \$1=');
const GAMES=new Function(t+'; return GAMES;')();
GAMES.filter(g=>g.status==='live').forEach(g=>{
  const slug=g.url.replace(/^\//,'').replace(/\/\$/,'');
  console.log(slug);
});
" > /tmp/r333-live-slugs.txt

while read -r slug; do
  d="$ROOT/$slug"
  [ -d "$d" ] || continue
  for v in "$d"/verify*.js "$d"/qa*.js; do
    [ -f "$v" ] || continue
    b=$(basename "$v")
    case "$b" in
      verify_*) ;;
      *) continue ;;
    esac
    # Classify: a browser-injected verifier is an IIFE that uses PAGE globals
    # (LEVELS / state / window) and returns a result object. It cannot run
    # under plain node -- invoking it that way is a GATE bug, not a game bug.
    if grep -qE '^\(function\(\)\{' "$v" && ! grep -qE 'readFileSync|require\(|import ' "$v" \
       && grep -qE '\bLEVELS\[|\bstate\.' "$v"; then
      printf '%s\t%s\tBROWSER\tBROWSER\tskipped-in-node-leg\n' "$slug" "$b" >> "$OUT"
      continue
    fi
    # --- run from the game's own directory ---
    out=$( cd "$d" && timeout 90 node "./$b" 2>&1 )
    rc=$?
    # --- run from the repo root (cwd-shadow discriminator) ---
    outr=$( cd "$ROOT" && timeout 90 node "$slug/$b" 2>&1 )
    rcr=$?
    # verdict line
    verdict=$(printf '%s' "$out" | grep -oiE 'VERDICT[^"]{0,40}|PASS[^"]{0,20}|FAIL[^"]{0,20}' | tail -1 | tr -d '\n' | cut -c1-60)
    printf '%s\t%s\t%d\t%d\t%s\n' "$slug" "$b" "$rc" "$rcr" "$verdict" >> "$OUT"
  done
done < /tmp/r333-live-slugs.txt

echo "=== NON-ZERO EXIT FROM OWN DIR ==="
awk -F'\t' '$3 != 0 {print}' "$OUT"
echo "=== CWD-SHADOW MISMATCH (own-dir rc != root rc) ==="
awk -F'\t' '$3 != $4 {print}' "$OUT"
echo "=== TOTAL ==="
wc -l < "$OUT"
