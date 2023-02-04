// #region preamble
import path from "path";
import fs from "fs/promises";

import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup.js";
import FakeInquirer, {
  FakeAnswers
} from "#cli/utilities/FakeInquirer.js";
import type {
  FirefoxJSONSerialized
} from "#cli/configuration/version-1.0/json/Firefox";

import fileExists from "#cli/utilities/fileExists";
import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";
import PathResolver from "#cli/configuration/PathResolver";
import FirefoxJSON from "#cli/configuration/version-1.0/json/Firefox";

// #endregion preamble

import Driver, {
  type DriverArguments,
} from "#cli/configuration/version-1.0/wizard/Driver.js";

/**
 * @remarks
 *
 * The wizard driver is really an integration of several wizards together.
 * So this set of specifications is really an integration test, making sure
 * the wizards generally work together well.
 */

describe("Wizard Driver", () => {
  let workingTemp: TempDirWithCleanupType;
  let motherhenTemp: TempDirWithCleanupType;
  let inquirer: FakeInquirer;
  let resolver: PathResolver;

  beforeEach(async () => {
    workingTemp = await TempDirWithCleanup();
    motherhenTemp = await TempDirWithCleanup();
    inquirer = new FakeInquirer;

    const useAbsoluteProperty = new PathResolver.UseAbsolute(workingTemp.tempDir, false);
    resolver = new PathResolver(
      useAbsoluteProperty,
      false,
      "",
    );
  });
  afterEach(async () => {
    await Promise.all([
      workingTemp.cleanupTempDir(),
      motherhenTemp.cleanupTempDir(),
    ]);
  });

  // #region utilities
  function addOneQuestion(questionName: string, answer: unknown) : void
  {
    inquirer.append([
      [questionName, new FakeAnswers(answer)]
    ]);
  }

  function setupCreateEnvironment() : void
  {
    inquirer.append([
      ["existingDirectory", new FakeAnswers(workingTemp.tempDir)],
      ["pathToFile", new FakeAnswers(".motherhen-config.json")]
    ]);
  }

  function enterQuickStart(quickStart: boolean) : void
  {
    addOneQuestion("doQuickStart", quickStart);
  }

  function maybeEnterFirefoxWizard(shouldEnter: boolean) : void
  {
    addOneQuestion("isFirefox", shouldEnter);
  }

  function addProjectKey(isNewKey: boolean, key: string) : void
  {
    addOneQuestion(
      isNewKey ? "newProjectKey" : "currentProjectKey",
      key
    );
  }

  function addAction(action: string) : void
  {
    addOneQuestion("action", action);
  }

  function addUserSelection(selection: string) : void
  {
    addOneQuestion("userSelection", selection);
  }

  function addUserConfirm(userConfirm: boolean) : void
  {
    addOneQuestion("ok", userConfirm);
  }

  async function writeConfiguration(
    configuration: ConfigFileFormat
  ) : Promise<void>
  {
    const contents = JSON.stringify(configuration, null, 2) + "\n";
    await fs.writeFile(
      path.join(workingTemp.tempDir, ".motherhen-config.json"),
      contents,
      { encoding: "utf-8" }
    );
  }

  async function runDriver(useConfigFile: boolean) : Promise<void>
  {
    const args: DriverArguments = {
      workingDirectory: workingTemp.tempDir,
      motherhenWriteDirectory: motherhenTemp.tempDir,
      inquirer,
      suppressConsole: true
    };
    if (useConfigFile)
      args.motherhenConfigLeaf = ".motherhen-config.json";
    await Driver.run(args);
  }

  async function readConfigFile() : Promise<ConfigFileFormat | null>
  {
    const pathToFile = path.join(workingTemp.tempDir, ".motherhen-config.json");
    if (!await fileExists(pathToFile, false)) {
      return null;
    }

    const contentsString = await fs.readFile(
      pathToFile, { encoding: "utf-8" }
    );
    const contentsJSON = JSON.parse(contentsString) as object;
    if (!ConfigFileFormat.isJSON(contentsJSON))
      throw new Error("unexpected, we should've written a Motherhen configuration");

    return ConfigFileFormat.fromJSON(resolver, contentsJSON);
  }
  // #endregion utilities

  it("for quick-start Motherhen mode", async () => {
    setupCreateEnvironment();
    enterQuickStart(true);

    addOneQuestion("newSourceDir", "hatchedEgg");
    addOneQuestion("vanillaTag", "release");
    addOneQuestion("existingDirectory", motherhenTemp.tempDir);
    addOneQuestion("pathToFile", "integrations/release");
    addOneQuestion("mozconfig", "optimized");
    addOneQuestion("displayAppName", "Hatched Egg");

    await runDriver(false);

    const configuration = await readConfigFile();
    expect(configuration?.toJSON()).toEqual({
      "formatVersion": "1.0.0",
      "sources": {
        "(default)": [
          "hatchedEgg"
        ]
      },
      "patches": {
        "(default)": {
          "globs": [
            "**/*.patch"
          ],
          "commitMode": "none",
          "commitMessage": null
        }
      },
      "integrations": {
        "(default)": {
          "vanillaTag": "release",
          "sourceKey": "(default)",
          "patchKey": "(default)",
          "targetDirectory": path.join(
            path.relative(workingTemp.tempDir, motherhenTemp.tempDir),
            "integrations/release"
          )
        }
      },
      "projects": {
        "default": {
          "integrationKey": "(default)",
          "mozconfig": "optimized",
          "appDir": "hatchedEgg",
          "displayAppName": "Hatched Egg",
        }
      },
      "firefoxes": {}
    });

    expect(inquirer.isEmpty()).toBe(true);
  });

  describe("for Firefox projects", () => {
    function enterFirefoxSettings(settings: FirefoxJSONSerialized) : void
    {
      inquirer.append([
        ["vanillaTag", new FakeAnswers(settings.vanillaTag)],
        ["buildType", new FakeAnswers(settings.buildType)],
        ["targetDirectory", new FakeAnswers(
          path.join(workingTemp.tempDir, settings.targetDirectory)
        )],
      ]);
      addUserConfirm(true);
    }

    it("starts with a blank project and creates a configuration file", async () => {
      setupCreateEnvironment();
      enterQuickStart(false);
      maybeEnterFirefoxWizard(true);
      addProjectKey(true, "central-optimized");
      addUserConfirm(true);

      enterFirefoxSettings({
        vanillaTag: "release",
        buildType: "optimized",
        targetDirectory: "integrations/firefox-clean",
      });

      await runDriver(false);

      const configuration = await readConfigFile();
      expect(configuration).not.toBe(null);
      if (configuration === null)
        return;

      const firefoxMap = configuration.firefoxes;
      expect(firefoxMap.size).toBe(1);
      const firefox = firefoxMap.get("central-optimized")?.toJSON();
      expect(firefox).not.toBe(undefined);
      firefoxMap.delete("central-optimized");

      expect(configuration.toJSON()).toEqual(ConfigFileFormat.blank());

      if (firefox) {
        expect(firefox.vanillaTag).toBe("release");
        expect(firefox.buildType).toBe("optimized");
        expect(firefox.targetDirectory).toBe("integrations/firefox-clean");
      }

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("may update an existing configuration", async () => {
      {
        const config = ConfigFileFormat.fromJSON(resolver, ConfigFileFormat.blank());
        config.firefoxes.set("central-optimized", FirefoxJSON.fromJSON(resolver, {
          vanillaTag: "release",
          buildType: "debug",
          targetDirectory: "integrations/firefox-dirty"
        }));
        await writeConfiguration(config);
      }

      enterQuickStart(false);
      maybeEnterFirefoxWizard(true);
      addProjectKey(false, "central-optimized");
      addAction("update");
      addUserConfirm(true);

      enterFirefoxSettings({
        vanillaTag: "release",
        buildType: "optimized",
        targetDirectory: "integrations/firefox-clean",
      });

      await runDriver(true);

      const configuration = await readConfigFile();
      expect(configuration).not.toBe(null);
      if (configuration === null)
        return;

      const firefoxMap = configuration.firefoxes;
      expect(firefoxMap.size).toBe(1);
      const firefox = firefoxMap.get("central-optimized")?.toJSON();
      expect(firefox).not.toBe(undefined);
      firefoxMap.delete("central-optimized");

      expect(configuration.toJSON()).toEqual(ConfigFileFormat.blank());

      if (firefox) {
        expect(firefox.vanillaTag).toBe("release");
        expect(firefox.buildType).toBe("optimized");
        expect(firefox.targetDirectory).toBe("integrations/firefox-clean");
      }

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("may delete an existing configuration", async () => {
      {
        const config = ConfigFileFormat.fromJSON(resolver, ConfigFileFormat.blank());
        config.firefoxes.set("central-optimized", FirefoxJSON.fromJSON(resolver, {
          vanillaTag: "release",
          buildType: "debug",
          targetDirectory: "integrations/firefox-dirty"
        }));
        await writeConfiguration(config);
      }

      enterQuickStart(false);
      maybeEnterFirefoxWizard(true);
      addProjectKey(false, "central-optimized");
      addAction("delete");
      addUserConfirm(true);
      addUserConfirm(true);

      await runDriver(true);

      const configuration = await readConfigFile();
      expect(configuration).not.toBe(null);
      if (configuration === null)
        return;

      const firefoxMap = configuration.firefoxes;
      expect(firefoxMap.size).toBe(0);

      expect(configuration.toJSON()).toEqual(ConfigFileFormat.blank());
      expect(inquirer.isEmpty()).toBe(true);
    });
  });

  describe("for Motherhen projects", () => {
    it("can create a configuration file without quick-start mode", async () => {
      // #region questions
      setupCreateEnvironment();

      // initialization
      enterQuickStart(false);
      maybeEnterFirefoxWizard(false);
      addProjectKey(true, "hatchedEgg");
      addUserConfirm(true);

      // sources
      addUserSelection("update");
      addOneQuestion("newSourceDir", "hatchedEgg");
      addUserConfirm(true);

      // patches
      addUserSelection("update");
      addUserConfirm(false);
      addOneQuestion("globsString", `["**/*.patch"]`);
      addUserConfirm(true);
      addOneQuestion("commitMode", "qimport");
      addUserConfirm(true);

      // integrations
      addUserSelection("update");
      addOneQuestion("vanillaTag", "beta");
      inquirer.append([
        ["existingDirectory", new FakeAnswers(workingTemp.tempDir)],
        ["pathToFile", new FakeAnswers("integrations/beta")]
      ]);
      addUserConfirm(true);

      // projects
      addUserSelection("update");
      addOneQuestion("mozconfig", "optimized");
      addOneQuestion("displayAppName", "Hatched Egg");
      addUserConfirm(true);
      // #endregion questions

      await runDriver(false);

      const configuration = await readConfigFile();
      expect(configuration?.toJSON()).toEqual({
        "formatVersion": "1.0.0",
        "sources": {
          "(default)": [
            "hatchedEgg"
          ]
        },
        "patches": {
          "(default)": {
            "globs": [
              "**/*.patch"
            ],
            "commitMode": "qimport",
            "commitMessage": null
          }
        },
        "integrations": {
          "(default)": {
            "vanillaTag": "beta",
            "sourceKey": "(default)",
            "patchKey": "(default)",
            "targetDirectory": "integrations/beta"
          }
        },
        "projects": {
          "hatchedEgg": {
            "integrationKey": "(default)",
            "mozconfig": "optimized",
            "appDir": "hatchedEgg",
            "displayAppName": "Hatched Egg"
          }
        },
        "firefoxes": {}
      });

      expect(inquirer.isEmpty()).toBe(true);
    });

    it("can create a project configuration when one already exists", async () => {
      const config = ConfigFileFormat.fromJSON(resolver, {
        "formatVersion": "1.0.0",
        "sources": {
          "(default)": [
            "hatchedEgg"
          ]
        },
        "patches": {
          "(default)": {
            "globs": [
              "**/*.patch"
            ],
            "commitMode": "qimport",
            "commitMessage": null
          }
        },
        "integrations": {
          "(default)": {
            "vanillaTag": "beta",
            "sourceKey": "(default)",
            "patchKey": "(default)",
            "targetDirectory": "integrations/beta"
          }
        },
        "projects": {
          "hatchedEgg": {
            "integrationKey": "(default)",
            "mozconfig": "optimized",
            "appDir": "hatchedEgg",
            "displayAppName": "Hatched Egg",
          }
        },
        "firefoxes": {}
      });

      await writeConfiguration(config);

      // #region questions

      // initialization
      maybeEnterFirefoxWizard(false);
      addProjectKey(false, "hatchedEgg");
      addAction("create");
      addProjectKey(true, "boiledEgg");
      addUserConfirm(true);

      // sources
      addUserSelection("clone");
      addOneQuestion("newKey", "boiling");
      addOneQuestion("newSourceDir", "boiledEgg");
      addUserConfirm(true);

      // patches
      addUserSelection("update");
      addUserConfirm(true);
      addOneQuestion("commitMode", "atEnd");
      addOneQuestion("commitMessage", "Apply Motherhen patches.");
      addUserConfirm(true);

      // integrations
      addUserSelection("add");
      addOneQuestion("newKey", "beta");
      addOneQuestion("vanillaTag", "beta");
      addOneQuestion("selectedSourceKey", "boiling");
      addOneQuestion("selectedSourceKey", "boiling");
      inquirer.append([
        ["existingDirectory", new FakeAnswers(workingTemp.tempDir)],
        ["pathToFile", new FakeAnswers("integrations/beta")]
      ]);
      addUserConfirm(true);

      // projects
      addUserSelection("update");
      addOneQuestion("integrationKey", "beta");
      addOneQuestion("mozconfig", "buildSymbols");
      addOneQuestion("appDir", "boiledEgg");
      addOneQuestion("displayAppName", "Boiled Egg")
      addUserConfirm(true);

      // #endregion questions

      await runDriver(true);

      const configuration = await readConfigFile();
      expect(configuration?.toJSON()).toEqual({
        "formatVersion": "1.0.0",
        "sources": {
          "(default)": [
            "hatchedEgg"
          ],
          "boiling": [
            "hatchedEgg",
            "boiledEgg"
          ]
        },
        "patches": {
          "(default)": {
            "globs": [
              "**/*.patch"
            ],
            "commitMode": "atEnd",
            "commitMessage": "Apply Motherhen patches."
          }
        },
        "integrations": {
          "(default)": {
            "vanillaTag": "beta",
            "sourceKey": "(default)",
            "patchKey": "(default)",
            "targetDirectory": "integrations/beta"
          },
          "beta": {
            "vanillaTag": "beta",
            "sourceKey": "boiling",
            "patchKey": "(default)",
            "targetDirectory": "integrations/beta"
          }
        },
        "projects": {
          "hatchedEgg": {
            "integrationKey": "(default)",
            "mozconfig": "optimized",
            "appDir": "hatchedEgg",
            "displayAppName": "Hatched Egg",

          },
          "boiledEgg": {
            "integrationKey": "beta",
            "mozconfig": "buildSymbols",
            "appDir": "boiledEgg",
            "displayAppName": "Boiled Egg",
          }
        },
        "firefoxes": {}
      });
    });
  });
});
