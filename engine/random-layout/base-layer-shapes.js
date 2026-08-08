import { generateBaseLayerWithShapes, randInt, shuffleArray } from './utilities.js';
import { crossCells } from './base-layer-cross.js';
import { diamondCells } from './base-layer-diamond.js';
import { triangleCells } from './base-layer-triangle.js';
import { areaCells } from './base-layer-areas.js';
import { ringPerimeter } from './base-layer-rings.js';
const shapeFunctions = [crossCells, diamondCells, triangleCells, areaCells, ringPerimeter];
export function generateBaseLayerShapes(options) {
    const allSizes = [];
    for (let w = 3; w <= 9; w++) {
        for (let h = 3; h <= 9; h++) {
            allSizes.push([w, h]);
        }
    }
    shuffleArray(allSizes);
    const mixedCells = (x0, y0, w, h) => {
        const shapeCells = shapeFunctions[randInt(0, shapeFunctions.length - 1)];
        return shapeCells(x0, y0, w, h);
    };
    return generateBaseLayerWithShapes(allSizes, mixedCells, options);
}
