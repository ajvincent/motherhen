/**
 * Evaluate a callback asynchronously for every element of an array, sequentially.
 *
 * @param elementArray - The array of objects to pass into the callback.
 * @param callback     - The callback function.
 * @returns Resolved if the sequence passes.
 * @see Promise.all
 * @see Array.prototype.reduce
 */
export async function PromiseAllSequence<E, V>(
  elementArray: E[],
  callback: (value: E) => Promise<V>
) : Promise<V[]>
{
  return await elementArray.reduce(async (previousPromise: Promise<V[]>, element: E) => {
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
export async function PromiseAllParallel<E, V>(
  elementArray: E[],
  callback: (value: E) => Promise<V>
) : Promise<V[]>
{
  return await Promise.all(elementArray.map(element => callback(element)));
}

type PromiseQueueTask = () => Promise<void>;
export class PromiseQueue
{
  #tasks: PromiseQueueTask[] = [];
  #started = false;

  /**
   * Append a task to the queue.
   * @param task - the pending task to add.
   */
  appendTask(task: PromiseQueueTask) : void
  {
    this.#assertNotStarted();
    this.#tasks.push(task);
  }

  /** Run all tasks in the queue. */
  async start() : Promise<void>
  {
    this.#assertNotStarted();
    this.#started = true;
    while (this.#tasks.length) {
      await (this.#tasks.shift() as PromiseQueueTask)();
    }
  }

  #assertNotStarted() : void
  {
    if (this.#started)
      throw new Error("I have already started running tasks!");
  }
}
