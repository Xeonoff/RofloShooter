import { $ } from '../core/utils.js';
import { Settings, RES_PRESETS, saveSettings } from '../core/settings.js';
import { Renderer } from '../render/renderer.js';

const PANELS = ['m', 'p']; // m = главное меню, p = пауза

function sync() {
    const [rw, rh] = RES_PRESETS[Settings.resIndex];
    for (const p of PANELS) {
        const sens = $(p + '_sens'), bright = $(p + '_bright'), grain = $(p + '_grain'), res = $(p + '_res');
        if (sens) sens.value = Settings.mouseSens;
        if (bright) bright.value = Settings.brightness;
        if (grain) grain.value = Settings.grain;
        if (res) res.textContent = rw + '×' + rh;
        const sv = $(p + '_sensv'), bv = $(p + '_brightv'), gv = $(p + '_grainv');
        if (sv) sv.textContent = Settings.mouseSens.toFixed(2);
        if (bv) bv.textContent = Settings.brightness.toFixed(2);
        if (gv) gv.textContent = Settings.grain.toFixed(1);
    }
}

export function applyResolution() {
    const [w, h] = RES_PRESETS[Settings.resIndex];
    Renderer.setResolution(w, h);
}

export function initSettingsUI() {
    for (const p of PANELS) {
        const sens = $(p + '_sens'), bright = $(p + '_bright'), grain = $(p + '_grain'), res = $(p + '_res');
        if (sens) sens.addEventListener('input', () => { Settings.mouseSens = +sens.value; saveSettings(); sync(); });
        if (bright) bright.addEventListener('input', () => { Settings.brightness = +bright.value; saveSettings(); sync(); });
        if (grain) grain.addEventListener('input', () => { Settings.grain = +grain.value; saveSettings(); sync(); });
        if (res) res.addEventListener('click', () => {
            Settings.resIndex = (Settings.resIndex + 1) % RES_PRESETS.length;
            saveSettings(); applyResolution(); sync();
        });
    }
    sync();
}