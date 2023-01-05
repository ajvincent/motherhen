import fs from "fs/promises";
import path from "path";

import type {
  PathWithUncreatedDirs,
  WritableConfigurationJSON,
  WritableConfigurationType,
} from "./shared-types.mjs";

export async function fillVanilla(
  vanilla: WritableConfigurationType["vanilla"],
  uncreatedDirs: string[],
) : Promise<PathWithUncreatedDirs>
{
  void(vanilla);
  void(uncreatedDirs);
  return Promise.reject("not yet implemented");
}

export async function fillIntegration(
  integration: WritableConfigurationType["integration"],
  uncreatedDirs: string[],
) : Promise<PathWithUncreatedDirs>
{
  void(integration);
  void(uncreatedDirs);
  return Promise.reject("not yet implemented");
}

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
