import { isPlayable, rand } from './solver.tools.js';
export class SolverRandomSolve {
    nTilesCount;
    nGroups;
    tileList;
    tileGroups;
    remainMin;
    remainMax;
    nrPlays = 0;
    constructor(nTilesCount, nGroups, tileList, tileGroups, remainMin, remainMax) {
        this.nTilesCount = nTilesCount;
        this.nGroups = nGroups;
        this.tileList = tileList;
        this.tileGroups = tileGroups;
        this.remainMin = remainMin;
        this.remainMax = remainMax;
    }
    // iterative search routine to determine solvability, but not unsolvability
    randomSolve(count) {
        const nFree = [];
        const nMatches = [0, 0, 1, 3, 6];
        const pairings = [
            [0, 1, 2, 3],
            [1, 0, 3, 2],
            [2, 3, 0, 1],
            [3, 2, 1, 0]
        ];
        const initializeGameState = () => {
            for (let k = 0; k < this.nGroups; k++) {
                nFree[k] = 0;
                const group = this.tileGroups[k];
                for (let l = 0; l < group.nMembers; l++) {
                    if (isPlayable(group.member[l])) {
                        nFree[k]++;
                    }
                }
                group.pairing = -1;
                group.isPlayed = group.nMembers === 2;
            }
        };
        const findMatchToPlay = () => {
            let totalMatches = 0;
            // Check for forced plays
            for (let k = 0; k < this.nGroups; k++) {
                if ((this.tileGroups[k].isPlayed ? 1 : 0) + nMatches[nFree[k]] >= 5) {
                    return { groupIndex: k, matchIndex: 0 };
                }
                totalMatches += nMatches[nFree[k]];
            }
            if (totalMatches === 0) {
                return null;
            }
            // Select random match
            let remainingMatches = rand() % totalMatches;
            let groupIndex = 0;
            while (remainingMatches >= 0) {
                remainingMatches -= nMatches[nFree[groupIndex]];
                if (remainingMatches < 0) {
                    break;
                }
                groupIndex++;
            }
            return {
                groupIndex,
                matchIndex: remainingMatches + nMatches[nFree[groupIndex]]
            };
        };
        const findPlayableTiles = (group, matchIndex) => {
            let firstIndex = 0;
            let secondIndex = group.nMembers - 1;
            const findNextPlayable = (index, increment) => {
                let result = index;
                while (true) {
                    const tile = group.member[result];
                    if (!tile.isPlayed && isPlayable(tile)) {
                        break;
                    }
                    result += increment;
                }
                return result;
            };
            if (matchIndex <= 1) {
                firstIndex = findNextPlayable(firstIndex, 1);
                if (matchIndex === 0) {
                    secondIndex = findNextPlayable(firstIndex + 1, 1);
                }
            }
            if (matchIndex >= 1) {
                secondIndex = findNextPlayable(secondIndex, -1);
                if (matchIndex === 2) {
                    firstIndex = findNextPlayable(secondIndex - 1, -1);
                }
            }
            return [firstIndex, secondIndex];
        };
        const playMatch = (group, tileIndices, nTiles) => {
            const [index1, index2] = tileIndices;
            let remainingTiles = nTiles;
            remainingTiles = this.playTile(group.member[index1], nFree, remainingTiles);
            remainingTiles = this.playTile(group.member[index2], nFree, remainingTiles);
            group.isPlayed = true;
            group.pairing = pairings[index1][index2];
            nFree[this.tileGroups.indexOf(group)] -= 2;
            return remainingTiles;
        };
        const resetState = () => {
            for (let k = 0; k < this.nTilesCount; k++) {
                this.tileList[k].isPlayed = false;
            }
            for (let k = 0; k < this.nGroups; k++) {
                this.tileGroups[k].isPlayed = false;
                if (this.tileGroups[k].nMembers === 2) {
                    this.tileGroups[k].pairing = 4;
                }
            }
        };
        const handleSolution = (remainingTiles) => {
            if (remainingTiles > this.remainMax) {
                return false;
            }
            for (let k = 0; k < this.nGroups; k++) {
                this.tileGroups[k].bestPairing = this.tileGroups[k].pairing;
            }
            this.remainMax = remainingTiles - 2;
            if (this.remainMax < this.remainMin) {
                for (let k = 0; k < this.nGroups; k++) {
                    if (this.tileGroups[k].nMembers === 4) {
                        this.tileGroups[k].pairing = 0;
                    }
                }
                return true;
            }
            return false;
        };
        // Main execution loop
        for (let n = 0; n < count; n++) {
            let remainingTiles = this.nTilesCount;
            initializeGameState();
            let match = findMatchToPlay();
            while (match) {
                const group = this.tileGroups[match.groupIndex];
                const tileIndices = findPlayableTiles(group, match.matchIndex);
                remainingTiles = playMatch(group, tileIndices, remainingTiles);
                match = findMatchToPlay();
            }
            resetState();
            this.nrPlays++;
            if (handleSolution(remainingTiles)) {
                return { success: true, nrPlays: this.nrPlays, remainMax: this.remainMax };
            }
        }
        // Reset final state
        for (let k = 0; k < this.nGroups; k++) {
            if (this.tileGroups[k].nMembers === 4) {
                this.tileGroups[k].pairing = 0;
            }
        }
        return { success: false, nrPlays: this.nrPlays, remainMax: this.remainMax };
    }
    // play a tile for randomSolve
    playTile(tile, freeCount, remainingTiles) {
        // Helper function to update free counts for neighboring tiles
        const updateNeighborCounts = (neighbors, multiplier) => {
            for (let index = 0; neighbors[index] !== undefined; index++) {
                const neighbor = neighbors[index];
                if (neighbor && !neighbor.isPlayed) {
                    freeCount[neighbor.value] += isPlayable(neighbor) ? multiplier : 0;
                }
            }
        };
        // Decrease counts for left and right neighbors (remove them from free list)
        updateNeighborCounts(tile.left, -1);
        updateNeighborCounts(tile.right, -1);
        // Mark the tile as played and decrease remaining count
        tile.isPlayed = true;
        const updatedRemainingTiles = remainingTiles - 1;
        // Increase counts for left and right neighbors (they might become playable)
        updateNeighborCounts(tile.left, 1);
        updateNeighborCounts(tile.right, 1);
        // Make tiles below this one potentially playable
        updateNeighborCounts(tile.below, 1);
        return updatedRemainingTiles;
    }
}
