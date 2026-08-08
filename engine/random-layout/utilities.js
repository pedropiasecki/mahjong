import { X_MAX, Y_MAX, Z_MAX } from './consts.js';
import { rng } from '../rng.js';
export function shuffleArray(array) {
    for (let index = array.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(rng() * (index + 1));
        const temporary = array[index];
        array[index] = array[swapIndex];
        array[swapIndex] = temporary;
    }
    return array;
}
export function key(z, x, y) {
    return `${z}|${x}|${y}`;
}
export function randInt(min, maxInclusive) {
    return Math.floor(rng() * (maxInclusive - min + 1)) + min;
}
export function randChoice(array) {
    return array[Math.floor(rng() * array.length)];
}
export function inBounds(x, y, z) {
    return inZeroTo(x, X_MAX) && inZeroTo(y, Y_MAX) && inZeroTo(z, Z_MAX);
}
export function inZeroTo(value, to) {
    return value >= 0 && value <= to;
}
export function blocksOverlap(present, z, x, y) {
    // Disallow placing (z,x,y) if any tile exists within the 3x3 neighborhood on the same z
    // center (x,y) checked before via uniqueness
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (!(dx === 0 && dy === 0) && present.has(key(z, x + dx, y + dy))) {
                return true;
            }
        }
    }
    return false;
}
// Support rule used for z>0: direct below, small bridge (left+right), or large bridge (four diagonals)
export function isSupported(present, z, x, y) {
    if (z === 0) {
        return true;
    }
    const zb = z - 1;
    // 1) direct below
    if (present.has(key(zb, x, y))) {
        return true;
    }
    // 2) small bridge left+right
    if (present.has(key(zb, x - 1, y)) && present.has(key(zb, x + 1, y))) {
        return true;
    }
    // 3) large bridge four diagonals
    return (present.has(key(zb, x - 1, y - 1)) &&
        present.has(key(zb, x + 1, y - 1)) &&
        present.has(key(zb, x - 1, y + 1)) &&
        present.has(key(zb, x + 1, y + 1)));
}
// Try to add a tile to mapping with full validation
export function tryAdd(present, mapping, z, x, y) {
    if (!inBounds(x, y, z)) {
        return false;
    }
    const k = key(z, x, y);
    if (present.has(k)) {
        return false;
    }
    if (!isSupported(present, z, x, y)) {
        return false;
    }
    if (blocksOverlap(present, z, x, y)) {
        return false;
    }
    present.add(k);
    mapping.push([z, x, y]);
    return true;
}
export function isOdd(num) {
    return num % 2 !== 0;
}
export function getRandomMode() {
    const modes = [
        'lines', 'lines', 'lines',
        'checker', 'checker',
        'areas', 'areas',
        'rings',
        'cross',
        'diamond',
        'triangle',
        'shapes'
    ];
    return randChoice(modes);
}
export function buildEvenAnchors(xMax, yMax) {
    const anchors = [];
    for (let y = 0; y <= yMax; y += 2) {
        for (let x = 0; x <= xMax; x += 2) {
            anchors.push([x, y]);
        }
    }
    return anchors;
}
export function markBufferPoints(points, radius, blocked, z = 0) {
    for (const [px, py] of points) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const bx = px + dx;
                const by = py + dy;
                if (inBounds(bx, by, z)) {
                    blocked.add(key(z, bx, by));
                }
            }
        }
    }
}
export function buildMappingFromSetZ0(present, xMax, yMax, step = 2) {
    const result = [];
    for (let y = 0; y <= yMax; y += step) {
        for (let x = 0; x <= xMax; x += step) {
            if (present.has(key(0, x, y))) {
                result.push([0, x, y]);
            }
        }
    }
    return result;
}
export function buildUnitGrids(xMax, yMax, step = 1) {
    const xs = [];
    for (let x = 0; x <= xMax; x += step) {
        xs.push(x);
    }
    const ys = [];
    for (let y = 0; y <= yMax; y += step) {
        ys.push(y);
    }
    return { xs, ys };
}
function fillAnchors(total, w, h, anchors, minTarget, maxTarget, tryPlace) {
    let result = total;
    for (const [x0, y0] of anchors) {
        if (result >= maxTarget) {
            break;
        }
        const added = tryPlace(x0, y0, w, h);
        if (added > 0) {
            result += added;
            if (result >= minTarget && result <= maxTarget) {
                break;
            }
        }
    }
    return result;
}
export function placeSizesGeneric(startTotal, sizes, anchors, minTarget, maxTarget, tryPlace) {
    let total = startTotal;
    for (const [w, h] of sizes) {
        if (total >= maxTarget) {
            break;
        }
        total = fillAnchors(total, w, h, anchors, minTarget, maxTarget, tryPlace);
        if (total >= minTarget && total <= maxTarget) {
            break;
        }
    }
    return total;
}
export function hasMultipleLevels(mapping) {
    return mapping.some(entry => entry[0] > 0);
}
export function canPlace(x0, y0, w, h, occupied, blocked, usedSizes, cellsFunction) {
    const sizeKey = `${w}x${h}`;
    if (usedSizes.has(sizeKey)) {
        return false;
    }
    const x1 = x0 + (w - 1) * 2;
    const y1 = y0 + (h - 1) * 2;
    if (!inBounds(x1, y1, 0)) {
        return false;
    }
    const cells = cellsFunction(x0, y0, w, h);
    for (const [x, y] of cells) {
        if ((x % 2 !== 0) || (y % 2 !== 0)) {
            return false;
        }
        if (!inBounds(x, y, 0)) {
            return false;
        }
        const k = key(0, x, y);
        if (occupied.has(k)) {
            return false;
        }
        if (blocked.has(k)) {
            return false;
        }
        if (blocksOverlap(occupied, 0, x, y)) {
            return false;
        }
    }
    return true;
}
export function generateBaseLayerWithShapes(allSizes, cellsFunction, { minTarget, maxTarget, xMax, yMax }, bufferRadius = 3) {
    const occupied = new Set();
    const blocked = new Set();
    const usedSizes = new Set();
    const anchors = buildEvenAnchors(xMax, yMax);
    shuffleArray(allSizes);
    shuffleArray(anchors);
    const tryPlace = (x0, y0, w, h) => {
        if (!canPlace(x0, y0, w, h, occupied, blocked, usedSizes, cellsFunction)) {
            return 0;
        }
        const cells = cellsFunction(x0, y0, w, h);
        for (const [x, y] of cells) {
            occupied.add(key(0, x, y));
        }
        markBufferPoints(cells, bufferRadius, blocked, 0);
        usedSizes.add(`${w}x${h}`);
        return cells.length;
    };
    // Phase 1: try all sizes against all anchors
    let total = placeSizesGeneric(0, allSizes, anchors, minTarget, maxTarget, tryPlace);
    // Phase 2: if still below minTarget, retry unused sizes with reshuffled anchors
    if (total < minTarget) {
        const remainingSizes = allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
        shuffleArray(remainingSizes);
        shuffleArray(anchors);
        total = placeSizesGeneric(total, remainingSizes, anchors, minTarget, maxTarget, tryPlace);
    }
    // Phase 3: fill to maxTarget, allowing size reuse after unique sizes are exhausted
    if (total < maxTarget) {
        let canProgress = true;
        let canReuse = false;
        while (canProgress && total < maxTarget) {
            const sizePool = canReuse ? [...allSizes] : allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
            if (!canReuse && sizePool.length === 0) {
                canReuse = true;
                continue;
            }
            shuffleArray(sizePool);
            shuffleArray(anchors);
            const previous = total;
            total = placeSizesGeneric(total, sizePool, anchors, minTarget, maxTarget, tryPlace);
            canProgress = total > previous;
        }
    }
    return buildMappingFromSetZ0(occupied, xMax, yMax, 2);
}
export function place(x0, y0, w, h, occupied, blocked, usedSizes, cellsFunction) {
    const cells = cellsFunction(x0, y0, w, h);
    for (const [x, y] of cells) {
        occupied.add(key(0, x, y));
    }
    markBufferPoints(cells, 2, blocked, 0);
    usedSizes.add(`${w}x${h}`);
    return cells.length;
}
