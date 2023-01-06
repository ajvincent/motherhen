import inquirer from "./inquirer-registration.js";
import relativePathConfig from "./relativePathConfig.js";
/**
 * Convert absolute paths to relative ones, and confirm the configuration with the user.
 * @param pathToConfig - the path to the user's configuration.
 * @param output - the full file output.
 * @param keyName - the project key.
 * @returns true if the user has confirmed their configuration.
 */
export default async function confirmSettings(pathToConfig, output, keyName) {
    output[keyName] = relativePathConfig(pathToConfig, output[keyName]);
    console.log(`I am about to write to "${pathToConfig}" a Motherhen configuration with the key name ${JSON.stringify(keyName)}:\n`);
    console.log(JSON.stringify(output[keyName], null, 2));
    const { confirmWrite } = await inquirer.prompt({
        name: "confirmWrite",
        type: "confirm",
        message: "Do you want to proceed?",
        default: false
    });
    return confirmWrite;
}
//# sourceMappingURL=confirmSettings.js.map