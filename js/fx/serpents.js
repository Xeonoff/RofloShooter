import { T } from '../core/config.js';
import { clamp, R } from '../core/utils.js';
import { solidAt, addBlood, addBloodTrail, addWallBlood } from '../world/grid.js';
import { Decals } from './decals.js';
import { Parts } from './particles.js';

export const Serpents = {
    list: [],
    spawn(x, y, z, dirx, diry, count, pow) {
        for (let i = 0; i < count; i++) {
            if (this.list.length >= 40) this.list.shift();
            const base = Math.atan2(diry, dirx) + (R() - 0.5) * 1.4;
            this.list.push({
                x, y, z: Math.max(0.12, z) + R() * 0.2,
                ang: base,
                speed: (2.4 + R() * 2.6) * pow,
                vz: 1.6 + R() * 2.4,
                phase: R() * 6.283,
                freq: 5 + R() * 7,
                amp: 0.35 + R() * 0.5,
                life: 0.55 + R() * 0.5,
                t: 0
            });
        }
    },
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const s = this.list[i];
            s.t += dt; s.life -= dt;
            if (s.life <= 0) { this.list.splice(i, 1); continue; }
            const fx = Math.cos(s.ang), fy = Math.sin(s.ang);
            const px = -fy, py = fx;
            const osc = Math.sin(s.t * s.freq + s.phase) * s.amp;
            const mvx = fx * s.speed + px * osc * s.speed * 1.6;
            const mvy = fy * s.speed + py * osc * s.speed * 1.6;
            s.x += mvx * dt; s.y += mvy * dt;
            s.vz -= 7.5 * dt; s.z += s.vz * dt;
            if (solidAt(s.x | 0, s.y | 0)) {
                addWallBlood(s.x, s.y, 0.55);
                addBlood(s.x, s.y, 0.3);
                if (R() < 0.7) Decals.add(T.DBLOOD + (R() * 3 | 0) * 10, s.x, s.y, clamp(s.z, 0.15, 0.85), 0.3 + R() * 0.3, 50, 0.05, 0);
                this.list.splice(i, 1); continue;
            }
            if (s.z <= 0) {
                s.z = 0; s.vz = Math.abs(s.vz) * 0.3;
                addBlood(s.x, s.y, 0.35);
                addBloodTrail(s.x, s.y, 0.45);
            } else {
                addBloodTrail(s.x, s.y, 0.12);
            }
            Parts.spawn(s.x, s.y, s.z + 0.05,
                mvx * 0.3 + (R() - 0.5) * 0.8, mvy * 0.3 + (R() - 0.5) * 0.8, 0.5 + R() * 1.2,
                0.4 + R() * 0.3, 0.035 + R() * 0.03, 160 + R() * 50 | 0, 12, 8, 1 | 64, 1.5, 8, 0);
        }
    }
};