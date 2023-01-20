import StringMap, {
  type StringDictionary,
} from "#cli/configuration/version-1.0/json/StringMap.js";

import { forceJSONType } from "#cli/configuration/version-1.0/json/JSON_Operations.js";
forceJSONType<Map<string, string>, StringDictionary, false>(StringMap);

it("StringMap works", () => {
  const items = {
    "foo": "one",
    "bar": "two",
  };
  const s1 = StringMap.fromJSON(items);
  expect(s1.get("foo")).toBe("one");
  expect(s1.get("bar")).toBe("two");
  expect(s1.size).toBe(2);
  expect(s1.toJSON()).toEqual(items);

  expect(StringMap.isJSON(items)).toBe(true);
  expect(StringMap.isJSON([])).toBe(false);
  expect(StringMap.isJSON(12)).toBe(false);
  expect(StringMap.isJSON(null)).toBe(false);
  expect(StringMap.isJSON({})).toBe(true);
});
