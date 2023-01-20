import { isJSONObject } from "./JSON_Operations.js";
export default class StringMap extends Map {
    toJSON() {
        return Object.fromEntries(this.entries());
    }
    static isJSON(value) {
        if (!isJSONObject(value))
            return false;
        if (Object.getOwnPropertySymbols(value).length)
            return false;
        return Object.entries(value).every(([key, value]) => {
            return (typeof key === "string") && (typeof value === "string");
        });
    }
    static fromJSON(value) {
        return new this(Object.entries(value));
    }
}
//# sourceMappingURL=StringMap.js.map