export const VID = { w: 320, h: 200 }; // внутреннее разрешение рендера (изменяемое)
export const TEX = 64, SHN = 40;
export const MW = 64, MH = 48;
export const EYE = 0.52, GRAV = 9.5, JUMPV = 3.4;
export const PLANE = 0.70, PITCH_LIM = 62;
export const STEP = 1 / 60, MAX_STEPS = 5;
export const PMAX = 800, DMAX = 150, PROJMAX = 40, EMPTY = 255;
export const HUD_W = 960, HUD_H = 600;
export const MAX_LIGHTS = 16;
export const COMBO_WINDOW = 3.5;
export const DASH_SPEED = 12, DASH_DUR = 0.15, DASH_CD = 1.2;
export const WALL_PENETRATE_DMG_MULT = 0.4;
export const GIBMAX = 160;
export const BLOOD_RES = 2;

export const T = {
    CONC: 0, RUST: 1, PART: 2, PAPER: 3, SERVER: 4, SHELF: 5, TILE: 6, GORE: 7, VENT: 8, WOOD: 9, DOOR: 10, LDOOR: 11,
    FCARP: 20, FLIN: 21, FMET: 22, FTILE: 23, FPAPER: 24, FBLOOD: 25, CCONC: 30, CDARK: 31, CMET: 32, COFF: 33,
    DBLOOD: 40, DHOLE: 41, DSCORCH: 42, DPUDDLE: 43, DPROP: 44, DTOXIC: 45, DELEC: 46, DGIB: 47, DTRAIL: 48
};
export const CHAR_WALL = {
    '#': T.CONC, '%': T.RUST, '=': T.PART, '~': T.PAPER, 'S': T.SERVER, 'A': T.SHELF, 'T': T.TILE,
    'B': T.GORE, 'V': T.VENT, 'O': T.WOOD, 'd': T.DOOR, 'D': T.LDOOR, 's': T.CONC
};
export const SOLID = new Uint8Array(64);
[T.CONC, T.RUST, T.PART, T.PAPER, T.SERVER, T.SHELF, T.TILE, T.GORE, T.VENT, T.WOOD, T.DOOR, T.LDOOR].forEach(t => SOLID[t] = 1);