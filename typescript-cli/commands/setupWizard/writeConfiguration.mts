import fs from "fs/promises";
import path from "path";
import { replaceHatchedEgg } from "./replaceHatchedEgg.js";

import type {
  WritableConfigurationJSON,
} from "./shared-types.js";
import { removeMotherhenConfig } from "./updateGitIgnore.mjs";

/**
 * Commit all out changes to the real file system!
 *
 * @param pathToFile - the path to the configuration file.
 * @param exists - true if the configuration file exists.
 * @param output - the JSON content to write.
 * @param key - the key name in output we are updating..
 * @param removeGitIgnore - true if we should remove .motherhen-config.json from .gitignore.
 * @param replaceHatchedEggName - the replacement project name, or false if there is no replacement.
 * @param fullPathToMozconfig - an absolute path to the mozconfig file.
 */
export default
async function writeConfiguration(
  pathToFile: string,
  exists: boolean,
  output: WritableConfigurationJSON,
  key: string,
  removeGitIgnore: boolean,
  replaceHatchedEggName: string | false,
  fullPathToMozconfig: string,
) : Promise<void>
{
  if (!exists) {
    await fs.mkdir(
      path.dirname(pathToFile),
      {recursive: true}
    );
  }

  await fs.writeFile(
    pathToFile,
    JSON.stringify(output, null, 2) + "\n",
    { encoding: "utf-8" }
  );

  if (replaceHatchedEggName)
    await replaceHatchedEgg(fullPathToMozconfig, replaceHatchedEggName);

  if (removeGitIgnore)
    await removeMotherhenConfig();

  console.log(`
Your configuration file at ${pathToFile} has been updated!

You should now be able to create your repository with the command:

./cli/motherhen.mjs create --config ${pathToFile}${
  key === "default" ? "" : `--project ${key}`
}
`.trim() + "\n");
}
