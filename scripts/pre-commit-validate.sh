#!/bin/bash
# GAMEZIPPER_PRE_COMMIT_VALIDATE_SITEMAP — Hard Rule (cat -n pollution)
# Auto-installed by scripts/install-pre-commit-hook.sh
#
# Refuses to commit sitemap.xml if it looks like the output of
# `cat -n sitemap.xml > new.xml` or `nl -ba sitemap.xml > new.xml` —
# prefixes like `    3700|<url>` break XML parsing for search engines.
#
# 2026-06-16: this rule was added after c257666c8 broke the sitemap by
# piping through `cat -n` before redirecting to a file.
#
# Detects:
#   - Any line matching `^[0-9]+|<` (cat -n or `nl -ba` style)
#   - Any line matching `^\s+\d+\s+<\?xml` (cat -n with whitespace)
#   - URL count below SITEMAP_MIN_URLS (default 600)
#   - <lastmod> missing on any URL
#
# Exit codes:
#   0  sitemap.xml is clean (or not staged)
#   1  pollution detected, commit refused

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
  echo "[gz-pre-commit-sitemap] not in a git repo, skipping"
  exit 0
fi

cd "$REPO_ROOT"

# Only run if sitemap.xml is staged for commit. If it's not touched,
# nothing to validate.
if ! git diff --cached --name-only --diff-filter=AM | grep -qx 'sitemap.xml'; then
  echo "[gz-pre-commit-sitemap] sitemap.xml not staged, skipping"
  exit 0
fi

# Read the staged version (not the working copy) so an unstaged edit
# doesn't sneak through.
SITEMAP_PATH=$(git diff --cached --name-only --diff-filter=AM | grep -x 'sitemap.xml' | head -1)
if [ -z "$SITEMAP_PATH" ]; then
  SITEMAP_PATH="sitemap.xml"
fi

# Use --staged to get the version that's about to be committed.
STAGED_CONTENT=$(git show ":$SITEMAP_PATH" 2>/dev/null || true)
if [ -z "$STAGED_CONTENT" ]; then
  # New file — fall back to working copy
  if [ ! -f "$SITEMAP_PATH" ]; then
    echo "[gz-pre-commit-sitemap] sitemap.xml staged but unreadable, skipping"
    exit 0
  fi
  STAGED_CONTENT=$(cat "$SITEMAP_PATH")
fi

# Save to a temp file so the Python validator can read it
TMPF=$(mktemp)
trap "rm -f $TMPF" EXIT
printf '%s' "$STAGED_CONTENT" > "$TMPF"

# Run the validator. Capture both stdout and exit code.
set +e
OUTPUT=$(python3 scripts/verify_sitemap.py --json --min-urls "${SITEMAP_MIN_URLS:-600}" "$TMPF" 2>&1)
EXIT=$?
set -e

if [ $EXIT -ne 0 ]; then
  echo ""
  echo "❌ [gz-pre-commit-sitemap] sitemap.xml failed pre-commit validation."
  echo ""
  echo "$OUTPUT"
  echo ""
  echo "   Likely cause: someone piped the file through \`cat -n\` or"
  echo "   \`nl -ba\` before staging it. Don't do that — write directly."
  echo ""
  echo "   To fix:"
  echo "     1. Re-generate with:  python3 scripts/gen_sitemap.py"
  echo "     2. Or strip prefixes: sed -i 's/^[[:space:]]*[0-9]\+[|\t][[:space:]]*//' sitemap.xml"
  echo ""
  exit 1
fi

echo "[gz-pre-commit-sitemap] ✅ sitemap.xml clean"
exit 0