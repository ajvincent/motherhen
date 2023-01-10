/** A wrapper around PathResolver for JSON parsing and serializing. */
export default class FileJSON {
    path;
    constructor(pathToSource) {
        this.path = pathToSource;
    }
    toJSON() {
        return this.path.toJSON();
    }
    static isJSON(unknownValue) {
        return typeof unknownValue === "string";
    }
    static fromJSON(pathResolver, value) {
        const rv = new FileJSON(pathResolver.clone());
        rv.path.setPath(false, value);
        return rv;
    }
}
//# sourceMappingURL=File.js.map