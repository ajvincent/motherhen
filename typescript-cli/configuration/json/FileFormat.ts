import type {
  VanillaJSONSerialized,
  VanillaJSON,
} from "./Vanilla";
import {
  DictionaryResolverBuilder,
  type StringIndexed,
} from "./Dictionary";

import { type JSONBase } from "./JSON_Operations";

export type FileFormatSerialized = {
  readonly version: string;
  readonly vanilla: StringIndexed<VanillaJSONSerialized>;
  readonly sources: StringIndexed<string>;
  readonly mozconfigs: StringIndexed<string>;
  readonly patches: StringIndexed<string>;
}

export type FileFormatParsed = {
  readonly version: string;

  readonly vanilla: ReturnType<
    typeof DictionaryResolverBuilder<
      VanillaJSON, VanillaJSONSerialized
    >
  >;

  readonly sources: ReturnType<
    typeof DictionaryResolverBuilder<
      JSONBase<string>, string
    >
  >;

  readonly mozconfigs: ReturnType<
    typeof DictionaryResolverBuilder<
      JSONBase<string>, string
    >
  >;

  readonly patches: ReturnType<
    typeof DictionaryResolverBuilder<
      JSONBase<string>, string
    >
  >;
}
