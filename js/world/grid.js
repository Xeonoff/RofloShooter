import { MW, MH, EMPTY, SOLID, BLOOD_RES } from '../core/config.js';

export const grid = new Uint8Array(MW * MH);
export const zoneGrid = new Uint8Array(MW * MH);
export const flow = new Int8Array(MW * MH);
export const fogMap = new Uint8Array(MW * MH);
export const bloodGrid = new Float32Array(MW * MH);
export const toxicGrid = new Float32Array(MW * MH);
export const elecGrid = new Float32Array(MW * MH);
export const wallBlood = new Float32Array(MW * MH);
export const bloodTrail = new Float32Array(MW * BLOOD_RES * MH * BLOOD_RES);

export const doors = [];
export const doorIdx = new Int16Array(MW * MH).fill(-1);

export const solidAt = (x, y) => {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return 1;
    const i = y * MW + x, t = grid[i];
    if (t === EMPTY || !SOLID[t]) return 0;
    const di = doorIdx[i];
    if (di >= 0) { const d = doors[di]; return d && d.open > 0.7 ? 0 : 1; }
    return 1;
};

export function addBlood(x, y, amt) {
    const cx = x | 0, cy = y | 0;
    if (cx < 1 || cy < 1 || cx >= MW - 1 || cy >= MH - 1) return;
    const i = cy * MW + cx;
    bloodGrid[i] = Math.min(1, bloodGrid[i] + amt);
    bloodGrid[i - 1] = Math.min(1, bloodGrid[i - 1] + amt * .3);
    bloodGrid[i + 1] = Math.min(1, bloodGrid[i + 1] + amt * .3);
    bloodGrid[i - MW] = Math.min(1, bloodGrid[i - MW] + amt * .3);
    bloodGrid[i + MW] = Math.min(1, bloodGrid[i + MW] + amt * .3);
    const bx = (x * BLOOD_RES) | 0, by = (y * BLOOD_RES) | 0;
    const bw = MW * BLOOD_RES;
    const bi = by * bw + bx;
    if (bi >= 0 && bi < bloodTrail.length) bloodTrail[bi] = Math.min(1, bloodTrail[bi] + amt * 1.5);
}
export function addBloodTrail(x, y, amt) {
    const bx = (x * BLOOD_RES) | 0, by = (y * BLOOD_RES) | 0;
    const bw = MW * BLOOD_RES;
    if (bx < 0 || by < 0 || bx >= bw || by >= MH * BLOOD_RES) return;
    bloodTrail[by * bw + bx] = Math.min(1, bloodTrail[by * bw + bx] + amt);
}
export function addWallBlood(x, y, amt) {
    const cx = x | 0, cy = y | 0;
    if (cx < 1 || cy < 1 || cx >= MW - 1 || cy >= MH - 1) return;
    const i = cy * MW + cx;
    wallBlood[i] = Math.min(1, wallBlood[i] + amt);
    wallBlood[i - 1] = Math.min(1, wallBlood[i - 1] + amt * .25);
    wallBlood[i + 1] = Math.min(1, wallBlood[i + 1] + amt * .25);
}

export function resetGrids() {
    bloodGrid.fill(0); toxicGrid.fill(0); bloodTrail.fill(0); wallBlood.fill(0); fogMap.fill(0);
    for (let y = 16; y <= 21; y++)for (let x = 2; x <= 4; x++)toxicGrid[y * MW + x] = 1;
    for (let y = 35; y <= 44; y++)for (let x = 19; x <= 24; x++)toxicGrid[y * MW + x] = .7;
    for (let y = 14; y <= 18; y++)for (let x = 51; x <= 55; x++)toxicGrid[y * MW + x] = .5;
    for (let x = 42; x <= 60; x += 3)elecGrid[3 * MW + x] = 1;
    for (let x = 23; x <= 36; x++)elecGrid[31 * MW + x] = .8;
    for (let x = 52; x <= 60; x += 2)for (let y = 14; y <= 17; y++)elecGrid[y * MW + x] = .6;
}