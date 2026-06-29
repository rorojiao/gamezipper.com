const fs = require('fs');
const vm = require('vm');

// Robustly load GAMES from js/games-data.js by evaluating it in a sandbox.
// (The previous regex-based key-quoting approach corrupted comment text and
// already-quoted keys; evaluating the real JS is reliable.)
let code = fs.readFileSync('js/games-data.js', 'utf8');
code = code.replace(/^const GAMES/m, 'globalThis.GAMES');
const sandbox = { globalThis: {}, console: console };
Object.assign(sandbox, sandbox.globalThis);
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const games = sandbox.GAMES || sandbox.globalThis.GAMES;

if (!games || !games.length) {
  console.error('Failed to load GAMES from js/games-data.js');
  process.exit(1);
}
console.log(`Parsed ${games.length} games`);

// Use each game's canonical url field (already a /slug/ path), not a
// re-derived slug, so the schema URLs exactly match the live routes.
const itemListElement = games.map((g, i) => {
  const url = g.url.replace(/^\//, '').replace(/\/$/, ''); // "slug"
  const name = g.name.replace(/"/g, '\\"');
  return `{"@type":"ListItem","position":${i + 1},"url":"https://gamezipper.com/${url}/","name":"${name}"}`;
}).join(',\n    ');

const schema = `const ITEMLIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "GameZipper Free HTML5 Games",
  "itemListElement": [
    ${itemListElement}
  ],
  "numberOfItems":${games.length},
  "description":"${games.length} free browser games you can play instantly"
};`;

fs.writeFileSync('js/itemlist-schema.js', schema);
console.log(`Wrote js/itemlist-schema.js with ${games.length} items`);
