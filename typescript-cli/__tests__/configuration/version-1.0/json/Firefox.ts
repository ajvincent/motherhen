import FirefoxJSON, {
  type FirefoxJSONParsed,
  type FirefoxJSONSerialized,
} from "#cli/configuration/version-1.0/json/Firefox.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import {
  forceJSONType
} from "#cli/configuration/version-1.0/json/JSON_Operations.js";

forceJSONType<
  FirefoxJSONParsed,
  FirefoxJSONSerialized,
  true
>(FirefoxJSON);

describe("FirefoxJSON", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "cleanroom/mozilla-unified");

  let vanillaTag: string;
  let buildType: FirefoxJSONSerialized["buildType"];
  const targetDirectory = "test/firefox-target";
  let firefoxConfig: FirefoxJSON;

  beforeEach(() => {
    vanillaTag = "release";
    buildType = "optimized";
    pathResolver.setPath(false, "cleanroom/mozilla-unified");
  });

  it("static .isJSON() returns correct results", () => {
    expect(FirefoxJSON.isJSON({
      vanillaTag,
      buildType,
      targetDirectory
    })).toBe(true);

    expect(FirefoxJSON.isJSON({
      buildType,
      targetDirectory
    })).toBe(false);

    expect(FirefoxJSON.isJSON({
      vanillaTag,
      targetDirectory
    })).toBe(false);

    expect(FirefoxJSON.isJSON({
      vanillaTag,
      buildType,
    })).toBe(false);

    // array, disallowed
    expect(FirefoxJSON.isJSON([{
      vanillaTag,
      buildType,
      targetDirectory
    }])).toBe(false);
  });

  it("static .fromJSON() creates projects with a cloned target", () => {
    firefoxConfig = FirefoxJSON.fromJSON(pathResolver, {
      vanillaTag,
      buildType,
      targetDirectory
    });

    expect(firefoxConfig.vanillaTag).toBe(vanillaTag);
    expect(firefoxConfig.buildType).toBe(buildType);
    expect(
      firefoxConfig.targetDirectory.getPath(false)
    ).toBe(targetDirectory);

    expect(pathResolver.getPath(false)).toBe("cleanroom/mozilla-unified")
  });

  it(".toJSON() returns the right serialized results", () => {
    firefoxConfig = FirefoxJSON.fromJSON(pathResolver, {
      vanillaTag,
      buildType,
      targetDirectory
    });

    expect(firefoxConfig.toJSON()).toEqual({
      vanillaTag,
      buildType,
      targetDirectory
    });
  });
});
