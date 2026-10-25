#!/usr/bin/env bash
# Canonical pipeline round + cooldown gate.
#
# WHY THIS FILE EXISTS (R990, 2026-10-25):
# The gate used to derive LAST_ROUND from `grep -oE 'Round [0-9]+' .game-pipeline-candidates.md`.
# Two independent bugs made that permanently wrong:
#   1. The candidates file's structured "## Round N" headers stop at Round 573, while real
#      rounds reach R990+ (they live in git commit subjects like "pipeline: R990 ...").
#      => LAST_ROUND=573 => "COOLDOWN ACTIVE" forever, so Phase 0 was auto-skipped
#      indefinitely from R573 onward. This was flagged as a DEFECT by R984 but never fixed.
#   2. A heading "## Round 2026-07-21 (cron ...)" makes the naive grep match the YEAR token
#      2026, which then wins the MAX and produces garbage round arithmetic.
#
# This script derives LAST_ROUND from git commit subjects (authoritative, monotonic) and
# filters to plausible round IDs so a year token can never win.
#
# Usage:  bash scripts/pipeline-round-gate.sh
# Output: LAST_ROUND=<n> | CURRENT=<n> | NEXT_REAUDIT=<n> | GATE=COOLDOWN ACTIVE|EXPIRED

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

# Plausible round IDs: >=100, and NOT in the 2000-2100 year band (excludes "Round 2026").
# Note: rounds >=2000 are allowed again above 2100 so a future R2xxx round is not lost.
plausible() { awk '$1>=100 && ($1<2000 || $1>2100)'; }

LAST_ROUND=$(
  {
    git log -400 --pretty=format:'%s' | grep -oE '\bR[0-9]{2,4}\b' | tr -d 'R'
    grep -oE '^#+ Round [0-9]+' .game-pipeline-candidates.md 2>/dev/null | grep -oE '[0-9]+'
    grep -oE '"lastBuildRound"[[:space:]]*:[[:space:]]*[0-9]+' .game-pipeline-status 2>/dev/null | grep -oE '[0-9]+'
    ls -1 .phase0-market-research-round*.md 2>/dev/null | grep -oE '[0-9]+'
  } | plausible | sort -n | tail -1
)

if [ -z "${LAST_ROUND:-}" ]; then
  echo "LAST_ROUND= (could not derive — treat gate as EXPIRED and run Phase 0)" >&2
  echo "CURRENT=0 | NEXT_REAUDIT=0 | GATE=COOLDOWN EXPIRED"
  exit 0
fi

CURRENT=$((LAST_ROUND + 1))
NEXT_REAUDIT=$((LAST_ROUND + 10))

if [ "$CURRENT" -lt "$NEXT_REAUDIT" ]; then
  GATE="COOLDOWN ACTIVE"
else
  GATE="COOLDOWN EXPIRED"
fi

echo "LAST_ROUND=$LAST_ROUND | CURRENT=$CURRENT | NEXT_REAUDIT=$NEXT_REAUDIT | GATE=$GATE"
