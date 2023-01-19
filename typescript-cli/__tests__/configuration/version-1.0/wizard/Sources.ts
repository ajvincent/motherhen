// #region preamble
import fs from "fs/promises";
import path from "path";

import ConfigFileFormat, { ConfigFileFormatSerialized } from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
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

import PathResolver from "#cli/configuration/PathResolver";

import SourcesWizard from "#cli/configuration/version-1.0/wizard/Sources.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration";
import ProjectJSON from "#cli/configuration/version-1.0/json/Project";
import StringSet from "#cli/configuration/version-1.0/json/StringSet";
import { PromiseAllParallel } from "#cli/utilities/PromiseTypes";

// #endregion preamble

describe("Sources wizard: ", () => {
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
  async function writeInitialConfiguration(
    initialSourceDirs: string[]
  ) : Promise<ConfigFileFormat>
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
        sourceKey: "(default)",
        patchKey: "",
        targetDirectory: "integrations/vanilla"
      }
    ));

    // And of course, every integration should have at least one set of sources.
    config.sources.set("(default)", new StringSet(initialSourceDirs));
    await fs.writeFile(
      pathToConfig, JSON.stringify(config) + "\n", { encoding: "utf-8" }
    );

    // Create the source directories.
    await PromiseAllParallel(initialSourceDirs, async (dir) => {
      await fs.mkdir(
        path.join(temp.tempDir, "sources", dir),
        { recursive: true }
      );
    });

    return config;
  }

  /**
   * Set up the `sharedArguments` and `chooseTasks` variables for a test run.
   * @param useConfigFile - true if we should use a Motherhen configuration file which we assume exists.
   */
  async function setupSharedAndTasks(
    useConfigFile: boolean
  ) : Promise<void>
  {
    sharedArguments = await SharedArgumentsImpl.build(
      inquirer,
      temp.tempDir,
      true,
      useConfigFile ? ".motherhen-config.json" : ""
    );

    chooseTasks = {
      quickStart: false,
      isFirefox: false,
      currentProjectKey: "(default)",
      newProjectKey: "(default)",
      action: "create",
      userConfirmed: false,
      newConfigurationParts: ConfigFileFormat.fromJSON(
        sharedArguments.pathResolver,
        ConfigFileFormat.blank()
      ),
      copyExistingParts: new Set,
    };
  }

  /**
   * Run the sources wizard, commit our changes to the file system, and get the resulting configuration.
   * @returns the configuration from the temporary directory.
   */
  async function runWizardAndWrite() : Promise<ConfigFileFormat>
  {
    await SourcesWizard.run(
      sharedArguments,
      chooseTasks,
      "(default)",
      temp.tempDir
    );

    await sharedArguments.fsQueue.writeConfiguration(
      sharedArguments.configuration,
      ".motherhen-config.json"
    );

    await sharedArguments.fsQueue.commit();

    const contents = await fs.readFile(pathToConfig, { encoding: "utf-8" });
    return ConfigFileFormat.fromJSON(
      sharedArguments.pathResolver,
      JSON.parse(contents) as ConfigFileFormatSerialized
    );
  }

  /**
   * Check a sources map within a configuration.
   * @param config - the configuration read from the file system.
   * @param mapKey - the map key within the sources dictionary of the configuration.
   * @param elements - the strings we expect must be in the map value.
   */
  function checkSourceMap(
    config: ConfigFileFormat,
    mapKey: string,
    elements: string[],
  ) : void
  {
    const source = config.sources.get(mapKey);
    expect(source).not.toBe(undefined);
    if (!source)
      return;
    const actual = Array.from(source);
    const expected = elements.slice();
    actual.sort();
    expected.sort();
    expect(actual).toEqual(expected);
  }

  /** Check for string replacements in a generated source directory. */
  async function spotCheckMakefile() : Promise<void>
  {
    const pathToMakefile = path.join(
      temp.tempDir, "sources/hatchedEgg/app/Makefile.in"
    );
    const Makefile = await fs.readFile(
      pathToMakefile, { encoding: "utf-8" }
    );

    expect(Makefile.includes(`PROJECT_DIR = motherhen/hatchedEgg\n`)).toBe(true);
  }

  it("Quick-start works", async () => {
    await setupSharedAndTasks(false);
    chooseTasks.quickStart = true;
    chooseTasks.newProjectKey = "hatchedegg-central-optimized";

    inquirer.append([
      [
        "newSourceDir",
        new FakeAnswers(
          "hatchedEgg",
          [ "crackedEgg" ],
          ["../hatchedEgg"]
        )
      ],
    ]);

    const config = await runWizardAndWrite();
    expect(config.sources.size).toBe(1);
    checkSourceMap(config, "(default)", ["hatchedEgg"]);

    await spotCheckMakefile();
  });

  it("Create from a quick-start configuration works", async () => {
    await writeInitialConfiguration(["crackedEgg"]);
    await setupSharedAndTasks(true);

    inquirer.append([
      ["userSelection", new FakeAnswers("add")],
      [
        "newKey",
        new FakeAnswers(
          "newKey",
        )
      ],
      [
        "chooseSources",
        new FakeAnswers(
          ["" /* (add new source directory)*/, ]
        )
      ],

      [
        "newSourceDir",
        new FakeAnswers(
          "hatchedEgg",
          [ "boiledEgg" ],
          ["../hatchedEgg"]
        )
      ],

      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.sources.size).toBe(2);
    checkSourceMap(config, "(default)", ["crackedEgg"]);
    checkSourceMap(config, "newKey", ["hatchedEgg"]);

    await spotCheckMakefile();
  });

  it("Clone from a quick-start configuration works", async () => {
    await writeInitialConfiguration(["crackedEgg"]);
    await setupSharedAndTasks(true);

    inquirer.append([
      ["userSelection", new FakeAnswers("clone")],
      [
        "newKey",
        new FakeAnswers(
          "newKey",
        )
      ],
      [
        "chooseSources",
        new FakeAnswers(
          [ "crackedEgg",
            "" /* (add new source directory)*/,
          ]
        )
      ],

      [
        "newSourceDir",
        new FakeAnswers(
          "hatchedEgg",
          [ "boiledEgg" ],
          ["../hatchedEgg"]
        )
      ],

      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.sources.size).toBe(2);
    checkSourceMap(config, "(default)", ["crackedEgg"]);
    checkSourceMap(config, "newKey", ["crackedEgg", "hatchedEgg"]);

    await spotCheckMakefile();
  });

  it("Update from a quick-start configuration works", async () => {
    await writeInitialConfiguration(["crackedEgg", "hatchedEgg"]);
    await setupSharedAndTasks(true);

    inquirer.append([
      ["userSelection", new FakeAnswers("update")],
      [
        "chooseSources",
        new FakeAnswers(
          [ "hatchedEgg" ]
        )
      ],

      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.sources.size).toBe(1);
    checkSourceMap(config, "(default)", ["hatchedEgg"]);

    /* Since we didn't actually create a new source file, this would fail.
    await spotCheckMakefile();
    */
  });

  it("Rename from a quick-start configuration works", async () => {
    await writeInitialConfiguration(["hatchedEgg"]);
    await setupSharedAndTasks(true);

    inquirer.append([
      ["userSelection", new FakeAnswers("rename")],
      [
        "newKey",
        new FakeAnswers(
          "newKey",
        )
      ],

      ["ok", new FakeAnswers(true)],
    ]);

    const config = await runWizardAndWrite();
    expect(config.sources.size).toBe(1);
    checkSourceMap(config, "newKey", ["hatchedEgg"]);

    /* Since we didn't actually create a new source file, this would fail.
    await spotCheckMakefile();
    */
  });

  describe("Delete from a quick-start configuration", () => {
    it("works with two projects in place", async () => {
      {
        const config = await writeInitialConfiguration(["crackedEgg", "hatchedEgg"]);
        config.sources.set("chosenKey", new StringSet(["hatchedEgg", "crackedEgg"]));

        await fs.writeFile(
          pathToConfig, JSON.stringify(config) + "\n", { encoding: "utf-8" }
        );
      }

      await setupSharedAndTasks(true);

      inquirer.append([
        ["userSelection", new FakeAnswers("delete")],
        ["ok", new FakeAnswers(true)],
      ]);

      const config = await runWizardAndWrite();
      expect(config.sources.size).toBe(1);
      checkSourceMap(config, "chosenKey", ["hatchedEgg", "crackedEgg"]);

      /* Since we didn't actually create a new source file, this would fail.
      await spotCheckMakefile();
      */
    });

    it("works with three projects in place", async () => {
      {
        const config = await writeInitialConfiguration(["crackedEgg", "hatchedEgg"]);
        config.sources.set("chosenKey", new StringSet(["hatchedEgg"]));
        config.sources.set("otherKey", new StringSet(["crackedEgg"]));

        await fs.writeFile(
          pathToConfig, JSON.stringify(config) + "\n", { encoding: "utf-8" }
        );
      }

      await setupSharedAndTasks(true);

      inquirer.append([
        ["userSelection", new FakeAnswers("delete")],
        [
          "chosenKey",
          new FakeAnswers(
            "hatched",
          )
        ],
        ["ok", new FakeAnswers(true)],
      ]);

      const config = await runWizardAndWrite();
      expect(config.sources.size).toBe(2);
      checkSourceMap(config, "chosenKey", ["hatchedEgg"]);
      checkSourceMap(config, "otherKey", ["crackedEgg"]);

      /* Since we didn't actually create a new source file, this would fail.
      await spotCheckMakefile();
      */
    });
  });
});
