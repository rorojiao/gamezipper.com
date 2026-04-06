/* Reaction Time Test - game.js */
(function(){
  'use strict';

  /* ===== Web Audio API Sounds ===== */
  var audioCtx = null;
  function getAudio(){
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    return audioCtx;
  }
  function playTone(freq, dur, type, vol){
    var ctx = getAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type || 'sine';
    gain.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }
  function playGood(){
    playTone(523, 0.15, 'sine', 0.25);
    setTimeout(function(){ playTone(659, 0.15, 'sine', 0.2); }, 80);
    setTimeout(function(){ playTone(784, 0.2, 'sine', 0.15); }, 160);
  }
  function playFoul(){
    playTone(200, 0.3, 'sawtooth', 0.2);
  }
  function playClick(){
    playTone(440, 0.05, 'square', 0.1);
  }

  /* ===== Global Leaderboard Sim ===== */
  // Simulated percentile thresholds based on real-world data
  var SIM_PEERS = [
    {ms: 145, pct: 99}, {ms: 160, pct: 97}, {ms: 170, pct: 95},
    {ms: 180, pct: 90}, {ms: 190, pct: 85}, {ms: 200, pct: 80},
    {ms: 215, pct: 70}, {ms: 230, pct: 60}, {ms: 245, pct: 50},
    {ms: 260, pct: 40}, {ms: 280, pct: 30}, {ms: 300, pct: 20},
    {ms: 330, pct: 10}, {ms: 370, pct: 5},  {ms: 420, pct: 2},
  ];

  function getPercentile(ms){
    for (var i = 0; i < SIM_PEERS.length; i++) {
      if (ms <= SIM_PEERS[i].ms) return SIM_PEERS[i].pct;
    }
    return 1;
  }

  function getRating(ms){
    if (ms < 200) return {text:'⚡ Lightning Fast!', cls:'bolt'};
    if (ms < 250) return {text:'🚀 Super Fast!', cls:'fast'};
    if (ms < 350) return {text:'👍 Average', cls:'avg'};
    return {text:'🐢 Keep Practicing!', cls:'slow'};
  }

  function buildLeaderboard(playerMs, playerPct){
    var rows = [
      {ms:155, label:'⚡ Pro Gamer'},
      {ms:195, label:'🎮 Esports Pro'},
      {ms:220, label:'🏃 Athlete'},
      {ms:260, label:'💼 Office Worker'},
      {ms:320, label:'😴 Average Human'},
    ];
    var out = document.getElementById('lb-entries');
    if (!out) return;
    out.innerHTML = '';
    var rank = 1;
    rows.forEach(function(r){
      var pct = getPercentile(r.ms);
      var isYou = false;
      // inject player into sorted list
    });
    // Actually build a clean simulated top-5
    var all = rows.slice().concat([{ms:playerMs, label:'👤 You', you:true}]);
    all.sort(function(a,b){ return a.ms - b.ms; });
    all.forEach(function(entry, i){
      if (!entry.you && i > 4) return;
      var pct = getPercentile(entry.ms);
      var rankClass = '';
      if (i === 0) rankClass = 'gold';
      else if (i === 1) rankClass = 'silver';
      else if (i === 2) rankClass = 'bronze';
      var div = document.createElement('div');
      div.className = 'lb-row';
      div.innerHTML =
        '<span class="lb-rank ' + rankClass + '">#' + (i+1) + '</span>' +
        '<span class="lb-time">' + entry.label + '</span>' +
        '<span class="lb-time">' + entry.ms + 'ms</span>' +
        (entry.you ? '<span class="lb-you">YOU</span>' : '<span class="lb-pct">Top ' + pct + '%</span>');
      out.appendChild(div);
    });
  }

  /* ===== Ripple Effect ===== */
  function createRipple(e, el){
    var rect = el.getBoundingClientRect();
    var x, y;
    if (e.touches && e.touches.length) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    var ripple = document.createElement('div');
    ripple.className = 'ripple';
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size * 0.4 + 'px';
    ripple.style.left = (x - size * 0.2) + 'px';
    ripple.style.top = (y - size * 0.2) + 'px';
    el.appendChild(ripple);
    setTimeout(function(){ if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  /* ===== Game State ===== */
  var TOTAL_ROUNDS = 5;
  var state = 'idle'; // idle | waiting | ready | result | foul
  var round = 0;
  var times = [];
  var startTime = 0;
  var timeoutId = null;
  var gameArea = null;
  var stateText = null;
  var stateSub = null;
  var resultScreen = null;

  function el(id){ return document.getElementById(id); }

  function setState(newState){
    state = newState;
    gameArea.className = '';
    if (newState === 'idle')     { gameArea.classList.add('idle'); }
    else if (newState === 'waiting') { gameArea.classList.add('red'); }
    else if (newState === 'ready')    { gameArea.classList.add('green'); }
    else if (newState === 'foul')     { gameArea.classList.add('yellow'); }
    else if (newState === 'result')  { gameArea.classList.add('result'); }
  }

  function updateDots(){
    for (var i = 0; i < TOTAL_ROUNDS; i++) {
      var d = el('d'+i);
      if (!d) continue;
      d.className = 'dot';
      if (i < round) d.classList.add('done');
      else if (i === round && state !== 'idle') d.classList.add('active');
    }
  }

  function setText(text, sub){
    stateText.textContent = text || '';
    if (stateSub) stateSub.textContent = sub || '';
  }

  function updateRoundNum(){
    el('round-num').textContent = (round+1) + '/' + TOTAL_ROUNDS;
  }

  function updateHistoryBest(){
    var best = null;
    try { best = localStorage.getItem('rt_best'); } catch(e){}
    var hbEl = el('hb-val');
    if (best !== null) {
      hbEl.textContent = parseInt(best) + 'ms';
      hbEl.classList.remove('none');
    } else {
      hbEl.textContent = 'No record yet';
      hbEl.classList.add('none');
    }
  }

  function flashScreen(){
    var flash = el('flash');
    if (!flash) return;
    flash.style.opacity = '0.6';
    setTimeout(function(){ flash.style.opacity = '0'; }, 80);
  }

  function saveBest(ms){
    try {
      var cur = localStorage.getItem('rt_best');
      if (cur === null || ms < parseInt(cur)) {
        localStorage.setItem('rt_best', ms);
        return true;
      }
    } catch(e){}
    return false;
  }

  function showResults(){
    if (times.length === 0) return;
    var avg = Math.round(times.reduce(function(a,b){return a+b;}, 0) / times.length);
    var rating = getRating(avg);
    var pct = getPercentile(avg);
    var newBest = saveBest(avg);

    el('avg-display').textContent = avg + 'ms';
    var ratingEl = el('rating-display');
    ratingEl.textContent = rating.text;
    ratingEl.className = 'rating ' + rating.cls;

    var fillEl = el('pct-fill');
    fillEl.style.width = '0%';
    setTimeout(function(){ fillEl.style.width = pct + '%'; }, 100);
    el('pct-label').textContent = 'Top ' + pct + '% worldwide' + (newBest ? ' 🏆 NEW BEST!' : '');

    // per-round times
    var prEl = el('per-round');
    prEl.innerHTML = 'Rounds: ' + times.map(function(t,i){
      return '<span>' + (i+1) + ':' + t + 'ms</span>';
    }).join(' ');

    buildLeaderboard(avg, pct);
    updateHistoryBest();

    resultScreen.classList.add('show');
    playGood();
  }

  function clearTimeouts(){
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  }

  function startGame(){
    round = 0;
    times = [];
    clearTimeouts();
    el('btn-start').style.display = 'none';
    el('btn-retry').style.display = 'none';
    resultScreen.classList.remove('show');
    updateRoundNum();
    nextRound();
  }

  function nextRound(){
    if (round >= TOTAL_ROUNDS) {
      showResults();
      setState('result');
      setText('🎉 All Done!', 'Your average reaction time');
      el('btn-retry').style.display = '';
      // Trigger ad after 5 rounds
      if (window.GZMonetagSafe) window.GZMonetagSafe.maybeLoad();
      return;
    }
    updateRoundNum();
    updateDots();
    setState('waiting');
    setText('⏳ Wait for GREEN...', 'Don\'t click yet!');
    // Random delay 1.5s - 4s
    var delay = 1500 + Math.random() * 2500;
    timeoutId = setTimeout(function(){
      setState('ready');
      setText('🏃 GO GO GO!', 'Click now!');
      startTime = performance.now();
      playTone(880, 0.1, 'sine', 0.2);
    }, delay);
  }

  function handleClick(e){
    if (e) {
      e.preventDefault();
      createRipple(e, gameArea);
    }
    playClick();

    if (state === 'idle' || state === 'result') {
      startGame();
      return;
    }

    if (state === 'waiting') {
      // FOUL - clicked too early
      clearTimeouts();
      setState('foul');
      setText('🚫 FOUL!', 'Too early! Wait for green.');
      flashScreen();
      playFoul();
      setTimeout(function(){
        nextRound();
      }, 1200);
      return;
    }

    if (state === 'ready') {
      var reactionMs = Math.round(performance.now() - startTime);
      times.push(reactionMs);
      round++;
      updateDots();
      flashScreen();

      var rating = getRating(reactionMs);
      setState('result');
      setText(reactionMs + 'ms', rating.text);
      setTimeout(function(){
        nextRound();
      }, 900);
      return;
    }
  }

  function init(){
    gameArea = el('game-area');
    stateText = el('state-text');
    stateSub = el('state-sub');
    resultScreen = el('result-screen');

    // Click / touch
    gameArea.addEventListener('click', handleClick);
    gameArea.addEventListener('touchstart', function(e){
      e.preventDefault();
      handleClick(e);
    }, {passive:false});

    // Keyboard
    document.addEventListener('keydown', function(e){
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleClick(null);
      }
    });

    // Button handlers
    el('btn-start').addEventListener('click', function(e){ e.stopPropagation(); startGame(); });
    el('btn-retry').addEventListener('click', function(e){ e.stopPropagation(); startGame(); });

    updateHistoryBest();
    setState('idle');

    // Build initial leaderboard preview
    buildLeaderboard(260, 40);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose for button onclick */
  window.RT = { start: startGame };

})();
