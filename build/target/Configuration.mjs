import fs from "fs/promises";
import path from "path";
import url from "url";
const basePath = path.normalize(path.join(url.fileURLToPath(import.meta.url), "../../.."));
export default async function getConfiguration() {
    const target = process.argv[2] ?? "default";
    const pathToConfig = path.join(basePath, process.env["MOTHERHEN_CONFIG"] ?? ".motherhen-config.json");
    const configJSON = JSON.parse(await fs.readFile(pathToConfig, { encoding: "utf-8" }));
    const config = configJSON[target];
    if (!isConfiguration(config))
        throw new Error("no configuration found");
    normalize(config.vanilla, "path", pathToConfig);
    normalize(config.integration, "path", pathToConfig);
    normalize(config.integration, "mozconfig", pathToConfig);
    return config;
}
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
function normalize(base, key, pathToConfig) {
    let value = Reflect.get(base, key);
    value = path.normalize(path.resolve(pathToConfig, "..", value));
    Reflect.set(base, key, value);
}
//# sourceMappingURL=Configuration.mjs.map