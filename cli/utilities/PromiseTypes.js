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
export class PromiseQueue {
    #tasks = [];
    #started = false;
    /**
     * Append a task to the queue.
     * @param task - the pending task to add.
     */
    appendTask(task) {
        this.#assertNotStarted();
        this.#tasks.push(task);
    }
    /** Run all tasks in the queue. */
    async start() {
        this.#assertNotStarted();
        this.#started = true;
        while (this.#tasks.length) {
            await this.#tasks.shift()();
        }
    }
    #assertNotStarted() {
        if (this.#started)
            throw new Error("I have already started running tasks!");
    }
}
//# sourceMappingURL=PromiseTypes.js.map