export default function maybeLog(sharedArguments, ...args) {
    if (!sharedArguments.suppressConsole)
        console.log(...args);
}
//# sourceMappingURL=maybeLog.js.map