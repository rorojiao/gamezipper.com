#!/usr/bin/env node
/**
 * R335: build the JSON game feed that BOTH publisher-partner.html and
 * embed-games.html advertise as `GET https://gamezipper.com/api/games.json`.
 *
 * DEFECT: the endpoint returned 404 — the pages promise a public JSON feed
 * with "no API key, no signup" and then do not serve it. A publisher who
 * follows the documentation gets a 404 page.
 *
 * The feed is a STATIC file (api/games.json) generated from the live
 * catalog, so it is served by GitHub Pages with no server and no runtime
 * dependency. A `scripts/gen_games_json.py` regenerates it whenever the
 * catalog changes, and `scripts/sync-game-counts.sh` gains a check that the
 * feed is in sync with games-data.js.
 *
 * FIELD CONTRACT (matches the documented example):
 *   slug, name, category, embedUrl, thumbnail
 * plus `emoji` and `tags` which are useful to an embedder and are already
 * in the catalog.
 *
 * thumbnail points at /thumbs/<slug>.jpg — the SAME asset the homepage card
 * grid uses — so the feed's images are guaranteed to resolve for every live
 * game that has a thumb. The documented example used
 * og-images/<slug>.webp, which does not exist on disk (the real files are
 * og-images/<slug>.png and thumbs/<slug>.jpg), so the DOCUMENTATION was
 * also wrong and is corrected to match.
 */
const fs = require('fs');
const ROOT = '/home/junze/gamezipper.com';
process.chdir(ROOT);

const src = fs.readFileSync('js/games-data.js', 'utf8')
  .replace(/^const\s+(GAME_GRADIENTS|GAMES)\s*=/gm, 'var $1=');
const GAMES = new Function(src + '; return GAMES;')();
const live = GAMES.filter(g => g.status === 'live');

const thumbExists = new Set(fs.readdirSync('thumbs'));
const ogExists = new Set(fs.readdirSync('og-images'));

const feed = live.map(g => {
  const slug = g.url.replace(/^\//, '').replace(/\/$/, '');
  const hasThumb = thumbExists.has(slug + '.jpg');
  // og-images are NOT all .png — probe every extension actually on disk
  // (tatami is .jpg, screw-jam is .jpg, the rest are .png)
  const ogExt = ['.png', '.webp', '.jpg'].find(e => ogExists.has(slug + e));
  return {
    slug,
    name: g.name,
    emoji: g.emoji || '',
    category: g.cat,
    tags: (g.tags || []).slice(0, 6),
    embedUrl: 'https://gamezipper.com/' + slug + '/',
    thumbnail: hasThumb
      ? 'https://gamezipper.com/thumbs/' + slug + '.jpg'
      : (ogExt ? 'https://gamezipper.com/og-images/' + slug + ogExt : 'https://gamezipper.com/og-image.webp'),
  };
});

fs.mkdirSync('api', { recursive: true });
fs.writeFileSync('api/games.json', JSON.stringify(feed, null, 1) + '\n');
const size = fs.statSync('api/games.json').size;
console.log('wrote api/games.json:', feed.length, 'games,', size, 'bytes');

// ---------- assertions ----------
const back = JSON.parse(fs.readFileSync('api/games.json', 'utf8'));
if (back.length !== live.length) { console.error('ASSERT FAILED: count mismatch'); process.exit(1); }
if (new Set(back.map(g => g.slug)).size !== back.length) { console.error('ASSERT FAILED: duplicate slugs'); process.exit(1); }
// every thumbnail must point at a file that ACTUALLY EXISTS on disk
let thumbMissing = 0;
for (const g of back) {
  const p = g.thumbnail.replace('https://gamezipper.com/', '');
  if (!fs.existsSync(p)) { thumbMissing++; if (thumbMissing <= 5) console.error('  thumbnail does not exist on disk: ' + p); }
}
if (thumbMissing) { console.error('ASSERT FAILED: ' + thumbMissing + ' thumbnails point at a missing file'); process.exit(1); }
const noThumb = back.filter(g => !/^https:\/\/gamezipper\.com\/(thumbs\/|og-images\/|og-image\.webp)/.test(g.thumbnail));
if (noThumb.length) { console.error('ASSERT FAILED: bad thumbnail URL', noThumb.slice(0, 3)); process.exit(1); }
// every slug must have a live directory
const missingDir = back.filter(g => !fs.existsSync(g.slug + '/index.html'));
if (missingDir.length) { console.error('ASSERT FAILED: slug without index.html', missingDir.map(g => g.slug)); process.exit(1); }
console.log('ASSERTIONS PASS: count, uniqueness, thumbnail shape, directory existence');
