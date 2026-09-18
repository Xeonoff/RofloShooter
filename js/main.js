import { buildMap } from './world/mapBuilder.js';
import { buildTextures } from './assets/textureGen.js';
import { buildSprites } from './assets/spriteGen.js';
import { Decals } from './fx/decals.js';
import { Game } from './game/gameLoop.js';
import { initInput } from './game/inputBindings.js';
import { Renderer, view } from './render/renderer.js';
import { loadSettings } from './core/settings.js';
import { initSettingsUI, applyResolution } from './ui/settingsUI.js';

if (!view.getContext || !window.requestAnimationFrame) {
    document.body.innerHTML = '<p style="color:#7dffa0;font-family:monospace;padding:40px">' +
        'Браузер не поддерживает Canvas/requestAnimationFrame.</p>';
} else {
    loadSettings();
    applyResolution();
    buildMap();
    buildTextures();
    buildSprites();
    Decals.init();
    initSettingsUI();
    initInput();
    requestAnimationFrame(t => Game.loop(t));
}