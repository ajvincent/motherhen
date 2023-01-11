import PathResolver from "../PathResolver";
import { isJSONObject } from "./JSON_Operations";
import StringSet from "./StringSet";

export type IntegrationJSONParsed = {
  vanillaKey: string;
  readonly sourceKeys: StringSet;
  readonly patchKeys: StringSet;
  readonly targetDirectory: PathResolver;
}

export type IntegrationJSONSerialized = {
  vanillaKey: string;
  readonly sourceKeys: string[];
  readonly patchKeys: string[];
  targetDirectory: string;
};

export default
class IntegrationJSON
implements IntegrationJSONParsed
{
  /** the key for a vanilla configuration */
  vanillaKey: string;

  /** the source directory keys */
  readonly sourceKeys: StringSet;

  /** the patch file keys */
  readonly patchKeys: StringSet;

  /** the Motherhen integration directory */
  readonly targetDirectory: PathResolver;

  /**
   * Provide an Integration configuration.
   * @param vanillaKey - the key for a vanilla configuration
   * @param sourceKeys - the source directory keys
   * @param patchKeys - the patch file keys
   * @param targetDirectory - the Motherhen integration directory
   */
  constructor(
    vanillaKey: string,
    sourceKeys: StringSet,
    patchKeys: StringSet,
    targetDirectory: PathResolver
  )
  {
    this.vanillaKey = vanillaKey;
    this.sourceKeys = sourceKeys;
    this.patchKeys = patchKeys;
    this.targetDirectory = targetDirectory;
  }

  toJSON() : Readonly<IntegrationJSONSerialized>
  {
    return {
      vanillaKey: this.vanillaKey,
      sourceKeys: this.sourceKeys.toJSON(),
      patchKeys: this.patchKeys.toJSON(),
      targetDirectory: this.targetDirectory.toJSON(),
    }
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is IntegrationJSONSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as IntegrationJSONSerialized;
    if (typeof value.vanillaKey !== "string")
      return false;
    if (typeof value.targetDirectory !== "string")
      return false;

    return (
      StringSet.isJSON(value.sourceKeys) &&
      StringSet.isJSON(value.patchKeys)
    );
  }

  static fromJSON(
    pathResolver: PathResolver,
    value: IntegrationJSONSerialized
  ) : IntegrationJSON
  {
    const sourceKeys = new StringSet(value.sourceKeys);
    const patchKeys = new StringSet(value.patchKeys);

    const targetDirectory = pathResolver.clone();
    targetDirectory.setPath(false, value.targetDirectory);

    return new IntegrationJSON(
      value.vanillaKey,
      sourceKeys,
      patchKeys,
      targetDirectory
    );
  }
}
