#!/usr/bin/env node
/* Build full game inventory: catalog + uncataloged dirs, tech stack, sizes, verifier coverage.
 * Outputs: _optimization/state/inventory.json + _optimization/game-catalog.md */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');

const NON_GAME = new Set(['admin', 'api', 'audio', 'og-images', 'tests', 'assets', '_optimization',
  'scripts', 'blog', 'zh', 'docs', 'contact', 'cookie-policy', 'terms', 'fun-web-games', 'pool']);

const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'catalog.json'), 'utf8'));
const catalogGames = cat.games.filter(Boolean).map(g => ({
  slug: String(g.url || '').replace(/\//g, '') || null,
  name: g.name, category: g.cat, status: g.status || 'live', inCatalog: true,
})).filter(g => g.slug);

const dirs = fs.readdirSync(repo, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'))
  .map(d => d.name)
  .filter(d => !NON_GAME.has(d) && fs.existsSync(path.join(repo, d, 'index.html')));

const known = new Set(catalogGames.map(g => g.slug));
const extra = dirs.filter(d => !known.has(d)).map(slug => ({
  slug, name: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  category: 'uncategorized', status: 'live', inCatalog: false,
}));

const all = [...catalogGames.filter(g => dirs.includes(g.slug)), ...extra].sort((a, b) => a.slug.localeCompare(b.slug));
console.log('games in scope:', all.length, '(catalog:', catalogGames.filter(g => dirs.includes(g.slug)).length, '+ uncataloged:', extra.length, ')');

const TECH = [
  ['phaser3', /phaser(\.min)?\.js|PHASER\s*=?\s*['"]?3|new Phaser\./i],
  ['phaser', /phaser/i],
  ['pixi', /pixi/i],
  ['three', /three(\.min)?\.js|THREE\./],
  ['matter', /matter(\.min)?\.js|Matter\./],
  ['createjs', /createjs|easeljs|tweenjs|preloadjs/i],
  ['howler', /howler/i],
];

function detect(dir) {
  const full = path.join(repo, dir);
  const files = fs.readdirSync(full);
  const html = fs.readFileSync(path.join(full, 'index.html'), 'utf8');
  // external scripts referenced by index.html
  const extScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1])
    .filter(s => !/^https?:/.test(s) && !s.startsWith('/'));
  let js = '';
  for (const s of extScripts) {
    const p = path.join(full, s.split('?')[0]);
    if (fs.existsSync(p)) js += fs.readFileSync(p, 'utf8');
  }
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const inlineBytes = inlineScripts.reduce((a, s) => a + s.length, 0);
  js += inlineScripts.join('\n');
  const hasInline = inlineBytes > 200;
  const techSet = new Set();
  for (const [name, re] of TECH) if (re.test(html) || re.test(js)) techSet.add(name);
  if (techSet.has('phaser3')) techSet.delete('phaser');
  const canvas = /<canvas[\s>]/i.test(html) || /createElement\(['"]canvas/.test(html) || /getContext\(['"](2d|webgl)/.test(html) || /getContext\(['"](2d|webgl)/.test(js);
  const webAudio = /AudioContext|webkitAudioContext/.test(html) || /AudioContext|webkitAudioContext/.test(js);
  const audioFiles = files.filter(f => /\.(mp3|ogg|wav|m4a)$/i.test(f));
  // recursive audio count (1 level)
  let audioCount = audioFiles.length;
  for (const f of files) {
    const sub = path.join(full, f);
    try { if (fs.statSync(sub).isDirectory()) audioCount += fs.readdirSync(sub).filter(x => /\.(mp3|ogg|wav|m4a)$/i.test(x)).length; } catch (e) {}
  }
  const hasVerifier = fs.existsSync(path.join(full, 'verify_engine.js'));
  // levels hint
  const levelMatches = js.match(/(?:LEVELS|LEVEL_DATA)\s*[:=]/) || html.match(/(?:LEVELS|LEVEL_DATA)\s*[:=]/);
  const jsBytes = js.length;
  const htmlBytes = html.length;
  const engine = techSet.size ? [...techSet].join('+') : (canvas ? 'canvas' : 'dom');
  return { engine, canvas, webAudio, audioCount, hasVerifier, hasLevelsData: !!levelMatches, jsBytes, htmlBytes, extScriptCount: extScripts.length, hasInline };
}

const inventory = all.map(g => {
  const d = detect(g.slug);
  return { ...g, ...d };
});

fs.writeFileSync(path.join(__dirname, '..', 'state', 'inventory.json'), JSON.stringify({
  built_at: new Date().toISOString(), total: inventory.length, games: inventory,
}, null, 1));

// stats
const byEngine = {};
inventory.forEach(g => byEngine[g.engine] = (byEngine[g.engine] || 0) + 1);
const byCat = {};
inventory.forEach(g => byCat[g.category] = (byCat[g.category] || 0) + 1);
console.log('by engine:', JSON.stringify(byEngine));
console.log('by category:', JSON.stringify(byCat));
console.log('with verifier:', inventory.filter(g => g.hasVerifier).length);
console.log('with levels data:', inventory.filter(g => g.hasLevelsData).length);
console.log('no audio files:', inventory.filter(g => g.audioCount === 0).length);
console.log('no webAudio code:', inventory.filter(g => !g.webAudio).length);
console.log('written: _optimization/state/inventory.json');
