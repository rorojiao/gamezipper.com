/**
 * Chocolate Bean Storm 音频系统
 * 基于 Bubble Storm CR 音频架构 v2.0
 * 
 * 功能:
 * - 4 BGM 链接式交叉淡入淡出 (menu/gameplay/levelup/gameover)
 * - 14 SFX 实时合成 (Web Audio API)
 * - 支持静音开关和音量控制
 */

class AudioSystem {
    constructor() {
        this.audioCtx = null;
        this.audioEnabled = true;
        this.musicEnabled = true;
        
        // BGM 相关
        this.bgmOsc = null;
        this.bgmGain = null;
        this.bgmInterval = null;
        this.bgmChordIndex = 0;
        
        // BGM 和弦配置 (C大调风格)
        this.BGM_CHORDS = [
            [130.81, 164.81, 196],   // C3, E3, G3
            [146.83, 174.61, 220],   // D3, F#3, A3
            [164.81, 196, 246.94],   // E3, G3, B3
            [130.81, 164.81, 196]    // 回到 C
        ];
        
        // BGM 路径 (待生成)
        this.BGM_FILES = {
            menu: '/audio/bgm_menu.mp3',
            gameplay: '/audio/bgm_gameplay.mp3',
            levelup: '/audio/bgm_levelup.mp3',
            gameover: '/audio/bgm_gameover.mp3'
        };
        
        this.currentBGM = null;
        this.bgmGainNode = null;
        this.bgmSource = null;
    }
    
    // 初始化音频上下文
    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // 切换音频状态
    toggleAudio(enabled) {
        this.audioEnabled = enabled;
        if (!enabled) {
            this.stopBGM();
        }
    }
    
    // 切换音乐状态
    toggleMusic(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopBGM();
        }
    }
    
    // 播放 BGM (文件版本)
    async playBGM(type, fadeIn = true) {
        if (!this.audioEnabled || !this.musicEnabled) return;
        
        this.init();
        
        try {
            // 停止当前 BGM
            await this.stopBGM();
            
            // 创建新的 BGM
            this.bgmSource = this.audioCtx.createBufferSource();
            const response = await fetch(this.BGM_FILES[type]);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            
            this.bgmSource.buffer = audioBuffer;
            this.bgmSource.loop = true;
            
            // 创建增益节点
            this.bgmGainNode = this.audioCtx.createGain();
            this.bgmGainNode.gain.value = fadeIn ? 0 : 0.5;
            
            // 连接节点
            this.bgmSource.connect(this.bgmGainNode);
            this.bgmGainNode.connect(this.audioCtx.destination);
            
            this.bgmSource.start();
            this.currentBGM = type;
            
            // 淡入效果
            if (fadeIn) {
                this.bgmGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
                this.bgmGainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 2);
            }
            
        } catch (error) {
            console.warn('BGM loading error:', error);
        }
    }
    
    // 停止 BGM (带淡出)
    async stopBGM(fadeOut = true) {
        if (!this.bgmSource) return;
        
        if (fadeOut && this.bgmGainNode) {
            this.bgmGainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1);
        }
        
        setTimeout(() => {
            if (this.bgmSource) {
                try {
                    this.bgmSource.stop();
                    this.bgmSource.disconnect();
                } catch (e) {
                    console.warn('BGM stop error:', e);
                }
                this.bgmSource = null;
                this.currentBGM = null;
            }
        }, fadeOut ? 1000 : 0);
    }
    
    // 切换 BGM (淡出当前，淡入新 BGM)
    async switchBGM(newType) {
        if (this.currentBGM === newType) return;
        
        await this.stopBGM(true);
        setTimeout(() => {
            this.playBGM(newType, true);
        }, 1000);
    }
    
    // ========== SFX 合成函数 (使用 Web Audio API) ==========
    
    // 通用振荡器创建
    createOscillator(type, frequency, duration, volume = 0.3) {
        if (!this.audioEnabled || !this.audioCtx) return null;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
        
        return osc;
    }
    
    // 1. Shoot SFX
    playShoot() {
        // 快速频率上升的音效
        this.createOscillator('triangle', 800, 0.15, 0.25);
        setTimeout(() => this.createOscillator('triangle', 1200, 0.1, 0.15), 50);
    }
    
    // 2. Pop SFX
    playPop() {
        // 短促的爆发音效
        this.createOscillator('square', 600, 0.1, 0.3);
        setTimeout(() => this.createOscillator('square', 900, 0.08, 0.2), 30);
    }
    
    // 3. Combo SFX
    playCombo(count) {
        // 连击音效 - 根据连击数调整音高
        const baseFreq = 500 + (count * 100);
        this.createOscillator('sine', baseFreq, 0.2, 0.35);
        setTimeout(() => this.createOscillator('sine', baseFreq + 200, 0.15, 0.25), 100);
    }
    
    // 4. Chain SFX
    playChain() {
        // 连锁消除音效
        this.createOscillator('sawtooth', 400, 0.25, 0.3);
        setTimeout(() => this.createOscillator('sawtooth', 800, 0.2, 0.2), 100);
        setTimeout(() => this.createOscillator('sawtooth', 1200, 0.15, 0.15), 200);
    }
    
    // 5. Wall Bounce SFX
    playWallBounce() {
        // 反弹音效
        this.createOscillator('triangle', 300, 0.08, 0.2);
    }
    
    // 6. Charge SFX
    playCharge() {
        // 充能音效
        this.createOscillator('sine', 200, 0.5, 0.2);
        setTimeout(() => this.createOscillator('sine', 300, 0.4, 0.25), 200);
        setTimeout(() => this.createOscillator('sine', 400, 0.3, 0.3), 400);
    }
    
    // 7. Charge Shoot SFX
    playChargeShoot() {
        // 充能射击音效
        this.createOscillator('square', 1000, 0.3, 0.4);
        setTimeout(() => this.createOscillator('square', 1500, 0.2, 0.3), 100);
    }
    
    // 8. Special SFX
    playSpecial() {
        // 特殊技能音效
        this.createOscillator('sawtooth', 600, 0.4, 0.35);
        setTimeout(() => this.createOscillator('sine', 900, 0.3, 0.4), 100);
        setTimeout(() => this.createOscillator('triangle', 1200, 0.25, 0.35), 200);
    }
    
    // 9. Lose SFX
    playLose() {
        // 失败音效
        this.createOscillator('sawtooth', 200, 0.8, 0.4);
        setTimeout(() => this.createOscillator('sawtooth', 150, 0.6, 0.3), 300);
        setTimeout(() => this.createOscillator('sawtooth', 100, 0.4, 0.2), 600);
    }
    
    // 10. Button SFX
    playButton() {
        // 按钮点击音效
        this.createOscillator('sine', 800, 0.1, 0.25);
    }
    
    // 11. Life SFX
    playLife() {
        // 获得生命音效
        this.createOscillator('sine', 600, 0.3, 0.4);
        setTimeout(() => this.createOscillator('sine', 800, 0.25, 0.35), 150);
    }
    
    // 12. Game Complete SFX
    playGameComplete() {
        // 游戏完成音效
        this.createOscillator('sine', 500, 0.4, 0.35);
        setTimeout(() => this.createOscillator('sine', 700, 0.3, 0.4), 200);
        setTimeout(() => this.createOscillator('sine', 900, 0.25, 0.45), 400);
        setTimeout(() => this.createOscillator('sine', 1100, 0.2, 0.35), 600);
    }
    
    // 13. Perfect Clear SFX
    playPerfectClear() {
        // 完美消除音效
        this.createOscillator('sine', 1000, 0.5, 0.4);
        setTimeout(() => this.createOscillator('square', 1200, 0.4, 0.35), 100);
        setTimeout(() => this.createOscillator('triangle', 1400, 0.3, 0.3), 200);
        setTimeout(() => this.createOscillator('sawtooth', 1600, 0.2, 0.25), 300);
    }
    
    // 14. Timer Warning SFX
    playTimerWarning() {
        // 倒计时警告音效
        const playBeep = () => {
            this.createOscillator('square', 880, 0.15, 0.4);
        };
        
        playBeep();
        setTimeout(playBeep, 300);
        setTimeout(playBeep, 600);
    }
}

// 全局音频系统实例
const audioSystem = new AudioSystem();
