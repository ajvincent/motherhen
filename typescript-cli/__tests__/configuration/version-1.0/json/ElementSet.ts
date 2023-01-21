import {
  ElementSetBuilder,
  ElementSetResolverBuilder
} from "#cli/configuration/version-1.0/json/ElementSet.js";

import {
  NumberWrapper,
  NumberResolver,
} from "./JSON_Operations.js";

import projectRoot from "#cli/utilities/projectRoot.js";
import PathResolver from "#cli/configuration/PathResolver.js";

it("ElementSetBuilder works", () => {
  const NumberSet = ElementSetBuilder<
    NumberWrapper, number
  >(NumberWrapper);

  const serialized = [1, 2, 3];
  expect(NumberSet.isJSON(serialized)).toBe(true);
  const parsed = NumberSet.fromJSON(serialized);

  const values = Array.from(parsed.values());
  expect(values.length).toBe(3);
  expect(values[0].toJSON()).toBe(1);
  expect(values[1].toJSON()).toBe(2);
  expect(values[2].toJSON()).toBe(3);

  expect(parsed.toJSON()).toEqual(serialized);
});

it("ElementSetResolverBuilder works", () => {
  const NumberSet = ElementSetResolverBuilder<
    NumberResolver, number
  >(NumberResolver);

  const serialized = [1, 2, 3];

  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "");

  expect(NumberSet.isJSON(serialized)).toBe(true);
  const parsed = NumberSet.fromJSON(pathResolver, serialized);

  const values = Array.from(parsed.values());
  expect(values.length).toBe(3);
  expect(values[0].toJSON()).toBe(1);
  expect(values[1].toJSON()).toBe(2);
  expect(values[2].toJSON()).toBe(3);

  expect(parsed.toJSON()).toEqual(serialized);
});