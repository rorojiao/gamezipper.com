// Phase 7: Comprehensive QA Checklist for Tile Paint
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/tile-paint/index.html', 'utf8');

const checks = [
  // Level data
  ["30 LEVELS in array", (html.match(/"rows":\d+,"cols":\d+/g) || []).length === 30],
  ["Solution arrays present", (html.match(/"solution":\[/g) || []).length === 30],
  ["rowClues present", (html.match(/"rowClues":\[/g) || []).length === 30],
  ["colClues present", (html.match(/"colClues":\[/g) || []).length === 30],

  // Core features
  ["Canvas rendering", html.includes("getContext")],
  ["Toggle cell logic", html.includes("state.marks[r][c]")],
  ["Win check function", html.includes("checkWin()")],
  ["Hint system", html.includes("useHint()")],
  ["Undo system", html.includes("undoMove()")],
  ["Restart level", html.includes("restartLevel()")],
  ["Star rating system", html.includes("stars")],
  ["Level select", html.includes("showLevelSelect")],
  ["Timer", html.includes("startTimer")],
  ["Mistakes tracking", html.includes("mistakes")],

  // UI/UX
  ["How To modal", html.includes("showHowTo")],
  ["Settings modal", html.includes("showSettings")],
  ["Sound toggle", html.includes("toggleSound")],
  ["Music toggle", html.includes("toggleMusic")],
  ["Error toggle", html.includes("toggleErrors")],
  ["Progress save", html.includes("localStorage")],
  ["Win overlay", html.includes("win-overlay")],
  ["Confetti on win", html.includes("spawnConfetti")],

  // Input
  ["Pointer events", html.includes("pointerdown")],
  ["Touch events", html.includes("touchstart")],
  ["Touch action CSS", html.includes("touch-action")],
  ["Keyboard support", html.includes("addEventListener('keydown'")],

  // Responsive
  ["Resize handler", html.includes("addEventListener('resize'")],
  ["Canvas resize function", html.includes("resizeCanvas")],
  ["Device pixel ratio", html.includes("devicePixelRatio")],

  // Audio
  ["AudioContext", html.includes("AudioContext")],
  ["playTone function", html.includes("playTone(")],
  ["Win sound", html.includes("playWinSound()")],
  ["BGM start", html.includes("startBGM()")],
  ["BGM stop", html.includes("stopBGM()")],

  // SEO & structured data
  ["Analytics pixel", html.includes("gz-analytics")],
  ["Monetag manager", html.includes("monetag-manager")],
  ["Game footer", html.includes("game-footer")],
  ["Ad below game", html.includes("gz-ad-below-game")],
  ["JSON-LD VideoGame", html.includes('"@type":"VideoGame"')],
  ["JSON-LD FAQPage", html.includes('"@type":"FAQPage"')],
  ["JSON-LD HowTo", html.includes('"@type":"HowTo"')],
  ["JSON-LD BreadcrumbList", html.includes('"@type":"BreadcrumbList"')],
  ["OG title", html.includes("og:title")],
  ["OG image", html.includes("og:image")],
  ["Canonical URL", html.includes("canonical")],
  ["Twitter card", html.includes("twitter:card")],
  ["Theme color", html.includes("theme-color")],
  ["Home link", html.includes('href="/"')],

  // Code quality
  ["Cleanup function (beforeunload)", html.includes("beforeunload")],
  ["visibilitychange handler", html.includes("visibilitychange")],
  ["AudioContext close on unload", html.includes("audioCtx.close")],
  ["No -webkit-text-stroke", !html.includes("-webkit-text-stroke")],
  ["Dark theme background", html.includes("#0d1b2a")],
  ["user-select none", html.includes("user-select:none")],
  ["overflow-x hidden", html.includes("overflow-x:hidden")],
  ["Single file (DOCTYPE)", html.includes("<!DOCTYPE html>")],
  ["Closes with </html>", html.trim().endsWith("</html>")],

  // File size
  ["File size > 30KB", html.length > 30000],
  ["File size < 60KB", html.length < 60000],
];

let pass = 0, fail = 0;
const failures = [];
checks.forEach(function(c) {
  const ok = typeof c[1] === 'function' ? c[1]() : c[1];
  console.log((ok ? "OK   " : "FAIL ") + c[0]);
  if (ok) pass++; else { fail++; failures.push(c[0]); }
});
console.log("\n" + pass + "/" + checks.length + " passed" + (fail ? " (" + fail + " failed)" : ""));
if (failures.length) {
  console.log("\nFailed checks:");
  failures.forEach(f => console.log("  - " + f));
}

// No Chinese characters check
const chineseChars = html.match(/[\u4e00-\u9fff]/g) || [];
console.log("\nChinese chars: " + chineseChars.length + (chineseChars.length > 0 ? " CONTENT: " + chineseChars.join("") : ""));

// No emoji in canvas (check for fillText with emoji)
const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{1F000}-\u{1F2FF}\u{1FA70}-\u{1FAFF}]/u;
const hasEmoji = emojiPattern.test(html);
console.log("Emoji in code: " + (hasEmoji ? "YES (check needed)" : "NONE"));

// Level data validation
const levelMatch = html.match(/var LEVELS=(\[.*?\]);/s);
if (levelMatch) {
  try {
    const levels = JSON.parse(levelMatch[1]);
    console.log("\nLevel data: " + levels.length + " levels parsed OK");
    // Check tier distribution
    for (let t = 0; t < 5; t++) {
      const tierLevels = levels.slice(t*6, (t+1)*6);
      console.log("  Tier " + (t+1) + ": " + tierLevels.length + " levels, sizes: " +
        tierLevels.map(l => l.rows + "x" + l.cols).join(", "));
    }
  } catch(e) {
    console.log("Level data parse ERROR: " + e.message);
  }
}

// JS syntax check (extract main script block)
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (scripts) {
  let mainScript = '';
  scripts.forEach(s => {
    const code = s.replace(/<\/?script>/g, '');
    if (code.length > mainScript.length) mainScript = code;
  });
  try {
    new Function(mainScript);
    console.log("JS Syntax: OK (" + Math.round(mainScript.length/1024) + "KB)");
  } catch(e) {
    console.log("JS Syntax ERROR: " + e.message);
  }
}

// JSON-LD validation
const jsonLdBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
console.log("\nJSON-LD blocks: " + jsonLdBlocks.length);
jsonLdBlocks.forEach((block, i) => {
  const json = block.replace(/<\/?script[^>]*>/g, '');
  try {
    JSON.parse(json);
    console.log("  Block " + (i+1) + ": Valid JSON");
  } catch(e) {
    console.log("  Block " + (i+1) + ": INVALID - " + e.message);
  }
});
