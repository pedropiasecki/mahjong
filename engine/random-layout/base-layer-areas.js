import { generateBaseLayerWithShapes, shuffleArray } from './utilities.js';
export function areaCells(x0, y0, w, h) {
    const x1 = x0 + (w - 1) * 2;
    const y1 = y0 + (h - 1) * 2;
    const cells = [];
    for (let y = y0; y <= y1; y += 2) {
        for (let x = x0; x <= x1; x += 2) {
            cells.push([x, y]);
        }
    }
    return cells;
}
export function generateBaseLayerAreas(options) {
    const allSizes = [];
    for (let w = 2; w <= 5; w++) {
        for (let h = 2; h <= 5; h++) {
            allSizes.push([w, h]);
        }
    }
    shuffleArray(allSizes);
    return generateBaseLayerWithShapes(allSizes, areaCells, options);
}
