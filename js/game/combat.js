import { T, WALL_PENETRATE_DMG_MULT, PITCH_LIM } from '../core/config.js';
import { clamp, R, wrapA } from '../core/utils.js';
import { addWallBlood, addBlood } from '../world/grid.js';
import { WEAPONS } from './weaponDefs.js';
import { Player } from './player.js';
import { Renderer } from '../render/renderer.js';
import { Lights } from '../render/lights.js';
import { Parts } from '../fx/particles.js';
import { Decals } from '../fx/decals.js';
import { enemies, hurtEnemy, EDEF } from './enemies.js';
import { Projectiles, barrels } from './projectiles.js';
import { SFX } from '../audio/sfx.js';
import { HUD } from '../ui/hud.js';

export function wallSplatter(x, y, dirx, diry, amt) {
    const h = Renderer.cast(x, y, dirx, diry, 2.2);
    if (h && h.dist < 2.2) {
        const bx = x + dirx * (h.dist - 0.05), by = y + diry * (h.dist - 0.05);
        addWallBlood(bx, by, amt);
        addBlood(bx, by, amt * 0.6);
        if (R() < 0.7) Decals.add(T.DBLOOD + (R() * 3 | 0) * 10, bx, by, 0.2 + R() * 0.5, 0.3 + R() * 0.35, 50, 0.05, 0);
    }
}

export function fireWeapon() {
    const w = WEAPONS[Player.wSlot];
    if (Player.reloadT > 0 || Player.cd > 0) return;
    if (!w.melee && Player.mag[Player.wSlot] <= 0) {
        if (Player.res[Player.wSlot] > 0) startReload(); else SFX.dry();
        Player.cd = .25; return;
    }
    Player.cd = w.rof; Player.shots++;
    Player.kick = 1; Player.muzzle = 1;
    Renderer.flash = Math.max(Renderer.flash, w.proj ? .7 : w.pel ? 0.55 : 0.35);
    Renderer.shake = Math.min(1, Renderer.shake + (w.pel ? .25 : .08));
    SFX.shoot(w.snd);
    Lights.add(Player.x + Math.cos(Player.yaw) * .5, Player.y + Math.sin(Player.yaw) * .5, .5, 1, .8, .3, 2, .15);
    if (w.melee) {
        SFX.swipe();
        for (const e of enemies) if (e.st !== 4) {
            const d = Math.hypot(e.x - Player.x, e.y - Player.y);
            if (d < 1.8 && Math.abs(wrapA(Math.atan2(e.y - Player.y, e.x - Player.x) - Player.yaw)) < .55)
                hurtEnemy(e, w.dmg, e.x, e.y);
        }
        return;
    }
    if (w.proj) {
        Player.mag[Player.wSlot]--;
        Projectiles.fire(Player.x + Math.cos(Player.yaw) * .4, Player.y + Math.sin(Player.yaw) * .4, .5,
            Player.yaw + (R() - .5) * .02, 10, 0);
        Parts.muzzle(Player.x + Math.cos(Player.yaw) * .5, Player.y + Math.sin(Player.yaw) * .5, .5);
        if (Player.mag[Player.wSlot] <= 0 && Player.res[Player.wSlot] > 0) startReload();
        return;
    }
    const pel = w.pel || 1;
    const penetrate = w.penetrate || 0;
    for (let i = 0; i < pel; i++) {
        const a = Player.yaw + (R() - .5) * w.sp * 2, pit = (R() - .5) * w.sp;
        const dx = Math.cos(a), dy = Math.sin(a);
        const h = Renderer.cast(Player.x, Player.y, dx, dy, 40);
        const wallD = h ? h.dist : 40;
        let best = null, bestT = wallD;
        for (const e of enemies) if (e.st !== 4) {
            const rx = e.x - Player.x, ry = e.y - Player.y;
            const t = rx * dx + ry * dy;
            if (t > 0 && t < bestT) {
                const perp = Math.abs(rx * dy - ry * dx);
                if (perp < EDEF[e.t].r + .08) { best = e; bestT = t; }
            }
        }
        for (const b of barrels) if (!b.exploded) {
            const rx = b.x - Player.x, ry = b.y - Player.y, t = rx * dx + ry * dy;
            if (t > 0 && t < bestT && Math.abs(rx * dy - ry * dx) < .4) { b.hp -= w.dmg; bestT = t; best = 'barrel'; }
        }
        const hx = Player.x + dx * bestT * .98, hy = Player.y + dy * bestT * .98, hz = .5 + pit * bestT;
        if (best === 'barrel') Parts.sparks(hx, hy, hz, 3, 0);
        else if (best) {
            hurtEnemy(best, w.dmg, hx, hy);
            if (penetrate > 0) {
                let penLeft = penetrate;
                const contX = hx + dx * .5, contY = hy + dy * .5;
                for (const e2 of enemies) if (e2 !== best && e2.st !== 4) {
                    const rx2 = e2.x - contX, ry2 = e2.y - contY;
                    const t2 = rx2 * dx + ry2 * dy;
                    if (t2 > 0 && t2 < 3 && Math.abs(rx2 * dy - ry2 * dx) < EDEF[e2.t].r + .1) {
                        hurtEnemy(e2, w.dmg * WALL_PENETRATE_DMG_MULT, e2.x, e2.y);
                        penLeft--; if (penLeft <= 0) break;
                    }
                }
            }
        }
        else if (h) {
            Parts.sparks(hx, hy, clamp(hz, .1, .9), h.tile === T.SERVER || h.tile === T.VENT ? 4 : 2, h.tile === T.SERVER);
            if (h.tile !== T.SHELF && R() < .8) Decals.add(T.DHOLE, hx, hy, clamp(hz, .15, .85), .16, 25, .04, 0);
            if (h.tile === T.DOOR || h.tile === T.LDOOR) SFX.metal();
        }
    }
    Parts.muzzle(Player.x + Math.cos(Player.yaw) * .5, Player.y + Math.sin(Player.yaw) * .5, .5);
    Player.pitch = clamp(Player.pitch + (w.pel ? 3 : 1), -PITCH_LIM, PITCH_LIM);
    Player.mag[Player.wSlot]--;
    HUD.noise = 1; HUD.noiseX = Player.x; HUD.noiseY = Player.y;
    if (Player.mag[Player.wSlot] <= 0 && Player.res[Player.wSlot] > 0) startReload();
}

export function startReload() {
    const w = WEAPONS[Player.wSlot];
    if (w.melee || Player.reloadT > 0 || Player.mag[Player.wSlot] >= w.mag || Player.res[Player.wSlot] <= 0) return;
    Player.reloadT = w.rl; SFX.reload();
}