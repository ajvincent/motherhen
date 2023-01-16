import ConfigFileFormat, {
  type ConfigFileFormatParsed,
  type ConfigFileFormatSerialized,
} from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import { forceJSONType } from "#cli/configuration/version-1.0/json/JSON_Operations.js";
import FileJSON from "#cli/configuration/version-1.0/json/File.js";
import PatchesJSON from "#cli/configuration/version-1.0/json/Patches.js";
import IntegrationJSON from "#cli/configuration/version-1.0/json/Integration.js";
import ProjectJSON from "#cli/configuration/version-1.0/json/Project.js";
import StringSet from "#cli/configuration/version-1.0/json/StringSet.js";
import FirefoxJSON from "#cli/configuration/version-1.0/json/Firefox.js";

forceJSONType<
  ConfigFileFormatParsed,
  ConfigFileFormatSerialized,
  true
>(ConfigFileFormat);

describe("ConfigFileFormat (version 1.0.0)", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "");

  let config: ConfigFileFormat;
  beforeEach(() => {
    pathResolver.setPath(false, "");
  });

  it("static .fromJSON() can build with a blank configuration", () => {
    config = ConfigFileFormat.fromJSON(
      pathResolver,
      ConfigFileFormat.blank()
    );

    expect(config.sources.size).toBe(0);
    expect(config.patches.size).toBe(0);
    expect(config.mozconfigs.size).toBe(0);
    expect(config.integrations.size).toBe(0);
    expect(config.projects.size).toBe(0);
    expect(config.firefoxes.size).toBe(0);

    expect(config.toJSON()).toEqual(ConfigFileFormat.blank());
  });

  function buildWithoutProperty(
    key: keyof ConfigFileFormatSerialized
  ) : Partial<ConfigFileFormatSerialized>
  {
    const serialized: Partial<ConfigFileFormatSerialized> = ConfigFileFormat.blank();
    delete serialized[key];
    return serialized;
  }

  it(".isJSON() returns true only if all fields are present", () => {
    expect(ConfigFileFormat.isJSON(ConfigFileFormat.blank())).toBe(true);

    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("formatVersion")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("sources")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("patches")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("mozconfigs")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("integrations")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("projects")
    )).toBe(false);
    expect(ConfigFileFormat.isJSON(
      buildWithoutProperty("firefoxes")
    )).toBe(false);

    // array, disallowed
    expect(ConfigFileFormat.isJSON([ConfigFileFormat.blank()])).toBe(false);
  });

  it(".toJSON() returns full results", () => {
    config = ConfigFileFormat.fromJSON(
      pathResolver,
      ConfigFileFormat.blank()
    );

    pathResolver.setPath(false, "cleanroom/mozilla-unified");

    config.sources.set(
      "hatchedEgg", StringSet.fromJSON(["sources/hatchedEgg"])
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

    config.mozconfigs.set(
      "debug", FileJSON.fromJSON(
        pathResolver, "cleanroom/mozconfigs/debug.mozconfig"
      )
    );

    config.integrations.set(
      "central",
      IntegrationJSON.fromJSON(pathResolver, {
        vanillaTag: "central",
        sourceKey: "hatchedEgg",
        patchKey: "patches",
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
        appDir: "hatchedEgg"
      })
    );

    config.projects.set(
      "hatchedEgg-beta-debug",
      ProjectJSON.fromJSON({
        integrationKey: "beta",
        mozconfigKey: "debug",
        appDir: "hatchedEgg"
      })
    );

    config.firefoxes.set(
      "optimized",
      FirefoxJSON.fromJSON(pathResolver, {
        "vanillaTag": "release",
        "buildType": "optimized",
        "targetDirectory": "test/firefox-targets",
      })
    );

    const serialized = buildSerializedRef();
    expect(config.toJSON()).toEqual(serialized);
  });

  it("static .fromJSON() can build with a complex JSON structure", () => {
    const reference = buildSerializedRef();
    config = ConfigFileFormat.fromJSON(pathResolver, reference);
    const actual = config.toJSON();

    expect(actual).toEqual(buildSerializedRef());
  });
});

function buildSerializedRef() : ConfigFileFormatSerialized
{
  return {
    "formatVersion": "1.0.0",

    "sources": {
      "hatchedEgg": ["sources/hatchedEgg"],
      "crackedEgg": ["sources/crackedEgg"],
    },

    "patches": {
      "xpath-functions": {
        globs: ["patches/xpath-functions.diff"],
        commitMode: "none",
        commitMessage: null,
      },
    },

    "mozconfigs": {
      "debug": "cleanroom/mozconfigs/debug.mozconfig"
    },

    "integrations": {
      "central": {
        "vanillaTag": "central",
        "sourceKey": "hatchedEgg",
        "patchKey": "patches",
        "targetDirectory": "../compiles/central",
      },

      "beta": {
        "vanillaTag": "beta",
        "sourceKey": "crackedEgg",
        "patchKey": "patches",
        "targetDirectory": "../compiles/beta",
      }
    },

    "projects": {
      "hatchedEgg-central-debug": {
        "integrationKey": "central",
        "mozconfigKey": "debug",
        "appDir": "hatchedEgg"
      },

      "hatchedEgg-beta-debug": {
        "integrationKey": "beta",
        "mozconfigKey": "debug",
        "appDir": "hatchedEgg"
      },
    },

    "firefoxes": {
      "optimized": {
        "vanillaTag": "release",
        "buildType": "optimized",
        "targetDirectory": "test/firefox-targets",
      }
    }
  };
}
