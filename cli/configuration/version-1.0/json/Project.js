import { isJSONObject } from "./JSON_Operations.js";
export default class ProjectJSON {
    integrationKey;
    mozconfig;
    appDir;
    displayAppName;
    /**
     * Provide a Project configuration.
     * @param integrationKey - the integration dictionary key
     * @param mozconfig - the mozconfig to find in `${projectRoot}/mozconfigs/base`
     * @param appDir - a dictionary key under sources to treat as the application directory
     * @param displayAppName - The application name to display to the end-user, which we store as MOZ_APP_DISPLAYNAME
     */
    constructor(integrationKey, mozconfig, appDir, displayAppName) {
        this.integrationKey = integrationKey;
        this.mozconfig = mozconfig;
        this.appDir = appDir;
        this.displayAppName = displayAppName;
    }
    toJSON() {
        return {
            integrationKey: this.integrationKey,
            mozconfig: this.mozconfig,
            appDir: this.appDir,
            displayAppName: this.displayAppName,
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        return ((typeof value.integrationKey === "string") &&
            (typeof value.mozconfig === "string") &&
            (typeof value.appDir === "string") &&
            (typeof value.displayAppName === "string"));
    }
    static fromJSON(value) {
        return new ProjectJSON(value.integrationKey, value.mozconfig, value.appDir, value.displayAppName);
    }
}
//# sourceMappingURL=Project.js.map