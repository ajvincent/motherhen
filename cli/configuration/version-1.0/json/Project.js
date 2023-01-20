import { isJSONObject } from "./JSON_Operations.js";
export default class ProjectJSON {
    integrationKey;
    mozconfig;
    appDir;
    /**
     * Provide a Project configuration.
     * @param integrationKey - the integration dictionary key
     * @param mozconfig - the mozconfig to find in `${projectRoot}/mozconfigs/base`
     * @param appDir - a dictionary key under sources to treat as the application directory
     */
    constructor(integrationKey, mozconfig, appDir) {
        this.integrationKey = integrationKey;
        this.mozconfig = mozconfig;
        this.appDir = appDir;
    }
    toJSON() {
        return {
            integrationKey: this.integrationKey,
            mozconfig: this.mozconfig,
            appDir: this.appDir,
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        return ((typeof value.integrationKey === "string") &&
            (typeof value.mozconfig === "string") &&
            (typeof value.appDir === "string"));
    }
    static fromJSON(value) {
        return new ProjectJSON(value.integrationKey, value.mozconfig, value.appDir);
    }
}
//# sourceMappingURL=Project.js.map