import path from "path";

import PathResolver from "../PathResolver";
import projectRoot from "../../utilities/projectRoot";

const cleanroomPath = path.join(projectRoot, "cleanroom/mozilla-unified");

export interface VanillaJSONInterface {
  /** The vanilla repository's location. */
  readonly path: PathResolver;

  /** The tag to apply to the mozilla-unified repository. */
  "tag": string;
}

type VanillaJSONOutput = {
  path?: string;
  tag: string;
}

export default class VanillaJSON implements VanillaJSONInterface
{
  readonly path: PathResolver;
  tag: string;

  constructor(pathToVanilla: PathResolver, tag: string)
  {
    this.path = pathToVanilla;
    this.tag = tag;
  }

  toJSON() : Readonly<VanillaJSONOutput>
  {
    const rv: VanillaJSONOutput = {
      tag: this.tag,
    };

    const vanillaPath = this.path.getPath(true);
    if (vanillaPath !== cleanroomPath)
      rv.path = this.path.toJSON();

    return rv;
  }
}
