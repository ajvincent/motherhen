import pickConfigLocation from "./pickConfigLocation";
import fileExists from "#cli/utilities/fileExists";
import SharedArgumentsImpl from "./SharedArguments";
/**
 * Create shared arguments for use in other wizard modules.
 *
 * @param inquirer - the prompting system to use.
 * @param pathToStartDirectory - the start directory for configurations.
 * @param asTest - true if this is a test run.
 */
export default async function CreateEnvironment(inquirer, pathToStartDirectory, asTest) {
    if (!asTest) {
        throw new Error("not yet implemented");
    }
    const configLocation = await pickConfigLocation(inquirer, pathToStartDirectory);
    const configExists = await fileExists(configLocation.pathToFile, false);
    const shared = await SharedArgumentsImpl.build(inquirer, pathToStartDirectory, configExists ? configLocation.pathToFile : "");
    return shared;
}
//# sourceMappingURL=CreateEnvironment.js.map