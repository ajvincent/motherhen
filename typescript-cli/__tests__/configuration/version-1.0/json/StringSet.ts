import StringSet from "../../../../configuration/version-1.0/json/StringSet";

import { forceJSONType } from "../../../../configuration/version-1.0/json/JSON_Operations";
forceJSONType<Set<string>, string[], false>(StringSet);

it("StringSet works", () => {
  const items = ["foo", "bar"];
  const s1 = new StringSet(items);
  expect(s1.has("foo")).toBe(true);
  expect(s1.toJSON()).toEqual(items);

  expect(StringSet.isJSON(items)).toBe(true);
  expect(StringSet.isJSON([])).toBe(true);
  expect(StringSet.isJSON({})).toBe(false);

  const s2 = StringSet.fromJSON(items);
  expect(s2.size).toBe(2);
  expect(s2.has("foo")).toBe(true);
  expect(s2.has("bar")).toBe(true);
});
