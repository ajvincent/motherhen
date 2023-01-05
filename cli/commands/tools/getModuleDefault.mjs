/**
 * Get the default export from a command module.
 * @param commandName - the command, also matching `./build/${commandName}.mjs`.
 * @returns the default export.
 */
export default async function getModuleDefault(importPath) {
    const module = await import(importPath);
    return module.default;
}
//# sourceMappingURL=getModuleDefault.mjs.map