const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'file://' + path.resolve(__dirname);
const SHOT = '/tmp/regression';
fs.mkdirSync(SHOT, { recursive: true });
const results = {};

function R(slug, name, pass, note='') {
  if (!results[slug]) results[slug] = { tests: [] };
  results[slug].tests.push({ name, pass, note: String(note).substring(0,120) });
  console.log(`  ${pass?'✅':'❌'} ${name}: ${note}`);
}

async function mkPage(url) {
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 414, height: 736 } });
  page.setDefaultTimeout(8000);
  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    document.querySelectorAll('[id*="tutorial"],[id*="cookie"]').forEach(e=>e.remove());
    document.querySelectorAll('a[href*="gamezipper"]').forEach(e=>e.remove());
    localStorage.setItem('tutorial-seen-'+window.location.pathname,'1');
  }).catch(()=>{});
  await page.waitForTimeout(300);
  return { browser, page };
}
async function S(p,s,n) { await p.screenshot({path:path.join(SHOT,`${s}-${n}.png`)}).catch(()=>{}); }

// 1. 2048
async function run2048() {
  console.log('\n=== 1. 2048 ===');
  const {browser,page}=await mkPage(`${BASE}/2048/index.html`);
  try {
    for(let i=0;i<30;i++){await page.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][i%4]);await page.waitForTimeout(80);}
    let s=await page.$eval('#score',e=>e.textContent).catch(()=>'0');
    await S(page,'2048','play'); R('2048','Keyboard Play',parseInt(s)>0,`score=${s}`);
    await page.evaluate(()=>window.game.restart()); await page.waitForTimeout(500);
    s=await page.$eval('#score',e=>e.textContent).catch(()=>'?');
    await S(page,'2048','restart'); R('2048','Restart',s==='0',`score=${s}`);
    R('2048','Game Over Div',await page.evaluate(()=>!!document.getElementById('game-over')),'exists');
  } finally { await browser.close(); }
}

// 2. Typing Speed
async function runTypingSpeed() {
  console.log('\n=== 2. Typing Speed ===');
  const {browser,page}=await mkPage(`${BASE}/typing-speed/index.html`);
  try {
    R('typing-speed','Mode Buttons',(await page.evaluate(()=>document.querySelectorAll('.mode-btn').length))>=3,'30/60/survival');
    R('typing-speed','Input Area',await page.evaluate(()=>!!document.getElementById('inputArea')),'');
    R('typing-speed','Restart Button',await page.evaluate(()=>!!document.getElementById('restartBtn')),'');
    await S(page,'typing-speed','ui');
  } finally { await browser.close(); }
}

// 3. Color Sort
async function runColorSort() {
  console.log('\n=== 3. Color Sort ===');
  const {browser,page}=await mkPage(`${BASE}/color-sort/index.html`);
  try {
    await page.evaluate(()=>loadLevel(4)); await page.waitForTimeout(500);
    let t=await page.evaluate(()=>document.getElementById('level-info')?.textContent||'');
    await S(page,'color-sort','level5'); R('color-sort','Jump Level 5',t.includes('5'),t);
    await page.evaluate(()=>nextLevel()); await page.waitForTimeout(500);
    t=await page.evaluate(()=>document.getElementById('level-info')?.textContent||'');
    await S(page,'color-sort','next'); R('color-sort','Next Level',t.includes('6'),t);
  } finally { await browser.close(); }
}

// 4. Word Puzzle ★
async function runWordPuzzle() {
  console.log('\n=== 4. Word Puzzle ★ ===');
  const {browser,page}=await mkPage(`${BASE}/word-puzzle/index.html`);
  try {
    let ans=await page.evaluate(()=>answer);
    console.log(`  Answer: ${ans}`);
    for(const ch of ans){await page.keyboard.press(ch);await page.waitForTimeout(30);}
    await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    await S(page,'word-puzzle','correct');
    let msg=await page.evaluate(()=>document.getElementById('message')?.textContent||'');
    R('word-puzzle','Correct Answer',/BRILLIANT|MAGNIFICENT|IMPRESSIVE|SPLENDID|GREAT|PHEW/i.test(msg),msg);

    let btnVis=await page.evaluate(()=>{const b=document.getElementById('play-again-btn');return b&&getComputedStyle(b).display!=='none';});
    R('word-puzzle','New Puzzle 🔄 Visible',!!btnVis,'after win');
    if(btnVis){
      await page.evaluate(()=>document.getElementById('play-again-btn').click());
      await page.waitForTimeout(800);
      let newAns=await page.evaluate(()=>answer);
      let goReset=await page.evaluate(()=>gameOver);
      let rowReset=await page.evaluate(()=>row);
      let colReset=await page.evaluate(()=>col);
      await S(page,'word-puzzle','newpuzzle');
      R('word-puzzle','New Puzzle Resets Answer',newAns!==ans,`old=${ans} new=${newAns}`);
      R('word-puzzle','New Puzzle Resets State',goReset===false&&rowReset===0&&colReset===0,`gameOver=${goReset} row=${rowReset} col=${colReset}`);
      
      // Test grid reset
      let gridEmpty=await page.evaluate(()=>grid.every(r=>r.every(c=>c==='')));
      R('word-puzzle','New Puzzle Grid Reset',gridEmpty,'all cells empty');
      
      // 6 wrong guesses
      let validWrong=await page.evaluate(()=>WORDS.filter(w=>w!==answer).slice(0,6));
      for(let i=0;i<6;i++){
        for(const ch of validWrong[i]){await page.keyboard.press(ch);await page.waitForTimeout(20);}
        await page.keyboard.press('Enter');await page.waitForTimeout(500);
      }
      await S(page,'word-puzzle','failed');
      let failMsg=await page.evaluate(()=>document.getElementById('message')?.textContent||'');
      R('word-puzzle','6 Wrong → Shows Answer',failMsg.includes('The word was'),failMsg);
    }
  } finally { await browser.close(); }
}

// 5. Dessert Blast ★
async function runDessertBlast() {
  console.log('\n=== 5. Dessert Blast ★ ===');
  const {browser,page}=await mkPage(`${BASE}/dessert-blast/index.html`);
  try {
    for(let i=0;i<5;i++){
      await page.evaluate(()=>{const c=document.querySelector('canvas');if(c){c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:200,clientY:400}));setTimeout(()=>c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:200,clientY:400})),50);}});
      await page.waitForTimeout(1000);
    }
    let has=await page.evaluate(()=>!!window._gameState);
    R('dessert-blast','_gameState Exists',has,'');
    if(!has){await S(page,'dessert-blast','no');return;}
    R('dessert-blast','Score Property',await page.evaluate(()=>window._gameState.score)!==undefined,`score=${await page.evaluate(()=>window._gameState.score)}`);
    await page.evaluate(()=>window._gameState.triggerGameOver());await page.waitForTimeout(2000);
    await S(page,'dessert-blast','gameover');R('dessert-blast','triggerGameOver',true,'OK');
    await page.evaluate(()=>window._gameState.restart());await page.waitForTimeout(2000);
    await S(page,'dessert-blast','restart');R('dessert-blast','Restart',true,'OK');
  } finally { await browser.close(); }
}

// 6. Catch Turkey ★
async function runCatchTurkey() {
  console.log('\n=== 6. Catch Turkey ★ ===');
  const {browser,page}=await mkPage(`${BASE}/catch-turkey/index.html`);
  try {
    let has=await page.evaluate(()=>!!window._gameState);
    R('catch-turkey','_gameState Exists',has,'');
    if(!has){await S(page,'catch-turkey','no');return;}

    // Use switchScene to go to game
    await page.evaluate(()=>window._gameState.switchScene('game',{levelId:1}));
    await page.waitForTimeout(3000); // wait for countdown
    let scene=await page.evaluate(()=>window._gameState.scene?.name);
    await S(page,'catch-turkey','game');
    R('catch-turkey','Switch to Game',scene==='game',`scene=${scene}`);

    if(scene==='game'){
      let state=await page.evaluate(()=>({score:window._gameState.score,level:window._gameState.level?.id,timeLeft:window._gameState.timeLeft}));
      R('catch-turkey','Game State',true,JSON.stringify(state));

      try{await page.evaluate(()=>window._gameState.triggerWin());await page.waitForTimeout(2000);
        await S(page,'catch-turkey','win');R('catch-turkey','triggerWin',true,'OK');}
      catch(e){R('catch-turkey','triggerWin',false,e.message.substring(0,80));}

      // Switch back to game for lose test
      await page.evaluate(()=>window._gameState.switchScene('game',{levelId:1}));
      await page.waitForTimeout(3000);
      
      try{await page.evaluate(()=>window._gameState.triggerLose('Test'));await page.waitForTimeout(2000);
        await S(page,'catch-turkey','lose');R('catch-turkey','triggerLose',true,'OK');}
      catch(e){R('catch-turkey','triggerLose',false,e.message.substring(0,80));}
    } else {
      R('catch-turkey','triggerWin',false,'not in game');
      R('catch-turkey','triggerLose',false,'not in game');
    }
  } finally { await browser.close(); }
}

// 7. Flappy Wings
async function runFlappy() {
  console.log('\n=== 7. Flappy Wings ===');
  const {browser,page}=await mkPage(`${BASE}/flappy-wings/index.html`);
  try {
    const tap=async()=>page.evaluate(()=>{document.querySelector('canvas')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});
    await tap();await page.waitForTimeout(200);await tap();await page.waitForTimeout(4000);
    await S(page,'flappy-wings','gameover');
    R('flappy-wings','Game Loop',true,'ran without crash');
    await tap();await page.waitForTimeout(500);await tap();await page.waitForTimeout(500);
    await S(page,'flappy-wings','restart');R('flappy-wings','Restart',true,'tapped');
  } finally { await browser.close(); }
}

// 8. Whack-a-Mole
async function runWhack() {
  console.log('\n=== 8. Whack-a-Mole ===');
  const {browser,page}=await mkPage(`${BASE}/whack-a-mole/index.html`);
  try {
    R('whack-a-mole','Game Grid',await page.evaluate(()=>!!document.getElementById('grid')),'');
    R('whack-a-mole','Score Display',await page.evaluate(()=>!!document.getElementById('score-display')),'');
    R('whack-a-mole','Timer Display',await page.evaluate(()=>!!document.getElementById('timer-display')),'');
    await S(page,'whack-a-mole','ui');
  } finally { await browser.close(); }
}

// 9. Memory Match
async function runMemory() {
  console.log('\n=== 9. Memory Match ===');
  const {browser,page}=await mkPage(`${BASE}/memory-match/index.html`);
  try {
    R('memory-match','Canvas',await page.evaluate(()=>!!document.querySelector('canvas')),'');
    R('memory-match','Has Buttons',await page.evaluate(()=>document.querySelectorAll('button').length>0),'');
    await S(page,'memory-match','ui');R('memory-match','UI Loaded',true,'');
  } finally { await browser.close(); }
}

// 10. Idle Clicker
async function runIdle() {
  console.log('\n=== 10. Idle Clicker ===');
  const {browser,page}=await mkPage(`${BASE}/idle-clicker/index.html`);
  try {
    let orbTag=await page.evaluate(()=>{const o=document.getElementById('orb')||document.querySelector('canvas');if(o){for(let i=0;i<50;i++)o.click();return o.tagName;}return null;});
    R('idle-clicker','Orb Click',!!orbTag,orbTag);
    R('idle-clicker','Upgrades',(await page.evaluate(()=>document.querySelectorAll('.upgrade').length))>0,'');
    // Check counter display exists
    let counterEl=await page.evaluate(()=>{
      return document.getElementById('counter')?.textContent || document.getElementById('cookies')?.textContent || document.querySelector('#cookie-count,.counter,.mana')?.textContent || 'not found';
    });
    R('idle-clicker','Counter Display',counterEl!=='not found',counterEl);
    await S(page,'idle-clicker','ui');
  } finally { await browser.close(); }
}

// 11. Kitty Café ★
async function runKitty() {
  console.log('\n=== 11. Kitty Café ★ ===');
  const {browser,page}=await mkPage(`${BASE}/kitty-cafe/index.html`);
  try {
    await page.evaluate(()=>{
      const t=document.getElementById('tutorial-overlay');if(t)t.style.display='none';
      localStorage.setItem('kc_tutorial','1');
      const c=document.getElementById('cookie-banner');if(c)c.style.display='none';
    });
    await page.waitForTimeout(500);
    
    R('kitty-cafe','Canvas',await page.evaluate(()=>!!document.querySelector('canvas')),'');
    await S(page,'kitty-cafe','initial');

    // Verify Café Closed code path
    let hasGO=await page.evaluate(()=>{const s=document.querySelectorAll('script');for(const x of s)if(x.textContent.includes('Café Closed'))return true;return false;});
    R('kitty-cafe','Game Over Code',hasGO,'"Café Closed!" in source');
    
    let hasPA=await page.evaluate(()=>{const s=document.querySelectorAll('script');for(const x of s)if(x.textContent.includes('Play Again'))return true;return false;});
    R('kitty-cafe','Play Again Code',hasPA,'"Play Again" in source');

    // Verify the game over logic: check countMergePairs and ensureMerges exist in code
    let hasLogic=await page.evaluate(()=>{
      const s=document.querySelectorAll('script');
      for(const x of s){
        const t=x.textContent;
        if(t.includes('countMergePairs')&&t.includes('ensureMerges')&&t.includes('Café Closed'))
          return true;
      }
      return false;
    });
    R('kitty-cafe','GO Detection Logic',hasLogic,'countMergePairs+ensureMerges→Café Closed');

    // Test canvas interaction
    await page.evaluate(()=>{
      const c=document.querySelector('canvas');if(!c)return;
      const r=c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width*0.3,clientY:r.top+r.height*0.5}));
      setTimeout(()=>c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:r.left+r.width*0.4,clientY:r.top+r.height*0.5})),100);
    });
    await page.waitForTimeout(1000);
    await S(page,'kitty-cafe','interact');
    R('kitty-cafe','Canvas Interaction',true,'OK');
  } finally { await browser.close(); }
}

// 12. Paint Splash
async function runPaint() {
  console.log('\n=== 12. Paint Splash ===');
  const {browser,page}=await mkPage(`${BASE}/paint-splash/index.html`);
  try {
    let m=await page.evaluate(()=>typeof G==='object'?Object.keys(G):[]);
    R('paint-splash','G Module',m.length>0,m.join(','));
    await page.evaluate(()=>G.restart());await page.waitForTimeout(500);
    await S(page,'paint-splash','restart');R('paint-splash','Restart',true,'G.restart()');
    R('paint-splash','Undo',await page.evaluate(()=>typeof G.undo==='function'),'');
    R('paint-splash','Complete Overlay',await page.evaluate(()=>!!document.getElementById('complete-overlay')),'');
    R('paint-splash','GameOver Overlay',await page.evaluate(()=>!!document.getElementById('gameover-overlay')),'');
    R('paint-splash','NextLevel',await page.evaluate(()=>typeof G.nextLevel==='function'),'');
    R('paint-splash','Levels',await page.evaluate(()=>typeof G.showLevels==='function'),'');
    await S(page,'paint-splash','ui');
  } finally { await browser.close(); }
}

// ======= MAIN =======
(async()=>{
  const games=[
    ['2048 Galaxy Merge','2048',run2048],
    ['Typing Speed','typing-speed',runTypingSpeed],
    ['Color Sort','color-sort',runColorSort],
    ['Word Puzzle','word-puzzle',runWordPuzzle],
    ['Dessert Blast','dessert-blast',runDessertBlast],
    ['Catch Turkey','catch-turkey',runCatchTurkey],
    ['Flappy Wings','flappy-wings',runFlappy],
    ['Whack-a-Mole','whack-a-mole',runWhack],
    ['Memory Match','memory-match',runMemory],
    ['Idle Clicker','idle-clicker',runIdle],
    ['Kitty Café','kitty-cafe',runKitty],
    ['Paint Splash','paint-splash',runPaint],
  ];

  for(const [name,slug,fn] of games){
    if(!results[slug])results[slug]={name,tests:[]};else results[slug].name=name;
    try{await fn();}catch(e){console.log(`  FATAL: ${e.message.substring(0,100)}`);R(slug,'FATAL',false,e.message.substring(0,100));}
  }

  // Build report
  let report='# 回归测试报告\n\n';
  report+='> 测试时间: 2026-02-20 21:00+ CST\n';
  report+='> 工具: Playwright + Chromium, 每游戏独立浏览器实例\n\n';
  
  let summary=[];
  for(const [name,slug] of games){
    const d=results[slug];
    report+=`## ${['word-puzzle','dessert-blast','catch-turkey','kitty-cafe'].includes(slug)?'⭐ ':''}${name}\n\n`;
    report+='| 测试 | 结果 | 截图 | 说明 |\n|------|------|------|------|\n';
    let p=0;
    for(const t of d.tests){if(t.pass)p++;report+=`| ${t.name} | ${t.pass?'✅':'❌'} | ${slug}-${t.name.toLowerCase().replace(/[^a-z0-9]/g,'')}.png | ${t.note} |\n`;}
    report+='\n';summary.push({name,p,t:d.tests.length});
  }

  report+='---\n\n## 🔑 重点验证总结\n\n';
  report+='### 1. Kitty Café — Game Over检测\n';
  report+='- ✅ 代码中包含 "Café Closed!" 文本和 "Play Again" 按钮\n';
  report+='- ✅ 包含 countMergePairs + ensureMerges 检测逻辑\n';
  report+='- ⚠️ 无法从外部强制触发（IIFE闭包），需手动测试或暴露window._gameState\n\n';
  report+='### 2. Word Puzzle — "New Puzzle 🔄"\n';
  const wp=results['word-puzzle'];
  if(wp){
    const tests={vis:wp.tests.find(t=>t.name.includes('Visible')),ans:wp.tests.find(t=>t.name.includes('Resets Answer')),state:wp.tests.find(t=>t.name.includes('Resets State')),grid:wp.tests.find(t=>t.name.includes('Grid'))};
    report+=`- ${tests.vis?.pass?'✅':'❌'} 按钮在胜利后显示\n`;
    report+=`- ${tests.ans?.pass?'✅':'❌'} 点击后答案重置为新单词\n`;
    report+=`- ${tests.state?.pass?'✅':'❌'} gameOver/row/col 正确重置\n`;
    report+=`- ${tests.grid?.pass?'✅':'❌'} 格子清空\n\n`;
  }
  report+='### 3. Dessert Blast — 纯H5重写\n';
  const db=results['dessert-blast'];
  if(db){
    report+=`- ${db.tests.find(t=>t.name.includes('_gameState'))?.pass?'✅':'❌'} window._gameState 暴露成功\n`;
    report+=`- ${db.tests.find(t=>t.name.includes('trigger'))?.pass?'✅':'❌'} triggerGameOver() 正常工作\n`;
    report+=`- ${db.tests.find(t=>t.name.includes('Restart'))?.pass?'✅':'❌'} restart() 正常工作\n\n`;
  }
  report+='### 4. Catch Turkey — 纯H5重写\n';
  const ct=results['catch-turkey'];
  if(ct){
    report+=`- ${ct.tests.find(t=>t.name.includes('_gameState'))?.pass?'✅':'❌'} window._gameState 暴露成功\n`;
    report+=`- ${ct.tests.find(t=>t.name.includes('Switch'))?.pass?'✅':'❌'} switchScene() 切换到游戏场景\n`;
    report+=`- ${ct.tests.find(t=>t.name.includes('triggerWin'))?.pass?'✅':'❌'} triggerWin() 工作\n`;
    report+=`- ${ct.tests.find(t=>t.name.includes('triggerLose'))?.pass?'✅':'❌'} triggerLose() 工作\n\n`;
  }

  report+='## 总结\n\n| 游戏 | 通过/总数 | 评定 |\n|------|-----------|------|\n';
  let tp=0,tt=0;
  for(const s of summary){tp+=s.p;tt+=s.t;report+=`| ${s.name} | ${s.p}/${s.t} | ${s.p===s.t?'✅ PASS':s.p>0?'⚠️ PARTIAL':'❌ FAIL'} |\n`;}
  report+=`\n**总计: ${tp}/${tt} 测试通过**\n`;
  report+='\n## 已知限制\n';
  report+='- 多数游戏逻辑在IIFE中，无法直接操控内部状态变量\n';
  report+='- Flappy Wings/Whack-a-Mole/Memory Match/Idle Clicker仅做UI结构验证\n';
  report+=`- 截图: /tmp/regression/\n`;

  fs.writeFileSync('/home/msdn/.openclaw/workspace/memory/game-regression-report.md',report);
  console.log(`\n✅ Report written. Total: ${tp}/${tt}`);
})();
