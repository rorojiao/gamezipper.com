const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");

// Extract script content
const scriptMatch = html.match(/<script>([\s\S]+?)<\/script>/);
if (!scriptMatch) { console.log("ERROR: No script block found"); process.exit(1); }
const script = scriptMatch[1];

// Count levels by looking for level name definitions
const levelPattern = /\{\s*name:\s*["']([^"']+)["']/g;
let match;
const levels = [];
while ((match = levelPattern.exec(script)) !== null) {
    levels.push(match[1]);
}

console.log("Total levels found: " + levels.length);
levels.forEach((l, i) => console.log("  " + (i+1) + ". " + l));

// Check for obstacle data
const obstacleTypes = ['block', 'spike', 'pillar', 'portal', 'orb', 'moving'];
obstacleTypes.forEach(t => {
    const re = new RegExp("type:\\s*['\"]" + t + "['\"]", "g");
    const count = (script.match(re) || []).length;
    if (count > 0) console.log("  Obstacle '" + t + "': " + count + " instances");
});

// Check game modes
console.log("\nGame modes present:");
['cube', 'ship', 'ball', 'wave'].forEach(mode => {
    console.log("  " + mode + ": " + script.includes("'" + mode + "'"));
});

// Check key features
console.log("\nKey features:");
const features = {
    "Canvas": "getContext",
    "requestAnimationFrame": "requestAnimationFrame",
    "cancelAnimationFrame": "cancelAnimationFrame",
    "localStorage": "localStorage",
    "touchstart": "touchstart",
    "touchend": "touchend",
    "Practice mode": "practice",
    "Star rating": "star",
    "CustomEvent": "CustomEvent",
    "AudioContext": "AudioContext",
    "beforeunload": "beforeunload",
    "monetag-manager.js": "monetag-manager.js",
    "site-analytics": "site-analytics",
    "Particle effects": "particle",
    "Screen shake": "shake",
    "Tutorial": "tutorial",
    "responsive": "resize",
};
Object.entries(features).forEach(([name, keyword]) => {
    console.log("  " + name + ": " + script.includes(keyword));
});

// Check title
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
console.log("\nTitle: " + (titleMatch ? titleMatch[1] : "NOT FOUND"));

// Check monetag events
const gameoverEvents = (script.match(/CustomEvent.*gameover/g) || []).length;
const levelCompleteEvents = (script.match(/CustomEvent.*level-complete/g) || []).length;
console.log("Monetag gameover events: " + gameoverEvents);
console.log("Monetag level-complete events: " + levelCompleteEvents);

// Check analytics domain
const hasCorrectAnalytics = html.includes("site-analytics.cap.1ktower.com");
const hasWrongAnalytics = html.includes("site-analytics.gamezipper.com");
console.log("\nAnalytics correct domain (cap.1ktower.com): " + hasCorrectAnalytics);
console.log("Analytics wrong domain (gamezipper.com): " + hasWrongAnalytics);

// File size
console.log("\nFile size: " + (html.length / 1024).toFixed(1) + " KB");
