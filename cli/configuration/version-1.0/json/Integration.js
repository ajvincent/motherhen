import { isJSONObject } from "./JSON_Operations";
import StringSet from "./StringSet";
export default class IntegrationJSON {
    /** the key for a vanilla configuration */
    vanillaKey;
    /** the source directory keys */
    sourceKeys;
    /** the patch file keys */
    patchKeys;
    /** the Motherhen integration directory */
    targetDirectory;
    /**
     * Provide an Integration configuration.
     * @param vanillaKey - the key for a vanilla configuration
     * @param sourceKeys - the source directory keys
     * @param patchKeys - the patch file keys
     * @param targetDirectory - the Motherhen integration directory
     */
    constructor(vanillaKey, sourceKeys, patchKeys, targetDirectory) {
        this.vanillaKey = vanillaKey;
        this.sourceKeys = sourceKeys;
        this.patchKeys = patchKeys;
        this.targetDirectory = targetDirectory;
    }
    toJSON() {
        return {
            vanillaKey: this.vanillaKey,
            sourceKeys: this.sourceKeys.toJSON(),
            patchKeys: this.patchKeys.toJSON(),
            targetDirectory: this.targetDirectory.toJSON(),
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        if (typeof value.vanillaKey !== "string")
            return false;
        if (typeof value.targetDirectory !== "string")
            return false;
        return (StringSet.isJSON(value.sourceKeys) &&
            StringSet.isJSON(value.patchKeys));
    }
    static fromJSON(pathResolver, value) {
        const sourceKeys = new StringSet(value.sourceKeys);
        const patchKeys = new StringSet(value.patchKeys);
        const targetDirectory = pathResolver.clone();
        targetDirectory.setPath(false, value.targetDirectory);
        return new IntegrationJSON(value.vanillaKey, sourceKeys, patchKeys, targetDirectory);
    }
}
//# sourceMappingURL=Integration.js.map