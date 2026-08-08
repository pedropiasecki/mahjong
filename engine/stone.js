import { signal } from './signal.js';
export class Stone {
    x;
    y;
    z;
    v;
    groupNr;
    hinted = signal(false);
    matched = signal(false);
    selected = signal(false);
    picked = signal(false);
    wiggle = signal(false);
    state = signal({ blocked: false, removable: false }, { equal: (a, b) => a.blocked === b.blocked && a.removable === b.removable });
    wiggleTimer;
    group = [];
    img = {};
    nodes = { top: [], left: [], right: [], bottom: [] };
    static hasStone(list) {
        return list.some(stone => !stone.picked());
    }
    constructor(z, x, y, v, groupNr) {
        this.z = z;
        this.x = x;
        this.y = y;
        this.v = v;
        this.groupNr = groupNr;
    }
    toPosition() {
        return { z: this.z, x: this.x, y: this.y, v: this.v, groupNr: this.groupNr };
    }
    isBlocked() {
        return Stone.hasStone(this.nodes.top) || (Stone.hasStone(this.nodes.left) && Stone.hasStone(this.nodes.right));
    }
}
export const safeGetStone = (stones, z, x, y) => {
    for (const stone of stones) {
        if (stone.z === z && stone.x === x && stone.y === y) {
            return stone;
        }
    }
    return undefined;
};
