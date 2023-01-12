/**
 * Evaluate a callback asynchronously for every element of an array, sequentially.
 *
 * @param elementArray - The array of objects to pass into the callback.
 * @param callback     - The callback function.
 * @returns Resolved if the sequence passes.
 * @see Promise.all
 * @see Array.prototype.reduce
 */
export async function PromiseAllSequence(elementArray, callback) {
    return await elementArray.reduce(async (previousPromise, element) => {
        const items = await previousPromise;
        items.push(await callback(element));
        return items;
    }, Promise.resolve([]));
}
/**
 * Evaluate a callback asynchronously for every element of an array, in parallel.
 *
 * @param elementArray - The array of objects to pass into the callback.
 * @param callback     - The callback function.
 * @returns Resolved if the sequence passes.
 * @see Promise.all
 * @see Array.prototype.map
 */
export async function PromiseAllParallel(elementArray, callback) {
    return await Promise.all(elementArray.map(element => callback(element)));
}
//# sourceMappingURL=PromiseTypes.js.map