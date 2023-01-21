// #region preamble

import FirefoxJSON from "#cli/configuration/version-1.0/json/Firefox";
import ChooseTasksWizard from "#cli/configuration/version-1.0/wizard/ChooseTasks.js";

import type {
  SharedArguments,
  ChooseTasksResults,
} from "#cli/configuration/version-1.0/wizard/shared-types";
import SharedArgumentsImpl from "#cli/configuration/version-1.0/wizard/SharedArguments.js";

import FakeInquirer, {
  FakeAnswers
} from "#cli/utilities/FakeInquirer";

import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import ProjectJSON from "#cli/configuration/version-1.0/json/Project.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration.js";
import StringSet from "#cli/configuration/version-1.0/json/StringSet.js";
import PatchesJSON from "#cli/configuration/version-1.0/json/Patches.js";

// #endregion preamble

describe("Choose tasks wizard", () => {
  let sharedArguments: SharedArguments,
      chooseTasks: ChooseTasksResults,
      inquirer: FakeInquirer,
      pathResolver: PathResolver,
      temp: TempDirWithCleanupType;

  beforeEach(async () => {
    temp = await TempDirWithCleanup();
  });
  afterEach(async () => await temp.cleanupTempDir());

  beforeEach(async () => {
    inquirer = new FakeInquirer;
    sharedArguments = await SharedArgumentsImpl.build(
      inquirer,
      temp.tempDir,
      true
    );

    const pathResolverBase = new PathResolver.UseAbsolute(
      temp.tempDir, false
    );

    pathResolver = new PathResolver(pathResolverBase, false, "");
  });

  it("exits with initial settings for quick-start", async () => {
    inquirer.append([
      ["doQuickStart", new FakeAnswers(true)],
    ]);

    chooseTasks = await ChooseTasksWizard.run(
      sharedArguments
    );

    expect(chooseTasks.quickStart).toBe(true);
    expect(chooseTasks.currentProjectKey).toBe(null);
    expect(chooseTasks.newProjectKey).toBe("default");
    expect(chooseTasks.isFirefox).toBe(false);
    expect(chooseTasks.action).toBe("create");
    expect(chooseTasks.userConfirmed).toBe(true);

    expect(inquirer.isEmpty()).toBe(true);
  });

  describe("for Firefox builds", () => {
    beforeEach(() => {
      inquirer.append([
        ["doQuickStart", new FakeAnswers(false)],
        ["isFirefox", new FakeAnswers(true)],
      ]);
    });

    it("can create results for a new project", async () => {
      inquirer.append([
        ["newProjectKey", new FakeAnswers("central-optimized")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe(null);
      expect(chooseTasks.newProjectKey).toBe("central-optimized");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("create");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can select an existing project for updating", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-debug-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "debug",
          targetDirectory: "firefoxes/debug-central"
        })
      );

      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can select an existing project as a base for creating a new project", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("create")],
        ["newProjectKey", new FakeAnswers("fx-debug-central")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe("fx-debug-central");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("create");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can select an existing project for deletion", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-debug-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "debug",
          targetDirectory: "firefoxes/debug-central"
        })
      );

      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("delete")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe(null);
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("delete");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a bailout as another loop (no confirmation attempted)", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-debug-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "debug",
          targetDirectory: "firefoxes/debug-central"
        })
      );

      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("bailout")],

        ["isFirefox", new FakeAnswers(true)],
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a read as another loop (no confirmation attempted)", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-debug-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "debug",
          targetDirectory: "firefoxes/debug-central"
        })
      );

      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("read")],

        ["isFirefox", new FakeAnswers(true)],
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a non-confirmation as another loop", async () => {
      sharedArguments.configuration.firefoxes.set(
        "fx-debug-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "debug",
          targetDirectory: "firefoxes/debug-central"
        })
      );

      sharedArguments.configuration.firefoxes.set(
        "fx-opt-central", FirefoxJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          buildType: "optimized",
          targetDirectory: "firefoxes/opt-central"
        })
      );

      inquirer.append([
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("delete")],

        ["ok", new FakeAnswers(false)],

        ["isFirefox", new FakeAnswers(true)],
        ["currentProjectKey", new FakeAnswers("fx-opt-central")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.newProjectKey).toBe("fx-opt-central");
      expect(chooseTasks.isFirefox).toBe(true);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });
  });

  describe("for Motherhen builds", () => {
    it("can create results for a new project", async () => {
      inquirer.append([
        ["doQuickStart", new FakeAnswers(false)],
        ["isFirefox", new FakeAnswers(false)],
        ["newProjectKey", new FakeAnswers("hatchedegg")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe(null);
      expect(chooseTasks.newProjectKey).toBe("hatchedegg");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("create");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    function buildFakeConfiguration() : void
    {
      sharedArguments.configuration.projects.set(
        "crackedEgg-debug", ProjectJSON.fromJSON({
          integrationKey: "eggs",
          mozconfig: "debug",
          appDir: "crackedEgg",
        })
      );

      sharedArguments.configuration.projects.set(
        "hatchedEgg-opt", ProjectJSON.fromJSON({
          integrationKey: "eggs",
          mozconfig: "optimized",
          appDir: "hatchedEgg",
        })
      );

      sharedArguments.configuration.integrations.set(
        "eggs", IntegrationJSON.fromJSON(
          pathResolver, {
            vanillaTag: "release",
            sourceKey: "eggs",
            patchKey: "(all)",
            targetDirectory: "integrations/eggs-release"
          }
        )
      );

      sharedArguments.configuration.sources.set(
        "eggs", StringSet.fromJSON([
          "sources/hatchedEgg",
          "sources/crackedEgg",
        ])
      );

      sharedArguments.configuration.patches.set(
        "(all)",
        PatchesJSON.fromJSON({
          globs: ["**/*.patch"],
          commitMode: "none",
          commitMessage: null,
        })
      );
    }

    it("can select an existing project as a base for creating a new project", async () => {
      buildFakeConfiguration();

      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("create")],
        ["newProjectKey", new FakeAnswers("hatchedEgg-debug")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe("hatchedEgg-debug");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("create");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can select an existing project for updating", async () => {
      buildFakeConfiguration();

      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can select an existing project for deletion", async () => {
      buildFakeConfiguration();

      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("delete")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe(null);
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("delete");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a bailout as another loop (no confirmation attempted)", async () => {
      buildFakeConfiguration();

      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("bailout")],

        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a read as another loop (no confirmation attempted)", async () => {
      buildFakeConfiguration();

      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("read")],

        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("treats a non-confirmation as another loop", async () => {
      buildFakeConfiguration();
      inquirer.append([
        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("delete")],
        ["ok", new FakeAnswers(false)],

        ["isFirefox", new FakeAnswers(false)],
        ["currentProjectKey", new FakeAnswers("hatchedEgg-opt")],
        ["action", new FakeAnswers("update")],
        ["ok", new FakeAnswers(true)],
      ]);

      chooseTasks = await ChooseTasksWizard.run(
        sharedArguments
      );

      expect(chooseTasks.quickStart).toBe(false);
      expect(chooseTasks.currentProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.newProjectKey).toBe("hatchedEgg-opt");
      expect(chooseTasks.isFirefox).toBe(false);
      expect(chooseTasks.action).toBe("update");
      expect(chooseTasks.userConfirmed).toBe(true);

      expect(inquirer.isEmpty()).toBe(true);
    });
  });
});
