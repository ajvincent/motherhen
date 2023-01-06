import path from "path";
import fs from "fs/promises";

import replaceInFilePkg from "replace-in-file";
const { replaceInFile } = replaceInFilePkg;

import fileExists from "../tools/fileExists.js";
import inquirer from "./inquirer-registration.mjs";
import projectRoot from "../tools/projectRoot.js";
import type {
  WritableConfigurationType
} from "./shared-types.mjs";

/**
 * Ask the user if we should replace the "hatchedegg" name.
 * @param integration - the integration repository configuration.
 * @param pathToVanilla - where the vanilla configuration lives.
 * @returns the replacement name, or false if there is no replacement.
 */
export async function shouldReplaceHatchedEgg(
  integration: WritableConfigurationType["integration"],
  pathToVanilla: string,
) : Promise<false | string>
{
  console.log(`
Your mozconfig at ${integration.mozconfig} uses a project name of "hatchedegg".
Motherhen reserves this name in its original repository, to use in testing.
You should provide a different project name.  You may continue to use
"hatchedegg", but I strongly recommend against it.

If you give me a new project name, I will rewrite the source directory's
references and your mozconfig file to use the new name.
  `.trim() + "\n");

  let directoriesInUse = new Set<string>;
  if (await fileExists(pathToVanilla)) {
    const dirList = await fs.readdir(pathToVanilla);
    dirList.sort();
    console.log("The vanilla repository has these directory names, which you cannot use:");
    console.log(dirList);
    directoriesInUse = new Set(dirList);
  }

  let { newProjectName } = await inquirer.prompt<{
    newProjectName: string
  }>
  ([
    {
      type: "input",
      name: "newProjectName",
      message: "What project name should I use?",
      default: "hatchedegg",
      validate(newProjectName: string) : string | true
      {
        newProjectName = newProjectName.trim();
        if ((newProjectName === "") || newProjectName.includes(path.sep))
          return "Please give me a real directory name immediately under the Mozilla repository.";
        if (directoriesInUse.has(newProjectName))
          return "This directory name is in use by your vanilla repository."
        return true;
      }
    }
  ]);

  newProjectName = newProjectName.trim();
  return newProjectName === "hatchedegg" ? false : newProjectName;
}

/**
 * Replace the project name "hatchedegg" with a new name.
 * @param fullPathToMozconfig - the location of the mozconfig file.
 * @param replaceHatchedEggName - the new name to use.
 */
export async function replaceHatchedEgg(
  fullPathToMozconfig: string,
  replaceHatchedEggName: string,
) : Promise<void>
{
  await replaceInFile({
    files: path.join(projectRoot, "source/**/*"),
    from: /hatchedegg/gm,
    to: replaceHatchedEggName
  });

  await replaceInFile({
    files: fullPathToMozconfig,
    from: /hatchedegg/gm,
    to: replaceHatchedEggName
  });
}
