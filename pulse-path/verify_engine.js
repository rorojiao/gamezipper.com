const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
let html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html = html.replace(/<script src="\/[^"]*"[^>]*><\/script>/g,'<script>/* external stripped */</script>');
html = html.replace(/<script src="\/[^"]*"[^>]*><\/script>/g,'<script>/* external stripped */</script>');
html = html.replace(/<script src="\/[^"]*"[^>]*><\/script>/g,'<script>/* external stripped */</script>');
const errors=[];
const dom = new JSDOM(html, {
  url:'https://gamezipper.com/pulse-path/',
  runScripts:'dangerously',
  pretendToBeVisual:true,
  beforeParse(win){
    win.HTMLCanvasElement.prototype.getContext=function(){
      const grad={addColorStop(){}};
      return new Proxy({
        createLinearGradient(){return grad}, createRadialGradient(){return grad}, setTransform(){}, clearRect(){}, fillRect(){}, strokeRect(){}, beginPath(){}, closePath(){}, moveTo(){}, lineTo(){}, arc(){}, arcTo(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, scale(){}, setLineDash(){}, fillText(){}, measureText(){return {width:20}},
        get canvas(){return this}
      },{get:(t,p)=>p in t?t[p]:(()=>{}), set:()=>true});
    };
    win.requestAnimationFrame=(cb)=>win.setTimeout(()=>cb(Date.now()),16);
    win.cancelAnimationFrame=(id)=>win.clearTimeout(id);
    class FakeAudioContext{constructor(){this.state='running';this.currentTime=0;this.destination={};} resume(){} close(){} createOscillator(){return {type:'',frequency:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},start(){},stop(){}}} createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}}}
    win.AudioContext=FakeAudioContext; win.webkitAudioContext=FakeAudioContext;
    win.confirm=()=>true;
  }
});
dom.window.addEventListener('error', e => errors.push(e.message || String(e.error)));
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
(async()=>{
  await wait(300);
  const T = dom.window.__PULSE_TEST__;
  if(!T) throw new Error('__PULSE_TEST__ missing — game script did not initialize');
  if(T.LEVELS.length !== 30) throw new Error('expected 30 levels, got '+T.LEVELS.length);
  for(let i=0;i<T.LEVELS.length;i++){
    if(T.countSolutions(T.LEVELS[i])!==1) throw new Error('non-unique level '+(i+1));
    if(!T.replaySolution(i)) throw new Error('solution replay failed '+(i+1));
  }
  // Exercise actual UI state path on levels 1, 15, 30.
  for (const idx of [0,14,29]) {
    T.startLevel(idx);
    await wait(60);
    const L = T.LEVELS[idx];
    for (const step of L.solution) {
      if(!T.fireDirection(step.dir)) throw new Error('fireDirection failed L'+L.id+' '+step.dir);
      await wait(5);
    }
    const st=T.getState();
    if(!st.won) throw new Error('did not win L'+L.id);
    if(st.moves!==L.par) throw new Error('move count mismatch L'+L.id+' '+st.moves+' vs '+L.par);
  }
  if(errors.length) throw new Error('page errors: '+errors.join(' | '));
  console.log('✅ verify_engine: DOM/jsdom loaded, 30/30 unique, UI replay passed levels 1/15/30');
  dom.window.close();
  process.exit(0);
})().catch(err=>{console.error('FAIL',err && err.stack || err); dom.window.close(); process.exit(1);});
