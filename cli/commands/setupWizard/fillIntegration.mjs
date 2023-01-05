import path from "path";
import inquirer from "./inquirer-registration.mjs";
import pickFileToCreate from "./pickFileToCreate.mjs";
import getProjectDirFromMozconfig from "../tools/projectDirFromMozconfig.mjs";
import projectRoot from "../tools/projectRoot.mjs";
const cleanroom = path.join(projectRoot, ".cleanroom");
/**
 * @param pathToConfig - the Motherhen configuration file path.
 * @param integration - the integration repository configuration.
 * @param uncreatedDirs - the current list of uncreated directories.
 * @returns a new list of uncreated directories.  Vanilla will be up-to-date when this function exits.
 */
export default async function fillIntegration(pathToConfig, pathToVanilla, integration, uncreatedDirs) {
    writeStagePreamble();
    console.log(`Your current integration configuration is:\n${JSON.stringify(integration, null, 2)}\n`);
    let shouldUpdatePath = true;
    if (integration.path) {
        shouldUpdatePath = await maybeShouldUpdatePath();
    }
    if (shouldUpdatePath) {
        uncreatedDirs = await updateIntegrationPath(pathToConfig, pathToVanilla ?? cleanroom, integration, uncreatedDirs.slice());
    }
    await maybeUpdateMozconfig(integration);
    await getProjectDirFromMozconfig(integration);
    return uncreatedDirs;
}
function writeStagePreamble() {
    console.log(`
Now I will configure the settings for the integration repository.

This requires a path to a directory which is neither an ancestor nor a descendant nor the same as the vanilla path.
`.trim() + "\n");
}
/**
 * Ask the user what they want to do with the vanilla repository setting.
 * @returns true if the user wants to specify a new vanilla repository.
 */
async function maybeShouldUpdatePath() {
    const result = await inquirer.prompt([
        {
            type: "confirm",
            name: "shouldUpdateIntegrationPath",
            message: `Do you want to change your integration repository location?`,
            default: false,
        }
    ]);
    return result.shouldUpdateIntegrationPath;
}
/**
 * @param pathToConfig - the absolute path to the proposed configuration file.
 * @param pathToVanilla - where the vanilla configuration lives.
 * @param integration - the current integration configuration.
 * @param dirs - the current list of uncreated directories.
 * @returns the updated list of uncreated directories.
 */
async function updateIntegrationPath(pathToConfig, pathToVanilla, integration, dirs) {
    const { pathToFile, uncreatedDirs } = await pickFileToCreate({
        findExistingMessage: "Please choose an existing directory which will contain (as an ancestor) the integration repository.",
        pathToStartDirectory: path.dirname(pathToConfig),
        findFinalFileMessage: "Please enter a relative path from this directory to the integration repository.",
        defaultPathToFile: "",
        pathToFileValidation: (pathToFile) => {
            if (hasAncestor(pathToFile, pathToVanilla))
                return "Vanilla repository cannot be an ancestor of the integration repository.";
            if (hasAncestor(pathToVanilla, pathToFile))
                return "Integration repository cannot be an ancestor of the vanilla repository.";
            return true;
        },
        uncreatedDirs: dirs.slice(),
    });
    integration.path = pathToFile;
    return uncreatedDirs;
}
/**
 * Ask the user about a new mozconfig location, if the user wants it, or if we need it.
 * @param integration - the current integration configuration.
 */
async function maybeUpdateMozconfig(integration) {
    if (integration.mozconfig) {
        const { shouldUpdateMozconfig } = await inquirer.prompt({
            name: "shouldUpdateMozconfig",
            type: "confirm",
            message: "Do you want to update the mozconfig file's location?",
            default: false,
        });
        if (!shouldUpdateMozconfig) {
            return;
        }
    }
    const { pathToMozconfig } = await inquirer.prompt({
        name: "pathToMozconfig",
        type: "file-tree-selection",
        message: "Please choose the mozconfig file's location.",
        default: integration.mozconfig || projectRoot,
    });
    integration.mozconfig = pathToMozconfig;
}
function hasAncestor(dirPath, ancestorPath) {
    while (dirPath.length >= ancestorPath.length) {
        if (dirPath === ancestorPath)
            return true;
        dirPath = path.dirname(dirPath);
    }
    return false;
}
//# sourceMappingURL=fillIntegration.mjs.map