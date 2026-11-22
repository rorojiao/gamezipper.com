#!/usr/bin/env node
/**
 * indexnow-new-games.mjs — P1 批次 IndexNow 提交
 * 7 款新上架游戏 + 2 个新 landing page + sitemap 子表 + 首页
 */
const KEY = 'gamezipper2026indexnow';
const KEY_LOC = 'https://gamezipper.com/indexnowkey.txt';
const HOST = 'gamezipper.com';

const urls = [
  // 7 款新游戏
  ...['set-quest', 'tango-logic', 'arrowsmith', 'bishop-path', 'camel-path', 'zebra-path', 'giraffe-path']
    .map(s => `https://gamezipper.com/${s}/`),
  // 2 个新 landing
  'https://gamezipper.com/single-player-games.html',
  'https://gamezipper.com/games-without-flash.html',
  // sitemap 重组 + 首页
  'https://gamezipper.com/sitemap.xml',
  'https://gamezipper.com/sitemap-games.xml',
  'https://gamezipper.com/sitemap-pages.xml',
  'https://gamezipper.com/sitemap-blog.xml',
  'https://gamezipper.com/',
];

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOC, urlList: urls });
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
});
console.log(`提交 ${urls.length} URL -> HTTP ${res.status}`);
const text = await res.text().catch(() => '');
if (text) console.log('resp:', text.slice(0, 200));
