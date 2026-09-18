import { R } from '../core/utils.js';
import { M, WEAPON_ART, mkPx } from './weaponArt.js';

export const SPR = {};

export function mkSpr(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); fn(g);
    const d = g.getImageData(0, 0, w, h).data, o = new Uint32Array(w * h);
    for (let i = 0; i < o.length; i++)o[i] = d[i * 4 + 3] > 120 ? (255 << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4] : 0;
    return { w, h, data: o };
}
export function flipSpr(s) {
    const { w, h, data } = s; const o = new Uint32Array(w * h);
    for (let y = 0; y < h; y++)for (let x = 0; x < w; x++)o[y * w + x] = data[y * w + (w - 1 - x)];
    return { w, h, data: o };
}

function tear(g, cx, cy, r, lobes, depth) {
    const n = lobes * 2;
    g.beginPath();
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + 0.4;
        const rr = (i % 2 === 0) ? r * (0.75 + R() * 0.4) : r * (0.75 - depth - R() * depth * 0.8);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
}
function shard(g, x, y, w, h, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 3); g.closePath(); g.fill();
    g.restore();
}
function mkMeatGib(suit, skin, hair, type) {
    return mkSpr(28, 28, g => {
        const meat = '#8a1a12', dark = '#5e0e08', bright = '#a02818', fat = '#d8c0a0', bone = '#e8e0c8';
        if (type === 0) {
            g.fillStyle = dark; tear(g, 14, 15, 12, 8, 0.45); g.fill();
            g.fillStyle = meat; tear(g, 14, 14, 9, 7, 0.4); g.fill();
            g.fillStyle = bright; tear(g, 11, 12, 4, 5, 0.5); g.fill();
            g.fillStyle = suit; tear(g, 18, 10, 6, 6, 0.5); g.fill();
            g.fillStyle = bone; shard(g, 19, 17, 5, 7, 0.6);
            g.fillStyle = fat; g.fillRect(7, 17, 5, 2); g.fillRect(15, 20, 4, 2);
            g.fillStyle = dark; tear(g, 9, 19, 3, 4, 0.6); g.fill();
        } else if (type === 1) {
            g.fillStyle = suit; tear(g, 8, 13, 7, 6, 0.5); g.fill();
            g.fillStyle = skin; tear(g, 18, 13, 8, 6, 0.35); g.fill();
            g.fillStyle = meat; tear(g, 4, 14, 4, 5, 0.6); g.fill();
            g.fillStyle = bone; shard(g, 3, 12, 4, 7, -0.5);
            g.fillStyle = dark; tear(g, 6, 17, 3, 4, 0.6); g.fill();
            g.fillStyle = skin; g.fillRect(24, 11, 3, 3);
        } else if (type === 2) {
            g.fillStyle = skin; tear(g, 14, 11, 8, 7, 0.3); g.fill();
            g.fillStyle = hair; tear(g, 14, 7, 7, 6, 0.45); g.fill();
            g.fillStyle = '#1a1a1a'; g.fillRect(10, 10, 2, 2); g.fillRect(16, 10, 2, 2);
            g.fillStyle = meat; tear(g, 14, 19, 6, 7, 0.6); g.fill();
            g.fillStyle = dark; tear(g, 14, 22, 4, 5, 0.6); g.fill();
            g.fillStyle = bone; shard(g, 18, 18, 3, 5, 0.8);
        } else if (type === 3) {
            g.fillStyle = dark; tear(g, 14, 15, 12, 9, 0.4); g.fill();
            g.fillStyle = meat; tear(g, 14, 14, 9, 8, 0.35); g.fill();
            g.fillStyle = bright; tear(g, 10, 13, 4, 5, 0.5); g.fill();
            g.fillStyle = fat; g.fillRect(7, 15, 7, 2); g.fillRect(16, 12, 5, 2);
            g.fillStyle = dark; tear(g, 19, 17, 3, 4, 0.6); g.fill();
            g.fillStyle = bone; shard(g, 8, 11, 3, 5, -0.4);
        } else {
            g.fillStyle = dark; tear(g, 14, 15, 11, 8, 0.45); g.fill();
            g.fillStyle = '#3a0805'; tear(g, 14, 15, 7, 7, 0.5); g.fill();
            g.strokeStyle = bone; g.lineWidth = 1.6;
            for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(14, 14, 3 + i * 2.4, 0.4, 2.6); g.stroke(); }
            g.fillStyle = meat; tear(g, 13, 8, 3, 4, 0.5); g.fill();
            g.fillStyle = bone; shard(g, 19, 19, 3, 5, 0.9);
        }
    });
}
function mkMetalGib(type) {
    return mkSpr(28, 28, g => {
        const dk = '#20262b', md = '#3a4048', lt = '#5a6068', gr = '#37ff6e';
        if (type === 0) {
            g.fillStyle = md; tear(g, 14, 14, 11, 6, 0.4); g.fill();
            g.fillStyle = lt; tear(g, 12, 11, 6, 5, 0.4); g.fill();
            g.fillStyle = dk; g.fillRect(9, 13, 4, 4); g.fillRect(16, 15, 4, 3);
            g.fillStyle = lt; g.fillRect(7, 9, 2, 2); g.fillRect(19, 10, 2, 2);
        } else if (type === 1) {
            g.fillStyle = lt;
            g.beginPath(); g.moveTo(3, 16); g.lineTo(14, 10); g.lineTo(25, 12); g.lineTo(15, 18); g.closePath(); g.fill();
            g.fillStyle = md; g.beginPath(); g.arc(14, 14, 3, 0, 7); g.fill();
            g.fillStyle = dk; g.beginPath(); g.arc(14, 14, 1.4, 0, 7); g.fill();
        } else if (type === 2) {
            g.fillStyle = dk; tear(g, 14, 14, 10, 5, 0.35); g.fill();
            g.strokeStyle = gr; g.lineWidth = 1;
            g.beginPath(); g.moveTo(8, 11); g.lineTo(14, 11); g.lineTo(14, 17); g.lineTo(20, 17); g.stroke();
            g.fillStyle = gr; g.fillRect(9, 13, 2, 2); g.fillRect(17, 14, 2, 2);
        } else {
            g.fillStyle = md; tear(g, 14, 14, 9, 5, 0.3); g.fill();
            g.fillStyle = gr; g.fillRect(10, 11, 8, 4);
            g.fillStyle = dk; g.fillRect(9, 17, 10, 3);
        }
    });
}

function hum(g, o) {
    const L = o.leg || '#2c2f38', S = o.suit || '#5a5f6b', Sk = o.skin || '#b9a693', H = o.hair || '#26221e';
    const f = o.frame ? 3 : 0;
    g.fillStyle = L; g.fillRect(14 + f, 44, 6, 20); g.fillRect(22 - f, 44, 6, 20);
    g.fillStyle = '#15161a'; g.fillRect(13 + f, 61, 8, 3); g.fillRect(21 - f, 61, 8, 3);
    g.fillStyle = S; g.fillRect(10, 22, 20, 24);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(10, 22, 4, 24);
    if (o.tie) { g.fillStyle = o.tie; g.fillRect(19, 23, 3, 13); }
    if (o.badge) { g.fillStyle = '#ffb454'; g.fillRect(12, 25, 4, 3); }
    g.fillStyle = Sk; g.fillRect(14, 6, 12, 13);
    g.fillStyle = H; g.fillRect(14, 4, 12, 5);
    g.fillStyle = '#1a1a1a'; g.fillRect(16, 11, 3, 3); g.fillRect(23, 11, 3, 3);
    if (o.glass) { g.fillStyle = '#cfe8ff'; g.fillRect(16, 11, 3, 2); g.fillRect(23, 11, 3, 2); g.fillRect(19, 11, 4, 1); }
    if (o.glowE) { g.fillStyle = '#ff2c1e'; g.fillRect(15, 10, 4, 3); g.fillRect(23, 10, 4, 3); }
    if (o.drip) { g.fillStyle = 'rgba(90,10,8,.85)'; g.fillRect(18, 17, 2, 4); }
    const hangL = () => { g.fillStyle = S; g.fillRect(4, 24, 6, 15); g.fillStyle = Sk; g.fillRect(4, 37, 5, 5); };
    if (o.biggun) {
        g.fillStyle = S; g.fillRect(6, 25, 9, 7); g.fillRect(25, 25, 9, 7);
        g.fillStyle = '#181c22';
        g.beginPath(); g.moveTo(13, 36); g.lineTo(27, 36); g.lineTo(25, 17); g.lineTo(15, 17); g.closePath(); g.fill();
        g.fillStyle = '#31363e'; g.fillRect(15, 21, 10, 3);
        g.fillStyle = '#0b0d0f'; g.beginPath(); g.arc(20, 17, 5, 0, 7); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(20, 17, 2.4, 0, 7); g.fill();
        g.fillStyle = Sk; g.beginPath(); g.arc(14, 35, 4.5, 0, 7); g.fill();
        g.beginPath(); g.arc(26, 35, 4.5, 0, 7); g.fill();
    } else if (o.ceogun) {
        hangL();
        g.fillStyle = '#3c1014'; g.fillRect(28, 23, 10, 8);
        g.fillStyle = '#c8a038';
        g.beginPath(); g.moveTo(29, 30); g.lineTo(40, 30); g.lineTo(38, 16); g.lineTo(31, 16); g.closePath(); g.fill();
        g.fillStyle = '#8a6a1c'; g.fillRect(31, 22, 7, 2);
        g.fillStyle = '#2a1c06'; g.beginPath(); g.arc(34.5, 16, 3.8, 0, 7); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(34.5, 16, 1.8, 0, 7); g.fill();
        g.fillStyle = '#c49a86'; g.beginPath(); g.arc(34, 31, 5, 0, 7); g.fill();
    } else if (o.gun) {
        hangL();
        g.fillStyle = S; g.fillRect(26, 25, 8, 6);
        g.fillStyle = '#20242b';
        g.beginPath(); g.moveTo(27, 32); g.lineTo(36, 32); g.lineTo(35, 22); g.lineTo(28, 22); g.closePath(); g.fill();
        g.fillStyle = '#0b0d0f'; g.beginPath(); g.arc(31.5, 22, 3.2, 0, 7); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(31.5, 22, 1.5, 0, 7); g.fill();
        g.fillStyle = Sk; g.beginPath(); g.arc(31, 33, 4.5, 0, 7); g.fill();
    } else if (o.blade) {
        hangL();
        g.fillStyle = S; g.fillRect(27, 18, 6, 12);
        g.fillStyle = '#c8ccd2'; g.fillRect(28.5, 3, 4, 13);
        g.fillStyle = '#eef1f4'; g.fillRect(28.5, 3, 1.5, 13);
        g.fillStyle = '#7a4437'; g.fillRect(27, 15, 7, 3);
        g.fillStyle = Sk; g.beginPath(); g.arc(30, 18, 4, 0, 7); g.fill();
    } else if (o.mop) {
        hangL();
        g.fillStyle = S; g.fillRect(27, 18, 6, 14);
        g.fillStyle = '#8a7a5a'; g.fillRect(29, 2, 3, 16);
        g.fillStyle = '#5a5a4a'; g.fillRect(25, 0, 11, 5);
        g.fillStyle = '#4a4a3a'; for (let i = 0; i < 5; i++)g.fillRect(25 + i * 2, 0, 1, 7);
        g.fillStyle = Sk; g.beginPath(); g.arc(30, 20, 4, 0, 7); g.fill();
    } else {
        hangL();
        g.fillStyle = S; g.fillRect(30, 24, 6, 15);
        g.fillStyle = Sk; g.fillRect(31, 37, 5, 5);
    }
}
function corpseSpr(o) {
    return mkSpr(56, 20, g => {
        g.fillStyle = 'rgba(90,8,6,.75)'; g.beginPath(); g.ellipse(28, 15, 24, 5, 0, 0, 7); g.fill();
        g.fillStyle = o.suit || '#5a5f6b'; g.fillRect(8, 6, 30, 10);
        g.fillStyle = o.leg || '#2c2f38'; g.fillRect(34, 8, 16, 5); g.fillRect(36, 12, 14, 4);
        g.fillStyle = o.skin || '#b9a693'; g.fillRect(2, 8, 9, 8); g.fillStyle = '#1a1a1a'; g.fillRect(4, 10, 2, 2);
        g.fillStyle = 'rgba(140,15,10,.9)'; g.fillRect(14, 4, 10, 4);
    });
}

export function buildSprites() {
    const mk = (key, w, h, fn) => SPR[key] = mkSpr(w, h, fn);
    for (const t of ['intern', 'manager', 'guard']) {
        const P = {
            intern: { suit: '#8a8f98', tie: '#a02018', leg: '#3a3d46' },
            manager: { suit: '#4d5260', tie: '#30343d', glass: 1, badge: 1, leg: '#26282f' },
            guard: { suit: '#252b31', leg: '#181c20', glass: 1, badge: 1 }
        }[t];
        mk(t, 40, 64, g => hum(g, { ...P, frame: 0, gun: t === 'manager', biggun: t === 'guard', blade: t === 'intern' }));
        mk(t + '2', 40, 64, g => hum(g, { ...P, frame: 1, gun: t === 'manager', biggun: t === 'guard', blade: t === 'intern' }));
        SPR[t + 'D'] = corpseSpr(P);
    }
    const janP = { suit: '#4a5a3a', leg: '#3a3a2a', mop: 1 };
    mk('janitor', 40, 64, g => hum(g, { ...janP, frame: 0 }));
    mk('janitor2', 40, 64, g => hum(g, { ...janP, frame: 1 }));
    SPR.janitorD = corpseSpr(janP);
    mk('drone', 32, 24, g => {
        g.fillStyle = '#3a4048'; g.beginPath(); g.ellipse(16, 14, 14, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#20262b'; g.fillRect(4, 10, 24, 6);
        g.fillStyle = '#ff4636'; g.beginPath(); g.arc(16, 12, 3, 0, 7); g.fill();
        g.fillStyle = '#1a1e22'; g.fillRect(2, 6, 6, 3); g.fillRect(24, 6, 6, 3);
        g.fillStyle = '#5a6068'; g.fillRect(0, 5, 4, 2); g.fillRect(28, 5, 4, 2);
        g.fillStyle = 'rgba(100,180,255,.4)'; g.beginPath(); g.arc(16, 18, 5, 0, 3.14); g.fill();
    });
    mk('drone2', 32, 24, g => {
        g.fillStyle = '#3a4048'; g.beginPath(); g.ellipse(16, 14, 14, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#20262b'; g.fillRect(4, 10, 24, 6);
        g.fillStyle = '#ffaa36'; g.beginPath(); g.arc(16, 12, 3, 0, 7); g.fill();
        g.fillStyle = '#1a1e22'; g.fillRect(2, 7, 6, 3); g.fillRect(24, 7, 6, 3);
        g.fillStyle = '#5a6068'; g.fillRect(0, 6, 4, 2); g.fillRect(28, 6, 4, 2);
        g.fillStyle = 'rgba(100,180,255,.3)'; g.beginPath(); g.arc(16, 18, 4, 0, 3.14); g.fill();
    });
    SPR.droneD = mkSpr(32, 16, g => {
        g.fillStyle = 'rgba(60,60,60,.8)'; g.fillRect(4, 4, 24, 10);
        g.fillStyle = '#ff4636'; g.fillRect(12, 6, 4, 3);
        g.fillStyle = 'rgba(40,40,40,.6)'; g.fillRect(8, 10, 16, 4);
    });
    const ceoDraw = frame => g => {
        g.save(); g.translate(8, 10);
        hum(g, { suit: '#3c1014', tie: '#ffb454', leg: '#20090b', skin: '#c49a86', glowE: 1, drip: 1, badge: 1, ceogun: 1, frame });
        g.fillStyle = '#3c1014'; g.fillRect(-2, 20, 8, 28); g.fillRect(34, 20, 8, 28);
        g.fillStyle = '#e8dcc0'; g.fillRect(12, -4, 5, 9); g.fillRect(23, -7, 5, 11); g.fillRect(34, -4, 5, 9);
        g.restore();
        g.fillStyle = '#ffb454'; g.fillRect(30, 36, 8, 8);
    };
    mk('ceo', 56, 88, ceoDraw(0));
    mk('ceo2', 56, 88, ceoDraw(1));
    SPR.ceoD = corpseSpr({ suit: '#3c1014', leg: '#20090b', skin: '#c49a86' });

    const meatSet = (suit, skin, hair) => {
        const arr = [];
        for (let t = 0; t < 5; t++) { const s = mkMeatGib(suit, skin, hair, t); arr.push({ a: s, b: flipSpr(s) }); }
        return arr;
    };
    SPR.gibSets = {
        intern: meatSet('#8a8f98', '#b9a693', '#26221e'),
        manager: meatSet('#4d5260', '#b9a693', '#26221e'),
        guard: meatSet('#252b31', '#b9a693', '#1a1a1a'),
        janitor: meatSet('#4a5a3a', '#b9a693', '#3a3a2a'),
        ceo: meatSet('#3c1014', '#c49a86', '#2a2a2a'),
    };
    const metalArr = [];
    for (let t = 0; t < 4; t++) { const s = mkMetalGib(t); metalArr.push({ a: s, b: flipSpr(s) }); }
    SPR.gibSets.drone = metalArr;

    mk('med', 24, 20, g => {
        g.fillStyle = '#dfe3da'; g.fillRect(2, 4, 20, 14); g.strokeStyle = '#8a8f88'; g.strokeRect(2, 4, 20, 14);
        g.fillStyle = '#c02018'; g.fillRect(10, 6, 4, 10); g.fillRect(7, 9, 10, 4);
    });
    mk('ammo', 22, 16, g => {
        g.fillStyle = '#3d4438'; g.fillRect(2, 3, 18, 11); g.fillStyle = '#ffb454';
        for (let i = 0; i < 4; i++)g.fillRect(4 + i * 4, 5, 2, 7); g.fillStyle = '#c8c2ae'; g.fillRect(2, 12, 18, 2);
    });
    mk('shell', 22, 14, g => {
        g.fillStyle = '#5d2020'; g.fillRect(2, 3, 18, 9); g.fillStyle = '#c8a038';
        for (let i = 0; i < 3; i++)g.fillRect(4 + i * 6, 4, 3, 7);
    });
    mk('rock', 24, 18, g => {
        g.fillStyle = '#4a3020'; g.fillRect(2, 4, 20, 11); g.fillStyle = '#c02018'; g.fillRect(2, 4, 20, 4);
        g.fillStyle = '#c8ccd2'; for (let i = 0; i < 3; i++)g.fillRect(5 + i * 6, 8, 3, 6);
    });
    mk('armor', 26, 24, g => {
        g.fillStyle = '#3a4a3c'; g.fillRect(4, 4, 18, 17); g.fillStyle = '#26301f'; g.fillRect(8, 2, 10, 5);
        g.fillStyle = '#4d604f'; g.fillRect(6, 8, 14, 10); g.fillStyle = '#ffb454'; g.fillRect(11, 11, 4, 4);
    });
    mk('key', 20, 14, g => {
        g.fillStyle = '#ff4636'; g.fillRect(2, 3, 16, 9); g.fillStyle = '#fff'; g.fillRect(4, 5, 5, 5);
        g.fillStyle = '#ff4636'; g.fillRect(5, 6, 3, 3); g.fillStyle = '#ffd028'; g.fillRect(12, 6, 4, 3);
    });
    mk('shotgunPick', 28, 12, g => {
        g.fillStyle = '#2c3138'; g.fillRect(2, 3, 20, 4); g.fillStyle = '#3c424a'; g.fillRect(4, 7, 14, 3);
        g.fillStyle = '#8a6a42'; g.fillRect(14, 2, 6, 5); g.fillStyle = '#ffb454'; g.fillRect(2, 4, 3, 2);
    });
    mk('staplerPick', 26, 16, g => {
        g.fillStyle = '#c02018'; g.fillRect(3, 3, 20, 7); g.fillStyle = '#8a8f98'; g.fillRect(3, 10, 20, 4);
        g.fillStyle = '#e8e2ce'; g.fillRect(6, 5, 14, 2);
    });
    mk('speed', 22, 22, g => {
        g.fillStyle = '#4de8ff'; g.beginPath(); g.moveTo(11, 2); g.lineTo(18, 11); g.lineTo(13, 11);
        g.lineTo(16, 20); g.lineTo(6, 10); g.lineTo(11, 10); g.closePath(); g.fill();
    });
    mk('damage', 22, 22, g => {
        g.fillStyle = '#ff4636'; g.beginPath(); g.arc(11, 11, 9, 0, 7); g.fill();
        g.fillStyle = '#ffd028'; g.font = 'bold 14px Arial'; g.textAlign = 'center'; g.fillText('×2', 11, 16);
    });
    mk('barrel', 28, 40, g => {
        g.fillStyle = '#7a2018'; g.fillRect(4, 4, 20, 34); g.fillStyle = '#a03020'; g.fillRect(6, 4, 6, 34);
        g.fillStyle = '#3c100c'; g.fillRect(4, 10, 20, 3); g.fillRect(4, 28, 20, 3);
        g.fillStyle = '#ffb454'; g.fillRect(9, 17, 10, 8); g.fillStyle = '#111'; g.font = '9px Arial'; g.fillText('☢', 11, 24);
    });
    mk('cooler', 26, 44, g => {
        g.fillStyle = '#b8bcc0'; g.fillRect(4, 14, 18, 28); g.fillStyle = '#7fb4d8'; g.fillRect(6, 2, 14, 13);
        g.fillStyle = '#3a4048'; g.fillRect(8, 20, 4, 4); g.fillStyle = '#c02018'; g.fillRect(15, 20, 4, 4);
    });
    mk('term', 30, 40, g => {
        g.fillStyle = '#3c4248'; g.fillRect(4, 16, 22, 22); g.fillStyle = '#20262b'; g.fillRect(6, 4, 18, 13);
        g.fillStyle = '#37ff6e'; g.fillRect(8, 6, 14, 9); g.fillStyle = '#0c3a18';
        for (let y = 7; y < 13; y += 2)g.fillRect(8, y, 14, 1); g.fillStyle = '#565c50'; g.fillRect(2, 36, 26, 3);
    });
    mk('flash', 24, 24, g => {
        const rg = g.createRadialGradient(12, 12, 1, 12, 12, 12);
        rg.addColorStop(0, 'rgba(255,255,220,1)'); rg.addColorStop(.4, 'rgba(255,190,80,.9)');
        rg.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = rg; g.fillRect(0, 0, 24, 24);
    });
    mk('proj', 10, 10, g => { g.fillStyle = '#ffdf80'; g.fillRect(2, 3, 6, 4); g.fillStyle = '#c02018'; g.fillRect(0, 4, 3, 2); });
    mk('projE', 12, 12, g => {
        const rg = g.createRadialGradient(6, 6, 1, 6, 6, 6); rg.addColorStop(0, '#ffd0c0');
        rg.addColorStop(.5, '#ff4636'); rg.addColorStop(1, 'rgba(120,10,5,0)'); g.fillStyle = rg; g.fillRect(0, 0, 12, 12);
    });
    mk('switch', 20, 30, g => {
        g.fillStyle = '#4a5058'; g.fillRect(4, 8, 12, 20); g.fillStyle = '#2a3038'; g.fillRect(6, 10, 8, 16);
        g.fillStyle = '#ffb454'; g.fillRect(8, 12, 4, 6); g.fillStyle = '#ff4636'; g.fillRect(8, 20, 4, 4);
    });

    const WS = 3;
    SPR.wm = WEAPON_ART.map(art => mkPx(art, M, WS));
    SPR.wmFlash = SPR.flash;
}