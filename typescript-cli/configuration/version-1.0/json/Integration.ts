import PathResolver from "../../PathResolver";
import { isJSONObject } from "./JSON_Operations";
import StringSet from "./StringSet";

export type IntegrationJSONParsed = {
  vanillaTag: string;
  readonly sourceKeys: StringSet;
  readonly patchKeys: StringSet;
  readonly targetDirectory: PathResolver;
}

export type IntegrationJSONSerialized = {
  vanillaTag: string;
  readonly sourceKeys: string[];
  readonly patchKeys: string[];
  targetDirectory: string;
};

export default
class IntegrationJSON
implements IntegrationJSONParsed
{
  /** the tag to update our cleanroom Mozilla repository to, before cloning it for integration */
  vanillaTag: string;

  /** the source directory keys */
  readonly sourceKeys: StringSet;

  /** the patch file keys */
  readonly patchKeys: StringSet;

  /** the Motherhen integration directory */
  readonly targetDirectory: PathResolver;

  /**
   * Provide an Integration configuration.
   * @param vanillaTag - the tag to update our cleanroom Mozilla repository to, before cloning it for integration
   * @param sourceKeys - the source directory keys
   * @param patchKeys - the patch file keys
   * @param targetDirectory - the Motherhen integration directory
   */
  constructor(
    vanillaTag: string,
    sourceKeys: StringSet,
    patchKeys: StringSet,
    targetDirectory: PathResolver
  )
  {
    this.vanillaTag = vanillaTag;
    this.sourceKeys = sourceKeys;
    this.patchKeys = patchKeys;
    this.targetDirectory = targetDirectory;
  }

  toJSON() : Readonly<IntegrationJSONSerialized>
  {
    return {
      vanillaTag: this.vanillaTag,
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
    if (typeof value.vanillaTag !== "string")
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
      value.vanillaTag,
      sourceKeys,
      patchKeys,
      targetDirectory
    );
  }
}
