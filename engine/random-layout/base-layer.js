import { X_MAX, Y_MAX } from './consts.js';
import { generateBaseLayerChecker } from './base-layer-checker.js';
import { generateBaseLayerLines } from './base-layer-lines.js';
import { generateBaseLayerRings } from './base-layer-rings.js';
import { generateBaseLayerAreas } from './base-layer-areas.js';
import { generateBaseLayerCross } from './base-layer-cross.js';
import { generateBaseLayerDiamond } from './base-layer-diamond.js';
import { generateBaseLayerTriangle } from './base-layer-triangle.js';
import { generateBaseLayerShapes } from './base-layer-shapes.js';
import { blocksOverlap, inBounds, key, randInt } from './utilities.js';
function mirrorBaseLayer(mirrorX, mirrorY, baseLayer) {
    if ((!mirrorX && !mirrorY) || baseLayer.length === 0) {
        return baseLayer;
    }
    // Determine extents of the provided base layer (typically z=0)
    const usedX = Math.max(...baseLayer.map(p => p[1]));
    const usedY = Math.max(...baseLayer.map(p => p[2]));
    // Choose mirror frames deterministically to preserve even-even parity and ensure a gap >= 2.
    // We want xMax and yMax to be even so that mirroring maps even -> even, avoiding 1-step adjacency.
    const minRequiredXMax = usedX * 2 + 2; // ensures axis >= usedX + 1 => gap >= 2
    const minRequiredYMax = usedY * 2 + 2;
    let xMax = Math.min(X_MAX, minRequiredXMax + 4); // allow a small buffer but keep within bounds
    let yMax = Math.min(Y_MAX, minRequiredYMax + 4);
    // enforce even
    if (xMax % 2 !== 0) {
        xMax--;
    }
    if (yMax % 2 !== 0) {
        yMax--;
    }
    // if clamping made it too small, fall back to the minimum possible even frame
    if (xMax < minRequiredXMax) {
        xMax = Math.max(usedX * 2, Math.min(X_MAX - (X_MAX % 2), minRequiredXMax));
    }
    if (yMax < minRequiredYMax) {
        yMax = Math.max(usedY * 2, Math.min(Y_MAX - (Y_MAX % 2), minRequiredYMax));
    }
    const mirXf = (x) => xMax - x;
    const mirYf = (y) => yMax - y;
    // Build a set for fast duplicate/overlap checks at z=0 (base layer)
    const mapping = [...baseLayer];
    const present = new Set(mapping.map(([z, x, y]) => key(z, x, y)));
    // Helper to attempt adding a mirrored coordinate with safety checks
    const tryAddMirror = (z, x, y) => {
        if (!inBounds(x, y, z)) {
            return;
        }
        const k0 = key(z, x, y);
        if (present.has(k0)) {
            return;
        }
        if (blocksOverlap(present, z, x, y)) {
            return;
        }
        present.add(k0);
        mapping.push([z, x, y]);
    };
    // Mirror across X if requested
    if (mirrorX) {
        const snapshot = [...mapping];
        for (const [z, x, y] of snapshot) {
            const mx = mirXf(x);
            if (mx === x) {
                continue; // on mirror axis
            }
            tryAddMirror(z, mx, y);
        }
    }
    // Mirror across Y if requested (after applying X-mirror above)
    if (mirrorY) {
        const snapshot = [...mapping];
        for (const [z, x, y] of snapshot) {
            const my = mirYf(y);
            if (my === y) {
                continue; // on mirror axis
            }
            tryAddMirror(z, x, my);
        }
    }
    return mapping;
}
function splitArea(baseMin, baseMax, mirrorX, mirrorY) {
    const both = mirrorX && mirrorY;
    const either = (mirrorX && !mirrorY) || (!mirrorX && mirrorY);
    let factor;
    if (both) {
        factor = 0.25;
    }
    else if (either) {
        factor = 0.5;
    }
    else {
        factor = 1;
    }
    const minTarget = Math.max(1, Math.floor(baseMin * factor));
    const maxTarget = Math.max(minTarget, Math.floor(baseMax * factor));
    const xMax = mirrorX ? Math.floor(X_MAX / 2) : X_MAX;
    const yMax = mirrorY ? Math.floor(Y_MAX / 2) : Y_MAX;
    return { minTarget, maxTarget, xMax, yMax };
}
export function generateBaseLayerMode(mirrorX, mirrorY, mode) {
    switch (mode) {
        case 'checker': {
            const { minTarget, maxTarget } = splitArea(70, 120, mirrorX, mirrorY);
            const xRangeMin = mirrorX ? 7 : 14;
            const xRangeMax = mirrorX ? Math.floor(X_MAX / 2) : X_MAX;
            const yRangeMin = mirrorY ? 6 : 12;
            const yRangeMax = mirrorY ? Math.floor(Y_MAX / 2) : Y_MAX;
            // choose extents favoring mid-size boards
            const xMax = randInt(xRangeMin, xRangeMax);
            const yMax = randInt(yRangeMin, yRangeMax);
            return generateBaseLayerChecker({ minTarget, maxTarget, xMax, yMax });
        }
        case 'lines': {
            return generateBaseLayerLines(splitArea(60, 80, mirrorX, mirrorY));
        }
        case 'rings': {
            return generateBaseLayerRings(splitArea(70, 120, mirrorX, mirrorY));
        }
        case 'areas': {
            return generateBaseLayerAreas(splitArea(60, 100, mirrorX, mirrorY));
        }
        case 'cross': {
            return generateBaseLayerCross(splitArea(60, 100, mirrorX, mirrorY));
        }
        case 'diamond': {
            return generateBaseLayerDiamond(splitArea(60, 100, mirrorX, mirrorY));
        }
        case 'triangle': {
            return generateBaseLayerTriangle(splitArea(60, 90, mirrorX, mirrorY));
        }
        case 'shapes': {
            return generateBaseLayerShapes(splitArea(60, 100, mirrorX, mirrorY));
        }
        default: {
            throw new Error('Invalid mode');
        }
    }
}
export function generateBaseLayer(mirrorX, mirrorY, mode) {
    const layer = generateBaseLayerMode(mirrorX, mirrorY, mode);
    return mirrorBaseLayer(mirrorX, mirrorY, layer);
}
