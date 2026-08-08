import { rand } from './solver.tools.js';
export class SolveInit {
    tileList;
    lo;
    qts;
    maxHeight;
    maxWidth;
    maxDepth;
    maxGroups;
    nTilesCount;
    tileGroups = []; // [maxGroups]
    qtsIndex;
    nGroups;
    constructor(tileList, lo, qts, maxHeight, maxWidth, maxDepth, maxGroups, nTilesCount) {
        this.tileList = tileList;
        this.lo = lo;
        this.qts = qts;
        this.maxHeight = maxHeight;
        this.maxWidth = maxWidth;
        this.maxDepth = maxDepth;
        this.maxGroups = maxGroups;
        this.nTilesCount = nTilesCount;
    }
    // initializes both randomSolve and sureSolve
    initSolve() {
        this.initSolve_clearTileNeighbors();
        this.initSolve_computeHorizontalNeighbors();
        this.initSolve_computeVerticalNeighbors();
        this.initSolve_initializeGroups();
        this.initSolve_setupSearchSystem();
        return { tileGroups: this.tileGroups, qtsIndex: this.qtsIndex, nGroups: this.nGroups };
    }
    initSolve_clearTileNeighbors() {
        for (const tile of this.tileList) {
            // Reset all neighbor arrays
            for (const direction of ['left', 'right', 'above', 'below']) {
                const maxNeighbors = direction === 'above' || direction === 'below' ? 5 : 3;
                for (let index = 0; index < maxNeighbors; index++) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tile[direction][index] = undefined;
                }
            }
            tile.isPlayed = false;
        }
    }
    initSolve_forEachAdjacentPosition(row, col, callback) {
        for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
            for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxWidth); c++) {
                callback(r, c);
            }
        }
    }
    initSolve_linkHorizontalNeighbors(row, col, lev) {
        const rightTile = this.lo[row][col][lev];
        const leftTile = this.lo[row][col - 2][lev];
        if (rightTile) {
            let k = 0;
            for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
                if (this.lo[r][col - 2][lev]) {
                    rightTile.left[k++] = this.lo[r][col - 2][lev];
                }
            }
        }
        if (leftTile) {
            let k = 0;
            for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
                if (this.lo[r][col][lev]) {
                    leftTile.right[k++] = this.lo[r][col][lev];
                }
            }
        }
    }
    ;
    initSolve_computeHorizontalNeighbors() {
        for (let row = 0; row < this.maxHeight; row++) {
            for (let col = 2; col < this.maxWidth; col++) {
                for (let lev = 0; lev < this.maxDepth; lev++) {
                    this.initSolve_linkHorizontalNeighbors(row, col, lev);
                }
            }
        }
    }
    ;
    initSolve_linkVerticalNeighbors(row, col, lev) {
        const lowerTile = this.lo[row][col][lev - 1];
        const upperTile = this.lo[row][col][lev];
        if (lowerTile) {
            let k = 0;
            this.initSolve_forEachAdjacentPosition(row, col, (r, c) => {
                if (this.lo[r][c][lev]) {
                    lowerTile.above[k++] = this.lo[r][c][lev];
                }
            });
        }
        if (upperTile) {
            let k = 0;
            this.initSolve_forEachAdjacentPosition(row, col, (r, c) => {
                if (this.lo[r][c][lev - 1]) {
                    upperTile.below[k++] = this.lo[r][c][lev - 1];
                }
            });
        }
    }
    initSolve_computeVerticalNeighbors() {
        for (let row = 0; row < this.maxHeight; row++) {
            for (let col = 0; col < this.maxWidth; col++) {
                for (let lev = 1; lev < this.maxDepth; lev++) {
                    this.initSolve_linkVerticalNeighbors(row, col, lev);
                }
            }
        }
    }
    initSolve_initializeGroups() {
        // Clear groups
        this.tileGroups = [];
        for (let k = 0; k < this.maxGroups; k++) {
            this.tileGroups.push({
                pairing: -1,
                bestPairing: -1,
                nMembers: 0,
                member: [undefined, undefined, undefined, undefined],
                isPlayed: false,
                rotation: 0
            });
        }
        // Collect groups
        for (let k = 0; k < this.nTilesCount; k++) {
            const v = this.tileList[k].value;
            this.tileGroups[v].member[this.tileGroups[v].nMembers] = this.tileList[k];
            this.tileGroups[v].nMembers++;
        }
    }
    initSolve_setupSearchSystem() {
        let insertIndex = 0;
        let maxGroupIndex = 0;
        // First add groups with exactly 2 members
        for (let k = 0; k < this.maxGroups; k++) {
            const group = this.tileGroups[k];
            if (group.nMembers === 2) {
                this.qts[insertIndex] = group;
                this.qts[insertIndex].pairing = 4;
                insertIndex++;
            }
            if (group.nMembers !== 0) {
                maxGroupIndex = k;
            }
        }
        // Add empty groups
        for (let k = 0; k <= maxGroupIndex; k++) {
            const group = this.tileGroups[k];
            if (group.nMembers === 0) {
                this.qts[insertIndex] = group;
                this.qts[insertIndex].pairing = -1;
                insertIndex++;
            }
        }
        this.qtsIndex = insertIndex;
        // Add groups with 4 members and randomize their positions
        for (let k = 0; k <= maxGroupIndex; k++) {
            const group = this.tileGroups[k];
            if (group.nMembers === 4) {
                this.qts[insertIndex] = group;
                this.qts[insertIndex].pairing = 0;
                // Swap with a random position
                const randomIndex = this.qtsIndex + (rand() % (insertIndex + 1 - this.qtsIndex));
                const temporary = this.qts[insertIndex];
                this.qts[insertIndex] = this.qts[randomIndex];
                this.qts[randomIndex] = temporary;
                insertIndex++;
            }
        }
        this.nGroups = insertIndex;
    }
}
