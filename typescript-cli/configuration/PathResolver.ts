import path from "path";

/** A shared serialization flag class. */
class SerializeAbsoluteProperty {
  /** True if the serialization should use absolute paths. */
  useAbsolute = false;
}

/**
 * This class exists to handle path resolution with both relative and absolute paths.
 */
export class PathResolver
{
  /** A shared serialization flag class. */
  static readonly UseAbsolute = SerializeAbsoluteProperty;

  /**
   * Replacement for JSON.stringify which temporarily overrides useAbsolute
   * @param absoluteSetting - the shared useAbsolute wrapper.
   * @param useAbsolute - the overriding value for useAbsolute.
   * @param args - arguments to pass to JSON.stringify()
   * @returns the result from JSON.stringify()
   */
  static stringify(
    absoluteSetting: SerializeAbsoluteProperty,
    useAbsolute: boolean,
    ...args: Parameters<JSON["stringify"]>
  ) : ReturnType<JSON["stringify"]>
  {
    return this.overrideForCallback(
      absoluteSetting,
      useAbsolute,
      () => JSON.stringify(...args)
    );
  }

  /**
   * Run a callback with a temporary useAbsolute value.
   * @param absoluteSetting - the shared useAbsolute wrapper.
   * @param useAbsolute - the overriding value for useAbsolute.
   * @param callback - a callback to execute.
   * @returns 
   */
  static overrideForCallback<T>(
    absoluteSetting: SerializeAbsoluteProperty,
    useAbsolute: boolean,
    callback: () => T
  ) : T
  {
    const oldValue = absoluteSetting.useAbsolute;
    absoluteSetting.useAbsolute = useAbsolute;
    try {
      return callback();
    }
    finally {
      absoluteSetting.useAbsolute = oldValue;
    }
  }

  readonly #basePath: string;
  #relativePath = "";

  readonly #serializeAbsolute: SerializeAbsoluteProperty

  constructor(
    basePath: string,
    pathToFile: string,
    absoluteProperty: SerializeAbsoluteProperty
  )
  {
    this.#basePath = basePath;
    this.#serializeAbsolute = absoluteProperty;
    this.setPath(absoluteProperty.useAbsolute, pathToFile);
  }

  #normalize(newPath: string) : string
  {
    return path.normalize(path.resolve(this.#basePath, newPath));
  }

  getPath(asAbsolute: boolean) : string
  {
    if (asAbsolute) {
      return this.#normalize(this.#relativePath);
    }
    return this.#relativePath;
  }

  setPath(asAbsolute: boolean, newPath: string) : void
  {
    if (!asAbsolute) {
      newPath = this.#normalize(newPath);
    }
    else {
      newPath = path.normalize(newPath);
    }

    this.#relativePath = path.relative(this.#basePath, newPath);
  }

  toJSON() : string {
    return this.getPath(this.#serializeAbsolute.useAbsolute);
  }
}
