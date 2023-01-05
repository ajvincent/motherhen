import path from "path";

import inquirer from "./inquirer-registration.mjs";
import pickFileToCreate from "./pickFileToCreate.mjs";
import type {
  WritableConfigurationType,
} from "./shared-types.mjs";

/**
 * @param pathToConfig - the Motherhen configuration file path.
 * @param vanilla - the vanilla repository configuration.
 * @param uncreatedDirs - the current list of uncreated directories.
 * @returns a new list of uncreated directories.  Vanilla will be up-to-date when this function exits.
 */
export default
async function fillVanilla(
  pathToConfig: string,
  vanilla: WritableConfigurationType["vanilla"],
  uncreatedDirs: string[],
) : Promise<string[]>
{
  writeStagePreamble();
  console.log(`Your current vanilla configuration is:\n${JSON.stringify(vanilla, null, 2)}\n`);

  let shouldUpdateVanillaPath: boolean;
  if (vanilla.path) {
    shouldUpdateVanillaPath = await maybeShouldUpdateVanillaPath(vanilla);
  }
  else {
    shouldUpdateVanillaPath = await maybeShouldSetPath();
  }

  if (shouldUpdateVanillaPath) {
    uncreatedDirs = await updateVanillaPath(
      pathToConfig, vanilla, uncreatedDirs
    );
  }

  await updateTagAndVCS(vanilla);
  return uncreatedDirs;
}

function writeStagePreamble() : void
{
  console.log(`
Motherhen uses two local copies of a repository:  a "vanilla" repository from
mozilla-unified which Motherhen treats as a non-modified Mozilla repository,
and an "integration" repository which adds your project's subdirectory to the
Mozilla code.

In this stage, I will configure the settings for the vanilla repository.

To promote clean code (and cloning speed), Motherhen has a subdirectory,
.cleanroom, which git ignores.  By default, Motherhen will place your vanilla
repository in this directory.  You may specify another path, which I strongly
recommend against.  The cleanroom represents code I can directly update from
mozilla-unified on any call to create a project, from any valid tag or bookmark.

Try looking up https://hg.mozilla.org/mozilla-unified/bookmarks for valid tags.
`.trim() + "\n");
}

/**
 * Ask the user what they want to do with the vanilla repository setting.
 * @returns true if the user wants to specify a new vanilla repository.
 */
async function maybeShouldUpdateVanillaPath(
  vanilla: WritableConfigurationType["vanilla"]
) : Promise<boolean>
{
  const clearIt = "Clear it (use the cleanroom)";

  const { vanillaPathUpdate } = await inquirer.prompt<{
    vanillaPathUpdate: string
  }>
  ([
    {
      type: "list",
      name: "vanillaPathUpdate",
      message: "What should I do with the vanilla repository location setting?",
      choices: [
        "Nothing",
        "Change it",
        clearIt
      ],
    }
  ]);

  if (vanillaPathUpdate === clearIt)
    delete vanilla.path;

  return vanillaPathUpdate === "Change it";
}

/**
 * Ask the user if they want to set a vanilla repository.
 * @returns true if the user wants to specify a vanilla repository.
 */
async function maybeShouldSetPath() : Promise<boolean>
{
  const result: { shouldUpdateVanillaPath : boolean } = await inquirer.prompt<{
    shouldUpdateVanillaPath: boolean
  }>
  ([
    {
      type: "confirm",
      name: "shouldUpdateVanillaPath",
      message: `Do you want to set your vanilla repository location?`,
      default: false,
    }
  ]);

  return result.shouldUpdateVanillaPath;
}

/**
 * @param pathToConfig - the absolute path to the proposed configuration file.
 * @param vanilla - the current vanilla configuration.
 * @param dirs - the current list of uncreated directories.
 * @returns the updated list of uncreated directories.
 */
async function updateVanillaPath(
  pathToConfig: string,
  vanilla: WritableConfigurationType["vanilla"],
  dirs: string[],
) : Promise<string[]>
{
  const { pathToFile, uncreatedDirs } = await pickFileToCreate({
    findExistingMessage: "Please choose an existing directory which will contain (as an ancestor) the vanilla repository.",
    findFinalFileMessage: "Please enter a relative path from this directory to the vanilla repository.",
    pathToStartDirectory: path.dirname(pathToConfig),
    defaultPathToFile: "",
    uncreatedDirs: dirs,
  });

  vanilla.path = pathToFile;
  return uncreatedDirs;
}

/**
 * Update the tag and vcs properties of the configuration.
 * @param vanilla - the current vanilla configuration.
 */
async function updateTagAndVCS(
  vanilla: WritableConfigurationType["vanilla"]
) : Promise<void>
{
  const { tag, vcs } = await inquirer.prompt<{
    tag: string,
    vcs: "git" | "hg",
  }>
  ([
    {
      type: "input",
      name: "tag",
      message: "What repository tag should I use?",
      default: vanilla.tag,
      validate(tag: string) : true | string
      {
        if (tag.trim() === "")
          return `You cannot use an empty string.  I recommend "central", "release", "esr" or "beta".`;
        return true;
      }
    },

    {
      type: "list",
      name: "vcs",
      message: "What version-control system should I use to clone the vanilla repository?",
      default: "hg",
      choices: [
        /*
        "git",
        */
        "hg",
      ],
    }
  ]);

  vanilla.tag = tag.trim();
  vanilla.vcs = vcs;
}
