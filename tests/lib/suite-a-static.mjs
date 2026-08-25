// tests/lib/suite-a-static.mjs — per-game static integrity checks (cases.md Suite A).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read, exists, loadGames, listPageDirs, h1OutsideSplash, findZombies, SuiteResult } from './common.mjs';

export default function suiteA() {
  const R = new SuiteResult('A:static');
  const games = loadGames();
  const slugCount = new Map();
  for (const g of games) {
    const slug = (g.url || '').replace(/^\//, '').replace(/\/$/, '');
    slugCount.set(slug, (slugCount.get(slug) || 0) + 1);
  }

  for (const g of games) {
    const slug = (g.url || '').replace(/^\//, '').replace(/\/$/, '');
    if (!slug) { R.record('A1', String(g.name), false, 'empty url'); continue; }
    const idx = path.join(ROOT, slug, 'index.html');
    // A1 entry exists
    if (!fs.existsSync(idx)) { R.record('A1', slug, false, 'index.html missing'); continue; }
    R.record('A1', slug, true);
    let html;
    try { html = fs.readFileSync(idx, 'utf8'); } catch (e) { R.record('A1', slug, false, e.message); continue; }

    // A2 title
    const t = html.match(/<title>([\s\S]*?)<\/title>/i);
    R.record('A2', slug, !!(t && t[1].trim()), t ? 'title empty' : 'no <title>');

    // A3 H1 outside splash
    R.record('A3', slug, h1OutsideSplash(html).length >= 1, 'no H1 outside #splash-screen');

    // A4/A5/A6 footer + ads
    R.record('A4', slug, /game-footer\.js/.test(html), 'game-footer.js not referenced');
    R.record('A5', slug, /monetag-manager\.js/.test(html), 'monetag-manager.js not referenced');
    R.record('A6', slug, /gz-ad-below-game/.test(html), 'gz-ad-below-game container missing');

    // A7 zombie domains
    const z = findZombies(html);
    R.record('A7', slug, z.length === 0, z.join(','));

    // A8 registered exactly once
    R.record('A8', slug, slugCount.get(slug) === 1, `registered ${slugCount.get(slug)} times`);
  }

  // Unregistered dirs: basic title check + informational listing.
  const registered = new Set(games.map(g => (g.url || '').replace(/^\//, '').replace(/\/$/, '')));
  const unreg = listPageDirs().filter(d => !registered.has(d));
  for (const d of unreg) {
    const html = read(path.join(d, 'index.html'));
    const t = html.match(/<title>([\s\S]*?)<\/title>/i);
    R.record('A2u', d, !!(t && t[1].trim()), t ? 'title empty' : 'no <title>');
  }
  R.note(`unregistered dirs (${unreg.length}): ${unreg.join(', ')}`);
  return R;
}
