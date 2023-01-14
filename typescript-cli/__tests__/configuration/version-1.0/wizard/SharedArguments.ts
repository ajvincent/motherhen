import fs from "fs/promises";
import path from "path";

import SharedArgumentsImpl from "#cli/configuration/version-1.0/wizard/SharedArguments";
import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";
import FakeInquirer from "#cli/utilities/FakeInquirer";
import type {
  SharedArguments
} from "#cli/configuration/version-1.0/wizard/shared-types";
import StringSet from "#cli/configuration/version-1.0/json/StringSet";

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
    shared = await SharedArgumentsImpl.build(inquirer, temp.tempDir, true, "");
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

      config.sources.set("hatchedEgg", StringSet.fromJSON(["hatchedEgg"]));

      const tempResolver = shared.pathResolver.clone();
      tempResolver.setPath(false, "cleanroom/mozilla-unified");

      // disabled because we need something beyond a blank configuration to test against
      const configPath = path.join(temp.tempDir, ".motherhen-config.json");
      const contents = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, contents, { encoding: "utf-8" });
    }

    shared = await SharedArgumentsImpl.build(
      inquirer, temp.tempDir, true, ".motherhen-config.json"
    );
    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);

    expect(shared.configuration.sources.has("hatchedEgg"));
  });
});
