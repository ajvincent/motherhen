// #region preamble
import fs from "fs/promises";
import path from "path";
import replaceInFilePkg from "replace-in-file";
const { replaceInFile } = replaceInFilePkg;
import fileExists from "#cli/utilities/fileExists.js";
import projectRoot from "#cli/utilities/projectRoot.js";
// #endregion preamble
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
    /** A map of pending tasks to descriptions of the task. */
    #tasks = new Map;
    #started = false;
    #hasCommitted = false;
    constructor(pathResolver) {
        this.#pathResolver = pathResolver.clone();
    }
    /** Get a list of operations we have not started. */
    pendingOperations() {
        return Array.from(this.#tasks.values());
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
        }, `write configuration to ${path.resolve(this.#pathResolver.getPath(true), relativePath)}`, {
            command: "writeConfiguration",
            relativePath,
            contents
        });
    }
    /**
     * Build a source application directory, from Motherhen's `cleanroom/source` directory.
     * @param targetSourcesDirectory - the "sources" directory location.  Normally `{$projectRoot}/sources`.
     * @param sourceDirName - The source directory to create under the target sources.
     * @param requiredSymbol - a flag to clear, signalling we've created a required sources directory.
     */
    buildSource(targetSourcesDirectory, sourceDirName, requiredSymbol) {
        if (requiredSymbol)
            this.#requiredToCallOnce.delete(requiredSymbol);
        const targetDir = path.join(targetSourcesDirectory, sourceDirName);
        const templateDir = path.join(projectRoot, "cleanroom/source");
        this.#tasks.set(async () => {
            const parentDir = path.dirname(targetDir);
            if (!await fileExists(parentDir, true)) {
                await fs.mkdir(parentDir, { recursive: true });
            }
            await fs.cp(templateDir, targetDir, {
                recursive: true
            });
            if (sourceDirName === "hatchedegg")
                return;
            await replaceInFile({
                files: targetDir + "/**/*",
                from: /hatchedegg/gm,
                to: sourceDirName
            });
        }, `build source directory "${sourceDirName}"`);
        return Promise.resolve();
    }
    /**
     * Add a task requiring use of the path resolver.
     * @param overridePath - the relative path to use.
     * @param task - the asynchronous callback.
     * @param context - console.warn metadata in case the callback fails.
     */
    #appendResolverTask(overridePath, task, description, context) {
        this.#assertNotStarted();
        this.#tasks.set(() => this.#withTemporaryPath(overridePath, task, context), description);
        return Promise.resolve();
    }
    async #withTemporaryPath(overridePath, task, context) {
        const currentPath = this.#pathResolver.getPath(false);
        this.#pathResolver.setPath(false, overridePath);
        try {
            return await task();
        }
        catch (ex) {
            if (this.#enableWarnings && context) {
                console.warn(context);
            }
            throw ex;
        }
        finally {
            this.#pathResolver.setPath(false, currentPath);
        }
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
        const tasks = Array.from(this.#tasks.keys());
        while (tasks.length) {
            await tasks.shift()();
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