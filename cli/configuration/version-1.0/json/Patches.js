import { isJSONObject } from "./JSON_Operations.js";
import StringSet from "./StringSet.js";
export default class PatchesJSON {
    globs;
    commitMode;
    commitMessage;
    constructor(data) {
        this.globs = data.globs;
        this.commitMode = data.commitMode;
        this.commitMessage = data.commitMessage;
    }
    toJSON() {
        return {
            globs: this.globs.toJSON(),
            commitMode: this.commitMode,
            commitMessage: this.commitMessage,
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        if (!StringSet.isJSON(value.globs))
            return false;
        if (!PatchesJSON.#commitModes.has(value.commitMode))
            return false;
        if ((value.commitMessage !== null) &&
            (typeof value.commitMessage !== "string"))
            return false;
        return true;
    }
    static #commitModes = new Set(["none", "import", "qimport", "atEnd",]);
    static fromJSON(value) {
        const globs = StringSet.fromJSON(value.globs);
        return new PatchesJSON({
            globs,
            commitMode: value.commitMode,
            commitMessage: value.commitMessage
        });
    }
    static blank() {
        return {
            // This is a deliberate non-empty array, because users could accidentally miss patches in the wizard.
            globs: ["**/*.patch"],
            commitMode: "none",
            commitMessage: null,
        };
    }
}
//# sourceMappingURL=Patches.js.map