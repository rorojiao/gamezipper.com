// 游戏音效自动化触发 - 无需修改游戏代码
// 自动在交互时播放合适的音效

(function() {
  // 等待GameAudio加载
  if (typeof GameAudio === 'undefined') {
    console.warn('GameAudio not loaded');
    return;
  }
  
  const gameName = window.location.pathname.split('/')[1] || '2048';
  
  // 音效映射：根据游戏类型和事件自动选择音效
  const soundMap = {
    'all': {
      'button.click': 'tap',
      'canvas.click': 'click',
    },
    '2048': {
      'button.click': 'whoosh',  // 滑动时的音效
      '.won': 'supernova',  // 2048达成
      'merge': 'merge',  // 数字合并
    },
    'typing-speed': {
      'input.input': 'keytype',
      '.correct': 'coin',
      '.error': 'error',
      '.gameover': 'death',
    },
    'color-sort': {
      'canvas.click': 'crystal',
      '.completed': 'crystal',
    },
    'word-puzzle': {
      'button.click': 'tap',
      '.correct': 'match',
      '.gameover': 'death',
    },
    'dessert-blast': {
      'canvas.click': 'match',
      '.match': 'coin',
    },
    'catch-turkey': {
      'canvas.click': 'turkey',
      '.match': 'coin',
      '.win': 'win',
    },
    'flappy-wings': {
      'canvas.click': 'flap',
      '.score': 'coin',
      '.gameover': 'death',
    },
    'whack-a-mole': {
      'canvas.click': 'whack',
      '.hit': 'whack',
    },
    'memory-match': {
      'canvas.click': 'flip',
      '.match': 'match',
      '.win': 'win',
    },
    'idle-clicker': {
      'canvas.click': 'magic',
      '.upgrade': 'upgrade',
    },
  };
  
  // 自动音效触发器
  const autoSoundTriggers = {
    '2048': () => {
      const originalSlide = window.slideHandler || (() => {});
      // 捕捉得分变化
      let lastScore = 0;
      setInterval(() => {
        const scoreEl = document.getElementById('score') || document.querySelector('[class*=score]');
        if (scoreEl) {
          const currentScore = parseInt(scoreEl.textContent) || 0;
          if (currentScore > lastScore && currentScore % 100 === 0) {
            GameAudio.play('merge');
            lastScore = currentScore;
          }
        }
      }, 200);
    },
    
    'typing-speed': () => {
      // 在input事件上播放键盘音
      const inp = document.getElementById('inputArea');
      if (inp) {
        const originalHandler = inp.oninput;
        inp.oninput = function(e) {
          GameAudio.play('keytype', 0.2);
          if (originalHandler) originalHandler.call(this, e);
        };
      }
    },
    
    'flappy-wings': () => {
      // 监听游戏事件（如果可用）
      setInterval(() => {
        const scoreEl = document.querySelector('[class*=score]');
        if (scoreEl) {
          window._lastFlappyScore = window._lastFlappyScore || 0;
          const current = parseInt(scoreEl.textContent) || 0;
          if (current > window._lastFlappyScore) {
            GameAudio.play('coin', 0.6);
            window._lastFlappyScore = current;
          }
        }
      }, 100);
    },
    
    'whack-a-mole': () => {
      // canvas点击时播放锤击音
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('click', () => GameAudio.play('whack', 0.7), true);
      }
    },
  };
  
  // 通用点击音效
  document.addEventListener('click', (e) => {
    // 按钮点击
    if (e.target.tagName === 'BUTTON' && !e.target.id?.includes('tutorial')) {
      GameAudio.play('tap', 0.4);
    }
    // 返回链接
    if (e.target.tagName === 'A') {
      GameAudio.play('tap', 0.3);
    }
  }, true);
  
  // 执行游戏特定的自动触发器
  if (autoSoundTriggers[gameName]) {
    setTimeout(() => {
      try {
        autoSoundTriggers[gameName]();
      } catch(e) {
        console.log('Audio trigger error:', e.message);
      }
    }, 500);
  }
  
  // 在游戏开始时播放BGM
  setTimeout(() => {
    GameAudio.playBGM(gameName);
  }, 1000);
})();
