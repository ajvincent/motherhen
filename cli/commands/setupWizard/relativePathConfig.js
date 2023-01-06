import path from "path";
/**
 * Convert absolute file paths to relative file paths.
 * @param pathToConfig - The path to the configuration file.
 * @param absConfig -
 * @returns the equivalent configuration with relative file paths.
 */
export default function relativePathConfig(pathToConfig, absConfig) {
    const pathToProject = path.dirname(pathToConfig);
    const vanilla = {
        tag: absConfig.vanilla.tag
    };
    if (absConfig.vanilla.path)
        vanilla.path = path.relative(pathToProject, absConfig.vanilla.path);
    const integration = {
        path: path.relative(pathToProject, absConfig.integration.path),
        mozconfig: path.relative(pathToProject, absConfig.integration.mozconfig),
    };
    return { vanilla, integration };
}
//# sourceMappingURL=relativePathConfig.js.map