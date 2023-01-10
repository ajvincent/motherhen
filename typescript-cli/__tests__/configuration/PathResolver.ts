import path from "path";

import projectRoot from "../../utilities/projectRoot";
import PathResolver from "../../configuration/PathResolver";

describe("PathResolver", () => {
  const useAbsoluteProperty = new PathResolver.UseAbsolute(projectRoot, false);
  let resolver: PathResolver;

  const fooPath = "__tests__/foo";
  const barPath = "../__elsewhere__/bar";

  describe("with an initial relative path", () => {
    beforeEach(() => {
      useAbsoluteProperty.useAbsolute = false;
      resolver = new PathResolver(
        useAbsoluteProperty,
        false,
        fooPath,
      );
    });

    addSpecs();
  });

  describe("with an initial absolute path", () => {
    beforeEach(() => {
      useAbsoluteProperty.useAbsolute = false;
      resolver = new PathResolver(
        useAbsoluteProperty,
        true,
        path.join(projectRoot, fooPath),
      );
    });

    addSpecs();
  });

  function addSpecs() : void {
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

    it(".setPath(false, '') results in the base path", () => {
      resolver.setPath(false, "");
      expect(resolver.getPath(false)).toBe("");
      expect(resolver.getPath(true)).toBe(projectRoot);
    });

    it(".clone() results in an equivalent resolver", () => {
      resolver.setPath(false, barPath);
      const copy = resolver.clone();

      expect(copy.getPath(false)).toBe(barPath);
      resolver.setPath(false, "go/someplace/else");
      expect(copy.getPath(false)).toBe(barPath);
    });

    it(".setPath(true, barPath) updates the path as an absolute value", () => {
      const targetPath = path.normalize(path.join(projectRoot, barPath));
      resolver.setPath(true, targetPath);
      expect(resolver.getPath(false)).toBe(barPath);
    });

    it(`.isInBase(false, "foo") returns true`, () => {
      expect(resolver.isInBase(false, "foo")).toBe(true);
    });

    it(`.isInBase(false, "") returns true`, () => {
      expect(resolver.isInBase(false, "")).toBe(true);
    });

    it(`.isInBase(false, barPath) returns false`, () => {
      expect(resolver.isInBase(false, barPath)).toBe(false);
    });

    it(`.isInBase(true, absolute path to fooPath/foo) returns true`, () => {
      expect(resolver.isInBase(true, path.join(projectRoot, fooPath, "foo"))).toBe(true);
    });

    it(`.isInBase(true, absolute path to fooPath) returns true`, () => {
      expect(resolver.isInBase(true, path.join(projectRoot, fooPath))).toBe(true);
    });

    it(`.isInBase(true, absolute path to barPath) returns false`, () => {
      expect(resolver.isInBase(true, path.join(projectRoot, barPath))).toBe(false);
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
  }
});
