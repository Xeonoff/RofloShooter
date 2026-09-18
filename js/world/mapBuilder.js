import { MW, MH, EMPTY } from '../core/config.js';
import { grid, zoneGrid, doors, doorIdx } from './grid.js';
import { ZONES, zoneAt } from './zones.js';

export function buildMap() {
    grid.fill(35);
    const set = (x, y, c) => { if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) grid[y * MW + x] = c.charCodeAt(0); };
    const room = (x, y, w, h) => { for (let j = y; j < y + h; j++)for (let i = x; i < x + w; i++)set(i, j, ' '); };
    room(1, 1, 14, 11); room(16, 1, 15, 11); room(32, 1, 7, 11); room(40, 1, 23, 11);
    room(1, 13, 62, 2);
    room(6, 15, 3, 9); room(1, 15, 4, 8);
    room(1, 24, 16, 22); room(16, 16, 22, 14); room(38, 13, 2, 33);
    room(16, 30, 22, 1); room(22, 31, 16, 2); room(18, 34, 19, 12); room(40, 20, 23, 26);
    room(50, 13, 13, 6); room(1, 44, 16, 3);
    for (let y = 20; y <= 45; y++)set(40, y, '#');
    for (let y = 16; y <= 29; y++)set(37, y, '#');
    for (let x = 50; x <= 62; x++)set(x, 19, '#');
    const door = (x, y, c) => {
        set(x, y, c); doorIdx[y * MW + x] = doors.length;
        doors.push({ x, y, open: 0, opening: 0, locked: c === 'D', secret: c === 's' });
    };
    door(7, 12, 'd'); door(20, 12, 'd'); door(26, 12, 'd'); door(35, 12, 'd'); door(45, 12, 'd'); door(55, 12, 'd');
    set(20, 15, ' '); set(30, 15, ' ');
    set(37, 19, ' '); door(37, 26, 'd'); door(37, 35, 'd');
    door(40, 25, 'D'); door(40, 31, 'd'); door(40, 38, 'd');
    door(26, 33, 'd'); door(5, 19, 's');
    door(55, 19, 's'); door(3, 44, 's'); door(30, 45, 's');
    for (const sy of [3, 5, 7, 9]) for (let x = 2; x <= 13; x++)if (x !== 5 && x !== 9) set(x, sy, 'A');
    for (const sx of [3, 7, 11]) for (let y = 2; y <= 9; y++)if (y !== 4 && y !== 7) set(sx, y, 'A');
    for (const cy of [18, 21, 24, 27]) for (let x = 17; x <= 36; x++)if ((x - 17) % 4 !== 3) set(x, cy, '=');
    for (const cx of [20, 28, 33]) { set(cx, 19, '='); set(cx, 25, '='); }
    for (const sy of [2, 4, 6, 8]) for (let x = 41; x <= 61; x++)if (x !== 45 && x !== 52 && x !== 58) set(x, sy, 'S');
    for (const [tx, ty] of [[20, 3], [22, 3], [24, 3], [26, 3], [20, 8], [22, 8], [24, 8], [26, 8]]) set(tx, ty, 'O');
    set(35, 2, 'O'); set(36, 2, 'O');
    for (const [tx, ty] of [[4, 28], [8, 28], [12, 28], [4, 33], [8, 33], [12, 33], [4, 38], [8, 38], [12, 38]]) set(tx, ty, 'O');
    for (let x = 41; x <= 61; x += 2)set(x, 21, 'B');
    for (let y = 22; y <= 44; y += 3) { if (y !== 25 && y !== 31 && y !== 38) set(41, y, 'B'); set(61, y, 'B'); }
    for (let x = 52; x <= 60; x += 3)for (let y = 14; y <= 17; y++)set(x, y, 'S');

    for (let y = 0; y < MH; y++)for (let x = 0; x < MW; x++)zoneGrid[y * MW + x] = zoneAt(x, y);
    const orig = grid.slice();
    const NB = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const CHAR_WALL_LOCAL = { '#': 0, '%': 1, '=': 2, '~': 3, 'S': 4, 'A': 5, 'T': 6, 'B': 7, 'V': 8, 'O': 9, 'd': 10, 'D': 11, 's': 0 };
    for (let y = 0; y < MH; y++)for (let x = 0; x < MW; x++) {
        const i = y * MW + x, ch = orig[i];
        if (ch === 32) { grid[i] = EMPTY; continue; }
        const s = String.fromCharCode(ch);
        if (s === '#') {
            let z = -1;
            for (let k = 0; k < 8 && z < 0; k++) {
                const nx = x + NB[k][0], ny = y + NB[k][1];
                if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && orig[ny * MW + nx] === 32) z = zoneGrid[ny * MW + nx];
            }
            let t = z >= 0 ? ZONES[z].wall : 0;
            if ((x * 7 + y * 13) % 29 === 0) t = 1;
            else if (z >= 0 && (x * 11 + y * 5) % 41 === 0 && ZONES[z].wall === 0) t = 2;
            grid[i] = t;
        } else grid[i] = CHAR_WALL_LOCAL[s] !== undefined ? CHAR_WALL_LOCAL[s] : EMPTY;
    }
}