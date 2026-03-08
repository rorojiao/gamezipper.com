(function(){
  var games = [
    {n:'2048',e:'🔢',u:'/2048/'},{n:'Snake',e:'🐍',u:'/snake/'},
    {n:'Flappy Wings',e:'🐦',u:'/flappy-wings/'},{n:'Color Sort',e:'🎨',u:'/color-sort/'},
    {n:'Word Puzzle',e:'📝',u:'/word-puzzle/'},{n:'Whack-a-Mole',e:'🔨',u:'/whack-a-mole/'},
    {n:'Memory Match',e:'🧠',u:'/memory-match/'},{n:'Sushi Stack',e:'🍣',u:'/sushi-stack/'},
    {n:'Ocean Gem Pop',e:'💎',u:'/ocean-gem-pop/'},{n:'Typing Speed',e:'⌨️',u:'/typing-speed/'},
    {n:'Brick Breaker',e:'🧱',u:'/brick-breaker/'},{n:'Dessert Blast',e:'🍰',u:'/dessert-blast/'},
    {n:'Catch Turkey',e:'🦃',u:'/catch-turkey/'},{n:'Paint Splash',e:'🎨',u:'/paint-splash/'},
    {n:'Phantom Blade',e:'⚔️',u:'/phantom-blade/'},{n:'Kitty Cafe',e:'🐱',u:'/kitty-cafe/'},
    {n:'Idle Clicker',e:'👆',u:'/idle-clicker/'},{n:'Stacker',e:'📦',u:'/stacker/'},
    {n:'Wood Block',e:'🪵',u:'/wood-block-puzzle/'},{n:'Bolt Jam 3D',e:'🔩',u:'/bolt-jam-3d/'},
    {n:'Mo Yu Fayu',e:'🐟',u:'/mo-yu-fayu/'}
  ];
  var cur = location.pathname;
  var others = games.filter(function(g){return g.u!==cur;});
  // Shuffle and take 6
  others.sort(function(){return 0.5-Math.random();});
  var pick = others.slice(0,6);
  
  var d = document.createElement('div');
  d.id = 'game-footer';
  d.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,26,0.95);padding:8px 12px;z-index:99998;border-top:1px solid #333;display:none';
  
  var h = '<div style="display:flex;align-items:center;gap:8px;overflow-x:auto;white-space:nowrap">';
  h += '<span style="color:#4ecdc4;font-size:11px;font-family:sans-serif;flex-shrink:0">More Games:</span>';
  for(var i=0;i<pick.length;i++){
    h += '<a href="'+pick[i].u+'" style="display:inline-flex;align-items:center;gap:4px;background:#1a1a3e;padding:4px 10px;border-radius:12px;text-decoration:none;color:#fff;font-size:11px;font-family:sans-serif;flex-shrink:0">'+pick[i].e+' '+pick[i].n+'</a>';
  }
  h += '<a href="/" style="display:inline-flex;align-items:center;gap:4px;background:#4ecdc4;padding:4px 10px;border-radius:12px;text-decoration:none;color:#000;font-size:11px;font-family:sans-serif;font-weight:600;flex-shrink:0">🎮 All Games</a>';
  h += '</div>';
  d.innerHTML = h;
  document.body.appendChild(d);
  
  // 延迟3秒显示（不打扰首次体验）
  setTimeout(function(){ d.style.display='block'; }, 3000);
})();
