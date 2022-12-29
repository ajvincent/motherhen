import fs from "fs/promises";
import path from "path";
import url from "url";
const projectRoot = path.normalize(path.join(url.fileURLToPath(import.meta.url), "../../.."));
/**
 * Get the configuration from the command-line target and an optional
 * MOTHERHEN_CONFIG environment variable.
 * @returns a configuration with absolute paths.
 */
export default async function getConfiguration() {
    const target = process.argv[2] ?? "default";
    const pathToConfig = path.join(projectRoot, process.env["MOTHERHEN_CONFIG"] ?? ".motherhen-config.json");
    const configJSON = JSON.parse(await fs.readFile(pathToConfig, { encoding: "utf-8" }));
    const config = configJSON[target];
    if (!isConfiguration(config))
        throw new Error("no configuration found");
    normalize(config.vanilla, "path", pathToConfig);
    normalize(config.integration, "path", pathToConfig);
    normalize(config.integration, "mozconfig", pathToConfig);
    return config;
}
/** Validate a configuration value. */
function isConfiguration(unknownValue) {
    if (typeof unknownValue !== "object")
        return false;
    const value = unknownValue;
    if (typeof value.vanilla !== "object")
        return false;
    if (typeof value.vanilla.path !== "string")
        return false;
    if (typeof value.vanilla.tag !== "string")
        return false;
    if ((value.vanilla.vcs !== "git") && (value.vanilla.vcs !== "hg"))
        return false;
    if (typeof value.integration !== "object")
        return false;
    if (typeof value.integration.path !== "string")
        return false;
    if (typeof value.integration.mozconfig !== "string")
        return false;
    if (typeof value.integration.projectDir !== "string")
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
//# sourceMappingURL=Configuration.mjs.map