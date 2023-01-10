import path from "path";
import projectRoot from "../../utilities/projectRoot";
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
        if ((Object(unknownValue) !== unknownValue) ||
            !unknownValue ||
            Array.isArray(unknownValue))
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
        if (value.path)
            rv.path.setPath(false, value.path);
        return rv;
    }
}
//# sourceMappingURL=Vanilla.js.map