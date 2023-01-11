import PathResolver from "../PathResolver";

export interface JSONBase<Serialized>
{
  /**
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#tojson_behavior}
   */
  toJSON(): Serialized;
}

export type JSONBase_Static<
  Parsed,
  Serialized,
  UseResolver extends boolean
> = {
  isJSON(value: unknown) : value is Serialized;

  fromJSON: UseResolver extends true ?
    (pathResolver: PathResolver, value: Serialized) => Parsed :
    (value: Serialized) => Parsed;

  readonly prototype: JSONBase<Serialized>;
}

/** @internal */
export function forceJSONType<
  Parsed, Serialized, UseResolver extends boolean
>
(
  value: JSONBase_Static<Parsed, Serialized, UseResolver>
) : void
{
  void(value);
}

export function isJSONObject(unknownValue: unknown) : unknownValue is object
{
  if (
    (Object(unknownValue) !== unknownValue) ||
    !unknownValue ||
    Array.isArray(unknownValue)
  )
    return false;
  return true;
}
