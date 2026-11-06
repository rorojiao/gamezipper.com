#!/usr/bin/env node
/**
 * R339 — verify the R335 D12 public-API feed against the live catalog.
 *
 * v1 of this probe reported "466 thumbnails not on disk" and "466 embedUrl not
 * live" — BOTH were bugs in the PROBE, not in the feed:
 *   (a) the thumbnail field is an ABSOLUTE url (https://gamezipper.com/thumbs/x.jpg),
 *       so joining it onto '.' produced ".https://..." which never exists;
 *   (b) the embedUrl slug was extracted with /\/([^\/]+)\// which matches the
 *       FIRST slash-delimited segment — "gamezipper.com" — not the slug.
 * A probe that cannot distinguish "the feed is wrong" from "I mis-parsed the
 * feed" is worse than no probe, so this version resolves both properly and
 * carries NEGATIVE CONTROLS (a deliberately corrupted copy must FAIL).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function liveSlugs() {
  const src = fs.readFileSync(path.join(ROOT, 'js/games-data.js'), 'utf8')
    .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
  return new Set(new Function(src + '; return GAMES;')()
    .filter(g => g.status === 'live')
    .map(g => g.url.replace(/^\//, '').replace(/\/$/, '')));
}

/** Resolve an absolute site url to a repo-relative path, or null if off-site. */
function toRepoPath(url) {
  const m = /^https?:\/\/gamezipper\.com\/(.+)$/.exec(String(url || ''));
  if (!m) return null;
  return m[1].split('?')[0].split('#')[0];
}

function main() {
  const live = liveSlugs();
  const feedRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/games.json'), 'utf8'));
  const arr = Array.isArray(feedRaw) ? feedRaw : (feedRaw.games || feedRaw.data || []);
  console.log(`feed entries: ${arr.length}   live catalog: ${live.size}`);

  const feedSlugs = new Set(arr.map(g => g.slug));
  const missing = [...live].filter(s => !feedSlugs.has(s));
  const extra = [...feedSlugs].filter(s => !live.has(s));
  const dupes = arr.length - feedSlugs.size;
  console.log(`  slug set: missing=${missing.length} extra=${extra.length} duplicate-slug-rows=${dupes}`);
  if (missing.length) console.log('    missing:', missing.slice(0, 8));
  if (extra.length) console.log('    extra  :', extra.slice(0, 8));

  let badThumb = [], badEmbed = [], offSite = [];
  for (const g of arr) {
    const tp = toRepoPath(g.thumbnail);
    if (!tp) { offSite.push(`${g.slug}: thumbnail not on this site`); continue; }
    if (!fs.existsSync(path.join(ROOT, tp))) badThumb.push(`${g.slug} -> ${tp}`);
    const ep = toRepoPath(g.embedUrl);
    if (!ep) { offSite.push(`${g.slug}: embedUrl not on this site`); continue; }
    const slug = ep.replace(/\/$/, '');
    if (!live.has(slug)) badEmbed.push(`${g.slug} -> ${slug}`);
  }
  console.log(`  thumbnails: broken=${badThumb.length}  embedUrls: broken=${badEmbed.length}  off-site=${offSite.length}`);
  if (badThumb.length) console.log('    bad thumb:', badThumb.slice(0, 8));
  if (badEmbed.length) console.log('    bad embed:', badEmbed.slice(0, 8));
  if (offSite.length) console.log('    off-site :', offSite.slice(0, 8));

  // also probe the LIVE site over HTTP — the feed must be actually served
  console.log('\n=== PRODUCTION PROBE ===');
  const { execFileSync } = require('child_process');
  try {
    const out = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}',
      `https://gamezipper.com/api/games.json?v=${Date.now()}`], { encoding: 'utf8', timeout: 30 });
    console.log(`  https://gamezipper.com/api/games.json -> HTTP ${out.trim()}`);
  } catch (e) { console.log('  production probe failed:', e.message); }

  const ok = missing.length === 0 && extra.length === 0 && dupes === 0 &&
             badThumb.length === 0 && badEmbed.length === 0;
  console.log(`\nVERDICT: ${ok ? 'PASS — feed exactly matches the live catalog' : 'FAIL'}`);

  // ---- NEGATIVE CONTROLS: a corrupted feed MUST be reported as FAIL ----
  console.log('\n=== NEGATIVE CONTROLS (probe must be able to FAIL) ===');
  const ctrl = (label, mutate) => {
    const copy = arr.map(g => ({ ...g }));
    mutate(copy);
    const s = new Set(copy.map(g => g.slug));
    const m = [...live].filter(x => !s.has(x));
    const e = [...s].filter(x => !live.has(x));
    const bad = copy.filter(g => {
      const tp = toRepoPath(g.thumbnail);
      return tp && !fs.existsSync(path.join(ROOT, tp));
    }).length;
    const detected = m.length || e.length || bad;
    console.log(`  ${label}: detected=${detected ? 'YES' : 'NO  <-- PROBE IS A NO-OP'}`);
  };
  ctrl('drop one entry        ', c => c.splice(0, 1));
  ctrl('swap slug for a bogus ', c => { c[0].slug = 'not-a-real-game'; });
  ctrl('point thumb at missing', c => { c[0].thumbnail = 'https://gamezipper.com/thumbs/nope.jpg'; });

  process.exit(ok ? 0 : 1);
}

main();
