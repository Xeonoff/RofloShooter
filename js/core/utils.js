export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const R = Math.random;
export const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
export const dist2 = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0; return dx * dx + dy * dy; };
export const $ = id => document.getElementById(id);

export function hash2(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x, y) {
    const xi = x | 0, yi = y | 0, xf = x - xi, yf = y - yi,
        a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1),
        u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}