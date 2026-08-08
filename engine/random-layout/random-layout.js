import { TARGET_COUNT } from './consts.js';
import { getRandomMode, hasMultipleLevels } from './utilities.js';
import { rng } from '../rng.js';
import { generateBaseLayer } from './base-layer.js';
import { fillLayout } from './upper-layers.js';
import { optimizeMapping } from './layout-optimize.js';
// Random Mahjong layout generator that produces a mapping of exactly 144 places
// abiding by the following constraints:
// - Bounds: x in [0..36], y in [0..16], z in [0..5]
// - Uniqueness: each [z,x,y] at most once
// - Support: for z>0, supported by same (x,y) at z-1 or orthogonal neighbor at distance 1
// - Uses a 1-step grid for x and y
const maxMappingPasses = 100;
export function generateRandomMappingRaw(mirrorX, mirrorY, mode) {
    const mapping = generateBaseLayer(mirrorX, mirrorY, mode);
    for (let index = 0; index < maxMappingPasses; index++) {
        const filled = fillLayout(mapping, mirrorX, mirrorY);
        if (filled.length === TARGET_COUNT) {
            return filled;
        }
    }
    return [];
}
export function generateRandomMapping(mirrorX, mirrorY, mode) {
    const symmetricX = mirrorX === 'random' ? rng() < 0.5 : (mirrorX === 'true');
    const symmetricY = mirrorY === 'random' ? rng() < 0.5 : (mirrorY === 'true');
    const baseLayerMode = mode === 'random' ? getRandomMode() : mode;
    let mapping = [];
    let passes = 0;
    while (mapping.length !== 144 || !hasMultipleLevels(mapping)) {
        mapping = generateRandomMappingRaw(symmetricX, symmetricY, baseLayerMode);
        passes++;
        if (passes > maxMappingPasses) {
            return [];
        }
    }
    return optimizeMapping(mapping);
}
