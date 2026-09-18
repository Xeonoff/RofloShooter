import { T, TEX } from '../core/config.js';
import { R, vnoise } from '../core/utils.js';

export const TEXD = [];

function px32(g) {
    const d = g.getImageData(0, 0, TEX, TEX).data, o = new Uint32Array(TEX * TEX);
    for (let i = 0; i < o.length; i++)o[i] = (255 << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4];
    return o;
}
function mkTex(fn) { const c = document.createElement('canvas'); c.width = c.height = TEX; const g = c.getContext('2d'); fn(g); return px32(g); }
function speck(g, n, col, a0, a1) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
        g.globalAlpha = a0 + R() * (a1 - a0);
        g.fillRect(R() * TEX | 0, R() * TEX | 0, 1 + R() * 2 | 0, 1 + R() * 2 | 0);
    }
    g.globalAlpha = 1;
}
function bloodOn(g, n) {
    for (let i = 0; i < n; i++) {
        const x = R() * TEX, y = R() * TEX, r = 2 + R() * 7;
        g.fillStyle = `rgba(${120 + R() * 50 | 0},10,8,${.35 + R() * .4})`;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        for (let k = 0; k < 5; k++)g.fillRect(x + (R() - .5) * r * 3, y + R() * r * 2, r * .4, 1 + R() * 4);
    }
}

export function buildTextures() {
    TEXD[T.CONC] = mkTex(g => {
        g.fillStyle = '#6d6d68'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++)for (let x = 0; x < 64; x++) {
            const n = vnoise(x / 9, y / 9) * 26 - 13;
            g.fillStyle = `rgb(${109 + n | 0},${109 + n | 0},${104 + n | 0})`; g.fillRect(x, y, 1, 1);
        }
        g.strokeStyle = '#4c4c48'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
        g.beginPath(); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke();
        speck(g, 60, '#3c3c38', .1, .4); g.strokeStyle = '#3a3a36';
        g.beginPath(); g.moveTo(18, 0); g.lineTo(26, 20); g.lineTo(20, 38); g.stroke();
    });
    TEXD[T.RUST] = mkTex(g => {
        g.fillStyle = '#5d4130'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++)for (let x = 0; x < 64; x++) {
            const n = vnoise(x / 6, y / 14);
            g.fillStyle = n > .62 ? `rgb(${140 + n * 50 | 0},${70 + n * 26 | 0},30)` : n < .3 ? '#3a2a20' : '#5d4130';
            g.fillRect(x, y, 1, 1);
        }
        g.fillStyle = '#2c2018'; for (let x = 4; x < 64; x += 8) { g.fillRect(x, 3, 2, 2); g.fillRect(x, 59, 2, 2); }
        g.fillStyle = 'rgba(210,120,50,.25)'; for (let i = 0; i < 7; i++)g.fillRect(R() * 64 | 0, 0, 1, 20 + R() * 40);
    });
    TEXD[T.PART] = mkTex(g => {
        g.fillStyle = '#7a8071'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 2) { g.fillStyle = y % 4 ? '#71776a' : '#82887a'; g.fillRect(0, y, 64, 2); }
        g.fillStyle = '#9aa092'; g.fillRect(0, 0, 64, 5); g.fillStyle = '#4d5247'; g.fillRect(0, 59, 64, 5);
        g.fillStyle = '#565c50'; g.fillRect(31, 5, 2, 54); speck(g, 40, '#3f443a', .1, .3);
    });
    TEXD[T.PAPER] = mkTex(g => {
        g.fillStyle = '#8f8a74'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++)for (let x = 0; x < 64; x += 2) {
            if (vnoise(x / 5, y / 5) > .7) { g.fillStyle = '#6e6a58'; g.fillRect(x, y, 2, 1); }
        }
        g.strokeStyle = '#7c7763'; for (let y = 10; y < 64; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
        bloodOn(g, 4); speck(g, 50, '#54503f', .1, .35);
    });
    TEXD[T.SERVER] = mkTex(g => {
        g.fillStyle = '#14171b'; g.fillRect(0, 0, 64, 64);
        for (let u = 0; u < 4; u++) {
            const y = u * 16; g.fillStyle = '#1d2127'; g.fillRect(2, y + 2, 60, 12);
            g.strokeStyle = '#0a0c0e'; g.strokeRect(2, y + 2, 60, 12);
            g.fillStyle = '#0c0e10'; for (let v = 0; v < 6; v++)g.fillRect(6 + v * 9, y + 5, 6, 2);
            g.fillStyle = R() < .7 ? '#37ff6e' : '#ffb03a'; g.fillRect(56, y + 5, 3, 3);
            g.fillStyle = R() < .5 ? '#37ff6e' : '#173a20'; g.fillRect(56, y + 10, 3, 3);
        }
    });
    TEXD[T.SHELF] = mkTex(g => {
        g.fillStyle = '#241c14'; g.fillRect(0, 0, 64, 64);
        for (let r = 0; r < 4; r++) {
            const y = r * 16; const cols = ['#6b5a44', '#4a5568', '#5d3a2e', '#3f4a3c', '#6e6355', '#7a4437'];
            for (let b = 0; b < 8; b++) { g.fillStyle = cols[(b + r * 3) % 6]; const h = 9 + R() * 5 | 0; g.fillRect(3 + b * 8, y + 14 - h, 6, h); }
            g.fillStyle = '#3a2d20'; g.fillRect(0, y + 14, 64, 2);
        }
    });
    TEXD[T.TILE] = mkTex(g => {
        g.fillStyle = '#96a09a'; g.fillRect(0, 0, 64, 64);
        for (let ty = 0; ty < 4; ty++)for (let tx = 0; tx < 4; tx++) {
            const n = R() * 14 - 7;
            g.fillStyle = `rgb(${150 + n | 0},${160 + n | 0},${154 + n | 0})`; g.fillRect(tx * 16 + 1, ty * 16 + 1, 14, 14);
        }
        g.strokeStyle = '#5c665f'; g.lineWidth = 2;
        for (let i = 0; i <= 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
        speck(g, 80, '#49524c', .1, .4); bloodOn(g, 2);
    });
    TEXD[T.GORE] = mkTex(g => {
        g.fillStyle = '#4a3130'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++)for (let x = 0; x < 64; x++) {
            if (vnoise(x / 7, y / 7) > .66) { g.fillStyle = '#6e2a24'; g.fillRect(x, y, 1, 1); }
        }
        bloodOn(g, 8); g.fillStyle = 'rgba(230,220,200,.5)';
        for (let i = 0; i < 5; i++)g.fillRect(R() * 60 | 0, R() * 60 | 0, 1 + R() * 3, 1);
    });
    TEXD[T.VENT] = mkTex(g => {
        g.fillStyle = '#3b4046'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 8) { g.fillStyle = y % 16 ? '#31363b' : '#454b52'; g.fillRect(0, y, 64, 8); }
        g.fillStyle = '#14171a'; for (let y = 6; y < 64; y += 16)for (let x = 4; x < 64; x += 8)g.fillRect(x, y, 5, 3);
        g.fillStyle = '#5d4130'; g.fillRect(0, 0, 3, 64); speck(g, 40, '#22262a', .2, .5);
    });
    TEXD[T.WOOD] = mkTex(g => {
        g.fillStyle = '#5a4632'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++) {
            const n = vnoise(0.5, y / 3) * 20;
            g.fillStyle = `rgb(${90 + n | 0},${70 + n | 0},${50 + n | 0})`; g.fillRect(0, y, 64, 1);
        }
        g.strokeStyle = '#3c2e20'; for (let x = 0; x <= 64; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); }
    });
    TEXD[T.DOOR] = mkTex(g => {
        g.fillStyle = '#687078'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#7b838c'; g.fillRect(4, 4, 56, 56);
        g.strokeStyle = '#3c4248'; g.lineWidth = 3; g.strokeRect(4, 4, 56, 56);
        g.fillStyle = '#3c4248'; g.fillRect(4, 30, 56, 4);
        g.fillStyle = '#ffb454'; g.fillRect(8, 52, 10, 6); g.fillStyle = '#111'; g.fillRect(50, 30, 4, 10);
        g.fillStyle = '#9aa2ab'; g.fillRect(26, 8, 12, 16); g.fillStyle = '#20262b'; g.fillRect(28, 10, 8, 12);
    });
    TEXD[T.LDOOR] = mkTex(g => {
        g.fillStyle = '#5c2a28'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#703230'; g.fillRect(4, 4, 56, 56);
        g.strokeStyle = '#301414'; g.lineWidth = 3; g.strokeRect(4, 4, 56, 56);
        g.fillStyle = '#111'; for (let i = -1; i < 5; i++) { g.save(); g.translate(i * 16, 0); g.rotate(.6); g.fillRect(0, -8, 8, 90); g.restore(); }
        g.fillStyle = '#ff4636'; g.fillRect(24, 26, 16, 12); g.fillStyle = '#111'; g.fillRect(29, 29, 6, 4); g.fillRect(30, 33, 4, 5);
    });
    TEXD[T.FCARP] = mkTex(g => {
        g.fillStyle = '#4c4a44'; g.fillRect(0, 0, 64, 64);
        speck(g, 500, '#3c3a35', .15, .5); speck(g, 200, '#5c5a52', .1, .35); bloodOn(g, 1);
    });
    TEXD[T.FLIN] = mkTex(g => {
        g.fillStyle = '#77746a'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 16) { g.fillStyle = '#6c6960'; g.fillRect(0, y, 64, 2); }
        speck(g, 160, '#57544c', .1, .4); g.fillStyle = 'rgba(255,180,80,.06)'; g.fillRect(8, 8, 48, 48);
    });
    TEXD[T.FMET] = mkTex(g => {
        g.fillStyle = '#3f444a'; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 8) { g.fillStyle = y % 16 ? '#383d42' : '#474d54'; g.fillRect(0, y, 64, 8); }
        g.fillStyle = '#22262a'; for (let y = 4; y < 64; y += 16)for (let x = 4; x < 64; x += 16)g.fillRect(x, y, 3, 3);
        g.fillStyle = 'rgba(150,80,40,.3)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(R() * 64, R() * 64, 2 + R() * 4, 0, 7); g.fill(); }
    });
    TEXD[T.FTILE] = mkTex(g => {
        g.fillStyle = '#7d857e'; g.fillRect(0, 0, 64, 64);
        g.strokeStyle = '#545c55'; g.lineWidth = 2;
        for (let i = 0; i <= 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
        speck(g, 240, '#454d46', .1, .45); g.fillStyle = 'rgba(60,50,30,.25)';
        for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(R() * 64, R() * 64, 3 + R() * 6, 0, 7); g.fill(); }
    });
    TEXD[T.FPAPER] = mkTex(g => {
        g.fillStyle = '#57534a'; g.fillRect(0, 0, 64, 64); speck(g, 300, '#47433b', .2, .5);
        g.fillStyle = '#c9c4b0'; for (let i = 0; i < 14; i++) {
            g.save(); g.translate(R() * 64, R() * 64); g.rotate(R() * 3);
            g.globalAlpha = .5 + R() * .4; g.fillRect(-3, -2, 6, 4); g.restore();
        }
        g.globalAlpha = 1;
    });
    TEXD[T.FBLOOD] = mkTex(g => {
        g.fillStyle = '#3c2b28'; g.fillRect(0, 0, 64, 64); speck(g, 300, '#2c1e1c', .2, .5);
        bloodOn(g, 7); g.fillStyle = 'rgba(160,40,30,.35)';
        for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(R() * 64, R() * 64, 4 + R() * 8, 0, 7); g.fill(); }
    });
    TEXD[T.CCONC] = mkTex(g => {
        g.fillStyle = '#4a4a46'; g.fillRect(0, 0, 64, 64);
        g.strokeStyle = '#383834'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
        speck(g, 120, '#3a3a36', .15, .45); g.fillStyle = '#585854'; g.fillRect(28, 28, 8, 8);
    });
    TEXD[T.CDARK] = mkTex(g => {
        g.fillStyle = '#22242a'; g.fillRect(0, 0, 64, 64); speck(g, 90, '#181a1e', .2, .5);
        g.fillStyle = '#31343a'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 32, 64, 3);
    });
    TEXD[T.CMET] = mkTex(g => {
        g.fillStyle = '#2c3136'; g.fillRect(0, 0, 64, 64);
        for (let x = 0; x < 64; x += 16) { g.fillStyle = '#262b2f'; g.fillRect(x, 0, 2, 64); }
        speck(g, 80, '#1c2024', .2, .5); g.fillStyle = 'rgba(120,140,160,.12)'; g.fillRect(20, 20, 24, 24);
    });
    TEXD[T.COFF] = mkTex(g => {
        g.fillStyle = '#565650'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#42423c'; g.lineWidth = 2;
        for (let i = 0; i <= 64; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
        g.fillStyle = '#b8c4b0'; g.fillRect(20, 20, 24, 24); g.fillStyle = '#e8f4dc'; g.fillRect(23, 23, 18, 18);
    });

    const splat = () => mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        for (let i = 0; i < 26; i++) {
            const a = R() * 6.3, r = R() * 22, x = 32 + Math.cos(a) * r, y = 32 + Math.sin(a) * r;
            g.fillStyle = `rgba(${130 + R() * 60 | 0},8,6,${.5 + R() * .5})`;
            g.beginPath(); g.arc(x, y, 1.5 + R() * 6, 0, 7); g.fill();
        }
        g.fillStyle = 'rgba(150,12,8,.85)'; g.beginPath(); g.arc(32, 32, 7 + R() * 5, 0, 7); g.fill();
        for (let i = 0; i < 8; i++)g.fillRect(30 + R() * 4, 32, 2, 10 + R() * 18);
    });
    TEXD[T.DBLOOD] = splat(); TEXD[T.DBLOOD + 10] = splat(); TEXD[T.DBLOOD + 20] = splat();
    TEXD[T.DHOLE] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(10,10,10,.9)'; g.beginPath(); g.arc(32, 32, 4, 0, 7); g.fill();
        g.strokeStyle = 'rgba(20,20,20,.7)'; for (let i = 0; i < 6; i++) {
            const a = R() * 6.3;
            g.beginPath(); g.moveTo(32, 32);
            g.lineTo(32 + Math.cos(a) * (8 + R() * 10), 32 + Math.sin(a) * (8 + R() * 10)); g.stroke();
        }
        g.fillStyle = 'rgba(60,60,60,.5)'; g.beginPath(); g.arc(31, 31, 5.5, 0, 7); g.fill();
    });
    TEXD[T.DSCORCH] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        const rg = g.createRadialGradient(32, 32, 2, 32, 32, 30);
        rg.addColorStop(0, 'rgba(5,5,5,.95)'); rg.addColorStop(.6, 'rgba(15,12,10,.6)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    });
    TEXD[T.DPUDDLE] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(90,6,4,.85)'; g.beginPath(); g.ellipse(32, 34, 26, 16, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(150,16,10,.7)'; g.beginPath(); g.ellipse(26, 30, 12, 7, .4, 0, 7); g.fill();
        g.fillStyle = 'rgba(220,60,40,.35)'; g.beginPath(); g.ellipse(38, 28, 5, 3, 0, 0, 7); g.fill();
    });
    TEXD[T.DTOXIC] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(40,180,60,.6)'; g.beginPath(); g.ellipse(32, 34, 28, 18, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(80,220,80,.4)'; g.beginPath(); g.ellipse(24, 28, 10, 6, .3, 0, 7); g.fill();
    });
    TEXD[T.DELEC] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.strokeStyle = 'rgba(100,180,255,.8)'; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            g.beginPath(); let x = 10 + R() * 44, y = 5; g.moveTo(x, y);
            for (let s = 0; s < 5; s++) { x += (R() - .5) * 16; y += 12; g.lineTo(x, y); } g.stroke();
        }
    });
    TEXD[T.DGIB] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(140,20,12,.8)';
        for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(20 + R() * 24, 20 + R() * 24, 2 + R() * 5, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(200,180,160,.6)'; g.fillRect(28, 26, 8, 3); g.fillRect(34, 30, 3, 7);
    });
    TEXD[T.DTRAIL] = mkTex(g => {
        g.clearRect(0, 0, 64, 64);
        g.fillStyle = 'rgba(100,8,5,.6)';
        g.beginPath(); g.ellipse(32, 32, 20, 8, .3, 0, 7); g.fill();
        g.fillStyle = 'rgba(140,15,10,.4)';
        for (let i = 0; i < 5; i++)g.fillRect(12 + i * 8, 28 + R() * 8, 4, 2 + R() * 4);
    });
    const prop = (lines, bg, fg) => mkTex(g => {
        g.fillStyle = bg; g.fillRect(0, 0, 64, 64);
        g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(3, 3, 58, 58);
        g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
        const fs = lines.length > 1 ? 13 : 16; g.font = `900 ${fs}px Arial Black,Arial`;
        lines.forEach((l, i) => g.fillText(l, 32, 32 + (i - (lines.length - 1) / 2) * 15));
    });
    TEXD[T.DPROP] = prop(['ПОДЧИНЯЙСЯ'], '#c8c2ae', '#7a1410');
    TEXD[T.DPROP + 1] = prop(['ТРУД', '=', 'ПОРЯДОК'], '#7a1410', '#e8e2ce');
    TEXD[T.DPROP + 2] = prop(['СДАЧА', 'КРОВИ', 'ОБЯЗАТЕЛЬНА'], '#c8c2ae', '#20301c');
    TEXD[T.DPROP + 3] = prop(['НЕ', 'ОГЛЯДЫ-', 'ВАЙСЯ'], '#20241f', '#c8c2ae');
    TEXD[T.DPROP + 4] = prop(['ЦЕХ →'], '#c8c2ae', '#7a1410');
}