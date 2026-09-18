import { GIBMAX, T } from '../core/config.js';
import { clamp, R } from '../core/utils.js';
import { solidAt, addBlood, addBloodTrail, addWallBlood } from '../world/grid.js';
import { Decals } from './decals.js';
import { SPR } from '../assets/spriteGen.js';
import { Renderer } from '../render/renderer.js';

export const Gibs = {
    list: [],
    spawn(x, y, z, n, pow, setKey) {
        const set = SPR.gibSets[setKey] || SPR.gibSets.intern;
        for (let i = 0; i < n; i++) {
            if (this.list.length >= GIBMAX) this.list.shift();
            const a = R() * 6.283, sp = (0.7 + R() * 1.1) * pow;
            this.list.push({
                x, y, z: Math.max(0.15, z) + R() * 0.3,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 1.5 + R() * 3.2,
                set, t: R() * set.length | 0,
                size: 0.28 + R() * 0.24,
                life: 8 + R() * 6,
                tumble: R() * 6.283, vt: (R() - .5) * 14,
                settled: 0
            });
        }
    },
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const g = this.list[i];
            g.life -= dt;
            if (g.life <= 0) { this.list.splice(i, 1); continue; }
            g.vz -= 9.5 * dt;
            g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt;
            g.tumble += g.vt * dt;
            addBloodTrail(g.x, g.y, 0.18);
            if (solidAt(g.x | 0, g.y | 0)) {
                addWallBlood(g.x, g.y, 0.6);
                addBlood(g.x, g.y, 0.4);
                if (R() < 0.7) Decals.add(T.DBLOOD + (R() * 3 | 0) * 10, g.x, g.y, clamp(g.z, 0.15, 0.85), 0.35 + R() * 0.35, 60, 0.05, 0);
                this.list.splice(i, 1); continue;
            }
            if (g.z <= 0) {
                g.z = 0;
                if (g.vz < -1.4) {
                    g.vz *= -0.42; g.vx *= 0.5; g.vy *= 0.5; g.vt *= 0.6;
                    addBlood(g.x, g.y, 0.3);
                    if (R() < 0.6) Decals.add(T.DPUDDLE, g.x, g.y, 0.02, 0.18 + R() * 0.22, 70, 0.03, 0.01);
                } else {
                    g.vz = 0; g.vx *= 0.82; g.vy *= 0.82; g.vt *= 0.85; g.settled = 1;
                }
            }
        }
    },
    render() {
        for (const g of this.list) {
            const pair = g.set[g.t];
            const spr = (Math.sin(g.tumble) > 0) ? pair.a : pair.b;
            const squash = g.settled ? 0.55 : (0.75 + 0.25 * Math.abs(Math.sin(g.tumble)));
            const s = g.size * squash * Math.min(1, g.life * 1.5);
            Renderer.addSprite(spr, g.x, g.y, s, g.z, 0);
        }
    }
};