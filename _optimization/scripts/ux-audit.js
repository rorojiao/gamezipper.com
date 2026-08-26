#!/usr/bin/env node
/* UX audit: structural signals per game — onboarding/help UI (VISIBLE DOM only,
 * SEO meta/schema stripped), HUD affordances, input modality, mobile fit, and
 * difficulty-curve extraction from verifier evidence. One row per game, 100%
 * coverage of dirs with index.html. Output: _optimization/reports/ux-audit.json
 * Usage: node ux-audit.js */
const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..', '..');
const EV = path.join(repo, '_optimization', 'evidence');
const OUT = path.join(repo, '_optimization', 'reports', 'ux-audit.json');

/* ---- catalog (name/cat per slug) ---- */
const catalog = {};
try {
  const gd = fs.readFileSync(path.join(repo, 'js', 'games-data.js'), 'utf8');
  const re = /\{name:"([^"]+)",emoji:"[^"]*",cat:"([^"]+)"[^}]*?url:"\/([^"]+)\/"/g;
  let m; while ((m = re.exec(gd))) catalog[m[3]] = { name: m[1], cat: m[2] };
} catch {}

/* ---- visible DOM extraction: strip scripts(kept separately)/styles/meta/comments ---- */
function splitHtml(html) {
  const scripts = []; const styles = [];
  let h = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, c) => { scripts.push(c); return ' '; })
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, c) => { styles.push(c); return ' '; });
  // strip head seo tags but keep their absence noted; keep body markup+text
  h = h.replace(/<(meta|link)\b[^>]*>/gi, ' ');
  const idsClasses = (h.match(/(?:id|class)="[^"]+"/g) || []).join(' ').toLowerCase();
  const text = h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·').replace(/&rarr;|&larr;/g, '→').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ').toLowerCase();
  return { scripts: scripts.join('\n').toLowerCase(), styles: styles.join('\n').toLowerCase(), idsClasses, text };
}

const RX = {
  helpUI: /how to play|how-to-play|howtoplay|tutorial|instructions|rules|what to do|getting started/,
  controlHint: /\b(tap|click|drag|swipe|press|use (the )?(arrow|wasd|mouse)|hold|slide|draw)\b[^.]{0,40}\b(to|the|and)\b/,
  firstRun: /tap (anywhere|to start|to begin|to play)|click (here )?to (start|begin|play)|press .* to (start|begin)|get ready|tap to continue/,
  restart: /restart|try again|play again|replay|retry|↻|🔄/,
  mute: /mute|sound (on|off)|toggle sound|volume|🔊|🔇/,
  levelSelect: /level select|select level|choose (a )?level|level (menu|screen|picker)|jump to level|level map/,
  hint: /\bhint\b|💡|need help|stuck\?/,
  undo: /\bundo\b|↩|takeback/,
  levelWord: /\blevels?\b/,
};
const idc = k => new RegExp(k.source); // same rx against ids/classes too

function auditGame(slug) {
  const file = path.join(repo, slug, 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const raw = html.toLowerCase();
  const { scripts, styles, idsClasses, text } = splitHtml(html);
  const vis = text + ' ' + idsClasses;
  const sig = {};
  for (const k of ['helpUI', 'controlHint', 'firstRun', 'restart', 'mute', 'levelSelect', 'hint', 'undo']) {
    sig[k] = RX[k].test(vis) || RX[k].test(idsClasses);
  }
  sig.viewport = /name="viewport"[^>]*width=device-width/.test(raw);
  sig.canvas = /<canvas\b/.test(raw);
  sig.touch = /touchstart|pointerdown|ontouchstart|touchmove|pointermove/.test(scripts);
  sig.keys = /keydown|keyup|keypress/.test(scripts);
  sig.mouse = /mousedown|mousemove|click|pointerdown/.test(scripts);
  sig.storage = /localstorage/.test(scripts);
  sig.audio = /audiocontext|new audio|oscillator|\.play\(\)|webaudio/.test(scripts);
  // restart via code path (function or key handler), not just visible text
  sig.restartFn = /function\s+(restart|reset|resetlevel|retry|newgame)|restart\s*[(:=]|\bresetgame\b/.test(scripts) ||
    /'r'\s*===?\s*(e\.)?key|key\s*===?\s*'r'/.test(scripts);
  // responsive canvas: CSS scales canvas (in styles or inline style attrs)
  sig.canvasResponsive = !!sig.canvas && /canvas\s*\{[^}]*width:\s*(100%|min\(100%|calc)|canvas\s*\{[^}]*max-width:\s*100%|aspect-ratio/.test(styles + raw.replace(/\n/g, ''));
  // tiny fonts (readability)
  sig.tinyFont = /font-size:\s*(?:[0-9]px|1[01]px(?:\.\d+)?)/.test(styles + raw);
  sig.fixWidthCanvas = !!sig.canvas && !sig.canvasResponsive && /<canvas[^>]*width="\d+"/.test(raw);

  // ---- difficulty from evidence ----
  const dif = { levels: null, curve: null, spike: null, source: null };
  try {
    const ev = JSON.parse(fs.readFileSync(path.join(EV, slug, 'verify.json'), 'utf8'));
    dif.levels = ev.total ?? ev.levels ?? (Array.isArray(ev.results) ? ev.results.length : null);
    // per-level step counts: numeric arrays, or arrays of objects with a numeric steps/moves field
    const scan = (o, depth) => {
      if (!o || depth > 4) return null;
      if (Array.isArray(o) && o.length >= 5 && o.every(x => typeof x === 'number' && x >= 1 && x < 100000)) return o;
      if (Array.isArray(o) && o.length >= 5 && o.every(x => x && typeof x === 'object')) {
        const key = ['steps', 'moves', 'moveCount', 'solLen', 'length', 'dur', 'ms'].find(k => o.every(x => typeof x[k] === 'number'));
        if (key) return o.map(x => x[key]);
      }
      if (typeof o === 'object') for (const v of Object.values(o)) { const r = scan(v, depth + 1); if (r) return r; }
      return null;
    };
    const arr = scan(ev, 0);
    if (arr && arr.length >= 5) {
      dif.curve = arr;
      dif.source = 'evidence';
      const n = arr.length;
      const sorted = [...arr].sort((a, b) => a - b);
      const med = sorted[Math.floor(n / 2)];
      const first3 = (arr[0] + arr[1] + arr[2]) / 3;
      let spikeAt = -1;
      for (let i = 1; i < n; i++) {
        const prev = arr.slice(Math.max(0, i - 3), i);
        const pm = prev.reduce((a, b) => a + b, 0) / prev.length;
        if (arr[i] > pm * 2.2 && arr[i] > med * 1.8) { spikeAt = i; break; }
      }
      dif.spike = {
        frontLoaded: med > 0 && first3 > med * 0.75, // first levels not easier than global median
        spikeAt,
        med, first3avg: +first3.toFixed(1),
      };
    }
  } catch {}

  // ---- gaps ----
  const meta = catalog[slug] || { name: slug, cat: 'hidden' };
  const gaps = [];
  if (!sig.helpUI && !sig.controlHint && !sig.firstRun) gaps.push('P0:no-onboarding');
  if (!sig.touch && sig.canvas) gaps.push(sig.mouse ? 'P0:mouse-only-input' : 'P1:no-touch');
  if (!sig.restart && !sig.restartFn) gaps.push('P1:no-restart');
  if (sig.audio && !sig.mute) gaps.push('P2:no-mute');
  if (meta.cat === 'puzzle' && !sig.levelSelect && sig.levelWord) gaps.push('P1:no-level-select');
  if (sig.fixWidthCanvas) gaps.push('P2:fixed-canvas');
  if (sig.tinyFont) gaps.push('P2:tiny-font');
  if (dif.spike && dif.spike.spikeAt >= 0) gaps.push('P1:difficulty-spike@' + dif.spike.spikeAt);
  if (dif.spike && dif.spike.frontLoaded) gaps.push('P1:front-loaded-difficulty');

  return { slug, name: meta.name, cat: meta.cat, signals: sig, difficulty: dif, gaps };
}

(async () => {
  const slugs = fs.readdirSync(repo).filter(d => fs.existsSync(path.join(repo, d, 'index.html')) &&
    fs.existsSync(path.join(repo, d, 'verify_engine.js'))).sort();
  const rows = slugs.map(auditGame).filter(Boolean);
  const byGap = {};
  for (const r of rows) for (const g of r.gaps) byGap[g.replace(/@.*/, '')] = (byGap[g.replace(/@.*/, '')] || 0) + 1;
  const summary = {
    updated: new Date().toISOString(), total: rows.length,
    withHelpUI: rows.filter(r => r.signals.helpUI).length,
    withFirstRun: rows.filter(r => r.signals.firstRun).length,
    touchReady: rows.filter(r => r.signals.touch).length,
    keyReady: rows.filter(r => r.signals.keys).length,
    restartable: rows.filter(r => r.signals.restart).length,
    responsiveCanvas: rows.filter(r => r.signals.canvasResponsive).length,
    difficultyData: rows.filter(r => r.difficulty.curve).length,
    spikeGames: rows.filter(r => r.difficulty.spike && r.difficulty.spike.spikeAt >= 0).length,
    frontLoaded: rows.filter(r => r.difficulty.spike && r.difficulty.spike.frontLoaded).length,
    gapHistogram: byGap,
    cleanGames: rows.filter(r => !r.gaps.length).length,
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
})();
