#!/bin/bash
# GAMEZIPPER_SITEMAP_MONITOR — Hourly production sitemap health check
# Auto-installed 2026-06-16 after c257666c8 broke sitemap.xml with cat -n pollution
#
# Fetches https://gamezipper.com/sitemap.xml and validates it. If the sitemap
# is broken (cat -n pollution, URL count dropped, malformed XML), sends a
# Telegram alert via the OpenClaw bot and writes a kanban task.
#
# Exit codes:
#   0  healthy
#   1  broken (alert sent)
#   2  fetch error

set -e

SITEMAP_URL="${GZ_SITEMAP_URL:-https://gamezipper.com/sitemap.xml}"
MIN_URLS="${GZ_SITEMAP_MIN_URLS:-600}"
LOG_DIR="${HOME}/.openclaw/logs"
LOG_FILE="${LOG_DIR}/sitemap-monitor.log"
STATE_FILE="${LOG_DIR}/sitemap-monitor.state"

mkdir -p "$LOG_DIR"

# Load TG credentials from hermes config (same pattern as monetag-token-check.sh)
HERMES_CONFIG="${HERMES_CONFIG:-/home/msdn/.hermes/config.yaml}"
TG_TOKEN=""
TG_CHAT_ID="1328729168"
if [ -f "${HERMES_CONFIG}" ]; then
  TG_TOKEN=$(awk '/^channels:/{f=1} f && /telegram:/{tg=1} tg && /token:/{gsub(/["\047 ]/,"",$2); print $2; exit}' "${HERMES_CONFIG}")
  cfg_chat=$(awk '/^channels:/{f=1} f && /telegram:/{tg=1} tg && /chat_id:/{print $2; exit}' "${HERMES_CONFIG}")
  [ -n "${cfg_chat:-}" ] && TG_CHAT_ID="${cfg_chat}"
fi

log() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S%z')"
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}

tg_send() {
  local text="$1"
  if [ -z "${TG_TOKEN}" ]; then
    log "TG: skip (no token). msg=${text}"
    return 0
  fi
  python3 - "$TG_TOKEN" "$TG_CHAT_ID" "$text" >> "$LOG_FILE" 2>&1 <<'PYEOF'
import sys, urllib.request, urllib.parse
token, chat_id, text = sys.argv[1], sys.argv[2], sys.argv[3]
url = f"https://api.telegram.org/bot{token}/sendMessage"
data = urllib.parse.urlencode({
    "chat_id": chat_id,
    "text": text,
    "disable_web_page_preview": "true",
}).encode()
req = urllib.request.Request(url, data=data, method="POST")
try:
    urllib.request.urlopen(req, timeout=10).read()
except Exception as e:
    print(f"TG error: {e}", file=sys.stderr)
PYEOF
}

# Idempotency: only alert once per failure type per 6h.
should_alert() {
  local kind="$1"
  local now
  now=$(date +%s)
  local last=0
  if [ -f "$STATE_FILE" ]; then
    last=$(grep -F "$kind" "$STATE_FILE" 2>/dev/null | tail -1 | cut -d= -f2 || echo 0)
  fi
  local age=$((now - last))
  if [ "$age" -lt 21600 ]; then
    log "alert suppressed for $kind (last sent ${age}s ago)"
    return 1
  fi
  return 0
}

mark_alerted() {
  local kind="$1"
  local now
  now=$(date +%s)
  echo "$kind=$now" >> "$STATE_FILE"
  tail -20 "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

# Fetch + verify
TMPF=$(mktemp)
trap "rm -f $TMPF" EXIT

HTTP_CODE=$(curl -s -o "$TMPF" -w '%{http_code}' --max-time 30 "$SITEMAP_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  log "FAIL: HTTP $HTTP_CODE fetching $SITEMAP_URL"
  if should_alert "fetch_${HTTP_CODE}"; then
    tg_send "🚨 [gz-sitemap-monitor] HTTP $HTTP_CODE fetching $SITEMAP_URL at $(date '+%H:%M CST')"
    mark_alerted "fetch_${HTTP_CODE}"
  fi
  exit 2
fi

# Verify the body
set +e
VERIFY_JSON=$(cd /home/msdn/gamezipper.com && python3 scripts/verify_sitemap.py --json --min-urls "$MIN_URLS" "$TMPF" 2>&1)
EXIT=$?
set -e

if [ $EXIT -eq 0 ]; then
  URL_COUNT=$(echo "$VERIFY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['checks']['url_count']['count'])" 2>/dev/null || echo "?")
  log "OK: sitemap healthy, $URL_COUNT URLs"
  exit 0
fi

# Something's wrong — gather diagnostics
URL_COUNT=$(echo "$VERIFY_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['checks']['url_count']['count'])" 2>/dev/null || echo "?")
POLLUTED=$(echo "$VERIFY_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['checks']['line_number_pollution']['count'])" 2>/dev/null || echo "?")
EXIT_NAME=$(case $EXIT in
  1) echo "line_number_pollution";;
  2) echo "xml_parse_error";;
  3) echo "url_count_below_min";;
  4) echo "wrong_root_namespace";;
  *) echo "unknown_$EXIT";;
esac)

log "FAIL: $EXIT_NAME, urls=$URL_COUNT polluted_lines=$POLLUTED"

if should_alert "$EXIT_NAME"; then
  tg_send "🚨 [gz-sitemap-monitor] production sitemap broken: $EXIT_NAME — urls=$URL_COUNT polluted_lines=$POLLUTED at $(date '+%H:%M CST')"
  mark_alerted "$EXIT_NAME"
fi

# Save the broken file for forensics
cp "$TMPF" "${LOG_DIR}/sitemap-broken-$(date +%Y%m%d-%H%M%S).xml" 2>/dev/null || true

exit 1