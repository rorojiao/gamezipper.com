#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const destination = 'https://gamezipper.com/flow-connect/';
const checks = [
  ['robots', /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']\s*\/?>/i],
  ['canonical', new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${destination}["']\\s*\\/?>`, 'i')],
  ['meta refresh', new RegExp(`<meta\\s+http-equiv=["']refresh["']\\s+content=["']0;url=${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\s*\\/?>`, 'i')],
  ['script redirect', new RegExp(`window\\.location\\.replace\\(['"]${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`)],
  ['fallback link', /<a\s+href=["']\/flow-connect\/["']/i],
];

const failed = checks.filter(([, pattern]) => !pattern.test(html)).map(([name]) => name);
if (/\b(?:const|let|var)\s+LEVELS\s*=/.test(html)) failed.push('embedded LEVELS');
if (failed.length) throw new Error(`Redirect contract failed: ${failed.join(', ')}`);

console.log(`Independent redirect contract PASS: ${checks.length} checks for ${destination}`);
