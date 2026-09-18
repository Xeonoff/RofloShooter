import { PMAX, T } from '../core/config.js';
import { clamp, R } from '../core/utils.js';
import { solidAt, addBlood, addBloodTrail, addWallBlood } from '../world/grid.js';
import { Decals } from './decals.js';

export const Parts = {
    a: new Float32Array(PMAX * 16), f: new Uint8Array(PMAX), n: 0,
    spawn(x, y, z, vx, vy, vz, life, size, r, g, b, flags, drag, grav, grow) {
        if (this.n >= PMAX) this.n = PMAX - 1;
        const i = this.n * 16;
        this.a[i] = x; this.a[i + 1] = y; this.a[i + 2] = z;
        this.a[i + 3] = vx; this.a[i + 4] = vy; this.a[i + 5] = vz;
        this.a[i + 6] = drag; this.a[i + 7] = grav; this.a[i + 8] = size;
        this.a[i + 9] = life; this.a[i + 10] = life; this.a[i + 11] = grow || 0;
        this.a[i + 12] = r; this.a[i + 13] = g; this.a[i + 14] = b;
        this.f[this.n] = flags || 0; this.n++;
    },
    update(dt) {
        let w = 0;
        for (let i = 0; i < this.n; i++) {
            const o = i * 16, d = w * 16, a = this.a;
            a[o + 9] -= dt; if (a[o + 9] <= 0) continue;
            a[o + 3] *= 1 - a[o + 6] * dt; a[o + 4] *= 1 - a[o + 6] * dt;
            a[o + 5] = a[o + 5] * (1 - a[o + 6] * dt) - a[o + 7] * dt;
            if (this.f[i] & 8) a[o + 3] += Math.sin(a[o + 9] * 22) * 2.4 * dt;
            a[o] += a[o + 3] * dt; a[o + 1] += a[o + 4] * dt; a[o + 2] += a[o + 5] * dt;
            if (this.f[i] & 64) { addBloodTrail(a[o], a[o + 1], .08); }
            if (this.f[i] & 1) {
                if (solidAt(a[o] | 0, a[o + 1] | 0)) {
                    addWallBlood(a[o], a[o + 1], 0.45);
                    if (R() < .6) Decals.add(T.DBLOOD + (R() * 3 | 0) * 10, a[o], a[o + 1], clamp(a[o + 2], .15, .85), .28 + R() * .3, 45, .05, 0);
                    a[o + 9] = 0; continue;
                }
                if (a[o + 2] < 0) {
                    if (this.f[i] & 32) {
                        const imp = a[o + 5]; a[o + 2] = 0;
                        if (imp < -.8) {
                            addBlood(a[o], a[o + 1], .25);
                            Decals.add(T.DPUDDLE, a[o], a[o + 1], .02, .2 + R() * .2, 60, .03, .008);
                        }
                        a[o + 5] *= -.35; a[o + 3] *= .6; a[o + 4] *= .6;
                        if (Math.abs(a[o + 5]) < .6) a[o + 9] = Math.min(a[o + 9], .4);
                        continue;
                    }
                    addBlood(a[o], a[o + 1], .18); a[o + 9] = 0; continue;
                }
            }
            if (a[o + 2] < 0 && a[o + 7] > 0) { a[o + 2] = 0; a[o + 5] *= -.3; a[o + 3] *= .5; a[o + 4] *= .5; }
            if (a[o + 11]) a[o + 8] += a[o + 11] * dt;
            if (w !== i) { for (let k = 0; k < 16; k++) a[d + k] = a[o + k]; this.f[w] = this.f[i]; }
            w++;
        }
        this.n = w;
    },
    blood(x, y, z, n) {
        for (let i = 0; i < n; i++) this.spawn(x, y, z, (R() - .5) * 2.4, (R() - .5) * 2.4, R() * 2.2,
            .5 + R() * .5, .03 + R() * .03, 150 + R() * 70 | 0, 10, 8, 1, 3, 7, 0);
    },
    arterial(x, y, z, dirX, dirY) {
        for (let i = 0; i < 8; i++) {
            const spread = (R() - .5) * .6;
            this.spawn(x, y, z, dirX * 3 + spread, (dirY * 3) + (R() - .5) * .6, R() * 1.5,
                .4 + R() * .3, .02 + R() * .02, 160 + R() * 40 | 0, 8, 6, 1 | 64, 2, 9, 0);
        }
    },
    mist(x, y, z) {
        for (let i = 0; i < 6; i++) this.spawn(x, y, z, (R() - .5) * .8, (R() - .5) * .8, R() * .5,
            .7 + R() * .4, .1 + R() * .12, 120, 16, 14, 2, 1, 0, .1);
    },
    sparks(x, y, z, n, blue) {
        for (let i = 0; i < n; i++) this.spawn(x, y, z, (R() - .5) * 5, (R() - .5) * 5, R() * 3.5,
            .12 + R() * .2, .02, blue ? 140 : 255, blue ? 190 : 210, blue ? 255 : 90, 2 | 8, 1, 5, 0);
    },
    muzzle(x, y, z) {
        for (let i = 0; i < 4; i++) this.spawn(x, y, z, (R() - .5) * 3, (R() - .5) * 3, (R() - .5) * 3,
            .08 + R() * .08, .05 + R() * .05, 255, 190, 80, 2, .5, 0, .3);
    },
    smoke(x, y, z, n) {
        for (let i = 0; i < n; i++) this.spawn(x, y, z, (R() - .5) * .7, (R() - .5) * .7, .5 + R() * .8,
            1.2 + R() * 1.2, .09 + R() * .1, 70, 64, 58, 2, 1.4, -.6, .12);
    },
    fire(x, y, z, n) {
        for (let i = 0; i < n; i++) this.spawn(x, y, z, (R() - .5) * 3.4, (R() - .5) * 3.4, R() * 3,
            .25 + R() * .3, .06 + R() * .07, 255, 140 + R() * 80 | 0, 30, 2, .8, 2, 0);
    },
    debris(x, y, z, n) {
        for (let i = 0; i < n; i++) this.spawn(x, y, z, (R() - .5) * 3, (R() - .5) * 3, 1 + R() * 2.5,
            .6 + R() * .6, .03 + R() * .04, 140, 132, 120, 0, 1.2, 8, 0);
    },
    dust(x, y, z) {
        this.spawn(x, y, z, (R() - .5) * .12, (R() - .5) * .12, (R() - .5) * .05,
            4 + R() * 5, .012 + R() * .02, 150, 148, 138, 2, .1, 0, 0);
    },
    ash(x, y, z) {
        this.spawn(x, y, z, (R() - .5) * .2, (R() - .5) * .2, -.15 - R() * .1,
            5 + R() * 4, .015 + R() * .02, 120, 112, 104, 2, .2, 0, 0);
    },
    paper(x, y, z) {
        this.spawn(x, y, z, (R() - .5) * .3, (R() - .5) * .3, -.1,
            6 + R() * 4, .05, 201, 196, 176, 2 | 8, .3, -.02, 0);
    },
    drip(x, y) { this.spawn(x, y, .95, 0, 0, 0, .6, .02, 120, 20, 16, 1, 0, 9, 0); },
    toxic(x, y, z) {
        this.spawn(x, y, z, (R() - .5) * .3, (R() - .5) * .3, .3 + R() * .4,
            1 + R(), .04 + R() * .04, 60, 200, 60, 2, .5, -.3, .05);
    },
    elecArc(x, y, z) {
        for (let i = 0; i < 3; i++) this.spawn(x, y, z, (R() - .5) * 4, (R() - .5) * 4, R() * 2,
            .06 + R() * .08, .015, 140, 190, 255, 2 | 8, .5, 3, 0);
    }
};