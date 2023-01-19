// #region preamble
import fs from "fs/promises";
import path from "path";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
import type {
  SharedArguments,
  ChooseTasksResults,
} from "#cli/configuration/version-1.0/wizard/shared-types.js";
import setupSharedAndTasks from "../fixtures/setupSharedAndTasks.js";

import FakeInquirer, {
  FakeAnswers
} from "#cli/utilities/FakeInquirer";

import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration.js";
import ProjectJSON from "#cli/configuration/version-1.0/json/Project.js";
import PatchesJSON from "#cli/configuration/version-1.0/json/Patches.js";

import PatchesWizard from "#cli/configuration/version-1.0/wizard/Patches.js";
import saveConfigurationAndRead from "../fixtures/saveConfigurationAndRead.js";
// #endregion preamble

describe("Patches wizard: ", () => {
  let sharedArguments: SharedArguments,
      chooseTasks: ChooseTasksResults,
      inquirer: FakeInquirer,
      temp: TempDirWithCleanupType,
      pathResolver: PathResolver,
      pathToConfig: string;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
    inquirer = new FakeInquirer;

    pathToConfig = path.join(temp.tempDir, ".motherhen-config.json");

    const useAbsoluteProperty = new PathResolver.UseAbsolute(
      temp.tempDir, false
    );

    pathResolver = new PathResolver(
      useAbsoluteProperty,
      false,
      ""
    );
  });
  afterEach(async () => await temp.cleanupTempDir());

  /**
   * Build an initial configuration for testing purposes.
   * @param initialSourceDirs - the initial source directories to create.  No actual contents.
   * @returns the configuration I just created.
   */
  async function writeInitialConfiguration() : Promise<ConfigFileFormat>
  {
    const config = ConfigFileFormat.fromJSON(
      pathResolver, ConfigFileFormat.blank()
    );

    // Every configuration should have at least one project.
    config.projects.set("(default)", ProjectJSON.fromJSON({
      integrationKey: "(default)",
      mozconfigKey: "optimized",
      appDir: "unknownDir"
    }));

    // Every project should have at least one integration.
    config.integrations.set("(default)", IntegrationJSON.fromJSON(
      pathResolver, {
        vanillaTag: "vanilla",
        sourceKey: "",
        patchKey: "(default)",
        targetDirectory: "integrations/vanilla"
      }
    ));

    // And of course, every integration should have at least one set of sources.
    const patchSet = PatchesJSON.fromJSON(PatchesJSON.blank());
    patchSet.globs.add("**/*.patch");
    config.patches.set("(default)", patchSet);
    await fs.writeFile(
      pathToConfig, JSON.stringify(config) + "\n", { encoding: "utf-8" }
    );

    return config;
  }

  /**
   * Run the sources wizard, commit our changes to the file system, and get the resulting configuration.
   * @returns the configuration from the temporary directory.
   */
  async function runWizardAndWrite() : Promise<ConfigFileFormat>
  {
    await PatchesWizard.run(
      sharedArguments,
      chooseTasks,
      "(default)"
    );

    return await saveConfigurationAndRead(sharedArguments);
  }

  it("Quick-start works", async () => {
    ({ sharedArguments, chooseTasks } = await setupSharedAndTasks(inquirer, temp, false));
    chooseTasks.quickStart = true;
    chooseTasks.newProjectKey = "hatchedegg-central-optimized";

    const config = await runWizardAndWrite();
    expect(config.patches.size).toBe(1);

    const patchSet = config.patches.get("(default)");
    expect(patchSet).not.toBe(undefined);
    if (patchSet) {
      expect(patchSet.toJSON()).toEqual({
        globs: ["**/*.patch"],
        commitMode: "none",
        commitMessage: null
      });
    }
  });

  /* Sources.ts tests DictionaryBase's add, clone, rename and delete tasks.
  readAll is not really testable, since it's a no-op, so that only leaves
  update.
  */
  it("Update from a quick-start configuration works", async () => {
    await writeInitialConfiguration();
    ({ sharedArguments, chooseTasks } = await setupSharedAndTasks(
      inquirer, temp, true
    ));

    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      ["ok", new FakeAnswers(false)],
      ["globsString", new FakeAnswers(
        `["**/*.patch", "!0001-*"]`,
        [`["*"]`],
        [`"*"`, []],
      )],
      ["ok", new FakeAnswers(true)],
      ["commitMode", new FakeAnswers("atEnd")],
      ["commitMessage", new FakeAnswers("Happy coding from Motherhen")],
      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.patches.size).toBe(1);

    const patchSet = config.patches.get("(default)");
    expect(patchSet).not.toBe(undefined);
    if (patchSet) {
      expect(patchSet.toJSON()).toEqual({
        globs: ["**/*.patch", "!0001-*"],
        commitMode: "atEnd",
        commitMessage: "Happy coding from Motherhen"
      });
    }
  });
});
