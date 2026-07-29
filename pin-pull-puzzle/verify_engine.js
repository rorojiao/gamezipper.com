#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const destination = 'https://gamezipper.com/pull-the-pin/';
const checks = [
  ['noindex,follow robots directive', /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']\s*\/?>/i],
  ['canonical destination', new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${destination}["']\\s*\\/?>`, 'i')],
  ['zero-delay meta refresh', new RegExp(`<meta\\s+http-equiv=["']refresh["']\\s+content=["']0;url=${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\s*\\/?>`, 'i')],
  ['JavaScript location.replace destination', new RegExp(`window\\.location\\.replace\\(['"]${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`)],
  ['fallback Pull The Pin link', /<a\s+href=["']\/pull-the-pin\/["']/i],
];
const failures = checks.filter(([, pattern]) => !pattern.test(html)).map(([name]) => name);
if (/\b(?:const|let|var)\s+LEVELS\s*=/.test(html)) failures.push('redirect page must not embed game LEVELS');
if (failures.length) throw new Error(`Redirect contract failed: ${failures.join(', ')}`);
console.log(`Redirect contract PASS: ${checks.length} checks for ${destination}`);
