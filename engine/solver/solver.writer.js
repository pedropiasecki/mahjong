import { isPlayable } from './solver.tools.js';
export class SolverWriter {
    qt;
    lo;
    nGroups;
    maxHeight;
    maxWidth;
    maxDepth;
    nTiles1;
    nTiles2;
    result = [];
    constructor(nTilesCount, qt, lo, nGroups, maxHeight, maxWidth, maxDepth) {
        this.qt = qt;
        this.lo = lo;
        this.nGroups = nGroups;
        this.maxHeight = maxHeight;
        this.maxWidth = maxWidth;
        this.maxDepth = maxDepth;
        this.nTiles1 = nTilesCount;
        this.nTiles2 = nTilesCount;
    }
    write() {
        // play until no tiles can be removed anymore
        do {
            this.nTiles1 = this.nTiles2;
            for (let k = 0; k < this.nGroups; k++) {
                this.writeGroup(k);
            }
        } while (this.nTiles2 !== this.nTiles1);
        return this.result;
    }
    writePair(k, a, b) {
        const t1 = this.qt[k].member[a];
        const t2 = this.qt[k].member[b];
        for (let row = 0; row < this.maxHeight; row++) {
            for (let col = 0; col < this.maxWidth; col++) {
                for (let lev = 0; lev < this.maxDepth; lev++) {
                    if (this.lo[row][col][lev] === t1 || this.lo[row][col][lev] === t2) {
                        this.result.push([lev, col, row]);
                    }
                }
            }
        }
    }
    writePairing(k, qtk, a, b) {
        const qtmA = qtk.member[a];
        const qtmB = qtk.member[b];
        const tilesExist = qtmA && qtmB;
        const isTileNotPlayed = tilesExist && !qtmA.isPlayed;
        const isTilePlayable = tilesExist && isPlayable(qtmA) && isPlayable(qtmB);
        if (tilesExist && isTileNotPlayed && isTilePlayable) {
            this.writePair(k, a, b);
            qtmA.isPlayed = true;
            qtmB.isPlayed = true;
            this.nTiles2 -= 2;
            return true;
        }
        return false;
    }
    writeGroup(k) {
        const qtk = this.qt[k];
        switch (qtk.bestPairing) {
            case 1: { // pairing 0-1, 2-3
                if (this.writePairing(k, qtk, 0, 1)) {
                    const qtm2 = qtk.member[2];
                    qtk.isPlayed = qtm2.isPlayed;
                }
                this.writePairing(k, qtk, 2, 3);
                break;
            }
            case 2: { // pairing 0-2, 1-3
                this.writePairing(k, qtk, 0, 2);
                this.writePairing(k, qtk, 1, 3);
                break;
            }
            case 3: { // pairing 0-3, 1-2
                this.writePairing(k, qtk, 0, 3);
                this.writePairing(k, qtk, 1, 2);
                break;
            }
            case 4: { // half a group, pairing 0-1
                this.writePairing(k, qtk, 0, 1);
                break;
            }
            default: {
                break;
            }
        }
    }
}
