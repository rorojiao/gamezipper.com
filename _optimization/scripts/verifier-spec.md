# 全站验证器统一规范(v3, 100% 覆盖波)

> 目标: 每个游戏目录一个 `<slug>/verify_engine.js`, node 直跑, 终态 PASS, 证据入 `_optimization/evidence/<slug>/`。
> 铁律: **诚实**。验不了就 FAIL 并写明卡点, 禁止为 PASS 放宽判定。修复优先级: 引擎 bug > 数据 bug > 生成器重写。

## 运行契约(必须严格遵守)
1. `node <slug>/verify_engine.js` 退出码 0=PASS / 1=FAIL
2. **stdout 最后一行必须是紧凑 JSON**: `{"pass":N,"fail":M,"total":T,"verdict":"PASS|FAIL","extra":{...}}`
3. 全程单进程, 无网络, 无浏览器(引擎逻辑验证全部用 node vm 装载页面内联脚本)
4. 运行时间 ≤120s/游戏; 求解器必须有节点/时间上限
5. 完成后跑 `node _optimization/scripts/save-verify.js <slug>` 归档, 并把规范条目并入 `_optimization/reports/solvability-results.json`(写前重读整文件再合并, 条目字段: slug/verifierRun:true/exitCode/passed/total/verdict/durS/detail/evidence)

## vm 沙箱模板(照抄, 已踩平所有坑)
```js
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const el=()=>({textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){},toggle(){}},style:{},addEventListener(){},removeEventListener(){},
  getContext:()=>new Proxy({},{get:(t,p)=>{if(p==='createLinearGradient'||p==='createRadialGradient'||p==='createPattern')return()=>({addColorStop(){}});if(p==='measureText')return()=>({width:10});if(p==='getImageData')return()=>({data:new Uint8ClampedArray(4)});if(typeof p==='string'&&!(p in t))return()=>1;return t[p];},set:()=>true}),
  width:400,height:400,appendChild(){},removeChild(){},getBoundingClientRect:()=>({left:0,top:0,width:400,height:400}),dataset:{},focus(){},blur(){},disabled:false});
const ctx={console:{log(){},error(){},warn(){}},Date,JSON,Math,
  setTimeout:(f)=>{typeof f==='function'&&f();return 0;},clearTimeout(){},setInterval:()=>0,clearInterval(){},
  requestAnimationFrame:()=>0,cancelAnimationFrame(){},performance:{now:()=>Date.now()},
  localStorage:(()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem(k,v){m[k]=String(v)},removeItem(k){delete m[k]}};})(),
  navigator:{userAgent:'node',maxTouchPoints:1,vibrate(){}},location:{href:'http://localhost/'+__dirname.split('/').pop()+'/',search:'',hash:''},
  document:{getElementById:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){},createElement:el,
    body:{appendChild(){},removeChild(){},classList:{add(){},remove(){},toggle(){}}},documentElement:el(),hidden:false,visibilityState:'visible',cookie:''},
  AudioContext:undefined,webkitAudioContext:undefined,alert(){},confirm:()=>true,prompt:()=>'',
  fetch:()=>Promise.resolve({json:()=>Promise.resolve({}),text:()=>Promise.resolve(''),ok:true}),XMLHttpRequest:function(){this.open=()=>{};this.send=()=>{};this.setRequestHeader=()=>{};},
  addEventListener(){},removeEventListener(){},MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{}},ResizeObserver:function(){this.observe=()=>{};this.disconnect=()=>{}},IntersectionObserver:function(){this.observe=()=>{};this.disconnect=()=>{}}};
ctx.window=ctx;ctx.globalThis=ctx;ctx.self=ctx;
// 种子随机(确定性): 覆盖 Math.random 前 Context 化
let seed=12345;ctx.Math=Object.create(Math);ctx.Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
vm.createContext(ctx);
vm.runInContext(scripts,ctx,{filename:'engine.js'});
// 引擎函数在 IIFE 内? 用字符串锚点注入导出: scripts.lastIndexOf('init();') 等唯一锚点后拼 ';globalThis.__api={...};'
```
(允许按游戏微调: audio 回调立即触发、requestAnimationFrame 手动泵等)

## 三种验证型(按游戏本质选, 就深不就浅)
**A 解谜/关卡型**: 每一关必须证明可完成。
- 页面内嵌解 → 逐关把解通过引擎真实交互 API 回放到 checkWin(黄金标准, B1/B2 在 heyawake/yajilin/ripple-effect 的做法)
- 无内嵌解但有生成器 → 引擎语义写独立求解器/构造器, 双向证明
- 求解不可行(隐藏信息/AI 对手)→ 引擎真值驱动的"合法完整对局"到终局
**B 街机/技巧型**: 策略或脚本游玩达到游戏自身定义的成功事件(得分>0/过关/存活N秒), 必须经过引擎真实输入路径
**C 模拟/玩具型**: 随机合法交互 fuzz ≥300 步: 零异常 + 状态推进 + 存档/重置路径可用

## FAIL 处置
1. 引擎 bug(笔误/死代码/未声明变量)→ 直接修, 注释根因, verify-before 留档
2. 关卡数据无解 → 能构造重生成就重生成(参考 _optimization/scripts/gen-*-levels.js), 否则最小数据修复
3. 修不动(大型规则引擎等)→ FAIL 条目 detail 写清卡点+建议, 不要硬凑

## 禁止
系统 Chrome / 并行多 node / 改宽 checkWin 判定 / 无证据的 PASS / 覆盖别人正在写的文件
