// #region preamble

import FirefoxWizard from "#cli/configuration/version-1.0/wizard/Firefox.js";
import FirefoxJSON from "#cli/configuration/version-1.0/json/Firefox.js";

import path from "path";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
import type {
  SharedArguments,
  ChooseTasksResults,
} from "#cli/configuration/version-1.0/wizard/shared-types.js";
import SharedArgumentsImpl from "#cli/configuration/version-1.0/wizard/SharedArguments.js";

import FakeInquirer, {
  FakeAnswers
} from "#cli/utilities/FakeInquirer";

import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup.js";

// #endregion preamble

describe("Firefox wizard", () => {
  let sharedArguments: SharedArguments,
      chooseTasks: ChooseTasksResults,
      inquirer: FakeInquirer,
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

    chooseTasks = {
      quickStart: false,
      isFirefox: true,
      currentProjectKey: null,
      newProjectKey: "central-optimized",
      action: "create",
      userConfirmed: true,
      newConfigurationParts: ConfigFileFormat.fromJSON(
        sharedArguments.pathResolver,
        ConfigFileFormat.blank()
      ),
      copyExistingParts: new Set,
    };
  });

  it("create with a blank configuration is straight-forward", async () => {
    inquirer.append([
      ["vanillaTag", new FakeAnswers("release")],
      ["buildType", new FakeAnswers("optimized")],
      ["targetDirectory", new FakeAnswers(
        path.join(temp.tempDir, "integrations/firefox-clean")
      )],
      ["ok", new FakeAnswers(true)],
    ]);

    await FirefoxWizard.run(sharedArguments, chooseTasks);

    const firefoxMap = sharedArguments.configuration.firefoxes;
    expect(firefoxMap.size).toBe(1);
    const firefox = firefoxMap.get("central-optimized")?.toJSON();
    expect(firefox).not.toBe(undefined);
    firefoxMap.delete("central-optimized");

    expect(sharedArguments.configuration.toJSON()).toEqual(ConfigFileFormat.blank());

    if (firefox) {
      expect(firefox.vanillaTag).toBe("release");
      expect(firefox.buildType).toBe("optimized");
      expect(firefox.targetDirectory).toBe("integrations/firefox-clean");
    }

    expect(sharedArguments.fsQueue.pendingOperations()).toEqual([
      `write configuration to ${path.join(temp.tempDir, ".motherhen-config.json")}`
    ]);
    expect(inquirer.isEmpty()).toBe(true);
  });

  it("create from an existing Firefox configuration is pretty simple", async () => {
    chooseTasks.currentProjectKey = "central-debug";
    sharedArguments.configuration.firefoxes.set(
      "central-debug",
      FirefoxJSON.fromJSON(sharedArguments.pathResolver, {
        "vanillaTag": "central",
        "buildType": "debug",
        "targetDirectory": "integrations/firefox-clean"
      }),
    );

    inquirer.append([
      ["vanillaTag", new FakeAnswers("release")],
      ["buildType", new FakeAnswers("optimized")],
      ["targetDirectory", new FakeAnswers(
        path.join(temp.tempDir, "integrations/firefox-clean")
      )],
      ["ok", new FakeAnswers(true)],
    ]);

    await FirefoxWizard.run(sharedArguments, chooseTasks);

    const firefoxMap = sharedArguments.configuration.firefoxes;
    expect(firefoxMap.size).toBe(2);
    const firefox = firefoxMap.get("central-optimized")?.toJSON();
    expect(firefox).not.toBe(undefined);
    firefoxMap.clear();

    expect(sharedArguments.configuration.toJSON()).toEqual(ConfigFileFormat.blank());

    if (firefox) {
      expect(firefox.vanillaTag).toBe("release");
      expect(firefox.buildType).toBe("optimized");
      expect(firefox.targetDirectory).toBe("integrations/firefox-clean");
    }

    expect(sharedArguments.fsQueue.pendingOperations()).toEqual([
      `write configuration to ${path.join(temp.tempDir, ".motherhen-config.json")}`
    ]);
    expect(inquirer.isEmpty()).toBe(true);
  });

  it("updating an existing Firefox configuration works", async () => {
    chooseTasks.currentProjectKey = "central-debug";
    chooseTasks.newProjectKey = "central-debug";
    chooseTasks.action = "update";

    sharedArguments.configuration.firefoxes.set(
      "central-debug",
      FirefoxJSON.fromJSON(sharedArguments.pathResolver, {
        "vanillaTag": "central",
        "buildType": "debug",
        "targetDirectory": "integrations/firefox-clean"
      }),
    );

    inquirer.append([
      ["vanillaTag", new FakeAnswers("release")],
      ["buildType", new FakeAnswers("debug")],
      ["targetDirectory", new FakeAnswers(
        path.join(temp.tempDir, "integrations/firefox-clean")
      )],
      ["ok", new FakeAnswers(true)],
    ]);

    await FirefoxWizard.run(sharedArguments, chooseTasks);

    const firefoxMap = sharedArguments.configuration.firefoxes;
    expect(firefoxMap.size).toBe(1);
    const firefox = firefoxMap.get("central-debug")?.toJSON();
    expect(firefox).not.toBe(undefined);
    firefoxMap.clear();

    expect(sharedArguments.configuration.toJSON()).toEqual(ConfigFileFormat.blank());

    if (firefox) {
      expect(firefox.vanillaTag).toBe("release");
      expect(firefox.buildType).toBe("debug");
      expect(firefox.targetDirectory).toBe("integrations/firefox-clean");
    }

    expect(sharedArguments.fsQueue.pendingOperations()).toEqual([
      `write configuration to ${path.join(temp.tempDir, ".motherhen-config.json")}`
    ]);
    expect(inquirer.isEmpty()).toBe(true);
  });

  it("deleting an existing Firefox configuration works", async () => {
    chooseTasks.currentProjectKey = "central-debug";
    chooseTasks.newProjectKey = null;
    chooseTasks.action = "delete";

    sharedArguments.configuration.firefoxes.set(
      "central-debug",
      FirefoxJSON.fromJSON(sharedArguments.pathResolver, {
        "vanillaTag": "central",
        "buildType": "debug",
        "targetDirectory": "integrations/firefox-clean"
      }),
    );

    inquirer.append([
      ["ok", new FakeAnswers(true)],
    ]);

    await FirefoxWizard.run(sharedArguments, chooseTasks);

    const firefoxMap = sharedArguments.configuration.firefoxes;
    expect(firefoxMap.size).toBe(0);

    expect(sharedArguments.configuration.toJSON()).toEqual(ConfigFileFormat.blank());

    expect(sharedArguments.fsQueue.pendingOperations()).toEqual([
      `write configuration to ${path.join(temp.tempDir, ".motherhen-config.json")}`
    ]);
    expect(inquirer.isEmpty()).toBe(true);
  });
});
