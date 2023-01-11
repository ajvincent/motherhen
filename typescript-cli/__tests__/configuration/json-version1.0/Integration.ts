import IntegrationJSON, {
  type IntegrationJSONParsed,
  type IntegrationJSONSerialized,
} from "../../../configuration/json-version1.0/Integration";

import PathResolver from "../../../configuration/PathResolver";
import projectRoot from "../../../utilities/projectRoot";

import { forceJSONType } from "../../../configuration/json-version1.0/JSON_Operations";
import StringSet from "../../../configuration/json-version1.0/StringSet";

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

  let vanillaKey: string;
  const sourceKeys = new StringSet;
  const patchKeys = new StringSet;
  let integration: IntegrationJSON;
  beforeEach(() => {
    vanillaKey = "vanillaKey"
    sourceKeys.clear();
    patchKeys.clear();
    pathResolver.setPath(false, "userdir");
  });

  it("works with a constructor", () => {
    integration = new IntegrationJSON(
      vanillaKey, sourceKeys, patchKeys, pathResolver
    );
    expect(integration.vanillaKey).toBe("vanillaKey");
    expect(integration.sourceKeys).toBe(sourceKeys);
    expect(integration.patchKeys).toBe(patchKeys);
    expect(integration.targetDirectory).toBe(pathResolver);

    integration.vanillaKey = "chocolateKey";

    integration.sourceKeys.add("foo");
    integration.sourceKeys.add("bar");

    integration.patchKeys.add("patch0");
    integration.patchKeys.add("patch_01");

    integration.targetDirectory.setPath(false, "myUserDir");

    const result = integration.toJSON();
    expect(result.vanillaKey).toBe("chocolateKey");
    expect(result.sourceKeys).toEqual(["foo", "bar"]);
    expect(result.patchKeys).toEqual(["patch0", "patch_01"]);
    expect(result.targetDirectory).toBe("myUserDir");
  });

  it("static .isJSON() returns correct results", () => {
    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir"
    })).toBe(true);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: [],
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir"
    })).toBe(true);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: [],
      targetDirectory: "userDir"
    })).toBe(true);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "",
      sourceKeys: [],
      patchKeys: [],
      targetDirectory: ""
    })).toBe(true);

    expect(IntegrationJSON.isJSON({
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      targetDirectory: "userDir"
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0", "patch_01"],
    })).toBe(false);

    expect(IntegrationJSON.isJSON({
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir",
      extra: true
    })).toBe(true);

    // array, disallowed
    expect(IntegrationJSON.isJSON([{
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0", "patch_01"],
      targetDirectory: "userDir",
    }])).toBe(false);
  });

  it("static .fromJSON() creates integrations with a cloned target", () => {
    integration = IntegrationJSON.fromJSON(pathResolver, {
      vanillaKey: "vanillaKey",
      sourceKeys: ["foo", "bar"],
      patchKeys: ["patch0"],
      targetDirectory: pathResolver.getPath(false)
    });

    expect(integration.vanillaKey).toBe("vanillaKey");

    expect(integration.sourceKeys.size).toBe(2);
    expect(integration.sourceKeys.has("foo")).toBe(true);
    expect(integration.sourceKeys.has("bar")).toBe(true);

    expect(integration.patchKeys.size).toBe(1);
    expect(integration.patchKeys.has("patch0")).toBe(true);

    expect(integration.targetDirectory).not.toBe(pathResolver);
    expect(
      integration.targetDirectory.getPath(false)
    ).toBe(pathResolver.getPath(false));
  });
});
