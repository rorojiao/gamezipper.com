#!/usr/bin/env node
/**
 * R338 — maze-family rule extraction.
 *
 * For each member: extract the WIN PREDICATE body (is it rule-based or a
 * solution-compare?), the reachable ACTION verbs, and the level-object shape.
 * Then classify each pair on the two axes the dedup protocol requires:
 *   (1) same core win condition
 *   (2) same allowed actions
 * A pair is only a DUPLICATE if BOTH hold.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const MEMBERS = ['labyrinth', 'maze-runner', 'growmi', 'thief-puzzle',
  'tomb-of-the-mask', 'maze-paint', 'inertia', 'quoridor'];

const WIN_NAMES = /^(checkWin|isWin|win|winLevel|onWin|completeLevel|levelComplete|checkComplete|isComplete|checkSolved|isSolved|checkSolution|isSolved|gameWon|didWin|checkEnd|endCheck|checkGoal|goalReached)$/;

function fnBodies(src) {
  const out = {};
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    let i = m.index + m[0].length - 1, depth = 0, end = -1;
    for (let j = i; j < src.length && j < i + 20000; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end < 0) continue;
    out[name] = src.slice(m.index, end + 1);
  }
  return out;
}

// strip comments + strings for fingerprinting
function norm(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/\s+/g, ' ')
    .trim();
}

function containment(a, b) {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  let hit = 0;
  for (const x of a) if (sb.has(x)) hit++;
  return hit / a.length;
}

function shingles(s, k = 5) {
  const t = norm(s);
  const out = [];
  for (let i = 0; i + k <= t.length; i++) out.push(t.slice(i, i + k));
  return out;
}

// level-object shape
function levelShape(slug, src) {
  const markers = [
    /const\s+LEVELS\s*=\s*\[/,
    /var\s+LEVELS\s*=\s*\[/,
    /LEVELS\s*=\s*\/\*INJECT_LEVELS\*\/\s*\[/,
    /"levels"\s*:/,
  ];
  if (!markers.some((r) => r.test(src))) return null;
  // find the first level object literal and pull its keys
  const m = src.match(/\{\s*"([a-z_]+)"\s*:\s*[^,{]/);
  if (!m) return null;
  return m[1];
}

const VERBS = ['move', 'slide', 'roll', 'tilt', 'swipe', 'drag', 'paint', 'fill', 'collect', 'grab',
  'pick', 'steal', 'jump', 'flip', 'rotate', 'place', 'drop', 'put', 'push', 'pull', 'cut',
  'steer', 'turn', 'place', 'shoot', 'aim', 'grow', 'extend', 'shrink', 'step', 'walk', 'run'];

const report = {};
for (const slug of MEMBERS) {
  const p = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(p)) { report[slug] = { error: 'no index.html' }; continue; }
  const src = fs.readFileSync(p, 'utf8');
  const fns = fnBodies(src);

  const winFns = Object.keys(fns).filter((n) => WIN_NAMES.test(n));
  const winBodies = winFns.map((n) => ({ name: n, body: norm(fns[n]).slice(0, 900) }));

  // solution-compare? (Pitfall #59 shape)
  const solutionCompare = /!==\s*[A-Za-z_$][\w$]*\.?solution|!=\s*[A-Za-z_$][\w$]*\[[^\]]*\]\.solution|\.solution\[[^\]]*\]\s*!==/.test(src);

  // action verbs reachable from handlers
  const verbs = new Set();
  for (const [name, body] of Object.entries(fns)) {
    if (!/(e|ev|event|dir|dx|dy|key|idx|col|row|btn|tap|ch|letter|n|touch|mouse|pointer)/i.test(name)) continue;
    for (const v of VERBS) {
      if (new RegExp('\\b' + v + '\\w*\\s*\\(', 'i').test(body)) verbs.add(v);
    }
  }
  // also inline handlers
  for (const v of VERBS) {
    if (new RegExp("addEventListener\\([^)]*['\"][^'\"]*['\"]\\s*,\\s*function[^{]*\\{[^}]{0,400}?\\b" + v, 'i').test(src)) verbs.add(v);
  }

  // input event kinds actually registered
  const events = new Set();
  for (const m of src.matchAll(/addEventListener\(\s*['"]([a-z]+)['"]/gi)) events.add(m[1].toLowerCase());

  const desc = (src.match(/<meta name="description" content="([^"]{0,300})/) || [])[1] || '';
  const faq = [...src.matchAll(/"@type":"Question","name":"([^"]{0,120})","acceptedAnswer":\{"@type":"Answer","text":"([^"]{0,400})"/g)]
    .map((m) => m[1] + ' :: ' + m[2]);

  report[slug] = {
    winFns, winBodies, solutionCompare,
    verbs: [...verbs].sort(),
    events: [...events].sort(),
    levelShape: levelShape(slug, src),
    desc, faq,
    bytes: src.length,
  };
}

// pairwise win-signature containment
console.log('=== WIN-PREDICATE SIGNATURE CONTAINMENT (>=0.60) ===');
const winSh = {};
for (const [slug, r] of Object.entries(report)) {
  const bodies = (r.winBodies || []).map((w) => w.body).join('\n');
  winSh[slug] = shingles(bodies, 8);
}
const slugs = Object.keys(report);
for (let i = 0; i < slugs.length; i++) {
  for (let j = i + 1; j < slugs.length; j++) {
    const a = slugs[i], b = slugs[j];
    const c = containment(winSh[a], winSh[b]);
    const c2 = containment(winSh[b], winSh[a]);
    if (Math.max(c, c2) >= 0.60) {
      console.log(`  ${Math.max(c, c2).toFixed(3)}  ${a} <-> ${b}`);
    }
  }
}

console.log('\n=== PER-GAME RULE SUMMARY ===');
for (const [slug, r] of Object.entries(report)) {
  console.log(`\n## ${slug}  (${r.bytes}B)`);
  console.log(`  winFns: ${(r.winFns || []).join(', ') || '(none by name)'}`);
  console.log(`  solutionCompareWin: ${r.solutionCompare}`);
  console.log(`  verbs: ${(r.verbs || []).join(', ') || '(none)'}`);
  console.log(`  events: ${(r.events || []).join(', ') || '(none)'}`);
  console.log(`  levelShape: ${r.levelShape}`);
  console.log(`  desc: ${r.desc.slice(0, 180)}`);
  for (const f of (r.faq || []).slice(0, 5)) console.log(`  FAQ: ${f.slice(0, 260)}`);
  for (const w of (r.winBodies || []).slice(0, 3)) {
    console.log(`  -- ${w.name}: ${w.body.slice(0, 420)}`);
  }
}
