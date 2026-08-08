import { safeGetStone } from '../stone.js';
import { randomExtract, shuffledCopy } from '../array-utilities.js';
export class BuilderBase {
    static pairedMapping(mapping) {
        return mapping.length % 2 === 0 ? mapping : mapping.slice(0, -1);
    }
    static randomExtract(array) {
        return randomExtract(array);
    }
    static randomList(array) {
        return shuffledCopy(array);
    }
    static collectNodes(stones, stone) {
        const nodes = { left: [], right: [], top: [], bottom: [] };
        let s;
        for (let y = stone.y - 1; y <= stone.y + 1; y++) {
            s = safeGetStone(stones, stone.z, stone.x - 2, y);
            if (s) {
                nodes.left.push(s);
            }
            s = safeGetStone(stones, stone.z, stone.x + 2, y);
            if (s) {
                nodes.right.push(s);
            }
            for (let x = stone.x - 1; x <= stone.x + 1; x++) {
                s = safeGetStone(stones, stone.z + 1, x, y);
                if (s) {
                    nodes.top.push(s);
                }
                s = safeGetStone(stones, stone.z - 1, x, y);
                if (s) {
                    nodes.bottom.push(s);
                }
            }
        }
        return nodes;
    }
    static fillStones(stones, tiles) {
        const groups = {};
        for (const stone of stones) {
            const tile = tiles.list[stone.v];
            stone.img = tile?.img ?? {};
            groups[stone.groupNr] ||= [];
            groups[stone.groupNr].push(stone);
            stone.nodes = this.collectNodes(stones, stone);
        }
        for (const key of Object.keys(groups)) {
            const group = groups[Number(key)];
            for (const stone of group) {
                stone.group = group.filter(s => s !== stone);
            }
        }
        return stones;
    }
}
