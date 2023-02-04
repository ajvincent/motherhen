import fs from "fs/promises";
import path from "path";
import os from "os";
export default async function TempDirWithCleanup() {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "motherhen-"));
    const cleanupTempDir = async () => {
        await fs.rm(tempDir, { recursive: true });
    };
    return {
        tempDir, cleanupTempDir
    };
}
//# sourceMappingURL=TempDirWithCleanup.js.map