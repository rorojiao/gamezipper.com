#!/usr/bin/env python3
"""Seven offline negative-control cases for the official-placement guard.

Only the loopback fixture API is contacted; every guard runs with an isolated
HOME and dummy credentials. Run: python3 scripts/test_adsterra_placement_guard.py
"""

from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import urllib.parse


GUARD = Path(__file__).resolve().with_name("adsterra_placement_guard.py")
SMART = "https://smart-fixture.invalid/CurrentPath?Key=CaseSensitive"
POP = "https://pop-fixture.invalid/fixture?key=pop"
SMART_ID, POP_ID = "887766", "887767"


class Handler(BaseHTTPRequestHandler):
    mode = "healthy"
    requests = []
    invalid_requests = []

    def do_GET(self):
        parts = urllib.parse.urlsplit(self.path)
        params = urllib.parse.parse_qs(parts.query, keep_blank_values=True)
        type(self).requests.append((parts.path, params, self.headers.get("X-API-Key")))
        valid = self.headers.get("X-API-Key") == "TESTKEY"
        if parts.path == "/publisher/placements.json":
            valid = valid and not params
        elif parts.path == "/publisher/stats.json":
            valid = valid and set(params) == {"start_date", "finish_date", "group_by[]"}
            valid = valid and params.get("group_by[]") == ["placement"]
            today = datetime.now(timezone.utc).date()
            valid = valid and params.get("finish_date") == [today.isoformat()]
            valid = valid and params.get("start_date") == [(today - timedelta(days=7)).isoformat()]
        else:
            valid = False
        if not valid:
            type(self).invalid_requests.append(self.path)
        status = 200 if valid else 422
        if self.mode == "http_error":
            status = 503
        if parts.path.endswith("placements.json"):
            expected = SMART
            if self.mode == "normalized":
                expected = "https://smart-fixture.invalid/CurrentPath/?Key=CaseSensitive"
            elif self.mode == "query_case":
                expected = SMART.replace("CaseSensitive", "casesensitive")
            elif self.mode == "host_case":
                expected = SMART.replace("smart-fixture", "SMART-fixture")
            payload = {"items": [{"id": int(SMART_ID), "direct_url": expected},
                                 {"id": int(POP_ID), "title": "Popunder fixture"}], "itemCount": 2}
        else:
            now = datetime.now(timezone.utc)
            stale = self.mode.startswith("stale")
            timestamp = now - timedelta(hours=4) if stale else now
            smart_zero = self.mode in ("fresh_zero", "stale_zero", "unknown_time")
            pop_zero = self.mode == "pop_zero"
            items = [{"placement": SMART_ID, "impression": "0" if smart_zero else "42", "revenue": "0.01"},
                     {"placement": int(POP_ID), "impression": 0 if pop_zero else 13, "revenue": "0.02"}]
            if self.mode in ("missing_fresh", "stale_missing"):
                items = items[1:]
            if self.mode == "bad_impressions":
                items[0]["impression"] = "not-a-number"
            payload = {"items": items, "itemCount": len(items),
                       "dbLastUpdateTime": "fixture update metadata",
                       "dbDateTime": timestamp.strftime("%Y-%m-%d %H:%M:%S")}
            if self.mode == "unknown_time":
                payload.pop("dbDateTime")
            if self.mode == "bad_schema":
                payload = {"error": "not a stats response"}
        body = b"not json" if self.mode == "invalid_json" else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


def main():
    failures = []
    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory(prefix="adsterra-guard-test-") as temporary:
            root = Path(temporary)
            manager = root / "adsterra-manager.js"
            state_file = root / ".hermes/state/adsterra-placement-guard.json"
            base = "http://127.0.0.1:%s/publisher" % server.server_port
            environment = os.environ.copy()
            environment.pop("ADSTERRA_API_KEY", None)
            environment.update(HOME=str(root), PYTHONDONTWRITEBYTECODE="1", NO_PROXY="", no_proxy="")
            # A successful request despite these proves ProxyHandler({}) is used.
            for name in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
                environment[name] = "http://127.0.0.1:1"

            def fixture(smart=SMART, pop=POP):
                manager.write_text(
                    "// var SMARTLINK_URL = 'https://comment.invalid/wrong';\n"
                    "/* var ZONES = {smartlink: '1', popunder: '2'}; */\n"
                    "var SMARTLINK_URL = %s;\nvar POPUNDER_URL = %s;\n"
                    "var ZONES = {popunder: '%s', smartlink: '%s'};\n" %
                    (repr(smart), repr(pop), POP_ID, SMART_ID), encoding="utf-8")

            def run(mode="healthy", extra=(), credential=None, json_output=True, env=None):
                Handler.mode = mode
                command = [sys.executable, str(GUARD), "--manager", str(manager),
                           "--api-base", base, "--timeout", "2"]
                command += ["--api-key", "TESTKEY"] if credential is None else list(credential)
                if json_output:
                    command.append("--json")
                command += list(extra)
                result = subprocess.run(command, capture_output=True, text=True,
                                        env=environment if env is None else env, timeout=10)
                assert not result.stderr, result.stderr
                if json_output:
                    data = json.loads(result.stdout)  # Reject any non-JSON stdout.
                    assert json.loads(state_file.read_text()) == data, "persisted state differs from stdout"
                else:
                    data = json.loads(state_file.read_text())
                    assert "VERDICT=" + data["verdict"] in result.stdout, result.stdout
                assert "TESTKEY" not in result.stdout, "credential leaked into output"
                return result, data

            def expect(mode, verdict, code, **kwargs):
                result, data = run(mode, **kwargs)
                assert (data["verdict"], result.returncode) == (verdict, code), (result.returncode, data)
                return data

            def matching():
                fixture()
                data = expect("healthy", "ok", 0)
                assert data["check_performed"] and data["ts"] and data["checked_at"]
                assert data["zones"]["smartlink"]["url_status"] == "match"
                assert data["zones"]["smartlink"]["revenue"] == 0.01
                expect("normalized", "ok", 0)
                expect("healthy", "ok", 0, json_output=False)

            def mismatch():
                # R1003: stale copied URL retains the same key but wrong host/path.
                fixture(smart="https://stale-fixture.invalid/dead-path?Key=CaseSensitive")
                data = expect("healthy", "url_mismatch", 1)
                zone = data["zones"]["smartlink"]
                assert zone["url_status"] == "url_mismatch"
                assert zone["deployed_url"] != zone["official_direct_url"] == SMART
                expect("fresh_zero", "url_mismatch+phantom", 1)
                expect("stale_zero", "url_mismatch", 1)
                fixture()
                expect("query_case", "url_mismatch", 1)
                expect("host_case", "url_mismatch", 1)

            def no_direct_url():
                fixture()
                data = expect("healthy", "ok", 0)
                zone = data["zones"]["popunder"]
                assert zone["url_status"] == "no_official_direct_url"
                assert zone["official_direct_url"] is None and zone["official_impressions"] == 13
                data = expect("pop_zero", "phantom", 1)
                assert data["zones"]["popunder"]["url_status"] == "no_official_direct_url"

            def fresh_zero():
                fixture()
                data = expect("fresh_zero", "phantom", 1)
                assert data["zones"]["smartlink"]["data_fresh"] is True
                data = expect("missing_fresh", "phantom", 1)
                assert data["zones"]["smartlink"]["stats_placement_missing"] is True

            def stale_zero():
                fixture()
                for mode in ("stale_zero", "stale_missing", "unknown_time"):
                    data = expect(mode, "phantom_stale_data", 0)
                    assert data["zones"]["smartlink"]["data_fresh"] is False
                    assert data["zones"]["smartlink"]["billing_status"] == "phantom_stale_data"

            def unavailable():
                fixture()
                for mode in ("http_error", "invalid_json", "bad_schema", "bad_impressions"):
                    data = expect(mode, "api_unavailable", 2)
                    assert not data["check_performed"] and "could not be performed" in data["error"]
                # Override base with another path on the same local fixture server:
                # no reliance on Internet, DNS, or a potentially occupied dead port.
                expect("healthy", "api_unavailable", 2, extra=("--api-base", base + "/unreachable"))
                count = len(Handler.requests)
                data = expect("healthy", "api_unavailable", 2,
                              credential=("--api-key-file", str(root / "missing-key.json")))
                assert "token missing" in data["error"] and len(Handler.requests) == count
                key_file = root / "keys.json"
                for field in ("api_token", "token", "api_key"):
                    key_file.write_text(json.dumps({field: "TESTKEY"}))
                    expect("healthy", "ok", 0, credential=("--api-key-file", str(key_file)))
                key_file.write_text(json.dumps({"api_token": "TESTKEY", "token": "WRONG", "api_key": "WRONG"}))
                expect("healthy", "ok", 0, credential=("--api-key-file", str(key_file), "--api-key", "WRONG"))
                key_file.write_text(json.dumps({"api_token": "", "token": "TESTKEY"}))
                expect("healthy", "api_unavailable", 2, credential=("--api-key-file", str(key_file)))
                env_key = dict(environment, ADSTERRA_API_KEY="TESTKEY")
                expect("healthy", "ok", 0, credential=(), env=env_key)
                manager.write_text("var ZONES = {};", encoding="utf-8")
                expect("healthy", "api_unavailable", 2)

            def parsed_fixture():
                custom_smart = "https://different-fixture.invalid/SomePath?new=YES"
                custom_pop = "https://other-pop-fixture.invalid/"
                fixture(custom_smart, custom_pop)
                count = len(Handler.requests)
                data = expect("healthy", "ok", 0, extra=("--dry-run",),
                              credential=("--api-key-file", str(root / "nonexistent")))
                assert len(Handler.requests) == count, "dry run contacted the API"
                assert not data["check_performed"] and data["dry_run"]
                assert data["zones"] == {
                    "smartlink": {"zone_id": SMART_ID, "deployed_url": custom_smart},
                    "popunder": {"zone_id": POP_ID, "deployed_url": custom_pop},
                }
                fixture(smart="https://smart-fixture.invalid/CurrentPath/?")
                # An empty query and a trailing slash normalize consistently.
                source = GUARD.read_text(encoding="utf-8")
                namespace = {"__name__": "guard_test_import", "__file__": str(GUARD)}
                exec(compile(source, str(GUARD), "exec"), namespace)
                normal = namespace["normalize_url"]
                assert normal("https://example.invalid/Path/?") == normal("https://example.invalid/Path")
                assert normal("https://example.invalid/Path?Q=Yes") != normal("https://example.invalid/Path?Q=yes")
                assert normal("https://example.invalid/Path?Q=x/") != normal("https://example.invalid/Path?Q=x")

            cases = [
                ("matching official URL", matching),
                ("R1003 mismatch and combined P0", mismatch),
                ("Popunder without official direct_url", no_direct_url),
                ("fresh zero impressions PHANTOM", fresh_zero),
                ("stale zero impressions warning", stale_zero),
                ("API/token/parse failures exit 2", unavailable),
                ("synthetic manager parsing and dry run", parsed_fixture),
            ]
            for name, check in cases:
                try:
                    check()
                except Exception as exc:
                    failures.append(name)
                    print("FAIL %s: %s" % (name, exc))
                else:
                    print("PASS " + name)
            # The intentional invalid endpoint is the sole rejected request;
            # healthy requests must never include a cache-buster or wrong token.
            assert Handler.invalid_requests == ["/publisher/unreachable/placements.json"], Handler.invalid_requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    print("%s: %s/7 cases passed" % ("FAIL" if failures else "PASS", 7 - len(failures)))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
