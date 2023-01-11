export default class StringSet extends Set {
    toJSON() {
        return Array.from(this.values());
    }
    static isJSON(value) {
        if (!Array.isArray(value))
            return false;
        return value.every(element => typeof element === "string");
    }
    static fromJSON(values) {
        return new this(values);
    }
}
//# sourceMappingURL=StringSet.js.map