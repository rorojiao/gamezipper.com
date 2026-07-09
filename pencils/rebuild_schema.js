// Rebuild itemlist-schema.js from games-data.js using vm.runInContext
const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('js/games-data.js', 'utf8').replace(/localStorage\.getItem/g, '(()=>null)');
code = code.replace(/^const GAMES/m, 'globalThis.GAMES');

const ctx = { globalThis: {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx);

const games = ctx.GAMES || ctx.globalThis.GAMES;
const live = games.filter(g => g.status === 'live');

const items = live.map((g, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": "https://gamezipper.com" + g.url,
    "name": g.name
}));

const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "GameZipper - Free Online Browser Games",
    "numberOfItems": live.length,
    "itemListElement": items
};

const output = 'const ITEMLIST_SCHEMA = ' + JSON.stringify(schema, null, 0) + ';\n';
fs.writeFileSync('js/itemlist-schema.js', output);
console.log('numberOfItems=' + live.length + ' items=' + items.length);
