import fs from "fs/promises";
import path from "path";

import TempDirWithCleanup from "#cli/utilities/TempDirWithCleanup.js";

it("TempDirWithCleanup creates a temporary directory, and on demand, cleans it up", async () => {
  const { tempDir, cleanupTempDir } = await TempDirWithCleanup();
  const pathTwo = path.join(tempDir, "one/two"),
        pathThree = path.join(pathTwo, "three.txt");

  await fs.mkdir(pathTwo, { recursive: true });
  await fs.writeFile(pathThree, "hello world", { "encoding": "utf-8" });

  await cleanupTempDir();

  await expect(fs.stat(pathThree)).rejects.toThrow("");
});
