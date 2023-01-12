import fs from "fs/promises";
import path from "path";

import SharedArgumentsTest from "#cli/configuration/version-1.0/wizard/SharedArguments-test";
import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";
import { VanillaJSON } from "#cli/configuration/version-1.0/json/Vanilla";

describe("SharedArgumentsTest", () => {
  let shared: SharedArgumentsTest;
  let temp: TempDirWithCleanupType;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
  })
  afterEach(async () => await temp.cleanupTempDir());

  it("creates all the necessary parts from an empty directory", async () => {
    shared = new SharedArgumentsTest(temp.tempDir);
    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);
    await expect(fs.readdir(temp.tempDir)).resolves.toEqual([]);

    {
      const config = ConfigFileFormat.fromJSON(
        shared.pathResolver,
        ConfigFileFormat.blank()
      );

      const tempResolver = shared.pathResolver.clone();
      tempResolver.setPath(false, "cleanroom/mozilla-unified");

      config.vanilla.set("beta", new VanillaJSON(
        tempResolver, "beta"
      ));

      const configPath = path.join(temp.tempDir, ".motherhen-config.json");
      const contents = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, contents, { encoding: "utf-8" });
    }

    await shared.loadConfiguration(".motherhen-config.json");
    const beta = shared.configuration.vanilla.get("beta");
    expect(beta?.tag).toBe("beta");
  });
});
