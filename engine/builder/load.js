import { Stone } from '../stone.js';
import { BuilderBase } from './base.js';
export class LoadBoardBuilder {
    build(mapping, tiles) {
        const stones = [];
        for (const st of mapping) {
            const tile = tiles.list[st[3]];
            if (tile) {
                const stone = new Stone(st[0], st[1], st[2], st[3], tile.groupNr);
                stones.push(stone);
            }
        }
        BuilderBase.fillStones(stones, tiles);
        return stones;
    }
}
