import { Stone } from '../stone.js';
import { BuilderBase } from './base.js';
import { shuffledCopy } from '../array-utilities.js';
const MAX_REROLL_ATTEMPTS = 50;
export class RandomBoardBuilder extends BuilderBase {
    build(places, tiles) {
        const mapping = BuilderBase.pairedMapping(places);
        let stones = [];
        for (let attempt = 0; attempt < MAX_REROLL_ATTEMPTS; attempt++) {
            stones = this.buildOnce(mapping, tiles);
            if (RandomBoardBuilder.hasFreePair(stones)) {
                break;
            }
        }
        // after the last attempt there is nothing better to return, but it has been checked like all the others
        return stones;
    }
    getTilesInGame(tiles, amount) {
        // Draw complete pairs so every group placed on the board has an even tile count
        const need = Math.floor(amount / 2) * 2;
        const result = [];
        for (const group of shuffledCopy(tiles.groups)) {
            for (let index = 0; index + 1 < group.tiles.length && result.length < need; index += 2) {
                result.push(group.tiles[index], group.tiles[index + 1]);
            }
            if (result.length >= need) {
                break;
            }
        }
        return result;
    }
    buildOnce(mapping, tiles) {
        const remainingTiles = this.getTilesInGame(tiles, mapping.length);
        const stones = [];
        const remainingPlaces = [...mapping];
        while (remainingPlaces.length > 0 && remainingTiles.length > 0) {
            const tile = BuilderBase.randomExtract(remainingTiles);
            const place = BuilderBase.randomExtract(remainingPlaces);
            if (!tile || !place) {
                break;
            }
            stones.push(new Stone(place[0], place[1], place[2], tile.v, tile.groupNr));
        }
        BuilderBase.fillStones(stones, tiles);
        return stones;
    }
    static hasFreePair(stones) {
        const byGroup = {};
        for (const stone of stones) {
            if (stone.isBlocked()) {
                continue;
            }
            byGroup[stone.groupNr] = (byGroup[stone.groupNr] ?? 0) + 1;
            if (byGroup[stone.groupNr] >= 2) {
                return true;
            }
        }
        return false;
    }
}
