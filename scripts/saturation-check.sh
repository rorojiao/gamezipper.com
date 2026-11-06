#!/usr/bin/env bash
# saturation-check.sh — GameZipper puzzle pipeline Rule-3 short-circuit.
#
# WHY THIS FILE IS IN THE REPO (R992, 2026-10-26): the pipeline SKILL.md documents
# this as the canonical Layer-1 command —
#     cd /home/junze/gamezipper.com && bash scripts/saturation-check.sh
# — but the file only ever existed inside the skill directory, so running the
# documented command in the repo failed with "No such file or directory". A gate that
# errors out is a gate that never runs. This is the repo copy.
#
# Prints live-game counts for the 4 hard-blocked mechanic categories
# (nikoli/sudoku/match-3/idle). Used by the 30-second SILENT short-circuit to detect
# "terminal-saturation" state without doing full Phase 0 research.
#
# Returns: prints 5 numbers (total, nikoli, sudoku, match3, idle), exit 0.
# Caller compares to thresholds: if TOTAL>=458 AND nikoli>=60 AND
# sudoku>=19 AND match3>=10 AND idle>=6 → output [SILENT] and stop.
#
# Usage:
#   bash scripts/saturation-check.sh              # counts only
#   bash scripts/saturation-check.sh --gate       # counts + TERMINAL/OPEN verdict
#   bash scripts/saturation-check.sh --self-test  # threshold-boundary regression
#
# Edge case: js/games-data.js uses object-literal syntax ({name:"x",cat:"y"})
# which is NOT valid JSON (no quotes around keys). Use node eval, NOT python
# json.loads. The wrapped heredoc below is a no-network, no-deps single call.

set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

MODE="${1:-}"
COUNTS=$(node -e '
const fs=require("fs");
const src=fs.readFileSync("js/games-data.js","utf8");
const m=src.match(/const\s+GAMES\s*=\s*(\[[\s\S]*?\]);?\s*$/m);
if(!m){console.error("no GAMES array match");process.exit(1)}
const a=eval(m[1]);
const C={};
for(const g of a){
  if(!g||!g.name)continue;
  const t=((g.tags||[]).join(" ")+" "+(g.desc||"")).toLowerCase();
  if(/nikoli|kakuro|hitori|masyu|tapa|yaj/.test(t))C.nikoli=(C.nikoli||0)+1;
  else if(/sudoku/.test(t))C.sudoku=(C.sudoku||0)+1;
  else if(/match-?3|tile.match/.test(t))C.match3=(C.match3||0)+1;
  else if(/idle|clicker|incremental/.test(t))C.idle=(C.idle||0)+1;
}
console.log(a.length,C.nikoli||0,C.sudoku||0,C.match3||0,C.idle||0);
')

if [ "$MODE" = "--self-test" ]; then
  fail=0
  # Layer-1 boundary: the exact threshold set must read TERMINAL, one below must not.
  check() { # $1=total $2=nikoli $3=sudoku $4=match3 $5=idle $6=expected
    if [ "$1" -ge 458 ] && [ "$2" -ge 60 ] && [ "$3" -ge 19 ] && [ "$4" -ge 10 ] && [ "$5" -ge 6 ]; then got=TERMINAL; else got=OPEN; fi
    if [ "$got" = "$6" ]; then echo "  OK  [$1 $2 $3 $4 $5] -> $got"; else echo "  FAIL [$1 $2 $3 $4 $5] -> $got (want $6)"; fail=1; fi
  }
  check 458 60 19 10 6 TERMINAL
  check 457 60 19 10 6 OPEN
  check 466 72 20 11 6 TERMINAL
  check 466 59 20 11 6 OPEN
  check 466 72 18 11 6 OPEN
  check 466 72 20  9 6 OPEN
  check 466 72 20 11 5 OPEN
  # live catalog must agree with the script's own numbers
  set -- $COUNTS
  echo "== live =="
  check "$1" "$2" "$3" "$4" "$5" TERMINAL
  [ "$fail" -eq 0 ] && echo "SELF-TEST PASS" || echo "SELF-TEST FAIL"
  exit "$fail"
fi

set -- $COUNTS
TOTAL=$1; NIKOLI=$2; SUDOKU=$3; MATCH3=$4; IDLE=$5
echo "TOTAL $TOTAL NIKOLI $NIKOLI SUDOKU $SUDOKU MATCH3 $MATCH3 IDLE $IDLE"

if [ "$MODE" = "--gate" ]; then
  if [ "$TOTAL" -ge 458 ] && [ "$NIKOLI" -ge 60 ] && [ "$SUDOKU" -ge 19 ] && [ "$MATCH3" -ge 10 ] && [ "$IDLE" -ge 6 ]; then
    echo "GATE=TERMINAL (Layer 1 fires standalone -> SILENT)"
  else
    echo "GATE=OPEN (Layer 1 does not fire on all 5 thresholds)"
  fi
fi
