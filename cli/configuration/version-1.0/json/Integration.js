import { isJSONObject } from "./JSON_Operations";
export default class IntegrationJSON {
    /** the tag to update our cleanroom Mozilla repository to, before cloning it for integration */
    vanillaTag;
    /** the source directory key */
    sourceKey;
    /** the patch file key */
    patchKey;
    /** the Motherhen integration directory */
    targetDirectory;
    /**
     * Provide an Integration configuration.
     * @param vanillaTag - the tag to update our cleanroom Mozilla repository to, before cloning it for integration
     * @param sourceKey - the source directory key
     * @param patchKey - the patch file key
     * @param targetDirectory - the Motherhen integration directory
     */
    constructor(vanillaTag, sourceKey, patchKey, targetDirectory) {
        this.vanillaTag = vanillaTag;
        this.sourceKey = sourceKey;
        this.patchKey = patchKey;
        this.targetDirectory = targetDirectory;
    }
    toJSON() {
        return {
            vanillaTag: this.vanillaTag,
            sourceKey: this.sourceKey,
            patchKey: this.patchKey,
            targetDirectory: this.targetDirectory.toJSON(),
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
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
    static fromJSON(pathResolver, value) {
        const targetDirectory = pathResolver.clone();
        targetDirectory.setPath(false, value.targetDirectory);
        return new IntegrationJSON(value.vanillaTag, value.sourceKey, value.patchKey, targetDirectory);
    }
}
//# sourceMappingURL=Integration.js.map