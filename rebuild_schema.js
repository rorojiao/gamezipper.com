const fs = require('fs');
const vm = require('vm');
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
console.log(`Parsed ${games.length} games (total)`);
const liveGames = games.filter(g => g && g.url && g.status === 'live');
console.log(`Live games: ${liveGames.length}`);
const itemListElement = liveGames.map((g, i) => {
  const url = g.url.replace(/^\//, '').replace(/\/$/, '');
  const name = String(g.name).replace(/"/g, '\\"');
  return `{"@type":"ListItem","position":${i + 1},"url":"https://gamezipper.com/${url}/","name":"${name}"}`;
}).join(',\n    ');
const schema = `const ITEMLIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "GameZipper Free HTML5 Games",
  "itemListElement": [
    ${itemListElement}
  ],
  "numberOfItems":${liveGames.length},
  "description":"${liveGames.length} free browser games you can play instantly"
};\n`;
fs.writeFileSync('js/itemlist-schema.js', schema);
console.log(`Wrote js/itemlist-schema.js with ${liveGames.length} items`);
