import { PITCH_LIM, GRAV, JUMPV, DASH_SPEED, DASH_DUR, DASH_CD, MW, MH } from '../core/config.js';
import { clamp, wrapA } from '../core/utils.js';
import { solidAt, zoneGrid, fogMap } from '../world/grid.js';
import { ZONES } from '../world/zones.js';
import { WEAPONS } from './weaponDefs.js';
import { Input } from './input.js';
import { Renderer } from '../render/renderer.js';
import { SFX } from '../audio/sfx.js';
import { HUD } from '../ui/hud.js';
import { Parts } from '../fx/particles.js';
import { fireWeapon, startReload } from './combat.js';
import { corpses } from './entities.js';
import { enemies, hurtEnemy } from './enemies.js';
import { Game } from './gameLoop.js';

export const Player = {
    x: 0, y: 0, z: 0, vz: 0, yaw: 0, pitch: 0, hp: 100, armor: 0, dirX: 1, dirY: 0,
    wSlot: 1, owned: [1, 1, 0, 0, 0], mag: [0, 12, 0, 0, 0], res: [0, 72, 0, 0, 0], key: 0,
    cd: 0, reloadT: 0, kick: 0, muzzle: 0, bobPh: 0, bobX: 0, bobY: 0, swayX: 0, swayV: 0,
    altCd: 0, stepAcc: 0, secrets: 0, kills: 0, shots: 0, hits: 0, time: 0, dead: 0, winT: 0,
    flashlight: false, combo: 0, comboTimer: 0, maxCombo: 0,
    speedBoost: 0, dmgBoost: 0,
    dashT: 0, dashCd: 0, dashDirX: 0, dashDirY: 0,
    gibs: 0,
    toxicT: 0, elecT: 0,
    reset() {
        this.x = 3.5; this.y = 13.5; this.z = 0; this.vz = 0; this.yaw = 0; this.pitch = 0; this.hp = 100; this.armor = 0;
        this.wSlot = 1; this.owned = [1, 1, 0, 0, 0]; this.mag = [0, 12, 0, 0, 0]; this.res = [0, 72, 0, 0, 0]; this.key = 0;
        this.cd = 0; this.reloadT = 0; this.kick = 0; this.muzzle = 0; this.bobPh = 0; this.dead = 0; this.winT = 0;
        this.secrets = 0; this.kills = 0; this.shots = 0; this.hits = 0; this.time = 0;
        this.flashlight = false; this.combo = 0; this.comboTimer = 0; this.maxCombo = 0;
        this.speedBoost = 0; this.dmgBoost = 0;
        this.dashT = 0; this.dashCd = 0; this.dashDirX = 0; this.dashDirY = 0;
        this.gibs = 0; this.toxicT = 0; this.elecT = 0;
    }
};

export function killPlayer() {
    if (Player.dead) return;
    Player.hp = 0; Player.dead = .001;
    Renderer.shake = 1; HUD.dmg = 1; HUD.dmgPop = 1; SFX.dieP();
}

export function damagePlayer(d, fromX, fromY) {
    if (Player.dead || Player.hp <= 0) return;
    let rem = d;
    if (Player.armor > 0) { const abs = Math.min(Player.armor, Math.ceil(d * .6)); Player.armor -= abs; rem = d - abs; }
    Player.hp = clamp(Player.hp - rem, 0, 100);
    Renderer.shake = Math.min(1, Renderer.shake + .35);
    SFX.painP(); HUD.dmg = 1; HUD.dmgPop = 1; HUD._dmgSet = true;
    HUD.dmgAng = Math.atan2(fromY - Player.y, fromX - Player.x);
    if (Player.hp <= 0) killPlayer();
}

export function tryMove(nx, ny, r) {
    const ok = (x, y) => !solidAt((x - r) | 0, (y - r) | 0) && !solidAt((x + r) | 0, (y - r) | 0) &&
        !solidAt((x - r) | 0, (y + r) | 0) && !solidAt((x + r) | 0, (y + r) | 0);
    for (const c of corpses) if (c.solid) {
        const dx = nx - c.x, dy = ny - c.y;
        if (dx * dx + dy * dy < (r + .32) * (r + .32)) return false;
    }
    if (ok(nx, ny)) return { x: nx, y: ny };
    if (ok(nx, Player.y)) return { x: nx, y: Player.y };
    if (ok(Player.x, ny)) return { x: Player.x, y: ny };
    return false;
}

export function updatePlayer(dt) {
    if (!Player.dead && Player.hp <= 0) killPlayer();
    if (Player.dead) {
        Player.dead += dt;
        Player.pitch = clamp(Player.pitch - dt * 46, -PITCH_LIM, PITCH_LIM);
        Player.z = Math.max(-.32, Player.z - dt * 1.1);
        if (Player.dead > 1.4 && Game.state === 'play') { Game.state = 'dead'; Game.showEnd(0); }
        return;
    }
    if (Player.winT > 0) {
        Player.winT += dt;
        if (Player.winT > 1.6 && Game.state === 'play') { Game.state = 'win'; Game.showEnd(1); } return;
    }
    Player.time += dt;
    if (Player.comboTimer > 0) { Player.comboTimer -= dt; if (Player.comboTimer <= 0) Player.combo = 0; }
    if (Player.speedBoost > 0) Player.speedBoost -= dt;
    if (Player.dmgBoost > 0) Player.dmgBoost -= dt;
    if (Player.dashCd > 0) Player.dashCd -= dt;
    if (Player.dashT > 0) {
        Player.dashT -= dt;
        const mv = tryMove(Player.x + Player.dashDirX * DASH_SPEED * dt, Player.y + Player.dashDirY * DASH_SPEED * dt, .3);
        if (mv) { Player.x = mv.x; Player.y = mv.y; }
        Parts.spawn(Player.x, Player.y, .3, 0, 0, 0, .2, .04, 100, 200, 255, 2, .5, 0, 0);
    }
    const k = Input.keys;
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const f = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
    const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    let sp = sprint ? 5.1 : 3.3;
    if (Player.speedBoost > 0) sp *= 1.5;
    const dirX = Math.cos(Player.yaw), dirY = Math.sin(Player.yaw);
    let vx = dirX * f - dirY * s, vy = dirY * f + dirX * s;
    const m = Math.hypot(vx, vy);
    if (m > 0 && Player.dashT <= 0) {
        vx = vx / m * sp; vy = vy / m * sp;
        const mv = tryMove(Player.x + vx * dt, Player.y + vy * dt, .3);
        if (mv) { Player.x = mv.x; Player.y = mv.y; }
    }
    if (k.has('Space') && Player.z === 0 && Player.vz === 0) { Player.vz = JUMPV; SFX.jump(); }
    Player.vz -= GRAV * dt; Player.z += Player.vz * dt;
    if (Player.z <= 0) { Player.z = 0; Player.vz = 0; }
    const moving = m > 0 && Player.z === 0 && Player.dashT <= 0;
    if (moving) {
        Player.bobPh += dt * (sprint ? 11 : 8);
        const amp = sprint ? 4.2 : 2.6;
        Player.bobX = Math.cos(Player.bobPh) * amp;
        Player.bobY = Math.sin(Player.bobPh * 2) * amp * .6;
        Player.stepAcc += dt * (sprint ? 1.9 : 1.45);
        if (Player.stepAcc > 1) {
            Player.stepAcc = 0;
            SFX.step(ZONES[zoneGrid[(Player.y | 0) * MW + (Player.x | 0)]].st);
        }
    } else { Player.bobX *= .85; Player.bobY *= .85; }
    const target = clamp(-s * 7 - Input.mx * .06, -14, 14);
    Player.swayV += (-Player.swayX * 60 - Player.swayV * 10) * dt;
    Player.swayX += Player.swayV * dt + (target - Player.swayX) * dt * 4;
    Input.mx = 0;
    Player.kick = Math.max(0, Player.kick - dt * 7);
    Player.muzzle = Math.max(0, Player.muzzle - dt * 14);
    Player.cd -= dt; Player.altCd -= dt;
    if (Player.reloadT > 0) {
        Player.reloadT -= dt;
        if (Player.reloadT <= 0) {
            const w = WEAPONS[Player.wSlot];
            const need = w.mag - Player.mag[Player.wSlot], take = Math.min(need, Player.res[Player.wSlot]);
            Player.mag[Player.wSlot] += take; Player.res[Player.wSlot] -= take;
        }
    }
    if (Input.fire) fireWeapon();
    if (Input.alt && Player.altCd <= 0) {
        Player.altCd = .5; SFX.kick(); Renderer.shake = Math.min(1, Renderer.shake + .15);
        for (const e of enemies) if (e.st !== 4) {
            const d = Math.hypot(e.x - Player.x, e.y - Player.y);
            if (d < 1.7 && Math.abs(wrapA(Math.atan2(e.y - Player.y, e.x - Player.x) - Player.yaw)) < .6) {
                hurtEnemy(e, 12, e.x, e.y);
                const kx = e.x + (e.x - Player.x) / d * .8, ky = e.y + (e.y - Player.y) / d * .8;
                if (!solidAt(kx | 0, ky | 0)) { e.x = kx; e.y = ky; }
            }
        }
    }
    HUD.zone = ZONES[zoneGrid[(Player.y | 0) * MW + (Player.x | 0)]].n;
    if (Player.key && HUD.obj === 1 && HUD.zone === 'ПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ') HUD.obj = 2;
    const pr = 5;
    for (let dy = -pr; dy <= pr; dy++)for (let dx = -pr; dx <= pr; dx++) {
        const fx = (Player.x | 0) + dx, fy = (Player.y | 0) + dy;
        if (fx >= 0 && fy >= 0 && fx < MW && fy < MH && dx * dx + dy * dy <= pr * pr) fogMap[fy * MW + fx] = 1;
    }
}