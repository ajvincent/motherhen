import path from "path";
import fileExists from "#cli/utilities/fileExists.js";
function AcceptFileValidation() {
    return true;
}
let root = process.cwd();
{
    let parentDir = root;
    do {
        root = parentDir;
        parentDir = path.dirname(root);
    } while (root !== parentDir);
}
/**
 * Pick a file to create, in two stages: an existing directory, and a path within that directory.
 *
 * @returns pathToFile - where the file should be on the file system.
 * @returns uncreatedDirs - directories to create on the real file system.
 */
async function pickFileToCreate(inquirer, params) {
    const { findExistingMessage, findFinalFileMessage, pathToStartDirectory, defaultPathToFile, uncreatedDirs: dirs = [], pathToFileValidation = AcceptFileValidation, pathToDirValidation = AcceptFileValidation, } = params;
    const uncreatedDirs = dirs.slice();
    uncreatedDirs.sort();
    const { existingDirectory, pathToFile, } = await inquirer.prompt([
        {
            type: "file-tree-selection",
            name: "existingDirectory",
            message: findExistingMessage,
            onlyShowDir: true,
            default: pathToStartDirectory,
            root,
            validate: pathToDirValidation,
        },
        {
            type: "input",
            name: "pathToFile",
            message: findFinalFileMessage,
            default: defaultPathToFile,
            validate(pathToFile, answers) {
                const { existingDirectory } = answers;
                const fullPath = path.normalize(path.resolve(existingDirectory, pathToFile));
                if (!(fullPath + path.sep).startsWith(existingDirectory))
                    return "You must choose a path within the existing directory.";
                return pathToFileValidation(pathToFile);
            }
        }
    ]);
    const fullPath = path.normalize(path.join(existingDirectory, pathToFile));
    let directory = path.dirname(fullPath);
    while (!await fileExists(directory, true)) {
        uncreatedDirs.unshift(directory);
        directory = path.dirname(directory);
    }
    uncreatedDirs.sort();
    return {
        pathToFile: path.normalize(path.resolve(existingDirectory, pathToFile)),
        uncreatedDirs
    };
}
export default pickFileToCreate;
//# sourceMappingURL=pickFileToCreate.js.map