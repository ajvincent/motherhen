import FileJSON, {
  type FileJSONParsed,
  type FileJSONSerialized
} from "#cli/configuration/version-1.0/json/File.js";

import PathResolver from "#cli/configuration/PathResolver.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import { forceJSONType } from "#cli/configuration/version-1.0/json/JSON_Operations.js";

forceJSONType<FileJSONParsed, FileJSONSerialized, true>(FileJSON);

describe("FileJSON", () => {
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "cleanroom/source");

  let source: FileJSON;
  beforeEach(() => {
    pathResolver.setPath(false, "cleanroom/source");
    source = new FileJSON(pathResolver);
  });

  it(".toJSON() returns the path resolver's value", () => {
    expect(source.toJSON()).toBe("cleanroom/source");
  });

  it("can override the return value of .toJSON() by setting a path", () => {
    source.path.setPath(false, "dirtyRoom/mySource");
    expect(source.toJSON()).toBe("dirtyRoom/mySource");
  });

  it("static .isJSON() returns true for strings", () => {
    expect(FileJSON.isJSON("foo")).toBe(true);
    expect(FileJSON.isJSON(FileJSON)).toBe(false);
  });

  it("static .fromJSON() returns a new SourceJSON", () => {
    source = FileJSON.fromJSON(pathResolver, "dirtyRoom/mySource");
    expect(source.path).not.toBe(pathResolver);
    expect(source.toJSON()).toBe("dirtyRoom/mySource");
  });
});
