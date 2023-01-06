import fs from "fs/promises";
import path from "path";
import os from "os";
import { Deferred } from "./PromiseTypes.js";
/**
 * Create a temporary directory with a promise to clean it up later.
 *
 * @returns The directory and promise.
 */
export default async function tempDirWithCleanup() {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "motherhen-"));
    const { resolve, promise } = new Deferred;
    return {
        tempDir,
        resolve,
        promise: promise.then(() => fs.rm(tempDir, { recursive: true })),
    };
}
//# sourceMappingURL=tempDirWithCleanup.mjs.map