import { signal } from './signal.js';
import { Builder, MODE_SOLVABLE } from './builder.js';
import { safeGetStone } from './stone.js';
import { StoneTiles, Tiles } from './tiles.js';
import { BuilderBase } from './builder/base.js';
export class Board {
    free = signal([]);
    stones = signal([]);
    count = signal(0);
    hints = { groups: [], current: undefined };
    selected = undefined;
    undo = signal([]);
    buildMode = MODE_SOLVABLE;
    clearSelection() {
        if (this.selected) {
            this.selected.selected.set(false);
        }
        this.selected = undefined;
    }
    setStoneSelected(stone) {
        this.clearSelection();
        if (stone) {
            stone.selected.set(true);
            this.selected = stone;
        }
    }
    clearHints() {
        if (this.hints.current) {
            for (const stone of this.hints.current.stones) {
                stone.hinted.set(false);
            }
        }
        this.hints = {
            groups: [],
            current: undefined
        };
    }
    highlightMatches(stone) {
        for (const partner of this.free()) {
            if (partner !== stone && partner.groupNr === stone.groupNr) {
                partner.matched.set(true);
            }
        }
    }
    clearMatches() {
        for (const stone of this.stones()) {
            if (stone.matched()) {
                stone.matched.set(false);
            }
        }
    }
    hint() {
        if (this.hintNext()) {
            return;
        }
        this.clearHints();
        if (this.free().length === 0) {
            return;
        }
        const groups = this.collectHints();
        if (this.selected) {
            const prefer = this.selected.groupNr;
            groups.sort((a, b) => {
                if (a.group === prefer) {
                    return -1;
                }
                if (b.group === prefer) {
                    return 1;
                }
                return 0;
            });
        }
        const current = groups[0];
        this.hints = { groups, current };
        for (const stone of current.stones) {
            stone.hinted.set(true);
        }
    }
    reset() {
        this.clearSelection();
        this.clearHints();
        this.free.set([]);
        this.count.set(0);
        this.stones.set([]);
        this.undo.set([]);
    }
    canRemove(stone) {
        return stone.group.some((groupStone) => !groupStone.picked() && !groupStone.isBlocked());
    }
    update() {
        const free = [];
        let count = 0;
        for (const stone of this.stones()) {
            const blocked = !stone.picked() && stone.isBlocked();
            const removable = !stone.picked() && !blocked && this.canRemove(stone);
            stone.state.set({ blocked, removable });
            if (removable) {
                free.push(stone);
            }
            count += stone.picked() ? 0 : 1;
        }
        this.free.set(free);
        this.count.set(count);
    }
    back() {
        const undo = this.undo();
        if (undo.length < 2) {
            return;
        }
        this.clearSelection();
        this.clearHints();
        const n1 = undo.at(-1);
        const n2 = undo.at(-2);
        this.undo.set(undo.slice(0, -2));
        if (!n1 || !n2) {
            return;
        }
        for (const stone of this.stones()) {
            if (((stone.z === n1[0]) && (stone.x === n1[1]) && (stone.y === n1[2])) ||
                ((stone.z === n2[0]) && (stone.x === n2[1]) && (stone.y === n2[2]))) {
                stone.picked.set(false);
            }
        }
        this.update();
    }
    shuffle() {
        this.clearSelection();
        this.clearHints();
        const currentStones = this.stones();
        const usedStones = currentStones.filter(s => s.picked());
        const unusedStones = currentStones.filter(s => !s.picked());
        const tiles = new StoneTiles(unusedStones);
        const mapping = unusedStones.map(s => [s.z, s.x, s.y]);
        const builder = new Builder(tiles);
        const stones = builder.build(this.buildMode, mapping);
        if (!stones) {
            return;
        }
        const newStones = [...stones, ...usedStones];
        BuilderBase.fillStones(newStones, new Tiles(currentStones.length));
        this.stones.set(newStones);
        this.update();
    }
    load(mapping, undos) {
        if (!mapping?.length) {
            console.warn('Board.load() failed: mapping is empty, null or undefined');
            return false;
        }
        const highestValue = Math.max(0, ...mapping.map(place => place[3]));
        const builder = new Builder(new Tiles(Math.max(mapping.length, highestValue)));
        const stones = builder.load(mapping);
        if (stones?.length !== mapping.length) {
            console.warn('Board.load() failed: stored stones could not be restored', { expected: mapping.length, restored: stones?.length ?? 0 });
            return false;
        }
        this.undo.set(undos);
        for (const undo of undos) {
            const stone = safeGetStone(stones, undo[0], undo[1], undo[2]);
            if (stone) {
                stone.picked.set(true);
            }
        }
        this.stones.set(stones);
        this.update();
        return true;
    }
    save() {
        return this.stones().map((stone) => [stone.z, stone.x, stone.y, stone.v]);
    }
    applyMapping(mapping, mode) {
        this.buildMode = mode;
        const builder = new Builder(new Tiles(mapping.length));
        this.stones.set(builder.build(mode, mapping) || []);
    }
    pick(sel, stone) {
        this.clearSelection();
        this.undo.update(list => [...list, [sel.z, sel.x, sel.y], [stone.z, stone.x, stone.y]]);
        this.clearHints();
        sel.picked.set(true);
        stone.picked.set(true);
        this.update();
    }
    countUnblocked() {
        return this.stones().filter(s => !s.picked() && !s.isBlocked()).length;
    }
    hintNext() {
        if (!this.hints.current) {
            return false;
        }
        for (const stone of this.hints.current.stones) {
            stone.hinted.set(false);
        }
        let index = this.hints.groups.indexOf(this.hints.current);
        if (index >= 0) {
            index++;
            if (index >= this.hints.groups.length) {
                index = 0;
            }
            if (index < this.hints.groups.length) {
                this.hints.current = this.hints.groups[index];
                for (const stone of this.hints.current.stones) {
                    stone.hinted.set(true);
                }
                return true;
            }
        }
        return false;
    }
    collectHints() {
        const hash = {};
        for (const stone of this.free()) {
            const gn = stone.groupNr.toString();
            hash[gn] ||= [];
            hash[gn].push(stone);
        }
        return Object.keys(hash)
            .map((key) => {
            const stones = hash[key];
            const firstStone = stones[0];
            return {
                group: firstStone?.groupNr ?? 0,
                stones
            };
        })
            .filter((group) => group.stones.length > 0);
    }
}
