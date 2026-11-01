#!/usr/bin/env python3
"""Compare deployed Adsterra placements with the official Publisher API.

Exit 0: checked OK, stale-data warning, or explicit parse-only dry run.
Exit 1: URL_MISMATCH and/or fresh-data PHANTOM. Exit 2: unable to check.
Explicit key-file takes priority over explicit key, environment, and default file.
"""

import argparse
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
import http.client
import json
import math
import os
from pathlib import Path
import re
import tempfile
import urllib.error
import urllib.parse
import urllib.request


API_BASE = "https://api3.adsterratools.com/publisher"
DEFAULT_KEY_FILE = Path("/home/junze/.hermes/secrets/adsterra.json")
DEFAULT_MANAGER = Path(__file__).resolve().parent.parent / "adsterra-manager.js"
FRESH_SECONDS = 2 * 60 * 60


class CheckError(ValueError):
    """The available evidence is insufficient to perform the check."""


def normalize_url(url):
    """Compare case-sensitive host/path/query, ignoring scheme and empty query."""
    if not isinstance(url, str):
        raise CheckError("placement URL must be a string")
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise CheckError("placement URL must be an absolute HTTP(S) URL")
    return parsed.netloc, parsed.path.rstrip("/"), parsed.query


def parse_manager(path):
    source = Path(path).read_text(encoding="utf-8")
    # Remove comments without deleting // inside a quoted URL. In particular,
    # historical example declarations in comments must never override deployment.
    source = re.sub(
        r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|//[^\n]*|/\*[\s\S]*?\*/''',
        lambda m: " " if m.group(0).startswith(("//", "/*")) else m.group(0),
        source,
    )
    match = re.search(r"\b(?:var|let|const)\s+ZONES\s*=\s*\{([^}]*)\}", source, re.S)
    if not match:
        raise CheckError("cannot parse ZONES from manager")
    pairs = re.findall(r'''(?:['"])?(\w+)(?:['"])?\s*:\s*(['"])(\d+)\2''', match.group(1))
    ids = {name: zone_id for name, _, zone_id in pairs}
    if not {"smartlink", "popunder"}.issubset(ids) or len(ids) != len(pairs):
        raise CheckError("manager must declare unambiguous smartlink and popunder zone IDs")
    zones = {}
    for name, zone_id in ids.items():
        pattern = r'''\bvar\s+%s_URL\s*=\s*(['"])([^'"\r\n]+)\1''' % re.escape(name.upper())
        matches = re.findall(pattern, source)
        if len(matches) != 1:
            raise CheckError("cannot parse unambiguous %s_URL from manager" % name.upper())
        url = matches[0][1].replace(r"\/", "/")
        normalize_url(url)
        zones[name] = {"zone_id": zone_id, "deployed_url": url}
    return zones


def load_api_key(args):
    if args.api_key_file is not None:
        key_file = Path(args.api_key_file).expanduser()
    elif args.api_key:
        return args.api_key.strip()
    elif os.environ.get("ADSTERRA_API_KEY", "").strip():
        return os.environ["ADSTERRA_API_KEY"].strip()
    else:
        key_file = DEFAULT_KEY_FILE
    try:
        obj = json.loads(key_file.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise CheckError("API token missing or key file unreadable/invalid") from exc
    if isinstance(obj, dict):
        for field in ("api_token", "token", "api_key"):
            if field in obj:
                value = obj[field]
                if isinstance(value, str) and value.strip():
                    return value.strip()
                break  # First present field is authoritative, even if invalid.
    raise CheckError("API token missing: expected api_token, token, or api_key")


def fetch_json(opener, url, token, timeout):
    request = urllib.request.Request(url, headers={"X-API-Key": token, "Accept": "application/json"})
    endpoint = urllib.parse.urlsplit(url).path.rsplit("/", 1)[-1]
    try:
        with opener.open(request, timeout=timeout) as response:
            if response.status != 200:
                raise CheckError("%s returned HTTP %s" % (endpoint, response.status))
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        code = exc.code
        exc.close()
        raise CheckError("%s returned HTTP %s" % (endpoint, code)) from exc
    except (urllib.error.URLError, OSError, http.client.HTTPException) as exc:
        # Never echo response bodies or credentials into monitor logs/state.
        raise CheckError("%s unreachable (%s)" % (endpoint, type(exc).__name__)) from exc
    except (ValueError, UnicodeError) as exc:
        raise CheckError("%s returned invalid JSON" % endpoint) from exc
    if not isinstance(data, dict) or not isinstance(data.get("items"), list):
        raise CheckError("%s response has no valid items array" % endpoint)
    if any(not isinstance(item, dict) for item in data["items"]):
        raise CheckError("%s contains an invalid item" % endpoint)
    return data


def parse_datetime(value):
    """API timestamps without a timezone are interpreted as UTC."""
    if value is None or isinstance(value, bool):
        return None
    try:
        if isinstance(value, (int, float)) or re.fullmatch(r"\d+(?:\.\d+)?", str(value)):
            stamp = float(value)
            if stamp > 1e11:
                stamp /= 1000
            return datetime.fromtimestamp(stamp, timezone.utc)
        parsed = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
    except (ValueError, OverflowError, OSError):
        return None


def numeric(value, field, integral=False):
    try:
        number = Decimal(str(value))
        if not number.is_finite() or number < 0 or (integral and number != number.to_integral_value()):
            raise InvalidOperation
        result = int(number) if integral else float(number)
        if not integral and not math.isfinite(result):
            raise InvalidOperation
        return result
    except (InvalidOperation, ValueError, OverflowError) as exc:
        raise CheckError("invalid official %s" % field) from exc


def evaluate(zones, placements, stats, now):
    official = {}
    for item in placements["items"]:
        zone_id = str(item.get("id", ""))
        if not zone_id or zone_id in official:
            raise CheckError("placements contain missing or duplicate IDs")
        official[zone_id] = item
    totals = {}
    for item in stats["items"]:
        zone_id = str(item.get("placement", ""))
        if not zone_id:
            raise CheckError("stats item has no placement ID")
        impressions = numeric(item.get("impression"), "impression", integral=True)
        revenue = numeric(item.get("revenue"), "revenue")
        old_impressions, old_revenue = totals.get(zone_id, (0, 0.0))
        totals[zone_id] = old_impressions + impressions, old_revenue + revenue
    db_time = parse_datetime(stats.get("dbDateTime"))
    age = (now - db_time).total_seconds() if db_time is not None else None
    # Unknown timestamps, and implausible future timestamps, cannot prove freshness.
    fresh = age is not None and -300 <= age <= FRESH_SECONDS
    findings = set()
    for name, zone in zones.items():
        zone_id = zone["zone_id"]
        if zone_id not in official:
            raise CheckError("official placement not found for zone %s (%s)" % (name, zone_id))
        direct_url = official[zone_id].get("direct_url")
        zone["official_direct_url"] = direct_url
        if direct_url is None or direct_url == "":
            url_status = "no_official_direct_url"
        elif normalize_url(zone["deployed_url"]) != normalize_url(direct_url):
            url_status = "url_mismatch"
            findings.add(url_status)
        else:
            url_status = "match"
        impressions, revenue = totals.get(zone_id, (0, 0.0))
        billing_status = "ok"
        if impressions == 0:
            billing_status = "phantom" if fresh else "phantom_stale_data"
            findings.add(billing_status)
        zone.update(
            url_status=url_status, billing_status=billing_status,
            official_impressions=impressions, revenue=revenue,
            stats_placement_missing=zone_id not in totals,
            dbLastUpdateTime=stats.get("dbLastUpdateTime"), dbDateTime=stats.get("dbDateTime"),
            data_fresh=fresh, data_age_seconds=age,
        )
    p0 = [v for v in ("url_mismatch", "phantom") if v in findings]
    verdict = "+".join(p0) if p0 else ("phantom_stale_data" if findings else "ok")
    return verdict, 1 if p0 else 0


def write_state(state):
    path = Path.home() / ".hermes/state/adsterra-placement-guard.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=path.name + ".", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(state, handle, indent=2, allow_nan=False)
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manager", type=Path, default=DEFAULT_MANAGER)
    parser.add_argument("--api-base", default=API_BASE, help="Publisher API base (ending in /publisher)")
    parser.add_argument("--api-key-file")
    parser.add_argument("--api-key")
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--days", type=int, default=7, help="Stats lookback in days (default: 7)")
    parser.add_argument("--json", action="store_true", help="Print only the JSON state")
    parser.add_argument("--dry-run", action="store_true", help="Parse deployment only; no API request")
    args = parser.parse_args(argv)
    now = datetime.now(timezone.utc)
    state = {"ts": int(now.timestamp()), "checked_at": now.isoformat(),
             "verdict": "api_unavailable", "check_performed": False,
             "dry_run": args.dry_run, "zones": {}}
    code = 2
    try:
        state["zones"] = parse_manager(args.manager)
        if args.dry_run:
            state["verdict"], code = "ok", 0
        else:
            if args.days < 1 or not math.isfinite(args.timeout) or args.timeout <= 0:
                raise CheckError("days and timeout must be positive")
            token = load_api_key(args)
            if not token:
                raise CheckError("API token missing")
            base = args.api_base.rstrip("/")
            parts = urllib.parse.urlsplit(base)
            if parts.scheme not in ("http", "https") or not parts.netloc or parts.query or parts.fragment:
                raise CheckError("API base must be an HTTP(S) URL without query or fragment")
            # Never use environment proxies or add undocumented cache-buster parameters.
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            placements = fetch_json(opener, base + "/placements.json", token, args.timeout)
            dates = {"start_date": (now - timedelta(days=args.days)).date().isoformat(),
                     "finish_date": now.date().isoformat(), "group_by[]": "placement"}
            state["window"] = dates
            stats = fetch_json(opener, base + "/stats.json?" + urllib.parse.urlencode(dates), token, args.timeout)
            state["dbLastUpdateTime"] = stats.get("dbLastUpdateTime")
            state["dbDateTime"] = stats.get("dbDateTime")
            state["verdict"], code = evaluate(state["zones"], placements, stats, datetime.now(timezone.utc))
            state["check_performed"] = True
    except (OSError, ValueError, TypeError, http.client.HTTPException) as exc:
        state["error"] = "check could not be performed: %s" % exc
    try:
        write_state(state)
    except (OSError, ValueError) as exc:
        state.update(verdict="api_unavailable", error="could not write guard state: %s" % exc)
        code = 2
    if args.json:
        print(json.dumps(state, indent=2, allow_nan=False))
    else:
        if args.dry_run:
            print("DRY RUN: parsed deployment only; official API check not performed")
        if state.get("error"):
            print(state["error"])
        for name, zone in state["zones"].items():
            print("%s (%s): deployed_url=%s" % (name, zone["zone_id"], zone["deployed_url"]))
            if "url_status" in zone:
                print("  official_direct_url=%s; %s; impressions=%s; revenue=%s; %s" % (
                    zone["official_direct_url"], zone["url_status"], zone["official_impressions"],
                    zone["revenue"], zone["billing_status"]))
        print("VERDICT=" + state["verdict"])
    return code


if __name__ == "__main__":
    raise SystemExit(main())
