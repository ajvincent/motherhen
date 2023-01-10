import path from "path";
import projectRoot from "../../utilities/projectRoot";
const cleanroomPath = path.join(projectRoot, "cleanroom/mozilla-unified");
export default class VanillaJSON {
    path;
    tag;
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
            rv.path = this.path;
        return rv;
    }
}
//# sourceMappingURL=Vanilla.js.map