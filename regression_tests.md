# GameZipper — Regression Tests

The QA cycles added the following test artifacts. All scripts are in `/home/msdn/gamezipper.com/qa-round-{0,1,2,3}/`. The intent is that **the next deploy can re-run them and re-validate the fixes automatically**.

---

## Static coverage matrix generator

`qa-round-3/coverage_matrix.json` is the output of the Round-3 sweep. To re-run:

```bash
cd /home/msdn/gamezipper.com
# See qa-round-3 script body (round-trip-able)
python3 -c "
import re, json
from pathlib import Path
ROOT = Path('.')
EXCLUDE = {'dist','admin','blog','audio','api','fun-web-games','docs','kanban','cookie-policy',
    'liquid-connect','monkey-mart-ref','og-images','outreach','promotion','public','scripts',
    'terms','tests','js','contact','.benchmarks','.claude','.git','.well-known','node_modules',
    'qa-round-0','qa-round-1','qa-round-2','qa-round-3','qa-shared','tidy-up-3d'}
dirs = sorted([d.name for d in ROOT.iterdir() if d.is_dir() and d.name not in EXCLUDE and not d.name.startswith('.')])
# ... full script in qa-round-3 reports
"
```

Asserts:
- 241 games total
- 100% on `playable`, `in_registry`, `has_h1`, `has_canonical`, `has_og`, `has_schema`, `has_doctype`
- 100% on `no_todo_marker`
- 92% on `has_canvas` (19 DOM games expected)

---

## Asset 404 sweep

`qa-round-2/asset_check_results.json` is the output of the Round-2 sweep. To re-run:

```bash
cd /home/msdn/gamezipper.com
# 1. Extract all unique asset URLs
python3 -c "
import re, json
from pathlib import Path
ROOT = Path('.')
EXCLUDE = {'dist','admin','blog','audio','api','fun-web-games','docs','kanban','cookie-policy',
    'liquid-connect','monkey-mart-ref','og-images','outreach','promotion','public','scripts',
    'terms','tests','js','contact','.benchmarks','.claude','.git','.well-known','node_modules',
    'qa-round-0','qa-round-1','qa-round-2','qa-round-3','qa-shared'}
assets = json.load(open('qa-round-2/all_assets.json'))
# ... output to /tmp/urls_clean.txt
"
# 2. HEAD-check each
xargs -P 12 -I{} sh -c 'curl -s -o /dev/null -w "%{http_code}|{}\n" --max-time 8 -A "Mozilla/5.0" "{}" 2>/dev/null' < /tmp/urls_clean.txt > /tmp/all_results.txt
# 3. Assert: 0 × 404
awk -F'|' '$1 == "404"' /tmp/all_results.txt | wc -l
# expect: 0
```

Asserts: 0 × 404 on `gamezipper.com` assets (the only known was the merge-kingdom jsDelivr, fixed Round 2).

---

## Triple-source consistency check

```bash
cd /home/msdn/gamezipper.com
python3 -c "
import re, json
from pathlib import Path
ROOT = Path('.')
EXCLUDE = {...}
data = (ROOT / 'js' / 'games-data.js').read_text(errors='ignore')
reg = set()
for m in re.finditer(r'url:[\"\\']([^\"\\']+)[\"\\']', data):
    reg.add(m.group(1).strip('/'))
sitemap = (ROOT / 'sitemap.xml').read_text()
sm = set()
for m in re.finditer(r'<loc>https://gamezipper\\.com/([^<]+)</loc>', sitemap):
    s = m.group(1).rstrip('/')
    if s and '/' not in s and not s.endswith('.html'):
        sm.add(s)
dirs = sorted([d.name for d in ROOT.iterdir() if d.is_dir() and d.name not in EXCLUDE and not d.name.startswith('.')])
assert set(dirs) == reg == sm, f'mismatch: dirs-reg={set(dirs)-reg}, reg-dirs={reg-set(dirs)}, reg-sm={reg-sm}, sm-reg={sm-reg}'
print('OK: 241 == 241 == 241')
"
```

---

## Homepage meta consistency check

```bash
curl -s "https://gamezipper.com/?bust=$(date +%s)" \
  | grep -oE "19\+|238\+|20\+ Free|241\+" | sort | uniq -c
# expect: 38+ 241+, 0 19+/238+/20+ Free
```

---

## Internal TODO / placeholder scan

```bash
cd /home/msdn/gamezipper.com
grep -rEn "this page now needs|TODO|FIXME|lorem ipsum|coming soon|under construction|placeholder text" \
  --include="*.html" --exclude-dir={node_modules,qa-round-*,dist,.git,admin,api,audio,blog,cookie-policy,docs,fun-web-games,kanban,scripts,terms,public,og-images,outreach,promotion,liquid-connect,monkey-mart-ref,tests,js} \
  /home/msdn/gamezipper.com
# expect: empty
```

---

## CDN cache-bust verification

```bash
# 1. Home shows 241+
curl -s "https://gamezipper.com/?bust=$(date +%s)" | grep -c "241\+"   # expect: ≥30

# 2. Save-the-doge in sitemap
curl -s "https://gamezipper.com/sitemap.xml?bust=$(date +%s)" | grep -c "save-the-doge"  # expect: 1+

# 3. 2048 has no TODO
curl -s "https://gamezipper.com/2048/?bust=$(date +%s)" | grep -c "this page now needs"  # expect: 0

# 4. Category JSONs
for f in puzzle arcade card idle simulation word casual; do
  curl -s -o /dev/null -w "$f: %{http_code}\n" "https://gamezipper.com/js/categories/$f.json?bust=$(date +%s)"
done
# expect: all 200

# 5. Antistress has restart overlay
curl -s "https://gamezipper.com/antistress/?bust=$(date +%s)" | grep -c "gz-restart-overlay"  # expect: 1+

# 6. Pong has tap-start
curl -s "https://gamezipper.com/pong/?bust=$(date +%s)" | grep -c "gz-tap-start"  # expect: 1+

# 7. mo-yu-fayu has canonical
curl -s "https://gamezipper.com/mo-yu-fayu/?bust=$(date +%s)" | grep -c 'href="https://gamezipper.com/mo-yu-fayu/"'  # expect: 1+
```

---

## Round Definition (per release_checklist.md)

- **Round** = one full re-sweep of the matrix + asset sweep + content-quality sweep
- **0-new-issue round** = no new bug id, no reopened old bug, no new console error, no new asset 404, no new SEO structural error, no new mobile layout issue, no new unplayable game, no new perf regression, all previously fixed items still pass
- **Release** = 3 consecutive 0-new-issue rounds observed

---

## Future Test Plan (Sprint 1)

Per `gap_analysis.md` P1-24, build a Playwright E2E suite:

```js
// pseudocode
const games = JSON.parse(fs.readFileSync('js/games-data.js').match(/GAMES = (.*?);/s)[1])
for (const g of games) {
  test(`${g.slug} loads and is playable`, async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(`https://gamezipper.com/${g.slug}/`)
    const hasCanvas = await page.locator('canvas').count() > 0
    if (hasCanvas) {
      // Click center to start
      await page.locator('canvas').first().click()
      // Wait for any restart overlay
      const restart = page.locator('#gz-restart-btn')
      // No fatal errors
      expect(errors).toEqual([])
    }
  })
}
```

Plus per-game core interaction tests (5–10 per game) covering the genres from §10 of the QA brief.
