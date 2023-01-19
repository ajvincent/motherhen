export function assert(condition, message) {
    if (!condition) {
        return assertFail(message);
    }
    return true;
}
export function assertFail(message) {
    throw new Error("assertion failure, " + message);
}
//# sourceMappingURL=assert.js.map