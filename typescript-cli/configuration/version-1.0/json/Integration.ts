import PathResolver from "../../PathResolver";
import { isJSONObject } from "./JSON_Operations";

export type IntegrationJSONParsed = {
  vanillaTag: string;
  sourceKey: string;
  patchKey: string;
  readonly targetDirectory: PathResolver;
}

export type IntegrationJSONSerialized = {
  vanillaTag: string;
  sourceKey: string;
  patchKey: string;
  targetDirectory: string;
};

export default
class IntegrationJSON
implements IntegrationJSONParsed
{
  /** the tag to update our cleanroom Mozilla repository to, before cloning it for integration */
  vanillaTag: string;

  /** the source directory key */
  sourceKey: string;

  /** the patch file key */
  patchKey: string;

  /** the Motherhen integration directory */
  readonly targetDirectory: PathResolver;

  /**
   * Provide an Integration configuration.
   * @param vanillaTag - the tag to update our cleanroom Mozilla repository to, before cloning it for integration
   * @param sourceKey - the source directory key
   * @param patchKey - the patch file key
   * @param targetDirectory - the Motherhen integration directory
   */
  constructor(
    vanillaTag: string,
    sourceKey: string,
    patchKey: string,
    targetDirectory: PathResolver
  )
  {
    this.vanillaTag = vanillaTag;
    this.sourceKey = sourceKey;
    this.patchKey = patchKey;
    this.targetDirectory = targetDirectory;
  }

  toJSON() : Readonly<IntegrationJSONSerialized>
  {
    return {
      vanillaTag: this.vanillaTag,
      sourceKey: this.sourceKey,
      patchKey: this.patchKey,
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
    if (typeof value.sourceKey !== "string")
      return false;
    if (typeof value.patchKey !== "string")
      return false;
    if (typeof value.targetDirectory !== "string")
      return false;

    return true;
  }

  static fromJSON(
    pathResolver: PathResolver,
    value: IntegrationJSONSerialized
  ) : IntegrationJSON
  {
    const targetDirectory = pathResolver.clone();
    targetDirectory.setPath(false, value.targetDirectory);

    return new IntegrationJSON(
      value.vanillaTag,
      value.sourceKey,
      value.patchKey,
      targetDirectory
    );
  }
}
