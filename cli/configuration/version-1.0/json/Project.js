import { isJSONObject } from "./JSON_Operations";
export default class ProjectJSON {
    integrationKey;
    mozconfigKey;
    appDir;
    /**
     * Provide a Project configuration.
     * @param integrationKey - the integration dictionary key
     * @param mozconfigKey - the mozconfig dictionary key
     * @param appDir - a dictionary key under sources to treat as the application directory
     */
    constructor(integrationKey, mozconfigKey, appDir) {
        this.integrationKey = integrationKey;
        this.mozconfigKey = mozconfigKey;
        this.appDir = appDir;
    }
    toJSON() {
        return {
            integrationKey: this.integrationKey,
            mozconfigKey: this.mozconfigKey,
            appDir: this.appDir,
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        return ((typeof value.integrationKey === "string") &&
            (typeof value.mozconfigKey === "string") &&
            (typeof value.appDir === "string"));
    }
    static fromJSON(value) {
        return new ProjectJSON(value.integrationKey, value.mozconfigKey, value.appDir);
    }
}
//# sourceMappingURL=Project.js.map