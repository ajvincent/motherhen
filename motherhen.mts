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
import url from "url";

import { Command } from 'commander';

import getConfiguration, {
  type Configuration,
} from "./commands/tools/Configuration.mjs";

export type CommandSettings = {
  relativePathToConfig: string,
  project: string
};

type CommandModule = (
  config: Configuration,
  settings: CommandSettings,
) => Promise<void>;
// #endregion preamble

//#region main program
const { version } = JSON.parse(await fs.readFile(
  path.join(url.fileURLToPath(import.meta.url), "../package.json"),
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

bindCommand("create", "Create a Mozilla repository.");
bindCommand("where",  "Show where the Mozilla repository should be.");

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
    .action(async () => {
      const options = program.opts();
      const settings: CommandSettings = {
        relativePathToConfig: options.config as string,
        project: options.project as string
      };

      const configuration = await getConfiguration(settings);
      const command = await getCommandDefault<CommandModule>(commandName);
      await command(configuration, settings);
    });
}

/**
 * Get the default export from a command module.
 * @param commandName - the command, also matching `./build/${commandName}.mjs`.
 * @returns the default export.
 */
async function getCommandDefault<T>(commandName: string) : Promise<T>
{
  type DefaultModule = { default: T };

  const module = await import(path.resolve(
    url.fileURLToPath(import.meta.url),
    "../commands",
    commandName + ".mjs"
  )) as DefaultModule;

  return module.default;
}
// #endregion command-handling functions
