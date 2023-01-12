import fs from "fs/promises";
import PathResolver from "#cli/configuration/PathResolver";
import FSQueue from "#cli/configuration/FileSystemQueue";
import ConfigFileFormat from "../json/ConfigFileFormat";
export default class SharedArgumentsImpl {
    /**
     * Build a SharedArguments instance.
     * @param inquirer - the prompting service to use.
     * @param pathToDirectory - the directory the project configuration lives in.
     * @param relativePathToConfig - if provided, the path to the configuration file.
     */
    static async build(inquirer, pathToDirectory, relativePathToConfig) {
        const config = new SharedArgumentsImpl(inquirer, pathToDirectory);
        if (relativePathToConfig) {
            await config.#loadConfiguration(relativePathToConfig);
        }
        return config;
    }
    // #region SharedArguments
    pathResolver;
    fsQueue;
    get configuration() {
        return this.#configuration;
    }
    inquirer;
    postSetupMessages = [];
    // #endregion SharedArguments
    #configuration;
    constructor(inquirer, pathToTempDirectory) {
        const useAbsoluteProperty = new PathResolver.UseAbsolute(pathToTempDirectory, false);
        this.pathResolver = new PathResolver(useAbsoluteProperty, false, "");
        this.fsQueue = new FSQueue(this.pathResolver);
        this.#configuration = ConfigFileFormat.fromJSON(this.pathResolver, ConfigFileFormat.blank());
        this.inquirer = inquirer;
    }
    #hasAttemptedLoad = false;
    async #loadConfiguration(pathToConfiguration) {
        if (this.#hasAttemptedLoad)
            throw new Error("has attempted load");
        this.#hasAttemptedLoad = true;
        const pathResolver = this.pathResolver.clone();
        pathResolver.setPath(false, pathToConfiguration);
        const fullPath = pathResolver.getPath(true);
        const contentsAsString = await fs.readFile(fullPath, { encoding: "utf-8" });
        const serialized = JSON.parse(contentsAsString);
        if (!ConfigFileFormat.isJSON(serialized))
            throw new Error("configuration file doesn't match the format");
        this.#configuration = ConfigFileFormat.fromJSON(this.pathResolver, serialized);
    }
}
//# sourceMappingURL=SharedArguments.js.map