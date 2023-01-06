#!/usr/bin/env node

/**
 * @remarks
 *
 * Almost every command uses the same program options to get a `Configuration`,
 * and then uses the configuration to refer to a specific integration project.
 *
 * Individual command modules live in commands/* .
 */

//#region preamble
import fs from "fs/promises";
import path from "path";

import { Command } from 'commander';

import getConfiguration, {
  type Configuration,
} from "./commands/tools/Configuration.mjs";

import getModuleDefault from "./commands/tools/getModuleDefault.mjs";
import projectRoot from "./commands/tools/projectRoot.js";

import type { CommandSettings } from "./commands/tools/CommandSettings-type.js";

type CommandModule = (
  config: Configuration,
  settings: CommandSettings,
  userArgs: string[],
) => Promise<void>;
// #endregion preamble

//#region main program
const { version } = JSON.parse(await fs.readFile(
  path.join(projectRoot, "package.json"),
  { encoding: "utf-8" }
)) as { version: string };

const program = new Command();

program
  .name("Motherhen")
  .description("New applications using Mozilla source code and infrastructure")
  .option(
    "--config [config]",
    "The relative path to the Motherhen configuration.",
    ".motherhen-config.json"
  )
  .option(
    "--project [project]",
    "The project to use from the Motherhen configuration.",
    "default"
  )
  .version(version);

program
  .command("setup")
  .description("Create or edit an existing Motherhen configuration.")
  .action(async () => {
    const setupMotherhen = await getModuleDefault<
      () => Promise<void>
    >(path.join(projectRoot, "cli/commands/setup.mjs"));
    await setupMotherhen();
  });

bindCommand("create", "Create a Mozilla repository.");
bindCommand("where",  "Show where the Mozilla repository should be.");
bindCommand("mach",   `Invoke mach in the Mozilla repository.`);

//#endregion main program

await program.parseAsync();

//#region command-handling functions
/**
 * Get a function to execute a given command for command-line arguments.
 * @param commandName - the command name to invoke.
 * @param description - the description for the command.
 * @returns - a function to run on the given command.
 */
function bindCommand(
  commandName: string,
  description: string,
) : void
{
  program
    .command(commandName)
    .description(description)
    .action(async (garbage, parsedCommand : { args: string[] })  => {
      void(garbage);

      const options = program.opts();
      const settings: CommandSettings = {
        relativePathToConfig: options.config as string,
        project: options.project as string
      };

      const configuration = await getConfiguration(settings);
      const command = await getCommandDefault<CommandModule>(commandName);
      await command(configuration, settings, parsedCommand.args);
    });
}

/**
 * Get the default export from a command module.
 * @param commandName - the command, also matching `./build/${commandName}.mjs`.
 * @returns the default export.
 */
async function getCommandDefault<T>(commandName: string) : Promise<T>
{
  return getModuleDefault<T>(path.join(
    projectRoot, "cli/commands", commandName + ".mjs"
  ));
}
// #endregion command-handling functions
