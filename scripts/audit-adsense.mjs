import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const ROOT = resolve(process.cwd());
const PUBLISHER_ID = 'ca-pub-8346383990981353';
const ADSENSE_LIBRARY = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const STANDARD_PUSH = /(?:window\.)?adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\][\s\S]*?\.push\s*\(\s*\{\s*}\s*\)/;

function loadLiveGames() {
  const file = resolve(ROOT, 'js/games-data.js');
  const source = readFileSync(file, 'utf8').replace(/^const GAMES/m, 'globalThis.GAMES');
  const context = { globalThis: {} };
  vm.createContext(context);
  new vm.Script(source, { filename: file }).runInContext(context, { timeout: 1000 });

  if (!Array.isArray(context.globalThis.GAMES)) {
    throw new Error('Unable to load GAMES from js/games-data.js');
  }

  return context.globalThis.GAMES.filter((game) => game && game.status === 'live' && game.url);
}

function catalogFile(game) {
  const url = new URL(game.url, 'https://gamezipper.com');
  if (url.origin !== 'https://gamezipper.com' || url.search || url.hash) {
    throw new Error(`unsupported catalog URL ${JSON.stringify(game.url)}`);
  }

  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '');
  if (!relativePath || relativePath.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error(`unsafe catalog URL ${JSON.stringify(game.url)}`);
  }

  const file = resolve(ROOT, relativePath, 'index.html');
  if (!file.startsWith(`${ROOT}${sep}`)) {
    throw new Error(`catalog URL escapes repository ${JSON.stringify(game.url)}`);
  }
  return file;
}

function isRedirectStub(document) {
  const refresh = [...document.querySelectorAll('meta[http-equiv]')].some((meta) => {
    return meta.getAttribute('http-equiv').toLowerCase() === 'refresh' && /(?:^|;)\s*url\s*=/i.test(meta.getAttribute('content') || '');
  });
  if (refresh) return true;

  return [...document.scripts].some((script) => {
    const source = script.textContent.trim();
    return /^(?:window\.)?location(?:\.href)?\s*=\s*(['"]).+?\1\s*;?$/.test(source) ||
      /^(?:window\.)?location\.(?:assign|replace)\(\s*(['"]).+?\1\s*\)\s*;?$/.test(source);
  });
}

function inspectPage(slug, html) {
  const dom = new JSDOM(html, { includeNodeLocations: true });
  const { document } = dom.window;
  const issues = [];

  if (isRedirectStub(document)) {
    return { slug, issues, redirect: true, units: 0 };
  }

  const libraries = [...document.scripts].filter((script) => script.src.includes(ADSENSE_LIBRARY));
  const units = [...document.querySelectorAll('ins.adsbygoogle')];
  const pushes = [...document.scripts].filter((script) => STANDARD_PUSH.test(script.textContent));
  const platformAccounts = [...document.querySelectorAll('meta[name="google-adsense-platform-account"]')];
  const headClose = html.search(/<\/head\s*>/i);
  const unitsInHead = units.filter((unit) => {
    const location = dom.nodeLocation(unit);
    return location && headClose !== -1 && location.startOffset < headClose;
  });
  const slots = units.map((unit) => unit.getAttribute('data-ad-slot') || '');
  const duplicateSlots = [...new Set(slots.filter((slot, index) => slot && slots.indexOf(slot) !== index))];

  if (libraries.length !== 1) issues.push(`expected one AdSense library, found ${libraries.length}`);
  if (libraries.some((script) => new URL(script.src).searchParams.get('client') !== PUBLISHER_ID)) {
    issues.push('AdSense library has an unexpected publisher ID');
  }
  if (units.length === 0) issues.push('missing AdSense ad unit');
  if (units.length !== pushes.length) issues.push(`expected ${units.length} ad-unit pushes, found ${pushes.length}`);
  if (unitsInHead.length) issues.push(`${unitsInHead.length} ad unit(s) are source-positioned in head`);
  if (duplicateSlots.length) issues.push(`duplicate ad slot(s): ${duplicateSlots.join(', ')}`);
  if (platformAccounts.length > 1) issues.push(`duplicate platform-account meta tags: ${platformAccounts.length}`);

  for (const account of platformAccounts) {
    if (account.content !== PUBLISHER_ID) issues.push('platform-account meta has an unexpected publisher ID');
  }
  for (const unit of units) {
    const slot = unit.getAttribute('data-ad-slot') || '';
    const style = unit.getAttribute('style') || '';
    if (unit.getAttribute('data-ad-client') !== PUBLISHER_ID) issues.push('ad unit has an unexpected publisher ID');
    if (!/^\d+$/.test(slot)) issues.push(`ad unit has a nonnumeric slot ID: ${JSON.stringify(slot)}`);
    if (unit.hidden || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)) {
      issues.push('ad unit is directly hidden');
    }
  }

  return { slug, issues, redirect: false, units: units.length };
}

const games = loadLiveGames();
const results = [];

for (const game of games) {
  const slug = game.url.replace(/^\/+|\/+$/g, '');
  let file;
  try {
    file = catalogFile(game);
  } catch (error) {
    results.push({ slug, issues: [error.message], redirect: false, units: 0 });
    continue;
  }

  if (!existsSync(file)) {
    results.push({ slug, issues: [`missing ${file.slice(ROOT.length + 1)}`], redirect: false, units: 0 });
    continue;
  }

  results.push(inspectPage(slug, readFileSync(file, 'utf8')));
}

const failed = results.filter((result) => result.issues.length);
const redirects = results.filter((result) => result.redirect).length;
const checked = results.length - redirects;
const units = results.reduce((total, result) => total + result.units, 0);

if (failed.length) {
  for (const result of failed) {
    console.error(`${result.slug}: ${result.issues.join('; ')}`);
  }
  process.exitCode = 1;
} else {
  console.log(`AdSense audit passed: ${checked}/${games.length} live catalog pages checked, ${redirects} redirect stubs skipped, ${units} ad units validated.`);
}
