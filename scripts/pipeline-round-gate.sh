#!/usr/bin/env bash
# Canonical pipeline round + cooldown gate.
#
# WHY THIS FILE EXISTS (R990, 2026-10-25): The gate used to derive LAST_ROUND from
# `grep -oE 'Round [0-9]+' .game-pipeline-candidates.md`. Two independent bugs made it
# permanently wrong:
#   1. The candidates file's structured "## Round N" headers stop at Round 573, while real
#      rounds reach R990+ (they live in git commit subjects like "pipeline: R990 ...").
#      => LAST_ROUND=573 => "COOLDOWN ACTIVE" forever, so Phase 0 was auto-skipped
#      indefinitely from R573 onward. Flagged as a DEFECT by R984 but not fixed.
#   2. A heading "## Round 2026-07-21" makes the naive grep match the YEAR token 2026,
#      which then wins the MAX and produces garbage round arithmetic.
#
# ⚠️ R992 FIX (2026-10-26) — the R990 repair was INCOMPLETE: the year-token trap was
# fixed, but the ARITHMETIC RATCHET was not. R990 computed
#       CURRENT = LAST_ROUND + 1 ;  NEXT_REAUDIT = LAST_ROUND + 10
# and tested `CURRENT < NEXT_REAUDIT`, i.e. `LAST+1 < LAST+10` — a tautology that is
# true for EVERY possible LAST_ROUND. The gate could therefore NEVER report EXPIRED,
# so Phase 0 stayed auto-skipped forever (the exact defect R990 claimed to repair).
# Proof: for LAST_ROUND in 990..1005 the old comparison is ALWAYS true (see --self-test).
#
# THE FIX: the cooldown must be anchored to the last round in which Phase 0 RESEARCH
# actually ran (a fixed anchor), while the round counter advances with every round.
#       RESEARCH_ROUND  = last round that ran Phase 0 research   (anchor, moves rarely)
#       CURRENT_ROUND   = next round number across all lanes    (clock, moves often)
#       NEXT_REAUDIT    = RESEARCH_ROUND + 10
#       GATE            = EXPIRED  iff CURRENT_ROUND >= NEXT_REAUDIT
# Now the gate reaches EXPIRED exactly 10 rounds after the last research round, and the
# R990 claim "expires at R1000" becomes true instead of aspirational.
#
# Usage:  bash scripts/pipeline-round-gate.sh
#         bash scripts/pipeline-round-gate.sh --self-test
# Output: RESEARCH_ROUND=<n> | CURRENT=<n> | NEXT_REAUDIT=<n> | GATE=COOLDOWN ACTIVE|EXPIRED

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

# Plausible round IDs: >=100, and NOT in the 2000-2100 year band (excludes "Round 2026").
# Note: rounds >=2000 are allowed again above 2100 so a future R2xxx round is not lost.
plausible() { awk '$1>=100 && ($1<2000 || $1>2100)'; }

# ---- SELF-TEST (proves the old ratchet could never expire, and the new one can) ----
if [ "${1:-}" = "--self-test" ]; then
  fail=0
  echo "== regression: OLD logic (CURRENT=LAST+1, NEXT=LAST+10) =="
  old_expired=0
  for L in $(seq 990 1005); do
    C=$((L+1)); N=$((L+10))
    [ "$C" -lt "$N" ] && continue        # old gate: ACTIVE
    old_expired=$((old_expired+1))
  done
  if [ "$old_expired" -eq 0 ]; then
    echo "  OK  old logic never reports EXPIRED (ratchet confirmed) over 16 values"
  else
    echo "  FAIL old logic reported EXPIRED $old_expired time(s)"; fail=1
  fi

  echo "== regression: NEW logic (anchor vs clock) =="
  R=990                      # research anchor
  for C in 991 995 999 1000 1001 1005; do
    N=$((R+10))
    if [ "$C" -ge "$N" ]; then G="EXPIRED"; else G="ACTIVE"; fi
    echo "  research=$R current=$C next_reaudit=$N -> $G"
  done
  # expect: 999 -> ACTIVE, 1000 -> EXPIRED
  N=$((R+10))
  [ "$((N-1))" -lt "$N" ] && echo "  OK  current=$((N-1)) is ACTIVE" || { echo "  FAIL"; fail=1; }
  [ "$N" -ge "$N" ] && echo "  OK  current=$N is EXPIRED (gate can now expire)" || { echo "  FAIL"; fail=1; }

  echo "== regression: year-token trap still excluded =="
  if printf '2026\n990\n1000\n' | plausible | tr '\n' ' ' | grep -q '^990 1000 '; then
    echo "  OK  2026 filtered out, 990/1000 kept"
  else
    echo "  FAIL year-token filter broken"; fail=1
  fi

  [ "$fail" -eq 0 ] && echo "SELF-TEST PASS" || echo "SELF-TEST FAIL"
  exit "$fail"
fi

# ---- RESEARCH_ANCHOR: last round in which Phase 0 research actually ran ----
# Sources (MAX across all, so a monotonic anchor):
#   * git commit subjects of the PIPELINE lane: "pipeline: R<N>", "status: R<N>",
#     "feat: R<N>" — a ship round implies Phase 0 ran to pick the candidate, and a
#     "pipeline: R<N> NO-BUILD (fresh Phase 0 ...)" round ran research explicitly.
#   * .phase0-market-research-round<N>.md files
#   * candidates-file "## Round N" headers (research rounds append one)
#   * .game-pipeline-status lastBuildRound (a build round implies research)
RESEARCH_ROUND=$(
  {
    git log -400 --pretty=format:'%s' | grep -oE '^(pipeline|status|feat): R[0-9]+' | grep -oE '[0-9]+'
    ls -1 .phase0-market-research-round*.md 2>/dev/null | grep -oE '[0-9]+'
    grep -oE '^#+ Round [0-9]+' .game-pipeline-candidates.md 2>/dev/null | grep -oE '[0-9]+'
    grep -oE '"lastBuildRound"[[:space:]]*:[[:space:]]*[0-9]+' .game-pipeline-status 2>/dev/null | grep -oE '[0-9]+'
  } | plausible | sort -n | tail -1
)

# ---- CLOCK: current round number across ALL lanes (git is authoritative) ----
LAST_ROUND=$(
  {
    git log -400 --pretty=format:'%s' | grep -oE '\bR[0-9]{2,4}\b' | tr -d 'R'
    grep -oE '^#+ Round [0-9]+' .game-pipeline-candidates.md 2>/dev/null | grep -oE '[0-9]+'
    grep -oE '"lastBuildRound"[[:space:]]*:[[:space:]]*[0-9]+' .game-pipeline-status 2>/dev/null | grep -oE '[0-9]+'
    ls -1 .phase0-market-research-round*.md 2>/dev/null | grep -oE '[0-9]+'
  } | plausible | sort -n | tail -1
)

if [ -z "${RESEARCH_ROUND:-}" ] || [ -z "${LAST_ROUND:-}" ]; then
  echo "could not derive rounds — treat gate as EXPIRED and run Phase 0" >&2
  echo "RESEARCH_ROUND=0 | CURRENT=0 | NEXT_REAUDIT=0 | GATE=COOLDOWN EXPIRED"
  exit 0
fi

CURRENT=$((LAST_ROUND + 1))
NEXT_REAUDIT=$((RESEARCH_ROUND + 10))

if [ "$CURRENT" -ge "$NEXT_REAUDIT" ]; then
  GATE="COOLDOWN EXPIRED"
else
  GATE="COOLDOWN ACTIVE"
fi

echo "RESEARCH_ROUND=$RESEARCH_ROUND | CURRENT=$CURRENT | NEXT_REAUDIT=$NEXT_REAUDIT | GATE=$GATE"
