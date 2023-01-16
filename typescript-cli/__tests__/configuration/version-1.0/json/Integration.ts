import IntegrationJSON, {
  type IntegrationJSONParsed,
  type IntegrationJSONSerialized,
} from "#cli/configuration/version-1.0/json/Integration.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import {
  forceJSONType
} from "#cli/configuration/version-1.0/json/JSON_Operations.js";

forceJSONType<
  IntegrationJSONParsed,
  IntegrationJSONSerialized,
  true
>(IntegrationJSON);

describe("IntegrationJSON", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "cleanroom/mozilla-unified");

  let vanillaTag: string;
  let sourceKey: string;
  let patchKey: string;
  let integration: IntegrationJSON;
  beforeEach(() => {
    vanillaTag = "vanillaTag"
    sourceKey = "sources/hatchedEgg";
    patchKey = "hatchedegg-patches";
    pathResolver.setPath(false, "userdir");
  });

  it("works with a constructor", () => {
    integration = new IntegrationJSON(
      vanillaTag, sourceKey, patchKey, pathResolver
    );
    expect(integration.vanillaTag).toBe("vanillaTag");
    expect(integration.sourceKey).toBe(sourceKey);
    expect(integration.patchKey).toBe(patchKey);
    expect(integration.targetDirectory).toBe(pathResolver);

    integration.vanillaTag = "chocolateKey";
    integration.targetDirectory.setPath(false, "myUserDir");

    const result = integration.toJSON();
    expect(result.vanillaTag).toBe("chocolateKey");
    expect(result.sourceKey).toEqual(sourceKey);
    expect(result.patchKey).toEqual(patchKey);
    expect(result.targetDirectory).toBe("myUserDir");
  });

  it("static .isJSON() returns correct results", () => {
    expect(IntegrationJSON.isJSON({
      vanillaTag: "vanillaTag",
      sourceKey: "sources/hatchedEgg",
      patchKey: "hatchedegg-patches",
      targetDirectory: "userDir"
    })).toBe(true);

    expect(IntegrationJSON.isJSON({
      sourceKey: "sources/hatchedEgg",
      patchKey: "hatchedegg-patches",
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaTag: "vanillaTag",
      patchKey: "hatchedegg-patches",
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaTag: "vanillaTag",
      sourceKey: "sources/hatchedEgg",
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaTag: "vanillaTag",
      sourceKey: "sources/hatchedEgg",
      patchKey: "hatchedegg-patches",
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaTag: "vanillaTag",
      sourceKey: "sources/hatchedEgg",
      patchKey: "hatchedegg-patches",
      targetDirectory: "userDir",
      extra: true
    })).toBe(true);

    // array, disallowed
    expect(IntegrationJSON.isJSON([{
      vanillaTag: "vanillaTag",
      sourceKey: "sources/hatchedEgg",
      patchKey: "hatchedegg-patches",
      targetDirectory: "userDir",
    }])).toBe(false);
  });

  it("static .fromJSON() creates integrations with a cloned target", () => {
    integration = IntegrationJSON.fromJSON(pathResolver, {
      vanillaTag,
      sourceKey,
      patchKey,
      targetDirectory: pathResolver.getPath(false)
    });

    expect(integration.vanillaTag).toBe(vanillaTag);
    expect(integration.sourceKey).toBe(sourceKey);
    expect(integration.patchKey).toBe(patchKey);

    expect(integration.targetDirectory).not.toBe(pathResolver);
    expect(
      integration.targetDirectory.getPath(false)
    ).toBe(pathResolver.getPath(false));
  });
});
