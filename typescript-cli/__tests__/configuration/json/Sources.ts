import SourcesJSON from "../../../configuration/json/Sources";
import PathResolver from "../../../configuration/PathResolver";
import projectRoot from "../../../utilities/projectRoot";

describe("SourcesJSON", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "");

  let sources: SourcesJSON;
  beforeEach(() => {
    pathResolver.setPath(false, "");
  });

  it("starts out with no source directories if none are passed in", () => {
    sources = new SourcesJSON(pathResolver, new Set);
    expect(sources.toJSON()).toEqual({});
  });

  it(".add() does what it says", () => {
    sources = new SourcesJSON(pathResolver, new Set);
    sources.add("source/foo");

    let result = sources.toJSON();
    expect(result["source/foo"]).toBeInstanceOf(PathResolver);
    expect(result["source/foo"].getPath(false)).toBe("source/foo");
    expect(result["source/foo"]).not.toBe(pathResolver);

    expect(Object.keys(result).length).toBe(1);

    sources.add("source/bar");
    result = sources.toJSON();
    expect(result["source/bar"]).toBeInstanceOf(PathResolver);
    expect(result["source/bar"].getPath(false)).toBe("source/bar");
    expect(result["source/bar"]).not.toBe(pathResolver);
    expect(result["source/bar"]).not.toBe(result["source/foo"]);

    expect(Object.keys(result).length).toBe(2);
  });

  it("can build with multiple initial directories", () => {
    sources = new SourcesJSON(
      pathResolver, new Set(["source/foo", "source/bar"])
    );

    const result = sources.toJSON();
    expect(result["source/foo"]).toBeInstanceOf(PathResolver);
    expect(result["source/foo"].getPath(false)).toBe("source/foo");
    expect(result["source/foo"]).not.toBe(pathResolver);

    expect(result["source/bar"]).toBeInstanceOf(PathResolver);
    expect(result["source/bar"].getPath(false)).toBe("source/bar");
    expect(result["source/bar"]).not.toBe(pathResolver);
    expect(result["source/bar"]).not.toBe(result["source/foo"]);

    expect(Object.keys(result).length).toBe(2);
  });
});
