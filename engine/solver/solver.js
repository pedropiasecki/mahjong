import { SolveInit } from './solver.init.js';
import { SolverWriter } from './solver.writer.js';
import { SolverPrune } from './solver.prune.js';
import { rand } from './solver.tools.js';
import { SolverRandomSolve } from './solver.random.js';
function isGridIndex(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
export class Solver {
    nTilesCount; // number of tiles
    nPlays; // number of "game simulations" of randomSolve and sureSolve
    nrPlays;
    tileList = []; // [4 * maxGroups]
    // group array, indexed by group value
    tileGroups = []; // [maxGroups]
    // pointers of grid positions to tile array, to describe layout
    lo = []; // [maxHeight][maxWidth][maxDepth]
    // array of pointers to groups, indexes in order of search path
    qts = []; // [maxGroups]
    // start index and bottom index of search path
    qtsIndex;
    nGroups;
    remainMax; // search interval for the number of tiles that remains finally
    remainMin;
    // sized per layout by applyBounds()
    maxGroups = 0;
    maxHeight = 0;
    maxWidth = 0;
    maxDepth = 0;
    solveLayout(stones) {
        this.tileList = [];
        // a previous run may have left a larger grid behind
        this.lo = [];
        this.tileGroups = [];
        this.nGroups = 0;
        this.qtsIndex = 0;
        this.nTilesCount = stones.length;
        if (!this.applyBounds(stones)) {
            // nothing can be removed from a layout the solver cannot even index
            return stones.length + 2;
        }
        // clear layout pointers
        for (let row = 0; row < this.maxHeight; row++) {
            this.lo[row] = [];
            for (let col = 0; col < this.maxWidth; col++) {
                this.lo[row][col] = [];
                for (let lev = 0; lev < this.maxDepth; lev++) {
                    this.lo[row][col][lev] = undefined;
                }
            }
        }
        for (const stone of stones) {
            const t = {
                left: [undefined, undefined, undefined],
                right: [undefined, undefined, undefined],
                above: [undefined, undefined, undefined, undefined, undefined],
                below: [undefined, undefined, undefined, undefined, undefined],
                value: stone.groupNr,
                // If the solver has played the tile already during the routine prune()
                isPlayed: false
            };
            this.lo[stone.y][stone.x][stone.z] = t;
            this.tileList.push(t);
        }
        return this.solve(0, 0);
    }
    // the grid and the group table are sized from the input, so board size and tile count are not capped
    applyBounds(stones) {
        let height = 0;
        let width = 0;
        let depth = 0;
        let groups = 0;
        for (const stone of stones) {
            if (!isGridIndex(stone.y) || !isGridIndex(stone.x) || !isGridIndex(stone.z) || !isGridIndex(stone.groupNr)) {
                return false;
            }
            height = Math.max(height, stone.y + 1);
            width = Math.max(width, stone.x + 1);
            depth = Math.max(depth, stone.z + 1);
            groups = Math.max(groups, stone.groupNr + 1);
        }
        this.maxHeight = height;
        this.maxWidth = width;
        this.maxDepth = depth;
        // the search system always walks group 0, so the table is never empty
        this.maxGroups = Math.max(groups, 1);
        return true;
    }
    writeGame() {
        this.unrotateGroups();
        const writer = new SolverWriter(this.nTilesCount, this.tileGroups, this.lo, this.nGroups, this.maxHeight, this.maxWidth, this.maxDepth);
        return writer.write();
    }
    unrotateGroupMembers(index) {
        switch (this.tileGroups[index].rotation) {
            case 1: {
                const t = this.tileGroups[index].member[1];
                this.tileGroups[index].member[1] = this.tileGroups[index].member[2];
                this.tileGroups[index].member[2] = this.tileGroups[index].member[3];
                this.tileGroups[index].member[3] = t;
                break;
            }
            case 2: {
                const t = this.tileGroups[index].member[3];
                this.tileGroups[index].member[3] = this.tileGroups[index].member[2];
                this.tileGroups[index].member[2] = this.tileGroups[index].member[1];
                this.tileGroups[index].member[1] = t;
                break;
            }
            default: {
                break;
            }
        }
    }
    // stores the solution found
    unrotateGroups() {
        for (let index = 0; index < this.nGroups; index++) {
            this.unrotateGroupMembers(index);
            this.tileGroups[index].rotation = 0;
        }
    }
    sureSolve_checkInitialPrune() {
        return this.prune() > this.remainMax;
    }
    sureSolve_findPrunePoint(start) {
        for (let k = start; k < this.nGroups; k++) {
            this.qts[k].pairing = 1;
            if (this.prune() > this.remainMax) {
                return k;
            }
        }
        return this.nGroups;
    }
    sureSolve_handleSolutionFound(startIndex) {
        // Save best pairings
        for (let index = 0; index < this.nGroups; index++) {
            this.tileGroups[index].bestPairing = this.tileGroups[index].pairing;
        }
        // Adjust rotations
        for (let index = this.qtsIndex; index < this.nGroups; index++) {
            this.qts[index].bestPairing += 3 - this.qts[index].rotation;
            if (this.qts[index].bestPairing > 3) {
                this.qts[index].bestPairing -= 3;
            }
        }
        this.remainMax = this.prune() - 2;
        if (this.remainMax < this.remainMin) {
            for (let index = this.qtsIndex; index < this.nGroups; index++) {
                this.qts[index].pairing = 0;
            }
            return true;
        }
        // Reset and search for better solution
        for (let k = startIndex; k < this.nGroups; k++) {
            this.qts[k].pairing = 0;
        }
        return this.sureSolve(startIndex);
    }
    ;
    sureSolve_rotateTiles(groupIndex, clockwise) {
        const group = this.qts[groupIndex];
        if (clockwise) {
            const temporary = group.member[3];
            group.member[3] = group.member[2];
            group.member[2] = group.member[1];
            group.member[1] = temporary;
            group.rotation = (group.rotation + 1) % 3;
        }
        else {
            const temporary = group.member[1];
            group.member[1] = group.member[2];
            group.member[2] = group.member[3];
            group.member[3] = temporary;
            group.rotation = (group.rotation + 2) % 3;
        }
    }
    ;
    sureSolve_identifyRequiredNodes(prunePoint, startIndex) {
        const requiredNodes = [this.qts[prunePoint]];
        let nodeCount = 1;
        let currentPoint = prunePoint;
        for (let index = prunePoint - 1; index >= startIndex; index--) {
            this.qts[index].pairing = 0;
            if (this.prune() <= this.remainMax) {
                // Node is required
                this.qts[index].pairing = 1;
                requiredNodes[nodeCount++] = this.qts[index];
            }
            else {
                // Rotate and remove node
                this.sureSolve_rotateTiles(index, rand() % 2 === 0);
                this.qts[currentPoint] = this.qts[index];
                currentPoint--;
            }
        }
        // Restore required nodes
        for (let index = currentPoint; index >= startIndex; index--) {
            this.qts[index] = requiredNodes[--nodeCount];
        }
        return currentPoint;
    }
    ;
    sureSolve_tryAdvancedPairings(prunePoint, startIndex) {
        for (let index = prunePoint; index >= startIndex; index--) {
            this.qts[index].pairing = 2;
            if (this.sureSolve(index + 1)) {
                return true;
            }
            this.qts[index].pairing = 3;
            if (this.sureSolve(index + 1)) {
                return true;
            }
            this.qts[index].pairing = 0;
        }
        return false;
    }
    sureSolve(startIndex) {
        // recursive search routine to determine (un)solvability improves speed by changing search order backwards
        if (this.sureSolve_checkInitialPrune()) {
            return false;
        }
        const prunePoint = this.sureSolve_findPrunePoint(startIndex);
        if (prunePoint === this.nGroups) {
            return this.sureSolve_handleSolutionFound(startIndex);
        }
        const finalPrunePoint = this.sureSolve_identifyRequiredNodes(prunePoint, startIndex);
        return this.sureSolve_tryAdvancedPairings(finalPrunePoint, startIndex);
    }
    init() {
        const result = (new SolveInit(this.tileList, this.lo, this.qts, this.maxHeight, this.maxWidth, this.maxDepth, this.maxGroups, this.nTilesCount)).initSolve();
        this.tileGroups = result.tileGroups;
        this.qtsIndex = result.qtsIndex;
        this.nGroups = result.nGroups;
    }
    prune() {
        this.nPlays++;
        return (new SolverPrune(this.nTilesCount, this.nGroups, this.tileList, this.tileGroups)).prune();
    }
    randomSolve(count) {
        const result = new SolverRandomSolve(this.nTilesCount, this.nGroups, this.tileList, this.tileGroups, this.remainMin, this.remainMax).randomSolve(count);
        this.remainMax = result.remainMax;
        this.nrPlays += result.nrPlays;
        return result.success;
    }
    solve(remain1, remain2) {
        this.init();
        this.nrPlays = 0;
        this.nPlays = 0;
        this.remainMax = Math.max(remain1, remain2);
        this.remainMin = Math.min(remain1, remain2);
        if (this.prune() > this.remainMax) {
            return this.remainMax + 2;
        }
        const count = Math.floor(1.2 ** (this.nGroups - this.qtsIndex));
        if (this.randomSolve(count)) {
            return this.remainMax + 2;
        }
        this.sureSolve(this.qtsIndex);
        this.unrotateGroups();
        return this.remainMax + 2;
    }
}
