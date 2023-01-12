import {
  DictionaryBuilder,
  DictionaryResolverBuilder,
} from "#cli/configuration/version-1.0/json/Dictionary";

import {
  NumberWrapper,
  NumberResolver,
} from "./JSON_Operations";

import projectRoot from "#cli/utilities/projectRoot";
import PathResolver from "#cli/configuration/PathResolver";

it("DictionaryBuilder works", () => {
  const NumberDictionary = DictionaryBuilder<
    NumberWrapper, number
  >(NumberWrapper);

  const serialized = {
    "foo": 1,
    "bar": 2
  };

  expect(NumberDictionary.isJSON(serialized)).toBe(true);
  const parsed = NumberDictionary.fromJSON(serialized);

  const foo = parsed.get("foo");
  expect(foo).not.toBe(undefined);
  if (foo) {
    expect(foo.toJSON()).toBe(1);
  }

  const bar = parsed.get("bar");
  expect(bar).not.toBe(undefined);
  if (bar) {
    expect(bar.toJSON()).toBe(2);
  }

  const wop = parsed.get("wop");
  expect(wop).toBe(undefined);

  expect(parsed.toJSON()).toEqual(serialized);
});

it("DictionaryResolverBuilder works", () => {
  const ResolverDictionary = DictionaryResolverBuilder<
    NumberResolver, number
  >(NumberResolver);

  const serialized = {
    "foo": 1,
    "bar": 2
  };
  const pathResolverBase = new PathResolver.UseAbsolute(
    projectRoot, false
  );

  const pathResolver = new PathResolver(pathResolverBase, false, "");

  expect(ResolverDictionary.isJSON(serialized)).toBe(true);
  const parsed = ResolverDictionary.fromJSON(pathResolver, serialized);

  const foo = parsed.get("foo");
  expect(foo).not.toBe(undefined);
  if (foo) {
    expect(foo.toJSON()).toBe(1);
  }

  const bar = parsed.get("bar");
  expect(bar).not.toBe(undefined);
  if (bar) {
    expect(bar.toJSON()).toBe(2);
  }

  const wop = parsed.get("wop");
  expect(wop).toBe(undefined);

  expect(parsed.toJSON()).toEqual(serialized);
});
