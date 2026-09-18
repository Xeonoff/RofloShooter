import { STEP, MAX_STEPS, MW } from '../core/config.js';
import { Input } from './input.js';
import { $, R, clamp } from '../core/utils.js';
import { resetGrids, zoneGrid, solidAt, toxicGrid, elecGrid } from '../world/grid.js';
import { ZONES } from '../world/zones.js';
import { Player, updatePlayer } from './player.js';
import { enemies, EDEF, computeFlow, updateEnemies } from './enemies.js';
import { updateInteract } from './interact.js';
import { Parts } from '../fx/particles.js';
import { Decals } from '../fx/decals.js';
import { Gibs } from '../fx/gibs.js';
import { Serpents } from '../fx/serpents.js';
import { Projectiles, barrels } from './projectiles.js';
import { initEntities, pickups, corpses } from './entities.js';
import { Renderer, view, vctx, scene } from '../render/renderer.js';
import { Lights } from '../render/lights.js';
import { HUD, floats } from '../ui/hud.js';
import { SFX } from '../audio/sfx.js';
import { SPR } from '../assets/spriteGen.js';

let ambT = 0;
const addS = (tex, x, y, sH, zB, flash) => Renderer.addSprite(tex, x, y, sH, zB, flash || 0);

export const Game = {
    state: 'menu', last: 0, acc: 0,
    start() {
        this.reset(); this.state = 'play';
        $('menu').classList.add('hidden');
        SFX.init(); if (SFX.ctx) SFX.ctx.resume();
    },
    reset() {
        Player.reset(); Parts.n = 0; Decals.init(); Gibs.list.length = 0; Serpents.list.length = 0;
        resetGrids();
        Lights.list.length = 0;
        initEntities();
        HUD.obj = 0; HUD.toasts = []; floats.length = 0;
        Renderer.flash = 0; Renderer.shake = 0; Renderer.hitstop = 0;
        HUD._hp = 100; HUD.dmg = 0; HUD.dmgPop = 0;
        $('dead').classList.add('hidden'); $('win').classList.add('hidden');
        computeFlow();
    },
    showEnd(win) {
        if (document.exitPointerLock) document.exitPointerLock();
        const t = Player.time | 0, mm = String(t / 60 | 0).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
        const acc = Player.shots ? Math.min(100, Player.hits / Player.shots * 100 | 0) : 0;
        let score = Player.kills * 100 + Player.maxCombo * 50 + acc * 2 + Player.secrets * 200 + Player.gibs * 25;
        if (win) score += 1000;
        score -= Player.time * 2 | 0;
        let rating = 'D';
        if (score > 3500) rating = 'S'; else if (score > 2500) rating = 'A'; else if (score > 1500) rating = 'B'; else if (score > 700) rating = 'C';
        const ratingText = { S: 'ЛЕГЕНДА ПЕРЕРАБОТКИ', A: 'ПЕРЕДОВИК ПРОИЗВОДСТВА', B: 'СТАБИЛЬНЫЙ СОТРУДНИК', C: 'ТРЕБУЕТСЯ АТТЕСТАЦИЯ', D: 'КАНДИДАТ НА УТИЛИЗАЦИЮ' };
        const s = `ВРЕМЯ СМЕНЫ: <span>${mm}:${ss}</span><br>УСТРАНЕНО: <span>${Player.kills}</span><br>ТОЧНОСТЬ: <span>${acc}%</span><br>МАКС. СЕРИЯ: <span>×${Player.maxCombo}</span><br>РАСЧЛЕНЕНИЙ: <span>${Player.gibs}</span><br>СЕКРЕТЫ: <span>${Player.secrets}/4</span><br>ОСТАТОК HP: <span>${Math.ceil(clamp(Player.hp, 0, 100))}%</span><br>ОЧКИ: <span>${Math.max(0, score)}</span>`;
        if (win) {
            $('winRating').textContent = 'РАНГ: ' + rating + ' — ' + ratingText[rating];
            $('winStats').innerHTML = s + '<br><br>ПРЕМИЯ: <span>+2 СКРЕПКИ</span>. ПЕРЕВОД В СЛЕДУЮЩИЙ ОТДЕЛ ОТКЛОНЁН.';
            $('win').classList.remove('hidden');
        }
        else {
            $('deadRating').textContent = 'РАНГ: ' + rating + ' — ' + ratingText[rating];
            $('deadStats').innerHTML = s + '<br><br>СТОИМОСТЬ УТИЛИЗАЦИИ ВЫЧТЕНА ИЗ ЗАРПЛАТЫ.';
            $('dead').classList.remove('hidden');
        }
    },
    loop(ts) {
        requestAnimationFrame(t => this.loop(t));
        if (!this.last) this.last = ts;
        let dt = (ts - this.last) / 1000; this.last = ts;
        if (dt > .1) dt = .1;
        if (this.state === 'play' && !Input.paused) {
            this.acc += dt; let n = 0;
            while (this.acc >= STEP && n++ < MAX_STEPS) { this.tick(STEP); this.acc -= STEP; }
            if (n >= MAX_STEPS) this.acc = 0;
        }
        if (this.state !== 'menu') this.render();
    },
    tick(dt) {
        Renderer.updateFX(dt);
        updatePlayer(dt); updateEnemies(dt); updateInteract(dt);
        Parts.update(dt); Decals.update(dt); Gibs.update(dt); Serpents.update(dt); HUD.update(dt);
        ambT -= dt;
        if (ambT <= 0) {
            ambT = .12;
            const a = R() * 6.3, d = 1 + R() * 5;
            const x = Player.x + Math.cos(a) * d, y = Player.y + Math.sin(a) * d;
            if (!solidAt(x | 0, y | 0)) {
                const zi = zoneGrid[(y | 0) * MW + (x | 0)], z = ZONES[zi];
                if (R() < .7) Parts.dust(x, y, .2 + R() * .6);
                if (z.n === 'АРХИВ' && R() < .3) Parts.paper(x, y, .5 + R() * .4);
                if (z.n === 'ПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ' && R() < .4) Parts.ash(x, y, .9);
                if ((z.n === 'СЕРВЕРНАЯ' || z.n === 'ВЕНТШАХТА' || z.n === 'ГЕНЕРАТОРНАЯ') && R() < .3) Parts.sparks(x, y, .8, 2, 1);
                if (R() < .08) Parts.drip(x, y);
                if (z.n === 'ПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ' && R() < .2) Parts.smoke(x, y, .1, 1);
                if (toxicGrid[(y | 0) * MW + (x | 0)] > 0.3 && R() < .3) Parts.toxic(x, y, .05);
                if (elecGrid[(y | 0) * MW + (x | 0)] > 0.5 && R() < .2) Parts.elecArc(x, y, .1);
                if (z.li < .5 && R() < .05) Lights.add(x, y, .8, .6, .8, .5, 1.5, .3 + R() * .3);
            }
        }
    },
    render() {
        Renderer.beginSprites();
        for (const e of enemies) {
            if (e.corpse || e.st === 4) continue;
            const d = EDEF[e.t], fr = (e.anim | 0) & 1;
            addS(SPR[d.spr + (fr ? '2' : '')], e.x, e.y, d.h, d.flying ? e.flyZ : 0, e.flash);
            if (e.atk > 0) addS(SPR.flash, e.x, e.y, .3, d.h * .7 - .1, 0);
        }
        Gibs.render();
        for (const c of corpses) addS(c.tex, c.x, c.y, c.sH, 0, 0);
        const pickTex = {
            med: SPR.med, ammo: SPR.ammo, shell: SPR.shell, rock: SPR.rock, armor: SPR.armor,
            key: SPR.key, shotgun: SPR.shotgunPick, stapler: SPR.staplerPick, nailgun: SPR.shotgunPick,
            speed: SPR.speed, damage: SPR.damage
        };
        for (const p of pickups) addS(pickTex[p.t], p.x, p.y, .3, .1 + Math.sin(p.bob) * .05, 0);
        for (const b of barrels) if (!b.exploded) addS(SPR.barrel, b.x, b.y, .8, 0, 0);
        for (const p of Projectiles.list) addS(p.enemy ? SPR.projE : SPR.proj, p.x, p.y, .16, p.z - .08, 0);
        Renderer.renderWorld(Player, Parts, Decals);
        const g = vctx, W = view.width, H = view.height;
        g.drawImage(scene, 0, 0, W, H);
        if (HUD.dmg > .35) {
            g.globalAlpha = .18;
            g.drawImage(scene, -3, 0, W, H); g.drawImage(scene, 3, 0, W, H); g.globalAlpha = 1;
        }
        g.fillStyle = 'rgba(0,0,0,0.03)';
        for (let y = 0; y < H; y += 3)g.fillRect(0, y, W, 1);
        HUD.draw(g);
    }
};