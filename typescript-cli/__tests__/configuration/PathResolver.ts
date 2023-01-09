import path from "path";

import projectRoot from "../../commands/tools/projectRoot";
import { PathResolver } from "../../configuration/PathResolver";

describe("PathResolver", () => {
  const useAbsoluteProperty = new PathResolver.UseAbsolute;
  let resolver: PathResolver;

  const fooPath = "__tests__/foo";
  const barPath = "../__elsewhere__/bar";

  beforeEach(() => {
    useAbsoluteProperty.useAbsolute = false;
    resolver = new PathResolver(
      projectRoot,
      fooPath,
      useAbsoluteProperty
    );
  });

  it(".getPath(false) returns a relative path", () => {
    expect(resolver.getPath(false)).toBe(fooPath);
  });

  it(".getPath(true) returns an absolute path", () => {
    expect(resolver.getPath(true)).toBe(path.join(projectRoot, fooPath));
  });

  it(".setPath(false, barPath) updates the path as a relative value", () => {
    resolver.setPath(false, barPath);
    expect(resolver.getPath(false)).toBe(barPath);
  });

  it(".setPath(true, barPath) updates the path as an absolute value", () => {
    const targetPath = path.normalize(path.join(projectRoot, barPath));
    resolver.setPath(true, targetPath);
    expect(resolver.getPath(false)).toBe(barPath);
  });

  it(".toJSON() respects the useAbsolute property", () => {
    useAbsoluteProperty.useAbsolute = false;
    const asRelativePath = resolver.toJSON();

    useAbsoluteProperty.useAbsolute = true;
    const asAbsolutePath = resolver.toJSON();

    expect(asRelativePath).toBe(fooPath);
    expect(asAbsolutePath).toBe(path.join(projectRoot, fooPath));
  });

  it("static stringify overrides the useAbsolute property temporarily", () => {
    const value = { myPath: resolver };

    const relativeResolved = JSON.stringify({
      myPath: fooPath
    });
    const absoluteResolved = JSON.stringify({
      myPath: path.join(projectRoot, fooPath)
    });

    useAbsoluteProperty.useAbsolute = false;

    expect(
      PathResolver.stringify(useAbsoluteProperty, false, value)
    ).toBe(relativeResolved);
    expect(useAbsoluteProperty.useAbsolute).toBe(false);

    expect(
      PathResolver.stringify(useAbsoluteProperty, true, value)
    ).toBe(absoluteResolved);
    expect(useAbsoluteProperty.useAbsolute).toBe(false);

    useAbsoluteProperty.useAbsolute = true;

    expect(
      PathResolver.stringify(useAbsoluteProperty, false, value)
    ).toBe(relativeResolved);
    expect(useAbsoluteProperty.useAbsolute).toBe(true);

    expect(
      PathResolver.stringify(useAbsoluteProperty, true, value)
    ).toBe(absoluteResolved);
    expect(useAbsoluteProperty.useAbsolute).toBe(true);
  });
});
