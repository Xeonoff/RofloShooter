import { R } from '../core/utils.js';
import { Game } from '../game/gameLoop.js';

export const SFX = {
    ctx: null, out: null, echo: null, noiseBuf: null, musicGain: null,
    init() {
        if (this.ctx) return;
        try {
            const C = new (window.AudioContext || window.webkitAudioContext)(); this.ctx = C;
            const master = C.createGain(); master.gain.value = .55;
            const comp = C.createDynamicsCompressor(); master.connect(comp); comp.connect(C.destination); this.out = master;
            const dl = C.createDelay(.6); dl.delayTime.value = .27;
            const fb = C.createGain(); fb.gain.value = .34; const wet = C.createGain(); wet.gain.value = .22;
            dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master); this.echo = dl;
            const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const d = nb.getChannelData(0);
            for (let i = 0; i < d.length; i++)d[i] = R() * 2 - 1; this.noiseBuf = nb;
            // Эмбиент: гул вентиляции
            const ns = C.createBufferSource(); ns.buffer = nb; ns.loop = true;
            const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 190; bp.Q.value = .6;
            const ng = C.createGain(); ng.gain.value = .05;
            const lfo = C.createOscillator(); lfo.frequency.value = .13;
            const lg = C.createGain(); lg.gain.value = .025;
            lfo.connect(lg); lg.connect(ng.gain); lfo.start();
            ns.connect(bp); bp.connect(ng); ng.connect(master); ns.start();
            // Низкий дрон
            const dr = C.createOscillator(); dr.type = 'sawtooth'; dr.frequency.value = 48;
            const df = C.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 110;
            const dg = C.createGain(); dg.gain.value = .035;
            dr.connect(df); df.connect(dg); dg.connect(master); dr.start();
            // Музыкальный дрон
            this.musicGain = C.createGain(); this.musicGain.gain.value = .04;
            this.musicGain.connect(master);
            const drone1 = C.createOscillator(); drone1.type = 'sine'; drone1.frequency.value = 55;
            const drone2 = C.createOscillator(); drone2.type = 'sine'; drone2.frequency.value = 55.5;
            const drone3 = C.createOscillator(); drone3.type = 'triangle'; drone3.frequency.value = 110;
            const mf = C.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 200;
            drone1.connect(mf); drone2.connect(mf); drone3.connect(mf); mf.connect(this.musicGain);
            drone1.start(); drone2.start(); drone3.start();
            const mlfo = C.createOscillator(); mlfo.frequency.value = .05;
            const mlg = C.createGain(); mlg.gain.value = 80;
            mlfo.connect(mlg); mlg.connect(mf.frequency); mlfo.start();
            // Редкие тревожные события
            const ev = () => {
                setTimeout(() => {
                    if (Game.state === 'play') this[R() < .5 ? 'clang' : 'scream'](.12 + R() * .1);
                    ev();
                }, 7000 + R() * 14000);
            }; ev();
        } catch (e) { }
    },
    burst(freq, dur, vol, type, echo) {
        if (!this.ctx) return; const C = this.ctx, t = C.currentTime;
        const s = C.createBufferSource(); s.buffer = this.noiseBuf;
        const f = C.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
        const g = C.createGain(); g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        s.connect(f); f.connect(g); g.connect(this.out); if (echo) g.connect(this.echo);
        s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { } };
        s.start(t); s.stop(t + dur + .05);
    },
    tone(freq, dur, vol, type, slide, echo) {
        if (!this.ctx) return; const C = this.ctx, t = C.currentTime;
        const o = C.createOscillator(); o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
        const g = C.createGain(); g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g); g.connect(this.out); if (echo) g.connect(this.echo);
        o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) { } };
        o.start(t); o.stop(t + dur + .05);
    },
    shoot(k) {
        if (k === 'pistol') { this.burst(1600, .14, .5, 'lowpass', 1); this.tone(160, .06, .25, 'square'); }
        else if (k === 'shotgun') {
            this.burst(700, .3, .8, 'lowpass', 1); this.burst(2400, .08, .3, 'highpass');
            this.tone(90, .12, .4, 'sine', 40);
        }
        else if (k === 'stapler') { this.tone(300, .15, .4, 'square', 60, 1); this.burst(1200, .2, .5, 'bandpass', 1); }
        else if (k === 'nailgun') { this.burst(2800, .06, .35, 'highpass'); this.tone(800, .04, .2, 'square', 400); }
        else if (k === 'knife') this.burst(3000, .05, .12, 'highpass');
    },
    step(s) {
        const f = [800, 450, 2200, 1100][s] || 800;
        this.burst(f, .07, s === 1 ? .1 : .16, s === 2 ? 'bandpass' : 'lowpass');
    },
    reload() {
        this.tone(700, .04, .2); setTimeout(() => this.tone(500, .05, .2), 260);
        setTimeout(() => this.tone(900, .04, .18), 520);
    },
    pick() { this.tone(660, .06, .2); setTimeout(() => this.tone(990, .08, .2), 70); },
    key() { this.tone(520, .1, .25, 'square'); setTimeout(() => this.tone(780, .14, .25, 'square'), 110); },
    dry() { this.tone(1200, .03, .12); },
    swipe() { this.burst(2500, .08, .12, 'highpass'); },
    kick() { this.burst(400, .12, .3); },
    jump() { this.burst(600, .08, .1); },
    metal() { this.tone(2400, .09, .15, 'square', 1800); },
    pain(t) { this.tone([340, 220, 160, 90, 280, 500][t] || 300, .16, .3, 'sawtooth', [170, 110, 80, 45, 140, 250][t] || 150, 1); },
    die(t) { this.tone([300, 200, 140, 70, 180, 600][t] || 200, .5, .35, 'sawtooth', 40, 1); this.burst(500, .4, .3, 'lowpass'); },
    dieP() { this.tone(180, .9, .5, 'sawtooth', 30, 1); this.burst(300, .8, .5, 'lowpass', 1); },
    alert(t) { this.tone([600, 440, 300, 150, 350, 800][t] || 400, .12, .25, 'square', [900, 660, 450, 220, 550, 1200][t] || 600); },
    roar() { this.tone(70, 1.2, .6, 'sawtooth', 35, 1); this.burst(200, 1, .4, 'lowpass', 1); },
    eShot() { this.burst(1400, .1, .25, 'lowpass', 1); },
    eHeavy() { this.burst(600, .2, .4, 'lowpass', 1); this.tone(120, .1, .3, 'square'); },
    boom() {
        this.burst(300, .7, .9, 'lowpass', 1); this.tone(50, .6, .7, 'sine', 28);
        this.burst(3000, .15, .3, 'highpass', 1);
    },
    door() { this.burst(240, .5, .25, 'lowpass'); },
    doorBang() { this.burst(180, .3, .5, 'lowpass'); this.tone(80, .15, .4, 'sine'); },
    secret() { this.burst(300, .8, .4, 'lowpass', 1); this.tone(110, .6, .2, 'sine', 55); },
    ui() { this.tone(880, .03, .12); },
    scream(v) { this.tone(900, .7, v, 'sawtooth', 300, 1); },
    clang(v) { this.tone(1800, .3, v, 'square', 900, 1); this.tone(2600, .2, v * .6, 'square', 1300, 1); },
    heart() { this.tone(55, .12, .5, 'sine'); setTimeout(() => this.tone(50, .1, .4, 'sine'), 160); },
    powerup() {
        this.tone(440, .1, .3, 'square'); setTimeout(() => this.tone(660, .1, .3, 'square'), 100);
        setTimeout(() => this.tone(880, .15, .3, 'square'), 200);
    },
    switchOn() { this.tone(200, .2, .3, 'square', 400); this.burst(1000, .1, .2, 'highpass'); },
    gib() {
        this.burst(400, .15, .4, 'lowpass'); this.tone(120, .1, .3, 'sawtooth', 60);
        this.burst(2000, .05, .2, 'highpass');
    },
    dash() { this.burst(1500, .1, .2, 'highpass'); this.tone(300, .08, .15, 'sine', 600); },
    painP() { this.tone(200, .2, .3, 'sawtooth', 100); },
};