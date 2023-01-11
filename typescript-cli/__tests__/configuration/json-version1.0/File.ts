import FileJSON, {
  type FileJSONParsed,
  type FileJSONSerialized
} from "../../../configuration/json-version1.0/File";

import PathResolver from "../../../configuration/PathResolver";
import projectRoot from "../../../utilities/projectRoot";

import { forceJSONType } from "../../../configuration/json-version1.0/JSON_Operations";

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
