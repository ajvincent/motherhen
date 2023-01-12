import PathResolver from "../../PathResolver";
import {
  isJSONObject,
  type JSONBase,
  type JSONBase_Static,
} from "./JSON_Operations";

// #region Dictionaries without PathResolver

/**
 * Build a dictionary class for JSON support.
 *
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns a Dictionary class.
 */
export function DictionaryBuilder<
  Parsed extends JSONBase<Serialized>, Serialized
>
(
  BaseClass: JSONBase_Static<Parsed, Serialized, false>
)
: JSONBase_Static<
    DictionaryMap<Parsed, Serialized>,
    StringIndexed<Serialized>,
    false
  >
{
  return class Dictionary extends DictionaryMap<Parsed, Serialized>
  {
    static isJSON(value: unknown) : value is StringIndexed<Serialized>
    {
      return isJSONDictionary<Serialized>(
        value, element => BaseClass.isJSON(element)
      );
    }

    static fromJSON(value: StringIndexed<Serialized>) : Dictionary
    {
      return new this(
        entriesFromDictionary<Parsed, Serialized>(value, BaseClass)
      );
    }
  };
}

/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param value - a dictionary of serialized members.
 * @param elementBase - the base class.
 * @returns a list of dictionary entries for the parsed dictionary to build.
 */
function entriesFromDictionary<Parsed, Serialized>
(
  value: StringIndexed<Serialized>,
  elementBase: JSONBase_Static<Parsed, Serialized, false>,
) : [string, Parsed][]
{
  return Object.entries(value).map(
    ([key, value]) => [key, elementBase.fromJSON(value)]
  );
}

// #endregion Dictionaries without PathResolver

// #region Dictionaries with PathResolver

/**
 * Build a dictionary class for JSON support.
 *
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns a Dictionary class.
 */
export function DictionaryResolverBuilder<
  Parsed extends JSONBase<Serialized>, Serialized
>(
  BaseClass: JSONBase_Static<Parsed, Serialized, true>
)
: JSONBase_Static<
    DictionaryMap<Parsed, Serialized>,
    StringIndexed<Serialized>,
    true
  >
{
  return class Dictionary extends DictionaryMap<Parsed, Serialized>
  {
    static isJSON(value: unknown) : value is StringIndexed<Serialized>
    {
      return isJSONDictionary<Serialized>(
        value, element => BaseClass.isJSON(element)
      );
    }

    static fromJSON(pathResolver: PathResolver, value: StringIndexed<Serialized>) : Dictionary
    {
      return new this(
        entriesFromDictionaryResolver<Parsed, Serialized>(value, pathResolver, BaseClass)
      );
    }
  };
}

/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param value - a dictionary of serialized members.
 * @param pathResolver - the path resolver to pass in to the base class.
 * @param elementBase - the base class.
 * @returns a list of dictionary entries for the parsed dictionary to build.
 */
function entriesFromDictionaryResolver<Parsed, Serialized>
(
  value: StringIndexed<Serialized>,
  pathResolver: PathResolver,
  elementBase: JSONBase_Static<Parsed, Serialized, true>,
) : [string, Parsed][]
{
  return Object.entries(value).map(
    ([key, value]) => [key, elementBase.fromJSON(pathResolver, value)]
  );
}

// #endregion Dictionaries with PathResolver

// #region shared code
export type StringIndexed<Element> = {
  [key: string]: Element
};

/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 */
export class DictionaryMap<
  Parsed extends JSONBase<Serialized>,
  Serialized,
>
extends Map<string, Parsed>
implements JSONBase<StringIndexed<Serialized>>
{
  toJSON() : StringIndexed<Serialized>
  {
    const result: StringIndexed<Serialized> = {};
    this.forEach(
      (parsedValue, key) => result[key] = parsedValue.toJSON()
    );
    return result;
  }
}

/**
 * @typeParam Serialized - the serialized object type.
 * @param unknownValue - the value to check.
 * @param elementChecker - a callback to establish member types.
 * @returns true if we have a JSON dictionary of Serialized values.
 */
function isJSONDictionary<Serialized>(
  unknownValue: unknown,
  elementChecker: (element: unknown) => boolean,
) : unknownValue is StringIndexed<Serialized>
{
  if (!isJSONObject(unknownValue))
    return false;

  const entries = Object.entries(unknownValue);
  return entries.every(
    ([key, property]) => isElement(key, property, elementChecker)
  );
}

/**
 * @param key - the potential key
 * @param property - the potential property
 * @param elementChecker - a callback to establish if the property matches the type.
 * @returns true if we have an element of a dictionary.
 */
function isElement(
  key: unknown,
  property: unknown,
  elementChecker: (element: unknown) => boolean
) : boolean
{
  return (typeof key === "string") && elementChecker(property);
}
// #endregion shared code
