#!/usr/bin/env node
/**
 * indexnow-submit-all.mjs — full-site IndexNow submission (R532, 2026-11-22)
 *
 * Submits every indexable URL (game pages, static pages, hub pages) to the
 * IndexNow API (Bing / Yandex / Seznam shared index) so crawlers re-fetch
 * pages after the audit-3 whitelist relaunch.
 *
 * - Key: gamezipper2026indexnow (served at /.well-known/indexnowkey.txt)
 * - Batch: 10,000 URLs per POST (API limit)
 * - Idempotent: resubmitting a URL is always safe; IndexNow de-dupes.
 * - Logs to scripts/indexnow_submitted_<date>.txt
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const KEY = 'gamezipper2026indexnow';
const KEY_LOC = 'https://gamezipper.com/indexnowkey.txt';
const HOST = 'gamezipper.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000;

function collectUrls() {
  const urls = new Set();
  // 1) top-level pages
  for (const f of fs.readdirSync(ROOT)) {
    if (!f.endsWith('.html')) continue;
    const p = path.join(ROOT, f);
    if (!fs.statSync(p).isFile()) continue;
    // skip internal/admin pages
    if (/^(admin|404)\.html$/.test(f)) continue;
    urls.add('https://gamezipper.com/' + (f === 'index.html' ? '' : f.replace(/\.html$/, f === 'daily-puzzle.html' ? '.html' : '.html')));
  }
  // normalize: index.html → /
  const out = new Set();
  for (let u of urls) {
    if (u.endsWith('/index.html')) u = u.slice(0, -10);
    out.add(u);
  }
  // 2) game dirs (*/index.html)
  for (const d of fs.readdirSync(ROOT)) {
    if (!fs.statSync(path.join(ROOT, d)).isDirectory()) continue;
    if (/^(node_modules|docs|scripts|tests|worker|api|references|outreach|promotion|audio|js|public|test-library|qa-|_optimization|admin|\.|tools)/.test(d)) continue;
    if (d.startsWith('.')) continue;
    if (fs.existsSync(path.join(ROOT, d, 'index.html'))) {
      out.add('https://gamezipper.com/' + d + '/');
    }
  }
  // 3) blog + zh/blog
  if (fs.existsSync(path.join(ROOT, 'blog'))) {
    for (const f of fs.readdirSync(path.join(ROOT, 'blog'))) {
      if (f.endsWith('.html')) out.add('https://gamezipper.com/blog/' + f.replace(/\.html$/, '/'));
    }
  }
  return [...out].sort();
}

async function main() {
  const urls = collectUrls();
  console.log('collected', urls.length, 'URLs');
  let ok = 0, fail = 0;
  const log = ['# IndexNow full submission ' + new Date().toISOString()];
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOC, urlList: batch });
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
      log.push(`${HOST} HTTP ${res.status}, submitted ${batch.length} URLs at ${new Date().toISOString()}`);
      if (res.status >= 200 && res.status < 300) ok += batch.length; else fail += batch.length;
    } catch (e) {
      log.push(`ERROR batch: ${e.message}`);
      fail += batch.length;
    }
  }
  fs.writeFileSync(path.join(ROOT, 'scripts', 'indexnow_submitted_' + new Date().toISOString().slice(0, 10) + '.txt'), log.join('\n') + '\n');
  console.log(log.join('\n'));
  console.log(`ok=${ok} fail=${fail}`);
}
main();
