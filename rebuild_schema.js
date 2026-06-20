const fs = require('fs');
let content = fs.readFileSync('js/games-data.js', 'utf8');
content = content.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
const arrayStart = content.indexOf('"GAMES" : [') + 10;
const arrayEnd = content.indexOf('];', arrayStart);
const arrayContent = content.substring(arrayStart, arrayEnd);
const games = JSON.parse(arrayContent);
console.log(`Parsed ${games.length} games`);

const itemListElement = games.map((g, i) => {
  const slug = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `{"@type":"ListItem","position":${i+1},"url":"https://gamezipper.com/${slug}/","name":"${g.name.replace(/"/g, '\\"')}"}`;
}).join(',');

const schema = `const ITEMLIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "GameZipper Free HTML5 Games",
  "itemListElement": [
    ${itemListElement}
  ],
  "numberOfItems": ${games.length},
  "description": "${games.length} free browser games you can play instantly"
};`;
fs.writeFileSync('js/itemlist-schema.js', schema);
console.log(`Wrote schema with ${games.length} items`);
