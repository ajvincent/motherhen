/** @internal */
export function forceJSONType(value) {
    void (value);
}
export function isJSONObject(unknownValue) {
    if ((Object(unknownValue) !== unknownValue) ||
        !unknownValue ||
        Array.isArray(unknownValue))
        return false;
    return true;
}
//# sourceMappingURL=JSON_Operations.js.map