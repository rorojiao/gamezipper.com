#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'blog', 'quick-games-to-play-at-work.html');
const html = fs.readFileSync(pagePath, 'utf8');
const checks = [];

function check(name, condition) {
  const pass = Boolean(condition);
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`);
}

function count(pattern) {
  return (html.match(pattern) || []).length;
}

check('document has the canonical article URL',
  /<link\s+rel="canonical"\s+href="https:\/\/gamezipper\.com\/blog\/quick-games-to-play-at-work\.html">/.test(html));
check('article schema remains present',
  /<script\s+type="application\/ld\+json">\s*\{[\s\S]*?"@type": "Article"/.test(html));
check('AdSense library remains available',
  count(/<script\b[^>]*\bsrc="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-8346383990981353"[^>]*><\/script>/g) === 1);
check('AdSense display unit remains available',
  count(/<ins\b(?=[^>]*\bclass="adsbygoogle")(?=[^>]*\bdata-ad-client="ca-pub-8346383990981353")(?=[^>]*\bdata-ad-slot="1099212472")[^>]*><\/ins>/g) === 1);
check('analytics remains loaded',
  count(/<script\b[^>]*\bsrc="\/gz-analytics\.js\?v=20260801211ccc33b0"[^>]*><\/script>/g) === 1);
check('Adsterra integration remains loaded',
  count(/<script\b[^>]*\bsrc="\/adsterra-manager\.js\?v=v5174lazyep"[^>]*><\/script>/g) === 1);
check('non-game Monetag manager is excluded from this INP target',
  !/monetag-manager\.js/.test(html));
check('game destination links remain intact',
  count(/<a\s+href="\/[a-z0-9-]+\/"/g) >= 10);

const failed = checks.filter((result) => !result.pass);
console.log(`RESULT: ${checks.length - failed.length}/${checks.length} PASS`);
if (failed.length) process.exit(1);
