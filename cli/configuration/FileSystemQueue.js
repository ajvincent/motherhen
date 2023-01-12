import fs from "fs/promises";
export default class FSQueue {
    #pathResolver;
    #requiredToCallOnce = new Set([
        "writeConfiguration",
    ]);
    /** Add a requirement to the queue before committing, and return a symbol key to resolve it. */
    addRequirement(label) {
        const requirement = Symbol(label);
        this.#requiredToCallOnce.add(requirement);
        return requirement;
    }
    #tasks = [];
    #started = false;
    #hasCommitted = false;
    constructor(pathResolver) {
        this.#pathResolver = pathResolver.clone();
    }
    /**
     * Add writing the configuration to the filesystem to the queue.
     * @param config - the configuration to use in its current state.
     * @param relativePath - the path to the configuration's filesystem location.
     */
    writeConfiguration(config, relativePath) {
        if (!this.#requiredToCallOnce.has("writeConfiguration"))
            throw new Error("You've already requested to write the configuration!");
        const contents = JSON.stringify(config, null, 2) + "\n";
        this.#requiredToCallOnce.delete("writeConfiguration");
        return this.#appendResolverTask(relativePath, async () => {
            await fs.writeFile(this.#pathResolver.getPath(true), contents, { encoding: "utf-8" });
        }, {
            command: "writeConfiguration",
            relativePath,
            contents
        });
    }
    /**
     * Add a task requiring use of the path resolver.
     * @param overridePath - the relative path to use.
     * @param task - the asynchronous callback.
     * @param context - console.warn metadata in case the callback fails.
     */
    #appendResolverTask(overridePath, task, context) {
        this.#assertNotStarted();
        this.#tasks.push(() => {
            const currentPath = this.#pathResolver.getPath(false);
            this.#pathResolver.setPath(false, overridePath);
            try {
                return task();
            }
            catch (ex) {
                if (this.#enableWarnings) {
                    console.warn(context);
                }
                throw ex;
            }
            finally {
                this.#pathResolver.setPath(false, currentPath);
            }
        });
        return Promise.resolve();
    }
    /** Run all tasks in the queue. */
    async commit() {
        this.#assertNotStarted();
        if (this.#requiredToCallOnce.size > 0) {
            if (this.#enableWarnings) {
                console.warn(Array.from(this.#requiredToCallOnce.values()).join(", "));
            }
            throw new Error("You have required tasks to execute!");
        }
        this.#started = true;
        while (this.#tasks.length) {
            await this.#tasks.shift()();
        }
        this.#hasCommitted = true;
    }
    hasCommitted() {
        return this.#hasCommitted;
    }
    #assertNotStarted() {
        if (this.#started)
            throw new Error("I have already started running tasks!");
    }
    #enableWarnings = true;
    /**
     * Suspend warnings to the console.  This is for tests only.
     * @param callback - a callback to run during the suspension.
     * @returns the result of the callback.
     *
     * @internal
     */
    async suspendWarnings(callback) {
        this.#enableWarnings = false;
        try {
            return await callback();
        }
        finally {
            this.#enableWarnings = true;
        }
    }
}
//# sourceMappingURL=FileSystemQueue.js.map