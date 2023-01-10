import VanillaJSON from "../../../configuration/json/Vanilla";
import PathResolver from "../../../configuration/PathResolver";
import projectRoot from "../../../utilities/projectRoot";

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

  it("exposes the path resolver", () => {
    expect(vanilla.path).toBe(pathResolver);
  })

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
      path: pathResolver
    });
  });
});
