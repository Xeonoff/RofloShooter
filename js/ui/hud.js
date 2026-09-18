import { HUD_W, HUD_H, MW, MH, T, SOLID, EMPTY, COMBO_WINDOW, PLANE } from '../core/config.js';
import { clamp, wrapA } from '../core/utils.js';
import { fogMap, grid, toxicGrid, elecGrid, doors } from '../world/grid.js';
import { WEAPONS } from '../game/weaponDefs.js';
import { Player } from '../game/player.js';
import { enemies, ET } from '../game/enemies.js';
import { pickups } from '../game/entities.js';
import { Input } from '../game/input.js';
import { view } from '../render/renderer.js';
import { SFX } from '../audio/sfx.js';

export const floats = [];

export function addFloat(x, y, z, txt, c, sz) {
    const dirX = Math.cos(Player.yaw), dirY = Math.sin(Player.yaw), plX = -dirY * PLANE, plY = dirX * PLANE;
    const inv = 1 / (plX * dirY - dirX * plY), rx = x - Player.x, ry = y - Player.y;
    const ty = inv * (-plY * rx + plX * ry); if (ty < .2) return;
    const tx = inv * (dirY * rx - dirX * ry);
    const sx = (HUD_W / 2) * (1 + tx / ty),
        sy = HUD_H / 2 + (HUD_H / ty) * (0.5 + Player.z - z) + (Player.pitch / 200) * HUD_H;
    floats.push({ x: sx, y: sy, txt, c, sz, life: .8 });
}

export const HUD = {
    dmg: 0, dmgPop: 0, dmgAng: 0, _hp: 100, _dmgSet: false,
    termNear: null, doorNear: null, switchNear: null, noise: 0, noiseX: 0, noiseY: 0, obj: 0, zone: '',
    toasts: [], heartT: 0,
    toast(t) { this.toasts.push({ t, life: 3 }); if (this.toasts.length > 5) this.toasts.shift(); },
    update(dt) {
        if (Player.hp < this._hp) {
            this.dmg = 1; this.dmgPop = 1;
            if (!this._dmgSet) {
                let bd = 1e9, bx = Player.x, by = Player.y;
                for (const e of enemies) if (e.st !== 4) {
                    const d = (e.x - Player.x) * (e.x - Player.x) + (e.y - Player.y) * (e.y - Player.y);
                    if (d < bd) { bd = d; bx = e.x; by = e.y; }
                }
                this.dmgAng = Math.atan2(by - Player.y, bx - Player.x);
            }
        }
        this._dmgSet = false; this._hp = Player.hp;
        this.dmg = Math.max(0, this.dmg - dt * 1.0);
        this.dmgPop = Math.max(0, this.dmgPop - dt * 3.2);
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            this.toasts[i].life -= dt;
            if (this.toasts[i].life <= 0) this.toasts.splice(i, 1);
        }
        for (let i = floats.length - 1; i >= 0; i--) {
            const f = floats[i]; f.life -= dt; f.y -= 46 * dt;
            if (f.life <= 0) floats.splice(i, 1);
        }
        if (Player.hp < 30 && !Player.dead) {
            this.heartT -= dt;
            if (this.heartT <= 0) { this.heartT = 1.1; SFX.heart(); }
        }
    },
    draw(g) {
        const W = HUD_W, H = HUD_H;
        g.save(); g.scale(view.width / W, view.height / H); g.shadowBlur = 0;
        const grn = '#7dffa0', dim = '#2f7a45', red = '#ff4636', amb = '#ffb454', cyan = '#4de8ff';
        const T2 = (s, x, y) => { g.globalAlpha = .3; g.fillText(s, x + 2, y + 2); g.globalAlpha = 1; g.fillText(s, x, y); };
        g.textBaseline = 'top';
        g.fillStyle = grn; g.font = 'bold 15px Courier New';
        const objs = ['ЦЕЛЬ: НАЙДИТЕ КЛЮЧ-КАРТУ [СЕРВЕРНАЯ]',
            'ЦЕЛЬ: ПРОЙДИТЕ В ПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ',
            'ЦЕЛЬ: УСТРАНИТЕ ГЕНЕРАЛЬНОГО ДИРЕКТОРА', 'ЦЕЛЬ ВЫПОЛНЕН'];
        T2('▸ ' + objs[Math.min(this.obj, 3)], 18, 16);
        g.font = 'bold 12px Courier New'; g.fillStyle = dim;
        T2('УСТРАНЕНИЙ: ' + Player.kills + '  СЕКРЕТЫ: ' + Player.secrets + '/4  РАСЧЛЕНЕНИЙ: ' + Player.gibs + '  ' + this.zone, 18, 38);
        if (Player.combo >= 2) {
            g.font = 'bold 18px Courier New'; g.fillStyle = Player.combo >= 5 ? red : amb;
            T2('СЕРИЯ ×' + Player.combo, 18, 56);
            g.fillStyle = dim; g.fillRect(18, 76, 100, 4);
            g.fillStyle = amb; g.fillRect(18, 76, 100 * (Player.comboTimer / COMBO_WINDOW), 4);
        }
        let py2 = 90;
        g.font = 'bold 11px Courier New';
        if (Player.speedBoost > 0) { g.fillStyle = cyan; T2('⚡ СКОРОСТЬ: ' + Player.speedBoost.toFixed(1) + 'с', 18, py2); py2 += 16; }
        if (Player.dmgBoost > 0) { g.fillStyle = red; T2('💀 УРОН ×2: ' + Player.dmgBoost.toFixed(1) + 'с', 18, py2); py2 += 16; }
        if (Player.dashCd > 0) { g.fillStyle = dim; T2('РЫВОК: ' + Player.dashCd.toFixed(1) + 'с', 18, py2); py2 += 16; }
        const big = Input.keys.has('Tab');
        const cs = big ? 7 : 3, mx = W - MW * cs - 18, my = 16;
        g.globalAlpha = big ? .92 : .8;
        g.fillStyle = '#04080a'; g.fillRect(mx, my, MW * cs, MH * cs);
        for (let y = 0; y < MH; y++)for (let x = 0; x < MW; x++) {
            if (!fogMap[y * MW + x]) continue;
            const t = grid[y * MW + x];
            if (t === EMPTY || !SOLID[t]) {
                if (toxicGrid[y * MW + x] > 0.3) { g.fillStyle = 'rgba(40,180,60,.4)'; g.fillRect(mx + x * cs, my + y * cs, cs, cs); }
                else if (elecGrid[y * MW + x] > 0.5) { g.fillStyle = 'rgba(100,150,255,.3)'; g.fillRect(mx + x * cs, my + y * cs, cs, cs); }
                continue;
            }
            g.fillStyle = (t === T.LDOOR) ? '#ff4636' : (t === T.DOOR ? '#8a6a2c' : '#28483a');
            g.fillRect(mx + x * cs, my + y * cs, cs, cs);
        }
        for (const d of doors) {
            if (!fogMap[d.y * MW + d.x]) continue;
            g.fillStyle = d.open > .7 ? '#04080a' : (d.locked ? red : (d.secret ? '#b44dff' : '#8a6a2c'));
            g.fillRect(mx + d.x * cs, my + d.y * cs, cs, cs);
        }
        g.strokeStyle = dim; g.strokeRect(mx - 4, my - 4, MW * cs + 8, MH * cs + 8);
        for (const p of pickups) {
            if (!fogMap[(p.y | 0) * MW + (p.x | 0)]) continue;
            g.fillStyle = p.t === 'key' ? red : (p.t === 'speed' || p.t === 'damage' ? cyan : '#ffd028');
            g.fillRect(mx + p.x * cs - 1, my + p.y * cs - 1, 3, 3);
        }
        for (const e of enemies) if (e.st !== 4 && e.st !== 0) {
            g.fillStyle = e.t === ET.CEO ? '#ff2c1e' : (e.t === ET.DRONE ? '#4de8ff' : '#c04030');
            g.fillRect(mx + e.x * cs - 1, my + e.y * cs - 1, e.t === ET.CEO ? 5 : 3, e.t === ET.CEO ? 5 : 3);
        }
        g.save(); g.translate(mx + Player.x * cs, my + Player.y * cs); g.rotate(Player.yaw);
        g.fillStyle = grn; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-4, 4); g.closePath(); g.fill();
        g.restore(); g.globalAlpha = 1;
        g.font = 'bold 10px Courier New'; g.fillStyle = dim; T2('ПЛАН ЭТАЖА · TAB', mx, my + MH * cs + 8);
        const by = H - 64;
        g.fillStyle = grn; g.font = 'bold 11px Courier New'; T2('БИО-РЕСУРС СОТРУДНИКА', 18, by - 16);
        g.strokeStyle = dim; g.strokeRect(18, by + 2, 220, 16);
        const hpC = Player.hp > 60 ? grn : Player.hp > 30 ? amb : red;
        g.fillStyle = hpC; g.fillRect(20, by + 4, 216 * clamp(Player.hp, 0, 100) / 100, 12);
        g.font = 'bold 22px Courier New';
        T2(String(Math.ceil(clamp(Player.hp, 0, 100))).padStart(3, '0') + '%', 248, by - 4);
        g.font = 'bold 11px Courier New'; g.fillStyle = '#7fb4d8';
        T2('БРОНЯ: ' + Player.armor, 18, by + 26);
        g.fillRect(90, by + 28, Player.armor * 1.2, 6);
        const w = WEAPONS[Player.wSlot];
        g.textAlign = 'right'; g.fillStyle = amb; g.font = 'bold 40px Courier New';
        T2(w.melee ? '∞' : String(Player.mag[Player.wSlot]).padStart(2, '0'), W - 90, by - 14);
        g.font = 'bold 16px Courier New'; g.fillStyle = grn;
        T2('/ ' + (w.melee ? '—' : Player.res[Player.wSlot]), W - 20, by + 2);
        g.font = 'bold 12px Courier New'; g.fillStyle = dim; T2(w.n, W - 20, by + 26);
        if (Player.key) { g.fillStyle = red; T2('■ КЛЮЧ-КАРТА', W - 20, by + 42); }
        if (Player.flashlight) { g.fillStyle = cyan; T2('◉ ФОНАРИК', W - 20, by + 56); }
        if (Player.reloadT > 0) { g.fillStyle = amb; T2('ПЕРЕЗАРЯДКА…', W - 20, by - 34); }
        g.textAlign = 'left';
        for (let i = 0; i < 5; i++) {
            g.fillStyle = Player.owned[i] ? (i === Player.wSlot ? grn : dim) : '#152018';
            g.font = 'bold 11px Courier New';
            T2((i + 1) + '·' + ['НОЖ', 'ПИС', 'ДРОБ', 'СТПЛ', 'ГВОЗД'][i], 18 + i * 52, by + 46);
        }
        const spn = 4 + Player.kick * 10 + (w.sp || 0) * 160;
        g.strokeStyle = grn; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(W / 2 - spn - 6, H / 2); g.lineTo(W / 2 - spn, H / 2);
        g.moveTo(W / 2 + spn, H / 2); g.lineTo(W / 2 + spn + 6, H / 2);
        g.moveTo(W / 2, H / 2 - spn - 6); g.lineTo(W / 2, H / 2 - spn);
        g.moveTo(W / 2, H / 2 + spn); g.lineTo(W / 2, H / 2 + spn + 6); g.stroke();
        g.textAlign = 'center'; g.font = 'bold 14px Courier New'; g.fillStyle = grn;
        if (this.termNear) T2('[E] ЧИТАТЬ ТЕРМИНАЛ', W / 2, H / 2 + 44);
        else if (this.doorNear) T2('[E] ОСМОТРЕТЬ СТЕНУ', W / 2, H / 2 + 44);
        else if (this.switchNear) T2('[E] АКТИВИРОВАТЬ РУБИЛЬНИК', W / 2, H / 2 + 44);
        g.font = 'bold 13px Courier New';
        this.toasts.forEach((t, i) => {
            g.globalAlpha = clamp(t.life, 0, 1); g.fillStyle = amb;
            T2(t.t, W / 2, H / 2 - 90 - i * 20);
        });
        g.globalAlpha = 1;
        for (const f of floats) {
            g.globalAlpha = clamp(f.life, 0, 1);
            g.font = 'bold ' + f.sz + 'px Courier New'; g.fillStyle = f.c;
            g.fillText(f.txt, f.x, f.y);
        }
        g.globalAlpha = 1; g.textAlign = 'left';
        if (this.dmg > 0) {
            const a = this.dmg, pop = this.dmgPop;
            const rel = wrapA(this.dmgAng - Player.yaw);
            const sx = Math.sin(rel), sy = -Math.cos(rel);
            const gx = W / 2 - sx * W * .22, gy = H / 2 - sy * H * .22;
            const rg = g.createRadialGradient(gx, gy, H * .1, gx, gy, H * .95);
            rg.addColorStop(0, 'rgba(160,10,5,0)'); rg.addColorStop(1, 'rgba(160,10,5,' + (a * .6) + ')');
            g.fillStyle = rg; g.fillRect(0, 0, W, H);
            const sc = 1 + pop * .3;
            g.save(); g.translate(W / 2, H / 2); g.rotate(rel); g.scale(sc, sc);
            g.fillStyle = 'rgba(255,40,22,' + (a * .3) + ')';
            g.beginPath(); g.moveTo(0, -H * .48); g.lineTo(-44, -H * .27); g.lineTo(0, -H * .34); g.lineTo(44, -H * .27); g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,72,40,' + (a * .92) + ')';
            g.beginPath(); g.moveTo(0, -H * .46); g.lineTo(-27, -H * .29); g.lineTo(0, -H * .35); g.lineTo(27, -H * .29); g.closePath(); g.fill();
            g.restore();
        }
        if (Player.hp < 30 && !Player.dead) {
            const p = (Math.sin(performance.now() / 180) + 1) / 2 * .28;
            const rg = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .8);
            rg.addColorStop(0, 'rgba(120,0,0,0)'); rg.addColorStop(1, 'rgba(120,0,0,' + p + ')');
            g.fillStyle = rg; g.fillRect(0, 0, W, H);
        }
        g.restore();
    }
};