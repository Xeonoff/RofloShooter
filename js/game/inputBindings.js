import { PITCH_LIM, DASH_DUR, DASH_CD } from '../core/config.js';
import { Settings } from '../core/settings.js';
import { $, clamp } from '../core/utils.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Game } from './gameLoop.js';
import { interact, closeTerm } from './interact.js';
import { startReload } from './combat.js';
import { SFX } from '../audio/sfx.js';
import { HUD } from '../ui/hud.js';
import { view } from '../render/renderer.js';

export function lockPointer() {
    try { const p = view.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
}

export function initInput() {
    addEventListener('keydown', e => {
        if (e.code === 'Tab') e.preventDefault();
        Input.keys.add(e.code);
        if (e.code === 'KeyE') {
            if (!$('term').classList.contains('hidden')) { closeTerm(); return; }
            if (Game.state === 'play' && !Input.paused) interact(); return;
        }
        if (Game.state !== 'play') return;
        if (e.code === 'KeyR') startReload();
        if (e.code === 'KeyF') {
            Player.flashlight = !Player.flashlight; SFX.ui();
            HUD.toast(Player.flashlight ? 'ФОНАРИК ВКЛ' : 'ФОНАРИК ВЫКЛ');
        }
        if (e.code === 'KeyC' && Player.dashCd <= 0 && Player.dashT <= 0 && !Player.dead) {
            const dirX = Math.cos(Player.yaw), dirY = Math.sin(Player.yaw);
            const f = (Input.keys.has('KeyW') ? 1 : 0) - (Input.keys.has('KeyS') ? 1 : 0);
            const s = (Input.keys.has('KeyD') ? 1 : 0) - (Input.keys.has('KeyA') ? 1 : 0);
            let dx = dirX * f - dirY * s, dy = dirY * f + dirX * s;
            const m = Math.hypot(dx, dy);
            if (m > 0) { dx /= m; dy /= m; } else { dx = dirX; dy = dirY; }
            Player.dashDirX = dx; Player.dashDirY = dy;
            Player.dashT = DASH_DUR; Player.dashCd = DASH_CD;
            SFX.dash();
        }
        if (e.code === 'KeyQ') {
            const owned = [0, 1, 2, 3, 4].filter(i => Player.owned[i]);
            let idx = owned.indexOf(Player.wSlot);
            idx = (idx - 1 + owned.length) % owned.length;
            Player.wSlot = owned[idx]; SFX.ui();
        }
        if (e.code.startsWith('Digit')) {
            const n = +e.code[5] - 1;
            if (n >= 0 && n < 5 && Player.owned[n]) { Player.wSlot = n; SFX.ui(); }
        }
    });
    addEventListener('keyup', e => Input.keys.delete(e.code));
    addEventListener('mousemove', e => {
        if (!Input.locked || Game.state !== 'play') return;
        const mx = clamp(e.movementX, -150, 150), my = clamp(e.movementY, -150, 150);
        Player.yaw += mx * .0023 * Settings.mouseSens;
        Player.pitch = clamp(Player.pitch - my * .09 * Settings.mouseSens, -PITCH_LIM, PITCH_LIM);
        Input.mx += mx;
    });
    addEventListener('mousedown', e => {
        if (Game.state === 'play' && Input.locked) {
            if (e.button === 0) Input.fire = 1;
            if (e.button === 2) Input.alt = 1;
        }
    });
    addEventListener('mouseup', e => { if (e.button === 0) Input.fire = 0; if (e.button === 2) Input.alt = 0; });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('wheel', e => {
        if (Game.state !== 'play') return;
        const owned = [0, 1, 2, 3, 4].filter(i => Player.owned[i]);
        let idx = owned.indexOf(Player.wSlot);
        idx = (idx + (e.deltaY > 0 ? 1 : -1) + owned.length) % owned.length;
        Player.wSlot = owned[idx]; SFX.ui();
    });
    document.addEventListener('pointerlockchange', () => {
        Input.locked = document.pointerLockElement === view;
        if (!Input.locked && Game.state === 'play' && !Input.termOpen) {
            Input.paused = true; $('pause').classList.remove('hidden');
        }
    });

    // Кнопки интерфейса
    $('startBtn').onclick = () => { Game.start(); lockPointer(); };
    $('resumeBtn').onclick = () => { $('pause').classList.add('hidden'); Input.paused = false; lockPointer(); SFX.ui(); };
    $('retryBtn').onclick = () => { Game.reset(); Game.state = 'play'; lockPointer(); SFX.ui(); };
    $('againBtn').onclick = () => { Game.reset(); Game.state = 'play'; lockPointer(); SFX.ui(); };
    $('termClose').onclick = closeTerm;
}