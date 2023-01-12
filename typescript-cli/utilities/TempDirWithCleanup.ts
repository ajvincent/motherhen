import fs from "fs/promises";
import path from "path";
import os from "os";

export type TempDirWithCleanupType = {
  tempDir: string;
  cleanupTempDir: () => Promise<void>;
}

export default
async function TempDirWithCleanup() : Promise<TempDirWithCleanupType>
{
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "motherhen-"));
  const cleanupTempDir = async () : Promise<void> => {
    await fs.rm(tempDir, { recursive: true })
  }

  return {
    tempDir, cleanupTempDir
  }
}
