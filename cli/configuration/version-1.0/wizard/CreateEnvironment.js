import path from "path";
import pickConfigLocation from "./pickConfigLocation.js";
import fileExists from "#cli/utilities/fileExists.js";
import SharedArgumentsImpl from "./SharedArguments.js";
/**
 * Create shared arguments for use in other wizard modules.
 *
 * @param inquirer - the prompting system to use.
 * @param pathToStartDirectory - the start directory for configurations.
 */
export default async function CreateEnvironment(inquirer, pathToStartDirectory, suppressConsole = false) {
    const configLocation = await pickConfigLocation(inquirer, pathToStartDirectory, suppressConsole);
    const configExists = await fileExists(configLocation.pathToFile, false);
    const shared = await SharedArgumentsImpl.build(inquirer, path.dirname(configLocation.pathToFile), suppressConsole, configExists ? configLocation.pathToFile : "");
    return shared;
}
//# sourceMappingURL=CreateEnvironment.js.map