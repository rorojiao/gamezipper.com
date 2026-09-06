#!/usr/bin/env python3
"""Build index.html for River Crossing from the verified levels.json."""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
LEVELS = json.loads((HERE / "levels.json").read_text())


# Build the levels data inline. Compact format: id, tier, pieces, constraints, cap, moves.
def fmt_level(l):
    pieces = l["pieces"]
    constraints = l["constraints"]
    moves = l["moves"]
    nm = l["n_moves"]
    cap = l["cap"]
    story = l["story"]
    pieces_str = json.dumps(pieces)
    constraints_str = json.dumps(constraints)
    moves_str = json.dumps(moves)
    return (f'{{"id":{l["id"]},"tier":"{l["tier"]}","story":"{story}",'
            f'"pieces":{pieces_str},"constraints":{constraints_str},'
            f'"cap":{cap},"n_moves":{nm},"moves":{moves_str}}}')


LEVELS_INLINE = "[" + ",".join(fmt_level(l) for l in LEVELS) + "]"


# Build the index.html. Use a template with __LEVELS__ marker.
TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0,viewport-fit=cover">
<script src="/gz-ux.js?v=ux2" defer></script>
<title>River Crossing Online Free — Classic Wolf-Goat-Cabbage Puzzle | GameZipper</title>
<meta name="description" content="Play River Crossing free online! The classic wolf-goat-cabbage logic puzzle and 30 hand-crafted variants. Ferry 3-5 pieces across a river with a boat that holds 1-2 — without leaving predators alone with their prey. 30 puzzles across 5 difficulty tiers, hints, undo, star ratings, ambient music, mobile-friendly. No download.">
<link rel="canonical" href="https://gamezipper.com/river-crossing/">
<meta name="theme-color" content="#0a1428">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230a1428'/%3E%3Crect x='4' y='34' width='14' height='26' fill='%2348a55c'/%3E%3Crect x='46' y='34' width='14' height='26' fill='%2348a55c'/%3E%3Cpath d='M0 40 L64 40 L64 60 L0 60 Z' fill='%231f5582'/%3E%3Cpath d='M22 42 L42 42 L40 50 L24 50 Z' fill='%23a07050'/%3E%3Ccircle cx='32' cy='38' r='4' fill='%23ffc890'/%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="River Crossing — Classic Wolf-Goat-Cabbage Logic Puzzle">
<meta property="og:description" content="Ferry 3-5 pieces across a river without leaving predators alone with prey. 30 puzzles across 5 tiers. Free online, no download.">
<meta property="og:image" content="https://gamezipper.com/river-crossing/og-image.jpg">
<meta property="og:url" content="https://gamezipper.com/river-crossing/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="River Crossing Online Free">
<meta name="twitter:description" content="The classic wolf-goat-cabbage puzzle plus 29 variants. Free online.">
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
<link rel="preconnect" href="https://www.googlesyndication.com" crossorigin>
<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"VideoGame","name":"River Crossing","description":"Play River Crossing free online. The classic wolf-goat-cabbage logic puzzle and 30 hand-crafted variants. Ferry 3-5 pieces across a river in a boat that holds 1-2 — without leaving predators alone with their prey. 30 puzzles across 5 difficulty tiers.","genre":"Puzzle","gamePlatform":"Web Browser","applicationCategory":"GameApplication","operatingSystem":"Any","image":"https://gamezipper.com/river-crossing/og-image.jpg","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"GameZipper"}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"What is the River Crossing puzzle?","acceptedAnswer":{"@type":"Answer","text":"River Crossing is a classic transport logic puzzle: ferry all the pieces (e.g. a wolf, goat, and cabbage) from the left bank to the right bank using a small boat. The catch: certain pieces cannot be left alone together on a bank without the boatman — for example, a wolf will eat a goat if left alone, and a goat will eat a cabbage. You must plan the order of crossings so the forbidden pairs never end up alone."}},
{"@type":"Question","name":"How do you play River Crossing?","acceptedAnswer":{"@type":"Answer","text":"Tap a piece on the same side as the boat to put it in the boat, then tap the river or the GO button to send the boat across. The boatman always rows the boat. You can take 1 piece (or up to 2 if the boat holds 2). Each move is a crossing — the boat changes side. To win, all pieces must end up on the right bank."}},
{"@type":"Question","name":"Is River Crossing free?","acceptedAnswer":{"@type":"Answer","text":"Yes, completely free in your browser. No download required, mobile-friendly. Works on touch and mouse."}},
{"@type":"Question","name":"How many levels does River Crossing have?","acceptedAnswer":{"@type":"Answer","text":"30 hand-crafted puzzles across 5 difficulty tiers: Beginner (classic 3-piece, boat holds 1), Easy (4-piece with one harmless companion, boat holds 1), Medium (4-piece, boat holds 2), Hard (5-piece, boat holds 2), and Expert (5-piece with 3+ constraints, boat holds 2). Each level has a verified min-length solution."}}
]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{"@type":"ListItem","position":1,"name":"GameZipper","item":"https://gamezipper.com/"},
{"@type":"ListItem","position":2,"name":"River Crossing","item":"https://gamezipper.com/river-crossing/"}
]}
</script>
<style>
:root{--bg:#0a1428;--bg1:#101e3a;--card:#162648;--card-bd:#2a3d6a;--text:#e8eef8;--muted:#94a3c4;--accent:#ffd54f;--accent2:#64ffda;--accent3:#ff8a65;--bad:#ff5252;--warn:#ffc107;--good:#3ee07f;--river:#1f5582;--bank:#48a55c;--boat:#a07050;--visited:#64ffda;--current:#ff8a65}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow-x:hidden}
body{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding-top:14px;padding-bottom:14px}
.gz-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.app{max-width:560px;width:100%;padding:8px 14px;display:flex;flex-direction:column;gap:14px}
.screen{display:none;flex-direction:column;gap:14px}
.screen.active{display:flex}
.title-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px}
.title-logo{font-size:clamp(24px,7vw,36px);font-weight:800;letter-spacing:.5px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent;text-align:center}
.subtitle{text-align:center;color:var(--muted);font-size:14px;margin-top:-4px}
.menu-card{background:var(--card);border:1px solid var(--card-bd);border-radius:18px;padding:24px 20px;display:flex;flex-direction:column;gap:14px;backdrop-filter:blur(8px)}
.menu-card h2{font-size:21px;text-align:center;font-weight:700}
.menu-desc{font-size:13px;color:var(--muted);text-align:center;line-height:1.55}
.btn{background:linear-gradient(135deg,var(--accent),var(--accent3));color:#1a1a3a;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s}
.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 16px rgba(255,213,79,0.25)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text)}
.btn-ghost:hover:not(:disabled){background:rgba(255,255,255,0.1)}
.btn-icon{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--text);padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer}
.btn-icon:hover:not(:disabled){background:rgba(255,255,255,0.12)}
.btn-icon:disabled{opacity:.3;cursor:not-allowed}
.hud{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--card);border:1px solid var(--card-bd);border-radius:12px;padding:8px 12px;flex-wrap:wrap}
.hud-left,.hud-right{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.hud-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.hud-info{font-size:14px;font-weight:700;color:var(--accent)}
.scene{position:relative;background:linear-gradient(180deg,#0a1428 0%,#0e1a36 35%,#1a3a5e 60%,#1f5582 100%);border:1px solid var(--card-bd);border-radius:14px;padding:12px;height:340px;overflow:hidden;touch-action:manipulation;user-select:none}
.scene.solved{border-color:var(--good);box-shadow:0 0 18px rgba(62,224,127,0.3)}
.bank{position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(180deg,#3d8a4f,#2d6e3d);border-bottom:6px solid #5b3a1a}
.bank.left{left:0;border-right:2px solid #5b3a1a}
.bank.right{right:0;border-left:2px solid #5b3a1a}
.bank-label{position:absolute;top:8px;font-size:11px;color:#e0e0e0;font-weight:700;letter-spacing:.5px;text-shadow:0 1px 2px rgba(0,0,0,0.5);text-align:center;width:100%}
.bank.left .bank-label{left:0}
.bank.right .bank-label{right:0}
.river{position:absolute;left:30%;right:30%;top:0;bottom:0;background:transparent}
.boat{position:absolute;top:50%;transform:translate(-50%,-50%);width:90px;height:34px;background:linear-gradient(180deg,#a07050 0%,#7a4f30 100%);border:2px solid #5b3a1a;border-radius:6px 6px 14px 14px;transition:left .55s ease-in-out;display:flex;align-items:center;justify-content:center;gap:2px;z-index:4}
.boat::before{content:"";position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:2px;height:14px;background:#5b3a1a}
.boat::after{content:"⛵";position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:18px;color:#fff}
.boat.flip{transform:translate(-50%,-50%) scaleX(-1)}
.boat.flip::after{transform:translateX(50%) scaleX(-1)}
.piece{position:absolute;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;cursor:pointer;transition:left .55s ease-in-out, top .55s ease-in-out;border:2px solid rgba(255,255,255,0.4);box-shadow:0 3px 6px rgba(0,0,0,0.4);z-index:2;color:#1a1a3a;background:#e0e0e0}
.piece.wolf{background:#bdbdbd;color:#222}
.piece.goat{background:#f4d160;color:#4a3a00}
.piece.cabbage{background:#88c870;color:#1a3a00}
.piece.fox{background:#d97843;color:#fff}
.piece.chicken{background:#f0e0a0;color:#4a3a00}
.piece.grain{background:#d4a050;color:#4a2a00}
.piece.cat{background:#7a7a7a;color:#fff}
.piece.mouse{background:#bca090;color:#3a2a1a}
.piece.cheese{background:#f4d440;color:#4a3a00}
.piece.dog{background:#a08070;color:#fff}
.piece.fish{background:#6090c0;color:#fff}
.piece.snake{background:#5a8a3a;color:#fff}
.piece.frog{background:#7ab060;color:#fff}
.piece.fly{background:#5a5a5a;color:#fff}
.piece.hawk{background:#7a4a30;color:#fff}
.piece.rabbit{background:#e0c0c0;color:#5a2a2a}
.piece.carrot{background:#f08830;color:#fff}
.piece.sheep{background:#e0e0e0;color:#5a5a5a}
.piece.owl{background:#6a5a4a;color:#fff}
.piece.parrot{background:#3aaa3a;color:#fff}
.piece.duck{background:#f0d040;color:#4a3a00}
.piece.hen{background:#f0d0a0;color:#4a3a00}
.piece.selected{box-shadow:0 0 0 3px var(--accent),0 0 18px rgba(255,213,79,0.7);transform:scale(1.1)}
.piece.in-boat{transform:scale(0.7)}
.piece.invalid{animation:shake .3s ease}
.boat-slot{position:absolute;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes float{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,-55%)}}
.wave{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(110,200,240,0.4),transparent);animation:wave 3s ease-in-out infinite}
.wave.w1{top:30%}
.wave.w2{top:60%;animation-delay:1.2s}
@keyframes wave{0%,100%{transform:translateX(-20px);opacity:.3}50%{transform:translateX(20px);opacity:.7}}
.modal-bg{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;z-index:90;padding:14px}
.modal-bg.show{display:flex}
.modal-content{background:var(--bg1);border:2px solid var(--accent);border-radius:14px;padding:24px;max-width:380px;width:100%;text-align:center}
.modal-content h2{font-size:22px;margin-bottom:6px;color:var(--accent)}
.modal-content p{font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.55}
.stars{font-size:36px;color:var(--warn);margin:10px 0;letter-spacing:4px}
.level-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:8px;padding:4px}
.lvl{aspect-ratio:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-weight:700;font-size:14px;transition:all .15s}
.lvl:hover:not(.locked){background:rgba(255,255,255,0.1);transform:translateY(-1px)}
.lvl.cleared{background:rgba(62,224,127,0.15);border-color:rgba(62,224,127,0.3)}
.lvl.current{background:rgba(255,213,79,0.2);border-color:var(--accent)}
.lvl.locked{opacity:.35;cursor:not-allowed}
.lvl-stars{font-size:10px;color:var(--warn);letter-spacing:1px}
.tier-group{margin-bottom:14px}
.tier-header{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:6px;padding-left:4px}
.help-overlay{text-align:left;font-size:12px;color:var(--muted);line-height:1.6}
.help-overlay b{color:var(--accent)}
.help-overlay li{margin-bottom:6px;padding-left:6px}
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--bg1);border:1px solid var(--accent);border-radius:8px;padding:10px 16px;font-size:13px;color:var(--text);z-index:100;display:none;animation:slideDown .3s ease}
.toast.show{display:block}
.toast.bad{border-color:var(--bad)}
@keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}
.flex-center{display:flex;justify-content:center;align-items:center}
.muted{color:var(--muted);font-size:12px}
.progress-bar{width:100%;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-top:6px}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .3s ease}
.move-log{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5;max-height:80px;overflow-y:auto;text-align:left}
.move-log .m{padding:2px 4px;border-radius:3px;background:rgba(255,255,255,0.04)}
.action-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
</style>
</head>
<body>
<div class="app">
<h1 class="gz-sr-only">River Crossing — Classic Wolf-Goat-Cabbage Logic Puzzle</h1>

<!-- Title screen -->
<div id="titleScreen" class="screen active">
  <div class="title-row">
    <div class="title-logo">⛵ River Crossing</div>
  </div>
  <div class="subtitle">Wolf, goat, cabbage — and 29 variations</div>

  <div class="menu-card">
    <h2>⛵ River Crossing</h2>
    <div class="menu-desc">
      Ferry all the pieces across the river. The boatman always rows the boat —
      but certain pieces cannot be left alone together on a bank without him.
      A classic logic puzzle dating back to Alcuin of York (c. 800 AD).
    </div>
    <button class="btn" id="playBtn">▶ Play</button>
    <button class="btn btn-ghost" id="helpBtn">How to Play</button>
    <div class="muted" style="text-align:center">30 puzzles · 5 tiers · 3-5 pieces · boat holds 1 or 2</div>
  </div>

  <div id="gz-ad-below-game" style="position:relative;min-height:90px;max-height:280px;margin:16px auto;max-width:728px;text-align:center;overflow:hidden;contain:layout paint style;color:#666;font-size:.7em;background:transparent;border-radius:6px;box-sizing:border-box;line-height:90px"><span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.78em;opacity:.3;letter-spacing:.05em;font-weight:500;pointer-events:none;transition:opacity .15s ease">Sponsored &middot; Advertisement</span><!-- R642 --></div>
</div>

<!-- Help screen -->
<div id="helpScreen" class="screen">
  <div class="menu-card">
    <h2>How to Play</h2>
    <ol class="help-overlay">
      <li><b>Tap a piece</b> on the same side as the boat to put it in the boat. You can carry up to <b>CAP</b> pieces (1 or 2 per level).</li>
      <li><b>Tap GO</b> to send the boat across the river. The boatman always rows the boat, so the boat is on the side of the boatman.</li>
      <li>Tap a piece in the boat to <b>remove it</b> back to the bank.</li>
      <li>The rules: certain pairs cannot be left alone on a bank without the boatman. E.g. wolf + goat = bad (wolf eats goat); goat + cabbage = bad (goat eats cabbage).</li>
      <li>When ALL pieces are on the right bank, you win!</li>
      <li><b>Hint</b> suggests a piece to take next. <b>Undo</b> reverses the last crossing. <b>Restart</b> resets the level.</li>
      <li>Boat capacity CAP changes per tier — Beginner uses 1, Medium+ use 2.</li>
    </ol>
    <button class="btn btn-ghost" id="helpBackBtn">← Back</button>
  </div>
</div>

<!-- Level select screen -->
<div id="levelSelect" class="screen">
  <div class="hud">
    <div class="hud-left">
      <span class="hud-label">Tier</span><span class="hud-info" id="lsTierName">All</span>
    </div>
    <div class="hud-right">
      <span class="muted" id="lsProgress">0 / 30 cleared</span>
    </div>
  </div>
  <div id="lsGrid"></div>
  <button class="btn btn-ghost" id="lsBackBtn">← Back</button>
</div>

<!-- Game screen -->
<div id="gameScreen" class="screen">
  <div class="hud">
    <div class="hud-left">
      <button class="btn-icon" id="btnMenu" aria-label="Menu">☰</button>
      <span class="hud-label">L<span id="curLvl">1</span></span>
      <span class="muted" id="curTier">Beginner</span>
    </div>
    <div class="hud-right">
      <span class="hud-label">Moves</span><span class="hud-info" id="movesCount">0</span>
      <button class="btn-icon" id="btnHint" aria-label="Hint">💡 <span id="hintCount">3</span></button>
      <button class="btn-icon" id="btnUndo" aria-label="Undo">↶</button>
      <button class="btn-icon" id="btnRestart" aria-label="Restart">↻</button>
    </div>
  </div>

  <div class="scene" id="scene">
    <div class="bank left"><div class="bank-label">LEFT</div></div>
    <div class="bank right"><div class="bank-label">RIGHT</div></div>
    <div class="wave w1"></div>
    <div class="wave w2"></div>
    <div class="boat" id="boat"></div>
    <div id="piecesLayer"></div>
  </div>

  <div class="action-row">
    <button class="btn" id="btnGo">⛵ Cross →</button>
  </div>

  <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
  <div class="move-log" id="moveLog"></div>
</div>

<!-- Win overlay -->
<div id="winOverlay" class="modal-bg">
  <div class="modal-content">
    <h2>⛵ River Crossed!</h2>
    <div class="stars" id="winStars">★★★</div>
    <p id="winMsg">You ferried all the pieces safely across.</p>
    <div class="flex-center" style="gap:8px;flex-wrap:wrap;justify-content:center">
      <button class="btn" id="winNextBtn">Next →</button>
      <button class="btn btn-ghost" id="winReplayBtn">Replay</button>
      <button class="btn btn-ghost" id="winLevelsBtn">Levels</button>
    </div>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
/* ===== GameZipper River Crossing — main game engine ===== */
const LEVELS = __LEVELS__;

const SAVE_KEY = "gz_river_crossing_save_v1";
const SETTINGS_KEY = "gz_river_crossing_settings_v1";

const state = {
  currentLevel: 0,
  pieces: [],          // {id, name, side:'L'|'R', el}
  boat: [],            // piece-ids in the boat
  boatSide: 'L',       // which side the boat is on
  moves: 0,
  selected: null,      // piece-id selected for boat
  history: [],         // [{boatSide, boat:[], left:[], right:[]}]
  hintsLeft: 3,
  audio: null,
  audioMuted: false,
  musicMuted: false,
};

function initAudio() {
  if (state.audio) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    state.audio = new C();
  } catch(e) {}
}

function startAmbientMusic() {
  if (!state.audio || state.musicMuted) return;
  if (state._musicTimer) return;
  const ctx = state.audio;
  const chordProgression = [
    [261.63, 329.63, 392.00], // C major
    [220.00, 277.18, 329.63], // A minor
    [196.00, 246.94, 293.66], // G major
    [174.61, 220.00, 261.63], // F major
  ];
  let idx = 0;
  function playChord() {
    if (!state.audio || state.musicMuted) return;
    const chord = chordProgression[idx % chordProgression.length];
    const now = ctx.currentTime;
    chord.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.025, now + 0.6);
      g.gain.linearRampToValueAtTime(0, now + 3.6);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now);
      o.stop(now + 3.8);
    });
    idx++;
  }
  playChord();
  state._musicTimer = setInterval(playChord, 4000);
}

function stopAmbientMusic() {
  if (state._musicTimer) {
    clearInterval(state._musicTimer);
    state._musicTimer = null;
  }
}

function playSfx(type) {
  if (!state.audio || state.audioMuted) return;
  const ctx = state.audio;
  const now = ctx.currentTime;
  let o, g;
  if (type === 'click') {
    o = ctx.createOscillator();
    g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, now);
    o.frequency.exponentialRampToValueAtTime(220, now + 0.08);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.12);
  } else if (type === 'cross') {
    o = ctx.createOscillator();
    g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(440, now);
    o.frequency.linearRampToValueAtTime(220, now + 0.4);
    g.gain.setValueAtTime(0.06, now);
    g.gain.linearRampToValueAtTime(0, now + 0.4);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.5);
  } else if (type === 'win') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const oo = ctx.createOscillator();
      const gg = ctx.createGain();
      oo.type = 'sine';
      oo.frequency.value = freq;
      gg.gain.setValueAtTime(0, now + i * 0.08);
      gg.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.04);
      gg.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.4);
      oo.connect(gg); gg.connect(ctx.destination);
      oo.start(now + i * 0.08); oo.stop(now + i * 0.08 + 0.5);
    });
  } else if (type === 'error') {
    o = ctx.createOscillator();
    g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(180, now);
    g.gain.setValueAtTime(0.04, now);
    g.gain.linearRampToValueAtTime(0, now + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.25);
  } else if (type === 'hint') {
    o = ctx.createOscillator();
    g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(660, now);
    o.frequency.linearRampToValueAtTime(880, now + 0.2);
    g.gain.setValueAtTime(0.05, now);
    g.gain.linearRampToValueAtTime(0, now + 0.3);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.35);
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state.hintsLeft = (data.hintsLeft !== undefined) ? data.hintsLeft : 3;
      return data;
    }
  } catch(e) {}
  return { cleared: {}, stars: {}, lastLevel: 1, hintsLeft: 3 };
}

function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      state.audioMuted = !!s.audioMuted;
      state.musicMuted = !!s.musicMuted;
    }
  } catch(e) {}
}
function writeSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      audioMuted: state.audioMuted,
      musicMuted: state.musicMuted,
    }));
  } catch(e) {}
}

let saveData = loadSave();
state.hintsLeft = saveData.hintsLeft !== undefined ? saveData.hintsLeft : 3;
loadSettings();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'gameScreen') {
    initAudio();
    startAmbientMusic();
  } else {
    stopAmbientMusic();
  }
}

function showToast(msg, bad = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('bad', bad);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

// Game logic
function isValidBank(pieceSet, constraints) {
  if (pieceSet.length <= 1) return true;
  for (const c of constraints) {
    if (c.every(p => pieceSet.includes(p))) return false;
  }
  return true;
}

function getLeft() {
  return state.pieces.filter(p => p.side === 'L').map(p => p.name);
}
function getRight() {
  return state.pieces.filter(p => p.side === 'R').map(p => p.name);
}

function currentConstraints() {
  return LEVELS[state.currentLevel].constraints;
}
function currentCap() {
  return LEVELS[state.currentLevel].cap;
}

function setupLevel(lvlIdx) {
  const lvl = LEVELS[lvlIdx];
  state.currentLevel = lvlIdx;
  state.pieces = lvl.pieces.map((name, i) => ({ id: 'p' + i, name, side: 'L' }));
  state.boat = [];
  state.boatSide = 'L';
  state.moves = 0;
  state.selected = null;
  state.history = [];
  state.hintsLeft = 3;
  saveData.hintsLeft = 3;
  writeSave(saveData);
  document.getElementById('curLvl').textContent = lvl.id;
  document.getElementById('curTier').textContent = lvl.tier;
  document.getElementById('movesCount').textContent = '0';
  document.getElementById('hintCount').textContent = '3';
  document.getElementById('moveLog').innerHTML = '';
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('scene').classList.remove('solved');
  renderScene();
}

function renderScene() {
  const scene = document.getElementById('scene');
  const boat = document.getElementById('boat');
  const layer = document.getElementById('piecesLayer');
  // Clear pieces layer
  layer.innerHTML = '';
  // Position boat
  if (state.boatSide === 'L') {
    boat.style.left = '32%';
    boat.classList.remove('flip');
  } else {
    boat.style.left = '68%';
    boat.classList.add('flip');
  }
  // Render pieces
  const layout = layoutPieces();
  state.pieces.forEach(p => {
    const el = document.createElement('div');
    el.className = 'piece ' + p.name;
    el.dataset.id = p.id;
    el.textContent = pieceEmoji(p.name);
    // Position
    const pos = layout[p.id];
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.style.zIndex = pos.z || 2;
    if (state.selected === p.id) el.classList.add('selected');
    if (state.boat.includes(p.id)) el.classList.add('in-boat');
    el.addEventListener('click', (e) => { e.stopPropagation(); onPieceClick(p.id); });
    layer.appendChild(el);
  });
  // Render boat contents
  state.boat.forEach((pid, idx) => {
    const p = state.pieces.find(x => x.id === pid);
    if (!p) return;
    const el = document.createElement('div');
    el.className = 'boat-slot piece ' + p.name;
    el.style.left = (10 + idx * 24) + 'px';
    el.textContent = pieceEmoji(p.name);
    el.style.cursor = 'pointer';
    el.style.position = 'absolute';
    el.addEventListener('click', (e) => { e.stopPropagation(); onBoatPieceClick(pid); });
    boat.appendChild(el);
  });
}

function pieceEmoji(name) {
  const m = {
    wolf: '🐺', goat: '🐐', cabbage: '🥬',
    fox: '🦊', chicken: '🐔', grain: '🌾',
    cat: '🐱', mouse: '🐭', cheese: '🧀',
    dog: '🐕', fish: '🐟', snake: '🐍',
    frog: '🐸', fly: '🪰', hawk: '🦅',
    rabbit: '🐰', carrot: '🥕', sheep: '🐑',
    owl: '🦉', parrot: '🦜', duck: '🦆',
    hen: '🐓',
  };
  return m[name] || name[0].toUpperCase();
}

function layoutPieces() {
  // Layout pieces on banks and in the boat
  const layout = {};
  const sceneW = document.getElementById('scene').clientWidth;
  const sceneH = 340;
  const leftBankX = 10;
  const rightBankX = sceneW - 50;
  const bankTopY = 60;
  const boatY = 170;
  // Pieces on left
  const left = state.pieces.filter(p => p.side === 'L' && !state.boat.includes(p.id));
  left.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    layout[p.id] = {
      x: leftBankX + col * 44,
      y: bankTopY + row * 44,
      z: 2,
    };
  });
  // Pieces on right
  const right = state.pieces.filter(p => p.side === 'R' && !state.boat.includes(p.id));
  right.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    layout[p.id] = {
      x: rightBankX - col * 44,
      y: bankTopY + row * 44,
      z: 2,
    };
  });
  // Pieces in boat — position them on top of the boat (relative to scene)
  // Boat is centered at left:32% (L) or left:68% (R) with width 90px, so we
  // anchor the slot at scene-relative center.
  const boatCenterX = state.boatSide === 'L' ? sceneW * 0.32 : sceneW * 0.68;
  const boatLeftX = boatCenterX - 35; // boat width 90, half minus slot width/2
  const boatYPos = 153; // boat top minus a bit
  state.boat.forEach((pid, idx) => {
    layout[pid] = {
      x: boatLeftX + idx * 24,
      y: boatYPos,
      z: 5,
    };
  });
  return layout;
}

function onPieceClick(pid) {
  initAudio();
  const p = state.pieces.find(x => x.id === pid);
  if (!p) return;
  // Only allow piece selection on the same side as the boat
  if (p.side !== state.boatSide) {
    showToast('Piece is on the other bank', true);
    playSfx('error');
    return;
  }
  if (state.boat.includes(pid)) {
    // Already in boat — move out
    state.boat = state.boat.filter(x => x !== pid);
    state.selected = null;
    playSfx('click');
  } else {
    // Add to boat (up to cap)
    const cap = currentCap();
    if (state.boat.length >= cap) {
      showToast(`Boat holds only ${cap}`, true);
      playSfx('error');
      return;
    }
    state.boat.push(pid);
    state.selected = pid;
    playSfx('click');
  }
  renderScene();
}

function onBoatPieceClick(pid) {
  state.boat = state.boat.filter(x => x !== pid);
  state.selected = null;
  playSfx('click');
  renderScene();
}

function onGo() {
  initAudio();
  const cap = currentCap();
  // Allow empty boat (boatman alone) too — needed to cross back without a piece.
  // Save history
  state.history.push({
    boatSide: state.boatSide,
    boat: [...state.boat],
    pieces: state.pieces.map(p => ({ id: p.id, name: p.name, side: p.side })),
    moves: state.moves,
  });
  // Cross: switch boat side, move pieces
  const newSide = state.boatSide === 'L' ? 'R' : 'L';
  state.boat.forEach(pid => {
    const p = state.pieces.find(x => x.id === pid);
    p.side = newSide;
  });
  state.boatSide = newSide;
  state.boat = [];
  state.selected = null;
  state.moves++;
  // Check validity: the OPPOSITE bank (now alone) must be valid
  const aloneSide = newSide === 'L' ? 'R' : 'L';
  const alonePieces = state.pieces.filter(p => p.side === aloneSide).map(p => p.name);
  const constraints = currentConstraints();
  if (!isValidBank(alonePieces, constraints)) {
    // Invalid move — undo
    setTimeout(() => {
      showToast('That leaves a forbidden pair alone! Undoing...', true);
      playSfx('error');
      const last = state.history.pop();
      state.pieces = last.pieces.map(p => ({ ...p }));
      state.boat = last.boat;
      state.boatSide = last.boatSide;
      state.moves = last.moves;
      renderScene();
      updateUI();
    }, 350);
    return;
  }
  playSfx('cross');
  updateUI();
  renderScene();
  // Check win
  if (state.pieces.every(p => p.side === 'R')) {
    setTimeout(() => onWin(), 700);
  }
}

function onUndo() {
  if (state.history.length === 0) {
    showToast('Nothing to undo', true);
    return;
  }
  const last = state.history.pop();
  state.pieces = last.pieces.map(p => ({ ...p }));
  state.boat = last.boat;
  state.boatSide = last.boatSide;
  state.moves = last.moves;
  playSfx('click');
  renderScene();
  updateUI();
}

function onRestart() {
  if (state.moves > 0) {
    if (!confirm('Restart this level? Moves and history will be lost.')) return;
  }
  setupLevel(state.currentLevel);
  playSfx('click');
}

function showHint() {
  if (state.hintsLeft <= 0) {
    showToast('No hints left', true);
    return;
  }
  // Find a valid next-move piece suggestion
  const cap = currentCap();
  const lvl = LEVELS[state.currentLevel];
  const bank = state.pieces.filter(p => p.side === state.boatSide);
  // Greedy: try the canonical next move from the recorded solution
  const canonical = lvl.moves;
  if (state.moves < canonical.length) {
    const nextMove = canonical[state.moves];
    const carried = nextMove[1];
    if (carried.length > 0) {
      const targetName = carried[0];
      const target = state.pieces.find(p => p.name === targetName);
      if (target && target.side === state.boatSide) {
        if (!state.boat.includes(target.id)) {
          if (state.boat.length < cap) {
            state.boat.push(target.id);
            state.selected = target.id;
            state.hintsLeft--;
            saveData.hintsLeft = state.hintsLeft;
            writeSave(saveData);
            playSfx('hint');
            renderScene();
            updateUI();
            showToast(`Hint: take ${pieceEmoji(targetName)} across`);
            return;
          }
        }
      }
    }
  }
  showToast('No canonical hint — try any valid piece', true);
}

function onWin() {
  playSfx('win');
  document.getElementById('scene').classList.add('solved');
  const lvl = LEVELS[state.currentLevel];
  const optimal = lvl.n_moves;
  const used = state.moves;
  let stars = 1;
  if (used <= optimal) stars = 3;
  else if (used <= optimal + 2) stars = 2;
  saveData.cleared = saveData.cleared || {};
  saveData.cleared[lvl.id] = true;
  saveData.stars = saveData.stars || {};
  const prev = saveData.stars[lvl.id] || 0;
  saveData.stars[lvl.id] = Math.max(prev, stars);
  saveData.lastLevel = Math.max(saveData.lastLevel || 0, lvl.id + 1);
  writeSave(saveData);
  document.getElementById('winStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('winMsg').textContent =
    `Level ${lvl.id} cleared in ${used} moves (optimal: ${optimal}).`;
  document.getElementById('winOverlay').classList.add('show');
  document.getElementById('winNextBtn').textContent =
    (state.currentLevel < LEVELS.length - 1) ? 'Next →' : '✓ Done';
}

function updateUI() {
  document.getElementById('movesCount').textContent = state.moves;
  document.getElementById('hintCount').textContent = state.hintsLeft;
  const lvl = LEVELS[state.currentLevel];
  const total = state.pieces.length;
  const moved = state.pieces.filter(p => p.side === 'R').length;
  const pct = (moved / total) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  // Move log
  const log = document.getElementById('moveLog');
  log.innerHTML = '';
  state.history.forEach((h, i) => {
    const div = document.createElement('div');
    div.className = 'm';
    const fromTo = h.boatSide === 'L' ? 'L→R' : 'R→L';
    const carried = h.boat.length > 0 ? h.boat.map(pid => pieceEmoji(state.pieces.find(p => p.id === pid).name)).join('') : '∅';
    div.textContent = `#${i + 1} ${fromTo} ${carried}`;
    log.appendChild(div);
  });
  if (state.history.length > 0) log.scrollTop = log.scrollHeight;
}

function buildLevelGrid() {
  const grid = document.getElementById('lsGrid');
  grid.innerHTML = '';
  const tiers = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  tiers.forEach(tier => {
    const tierLevels = LEVELS.filter(l => l.tier === tier);
    if (tierLevels.length === 0) return;
    const grp = document.createElement('div');
    grp.className = 'tier-group';
    const hdr = document.createElement('div');
    hdr.className = 'tier-header';
    hdr.textContent = tier;
    grp.appendChild(hdr);
    const inner = document.createElement('div');
    inner.className = 'level-grid';
    tierLevels.forEach(lvl => {
      const btn = document.createElement('div');
      btn.className = 'lvl';
      const cleared = saveData.cleared && saveData.cleared[lvl.id];
      if (cleared) btn.classList.add('cleared');
      btn.textContent = lvl.id;
      const starsEl = document.createElement('div');
      starsEl.className = 'lvl-stars';
      const stars = (saveData.stars && saveData.stars[lvl.id]) || 0;
      starsEl.textContent = stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
      btn.appendChild(starsEl);
      btn.addEventListener('click', () => {
        initAudio();
        playSfx('click');
        setupLevel(lvl.id - 1);
        showScreen('gameScreen');
      });
      inner.appendChild(btn);
    });
    grp.appendChild(inner);
    grid.appendChild(grp);
  });
  const total = Object.keys(saveData.cleared || {}).length;
  document.getElementById('lsProgress').textContent = `${total} / ${LEVELS.length} cleared`;
}

// Event handlers
document.getElementById('playBtn').addEventListener('click', () => {
  initAudio();
  playSfx('click');
  buildLevelGrid();
  showScreen('levelSelect');
});
document.getElementById('helpBtn').addEventListener('click', () => {
  playSfx('click');
  showScreen('helpScreen');
});
document.getElementById('helpBackBtn').addEventListener('click', () => {
  showScreen('titleScreen');
});
document.getElementById('lsBackBtn').addEventListener('click', () => {
  showScreen('titleScreen');
});
document.getElementById('btnMenu').addEventListener('click', () => {
  if (!confirm('Return to level select? Your progress is saved.')) return;
  buildLevelGrid();
  showScreen('levelSelect');
});
document.getElementById('btnGo').addEventListener('click', onGo);
document.getElementById('btnUndo').addEventListener('click', onUndo);
document.getElementById('btnRestart').addEventListener('click', onRestart);
document.getElementById('btnHint').addEventListener('click', showHint);
document.getElementById('winNextBtn').addEventListener('click', () => {
  document.getElementById('winOverlay').classList.remove('show');
  if (state.currentLevel < LEVELS.length - 1) {
    setupLevel(state.currentLevel + 1);
    showScreen('gameScreen');
  } else {
    buildLevelGrid();
    showScreen('levelSelect');
  }
});
document.getElementById('winReplayBtn').addEventListener('click', () => {
  document.getElementById('winOverlay').classList.remove('show');
  setupLevel(state.currentLevel);
  showScreen('gameScreen');
});
document.getElementById('winLevelsBtn').addEventListener('click', () => {
  document.getElementById('winOverlay').classList.remove('show');
  buildLevelGrid();
  showScreen('levelSelect');
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (document.getElementById('gameScreen').classList.contains('active')) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGo(); }
    else if (e.key === 'u' || e.key === 'U') onUndo();
    else if (e.key === 'r' || e.key === 'R') onRestart();
    else if (e.key === 'h' || e.key === 'H') showHint();
    else if (e.key === 'Escape') { buildLevelGrid(); showScreen('levelSelect'); }
  } else if (document.getElementById('titleScreen').classList.contains('active')) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('playBtn').click(); }
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  stopAmbientMusic();
  if (state.audio && state.audio.state !== 'closed') {
    try { state.audio.close(); } catch(e) {}
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAmbientMusic();
  else if (document.getElementById('gameScreen').classList.contains('active')) startAmbientMusic();
});

// Save/load hooks for gz-analytics etc.
window.gzGameReady = true;
</script>
</div>
</body>
</html>
'''


def main():
    html = TEMPLATE.replace("__LEVELS__", LEVELS_INLINE)
    out = HERE / "index.html"
    out.write_text(html)
    print(f"Wrote {out} ({len(html)} bytes, {len(LEVELS)} levels)")


if __name__ == "__main__":
    main()
