// #region preamble

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

import PatchesJSON, {
  PatchesJSONSerialized
} from "#cli/configuration/version-1.0/json/Patches.js";

import saveConfigurationAndRead from "../fixtures/saveConfigurationAndRead.js";

import IntegrationWizard from "#cli/configuration/version-1.0/wizard/Integration.js";
import StringSet from "#cli/configuration/version-1.0/json/StringSet.js";

// #endregion preamble

describe("Integration wizard", () => {
  let sharedArguments: SharedArguments,
      chooseTasks: ChooseTasksResults,
      inquirer: FakeInquirer,
      temp: TempDirWithCleanupType;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
    inquirer = new FakeInquirer;
  });
  afterEach(async () => await temp.cleanupTempDir());

  /**
   * Run the sources wizard, commit our changes to the file system, and get the resulting configuration.
   * @returns the configuration from the temporary directory.
   */
  async function runWizardAndWrite() : Promise<ConfigFileFormat>
  {
    await IntegrationWizard.run(
      sharedArguments,
      chooseTasks,
      "(default)"
    );

    return await saveConfigurationAndRead(sharedArguments);
  }

  beforeEach(async () => {
    /* We must set up the sources and patches dictionaries before exercising
    the integration wizard.
    */
    ({ sharedArguments, chooseTasks } = await setupSharedAndTasks(inquirer, temp, false));

    chooseTasks.quickStart = false;
    chooseTasks.newProjectKey = "hatchedegg-central-optimized";

    sharedArguments.configuration.sources.clear();
    sharedArguments.configuration.sources.set("(default)", new StringSet([
      "hatchedEgg"
    ]));

    sharedArguments.configuration.patches.clear();
    const patchConfig: PatchesJSONSerialized = {
      "globs": [
        "**/*.patch"
      ],
      "commitMode": "none",
      "commitMessage": null
    };

    sharedArguments.configuration.patches.set(
      "(default)", PatchesJSON.fromJSON(patchConfig)
    );

    sharedArguments.configuration.integrations.clear();
  });

  it("Quick-start works", async () => {
    chooseTasks.quickStart = true;

    inquirer.append([
      ["vanillaTag", new FakeAnswers("release")],
      ["existingDirectory", new FakeAnswers(
        sharedArguments.pathResolver.getPath(true)
      )],
      ["pathToFile", new FakeAnswers("integrations/release")],
    ]);

    const config = await runWizardAndWrite();
    expect(config.integrations.size).toBe(1);

    const integration = config.integrations.get("(default)");
    expect(integration).not.toBe(undefined);
    if (integration) {
      expect(integration.toJSON()).toEqual({
        vanillaTag: "release",
        sourceKey: "(default)",
        patchKey: "(default)",
        targetDirectory: "integrations/release",
      });
    }
  });

  it("Update works with one sources entry and one patches entry", async () => {
    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      ["vanillaTag", new FakeAnswers("beta")],
      ["existingDirectory", new FakeAnswers(
        sharedArguments.pathResolver.getPath(true)
      )],
      ["pathToFile", new FakeAnswers("integrations/hatchedEgg-beta")],
      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.integrations.size).toBe(1);

    const integration = config.integrations.get("(default)");
    expect(integration).not.toBe(undefined);
    if (integration) {
      expect(integration.toJSON()).toEqual({
        vanillaTag: "beta",
        sourceKey: "(default)",
        patchKey: "(default)",
        targetDirectory: "integrations/hatchedEgg-beta",
      });
    }
  });

  it("Update works with two sources entries and two patches entries", async () => {
    // set up a second source and patch
    sharedArguments.configuration.sources.set("(alternate)", new StringSet([
      "hatchedEgg"
    ]));

    const patchConfig: PatchesJSONSerialized = {
      "globs": [
        "**/*.patch"
      ],
      "commitMode": "none",
      "commitMessage": null
    };

    sharedArguments.configuration.patches.set(
      "(alternate)", PatchesJSON.fromJSON(patchConfig)
    );

    // we ask a lot more questions in this phase.
    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      ["vanillaTag", new FakeAnswers("beta")],
      ["selectedSourceKey", new FakeAnswers("(alternate)")],
      ["selectedSourceKey", new FakeAnswers("(default)")],
      ["selectedSourceKey", new FakeAnswers("(default)")],
      ["selectedPatchKey", new FakeAnswers("(alternate)")],
      ["selectedPatchKey", new FakeAnswers("(alternate)")],
      ["existingDirectory", new FakeAnswers(
        sharedArguments.pathResolver.getPath(true)
      )],
      ["pathToFile", new FakeAnswers("integrations/hatchedEgg-beta")],
      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.integrations.size).toBe(1);

    const integration = config.integrations.get("(default)");
    expect(integration).not.toBe(undefined);
    if (integration) {
      expect(integration.toJSON()).toEqual({
        vanillaTag: "beta",
        sourceKey: "(default)",
        patchKey: "(alternate)",
        targetDirectory: "integrations/hatchedEgg-beta",
      });
    }
  });
});
