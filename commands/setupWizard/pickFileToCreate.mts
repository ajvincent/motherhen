import path from "path";

import fileExists from "../tools/fileExists.mjs";
import inquirer from "./inquirer-registration.mjs";
import type {
  PathToFileValidation,
  PathWithUncreatedDirs,
} from "./shared-types.mjs";
import temporaryFS from "./temporaryFS.mjs";

function AcceptFileValidation() : true {
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
 * @param findExistingMessage - a message for the existingDirectory question.
 * @param findFinalFileMessage - a message for the pathToFile question.
 * @param pathToStartDirectory - the starting point for the directory selection.
 * @param defaultPathToFile - a default path from the existing directory.
 * @param uncreatedDirs - an array of directories we haven't created yet.
 * @param pathToFileValidation - an additional validation step.
 * @returns pathToFile - where the file should be on the file system.
 * @returns uncreatedDirs - directories to create on the real file system.
 */
async function pickFileToCreate(
  findExistingMessage: string,
  findFinalFileMessage: string,
  pathToStartDirectory: string,
  defaultPathToFile: string,
  uncreatedDirs: string[] = [],
  pathToFileValidation: PathToFileValidation = AcceptFileValidation,
) : Promise<PathWithUncreatedDirs>
{
  uncreatedDirs = uncreatedDirs.slice();
  uncreatedDirs.sort();

  const {
    existingDirectory,
    pathToFile
  } = await inquirer.prompt<{
    existingDirectory: string,
    pathToFile: string
  }>([
    {
      type: "file-tree-selection",
      name: "existingDirectory",
      message: findExistingMessage,
      onlyShowDir: true,
      default: pathToStartDirectory,
      root,
    },

    {
      type: "input",
      name: "pathToFile",
      message: findFinalFileMessage,
      default: defaultPathToFile,
      validate(pathToFile: string, answers) : true | string
      {
        const { existingDirectory } = answers as { existingDirectory: string };
        const fullPath = path.normalize(path.join(existingDirectory, pathToFile));
        if (!fullPath.startsWith(existingDirectory))
          return "You must choose a path within the existing directory.";
        return pathToFileValidation(pathToFile);
      }
    }
  ]);

  const fullPath = path.normalize(path.join(existingDirectory, pathToFile));
  let directory = path.dirname(fullPath);

  // Create the directories on the temporary file system, under the hope we can use them in future calls.
  await temporaryFS.mkdir(directory, { recursive: true });

  while (!await fileExists(directory, true)) {
    uncreatedDirs.unshift(directory);
    directory = path.dirname(directory);
  }

  uncreatedDirs.sort();

  return {
    pathToFile,
    uncreatedDirs
  };
}

export default pickFileToCreate;
