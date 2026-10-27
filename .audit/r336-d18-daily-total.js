#!/usr/bin/env node
/**
 * R336 — D18: "N levels PLUS a daily challenge" where N ALREADY INCLUDES the daily pool.
 *
 * The defect class (found on dosun-fuwari):
 *   - a game ships `levels.json` with {levels: [...42 main...], daily: [...6...], total: 48}
 *   - the PAGE advertises "48 handcrafted levels plus daily challenge"
 *   - but the level-select grid renders only len(levels) = 42 buttons, and the
 *     6 daily entries are drawn FROM the daily pool, not from the main campaign
 *   - so the claim double-counts the daily pool AND overstates the campaign by 6.
 *
 * The static tell is precise and cheap:
 *   total == len(levels) + len(daily)   AND   the page claims `total` levels
 *   AND   the page phrases it as "... levels ... plus/+ daily".
 * A game whose `total` equals len(levels) and whose page says "42 levels plus daily"
 * is CORRECT and must not be flagged.
 *
 * The detector therefore demands BOTH:
 *   (a) total > len(levels)                  -> the total folds in the daily pool
 *   (b) the page claim equals that inflated total
 *   (c) the page phrases the claim as levels + daily
 */
const fs = require('fs'), path = require('path');
const ROOT = '/home/junze/gamezipper.com';

const findings = [], checked = [];
for (const dir of fs.readdirSync(ROOT)) {
  const d = path.join(ROOT, dir);
  if (!fs.statSync(d).isDirectory()) continue;
  const lj = path.join(d, 'levels.json');
  const idx = path.join(d, 'index.html');
  if (!fs.existsSync(lj) || !fs.existsSync(idx)) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(lj, 'utf8')); } catch (e) { continue; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) continue;
  const main = Array.isArray(j.levels) ? j.levels.length : null;
  const daily = Array.isArray(j.daily) ? j.daily.length : 0;
  const total = typeof j.total === 'number' ? j.total : null;
  if (main === null || total === null) continue;
  const html = fs.readFileSync(idx, 'utf8');
  // claims of the form "<N> [adjective] levels"
  const claims = new Set();
  for (const m of html.matchAll(/\b(\d{1,4})\s+(?:(?:hand-?crafted|handcrafted|curated|unique[- ]solution|verified|daily|practice|challenge|classic)\s+)*levels?\b/gi)) {
    const n = Number(m[1]);
    if (n >= 3 && n <= 1000) claims.add(n);
  }
  const plusDaily = /\blevels?\b[^<>"]{0,40}(\+|plus)\s*(a\s*)?daily|daily[^<>"]{0,30}\bplus\b/i.test(html);
  const rec = { slug: dir, total, main, daily, claims: [...claims].sort((a, b) => a - b), plusDaily };
  checked.push(rec);
  if (total > main && claims.has(total) && plusDaily) {
    findings.push({ ...rec, overstatement: total - main });
  }
}
console.log('games with a levels.json {levels,total,daily} shape:', checked.length);
console.log('total > len(levels) (daily folded into the total):', checked.filter(c => c.total > c.main).length);
console.log('\n=== D18 findings: advertised count includes the daily pool ===');
findings.forEach(f => console.log(`  ${f.slug.padEnd(24)} advertises ${f.total} levels but ships ${f.main} main (${f.daily} daily folded in) -> overstates by ${f.overstatement}`));
if (!findings.length) console.log('  (none)');
fs.writeFileSync('/home/junze/gamezipper.com/.audit/r336-d18-daily-total.json', JSON.stringify({ checked, findings }, null, 1));
