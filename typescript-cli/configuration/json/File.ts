import PathResolver from "../PathResolver";

export type FileJSONParsed = {
  readonly path: PathResolver;
};

export type FileJSONSerialized = string;

/** A wrapper around PathResolver for JSON parsing and serializing. */
export default class FileJSON implements FileJSONParsed
{
  readonly path: PathResolver;

  constructor(pathToSource: PathResolver) {
    this.path = pathToSource;
  }

  toJSON() : Readonly<FileJSONSerialized>
  {
    return this.path.toJSON();
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is FileJSONSerialized
  {
    return typeof unknownValue === "string";
  }

  static fromJSON(
    pathResolver: PathResolver,
    value: FileJSONSerialized
  ) : FileJSON
  {
    const rv = new FileJSON(pathResolver.clone());
    rv.path.setPath(false, value);
    return rv;
  }
}
