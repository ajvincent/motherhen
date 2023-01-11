export default class StringSet extends Set<string>
{
  toJSON() : string[]
  {
    return Array.from(this.values());
  }

  static isJSON(value: unknown) : value is string[]
  {
    if (!Array.isArray(value))
      return false;
    return value.every(element => typeof element === "string");
  }

  static fromJSON(values: string[]) : StringSet
  {
    return new this(values);
  }
}
