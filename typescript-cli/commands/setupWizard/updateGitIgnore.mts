import path from "path";
import fs from "fs/promises";

import projectRoot from "../tools/projectRoot.js";
import inquirer from "./inquirer-registration.js";

const gitignorePath = path.join(projectRoot, ".gitignore");
const defaultConfigPath = path.join(projectRoot, ".motherhen-config.json");

export async function maybeUpdateGitIgnore(
  pathToFile : string
) : Promise<boolean>
{
  if (pathToFile !== defaultConfigPath)
    return false;

  console.log(`
You've chosen to create this repository's .motherhen-config.json file.  By
default, Motherhen's .gitignore file keeps this file from appearing in your git
changes log.  This is for development purposes of Motherhen itself, but you may
wish to override this setting for your repository.
`.trim() + "\n");

  const { shouldUpdateGitIgnore } = await inquirer.prompt<{
    shouldUpdateGitIgnore: boolean
  }>
  (
    {
      name: "shouldUpdateGitIgnore",
      type: "confirm",
      message: "Should we remove .motherhen-config.json from this repository's .gitignore file?",
      default: false,
    }
  );

  return shouldUpdateGitIgnore;
}

export async function removeMotherhenConfig() : Promise<void>
{
  // Nothing fancy, in and out.
  await fs.appendFile(
    gitignorePath,
    "\n" + `
# Disabled per user request.
!.motherhen-config.json
    `.trim() + "\n",
    { encoding: "utf-8" }
  )
}
