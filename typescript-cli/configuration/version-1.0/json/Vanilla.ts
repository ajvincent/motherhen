import path from "path";

import PathResolver from "../../PathResolver";
import projectRoot from "#cli/utilities/projectRoot";
import { isJSONObject } from "./JSON_Operations";

const cleanroomPath = path.join(projectRoot, "cleanroom/mozilla-unified");

export type VanillaJSONParsed = {
  /**
   * The vanilla repository's location.
   */
  readonly path: PathResolver;

  /** The tag to apply to the mozilla-unified repository. */
  "tag": string;
}

export type VanillaJSONSerialized = {
  path?: string;
  tag: string;
}

export class VanillaJSON implements VanillaJSONParsed
{
  readonly path: PathResolver;
  tag: string;

  /**
   * @param pathToVanilla - The vanilla repository's location.
   * @param tag - The tag to apply to the mozilla-unified repository.
   */
  constructor(pathToVanilla: PathResolver, tag: string)
  {
    this.path = pathToVanilla;
    this.tag = tag;
  }

  toJSON() : Readonly<VanillaJSONSerialized>
  {
    const rv: VanillaJSONSerialized = {
      tag: this.tag,
    };

    const vanillaPath = this.path.getPath(true);
    if (vanillaPath !== cleanroomPath)
      rv.path = this.path.toJSON();

    return rv;
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is VanillaJSONSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as VanillaJSONSerialized;
    if (typeof value.tag !== "string")
      return false;

    const pathType = typeof value.path;
    if (pathType === "undefined")
      return true;
    return pathType === "string";
  }

  static fromJSON(
    pathResolver: PathResolver,
    value: VanillaJSONSerialized
  ) : VanillaJSON
  {
    const rv = new this(
      pathResolver.clone(),
      value.tag
    );

    if ("path" in value) {
      rv.path.setPath(false, value.path as string);
    }
    else {
      rv.path.setPath(true, cleanroomPath);
    }

    return rv;
  }
}
