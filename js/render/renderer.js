import { TEX, SHN, MW, MH, EYE, PLANE, T, SOLID, EMPTY, VID } from '../core/config.js';
import { clamp, R, vnoise } from '../core/utils.js';
import { grid, zoneGrid, bloodGrid, toxicGrid, elecGrid, wallBlood, doorIdx, doors } from '../world/grid.js';
import { ZONES } from '../world/zones.js';
import { TEXD } from '../assets/textureGen.js';
import { SPR } from '../assets/spriteGen.js';
import { Lights } from './lights.js';
import { WEAPONS } from '../game/weaponDefs.js';
import { Player } from '../game/player.js';
import { Settings } from '../core/settings.js';

export const view = document.getElementById('view');
view.width = 640; view.height = 400;
export const vctx = view.getContext('2d'); vctx.imageSmoothingEnabled = false;
export const scene = document.createElement('canvas');
export const sctx = scene.getContext('2d');

let img = null, buf = null, zbuf = null, vig = null;

const NOISE = new Int8Array(4096);
for (let i = 0; i < 4096; i++) NOISE[i] = (R() * 2 - 1) * 127 | 0;

const LR = new Uint8Array(SHN * 256), LG = new Uint8Array(SHN * 256), LB = new Uint8Array(SHN * 256);
for (let l = 0; l < SHN; l++) {
    const f = Math.pow(l / (SHN - 1), 1.22);
    for (let v = 0; v < 256; v++) { LR[l * 256 + v] = v * f; LG[l * 256 + v] = v * f * .985; LB[l * 256 + v] = v * f * .93; }
}

export const Renderer = {
    horizon: 100, flash: 0, shake: 0, frame: 0, hitstop: 0,
    _pool: new Array(256), _sn: 0,

    setResolution(w, h) {
        VID.w = w; VID.h = h;
        scene.width = w; scene.height = h;
        sctx.imageSmoothingEnabled = false;
        img = sctx.createImageData(w, h);
        buf = new Uint32Array(img.data.buffer);
        zbuf = new Float32Array(w);
        vig = new Float32Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const dx = (x - w / 2) / (w * .62), dy = (y - h / 2) / (h * .66);
            let v = 1 - clamp((dx * dx + dy * dy) * .85, 0, .72); if (y & 1) v *= .86;
            vig[y * w + x] = v;
        }
    },

    // Вызывается из Game.tick: затухания и счётчик анимаций привязаны к игровому времени,
    // а не к частоте кадров монитора.
    updateFX(dt) {
        const k = dt * 60;
        this.flash *= Math.pow(0.82, k);
        this.shake *= Math.pow(0.86, k);
        if (this.hitstop > 0) this.hitstop -= dt;
        this.frame++;
    },

    beginSprites() { this._sn = 0; },
    addSprite(tex, x, y, sH, zB, flash) {
        if (this._sn >= 256) return;
        let s = this._pool[this._sn];
        if (!s) { s = { tex: null, x: 0, y: 0, sH: 0, zB: 0, flash: 0 }; this._pool[this._sn] = s; }
        s.tex = tex; s.x = x; s.y = y; s.sH = sH; s.zB = zB; s.flash = flash || 0; this._sn++;
    },

    _cr: { dist: 0, tile: 0, mapX: 0, mapY: 0, side: 0, wallX: 0 },
    cast(ox, oy, dx, dy, maxD) {
        const h = this._cr; let mapX = ox | 0, mapY = oy | 0;
        const ddx = Math.abs(1 / (dx || 1e-9)), ddy = Math.abs(1 / (dy || 1e-9));
        let stx, sty, sdx, sdy;
        if (dx < 0) { stx = -1; sdx = (ox - mapX) * ddx; } else { stx = 1; sdx = (mapX + 1 - ox) * ddx; }
        if (dy < 0) { sty = -1; sdy = (oy - mapY) * ddy; } else { sty = 1; sdy = (mapY + 1 - oy) * ddy; }
        let side = 0, g = 0;
        while (g++ < 96) {
            if (sdx < sdy) { sdx += ddx; mapX += stx; side = 0; } else { sdy += ddy; mapY += sty; side = 1; }
            if (mapX < 0 || mapY < 0 || mapX >= MW || mapY >= MH) { h.dist = maxD || 60; h.tile = T.CONC; h.mapX = mapX; h.mapY = mapY; h.side = side; h.wallX = 0; return h; }
            const t = grid[mapY * MW + mapX];
            if (t === EMPTY || !SOLID[t]) continue;
            const perp = side === 0 ? sdx - ddx : sdy - ddy;
            if (maxD && perp > maxD) return null;
            let wx = side === 0 ? oy + perp * dy : ox + perp * dx; wx -= wx | 0;
            const di = doorIdx[mapY * MW + mapX];
            if (di >= 0) { const dr = doors[di]; if (dr && dr.open > 0.02 && wx < dr.open) continue; }
            h.dist = perp; h.tile = t; h.mapX = mapX; h.mapY = mapY; h.side = side; h.wallX = wx; return h;
        }
        h.dist = maxD || 60; h.tile = T.CONC; h.mapX = mapX; h.mapY = mapY; h.side = side; h.wallX = 0; return h;
    },
    los(x0, y0, x1, y1) {
        const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
        const h = this.cast(x0, y0, dx / d, dy / d, d); return !h || h.dist >= d - .15;
    },
    _h: { d: 0, t: 0, mx: 0, my: 0, side: 0, wx: 0, doorOpen: 0, sec: 0 },
    castRayInline(px, py, rdx, rdy) {
        const h = this._h; let mapX = px | 0, mapY = py | 0;
        const ddx = Math.abs(1 / (rdx || 1e-9)), ddy = Math.abs(1 / (rdy || 1e-9));
        let stx, sty, sdx, sdy;
        if (rdx < 0) { stx = -1; sdx = (px - mapX) * ddx; } else { stx = 1; sdx = (mapX + 1 - px) * ddx; }
        if (rdy < 0) { sty = -1; sdy = (py - mapY) * ddy; } else { sty = 1; sdy = (mapY + 1 - py) * ddy; }
        let side = 0, g = 0; h.doorOpen = 0; h.sec = 0;
        while (g++ < 96) {
            if (sdx < sdy) { sdx += ddx; mapX += stx; side = 0; } else { sdy += ddy; mapY += sty; side = 1; }
            if (mapX < 0 || mapY < 0 || mapX >= MW || mapY >= MH) { h.d = 60; h.t = T.CONC; h.mx = mapX; h.my = mapY; h.side = side; h.wx = 0; return h; }
            const t = grid[mapY * MW + mapX];
            if (t === EMPTY || !SOLID[t]) continue;
            const perp = side === 0 ? sdx - ddx : sdy - ddy;
            let wx = side === 0 ? py + perp * rdy : px + perp * rdx; wx -= wx | 0;
            const di = doorIdx[mapY * MW + mapX];
            if (di >= 0) {
                const dr = doors[di]; if (dr.secret) h.sec = 1;
                if (dr.open > 0.02 && wx < dr.open) continue; h.doorOpen = dr.open;
            }
            h.d = perp; h.t = t; h.mx = mapX; h.my = mapY; h.side = side; h.wx = wx; return h;
        }
        h.d = 60; h.t = T.CONC; h.mx = mapX; h.my = mapY; h.side = side; h.wx = 0; return h;
    },

    renderWorld(P, parts, decals) {
        if (this.hitstop > 0) return;
        const W = VID.w, H = VID.h, sc2 = H / 200;
        const shy = (R() - .5) * this.shake * 8 * sc2;
        const hz = clamp((H >> 1) + P.pitch * sc2 + P.bobY * .5 * sc2 + shy, 10, H - 10) | 0;
        this.horizon = hz;
        const dirX = Math.cos(P.yaw), dirY = Math.sin(P.yaw);
        const plX = -dirY * PLANE, plY = dirX * PLANE;
        const eyeZ = EYE + P.z, boost = this.flash * 1.1;
        this.renderFloorCeil(P, dirX, dirY, plX, plY, hz, eyeZ, boost);
        this.renderWalls(P, dirX, dirY, plX, plY, hz, boost);
        this.renderEnts(P, hz, dirX, dirY, plX, plY, decals, parts);
        // пост-процесс: зерно с интенсивностью из настроек
        const grain = ((P.hp < 30 ? 26 : 16) * Settings.grain) | 0;
        const nOff = (this.frame * 7919) & 4095;
        for (let i = 0; i < buf.length; i++) {
            const c = buf[i], v = vig[i];
            const n = grain ? (NOISE[(i * 13 + nOff) & 4095] * grain) >> 8 : 0;
            let r = (c & 255) * v + n, g = ((c >>> 8) & 255) * v + n, b = ((c >>> 16) & 255) * v + n;
            buf[i] = 0xff000000 | (b < 0 ? 0 : b > 255 ? 255 : b) << 16 | (g < 0 ? 0 : g > 255 ? 255 : g) << 8 | (r < 0 ? 0 : r > 255 ? 255 : r);
        }
        // оружие (масштабируется под внутреннее разрешение)
        const w = WEAPONS[P.wSlot];
        if (P.owned[P.wSlot] && !P.dead) {
            const wc = SPR.wm[P.wSlot];
            const sc = W / 320;
            const bobX = P.swayX + P.bobX * 1.4 + Math.sin(this.frame / 54) * 1.2;
            const bobY = Math.abs(P.bobY) * 1.2 + P.kick * 18 +
                (P.reloadT > 0 ? 40 * (P.reloadT / w.rl) : 0) + Math.cos(this.frame / 42) * .8;
            const px2 = W / 2 + bobX * sc;
            const py2 = H + (4 + bobY) * sc;
            const tilt = P.swayX * 0.006 + Math.sin(this.frame / 54) * 0.012;
            sctx.putImageData(img, 0, 0);
            sctx.save();
            sctx.translate(px2, py2);
            sctx.rotate(tilt);
            sctx.scale(sc, sc);
            sctx.drawImage(wc, -wc.width / 2, -wc.height);
            sctx.restore();
            if (P.muzzle > 0 && !w.melee) this.blitFlash(px2, py2 - (wc.height - w.my) * sc, sc);
        } else {
            sctx.putImageData(img, 0, 0);
        }
    },

    blitFlash(cx, cy, sc) {
        const t = SPR.wmFlash, d = t.data, tw = t.w, th = t.h;
        const hw = tw * sc / 2, hh = th * sc / 2;
        const x0 = Math.max(0, (cx - hw) | 0), y0 = Math.max(0, (cy - hh) | 0);
        const x1 = Math.min(VID.w, Math.ceil(cx + hw)), y1 = Math.min(VID.h, Math.ceil(cy + hh));
        for (let dy = y0; dy < y1; dy++) {
            const sy = ((dy - (cy - hh)) / sc) | 0;
            if (sy < 0 || sy >= th) continue;
            const ro = dy * VID.w, so = sy * tw;
            for (let dx = x0; dx < x1; dx++) {
                const sx = ((dx - (cx - hw)) / sc) | 0;
                if (sx < 0 || sx >= tw) continue;
                const c = d[so + sx]; if (!c) continue;
                const o = ro + dx, b = buf[o];
                let r = (b & 255) + (c & 255), g = ((b >>> 8) & 255) + ((c >>> 8) & 255), bl = ((b >>> 16) & 255) + ((c >>> 16) & 255);
                buf[o] = 0xff000000 | (bl > 255 ? 255 : bl) << 16 | (g > 255 ? 255 : g) << 8 | (r > 255 ? 255 : r);
            }
        }
    },

    renderFloorCeil(P, dirX, dirY, plX, plY, hz, eyeZ, boost) {
        const W = VID.w, H = VID.h, br = Settings.brightness, tf = this.frame;
        const r0x = dirX - plX, r0y = dirY - plY, r1x = dirX + plX, r1y = dirY + plY;
        const px = P.x, py = P.y;
        for (let y = hz + 1; y < H; y++) {
            const p = y - hz, rowD = eyeZ * H / p;
            const stX = rowD * (r1x - r0x) / W, stY = rowD * (r1y - r0y) / W;
            let fx = px + rowD * r0x, fy = py + rowD * r0y;
            for (let x = 0; x < W; x++) {
                const cx = fx | 0, cy = fy | 0; fx += stX; fy += stY;
                const inb = cx >= 0 && cy >= 0 && cx < MW && cy < MH, ci = inb ? cy * MW + cx : 0;
                const z = inb ? zoneGrid[ci] : 4, zn = ZONES[z];
                let lv = ((zn.li + boost - rowD * zn.fo) * br * SHN) | 0;
                lv = lv < 0 ? 0 : lv >= SHN ? SHN - 1 : lv; const lo = lv * 256;
                const c = TEXD[zn.fl][((fy * TEX) & 63) * TEX + ((fx * TEX) & 63)];
                let rr = c & 255, gg = (c >>> 8) & 255, bb = (c >>> 16) & 255;
                if (inb && bloodGrid[ci] > 0) {
                    const n = .55 + .45 * (NOISE[(((fx * 9) | 0) * 31 + ((fy * 9) | 0) * 57) & 4095] / 127);
                    const bl = bloodGrid[ci] * n;
                    rr += (92 - rr) * bl; gg += (10 - gg) * bl; bb += (8 - bb) * bl;
                }
                // КИСЛОТА: процедурные лужи отходов — неровная маска слизи, медленный дрейф,
                // пульсирующее свечение и пузыри. Анимация от игрового счётчика (не от герцовки).
                if (inb && toxicGrid[ci] > 0) {
                    const tox = toxicGrid[ci];
                    const sl = vnoise(fx * 1.15 + 3.7, fy * 1.15 + 1.3);
                    const sl2 = vnoise(fx * 0.5 + tf * 0.004, fy * 0.5 - tf * 0.003);
                    const liq = clamp((sl * 0.7 + sl2 * 0.6 - 0.42) * 2.6, 0, 1) * tox;
                    if (liq > 0.02) {
                        const glow = 0.62 + 0.3 * Math.sin(tf * 0.1 + sl * 11);
                        rr += (26 - rr) * liq * 0.5;
                        gg += (150 - gg) * liq * 0.6 * glow;
                        bb += (42 - bb) * liq * 0.42;
                        const bub = vnoise(fx * 4.3 + tf * 0.05, fy * 4.3 - tf * 0.038);
                        if (bub > 0.72) {
                            const bf = (bub - 0.72) * 3.4 * liq;
                            rr += (115 - rr) * bf; gg += (235 - gg) * bf; bb += (115 - bb) * bf;
                        }
                    }
                }
                // ЭЛЕКТРОПОЛ: токопроводящие швы по стыкам плиток + ползущие дуги + случайные импульсы
                if (inb && elecGrid[ci] > 0) {
                    const el = elecGrid[ci];
                    const fxf = fx - Math.floor(fx), fyf = fy - Math.floor(fy);
                    const lx = Math.min(fxf, 1 - fxf), ly = Math.min(fyf, 1 - fyf);
                    const strip = clamp(1 - Math.min(lx, ly) * 7, 0, 1);
                    const a1 = vnoise(fx * 2.6 + tf * 0.05, fy * 2.6 - tf * 0.041);
                    const fil = clamp((a1 - 0.58) * 4.5, 0, 1);
                    const surge = NOISE[((cx * 97 + cy * 131 + (((tf * 0.55) | 0) * 7)) & 4095)] > 55 ? 1 : 0;
                    const base = 0.2 + strip * 0.42;
                    rr += (36 - rr) * el * base * 0.5;
                    gg += (115 - gg) * el * base * 0.62;
                    bb += (195 - bb) * el * base * 0.85;
                    const hot = fil * (0.45 + surge * 0.55) * el;
                    rr += (175 - rr) * hot; gg += (228 - gg) * hot; bb += (255 - bb) * hot;
                }
                if (Lights.list.length > 0 && inb) {
                    const pl = Lights.getLight(fx, fy, 0); rr += pl.r * 80; gg += pl.g * 80; bb += pl.b * 80;
                }
                buf[y * W + x] = 0xff000000 | LB[lo + (bb > 255 ? 255 : bb | 0)] << 16 | LG[lo + (gg > 255 ? 255 : gg | 0)] << 8 | LR[lo + (rr > 255 ? 255 : rr | 0)];
            }
        }
        const cH = Math.max(.08, 1 - eyeZ);
        for (let y = 0; y < hz; y++) {
            const p = hz - y, rowD = cH * H / p;
            const stX = rowD * (r1x - r0x) / W, stY = rowD * (r1y - r0y) / W;
            let fx = px + rowD * r0x, fy = py + rowD * r0y;
            for (let x = 0; x < W; x++) {
                const cx = fx | 0, cy = fy | 0; fx += stX; fy += stY;
                const z = (cx >= 0 && cy >= 0 && cx < MW && cy < MH) ? zoneGrid[cy * MW + cx] : 4, zn = ZONES[z];
                let lv = ((zn.li * .9 + boost - rowD * zn.fo) * br * SHN) | 0;
                lv = lv < 0 ? 0 : lv >= SHN ? SHN - 1 : lv; const lo = lv * 256;
                const c = TEXD[zn.cl][((fy * TEX) & 63) * TEX + ((fx * TEX) & 63)];
                buf[y * W + x] = 0xff000000 | LB[lo + ((c >>> 16) & 255)] << 16 | LG[lo + ((c >>> 8) & 255)] << 8 | LR[lo + (c & 255)];
            }
        }
    },

    renderWalls(P, dirX, dirY, plX, plY, hz, boost) {
        const W = VID.w, H = VID.h, br = Settings.brightness;
        const px = P.x, py = P.y;
        for (let x = 0; x < W; x++) {
            const camX = 2 * x / W - 1;
            const rdx = dirX + plX * camX, rdy = dirY + plY * camX;
            const h = this.castRayInline(px, py, rdx, rdy);
            const perp = h.d < .02 ? .02 : h.d; zbuf[x] = perp;
            const lineH = (H / perp) | 0;
            const dS = (hz - lineH / 2 + P.z * (H / perp)) | 0;
            const y0 = dS < 0 ? 0 : dS, y1 = dS + lineH > H ? H : dS + lineH;
            const z = (h.mx >= 0 && h.my >= 0 && h.mx < MW && h.my < MH) ? zoneGrid[h.my * MW + h.mx] : 4, zn = ZONES[z];
            let li = zn.li + boost - (h.side ? .13 : 0);
            if (Player.flashlight) {
                const angDiff = Math.abs(camX);
                if (angDiff < 0.3) li += 0.3 * (1 - angDiff / 0.3) * (1 - perp / 12);
            }
            let lv = ((li - perp * zn.fo) * br * SHN) | 0;
            lv = lv < 0 ? 0 : lv >= SHN ? SHN - 1 : lv; const lo = lv * 256;
            let t = h.t;
            if (t !== T.LDOOR && (t === T.DOOR || (h.sec && h.doorOpen > 0.02))) t = T.DOOR;
            const td = TEXD[t] || TEXD[T.CONC];
            let wx = h.wx; if (h.doorOpen > 0) wx -= h.doorOpen;
            let tx = (wx * TEX) | 0; if ((h.side === 0 && rdx > 0) || (h.side === 1 && rdy < 0)) tx = TEX - 1 - tx; tx &= 63;
            const step = TEX / lineH; let tp = (y0 - dS) * step;
            let plR = 0, plG = 0, plB = 0;
            if (Lights.list.length > 0 && h.mx >= 0) {
                const pl = Lights.getLight(h.mx + .5, h.my + .5, .5); plR = pl.r * 60; plG = pl.g * 60; plB = pl.b * 60;
            }
            let wb = 0;
            if (h.mx >= 0 && h.my >= 0 && h.mx < MW && h.my < MH) wb = wallBlood[h.my * MW + h.mx];
            const wbr = LR[lo + 92], wbg = LG[lo + 10], wbb = LB[lo + 8];
            for (let y = y0; y < y1; y++) {
                const c = td[((tp) | 0 & 63) * TEX + tx]; tp += step;
                let r = LR[lo + (c & 255)] + plR, g = LG[lo + ((c >>> 8) & 255)] + plG, b = LB[lo + ((c >>> 16) & 255)] + plB;
                if (wb > 0.01) {
                    const n = 0.5 + 0.5 * (NOISE[(tx * 31 + (((tp) | 0) * 57)) & 4095] / 127);
                    const bl = wb * n * 0.85;
                    r += (wbr - r) * bl; g += (wbg - g) * bl; b += (wbb - b) * bl;
                }
                buf[y * W + x] = 0xff000000 | (b > 255 ? 255 : b | 0) << 16 | (g > 255 ? 255 : g | 0) << 8 | (r > 255 ? 255 : r | 0);
            }
        }
    },

    _sp: new Array(256), _sd: new Float32Array(256),
    renderEnts(P, hz, dirX, dirY, plX, plY, decals, parts) {
        const W = VID.w, H = VID.h;
        const inv = 1 / (plX * dirY - dirX * plY); let n = 0;
        const push = (tex, x, y, zB, sH, eps, flash) => {
            const rx = x - P.x, ry = y - P.y;
            const ty = inv * (-plY * rx + plX * ry); if (ty < .12 || ty > 40 || n >= 256) return;
            this._sp[n] = { tex, x, y, zB, sH, eps, flash, ty }; this._sd[n] = ty; n++;
        };
        for (let i = 0; i < this._sn; i++) {
            const s = this._pool[i];
            if (s.tex) push(s.tex, s.x, s.y, s.zB, s.sH, 0, s.flash);
        }
        for (let i = 0; i < decals.n; i++) {
            const d = decals.list[i];
            if (d.life > 0) push(TEXD[d.tex], d.x, d.y, d.z, d.size, d.eps || 0, 0);
        }
        if (n > 1) {
            const sp = this._sp, sd = this._sd;
            for (let i = 1; i < n; i++) {
                const e = sp[i], k = sd[i]; let j = i - 1;
                while (j >= 0 && sd[j] < k) { sd[j + 1] = sd[j]; sp[j + 1] = sp[j]; j--; } sd[j + 1] = k; sp[j + 1] = e;
            }
        }
        for (let i = 0; i < n; i++) this.drawBillboard(P, hz, inv, dirX, dirY, this._sp[i]);
        for (let i = 0; i < parts.n; i++) {
            const id = i * 16, x = parts.a[id], y = parts.a[id + 1], z = parts.a[id + 2], life = parts.a[id + 9];
            const rx = x - P.x, ry = y - P.y;
            const ty = inv * (-plY * rx + plX * ry); if (ty < .12 || ty > 30) continue;
            const tx = inv * (dirY * rx - dirX * ry);
            const sx = ((W / 2) * (1 + tx / ty)) | 0; if (sx < 0 || sx >= W) continue;
            if (ty > zbuf[sx] + .08) continue;
            const sy = (hz + (H / ty) * (0.5 + P.z - z)) | 0;
            const sz = clamp((H / ty) * parts.a[id + 8], 1, 26) | 0;
            const fade = clamp(life / parts.a[id + 10], 0, 1);
            const r = parts.a[id + 12] * fade | 0, g2 = parts.a[id + 13] * fade | 0, b = parts.a[id + 14] * fade | 0;
            const add = parts.f[i] & 2;
            const x0 = sx - (sz >> 1), y0 = sy - (sz >> 1);
            for (let yy = y0 < 0 ? 0 : y0, ye = y0 + sz > H ? H : y0 + sz; yy < ye; yy++)
                for (let xx = x0 < 0 ? 0 : x0, xe = x0 + sz > W ? W : x0 + sz; xx < xe; xx++) {
                    if (ty > zbuf[xx]) continue;
                    const o = yy * W + xx, c = buf[o];
                    if (add) {
                        let rr = (c & 255) + r, gg = ((c >>> 8) & 255) + g2, bb = ((c >>> 16) & 255) + b;
                        buf[o] = 0xff000000 | (bb > 255 ? 255 : bb) << 16 | (gg > 255 ? 255 : gg) << 8 | (rr > 255 ? 255 : rr);
                    }
                    else {
                        const al = fade;
                        let rr = (c & 255) * (1 - al) + r * al, gg = ((c >>> 8) & 255) * (1 - al) + g2 * al, bb = ((c >>> 16) & 255) * (1 - al) + b * al;
                        buf[o] = 0xff000000 | bb << 16 | gg << 8 | rr;
                    }
                }
        }
    },

    drawBillboard(P, hz, inv, dirX, dirY, s) {
        const W = VID.w, H = VID.h;
        const rx = s.x - P.x, ry = s.y - P.y;
        const tx = inv * (dirY * rx - dirX * ry), ty = s.ty;
        const sx = ((W / 2) * (1 + tx / ty)) | 0;
        const lineH = H / ty;
        const hgt = (lineH * s.sH) | 0; if (hgt < 1) return;
        const wdt = (hgt * s.tex.w / s.tex.h) | 0; if (wdt < 1) return;
        const yB = (hz + lineH * (0.5 + P.z - s.zB)) | 0, yT = yB - hgt;
        const x0 = sx - (wdt >> 1), eps = s.eps;
        for (let cx = x0 < 0 ? 0 : x0, xe = x0 + wdt > W ? W : x0 + wdt; cx < xe; cx++) {
            if (ty > zbuf[cx] + eps) continue;
            const tcx = (((cx - x0) / wdt) * s.tex.w) | 0;
            for (let cy = yT < 0 ? 0 : yT, ye = yT + hgt > H ? H : yT + hgt; cy < ye; cy++) {
                const c = s.tex.data[(((cy - yT) / hgt) * s.tex.h | 0) * s.tex.w + tcx];
                if (!c) continue;
                let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
                if (s.flash > 0) { r += (255 - r) * s.flash; g += (255 - g) * s.flash; b += (255 - b) * s.flash; }
                const z = zoneGrid[clamp(s.y | 0, 0, MH - 1) * MW + clamp(s.x | 0, 0, MW - 1)], zn = ZONES[z];
                let lv = ((zn.li + this.flash - ty * zn.fo) * Settings.brightness * SHN) | 0;
                lv = lv < 0 ? 0 : lv >= SHN ? SHN - 1 : lv; const lo = lv * 256;
                buf[cy * W + cx] = 0xff000000 | LB[lo + b] << 16 | LG[lo + g] << 8 | LR[lo + r];
            }
        }
    }
};

Renderer.setResolution(VID.w, VID.h);