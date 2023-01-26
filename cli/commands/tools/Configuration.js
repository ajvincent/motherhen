import fs from "fs/promises";
import path from "path";
import projectRoot from "#cli/utilities/projectRoot.js";
import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
import ConfigurationSummary from "#cli/configuration/version-1.0/json/Summary.js";
import PathResolver from "#cli/configuration/PathResolver.js";
/**
 * Get the configuration.
 * @param settings - the command-line settings from motherhen.mts.
 *
 * @returns a configuration with absolute paths.
 */
async function getConfiguration(settings) {
    const { project, isFirefox, relativePathToConfig } = settings;
    const pathToConfig = path.resolve(projectRoot, relativePathToConfig);
    const baseDir = path.dirname(pathToConfig);
    const useAbsoluteProperty = new PathResolver.UseAbsolute(baseDir, false);
    const resolver = new PathResolver(useAbsoluteProperty, true, baseDir);
    let configJSON;
    try {
        configJSON = JSON.parse(await fs.readFile(pathToConfig, { encoding: "utf-8" }));
    }
    catch (ex) {
        console.error(`I couldn't find a JSON file at ${pathToConfig}!  (Did you forget the --config option?)`);
        throw ex;
    }
    if (!ConfigFileFormat.isJSON(configJSON)) {
        throw new Error(`incompatible configuration file format at ${pathToConfig}.  Try running the setup command again.`);
    }
    return ConfigurationSummary(ConfigFileFormat.fromJSON(resolver, configJSON), project, isFirefox, false);
}
export default getConfiguration;
//# sourceMappingURL=Configuration.js.map