import fs from "fs/promises";
import path from "path";
import os from "os";

import {
  Deferred,
  type PromiseResolver
} from "./PromiseTypes.mjs";

export type TemporaryDirWithPromise = {
  /** The directory's full path. */
  tempDir: string;

  /** The resolver for the cleanup promise. */
  resolve: PromiseResolver<unknown>;

  /** The cleanup promise. */
  promise: Promise<unknown>
}

/**
 * Create a temporary directory with a promise to clean it up later.
 *
 * @returns The directory and promise.
 */
export default
async function tempDirWithCleanup() : Promise<TemporaryDirWithPromise>
{
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "motherhen-"));
  const { resolve, promise } = new Deferred;

  return {
    tempDir,
    resolve,
    promise: promise.then(() => fs.rm(tempDir, { recursive: true })),
  };
}
