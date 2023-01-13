import { isJSONObject } from "./JSON_Operations";
export default class FirefoxJSON {
    vanillaTag;
    buildType;
    targetDirectory;
    constructor(vanillaTag, buildType, targetDirectory) {
        this.vanillaTag = vanillaTag;
        this.buildType = buildType;
        this.targetDirectory = targetDirectory;
    }
    toJSON() {
        return {
            vanillaTag: this.vanillaTag,
            buildType: this.buildType,
            targetDirectory: this.targetDirectory.toJSON(),
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        if (typeof value.vanillaTag !== "string")
            return false;
        if (!FirefoxJSON.#buildTypes.has(value.buildType))
            return false;
        if (typeof value.targetDirectory !== "string")
            return false;
        return true;
    }
    static #buildTypes = new Set(["optimized", "debug", "symbols"]);
    static fromJSON(pathResolver, value) {
        const targetDirectory = pathResolver.clone();
        targetDirectory.setPath(false, value.targetDirectory);
        return new FirefoxJSON(value.vanillaTag, value.buildType, targetDirectory);
    }
}
//# sourceMappingURL=Firefox.js.map