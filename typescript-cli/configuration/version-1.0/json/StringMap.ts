import { isJSONObject } from "./JSON_Operations.js";

export type StringDictionary = {
  [key: string] : string
}

export default class StringMap extends Map<string, string>
{
  toJSON() : StringDictionary
  {
    return Object.fromEntries(this.entries());
  }

  static isJSON(value: unknown) : value is StringDictionary
  {
    if (!isJSONObject(value))
      return false;

    if (Object.getOwnPropertySymbols(value).length)
      return false;

    return Object.entries(value).every(([key, value]) => {
      return (typeof key === "string") && (typeof value === "string")
    });
  }

  static fromJSON(value: StringDictionary) : StringMap
  {
    return new this(Object.entries(value));
  }
}
