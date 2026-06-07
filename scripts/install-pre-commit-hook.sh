#!/bin/bash
# install-pre-commit-hook.sh — Hard Rule #17 + #21 + #22 + #33 enforcement
# Installs .git/hooks/pre-commit that runs:
#   1. node -c js/games-data.js  (catches orphan variants A-F)
#   2. bash scripts/sync-game-counts.sh  (catches 3-place data drift)
#   3. bash scripts/sync-user-visible-text.sh  (catches 14+ user-visible text sites)
#   4. node -c js/itemlist-schema.js  (catches orphan variant G — Hard Rule #21)
#   5. python3 inline-JSON-LD parse check on index.html  (catches extra `}` — Hard Rule #22)
#   6. bash scripts/wcag-contrast-audit.sh  (catches WCAG 2.1 AA contrast fails — Hard Rule #33)
# Before allowing commit. Would have caught ALL 10 drift incidents in last 8 days
# at write-time instead of at 2h cron-time.
#
# Re-runnable: backs up existing non-gamezipper hooks to .git/hooks/pre-commit.bak.<timestamp>.
# Run once per repo, or after pulling new sync scripts.
# Created 2026-06-06 12h — Hard Rule #17.
# Updated 2026-06-06 14h — added Hard Rules #21 (itemlist-schema.js) + #22 (inline JSON-LD).
# Updated 2026-06-07 18h — added Hard Rule #33 (WCAG 2.1 AA contrast audit) — v3.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

HOOK_PATH=".git/hooks/pre-commit"

if [ ! -d ".git" ]; then
  echo "ERROR: not a git repo (no .git dir)"
  exit 1
fi

# Verify required scripts exist
for s in js/games-data.js scripts/sync-game-counts.sh scripts/sync-user-visible-text.sh scripts/wcag-contrast-audit.sh; do
  if [ ! -f "$s" ]; then
    echo "ERROR: missing required file $s"
    exit 1
  fi
done

# Back up existing hook (if any) and not one of ours
if [ -f "$HOOK_PATH" ]; then
  if grep -q "GAMEZIPPER_PRE_COMMIT_HOOK" "$HOOK_PATH" 2>/dev/null; then
    if grep -q "GAMEZIPPER_PRE_COMMIT_HOOK_V2" "$HOOK_PATH" 2>/dev/null; then
      echo "GameZipper pre-commit hook v2 already installed at $HOOK_PATH"
      exit 0
    fi
    TS=$(date +%Y%m%d-%H%M%S)
    cp "$HOOK_PATH" "$HOOK_PATH.bak.$TS"
    echo "Upgrading existing hook (v1) to v2 — backed up v1 to $HOOK_PATH.bak.$TS"
  else
    TS=$(date +%Y%m%d-%H%M%S)
    mv "$HOOK_PATH" "$HOOK_PATH.bak.$TS"
    echo "Backed up existing non-gamezipper hook to $HOOK_PATH.bak.$TS"
  fi
fi

cat > "$HOOK_PATH" <<'HOOK_EOF'
#!/bin/bash
# GAMEZIPPER_PRE_COMMIT_HOOK_V3 — Hard Rules #13, #15, #17, #21, #22, #33
# Auto-installed by scripts/install-pre-commit-hook.sh
# Catches orphan object literals (Variants A-G) + 3-place data drift + user-visible text drift
# + inline JSON-LD parse errors + WCAG 2.1 AA contrast fails at write-time, not at 2h cron-time.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || exit 1

echo "[gz-pre-commit] Running Hard Rule checks..."

# 1. JS syntax (catches all 6 orphan variants)
if [ -f "js/games-data.js" ]; then
  if ! node -c js/games-data.js 2>/dev/null; then
    echo "❌ [gz-pre-commit] js/games-data.js has a syntax error."
    echo "   Likely an orphan object literal (Variant A-F). Fix before committing."
    echo "   node -c js/games-data.js"
    exit 1
  fi
fi

# 2. 3-place data drift (Hard Rule #13)
if [ -f "scripts/sync-game-counts.sh" ]; then
  if ! bash scripts/sync-game-counts.sh >/dev/null 2>&1; then
    echo "❌ [gz-pre-commit] GAMES-vs-schema-vs-HTML data drift detected."
    echo "   bash scripts/sync-game-counts.sh  (shows what to fix)"
    bash scripts/sync-game-counts.sh
    exit 1
  fi
fi

# 3. User-visible text drift (Hard Rule #15)
if [ -f "scripts/sync-user-visible-text.sh" ]; then
  if ! bash scripts/sync-user-visible-text.sh >/dev/null 2>&1; then
    echo "❌ [gz-pre-commit] User-visible text is stale (H1 / META / placeholder / etc.)."
    echo "   bash scripts/sync-user-visible-text.sh  (shows what to fix)"
    bash scripts/sync-user-visible-text.sh
    exit 1
  fi
fi

# 4. itemlist-schema.js syntax (catches Orphan Variant G — Hard Rule #21)
if [ -f "js/itemlist-schema.js" ]; then
  if ! node -c js/itemlist-schema.js 2>/dev/null; then
    echo "❌ [gz-pre-commit] js/itemlist-schema.js has a syntax error."
    echo "   Likely Orphan Variant G (missing '}' inside compressed JSON array)."
    echo "   node -c js/itemlist-schema.js"
    node -c js/itemlist-schema.js
    exit 1
  fi
fi

# 5. Inline JSON-LD parse check (catches extra-`}` / parse errors — Hard Rule #22)
if [ -f "index.html" ]; then
  PARSE_ERR=$(python3 -c "
import re, json, sys
with open('index.html', 'r') as f: c = f.read()
blocks = re.findall(r'<script type=\"application/ld\+json\">([\s\S]*?)</script>', c)
errs = []
for i, b in enumerate(blocks):
    try:
        json.loads(b)
    except Exception as e:
        errs.append(f'  block {i}: {e}')
if errs:
    print('JSON-LD parse errors in index.html:')
    for e in errs: print(e)
    sys.exit(1)
" 2>&1)
  if [ $? -ne 0 ]; then
    echo "❌ [gz-pre-commit] Inline JSON-LD blocks failed to parse:"
    echo "$PARSE_ERR"
    exit 1
  fi
fi

# 6. WCAG 2.1 AA contrast audit (catches text color FAILs — Hard Rule #33)
if [ -f "scripts/wcag-contrast-audit.sh" ]; then
  WCAG_OUT=$(bash scripts/wcag-contrast-audit.sh 2>&1)
  if [ $? -ne 0 ]; then
    echo "❌ [gz-pre-commit] WCAG 2.1 AA contrast FAILs detected in index.html:"
    echo "$WCAG_OUT" | head -30
    exit 1
  fi
fi

echo "[gz-pre-commit] ✅ All checks passed."
exit 0
HOOK_EOF

chmod +x "$HOOK_PATH"
echo "✅ GameZipper pre-commit hook installed at $HOOK_PATH"
echo ""
echo "The hook will run on every 'git commit' and block the commit if:"
echo "  - js/games-data.js has a syntax error (orphan object literal)"
echo "  - GAMES vs schema vs HTML data counts are out of sync"
echo "  - User-visible text (H1, META, placeholder, etc.) is stale"
echo ""
echo "To test: try 'git commit --allow-empty -m test' (should pass)"
echo "To bypass in emergency: 'git commit --no-verify'"
