import PatchesJSON, {
  type PatchesJSONParsed,
  type PatchesJSONSerialized,
} from "#cli/configuration/version-1.0/json/Patches.js";

import { forceJSONType } from "#cli/configuration/version-1.0/json/JSON_Operations.js";
forceJSONType<PatchesJSONParsed, PatchesJSONSerialized, false>(PatchesJSON);

describe("Patches", () => {
  const modes   : ReadonlyArray<PatchesJSONSerialized["commitMode"]>    = [
    "none", "import", "qimport", "atEnd"
  ];
  const messages: ReadonlyArray<PatchesJSONSerialized["commitMessage"]> = [
    "committed", null
  ];

  let serialized: PatchesJSONSerialized;
  beforeEach(() => {
    serialized = PatchesJSON.blank();
    serialized.globs.push("*.patch");
  });

  function modesAndMessagesForEach(
    callback: (
      mode: PatchesJSONSerialized["commitMode"],
      message: PatchesJSONSerialized["commitMessage"]
    ) => void
  ) : void
  {
    modes.forEach(mode => {
      messages.forEach(message => {
        serialized.commitMode = mode;
        serialized.commitMessage = message;
        callback(mode, message);
      });
    });
  }

  it(".fromJSON() works", () => {
    modesAndMessagesForEach((mode, message) => {
      const parsed = PatchesJSON.fromJSON(serialized);
      expect(parsed.commitMode).toBe(mode);
      expect(parsed.commitMessage).toBe(message);

      expect(parsed.globs.size).toBe(1);
      expect(parsed.globs.has("*.patch")).toBe(true);
    });
  });

  it(".protoype.toJSON() works", () => {
    modesAndMessagesForEach(() => {
      const parsed = PatchesJSON.fromJSON(serialized);

      const reserialized = parsed.toJSON();
      expect(reserialized).toEqual(serialized);
      expect(reserialized).not.toBe(serialized);
    });
  });

  it(".isJSON() works", () => {
    // required fields tests
    expect(PatchesJSON.isJSON({
      globs: serialized.globs,
      commitMode: serialized.commitMode
    })).toBe(false);

    expect(PatchesJSON.isJSON({
      globs: serialized.globs,
      commitMessage: serialized.commitMessage
    })).toBe(false);

    expect(PatchesJSON.isJSON({
      globs: serialized.globs,
      commitMode: "other",
      commitMessage: serialized.commitMessage
    })).toBe(false);

    expect(PatchesJSON.isJSON({
      commitMode: serialized.commitMode,
      commitMessage: serialized.commitMessage
    })).toBe(false);

    // not an object
    expect(PatchesJSON.isJSON([serialized])).toBe(false);

    modesAndMessagesForEach(() => {
      expect(PatchesJSON.isJSON(serialized)).toBe(true);
    });
  });
});
