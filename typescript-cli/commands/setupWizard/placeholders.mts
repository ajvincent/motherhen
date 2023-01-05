import fs from "fs/promises";
import path from "path";

import type {
  WritableConfigurationJSON,
} from "./shared-types.mjs";

export async function maybeUpdateGitIgnore(
  pathToFile : string
) : Promise<boolean>
{
  void(pathToFile);
  await Promise.reject("not yet implemented");
  return false;
}

export async function confirmChoice(
  output: WritableConfigurationJSON,
  keyName: string
) : Promise<boolean>
{
  void(output);
  void(keyName);
  return Promise.reject("not yet implemented");
}

export async function writeConfigurationFile(
  pathToFile: string,
  exists: boolean,
  output: WritableConfigurationJSON,
  removeGitIgnore: boolean,
) : Promise<void>
{
  void(removeGitIgnore);
  await Promise.reject("removeGitIgnore not yet implemented");

  if (!exists) {
    await fs.mkdir(
      path.dirname(pathToFile),
      {recursive: true}
    );
  }

  await fs.writeFile(
    pathToFile,
    JSON.stringify(output, null, 2),
    { encoding: "utf-8" }
  );

  console.log(`Your configuration file at ${pathToFile} has been updated!`);
}
