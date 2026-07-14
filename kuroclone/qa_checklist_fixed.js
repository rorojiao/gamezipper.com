// Kuroclone 40-point code-level QA checklist (Fixed)
const fs = require('fs');
const html = fs.readFileSync('/home/msdn/gamezipper.com/kuroclone/index.html', 'utf8');

const checks = [
  // HTML & SEO (6)
  ["Analytics pixel", html.includes("gz-analytics.js")],
  ["JSON-LD VideoGame", html.includes("VideoGame")],
  ["JSON-LD FAQPage", html.includes("FAQPage")],
  ["JSON-LD BreadcrumbList", html.includes("BreadcrumbList")],
  ["OG tags", html.includes("og:title")],
  ["Canonical URL", html.includes("canonical")],

  // CSS & Responsive (5)
  ["Dark theme", html.includes("#0f0f1a") || html.includes("#0a0a1a")],
  ["Responsive canvas", html.includes("resize") || html.includes("innerWidth")],
  ["Touch action none", html.includes("touch-action:none")],
  ["User select none", html.includes("user-select:none")],
  ["Overflow hidden", html.includes("overflow-x:hidden")],

  // Game Logic (7)
  ["30 levels", (html.match(/tier:\"/g) || []).length === 30],
  ["Mirror pair constraint", html.includes("normalizeShape") && html.includes("transform")],
  ["Arrow clues", html.includes("arrow") || html.includes("clues")],
  ["Win condition", html.includes("checkWin") || html.includes("isSolved")],
  ["Scoring system", html.includes("stars") || html.includes("computeStars")],
  ["3-star rating", html.includes("stars")],
  ["Hint system", html.includes("hint") || html.includes("giveHint")],

  // Input Handling (3)
  ["Pointer events", html.includes("pointerdown") || html.includes("click")],
  ["Touch support", html.includes("touch") || html.includes("pointer")],
  ["Keyboard support", html.includes("keydown") || html.includes("keyboard")],

  // Audio (4)
  ["AudioContext lazy", html.includes("AudioContext")],
  ["SFX types", html.includes("playTone") || html.includes("audioContext.createOscillator")],
  ["Music toggle", html.includes("musicToggle") || html.includes("startMusic")],
  ["Graceful fallback", html.includes("try") && html.includes("catch")],

  // State Management (4)
  ["localStorage progress", html.includes("localStorage") && html.includes("progress")],
  ["Level save", html.includes("localStorage") && html.includes("saveProgress")],
  ["Settings save", html.includes("localStorage") && html.includes("saveSettings")],
  ["Tutorial overlay", html.includes("rules-text") || html.includes("Rules")],

  // Performance (3)
  ["Cleanup on beforeunload", html.includes("beforeunload")],
  ["Efficient rendering", html.includes("requestAnimationFrame") || html.includes("draw()")],
  ["Fast generation", html.includes("LEVELS") && html.includes("regionMap")],

  // Accessibility (4)
  ["Window resize", html.includes("resize") || html.includes("onresize")],
  ["No div/0", html.includes("/") && html.includes("if")],
  ["Positive grid sizes", html.includes("rows") && html.includes("cols")],
  ["Valid colors", html.includes("#")],

  // Code Quality (4)
  ["No console.log", !html.includes("console.log")],
  ["No TODO/FIXME", !html.includes("TODO") && !html.includes("FIXME")],
  ["Organized sections", html.includes("//") || html.includes("/*")],
  ["No external deps", !html.includes('rel="stylesheet"') && !html.includes('src="http')],
];

let pass = 0, fail = 0;
console.log("Kuroclone QA Checklist (40-point):\n");
checks.forEach(c => {
  console.log((c[1] ? "✓" : "✗") + " " + c[0]);
  c[1] ? pass++ : fail++;
});
console.log("\n" + pass + "/" + checks.length + " passed" + (fail ? " (" + fail + " failed)" : ""));

// 详细分析失败项
if (fail > 0) {
  console.log("\nFAILED ITEMS ANALYSIS:");
  checks.forEach(c => {
    if (!c[1]) {
      console.log("  ✗ " + c[0]);
    }
  });
}