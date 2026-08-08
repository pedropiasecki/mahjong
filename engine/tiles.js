import { TILES, TILES_EXT } from './consts.js';
export class Tiles {
    list = [];
    groups = [];
    constructor(amount) {
        if (amount > 0) {
            this.build(amount);
        }
    }
    build(amount) {
        let v = 0;
        let tilesMapping = TILES.map(row => row.map(id => ({ id })));
        const groupsNeeded = Math.ceil(amount / 4);
        if (groupsNeeded > tilesMapping.length) {
            const tilesExtraMapping = TILES_EXT.map(row => row.map(id => ({ id })));
            tilesMapping = [...tilesMapping, ...tilesExtraMapping];
            while (tilesMapping.length < groupsNeeded) {
                tilesMapping.push([{ id: `_${tilesMapping.length}a` }, { id: `_${tilesMapping.length}b` }, { id: `_${tilesMapping.length}c` }, { id: `_${tilesMapping.length}d` }]);
            }
        }
        for (const [groupNr, group] of tilesMapping.entries()) {
            const g = { v: groupNr, tiles: [] };
            this.groups.push(g);
            for (const img of group) {
                v++;
                const tile = { groupNr, v, img };
                g.tiles.push(tile);
                this.list[v] = tile;
            }
        }
    }
}
export class StoneTiles extends Tiles {
    constructor(stones) {
        super(0);
        const groupMap = {};
        for (const stone of stones) {
            const tile = { v: stone.v, groupNr: stone.groupNr, img: { id: stone.img.id ?? '' } };
            groupMap[stone.groupNr] ||= { v: stone.groupNr, tiles: [] };
            groupMap[stone.groupNr].tiles.push(tile);
            this.list[stone.v] = tile;
        }
        // finalize groups (only those with remaining tiles)
        this.groups = Object.values(groupMap).map(g => ({ v: g.v, tiles: g.tiles }));
    }
}
