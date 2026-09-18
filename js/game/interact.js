import { MW, MH } from '../core/config.js';
import { $ } from '../core/utils.js';
import { doors, toxicGrid, elecGrid, zoneGrid } from '../world/grid.js';
import { ZONES } from '../world/zones.js';
import { Player, damagePlayer } from './player.js';
import { Input } from './input.js';
import { pickups, corpses, terms, switches, LORE } from './entities.js';
import { Projectiles, barrels } from './projectiles.js';
import { Parts } from '../fx/particles.js';
import { Lights } from '../render/lights.js';
import { Renderer } from '../render/renderer.js';
import { SFX } from '../audio/sfx.js';
import { HUD } from '../ui/hud.js';

export function updateInteract(dt) {
    // Двери
    for (const d of doors) {
        if (d.opening && d.open < 1) { d.open = Math.min(1, d.open + dt * 2.4); if (d.open >= 1) d.opening = 0; }
        const pd = Math.hypot(d.x + .5 - Player.x, d.y + .5 - Player.y);
        if (!d.secret && !d.locked && pd < 1.5 && !d.opening && d.open < 1) { d.opening = 1; SFX.door(); }
    }

    // Подбор предметов
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i]; p.bob += dt * 3;
        if (Math.hypot(p.x - Player.x, p.y - Player.y) < .6) {
            let ok = 1, msg = '';
            switch (p.t) {
                case 'med':
                    if (Player.hp >= 100) ok = 0;
                    else { Player.hp = Math.min(100, Player.hp + 35); msg = '+ АПТЕЧКА «WELLNESS KIT™»'; } break;
                case 'armor':
                    if (Player.armor >= 100) ok = 0;
                    else { Player.armor = Math.min(100, Player.armor + 50); msg = '+ БРОНЕЖИЛЕТ «СТЕПЛЕР-ЗАЩИТА»'; } break;
                case 'ammo': Player.res[1] += 24; Player.res[4] += 24; msg = '+ ПАТРОНЫ 9ММ ×24 / ГВОЗДИ ×24'; break;
                case 'shell': Player.res[2] += 8; msg = '+ ДРОБЬ ×8'; break;
                case 'rock': Player.res[3] += 3; msg = '+ СКРЕПКИ-ОС ×3'; break;
                case 'shotgun':
                    Player.owned[2] = 1; Player.mag[2] = 6; Player.res[2] += 12;
                    msg = 'ПОДОБРАН: ДРОБОВИК «УБОРЩИК-12»'; Player.wSlot = 2; break;
                case 'stapler':
                    Player.owned[3] = 1; Player.mag[3] = 4;
                    msg = 'ПОДОБРАН: СТЕПЛЕР-ПУШКА МК-IV'; Player.wSlot = 3; break;
                case 'nailgun':
                    Player.owned[4] = 1; Player.mag[4] = 24; Player.res[4] += 48;
                    msg = 'ПОДОБРАН: ГВОЗДОМЁТ «СТРОИТЕЛЬ»'; Player.wSlot = 4; break;
                case 'key': Player.key = 1; msg = 'КЛЮЧ-КАРТА ДОСТУПА [УРОВЕНЬ: ДИРЕКТОРАТ]'; HUD.obj = 1; break;
                case 'speed': Player.speedBoost = 8; msg = '⚡ УСКОРИТЕЛЬ «КОФЕ-БРЕЙК» (8с)'; SFX.powerup(); break;
                case 'damage': Player.dmgBoost = 6; msg = '💀 УСИЛИТЕЛЬ «ПРЕМИАЛЬНЫЙ» ×2 (6с)'; SFX.powerup(); break;
            }
            if (ok) { pickups.splice(i, 1); SFX.pick(); HUD.toast(msg); if (p.t === 'key') SFX.key(); }
        }
    }

    // Бочки
    for (const b of barrels) {
        if (b.exploded === 1) {
            b.timer -= dt;
            if (b.timer <= 0) { b.exploded = 2; Projectiles.explode(b.x, b.y, .4, false); }
        }
        else if (b.exploded === 0 && b.hp <= 0) { b.exploded = 1; b.timer = .05; }
    }

    Projectiles.update(dt); Lights.update(dt);

    // Контекст взаимодействия
    HUD.termNear = null;
    for (const t of terms) if (Math.hypot(t.x - Player.x, t.y - Player.y) < 1.6) HUD.termNear = t;
    HUD.doorNear = null;
    for (const d of doors) if (d.secret && d.open < 1 && Math.hypot(d.x + .5 - Player.x, d.y + .5 - Player.y) < 1.7) HUD.doorNear = d;
    HUD.switchNear = null;
    for (const s of switches) if (!s.on && Math.hypot(s.x - Player.x, s.y - Player.y) < 1.5) HUD.switchNear = s;

    // Опасности под ногами
    const pci = (Player.y | 0) * MW + (Player.x | 0);
    if (pci >= 0 && pci < MW * MH) {
        if (toxicGrid[pci] > 0.3 && !Player.dead) {
            Player.toxicT = (Player.toxicT || 0) + dt;
            if (Player.toxicT > 0.5) {
                Player.toxicT = 0; damagePlayer(3, Player.x, Player.y);
                Parts.toxic(Player.x, Player.y, .2);
            }
        } else Player.toxicT = 0;
        if (elecGrid[pci] > 0.5 && !Player.dead) {
            Player.elecT = (Player.elecT || 0) + dt;
            if (Player.elecT > 0.3) {
                Player.elecT = 0; damagePlayer(5, Player.x, Player.y);
                Parts.elecArc(Player.x, Player.y, .3); SFX.metal();
                Renderer.shake = Math.min(1, Renderer.shake + .2);
            }
        } else Player.elecT = 0;
    }
}

export function interact() {
    if (HUD.termNear) {
        const l = LORE[HUD.termNear.lore];
        $('termTitle').textContent = l.t; $('termText').textContent = l.b;
        $('term').classList.remove('hidden');
        Input.termOpen = true; Input.paused = true; SFX.ui(); return;
    }
    if (HUD.doorNear) {
        const d = HUD.doorNear; d.opening = 1; d.secret = 0;
        Player.secrets++; HUD.toast('СЕКРЕТ ' + Player.secrets + '/4: ФАЛЬШИВАЯ СТЕНА!'); SFX.secret();
        if (Player.secrets === 1) { Player.res[1] += 36; HUD.toast('НАЙДЕНЫ ПАТРОНЫ ×36'); }
        if (Player.secrets === 2) { Player.armor = Math.min(100, Player.armor + 25); HUD.toast('НАЙДЕНА БРОНЯ +25'); }
        if (Player.secrets === 3) { Player.hp = Math.min(100, Player.hp + 50); HUD.toast('НАЙДЕНА АПТЕЧКА +50'); }
        if (Player.secrets === 4) { Player.res[3] += 4; HUD.toast('НАЙДЕНЫ СКРЕПКИ-ОС ×4'); }
        return;
    }
    if (HUD.switchNear) {
        const s = HUD.switchNear; s.on = true;
        SFX.switchOn(); HUD.toast('РУБИЛЬНИК: ОСВЕЩЕНИЕ УСИЛЕНО');
        const zi = zoneGrid[(s.y | 0) * MW + (s.x | 0)];
        ZONES[zi].li = Math.min(1, ZONES[zi].li + .2);
        Lights.add(s.x, s.y, .5, 1, 1, .8, 5, 2); return;
    }
    for (const d of doors) {
        if (Math.hypot(d.x + .5 - Player.x, d.y + .5 - Player.y) < 1.9) {
            if (d.locked) {
                if (Player.key) { d.locked = 0; d.opening = 1; HUD.toast('ДОСТУП РАЗРЕШЁН'); SFX.key(); }
                else { HUD.toast('ТРЕБУЕТСЯ КЛЮЧ-КАРТА [УРОВЕНЬ: ДИРЕКТОРАТ]'); SFX.dry(); }
            }
            else if (d.open < 1 && !d.opening) { d.opening = 1; SFX.door(); }
            break;
        }
    }
}

export function closeTerm() {
    $('term').classList.add('hidden'); Input.termOpen = false; SFX.ui();
    if (Input.locked) Input.paused = false;
    else { Input.paused = true; $('pause').classList.remove('hidden'); }
}