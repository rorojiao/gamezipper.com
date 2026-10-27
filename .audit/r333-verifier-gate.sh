#!/usr/bin/env bash
# R333: regression gate over every live per-game verifier.
# Reports exit codes; exit 124 = non-terminating (Pitfall #75 P1 test-gate defect).
# Each verifier is run from ITS OWN directory (so cwd-relative paths resolve)
# AND from the repo root (so the cwd-shadow bug, Pitfall #50/#55/#68, is caught).
set -u
ROOT=/home/junze/gamezipper.com
OUT=/home/junze/gamezipper.com/.audit/r334-verifier-gate.tsv
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
" > /tmp/r334-live-slugs.txt

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
    # Classify: a BROWSER gate that takes a baseUrl argument (e.g.
    # hidato/verify_picker_browser.js). It drives a real browser, so it
    # needs a URL -- invoking it without one is a GATE bug, not a game bug.
    if grep -qE 'BROWSER (regression )?gate|browser gate' "$v" && grep -qE 'baseUrl|base_url|\[baseUrl\]' "$v"; then
      printf '%s\t%s\tBROWSER\tBROWSER\tneeds-baseUrl-skip-in-node-leg\n' "$slug" "$b" >> "$OUT"
      continue
    fi
    # --- run from the game's own directory ---
    out=$( cd "$d" && timeout 150 node "./$b" 2>&1 )
    rc=$?
    # --- run from the repo root (cwd-shadow discriminator) ---
    outr=$( cd "$ROOT" && timeout 150 node "$slug/$b" 2>&1 )
    rcr=$?
    # verdict line
    # R336 FIX: same lying-verdict regex as r335-verifier-gate.sh — the old
    # pattern matched the JSON key "fails":[...] and recorded PASSing
    # verifiers as "fails" in the TSV, which every later sweep reads.
    verdict=$(printf '%s' "$out" | grep -oE '"verdict"[[:space:]]*:[[:space:]]*"[A-Za-z]+"' | tail -1 | grep -oE '"[A-Za-z]+"$' | tr -d '"')
    if [ -z "$verdict" ]; then
      verdict=$(printf '%s' "$out" | grep -oE '"fail"[[:space:]]*:[[:space:]]*[0-9]+' | tail -1 | grep -oE '[0-9]+$')
      if [ -z "$verdict" ]; then verdict="rc=$rc"; else verdict="fail=$verdict"; fi
    fi
    printf '%s\t%s\t%d\t%d\t%s\n' "$slug" "$b" "$rc" "$rcr" "$verdict" >> "$OUT"
  done
done < /tmp/r334-live-slugs.txt

echo "=== NON-ZERO EXIT FROM OWN DIR ==="
awk -F'\t' '$3 != 0 {print}' "$OUT"
echo "=== CWD-SHADOW MISMATCH (own-dir rc != root rc) ==="
awk -F'\t' '$3 != $4 {print}' "$OUT"
echo "=== TOTAL ==="
wc -l < "$OUT"
