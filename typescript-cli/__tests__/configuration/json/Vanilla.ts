import {
  VanillaJSON,
  type VanillaJSONParsed,
  type VanillaJSONSerialized,
} from "../../../configuration/json/Vanilla";

import PathResolver from "../../../configuration/PathResolver";
import projectRoot from "../../../utilities/projectRoot";

import { forceJSONType } from "../../../configuration/json/JSON_Operations";

forceJSONType<VanillaJSONParsed, VanillaJSONSerialized, true>(VanillaJSON);

describe("VanillaJSON", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "cleanroom/mozilla-unified");

  let vanilla: VanillaJSON;
  beforeEach(() => {
    pathResolver.setPath(false, "cleanroom/mozilla-unified");
    vanilla = new VanillaJSON(pathResolver, "central");
  });

  it("serializes without a path property when the resolver points to the cleanroom", () => {
    expect(vanilla.toJSON()).toEqual({ tag: "central" });
  });

  it("serializes with the user's tag property", () => {
    vanilla.tag = "release";
    expect(vanilla.toJSON()).toEqual({ tag: "release" });
  });

  it("serializes with a path property when the resolver points anywhere else", () => {
    pathResolver.setPath(false, "cleanroom/mozilla-central");
    expect(vanilla.toJSON()).toEqual({
      tag: "central",
      path: "cleanroom/mozilla-central"
    });
  });

  it(".isJSON() returns true for proper values", () => {
    expect(VanillaJSON.isJSON({
      tag: "release"
    })).toBe(true);

    expect(VanillaJSON.isJSON({
      tag: "central",
      path: "cleanroom/mozilla-central"
    })).toBe(true);

    expect(VanillaJSON.isJSON({
      path: "cleanroom/mozilla-central"
    })).toBe(false);
  });

  it(".fromJSON() builds a proper value", () => {
    vanilla = VanillaJSON.fromJSON(
      pathResolver, {
        tag: "release"
      }
    );

    expect(vanilla.path).not.toBe(pathResolver);
    expect(vanilla.path.getPath(false)).toBe("cleanroom/mozilla-unified");
    expect(vanilla.tag).toBe("release");

    vanilla = VanillaJSON.fromJSON(
      pathResolver, {
        tag: "central",
        path: "cleanroom/mozilla-central"
      }
    );

    expect(vanilla.path).not.toBe(pathResolver);
    expect(vanilla.path.getPath(false)).toBe("cleanroom/mozilla-central");
    expect(vanilla.tag).toBe("central");
  });
});
