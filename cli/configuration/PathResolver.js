import path from "path";
/** A shared serialization flag class. */
class SerializeAbsoluteProperty {
    /** True if the serialization should use absolute paths. */
    useAbsolute = false;
}
/**
 * This class exists to handle path resolution with both relative and absolute paths.
 */
export class PathResolver {
    /** A shared serialization flag class. */
    static UseAbsolute = SerializeAbsoluteProperty;
    /**
     * Replacement for JSON.stringify which temporarily overrides useAbsolute
     * @param absoluteSetting - the shared useAbsolute wrapper.
     * @param useAbsolute - the overriding value for useAbsolute.
     * @param args - arguments to pass to JSON.stringify()
     * @returns the result from JSON.stringify()
     */
    static stringify(absoluteSetting, useAbsolute, ...args) {
        return this.overrideForCallback(absoluteSetting, useAbsolute, () => JSON.stringify(...args));
    }
    /**
     * Run a callback with a temporary useAbsolute value.
     * @param absoluteSetting - the shared useAbsolute wrapper.
     * @param useAbsolute - the overriding value for useAbsolute.
     * @param callback - a callback to execute.
     * @returns
     */
    static overrideForCallback(absoluteSetting, useAbsolute, callback) {
        const oldValue = absoluteSetting.useAbsolute;
        absoluteSetting.useAbsolute = useAbsolute;
        try {
            return callback();
        }
        finally {
            absoluteSetting.useAbsolute = oldValue;
        }
    }
    #basePath;
    #relativePath = "";
    #serializeAbsolute;
    constructor(basePath, pathToFile, absoluteProperty) {
        this.#basePath = basePath;
        this.#serializeAbsolute = absoluteProperty;
        this.setPath(absoluteProperty.useAbsolute, pathToFile);
    }
    #normalize(newPath) {
        return path.normalize(path.resolve(this.#basePath, newPath));
    }
    getPath(asAbsolute) {
        if (asAbsolute) {
            return this.#normalize(this.#relativePath);
        }
        return this.#relativePath;
    }
    setPath(asAbsolute, newPath) {
        if (!asAbsolute) {
            newPath = this.#normalize(newPath);
        }
        else {
            newPath = path.normalize(newPath);
        }
        this.#relativePath = path.relative(this.#basePath, newPath);
    }
    toJSON() {
        return this.getPath(this.#serializeAbsolute.useAbsolute);
    }
}
//# sourceMappingURL=PathResolver.js.map