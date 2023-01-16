import {
  isJSONObject
} from "./JSON_Operations.js";
import StringSet from "./StringSet.js";

export type PatchesJSONParsed = {
  /**
   * A set of globs to look up patches in `${projectRoot}/patches`.
   * @see {@link https://www.npmjs.com/package/fast-glob}
   */
  globs: StringSet;

  /** How should we commit patches to the integration repository? */
  commitMode: (
    // we apply the patches, but we do not commit them.
    "none" |

    // hg import
    "import" |

    // hg qimport
    "qimport" |

    // hg commit at the end with the commit message below.
    "atEnd" |
    never
  );

  /** The commit message for the "atEnd" commitMode.  Ignored otherwise. */
  commitMessage: string | null;
}

export type PatchesJSONSerialized = {
  globs: string[];
  commitMode: (
    "none" |
    "import" |
    "qimport" |
    "atEnd" |
    never
  );

  // ignored if commitMode !== "atEnd"
  commitMessage: string | null;
};

export default class PatchesJSON implements PatchesJSONParsed
{
  readonly globs: StringSet;
  commitMode: PatchesJSONParsed["commitMode"];
  commitMessage: PatchesJSONParsed["commitMessage"];

  private constructor(data: PatchesJSONParsed)
  {
    this.globs = data.globs;
    this.commitMode = data.commitMode;
    this.commitMessage = data.commitMessage;
  }

  toJSON() : PatchesJSONSerialized
  {
    return {
      globs: this.globs.toJSON(),
      commitMode: this.commitMode,
      commitMessage: this.commitMessage,
    }
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is PatchesJSONSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;
    const value = unknownValue as PatchesJSONSerialized;
    if (!StringSet.isJSON(value.globs))
      return false;
    if (!PatchesJSON.#commitModes.has(value.commitMode))
      return false;
    if ((value.commitMessage !== null) &&
        (typeof value.commitMessage !== "string"))
      return false;

    return true;
  }

  static readonly #commitModes = new Set<
    PatchesJSONSerialized["commitMode"]
  >
  (
    [ "none", "import", "qimport", "atEnd", ]
  );

  static fromJSON(
    value: PatchesJSONSerialized,
  ) : PatchesJSON
  {
    const globs = StringSet.fromJSON(value.globs);

    return new PatchesJSON({
      globs,
      commitMode: value.commitMode,
      commitMessage: value.commitMessage
    });
  }

  static blank() : PatchesJSONSerialized
  {
    return {
      globs: [],
      commitMode: "none",
      commitMessage: null,
    };
  }
}
