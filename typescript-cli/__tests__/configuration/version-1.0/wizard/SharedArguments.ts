import fs from "fs/promises";
import path from "path";

import SharedArgumentsImpl from "#cli/configuration/version-1.0/wizard/SharedArguments";
import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";
import { VanillaJSON } from "#cli/configuration/version-1.0/json/Vanilla";
import FakeInquirer from "#cli/utilities/FakeInquirer";
import type {
  SharedArguments
} from "#cli/configuration/version-1.0/wizard/shared-types";

describe("SharedArguments creates all the necessary parts", () => {
  let shared: SharedArguments;
  let temp: TempDirWithCleanupType;
  const inquirer = new FakeInquirer;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
    inquirer.clear();
  })
  afterEach(async () => await temp.cleanupTempDir());

  it("from an empty directory", async () => {
    shared = await SharedArgumentsImpl.build(inquirer, temp.tempDir, "");
    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);
    await expect(fs.readdir(temp.tempDir)).resolves.toEqual([]);
  });

  it("from a directory with an existing Motherhen configuration", async () => {
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

    shared = await SharedArgumentsImpl.build(
      inquirer, temp.tempDir, ".motherhen-config.json"
    );
    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);

    const beta = shared.configuration.vanilla.get("beta");
    expect(beta?.tag).toBe("beta");
  });
});