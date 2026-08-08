import { isPlayable } from './solver.tools.js';
export class SolverPrune {
    nTilesCount;
    nGroups;
    tileList;
    tileGroups;
    constructor(nTilesCount, nGroups, tileList, tileGroups) {
        this.nTilesCount = nTilesCount;
        this.nGroups = nGroups;
        this.tileList = tileList;
        this.tileGroups = tileGroups;
    }
    // test solvability with the given pairing of all tiles
    play(t1, t2) {
        t1.isPlayed = true;
        t2.isPlayed = true;
        return 2;
    }
    checkFree(t) {
        if (!t.isPlayed && isPlayable(t)) {
            t.isPlayed = true;
            return 1;
        }
        return 0;
    }
    ;
    handlePairedGroup(t1, t2, dependentTile, group) {
        let result = 0;
        if (!t1.isPlayed && isPlayable(t1) && isPlayable(t2)) {
            result = this.play(t1, t2);
            group.isPlayed = dependentTile.isPlayed;
        }
        return result;
    }
    ;
    resetState() {
        for (let k = 0; k < this.nTilesCount; k++) {
            this.tileList[k].isPlayed = false;
        }
        for (let k = 0; k < this.nGroups; k++) {
            this.tileGroups[k].isPlayed = false;
        }
    }
    tryPlayWith(tile, partners) {
        if (!tile.isPlayed && isPlayable(tile)) {
            for (const partner of partners) {
                if (!partner.isPlayed && isPlayable(partner)) {
                    return [true, this.play(tile, partner)];
                }
            }
        }
        return [false, 0];
    }
    ;
    handleFreeGroup(group, tiles) {
        let previous = 0;
        let playCount = 0;
        const [t0, t1, t2, t3] = tiles;
        if (t0.isPlayed || t1.isPlayed || t2.isPlayed) {
            for (const t of tiles) {
                previous += this.checkFree(t);
            }
            if (tiles.every(t => t.isPlayed)) {
                group.isPlayed = true;
                playCount += 2;
            }
            return [previous, playCount];
        }
        let [result, played] = this.tryPlayWith(t0, [t1, t2, t3]);
        playCount += played;
        if (result) {
            return [previous, playCount];
        }
        [result, played] = this.tryPlayWith(t1, [t2, t3]);
        playCount += played;
        if (result) {
            return [previous, playCount];
        }
        const [_result, played_] = this.tryPlayWith(t2, [t3]);
        playCount += played_;
        return [previous, playCount];
    }
    ;
    processGroup(group) {
        if (group.isPlayed) {
            return [0, 0];
        }
        const tiles = group.member;
        const [t0, t1, t2, t3] = tiles;
        let previousCount = 0;
        let playedCount = 0;
        // eslint-disable-next-line default-case
        switch (group.pairing) {
            case 0: { // free group
                const [previous, played] = this.handleFreeGroup(group, tiles);
                previousCount += previous;
                playedCount += played;
                break;
            }
            case 1: { // pairing 0-1, 2-3
                playedCount += this.handlePairedGroup(t0, t1, t2, group);
                playedCount += this.handlePairedGroup(t2, t3, t0, group);
                break;
            }
            case 2: { // pairing 0-2, 1-3
                playedCount += this.handlePairedGroup(t0, t2, t1, group);
                playedCount += this.handlePairedGroup(t1, t3, t0, group);
                break;
            }
            case 3: { // pairing 0-3, 1-2
                playedCount += this.handlePairedGroup(t0, t3, t1, group);
                playedCount += this.handlePairedGroup(t1, t2, t0, group);
                break;
            }
            case 4: { // half group, pairing 0-1
                if (isPlayable(t0) && isPlayable(t1)) {
                    playedCount += this.play(t0, t1);
                    group.isPlayed = true;
                }
                break;
            }
            case 5: { // all four simultaneously
                if (tiles.every(tile => isPlayable(tile))) {
                    playedCount += this.play(t0, t1);
                    playedCount += this.play(t2, t3);
                    group.isPlayed = true;
                }
                break;
            }
        }
        return [previousCount, playedCount];
    }
    ;
    prune() {
        let currentTiles = this.nTilesCount;
        let previousTiles;
        do {
            previousTiles = currentTiles;
            for (let k = 0; k < this.nGroups; k++) {
                const [previousCount, playedCount] = this.processGroup(this.tileGroups[k]);
                previousTiles += previousCount;
                currentTiles -= playedCount;
            }
        } while (currentTiles !== previousTiles);
        this.resetState();
        return currentTiles;
    }
}
