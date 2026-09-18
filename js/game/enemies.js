import { MW, MH, COMBO_WINDOW, T } from '../core/config.js';
import { clamp, R } from '../core/utils.js';
import { solidAt, addBlood, addBloodTrail, toxicGrid, doorIdx, doors, flow } from '../world/grid.js';
import { Renderer } from '../render/renderer.js';
import { Parts } from '../fx/particles.js';
import { Decals } from '../fx/decals.js';
import { Gibs } from '../fx/gibs.js';
import { Serpents } from '../fx/serpents.js';
import { wallSplatter } from './combat.js';
import { Player, damagePlayer } from './player.js';
import { Projectiles } from './projectiles.js';
import { pickups } from './entities.js';
import { SFX } from '../audio/sfx.js';
import { HUD, addFloat } from '../ui/hud.js';

export const ET = { INTERN: 0, MANAGER: 1, GUARD: 2, CEO: 3, JANITOR: 4, DRONE: 5 };
export const EDEF = [
    { hp: 22, sp: 2.7, r: .28, h: .92, dmg: 9, rate: .8, sight: 9, hear: 7, spr: 'intern' },
    { hp: 48, sp: 1.7, r: .3, h: 1, dmg: 6, rate: 1.5, sight: 12, hear: 9, spr: 'manager' },
    { hp: 120, sp: 1.15, r: .38, h: 1.12, dmg: 5, rate: 2.2, sight: 11, hear: 10, spr: 'guard' },
    { hp: 620, sp: 1.0, r: .5, h: 1.62, dmg: 9, rate: 1.6, sight: 16, hear: 14, spr: 'ceo' },
    { hp: 65, sp: 0.9, r: .32, h: 1.0, dmg: 14, rate: 1.8, sight: 8, hear: 12, spr: 'janitor' },
    { hp: 18, sp: 2.2, r: .25, h: .6, dmg: 5, rate: 1.2, sight: 14, hear: 6, spr: 'drone', flying: true },
];
export const enemies = [];
export let flowT = 0;
export function setFlowT(v) { flowT = v; }
const _qx = new Int16Array(MW * MH), _qy = new Int16Array(MW * MH);

export function spawnEnemy(t, x, y) {
    const d = EDEF[t];
    enemies.push({
        t, x: x + .5, y: y + .5, hp: d.hp, st: 0, at: 0, atk: 0, anim: R() * 4, flash: 0, pain: 0,
        zig: R() * 6, seen: 0, summoned: 0, deadT: 0, corpse: 0, tx: 0, ty: 0, bleed: 0, bleedT: 0,
        flyZ: t === ET.DRONE ? 0.6 : 0, toxicT: 0, limbs: 4, headIntact: true
    });
}

export function computeFlow() {
    flow.fill(-1);
    const qx = _qx, qy = _qy; let qh = 0, qt = 0;
    const sx = clamp(Player.x | 0, 0, MW - 1), sy = clamp(Player.y | 0, 0, MH - 1);
    flow[sy * MW + sx] = 8; qx[qt] = sx; qy[qt] = sy; qt++;
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    while (qh < qt) {
        const cx = qx[qh], cy = qy[qh]; qh++;
        for (let k = 0; k < 8; k++) {
            const nx = cx + DX[k], ny = cy + DY[k];
            if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
            const i = ny * MW + nx;
            if (flow[i] !== -1 || solidAt(nx, ny)) continue;
            if (k >= 4 && (solidAt(cx + DX[k], cy) || solidAt(cx, cy + DY[k]))) continue;
            flow[i] = k; qx[qt] = nx; qy[qt] = ny; qt++;
        }
    }
}

export function hurtEnemy(e, dmg, hx, hy) {
    if (e.st === 4) return;
    const finalDmg = Player.dmgBoost > 0 ? dmg * 2 : dmg;
    e.hp -= finalDmg; e.flash = 1; e.pain = .18; e.st = 2; Player.hits++;
    e.bleed = Math.max(e.bleed, 2.5);
    const px0 = hx || e.x, py0 = hy || e.y;
    Parts.blood(px0, py0, EDEF[e.t].h * .6, 6 + R() * 6 | 0);
    const dd = Math.hypot(e.x - Player.x, e.y - Player.y) || 1;
    const dirx = (e.x - Player.x) / dd, diry = (e.y - Player.y) / dd;
    wallSplatter(e.x, e.y, dirx, diry, 0.5);
    if (R() < 0.4) wallSplatter(e.x, e.y, -diry, dirx, 0.35);
    if (finalDmg >= 18) Serpents.spawn(px0, py0, EDEF[e.t].h * 0.5, dirx, diry, 1, 1);
    if (finalDmg >= 20 && e.limbs > 0 && R() < .35) {
        e.limbs--; Player.gibs++;
        Gibs.spawn(px0, py0, EDEF[e.t].h * .55, 3, 3, EDEF[e.t].spr);
        Parts.arterial(px0, py0, EDEF[e.t].h * .5, dirx, diry);
        Serpents.spawn(px0, py0, EDEF[e.t].h * .5, dirx, diry, 1, 1.1);
        Decals.add(T.DGIB, px0, py0, .1, .3 + R() * .2, 50, .04, 0);
        addBlood(px0, py0, .5);
        SFX.gib();
    }
    if (finalDmg >= 15 && e.headIntact && R() < .2) {
        e.headIntact = false;
        Gibs.spawn(px0, py0, EDEF[e.t].h * .8, 2, 3, EDEF[e.t].spr);
        e.hp -= finalDmg * .5;
    }
    if (finalDmg >= 25 || R() < .3) Gibs.spawn(px0, py0, EDEF[e.t].h * .55, 1 + (R() * 2 | 0), 3, EDEF[e.t].spr);
    addFloat(e.x, e.y, EDEF[e.t].h + .15, String(finalDmg | 0), '#ff9a80', finalDmg >= 30 ? 22 : 15);
    if (finalDmg >= 30) Renderer.hitstop = 0.03;
    if (e.hp <= 0) {
        e.st = 4; e.deadT = 0; Player.kills++;
        Player.combo++; Player.comboTimer = COMBO_WINDOW;
        if (Player.combo > Player.maxCombo) Player.maxCombo = Player.combo;
        if (Player.combo >= 3) HUD.toast('СЕРИЯ ×' + Player.combo + '!');
        if (Player.combo === 5) HUD.toast('★ ПРОИЗВОДИТЕЛЬНАЯ ЯРОСТЬ ★');
        if (Player.combo === 10) HUD.toast('★★ ПЕРЕВЫПОЛНЕНИЕ ПЛАНА ★★');
        Gibs.spawn(e.x, e.y, EDEF[e.t].h * .5, 9 + (R() * 6 | 0), 4.2, EDEF[e.t].spr);
        Serpents.spawn(e.x, e.y, EDEF[e.t].h * .5, dirx, diry, 2, 1.4);
        for (let k = 0; k < 2; k++) {
            const a = R() * 6.283;
            Serpents.spawn(e.x, e.y, 0.3, Math.cos(a), Math.sin(a), 1, 1.1);
        }
        if (e.t === ET.DRONE) Parts.sparks(e.x, e.y, 0.4, 14, 1);
        Parts.blood(e.x, e.y, .5, 16); Parts.mist(e.x, e.y, .6);
        addBlood(e.x, e.y, .7);
        Decals.add(T.DPUDDLE, e.x, e.y, .02, .4 + R() * .3, 120, .03, .005);
        for (let k = 0; k < 4; k++) {
            const a = R() * 6.283;
            wallSplatter(e.x, e.y, Math.cos(a), Math.sin(a), 0.6);
        }
        if (R() < .4) pickups.push({ t: R() < .5 ? 'ammo' : 'shell', x: e.x, y: e.y, bob: R() * 6 });
        if (Player.combo >= 3 && R() < .25) pickups.push({ t: R() < .5 ? 'speed' : 'damage', x: e.x + (R() - .5), y: e.y + (R() - .5), bob: R() * 6 });
        SFX.die(e.t);
        if (e.t === ET.CEO) Player.winT = .001;
    } else SFX.pain(e.t);
}

export function enemyFireFX(e) {
    const gz = EDEF[e.t].flying ? e.flyZ : EDEF[e.t].h * .7;
    Parts.spawn(e.x, e.y, gz, 0, 0, 0, .08, .16, 255, 235, 170, 2, 0, 0, .6);
    Parts.muzzle(e.x, e.y, gz);
}

export function enemyShoot(e, dmg, pel, spread, snd) {
    if (solidAt(e.x | 0, e.y | 0)) return;
    SFX[snd](e.x, e.y); e.atk = .12; enemyFireFX(e);
    const base = Math.atan2(Player.y - e.y, Player.x - e.x);
    for (let i = 0; i < pel; i++) {
        const a = base + (R() - .5) * spread;
        const h = Renderer.cast(e.x, e.y, Math.cos(a), Math.sin(a), 30);
        const wallD = h ? h.dist : 30;
        const rx = Player.x - e.x, ry = Player.y - e.y;
        const t = rx * Math.cos(a) + ry * Math.sin(a);
        if (t > 0 && t < wallD) {
            const perp = Math.abs(rx * Math.sin(a) - ry * Math.cos(a));
            if (perp < .42) { damagePlayer(dmg, e.x, e.y); continue; }
        }
        if (wallD < 24) Parts.sparks(e.x + Math.cos(a) * wallD * .96, e.y + Math.sin(a) * wallD * .96, .4 + R() * .3, 2, 0);
    }
}

export function moveEnemy(e, mx, my, sp, dt) {
    if (!mx && !my) return;
    const m = Math.hypot(mx, my); mx /= m; my /= m;
    const r = EDEF[e.t].r;
    const nx = e.x + mx * sp * dt;
    if (!solidAt((nx + r * Math.sign(mx || 1)) | 0, (e.y - r) | 0) && !solidAt((nx + r * Math.sign(mx || 1)) | 0, (e.y + r) | 0)) e.x = nx;
    const ny = e.y + my * sp * dt;
    if (!solidAt((e.x - r) | 0, (ny + r * Math.sign(my || 1)) | 0) && !solidAt((e.x + r) | 0, (ny + r * Math.sign(my || 1)) | 0)) e.y = ny;
    if (e.t === ET.CEO) { e.x = clamp(e.x, 41.7, 61.3); e.y = clamp(e.y, 21.7, 44.3); }
    const ci = doorIdx[clamp(ny | 0, 0, MH - 1) * MW + clamp(nx | 0, 0, MW - 1)];
    if (ci >= 0) {
        const dr = doors[ci];
        if (!dr.secret && !dr.locked && !dr.opening) {
            dr.opening = 1;
            if (Math.hypot(e.x - Player.x, e.y - Player.y) < 10) SFX.doorBang();
        }
    }
}

export function ceoAttack(e, dist) {
    const phase = e.hp > EDEF[3].hp * .66 ? 0 : e.hp > EDEF[3].hp * .33 ? 1 : 2;
    if (phase === 0) enemyShoot(e, 9, 3, .08, 'eHeavy');
    else if (phase === 1) {
        enemyShoot(e, 8, 5, .14, 'eHeavy');
        if (!e.summoned && e.hp < EDEF[3].hp * .5) {
            e.summoned = 1;
            for (let i = 0; i < 3; i++) {
                const a = R() * 6.3;
                spawnEnemy(R() < .5 ? ET.INTERN : ET.DRONE, clamp(e.x + Math.cos(a) * 2, 42, 60), clamp(e.y + Math.sin(a) * 2, 22, 44));
                enemies[enemies.length - 1].st = 2;
            }
            SFX.roar(); HUD.toast('ДИРЕКТОР ВЫЗВАЛ ПОДКРЕПЛЕНИЕ');
        }
    }
    else {
        e.atk = .12; enemyFireFX(e);
        Projectiles.fire(e.x, e.y, .55, Math.atan2(Player.y - e.y, Player.x - e.x), 9, 1);
        SFX.eShot(e.x, e.y);
    }
}

export function updateEnemies(dt) {
    flowT -= dt; if (flowT <= 0) { computeFlow(); flowT = .45; }
    const px = Player.x, py = Player.y;
    for (const e of enemies) {
        if (e.st === 4) { e.deadT += dt; continue; }
        const d = EDEF[e.t];
        e.anim += dt * (e.st >= 2 ? 7 : 2);
        e.flash = Math.max(0, e.flash - dt * 6); e.pain = Math.max(0, e.pain - dt);
        if (e.atk > 0) e.atk -= dt;
        if (e.bleed > 0) {
            e.bleed -= dt; e.bleedT -= dt;
            if (e.bleedT <= 0) {
                e.bleedT = .3;
                addBlood(e.x + (R() - .5) * .3, e.y + (R() - .5) * .3, .25);
                addBloodTrail(e.x + (R() - .5) * .2, e.y + (R() - .5) * .2, .15);
            }
        }
        if (e.t === ET.JANITOR && e.st >= 2) {
            e.toxicT -= dt;
            if (e.toxicT <= 0) {
                e.toxicT = .5;
                const ci = (e.y | 0) * MW + (e.x | 0);
                if (ci >= 0 && ci < MW * MH) toxicGrid[ci] = Math.min(1, toxicGrid[ci] + .3);
                Parts.toxic(e.x, e.y, .1);
            }
        }
        if (d.flying) e.flyZ = 0.55 + Math.sin(e.anim * 1.5) * 0.12;
        const dx = px - e.x, dy = py - e.y, dist = Math.hypot(dx, dy);
        const angTo = Math.atan2(dy, dx);
        const los = dist < d.sight && Renderer.los(e.x, e.y, px, py);
        switch (e.st) {
            case 0:
                if (los && dist < d.sight) {
                    e.st = 2; e.seen = 1; SFX.alert(e.t);
                    addFloat(e.x, e.y, d.h + .15, '!', '#ff4636', 24);
                    if (e.t === ET.CEO) SFX.roar();
                    for (const o of enemies) {
                        if (o !== e && o.st === 0) {
                            const gd = Math.hypot(o.x - e.x, o.y - e.y);
                            if (gd < 8 && (gd < 4 || R() < .5)) { o.st = 2; o.seen = 1; }
                        }
                    }
                } else if (e.at > 0) { e.at -= dt; if (e.at <= 0) { e.st = 1; e.tx = e.x + (R() - .5) * 6; e.ty = e.y + (R() - .5) * 6; } }
                break;
            case 1: {
                const pd = Math.hypot(e.tx - e.x, e.ty - e.y);
                if (pd < .5) { e.st = 0; e.at = 1 + R() * 3; break; }
                moveEnemy(e, (e.tx - e.x) / pd, (e.ty - e.y) / pd, d.sp * .5, dt);
                if (los && dist < d.sight) { e.st = 2; SFX.alert(e.t); addFloat(e.x, e.y, d.h + .15, '!', '#ff4636', 24); }
                break;
            }
            case 2: {
                if (e.t === ET.INTERN) {
                    e.zig += dt * 7;
                    const pa = angTo + Math.PI / 2, z = Math.sin(e.zig) * .8;
                    moveEnemy(e, Math.cos(angTo) + Math.cos(pa) * z, Math.sin(angTo) + Math.sin(pa) * z, d.sp, dt);
                    if (dist < 1.15) { e.st = 3; e.at = d.rate * .5; }
                } else if (e.t === ET.JANITOR) {
                    if (dist > 1.5) moveEnemy(e, dx / dist, dy / dist, d.sp, dt);
                    else { e.st = 3; e.at = d.rate * .5; }
                } else if (e.t === ET.DRONE) {
                    const pref = 6; let mx = 0, my = 0;
                    if (dist > pref + 1) { mx = dx / dist; my = dy / dist; }
                    else if (dist < pref - 1) { mx = -dx / dist; my = -dy / dist; }
                    else { const pa = angTo + Math.PI / 2; mx = Math.cos(pa); my = Math.sin(pa); }
                    moveEnemy(e, mx, my, d.sp, dt);
                    e.at -= dt;
                    if (e.at <= 0 && los) { e.at = d.rate; enemyShoot(e, d.dmg, 2, .12, 'eShot'); }
                } else {
                    const pref = e.t === ET.MANAGER ? 5.5 : e.t === ET.GUARD ? 6.5 : 5;
                    let mx = 0, my = 0;
                    if (dist > pref + .5) { mx = dx / dist; my = dy / dist; }
                    else if (dist < pref - .8) { mx = -dx / dist; my = -dy / dist; }
                    else {
                        const pa = angTo + Math.PI / 2, s = Math.sin(e.anim * .5) > 0 ? 1 : -1;
                        mx = Math.cos(pa) * s * .5; my = Math.sin(pa) * s * .5;
                    }
                    if (e.t === ET.MANAGER && dist < pref && los && R() < .01) {
                        const fa = angTo + Math.PI * (R() < .5 ? .7 : -.7);
                        mx = Math.cos(fa); my = Math.sin(fa);
                    }
                    if (!los) {
                        const fi = clamp(e.y | 0, 0, MH - 1) * MW + clamp(e.x | 0, 0, MW - 1);
                        const f = flow[fi];
                        if (f >= 0 && f < 8) {
                            const DX8 = [1, -1, 0, 0, 1, 1, -1, -1], DY8 = [0, 0, 1, -1, 1, -1, 1, -1];
                            mx = DX8[f]; my = DY8[f];
                        }
                    }
                    moveEnemy(e, mx, my, d.sp * (e.t === ET.CEO && e.hp < EDEF[3].hp * .33 ? 1.9 : 1), dt);
                    if (dist < d.sight * 1.3) {
                        e.at -= dt;
                        if (e.at <= 0 && los) {
                            e.at = d.rate;
                            if (e.t === ET.MANAGER) enemyShoot(e, d.dmg, 3, .1, 'eShot');
                            else if (e.t === ET.GUARD) enemyShoot(e, d.dmg, 5, .16, 'eHeavy');
                            else ceoAttack(e, dist);
                        }
                    }
                }
                if (e.pain > 0 && e.t !== ET.INTERN && e.t !== ET.DRONE && dist > .001)
                    moveEnemy(e, -dx / dist, -dy / dist, d.sp, dt);
                break;
            }
            case 3:
                e.at -= dt;
                if (dist > 1.4) { e.st = 2; break; }
                if (e.at <= 0) {
                    e.at = d.rate; e.atk = .1;
                    if (dist < 1.3) { damagePlayer(d.dmg, e.x, e.y); Parts.blood(px, py, .5, 4); }
                    SFX.swipe();
                }
                if (dist > .001) moveEnemy(e, dx / dist, dy / dist, d.sp, dt);
                break;
        }
        for (const o of enemies) {
            if (o === e || o.st === 4) continue;
            const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy), min = d.r + EDEF[o.t].r;
            if (od < min && od > .001) {
                const sx2 = e.x + ox / od * (min - od) * .5, sy2 = e.y + oy / od * (min - od) * .5;
                if (!solidAt(sx2 | 0, sy2 | 0)) { e.x = sx2; e.y = sy2; }
            }
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--)if (enemies[i].st === 4 && enemies[i].deadT > 0.6) enemies.splice(i, 1);
    if (HUD.noise > 0) {
        for (const e of enemies) if (e.st === 0) {
            const dd = Math.hypot(e.x - HUD.noiseX, e.y - HUD.noiseY);
            if (dd < EDEF[e.t].hear) { e.st = 1; e.tx = HUD.noiseX; e.ty = HUD.noiseY; }
        }
        HUD.noise = 0;
    }
}