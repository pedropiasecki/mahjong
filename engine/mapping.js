import { hashString } from './hash.js';
export function expandMapping(map) {
    return map.flatMap(([z, rows]) => rows.flatMap(([y, cells]) => expandCells(z, y, cells)));
}
function expandCells(z, y, cells) {
    // Handle single cell case
    if (!Array.isArray(cells)) {
        return [[z, cells, y]];
    }
    // Handle array of cells
    return cells.flatMap(cell => Array.isArray(cell) ? expandRepeatedCells(z, y, cell[0], cell[1]) : [[z, cell, y]]);
}
function expandRepeatedCells(z, y, startX, count) {
    return Array.from({ length: count }, (_, index) => [z, startX + (index * 2), y]);
}
export function mappingToID(mapping) {
    return hashString(JSON.stringify(mapping)).toString();
}
export function mappingBounds(mapping, minLevel, minX, minY) {
    const bound = { x: minX, y: minY, z: minLevel };
    for (const place of mapping) {
        bound.z = Math.max(bound.z, place[0] + 1);
        bound.x = Math.max(bound.x, place[1] + 1);
        bound.y = Math.max(bound.y, place[2] + 1);
    }
    return bound;
}
export function mappingExtents(mapping) {
    const extents = {
        minX: Infinity, maxX: -Infinity,
        minY: Infinity, maxY: -Infinity,
        minZ: Infinity, maxZ: -Infinity
    };
    for (const place of mapping) {
        extents.minZ = Math.min(extents.minZ, place[0]);
        extents.maxZ = Math.max(extents.maxZ, place[0]);
        extents.minX = Math.min(extents.minX, place[1]);
        extents.maxX = Math.max(extents.maxX, place[1]);
        extents.minY = Math.min(extents.minY, place[2]);
        extents.maxY = Math.max(extents.maxY, place[2]);
    }
    return extents;
}
