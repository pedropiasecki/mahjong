import { blocksOverlap, inBounds, key, randChoice, randInt, shuffleArray, buildUnitGrids, buildMappingFromSetZ0 } from './utilities.js';
import { rng } from '../rng.js';
function addBaseLine(present, mapping, snakeKeys, x, y, markSnake = false) {
    if ((x % 2 !== 0) || (y % 2 !== 0)) {
        return false;
    }
    if (!inBounds(x, y, 0)) {
        return false;
    }
    const k0 = key(0, x, y);
    if (present.has(k0)) {
        return false;
    }
    if (blocksOverlap(present, 0, x, y)) {
        return false;
    }
    present.add(k0);
    mapping.push([0, x, y]);
    if (markSnake) {
        snakeKeys.add(k0);
    }
    return true;
}
function seedStart(present, mapping, snakeKeys, xMax, yMax) {
    let sx = Math.floor(xMax / 2);
    let sy = Math.floor(yMax / 2);
    sx -= sx % 2;
    sy -= sy % 2;
    if (!inBounds(sx, sy, 0)) {
        sx = 0;
        sy = 0;
    }
    addBaseLine(present, mapping, snakeKeys, sx, sy, true);
    return { sx, sy };
}
function computeSnakeTargetLength(xMax, yMax) {
    const basePerimeter = xMax + yMax;
    const minLength = Math.max(40, Math.floor(basePerimeter * 0.8));
    const maxLength = Math.max(minLength + 100, Math.floor(basePerimeter * 2));
    return randInt(minLength, maxLength);
}
function buildTryDirections(direction, wobble) {
    const cont = [direction[0], direction[1]];
    const rev = [-direction[0], -direction[1]];
    const orth = direction[0] === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    let tryDirections = [cont, ...orth, rev];
    if (rng() < wobble) {
        tryDirections = shuffleArray(tryDirections);
    }
    if (rng() < 0.2) {
        tryDirections = [...shuffleArray([...orth]), cont, rev];
    }
    return tryDirections;
}
function tryMoveStep(present, mapping, snakeKeys, x, y, direction, wobble) {
    const tryDirections = buildTryDirections(direction, wobble);
    for (const [dx1, dy1] of tryDirections) {
        const nx1 = x + dx1 * 2;
        const ny1 = y + dy1 * 2;
        if (inBounds(nx1, ny1, 0) && addBaseLine(present, mapping, snakeKeys, nx1, ny1, true)) {
            return { x: nx1, y: ny1, direction: [dx1, dy1] };
        }
    }
    return null;
}
function tryBurstFallback(present, mapping, snakeKeys, x, y) {
    const stepDirections = shuffleArray([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    for (const [dxA, dyA] of stepDirections) {
        const ax = x + dxA * 2;
        const ay = y + dyA * 2;
        if (!inBounds(ax, ay, 0) || blocksOverlap(present, 0, ax, ay) || present.has(key(0, ax, ay))) {
            continue;
        }
        if (addBaseLine(present, mapping, snakeKeys, ax, ay, true)) {
            return { x: ax, y: ay, direction: [dxA, dyA] };
        }
    }
    return null;
}
function trimEdges(present, snakeKeys, xs, ys, xMax, yMax) {
    const leftCut = rng() < 0.4 ? randChoice([0, 0, 2]) : 0;
    const rightCut = rng() < 0.4 ? randChoice([0, 0, 2]) : 0;
    const topCut = rng() < 0.4 ? randChoice([0, 2]) : 0;
    const bottomCut = rng() < 0.4 ? randChoice([0, 2]) : 0;
    for (const yy of ys) {
        for (const xx of xs) {
            // eslint-disable-next-line unicorn/prefer-continue
            if (xx < leftCut || xx > xMax - rightCut || yy < topCut || yy > yMax - bottomCut) {
                const k0 = key(0, xx, yy);
                if (!snakeKeys.has(k0)) {
                    present.delete(k0);
                }
            }
        }
    }
}
function reduceNonSnake(present, baseMapping, snakeKeys, targetBase) {
    let baseCount = baseMapping.length;
    const copy = shuffleArray([...baseMapping].filter(p => !snakeKeys.has(key(0, p[1], p[2]))));
    while (baseCount > targetBase && copy.length > 0) {
        const p = copy.pop();
        if (present.delete(key(0, p[1], p[2]))) {
            baseCount--;
        }
    }
    return baseCount;
}
function addNearSnake(present, snakeKeys, xs, ys, baseCount, targetBase) {
    const nearSnake = [];
    const others = [];
    for (const yy of ys) {
        for (const xx of xs) {
            // eslint-disable-next-line unicorn/prefer-continue
            if (!present.has(key(0, xx, yy))) {
                const neighbors = [[xx - 2, yy], [xx + 2, yy], [xx, yy - 2], [xx, yy + 2]];
                const adjSnake = neighbors.some(([nx, ny]) => snakeKeys.has(key(0, nx, ny)));
                (adjSnake ? nearSnake : others).push([0, xx, yy]);
            }
        }
    }
    shuffleArray(nearSnake);
    shuffleArray(others);
    const queues = [nearSnake, others];
    let count = baseCount;
    for (const q of queues) {
        while (count < targetBase && q.length > 0) {
            const [z, xx, yy] = q.pop();
            if ((xx % 2 === 0) && (yy % 2 === 0) && !blocksOverlap(present, 0, xx, yy)) {
                present.add(key(z, xx, yy));
                count++;
            }
        }
    }
    return count;
}
function adjustDensityToTarget(present, snakeKeys, xs, ys, minTarget, maxTarget, xMax, yMax) {
    const baseMapping = buildMappingFromSetZ0(present, xMax, yMax, 1);
    const baseCount = baseMapping.length;
    const targetBase = Math.min(Math.max(minTarget, Math.floor(baseCount * 0.9)), maxTarget);
    if (baseCount > targetBase) {
        reduceNonSnake(present, baseMapping, snakeKeys, targetBase);
    }
    else if (baseCount < targetBase) {
        addNearSnake(present, snakeKeys, xs, ys, baseCount, targetBase);
    }
}
function buildFinalBaseMapping(present, xs, ys) {
    const out = [];
    for (const yy of ys) {
        for (const xx of xs) {
            if (present.has(key(0, xx, yy))) {
                out.push([0, xx, yy]);
            }
        }
    }
    return out;
}
export function generateBaseLayerLines({ minTarget, maxTarget, xMax, yMax }) {
    const present = new Set();
    const mapping = [];
    const snakeKeys = new Set();
    const { xs, ys } = buildUnitGrids(xMax, yMax, 1);
    const { sx, sy } = seedStart(present, mapping, snakeKeys, xMax, yMax);
    let x = sx;
    let y = sy;
    const directionsAll = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let direction = directionsAll[randInt(0, 3)];
    const targetLength = computeSnakeTargetLength(xMax, yMax);
    let stuckCount = 0;
    const maxStuckAttempts = 10;
    for (let step = 0; step < targetLength; step++) {
        const wobble = (step % randInt(6, 12)) === 0 ? rng() * 0.6 + 0.2 : rng() * 0.3;
        const moved = tryMoveStep(present, mapping, snakeKeys, x, y, direction, wobble);
        if (moved) {
            x = moved.x;
            y = moved.y;
            direction = moved.direction;
            stuckCount = 0; // Reset stuck counter on successful move
            continue;
        }
        const burst = tryBurstFallback(present, mapping, snakeKeys, x, y);
        if (burst) {
            x = burst.x;
            y = burst.y;
            direction = burst.direction;
            stuckCount = 0; // Reset stuck counter on successful move
            continue;
        }
        // Stuck: try random direction from current position or give up
        stuckCount++;
        if (stuckCount >= maxStuckAttempts) {
            break; // Give up after multiple attempts to find a valid move
        }
        // Try a random direction from current position as a last resort
        const randomDirection = directionsAll[randInt(0, 3)];
        const randomX = x + randomDirection[0] * 2;
        const randomY = y + randomDirection[1] * 2;
        if (inBounds(randomX, randomY, 0) && addBaseLine(present, mapping, snakeKeys, randomX, randomY, true)) {
            x = randomX;
            y = randomY;
            direction = randomDirection;
            stuckCount = 0;
        }
    }
    trimEdges(present, snakeKeys, xs, ys, xMax, yMax);
    adjustDensityToTarget(present, snakeKeys, xs, ys, minTarget, maxTarget, xMax, yMax);
    return buildFinalBaseMapping(present, xs, ys);
}
