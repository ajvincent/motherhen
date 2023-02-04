import PathResolver from "../../PathResolver.js";
import { isJSONObject } from "./JSON_Operations.js";

export type FirefoxJSONParsed = {
  /** the tag to update our cleanroom Mozilla repository to, before cloning it for integration */
  vanillaTag: string;

  buildType: "optimized" | "debug" | "symbols";

  /** the Motherhen integration directory */
  readonly targetDirectory: PathResolver;
};

export type FirefoxJSONSerialized = {
  vanillaTag: string;
  buildType: "optimized" | "debug" | "symbols";
  targetDirectory: string;
};

export default
class FirefoxJSON
implements FirefoxJSONParsed
{
  vanillaTag: string;
  buildType: FirefoxJSONParsed["buildType"];
  readonly targetDirectory: PathResolver;

  private constructor(
    vanillaTag: string,
    buildType: FirefoxJSONParsed["buildType"],
    targetDirectory: PathResolver,
  )
  {
    this.vanillaTag = vanillaTag;
    this.buildType = buildType;
    this.targetDirectory = targetDirectory;
  }

  toJSON(): Readonly<FirefoxJSONSerialized>
  {
    return {
      vanillaTag: this.vanillaTag,
      buildType: this.buildType,
      targetDirectory: this.targetDirectory.toJSON(),
    };
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is FirefoxJSONSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as FirefoxJSONSerialized;
    if (typeof value.vanillaTag !== "string")
      return false;
    if (!FirefoxJSON.buildTypes.has(value.buildType))
      return false;
    if (typeof value.targetDirectory !== "string")
      return false;

    return true;
  }

  static readonly buildTypes: ReadonlySet<FirefoxJSON["buildType"]> = new Set<
    FirefoxJSONParsed["buildType"]
  >
  (
    [ "optimized", "debug", "symbols"]
  );

  static fromJSON(
    pathResolver: PathResolver,
    value: FirefoxJSONSerialized
  ) : FirefoxJSON
  {
    const targetDirectory = pathResolver.clone();
    targetDirectory.setPath(false, value.targetDirectory);

    return new FirefoxJSON(
      value.vanillaTag,
      value.buildType,
      targetDirectory
    );
  }
}
