// #region preamble
import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import ConfigurationSummary, {
  type FirefoxSummary,
  type MotherhenSummary,
} from "#cli/configuration/version-1.0/json/Summary.js";

import PatchesJSON from "#cli/configuration/version-1.0/json/Patches.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration.js";
import ProjectJSON from "#cli/configuration/version-1.0/json/Project.js";
import StringSet from "#cli/configuration/version-1.0/json/StringSet.js";
import FirefoxJSON from "#cli/configuration/version-1.0/json/Firefox.js";
// #endregion preamble

describe("ConfigurationSummary", () => {
  let summary: FirefoxSummary | MotherhenSummary;
  let config: ConfigFileFormat;

  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "");

  beforeEach(() => {
    pathResolver.setPath(false, "");
    config = ConfigFileFormat.fromJSON(pathResolver, ConfigFileFormat.blank());
  });

  it("extracts Firefox summaries", () => {
    config.firefoxes.set(
      "opt",
      FirefoxJSON.fromJSON(pathResolver, {
        "vanillaTag": "release",
        "buildType": "optimized",
        "targetDirectory": "test/firefox-targets",
      })
    );

    pathResolver.setPath(false, "test/firefox-targets");

    summary = ConfigurationSummary(config, "opt", true);
    expect(summary).toEqual({
      isComplete: true,
      isFirefox: true,
      targetDirectory: pathResolver.getPath(true),
      vanillaTag: "release",
      buildType: "optimized"
    });
  });

  it("reports a missing Firefox summary", () => {
    summary = ConfigurationSummary(config, "opt", true, true);
    expect(summary).toEqual({
      isComplete: false,
      isFirefox: true,
    });
  });

  describe("with project configurations", () => {
    beforeEach(() => {
      config.sources.set(
        "hatchedEgg", StringSet.fromJSON([
          "sources/hatchedEgg",
          "sources/crackedEgg",
        ])
      );
      config.sources.set(
        "crackedEgg", StringSet.fromJSON(["sources/crackedEgg"])
      );
  
      config.patches.set(
        "xpath-functions",
        PatchesJSON.fromJSON({
          globs: ["patches/xpath-functions.diff"],
          commitMode: "none",
          commitMessage: null,
        })
      );
  
      config.mozconfigs.set("debug", "debug.mozconfig");

      config.integrations.set(
        "central",
        IntegrationJSON.fromJSON(pathResolver, {
          vanillaTag: "central",
          sourceKey: "hatchedEgg",
          patchKey: "xpath-functions",
          targetDirectory: "../compiles/central"
        })
      );
  
      config.integrations.set(
        "beta",
        IntegrationJSON.fromJSON(pathResolver, {
          vanillaTag: "beta",
          sourceKey: "crackedEgg",
          patchKey: "patches",
          targetDirectory: "../compiles/beta"
        })
      );
  
      config.projects.set(
        "hatchedEgg-central-debug",
        ProjectJSON.fromJSON({
          integrationKey: "central",
          mozconfigKey: "debug",
          appDir: "sources/hatchedEgg"
        })
      );
  
      config.projects.set(
        "hatchedEgg-beta-debug",
        ProjectJSON.fromJSON({
          integrationKey: "beta",
          mozconfigKey: "debug",
          appDir: "sources/hatchedEgg"
        })
      );
    });

    beforeEach(() => {
      pathResolver.setPath(false, "../compiles/central");
    });

    it("works when the configuration is complete", () => {
      summary = ConfigurationSummary(config, "hatchedEgg-central-debug", false);

      expect(summary).toEqual({
        isComplete: true,
        isFirefox: false,

        targetDirectory: pathResolver.getPath(true),
        vanillaTag: "central",

        applicationDirectory: "sources/hatchedEgg",
        otherSourceDirectories: [
          "sources/crackedEgg"
        ],
        patches: {
          globs: ["patches/xpath-functions.diff"],
          commitMode: "none",
          commitMessage: null,
        },
        mozconfig: "debug.mozconfig",
      });
    });

    describe("reports partial results for a missing", () => {
      function getSummary() : void
      {
        summary = ConfigurationSummary(
          config,
          "hatchedEgg-central-debug",
          false,
          true
        );
      }

      it("project", () => {
        config.projects.delete("hatchedEgg-central-debug");
        getSummary();

        expect(summary).toEqual({
          isComplete: false,
          isFirefox: false,
        });
      });

      it("integration", () => {
        config.integrations.delete("central");
        getSummary();

        expect(summary).toEqual({
          isComplete: false,
          isFirefox: false,

          applicationDirectory: "sources/hatchedEgg",
          mozconfig: "debug.mozconfig",
        });
      });

      it("mozconfig", () => {
        config.mozconfigs.delete("debug");
        getSummary();

        expect(summary).toEqual({
          isComplete: false,
          isFirefox: false,
  
          targetDirectory: pathResolver.getPath(true),
          vanillaTag: "central",

          applicationDirectory: "sources/hatchedEgg",
          otherSourceDirectories: [
            "sources/crackedEgg"
          ],
          patches: {
            globs: ["patches/xpath-functions.diff"],
            commitMode: "none",
            commitMessage: null,
          },
        });
      });

      it("source key", () => {
        config.sources.delete("hatchedEgg");
        getSummary();

        expect(summary).toEqual({
          isComplete: false,
          isFirefox: false,

          targetDirectory: pathResolver.getPath(true),
          vanillaTag: "central",

          applicationDirectory: "sources/hatchedEgg",
          mozconfig: "debug.mozconfig",
          patches: {
            globs: ["patches/xpath-functions.diff"],
            commitMode: "none",
            commitMessage: null,
          },
        });
      });

      it("patch key", () => {
        config.patches.delete("xpath-functions");
        getSummary();

        expect(summary).toEqual({
          isComplete: false,
          isFirefox: false,

          targetDirectory: pathResolver.getPath(true),
          vanillaTag: "central",

          applicationDirectory: "sources/hatchedEgg",
          otherSourceDirectories: [
            "sources/crackedEgg"
          ],
          mozconfig: "debug.mozconfig",
        });
      });
    })
  });
});
