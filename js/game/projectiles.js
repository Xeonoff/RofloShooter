import { PROJMAX, T } from '../core/config.js';
import { solidAt } from '../world/grid.js';
import { Renderer } from '../render/renderer.js';
import { Lights } from '../render/lights.js';
import { Parts } from '../fx/particles.js';
import { Decals } from '../fx/decals.js';
import { enemies, hurtEnemy, EDEF } from './enemies.js';
import { Player, damagePlayer } from './player.js';
import { SFX } from '../audio/sfx.js';

export const barrels = [];

export const Projectiles = {
    list: [],
    fire(x, y, z, ang, sp, enemy) {
        if (this.list.length >= PROJMAX) this.list.shift();
        this.list.push({ x, y, z, ang, sp, enemy, t: 0 });
    },
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i]; p.t += dt;
            const vx = Math.cos(p.ang) * p.sp, vy = Math.sin(p.ang) * p.sp;
            p.x += vx * dt; p.y += vy * dt;
            let boom = p.t > 4;
            if (solidAt(p.x | 0, p.y | 0)) boom = true;
            if (!p.enemy) {
                for (const e of enemies)
                    if (e.st !== 4 && Math.hypot(e.x - p.x, e.y - p.y) < EDEF[e.t].r + .25) { boom = true; break; }
            }
            else if (Math.hypot(Player.x - p.x, Player.y - p.y) < .5) boom = true;
            if (boom) { this.explode(p.x - vx * dt, p.y - vy * dt, p.z, p.enemy); this.list.splice(i, 1); }
        }
    },
    explode(x, y, z, enemy) {
        SFX.boom(); Renderer.shake = Math.min(1, Renderer.shake + .7); Renderer.flash = 1;
        Lights.add(x, y, z, 1, .6, .2, 4, .5);
        Parts.fire(x, y, z, 22); Parts.smoke(x, y, z, 14); Parts.sparks(x, y, z, 12, 0); Parts.debris(x, y, z, 8);
        Decals.add(T.DSCORCH, x, y, .03, .8, 80, .06, 0);
        if (!enemy) {
            for (const e of enemies) if (e.st !== 4) {
                const d = Math.hypot(e.x - x, e.y - y);
                if (d < 2.6 && Renderer.los(x, y, e.x, e.y)) hurtEnemy(e, Math.max(20, 95 * (1 - d / 2.8)), e.x, e.y);
            }
            for (const b of barrels) if (!b.exploded && Math.hypot(b.x - x, b.y - y) < 2.4) { b.exploded = 1; b.timer = .25; }
        } else {
            const d = Math.hypot(Player.x - x, Player.y - y);
            if (d < 2.4 && !Player.dead) damagePlayer(Math.max(12, 42 * (1 - d / 2.6)), x, y);
        }
    }
};