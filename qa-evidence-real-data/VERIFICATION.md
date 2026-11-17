# GameZipper real-data verification

Verified end-to-end on 2026-11-17. All eight completion conditions have command-level evidence.

## 1. Public BI is healthy and persistent

- `curl https://bi.gamezipper.com/` → HTTP 200, `ssl_verify_result=0`.
- `curl https://bi.gamezipper.com/api/health` → `{"status":"ok"}`.
- `curl https://bi.gamezipper.com:18443/api/health` → HTTP 200, SSL verification 0; the existing Metabase service remains available.
- Public POST `/api/collect` returned `{"status":"ok","inserted":1}` and CORS `Access-Control-Allow-Origin: https://gamezipper.com`.
- Evidence: `public-root.txt`, `public-health.json`, `public-post-headers.txt`, `public-post-play.json`, `public-18443-health.txt`, `final-public-status.txt`.

## 2. playedToday is a real aggregate

A public `g_start` increased `playedToday` from 2 to 3. Independent SQL and the public API later both returned `playedToday=3`. The two QA rows were read back from SQLite by session ID.

- Evidence: `public-stats-before.json`, `public-stats-after-play.json`, `final-sql-api-reconciliation.json` (`played_match=true`).

## 3. playingNow is deduplicated real presence

The tracker emits `presence` only for a visible, non-prerendered page, initially and every 60 seconds. The API counts distinct non-empty session IDs with a presence event in the trailing 300 seconds. One public test session increased `playingNow` by exactly 1; independent SQL and API both returned `playingNow=23` during final reconciliation. No random number is used.

- Evidence: `public-post-presence.json`, `public-stats-after-presence.json`, `final-sql-api-reconciliation.json` (`active_match=true`), `production-homepage-top.png`.

## 4. New games this week is computed

`scripts/gen-site-metadata.sh` reads game-directory additions from git since Monday. It produced `new_games_since_2026-11-16=0`; the homepage keeps the item hidden at zero.

- Evidence: `round-2-metadata.txt`, `js/site-metadata.js`, `final-source-assertions.json` (`weekly_hidden=true`).

## 5. Updated is real content metadata

`js/site-metadata.js` is generated from the last content commit (`git log -1 --format=%cI`), not the visitor's clock. Production displays `Updated Nov 17, 2026`.

- Evidence: `round-2-metadata.txt`, `production-browser-regression.json`, `production-homepage-top.png`.

## 6. Fabricated reviews removed

The entire What Players Say section, five hardcoded people, fake verified badges and static relative times were removed. Production has neither the section nor a reviews array.

- Evidence: `final-forbidden-source-grep.txt` (empty), `final-source-assertions.json` (`reviews_array_present=false`, `reviews_section_present=false`).

## 7. No fabricated source counters

Production has no simulated counter comments, hardcoded 2,847/3-new-games strings, wall-clock Updated formatter, or `Math.random` in the public-statistics block. Remaining randomness elsewhere is unrelated to displayed statistics (greetings, game selection and shuffling).

- Evidence: `final-forbidden-source-grep.txt` (empty), `final-source-assertions.json` (`stats_block_has_math_random=false`).

## 8. Production regression

Playwright bundled Chromium tested `https://gamezipper.com/`:

- Console errors: 0; page errors: 0; failed requests: 0.
- DOM values equal the real BI response for both counters and the duplicate live badge.
- 20/20 sampled production game pages returned HTTP 200, exposed game controls, accepted interaction and had no game-code exception.
- Statistics started after `load` (`load=5556.3ms`, `statsStart=5557ms`), so the BI request does not block rendering. Its duration was 2657ms and remained asynchronous.
- 467 games are synchronized across catalog/schema/header/footer/categories.
- Evidence: `production-browser-regression.json`, `production-homepage-top.png`, `production-homepage-full.png`, `final-game-count-sync.txt` (`=== ALL IN SYNC ===`).

To avoid console noise from repeatedly failing manual AdSense units, three manual `<ins>` requests were removed. Page-level Auto Ads and the other ad networks remain enabled; no game content was removed.

## Changed files and deployment configuration

Site:

- `index.html`
- `gz-analytics.js`
- `js/site-metadata.js`
- `scripts/gen-site-metadata.sh`
- `qa-evidence-real-data/verify-home-and-games.mjs`
- `qa-evidence-real-data/verify-production.mjs`

BI and ingress:

- `/home/junze/gamezipper-bi/server.py`
- `/etc/cloudflared/orca-100.yml` (`bi-origin.gamezipper.com` → localhost:8090)
- Oracle `/etc/gamezipper-edge/Caddyfile` (only `/api/collect*` and `/api/public-stats*` proxy to bi-origin; other BI routes stay on Metabase)
- Oracle `/usr/local/etc/xray/config.json` (port 443 non-Reality HTTPS fallback → local Caddy 18443)
- Cloudflare DNS: `bi-origin CNAME 63756dbf-1aca-41ae-9866-46ec0b448709.cfargotunnel.com` (proxied). The existing `bi` A record was deliberately preserved.

## Commits

Current rebased site history:

- `e421dbe636` — replace fabricated homepage stats with real BI data
- `760888a8a6` — record verified content metadata
- `c0b2f9f13a` — retire failing manual AdSense requests

BI:

- `d4109c0def745565a6c0f648f071bed4d48d0b61` — expose real homepage activity aggregates

## Rollback

Site only, without touching later unrelated commits:

```bash
git revert c0b2f9f13a 760888a8a6 e421dbe636
git push origin main
```

BI code:

```bash
git -C /home/junze/gamezipper-bi revert d4109c0def745565a6c0f648f071bed4d48d0b61
# Restart the existing BI process after the revert.
```

Oracle ingress (private backups created before changes):

```bash
sudo cp /root/gamezipper-real-data-backup-20261117/Caddyfile.before /etc/gamezipper-edge/Caddyfile
sudo cp /root/gamezipper-real-data-backup-20261117/xray-config.before.json /usr/local/etc/xray/config.json
sudo systemctl restart gamezipper-oracle-caddy xray
```

Tunnel/DNS: remove the `bi-origin.gamezipper.com` ingress block from `/etc/cloudflared/orca-100.yml`, validate and restart `cloudflared-orca-100.service`, then delete only the `bi-origin` CNAME in Cloudflare. Do not alter the existing `bi` A record.
