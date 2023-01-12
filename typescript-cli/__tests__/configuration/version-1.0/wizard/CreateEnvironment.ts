import fs from "fs/promises";
import path from "path";

import CreateEnvironment from "#cli/configuration/version-1.0/wizard/CreateEnvironment";
import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";
import { VanillaJSON } from "#cli/configuration/version-1.0/json/Vanilla";
import FakeInquirer, { FakeAnswers } from "#cli/utilities/FakeInquirer";
import type {
  SharedArguments
} from "#cli/configuration/version-1.0/wizard/shared-types";

describe("CreateEnvironment", () => {
  let shared: SharedArguments;
  let temp: TempDirWithCleanupType;
  let inquirer: FakeInquirer;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
    inquirer = new FakeInquirer;
  })
  afterEach(async () => await temp.cleanupTempDir());

  it("works with an empty directory", async () => {
    inquirer.set("existingDirectory", new FakeAnswers(temp.tempDir));
    inquirer.set("pathToFile", new FakeAnswers(".motherhen-config.json"));

    shared = await CreateEnvironment(inquirer, temp.tempDir, true);

    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);
    await expect(fs.readdir(temp.tempDir)).resolves.toEqual([]);
  });

  it("works with an existing Motherhen configuration", async () => {
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

    inquirer.set("existingDirectory", new FakeAnswers(temp.tempDir));
    inquirer.set("pathToFile", new FakeAnswers(".motherhen-config.json"));

    shared = await CreateEnvironment(inquirer, temp.tempDir, true);

    expect(shared.pathResolver.getPath(true)).toBe(temp.tempDir);
    expect(shared.fsQueue.hasCommitted()).toBe(false);

    const beta = shared.configuration.vanilla.get("beta");
    expect(beta?.tag).toBe("beta");
  });
});
