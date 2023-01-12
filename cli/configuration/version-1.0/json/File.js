/** A wrapper around PathResolver for JSON parsing and serializing. */
export default class FileJSON {
    path;
    constructor(pathToSource) {
        this.path = pathToSource.clone();
    }
    toJSON() {
        return this.path.toJSON();
    }
    static isJSON(unknownValue) {
        return typeof unknownValue === "string";
    }
    static fromJSON(pathResolver, value) {
        const rv = new FileJSON(pathResolver);
        rv.path.setPath(false, value);
        return rv;
    }
}
//# sourceMappingURL=File.js.map