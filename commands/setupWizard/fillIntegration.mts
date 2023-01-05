import fs from "fs/promises";
import path from "path";
import url from "url";

import fileExists from "../tools/fileExists.mjs";

import inquirer from "./inquirer-registration.mjs";
import pickFileToCreate from "./pickFileToCreate.mjs";
import type {
  WritableConfigurationType,
} from "./shared-types.mjs";

const projectRoot = path.normalize(path.join(
  url.fileURLToPath(import.meta.url), "../../.."
));
const cleanroom = path.join(projectRoot, ".cleanroom");

/**
 * @param pathToConfig - the Motherhen configuration file path.
 * @param integration - the integration repository configuration.
 * @param uncreatedDirs - the current list of uncreated directories.
 * @returns a new list of uncreated directories.  Vanilla will be up-to-date when this function exits.
 */
export default
async function fillIntegration(
  pathToConfig: string,
  pathToVanilla: string | undefined,
  integration: WritableConfigurationType["integration"],
  uncreatedDirs: string[],
) : Promise<string[]>
{
  writeStagePreamble();
  console.log(`Your current integration configuration is:\n${JSON.stringify(integration, null, 2)}\n`);

  let shouldUpdatePath = true;
  if (integration.path) {
    shouldUpdatePath = await maybeShouldUpdatePath();
  }

  if (shouldUpdatePath) {
    uncreatedDirs = await updateIntegrationPath(
      pathToConfig,
      pathToVanilla ?? cleanroom,
      integration,
      uncreatedDirs.slice()
    );
  }

  await maybeUpdateMozconfig(integration);
  await maybeUpdateProjectDir(
    integration, pathToVanilla ?? path.join(cleanroom, "mozilla-unified"));

  return uncreatedDirs;
}

function writeStagePreamble() : void
{
  console.log(`
Now I will configure the settings for the integration repository.

This requires a path to a directory which is neither an ancestor nor a descendant nor the same as the vanilla path.
`.trim() + "\n");
}

/**
 * Ask the user what they want to do with the vanilla repository setting.
 * @returns true if the user wants to specify a new vanilla repository.
 */
async function maybeShouldUpdatePath() : Promise<boolean>
{
  const result: { shouldUpdateIntegrationPath : boolean } = await inquirer.prompt<{
    shouldUpdateIntegrationPath: boolean
  }>
  ([
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
async function updateIntegrationPath(
  pathToConfig: string,
  pathToVanilla: string,
  integration: WritableConfigurationType["integration"],
  dirs: ReadonlyArray<string>,
) : Promise<string[]>
{
  const { pathToFile, uncreatedDirs } = await pickFileToCreate({
    findExistingMessage: "Please choose an existing directory which will contain (as an ancestor) the integration repository.",
    pathToStartDirectory: path.dirname(pathToConfig),

    findFinalFileMessage: "Please enter a relative path from this directory to the integration repository.",
    defaultPathToFile: "",

    pathToFileValidation: (pathToFile: string) : true | string => {
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
async function maybeUpdateMozconfig(
  integration: WritableConfigurationType["integration"]
) : Promise<void>
{
  if (integration.mozconfig) {
    const { shouldUpdateMozconfig } = await inquirer.prompt<{
      shouldUpdateMozconfig: boolean
    }>
    (
      {
        name: "shouldUpdateMozconfig",
        type: "confirm",
        message: "Do you want to update the mozconfig file's location?",
        default: false,
      }
    );

    if (!shouldUpdateMozconfig) {
      return;
    }
  }

  const { pathToMozconfig } = await inquirer.prompt<{
    pathToMozconfig: string
  }>
  (
    {
      name: "pathToMozconfig",
      type: "file-tree-selection",
      message: "Please choose the mozconfig file's location.",
      default: integration.mozconfig || projectRoot,
    }
  );

  integration.mozconfig = pathToMozconfig;
}

/**
 * Update the project directory setting as the user wishes.
 * @param integration - the current integration configuration.
 * @param pathToCleanRepo - where the cleanroom repository lives.
 */
async function maybeUpdateProjectDir(
  integration: WritableConfigurationType["integration"],
  pathToCleanRepo: string,
) : Promise<void>
{
  if (integration.projectDir) {
    const { shouldUpdateProjectDir } = await inquirer.prompt<{
      shouldUpdateProjectDir: boolean
    }>
    (
      {
        name: "shouldUpdateProjectDir",
        type: "confirm",
        message: "Do you want to update the project directory?",
        default: false,
      }
    );

    if (!shouldUpdateProjectDir) {
      return;
    }
  }

  console.log("You must select a project directory name.  It must not be a current child of the upstream Mozilla repository's root!");

  let exclusions: Set<string>;
  if (await fileExists(pathToCleanRepo, true)) {
    const items = await fs.readdir(pathToCleanRepo);
    exclusions = new Set(items);
    console.log(`Here is the list of excluded entries:`, items.join(", "));
  }
  else
    exclusions = new Set;

  const { projectDir } = await inquirer.prompt<{
    projectDir: string
  }>
  (
    {
      name: "projectDir",
      type: "input",
      message: "Please enter a directory name to add as the project directory.",
      validate(projectDir: string) : true | string {
        if (exclusions.has(projectDir))
          return "You cannot choose a directory which already exists as a child of the Mozilla root!";
        return true;
      }
    }
  );

  integration.projectDir = projectDir;
}

function hasAncestor(
  dirPath: string, ancestorPath: string
) : boolean
{
  while (dirPath.length >= ancestorPath.length) {
    if (dirPath === ancestorPath)
      return true;
    dirPath = path.dirname(dirPath);
  }

  return false;
}
