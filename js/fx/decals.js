import { DMAX } from '../core/config.js';

export const Decals = {
    list: new Array(DMAX), n: 0,
    init() {
        this.n = 0;
        for (let i = 0; i < DMAX; i++) this.list[i] = { tex: 0, x: 0, y: 0, z: 0, size: .3, life: 0, max: 1, eps: 0, grow: 0 };
    },
    add(tex, x, y, z, size, life, eps, grow) {
        let d = null;
        if (this.n < DMAX) d = this.list[this.n++];
        else { d = this.list[0]; for (let i = 0; i < DMAX - 1; i++) this.list[i] = this.list[i + 1]; this.list[DMAX - 1] = d; }
        d.tex = tex; d.x = x; d.y = y; d.z = z; d.size = size; d.life = life; d.max = life; d.eps = eps; d.grow = grow || 0;
    },
    update(dt) {
        for (let i = 0; i < this.n; i++) {
            const d = this.list[i];
            if (d.life < 900) d.life -= dt; if (d.grow && d.size < .85) d.size += d.grow * dt;
        }
    }
};