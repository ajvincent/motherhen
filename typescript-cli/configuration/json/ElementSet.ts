import PathResolver from "../PathResolver";
import {
  type JSONBase,
  type JSONBase_Static,
} from "./JSON_Operations";

/**
 * Build an element set class for JSON support without a PathResolver.
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns an ElementSet class.
 */
export function ElementSetBuilder<
  Parsed extends JSONBase<Serialized>, Serialized
>
(
  BaseClass: JSONBase_Static<Parsed, Serialized, false>
)
: JSONBase_Static<
    ElementSetBase<Parsed, Serialized>,
    Serialized[],
    false
  >
{
  return class ElementSet extends ElementSetBase<Parsed, Serialized>
  {
    static isJSON(value: unknown) : value is Serialized[]
    {
      if (!Array.isArray(value))
        return false;
      return value.every(element => BaseClass.isJSON(element));
    }

    static fromJSON(value: Serialized[]) : ElementSet
    {
      return new this(
        value.map(element => BaseClass.fromJSON(element))
      );
    }
  }
}

/**
 * Build an element set class for JSON support with a PathResolver.
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns an ElementSet class.
 */
export function ElementSetResolverBuilder<
  Parsed extends JSONBase<Serialized>, Serialized
>
(
  BaseClass: JSONBase_Static<Parsed, Serialized, true>
)
: JSONBase_Static<
    ElementSetBase<Parsed, Serialized>,
    Serialized[],
    true
  >
{
  return class ElementSet extends ElementSetBase<Parsed, Serialized>
  {
    static isJSON(value: unknown) : value is Serialized[]
    {
      if (!Array.isArray(value))
        return false;
      return value.every(element => BaseClass.isJSON(element));
    }

    static fromJSON(pathResolver: PathResolver, value: Serialized[]) : ElementSet
    {
      return new this(
        value.map(element => BaseClass.fromJSON(pathResolver, element))
      );
    }
  }
}

/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 */
class ElementSetBase<
  Parsed extends JSONBase<Serialized>,
  Serialized,
>
extends Set<Parsed>
implements JSONBase<Serialized[]>
{
  toJSON() : Serialized[]
  {
    return Array.from(this.values()).map(value => value.toJSON());
  }
}
