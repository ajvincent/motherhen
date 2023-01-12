import pickConfigLocation from "./pickConfigLocation";
import fileExists from "#cli/utilities/fileExists";
import SharedArgumentsTest from "./SharedArguments-test";
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
    let shared;
    if (asTest) {
        const sharedTest = new SharedArgumentsTest(pathToStartDirectory);
        if (await fileExists(configLocation.pathToFile, false))
            await sharedTest.loadConfiguration(configLocation.pathToFile);
        shared = sharedTest;
    }
    else {
        throw new Error("not yet implemented");
    }
    return shared;
}
//# sourceMappingURL=CreateEnvironment.js.map