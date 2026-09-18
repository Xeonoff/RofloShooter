import { T } from '../core/config.js';

export const ZONES = [
    { x: 1, y: 1, w: 14, h: 11, wall: T.CONC, fl: T.FPAPER, cl: T.CCONC, li: .72, fo: .060, st: 0, n: 'АРХИВ', haz: 0 },
    { x: 16, y: 1, w: 15, h: 11, wall: T.PAPER, fl: T.FCARP, cl: T.COFF, li: .80, fo: .055, st: 1, n: 'ЗАЛ ЗАСЕДАНИЙ', haz: 0 },
    { x: 32, y: 1, w: 7, h: 11, wall: T.WOOD, fl: T.FCARP, cl: T.COFF, li: .78, fo: .055, st: 1, n: 'КАБИНЕТ 3-О', haz: 0 },
    { x: 40, y: 1, w: 23, h: 11, wall: T.SERVER, fl: T.FMET, cl: T.CMET, li: .50, fo: .060, st: 2, n: 'СЕРВЕРНАЯ', haz: 'elec' },
    { x: 1, y: 13, w: 62, h: 2, wall: T.CONC, fl: T.FLIN, cl: T.CCONC, li: .85, fo: .050, st: 0, n: 'КОРИДОР Б-1', haz: 0 },
    { x: 6, y: 15, w: 3, h: 9, wall: T.CONC, fl: T.FLIN, cl: T.CCONC, li: .70, fo: .055, st: 0, n: 'КОРИДОР Б-2', haz: 0 },
    { x: 1, y: 15, w: 4, h: 8, wall: T.RUST, fl: T.FMET, cl: T.CDARK, li: .42, fo: .070, st: 2, n: 'ТЕХНИЧЕСКИЙ ОТКЛОН', haz: 'toxic' },
    { x: 1, y: 24, w: 16, h: 22, wall: T.TILE, fl: T.FTILE, cl: T.CCONC, li: .66, fo: .060, st: 3, n: 'СТОЛОВАЯ', haz: 0 },
    { x: 16, y: 16, w: 22, h: 14, wall: T.CONC, fl: T.FCARP, cl: T.COFF, li: .80, fo: .055, st: 1, n: 'КАБИННЫЙ ЛАБИРИНТ', haz: 0 },
    { x: 38, y: 13, w: 2, h: 33, wall: T.CONC, fl: T.FLIN, cl: T.CCONC, li: .75, fo: .055, st: 0, n: 'КОРИДОР Б-3', haz: 0 },
    { x: 16, y: 30, w: 22, h: 1, wall: T.CONC, fl: T.FLIN, cl: T.CCONC, li: .60, fo: .060, st: 0, n: 'КОРИДОР Б-4', haz: 0 },
    { x: 22, y: 31, w: 16, h: 2, wall: T.VENT, fl: T.FMET, cl: T.CMET, li: .30, fo: .090, st: 2, n: 'ВЕНТШАХТА', haz: 'elec' },
    { x: 18, y: 34, w: 19, h: 12, wall: T.RUST, fl: T.FMET, cl: T.CDARK, li: .45, fo: .070, st: 2, n: 'СКЛАД / МОРГ', haz: 'toxic' },
    { x: 40, y: 20, w: 23, h: 26, wall: T.GORE, fl: T.FBLOOD, cl: T.CDARK, li: .68, fo: .055, st: 3, n: 'ПЕРЕРАБАТЫВАЮЩИЙ ЦЕХ', haz: 0 },
    { x: 50, y: 13, w: 13, h: 6, wall: T.RUST, fl: T.FMET, cl: T.CDARK, li: .35, fo: .080, st: 2, n: 'ГЕНЕРАТОРНАЯ', haz: 'elec' },
    { x: 1, y: 44, w: 16, h: 3, wall: T.CONC, fl: T.FLIN, cl: T.CCONC, li: .55, fo: .065, st: 0, n: 'АВАРИЙНЫЙ ВЫХОД', haz: 0 },
];
export const zoneAt = (x, y) => {
    for (let i = ZONES.length - 1; i >= 0; i--) {
        const z = ZONES[i];
        if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return i;
    }
    return 4;
};