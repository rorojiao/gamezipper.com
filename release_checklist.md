# GameZipper — Release Checklist (SOP)

**Last updated:** 2026-06-05

Run this checklist every time code is committed and pushed to `main`, before declaring a release.

---

## Pre-Commit (local)

- [ ] Code follows existing patterns in `js/games-data.js` (new game entries have `name`, `cat`, `tags`, `url`, `desc`, `status: "live"`)
- [ ] No `console.log` / `debugger` / `TODO` / `FIXME` / `XXX` in production code (use `console.warn` only)
- [ ] No `lorem ipsum`, `coming soon`, `under construction`, `placeholder text`, `this page now needs` in any visible body
- [ ] If a new game directory was added, the index.html has: `<!DOCTYPE html>`, `<h1>`, `<link rel="canonical" href="https://gamezipper.com/{slug}/">`, OpenGraph tags, JSON-LD Game schema, at least a How-to-Play section, FAQ
- [ ] If homepage counts were touched, the new number is the **actual** count in registry (currently 241)

## Pre-Push

- [ ] `git status` shows only the files you intend to change
- [ ] `git diff --stat` reasonable size
- [ ] Commit message follows `type(scope): summary` format
- [ ] **Sub-agents commit only; main agent pushes** (per memory rule)
- [ ] Wait ≥120s between consecutive pushes

## Post-Push (CDN verification)

- [ ] Wait 60–90s for Vercel + Cloudflare to deploy
- [ ] Verify with cache-bust (`?bust=$(date +%s)`):
  - [ ] `https://gamezipper.com/` → "241+" appears (no "19+"/"238+"/"20+ Free")
  - [ ] `https://gamezipper.com/sitemap.xml` → 521 URLs (post-Round-0 baseline)
  - [ ] New game URLs return HTTP 200
  - [ ] No `cdn.jsdelivr.net` references in `merge-kingdom/` or anywhere else
  - [ ] No "this page now needs" in `/2048/`
  - [ ] If category pages touched: `https://gamezipper.com/js/categories/{cat}.json` returns 200
- [ ] Lighthouse spot check on home (target: LCP < 2.5s, CLS < 0.1, TBT < 200ms)
- [ ] Mobile viewport (375px) screenshot of home to confirm no regressions

## Coverage Sweep (per-release)

- [ ] Re-run `qa-round-3/coverage_matrix.json` generation
- [ ] All 241 games: playable, in_registry, has_h1, has_canonical, has_og, has_schema, has_doctype, no_todo_marker
- [ ] 0 internal TODO in any game body
- [ ] 0 broken asset 404
- [ ] Triple-source (registry / directories / sitemap) consistent
- [ ] No console errors on first paint of `/`, `/chess/`, `/2048/`, `/color-sort/`, `/puzzle-games.html`, `/js/categories/puzzle.json`

## Round Definition

A "round" is one full re-sweep of the coverage matrix + asset 404 sweep + content-quality sweep.

A "0 new issue" round means: **no** new bug id, no reopened old bug, no new console error, no new asset 404, no new SEO structural error, no new mobile layout issue, no new unplayable game, no new level-broken game, no new perf regression > threshold, no regression of previously fixed items.

## Stop Condition

Release is **APPROVED** when 3 consecutive 0-new-issue rounds are observed.

---

## Per-Round Commands (manual replay)

```bash
# 1. Static coverage matrix (Round N)
python3 qa-round-3/coverage_matrix.json   # or run the script

# 2. Asset 404 sweep
# (script: scrape <img>/<script src>/<link href>/<audio src> from each game,
#  HEAD-check on gamezipper.com, group by status code)

# 3. Placeholder text scan
grep -rEn "this page now needs|TODO|FIXME|lorem ipsum|coming soon|under construction" \
  --include="*.html" --exclude-dir={node_modules,qa-round-*,dist,.git,admin,api,audio,blog,cookie-policy,docs,fun-web-games,kanban,scripts,terms,public,og-images,outreach,promotion,liquid-connect,monkey-mart-ref,tests,js} \
  /home/msdn/gamezipper.com

# 4. Triple-source consistency
python3 -c "..."
# - registry slugs: 241
# - directories:    241
# - sitemap locs:   241
# - all three must match

# 5. Homepage meta consistency
curl -s "https://gamezipper.com/?bust=$(date +%s)" | grep -oE "19\+|238\+|20\+ Free|241\+" | sort | uniq -c
# expect: 38+ 241+, 0 19+/238+/20+ Free
```

## Backlog (Sprint-prioritized)

See `gap_analysis.md` for the full list. Top P1s:
1. Related-games renderer on every detail page
2. Share button on all 241 games (currently 24%)
3. In-page rating ("Was this fun?")
4. Bug-report button
5. Global leaderboard (needs backend decision)
6. Multiplayer discovery landing
7. Content-Security-Policy
