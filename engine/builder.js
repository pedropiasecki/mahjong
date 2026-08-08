import { SolvableBoardBuilder } from './builder/solvable.js';
import { RandomBoardBuilder } from './builder/random.js';
import { LoadBoardBuilder } from './builder/load.js';
export const MODE_SOLVABLE = 'MODE_SOLVABLE';
export const MODE_RANDOM = 'MODE_RANDOM';
export const BuilderModes = [
    { id: MODE_SOLVABLE, builder: SolvableBoardBuilder },
    { id: MODE_RANDOM, builder: RandomBoardBuilder }
];
export class Builder {
    tiles;
    constructor(tiles) {
        this.tiles = tiles;
    }
    load(mapping) {
        const builder = new LoadBoardBuilder();
        return builder.build(mapping, this.tiles);
    }
    build(mode, mapping) {
        let builder;
        const builderMode = BuilderModes.find(m => m.id === mode);
        if (builderMode) {
            builder = new builderMode.builder();
        }
        if (builder) {
            return builder.build(mapping, this.tiles);
        }
        return undefined;
    }
}
