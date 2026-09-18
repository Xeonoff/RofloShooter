export const RES_PRESETS = [[320, 200], [400, 250], [480, 300], [640, 400]];

export const Settings = {
    mouseSens: 1.0,
    resIndex: 0,
    brightness: 1.0,
    grain: 1.0,
};

const KEY = 'perek13_settings';
const clampNum = (v, a, b) => v < a ? a : v > b ? b : v;

export function loadSettings() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (typeof s.mouseSens === 'number') Settings.mouseSens = clampNum(s.mouseSens, 0.3, 2.5);
        if (Number.isInteger(s.resIndex)) Settings.resIndex = ((s.resIndex % RES_PRESETS.length) + RES_PRESETS.length) % RES_PRESETS.length;
        if (typeof s.brightness === 'number') Settings.brightness = clampNum(s.brightness, 0.6, 1.6);
        if (typeof s.grain === 'number') Settings.grain = clampNum(s.grain, 0, 2);
    } catch (e) { /* повреждённые настройки игнорируем */ }
}

export function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(Settings)); } catch (e) { }
}