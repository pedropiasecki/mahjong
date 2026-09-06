import { rng } from './rng.js';

export function shuffleArray(array) {
    for (let index = array.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(rng() * (index + 1));
        const temporary = array[index];
        array[index] = array[swapIndex];
        array[swapIndex] = temporary;
    }
    return array;
}
export function shuffledCopy(array) {
    return shuffleArray([...array]);
}
export function randomIndex(array) {
    return Math.floor(rng() * array.length);
}
export function randomExtract(array) {
    const index = randomIndex(array);
    return array.splice(index, 1)[0];
}
