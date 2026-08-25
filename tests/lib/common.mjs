// tests/lib/common.mjs — shared helpers for the GameZipper test suites.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

export function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

/** Parse js/games-data.js in a vm sandbox and return the GAMES array. */
export function loadGames() {
  const src = read('js/games-data.js');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(src + '\n;module.exports = typeof GAMES !== "undefined" ? GAMES : [];', sandbox, { filename: 'games-data.js' });
  // Filter sparse-array holes / malformed entries so iteration is safe.
  return sandbox.module.exports.filter(g => g && typeof g === 'object' && g.url);
}

/** All directories (top level) that contain an index.html. */
export function listPageDirs() {
  return fs.readdirSync(ROOT).filter(d => {
    if (d.startsWith('.') || d === 'node_modules') return false;
    try {
      return fs.statSync(path.join(ROOT, d)).isDirectory() && fs.existsSync(path.join(ROOT, d, 'index.html'));
    } catch { return false; }
  });
}

/** Root-level *.html files. */
export function listRootPages() {
  return fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && fs.statSync(path.join(ROOT, f)).isFile());
}

/** Remove the #splash-screen block, then count non-empty H1s (same rule as scripts/6-point-verify.sh). */
export function h1OutsideSplash(html) {
  const noSplash = html.replace(/<div[^>]*id=["']splash-screen["'][^>]*>[\s\S]*?<\/div>/, '');
  const h1s = [...noSplash.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  return h1s;
}

export class SuiteResult {
  constructor(name) {
    this.name = name;
    this.checks = []; // {id, target, pass, detail}
    this.info = [];   // informational notes (not failures)
  }
  record(id, target, pass, detail = '') {
    this.checks.push({ id, target, pass: !!pass, detail: String(detail).slice(0, 500) });
  }
  note(msg) { this.info.push(String(msg).slice(0, 500)); }
  get pass() { return this.checks.filter(c => c.pass).length; }
  get fail() { return this.checks.filter(c => !c.pass).length; }
  failures() { return this.checks.filter(c => !c.pass); }
}

export const ZOMBIE_PATTERNS = [
  { re: /1ktower\.com(?!.*removed)/i, label: '1ktower.com' },
  { re: /alwingulla/i, label: 'alwingulla' },
  { re: /cdn\.monetag\.com/i, label: 'cdn.monetag.com' },
];

/** Strip HTML comments and full-line JS // comments so commented-out zombies don't false-positive. */
function stripComments(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

export function findZombies(html) {
  const live = stripComments(html);
  return ZOMBIE_PATTERNS.filter(z => z.re.test(live)).map(z => z.label);
}
