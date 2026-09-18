// Данные пиксель-арта оружия + палитра. Чистые данные, без зависимостей.
export const M = {
    k: '#0a0c0e', d: '#171a1f', m: '#262b31', l: '#3a4048', h: '#525a64', H: '#6e7884',
    a: '#ffb454', r: '#c02018', R: '#e8554a', g: '#37ff6e',
    w: '#3a2c22', W: '#5a4632', x: '#6e5233'
};
export const KNIFE = [
    "..........................", "...........m..............", "...........mm.............", "...........mmm............",
    "...........mmll...........", "...........mlll...........", "...........lllh...........", "...........llhh...........",
    "...........lhhh...........", "...........hhhh...........", "...........hhhh...........", "...........hrrh...........",
    "...........rRRr...........", "..........rRRRrr..........", ".........xxarrrr..........", "........xaaahhrr..........",
    ".......xaaaRhhrr..........", "......xaaarRhhrra.........", ".....xaaaarkkkkaa.........", ".....xaaaarkdmkaax........",
    ".....xaaaarkmdkxxx........", ".....xaaaarkdmkxWW........", "......xaaarkkkkWWw........", "......xaaxrrwwrww.........",
    ".......xxxrrwwrr..........", ".......aaarrrrrrr.........", ".......aaakrrrr.r.........", "......aaaxkkrr...r........",
    "......aaaxkkkrr.rr........", ".....aaaxxxkkkrrrr........"];
export const PISTOL = [
    "............gg............", "...........dlmd...........", "..........dhlmmd..........", "..........dhlmmd..........",
    "..........dhlmmd..........", "..........dhlmmd..........", "..........dhlmmd..........", "..........dhlmmd..........",
    "..........dhhlmd..........", ".........dhhhlmmd.........", ".........dhhhlmmd.........", ".........dhghlgmd.........",
    ".........dhkkkkmd.........", ".........ddkddkdd.........", "........dmlkddkHhd........", "........dmlkddkHhd........",
    ".......dmlllkkhHhhd.......", ".......dllhhhhHHHhd.......", ".......dlllhhHHHHhd.......", ".......aadhhHHHHdd........",
    ".......aaadddddddxa.......", ".......xaaaxxxxxaaa.......", "........xaaaaaaaaaa.......", "........dxaaaaaaaaa.......",
    "........dxaaaaaaaxx.......", "........daaaaaaxxx........", "........axxxxxxxx.........", "........aaaxxxxxx.........",
    "........aaaaxxxxxx........", ".......aaaaxxxxxxx........"];
export const SHOTGUN = [
    ".............k.............", "............kkk............", "...........kkdkk...........", "..........kkdmdkk..........",
    "..........kddmddk..........", "..........kdmlmdk..........", "..........kdmlmdk..........", "..........kdmlmdk..........",
    "..........kdmlmdk..........", "..........kdmlmdk..........", "..........kdmlmdk..........", "..........kdmlmdk..........",
    "..........kdmlmdk..........", ".........wkdmlmdkw.........", ".........wdmlllmdw.........", "........awkmlllmkw.........",
    ".......xawdmlllmdw.........", "......xaawkmlllmkw.........", ".....xaaawdmlllmdw.........", ".....xaaawkmklkmkw.........",
    ".....xaaawdmkkkmdw.........", ".....xaaawdkdddkdw.........", "......xaawkmmlmmkw.........", "......xaakllhHhllk.........",
    ".......xxkhhHHHhhk.........", ".......aaakkhHhkk..........", ".......aaakwkkkwkx.........", "......aaaxkwWWWwkax........",
    "......aaaxkWWWWWkax........", ".....aaaxxkwWWWwkaa........"];
export const STAPLER = [
    "..........................", "..........................", "..........kkkkkk..........", "..........kddddk..........",
    "..........kdmmdk..........", "..........kdmmdk..........", ".........kkkddkkk.........", "........krrrrrrrrk........",
    "........kRRrrrrRRk........", "........krrrrrrrrk........", "........krrrrrrrrk........", "........kRrrrrrrRk........",
    "........krrrrrrrrk........", ".......kkkkkkkkkkkk.......", ".......kmmmmmmmmmmk.......", ".......kmlmmmmmmmlk.......",
    ".......kmmmmmmmmmmk.......", ".......kmmmaammmmmk.......", ".......kkkkkkkkkkkk.......", "........kwwwwwwwwk........",
    "........kwwwwwwwwk........", "........kwwwwwwwwk........", "........kwWwwwwWwk........", "........kwwwwwwwwk........",
    "........kwwwwwwwwk........", ".......kwwwwwwwwwwk.......", ".......kwwwwwwwwwwk.......", ".......kWWWWWWWWWWk.......",
    ".......kkkkkkkkkkkk.......", "........kaaaaaaaak........"];
export const NAILGUN = [
    "..........................", "..........kkkkkk..........", "..........kddddk..........", "..........kdmmdk..........",
    "..........kdmmdk..........", "..........kdmmdk..........", ".........kkddddkk.........", ".........kmmmmmmk.........",
    "........kmmmmmmmmk........", "........kmlmmmmmlk........", "........kmmmmmmmmk........", "........kmmmmmmmmk........",
    ".......kkmmmmmmmmkk.......", ".......kHHmmmmmmmmk.......", ".......kHHkmmmmmmmk.......", ".......kHHkmmmmmmmk.......",
    ".......kHHkmmmmmmmk.......", ".......kkkkmmmmmmmk.......", "........kmmmmmmmmmk.......", "........kkkkkkkkkkk.......",
    ".........kwwwwwwk.........", ".........kwwwwwwk.........", ".........kwWwwwk..........", ".........kwwwwwk..........",
    ".........kwwwwwk..........", "........kwwwwwwwk.........", "........kwwwwwwwk.........", "........kWWWWWWWk.........",
    "........kkkkkkkkk.........", ".........kaaaaaak........."];
export const WEAPON_ART = [KNIFE, PISTOL, SHOTGUN, STAPLER, NAILGUN];

export function mkPx(rows, pal, s) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas'); c.width = w * s; c.height = h * s;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
        const r = rows[y];
        for (let x = 0; x < w; x++) {
            const ch = r[x];
            if (!ch || ch === '.') continue;
            const col = pal[ch]; if (!col) continue;
            g.fillStyle = col; g.fillRect(x * s, y * s, s, s);
        }
    }
    return c;
}