import fs from "fs/promises";
import path from "path";
import projectRoot from "#cli/utilities/projectRoot.js";
/**
 * Get the configuration.
 * @param settings - the command-line settings from motherhen.mts.
 *
 * @returns a configuration with absolute paths.
 */
async function getConfiguration(settings) {
    const { project, relativePathToConfig } = settings;
    const pathToConfig = path.resolve(projectRoot, relativePathToConfig);
    let configJSON;
    try {
        configJSON = JSON.parse(await fs.readFile(pathToConfig, { encoding: "utf-8" }));
    }
    catch (ex) {
        console.error(`I couldn't find a JSON file at ${pathToConfig}!  (Did you forget the --config option?)`);
        throw ex;
    }
    const partialConfig = configJSON[project];
    if (!isConfiguration(partialConfig))
        throw new Error(`no configuration found for project "${project}"`);
    const config = {
        vanilla: {
            ...partialConfig.vanilla,
            path: partialConfig.vanilla.path ?? path.resolve(projectRoot, ".cleanroom/mozilla-unified")
        },
        integration: {
            ...partialConfig.integration
        }
    };
    normalize(config.vanilla, "path", pathToConfig);
    normalize(config.integration, "path", pathToConfig);
    normalize(config.integration, "mozconfig", pathToConfig);
    return config;
}
/** Validate a configuration value. */
export function isConfiguration(unknownValue) {
    if (typeof unknownValue !== "object")
        return false;
    const value = unknownValue;
    if (typeof value.vanilla !== "object")
        return false;
    const vanillaPathType = typeof value.vanilla.path;
    if ((vanillaPathType !== "string") && (vanillaPathType !== "undefined"))
        return false;
    if (value.vanilla.path === "")
        return false;
    if (typeof value.vanilla.tag !== "string")
        return false;
    if (value.vanilla.tag === "")
        return false;
    if (typeof value.integration !== "object")
        return false;
    if (typeof value.integration.path !== "string")
        return false;
    if (value.integration.path === "")
        return false;
    if (typeof value.integration.mozconfig !== "string")
        return false;
    if (value.integration.mozconfig === "")
        return false;
    return true;
}
/**
 * Convert a relative path in a configuration to an absolute path.
 *
 * @typeParam Key - the key we're checking for.
 * @param base - the object to modify.
 * @param key - the property name of the object.
 * @param pathToConfig - an absolute path to the configuration.
 * @internal
 */
function normalize(base, key, pathToConfig) {
    base[key] = path.normalize(path.resolve(pathToConfig, "..", base[key]));
}
export default getConfiguration;
//# sourceMappingURL=Configuration.js.map