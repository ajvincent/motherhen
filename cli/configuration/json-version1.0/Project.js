import { isJSONObject } from "./JSON_Operations";
export default class ProjectJSON {
    /** the integration dictionary key */
    integrationKey;
    /** the mozconfig dictionary key */
    mozconfigKey;
    /** a dictionary key under sources to treat as the application directory */
    appDirKey;
    /**
     * Provide a Project configuration.
     * @param integrationKey - the integration dictionary key
     * @param mozconfigKey - the mozconfig dictionary key
     * @param appDirKey - a dictionary key under sources to treat as the application directory
     */
    constructor(integrationKey, mozconfigKey, appDirKey) {
        this.integrationKey = integrationKey;
        this.mozconfigKey = mozconfigKey;
        this.appDirKey = appDirKey;
    }
    toJSON() {
        return {
            integrationKey: this.integrationKey,
            mozconfigKey: this.mozconfigKey,
            appDirKey: this.appDirKey,
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        return ((typeof value.integrationKey === "string") &&
            (typeof value.mozconfigKey === "string") &&
            (typeof value.appDirKey === "string"));
    }
    static fromJSON(value) {
        return new ProjectJSON(value.integrationKey, value.mozconfigKey, value.appDirKey);
    }
}
//# sourceMappingURL=Project.js.map