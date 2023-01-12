import pickFileToCreate from "./pickFileToCreate";
/**
 * Ask the user to give us a location for the Motherhen configuration file.
 * @returns pathToFile - where the configuration file should be.
 * @returns uncreatedDirs - directories to create on the real file system.
 */
export default async function pickConfigLocation(inquirer, pathToStartDirectory) {
    console.log("\n" + `
First, I need to find an existing Motherhen configuration file, or a location
to create one.  Don't worry about the files and directories not existing: this
will only edit or create the Motherhen configuration file, and only at the end
of this process.  Instead, I'll ask you to provide an existing directory, and
then a relative path from this directory to the configuration file, even if
intermediate directories do not exist.
`.trim());
    return pickFileToCreate(inquirer, {
        findExistingMessage: "Please choose an existing directory which will contain (as an ancestor) your configuration file.",
        findFinalFileMessage: "Please enter a relative path from this directory to the Motherhen configuration file.",
        pathToStartDirectory,
        defaultPathToFile: ".motherhen-config.json",
    });
}
//# sourceMappingURL=pickConfigLocation.js.map