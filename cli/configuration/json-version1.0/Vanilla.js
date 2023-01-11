import path from "path";
import projectRoot from "../../utilities/projectRoot";
import { isJSONObject } from "./JSON_Operations";
const cleanroomPath = path.join(projectRoot, "cleanroom/mozilla-unified");
export class VanillaJSON {
    path;
    tag;
    /**
     * @param pathToVanilla - The vanilla repository's location.
     * @param tag - The tag to apply to the mozilla-unified repository.
     */
    constructor(pathToVanilla, tag) {
        this.path = pathToVanilla;
        this.tag = tag;
    }
    toJSON() {
        const rv = {
            tag: this.tag,
        };
        const vanillaPath = this.path.getPath(true);
        if (vanillaPath !== cleanroomPath)
            rv.path = this.path.toJSON();
        return rv;
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        if (typeof value.tag !== "string")
            return false;
        const pathType = typeof value.path;
        if (pathType === "undefined")
            return true;
        return pathType === "string";
    }
    static fromJSON(pathResolver, value) {
        const rv = new this(pathResolver.clone(), value.tag);
        if ("path" in value) {
            rv.path.setPath(false, value.path);
        }
        else {
            rv.path.setPath(true, cleanroomPath);
        }
        return rv;
    }
}
//# sourceMappingURL=Vanilla.js.map