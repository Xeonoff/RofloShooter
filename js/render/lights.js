import { MAX_LIGHTS } from '../core/config.js';

export const Lights = {
    list: [],
    add(x, y, z, r, g, b, radius, life) {
        if (this.list.length >= MAX_LIGHTS) this.list.shift();
        this.list.push({ x, y, z, r, g, b, radius, life, maxLife: life });
    },
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].life -= dt;
            if (this.list[i].life <= 0) this.list.splice(i, 1);
        }
    },
    getLight(px, py, pz) {
        let lr = 0, lg = 0, lb = 0;
        for (const l of this.list) {
            const dx = px - l.x, dy = py - l.y, dz = (pz || 0.5) - l.z;
            const d2 = dx * dx + dy * dy + dz * dz, r2 = l.radius * l.radius;
            if (d2 < r2) {
                const f = (1 - d2 / r2) * (l.life / l.maxLife);
                lr += l.r * f; lg += l.g * f; lb += l.b * f;
            }
        }
        return { r: Math.min(lr, 1), g: Math.min(lg, 1), b: Math.min(lb, 1) };
    }
};