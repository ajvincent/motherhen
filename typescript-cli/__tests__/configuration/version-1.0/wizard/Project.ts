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

import StringSet from "#cli/configuration/version-1.0/json/StringSet.js";

import PatchesJSON, {
  PatchesJSONSerialized
} from "#cli/configuration/version-1.0/json/Patches.js";

import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup.js";

import saveConfigurationAndRead from "../fixtures/saveConfigurationAndRead.js";

import ProjectWizard from "#cli/configuration/version-1.0/wizard/Project.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration.js";

// #endregion preamble

describe("Project wizard", () => {
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
    await ProjectWizard.run(
      sharedArguments,
      chooseTasks,
    );

    return await saveConfigurationAndRead(sharedArguments);
  }

  beforeEach(async () => {
    /* We must set up the sources, patches and integration dictionaries before
    exercising the project wizard.
    */
    ({ sharedArguments, chooseTasks } = await setupSharedAndTasks(inquirer, temp, false));

    chooseTasks.quickStart = false;
    chooseTasks.newProjectKey = "hatchedegg-release-optimized";

    const config = sharedArguments.configuration;

    config.sources.clear();
    config.sources.set("(default)", new StringSet([
      "hatchedEgg"
    ]));

    config.patches.clear();
    const patchConfig: PatchesJSONSerialized = {
      "globs": [
        "**/*.patch"
      ],
      "commitMode": "none",
      "commitMessage": null
    };

    config.patches.set(
      "(default)", PatchesJSON.fromJSON(patchConfig)
    );

    config.integrations.clear();
    config.integrations.set("(default)", IntegrationJSON.fromJSON(
      sharedArguments.pathResolver,
      {
        vanillaTag: "release",
        sourceKey: "(default)",
        patchKey: "(default)",
        targetDirectory: "integrations/release",
      }
    ));
  });

  it("Quick-start works", async () => {
    chooseTasks.quickStart = true;

    inquirer.append([
      ["mozconfig", new FakeAnswers("optimized")],
    ]);

    const config = await runWizardAndWrite();
    expect(config.projects.size).toBe(1);

    const project = config.projects.get("hatchedegg-release-optimized");
    expect(project).not.toBe(undefined);
    if (project) {
      expect(project.toJSON()).toEqual({
        "integrationKey": "(default)",
        "mozconfig": "optimized",
        "appDir": "hatchedEgg"
      });
    }
  });

  it("Update works with one integration key", async () => {
    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      ["mozconfig", new FakeAnswers("debug")],
      ["ok", new FakeAnswers(true)],
    ])

    const config = await runWizardAndWrite();
    expect(config.projects.size).toBe(1);

    const project = config.projects.get("hatchedegg-release-optimized");
    expect(project).not.toBe(undefined);
    if (project) {
      expect(project.toJSON()).toEqual({
        "integrationKey": "(default)",
        "mozconfig": "debug",
        "appDir": "hatchedEgg"
      });
    }
  });

  it("Update works with two integration keys and two source directories to choose from", async () => {
    {
      const { sources } = sharedArguments.configuration;
      sources.set("(default)", new StringSet([
        "hatchedEgg",
        "crackedEgg",
      ]));

      sources.set("(boiled)", new StringSet([
        "hatchedEgg",
        "boiledEgg",
      ]));
    }

    {
      const { integrations } = sharedArguments.configuration;
      integrations.set(
        "(alternate)", IntegrationJSON.fromJSON(
          sharedArguments.pathResolver, {
            targetDirectory: "integrations/hatchedegg-vanilla",
            "sourceKey": "(default)",
            "patchKey": "(default)",
            "vanillaTag": "central"
          }
        )
      );
    }

    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      ["integrationKey", new FakeAnswers("(default)")],
      ["mozconfig", new FakeAnswers("debug")],
      ["appDir", new FakeAnswers("hatchedEgg")],
      ["ok", new FakeAnswers(true)],
    ])

    const config = await runWizardAndWrite();
    expect(config.projects.size).toBe(1);

    const project = config.projects.get("hatchedegg-release-optimized");
    expect(project).not.toBe(undefined);
    if (project) {
      expect(project.toJSON()).toEqual({
        "integrationKey": "(default)",
        "mozconfig": "debug",
        "appDir": "hatchedEgg"
      });
    }
  });
});
