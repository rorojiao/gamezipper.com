// Phase 7: Comprehensive QA Checklist (40-point)
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/antikythera-mechanism/index.html', 'utf8');

const checks = [
  // === Level data ===
  ["30 LEVELS", JSON.parse(html.match(/var LEVELS=(\[.*?\]);/)[1]).length === 30],
  ["Par values", (html.match(/"p":\d+/g) || []).length === 30],
  
  // === Core features ===
  ["Game state object", html.includes("var state=")],
  ["Level loading", html.includes("loadLevel")],
  ["Win condition", html.includes("checkWin")],
  ["Crank turning", html.includes("turnCrank")],
  ["Star rating", html.includes("stars")],
  ["Level select", html.includes("showLevelSelect")],
  
  // === UI/UX ===
  ["Menu screen", html.includes("menu-screen")],
  ["Help modal", html.includes("help-modal") || html.includes("How to Play")],
  ["Sound toggle", html.includes("toggleSound")],
  ["Music toggle", html.includes("toggleMusic")],
  ["Progress save", html.includes("localStorage")],
  
  // === Technical ===
  ["Canvas rendering", html.includes("getContext")],
  ["requestAnimationFrame", html.includes("requestAnimationFrame")],
  ["Pointer events", html.includes("onclick") || html.includes("pointer")],
  ["Touch action CSS", html.includes("touch-action")],
  ["Responsive", html.includes("resize") || html.includes("innerWidth")],
  ["Delta time", html.includes("dt")],
  
  // === Audio ===
  ["AudioContext", html.includes("AudioContext")],
  ["Sound effects", html.includes("playTone")],
  ["BGM function", html.includes("startBGM") && html.includes("stopBGM")],
  
  // === SEO & Structured Data ===
  ["Analytics", html.includes("monetag-manager.js")],
  ["JSON-LD VideoGame", html.includes("VideoGame")],
  ["JSON-LD FAQPage", html.includes("FAQPage")],
  ["JSON-LD HowTo", html.includes("HowTo")],
  ["JSON-LD BreadcrumbList", html.includes("BreadcrumbList")],
  ["OG tags", html.includes("og:title")],
  ["OG image", html.includes("og:image")],
  ["Canonical URL", html.includes("canonical")],
  ["Twitter card", html.includes("twitter:card")],
  ["Meta description", html.includes('name="description"')],
  ["Meta keywords", html.includes('name="keywords"')],
  
  // === Code Quality ===
  ["Cleanup function", html.includes("function cleanup")],
  ["cancelAnimationFrame", html.includes("cancelAnimationFrame")],
  ["beforeunload", html.includes("beforeunload")],
  ["visibilitychange", html.includes("visibilitychange")],
  ["No -webkit-text-stroke", !html.includes("-webkit-text-stroke")],
  
  // === Structure ===
  ["DOCTYPE", html.includes("<!DOCTYPE html>")],
  ["HTML close tag", html.includes("</html>")],
  ["File size > 25KB", html.length > 25000],
  ["Game footer", html.includes("game-footer.js")],
];

let pass = 0, fail = 0;
const failures = [];
checks.forEach(function(c) {
  var status = c[1] ? "OK" : "FAIL";
  console.log(status + " " + c[0]);
  if (c[1]) pass++; else { fail++; failures.push(c[0]); }
});
console.log("\n" + pass + "/" + checks.length + " passed" + (fail ? " (" + fail + " failed)" : ""));
if (failures.length) console.log("FAILED: " + failures.join(", "));

// === Additional checks ===
console.log("\n=== Additional Checks ===");

// No Chinese in game content
const chineseChars = (html.match(/[\u4e00-\u9fff]/g) || []);
console.log((chineseChars.length === 0 ? "OK" : "FAIL") + " No Chinese characters (" + chineseChars.length + " found)");

// No emoji in canvas/game code
const gameScript = html.match(/<script>([\s\S]*?)<\/script>/g);
let emojiCount = 0;
gameScript && gameScript.forEach(function(s) {
  var code = s.replace(/<\/?script[^>]*>/g, '');
  var matches = code.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
  if (matches) emojiCount += matches.length;
});
console.log((emojiCount === 0 ? "OK" : "FAIL") + " No emoji in game code (" + emojiCount + " found)");

// Check for setInterval leaks
const setIntervalCount = (html.match(/setInterval/g) || []).length;
const clearIntervalCount = (html.match(/clearInterval/g) || []).length;
console.log((setIntervalCount === 0 || clearIntervalCount > 0 ? "OK" : "WARN") + " setInterval(" + setIntervalCount + ") / clearInterval(" + clearIntervalCount + ")");

// All script blocks syntax
console.log("\n=== JS Syntax Check ===");
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
blocks && blocks.forEach(function(block, i) {
  var code = block.replace(/<\/?script[^>]*>/g, '');
  if (code.length === 0) return;
  if (block.includes('application/ld+json')) return; // Skip JSON-LD
  try {
    new Function(code);
    console.log("Script " + (i+1) + " (" + code.length + " chars): SYNTAX OK");
  } catch(e) {
    console.log("Script " + (i+1) + " (" + code.length + " chars): SYNTAX ERROR - " + e.message);
  }
});
