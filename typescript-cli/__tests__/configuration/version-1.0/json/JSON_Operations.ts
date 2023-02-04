import {
  type JSONBase,
  forceJSONType
} from "#cli/configuration/version-1.0/json/JSON_Operations.js";
import PathResolver from "#cli/configuration/PathResolver.js";

export type WrappedNumber = {
  value: number;
}

export class NumberWrapper implements JSONBase<number>
{
  #value: number;
  constructor(value: number) {
    this.#value = value;
  }

  static isJSON(value: unknown) : value is number
  {
    return typeof value === "number";
  }

  static fromJSON(value: number) : NumberWrapper
  {
    return new NumberWrapper(value);
  }

  toJSON() : number {
    return this.#value;
  }
}

export class NumberResolver implements JSONBase<number>
{
  #value: number;
  constructor(value: number) {
    this.#value = value;
  }

  static isJSON(value: unknown) : value is number
  {
    return typeof value === "number";
  }

  static fromJSON(pathResolver: PathResolver, value: number) : NumberResolver
  {
    void(pathResolver);
    return new NumberResolver(value);
  }

  toJSON() : number {
    return this.#value;
  }
}

it("JSON_Operations type works", () => {
  forceJSONType<NumberWrapper, number, false>(NumberWrapper);
  forceJSONType<NumberResolver, number, true>(NumberResolver);
});
