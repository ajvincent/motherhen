import type {
  PartialInquirer,
  SharedArguments
} from "./shared-types.js";

import pickConfigLocation from "./pickConfigLocation.js";
import fileExists from "#cli/utilities/fileExists.js";
import SharedArgumentsImpl from "./SharedArguments.js";

/**
 * Create shared arguments for use in other wizard modules.
 *
 * @param inquirer - the prompting system to use.
 * @param pathToStartDirectory - the start directory for configurations.
 */
export default async function CreateEnvironment(
  inquirer: PartialInquirer,
  pathToStartDirectory: string,
  suppressConsole = false,
) : Promise<SharedArguments>
{
  const configLocation = await pickConfigLocation(
    inquirer, pathToStartDirectory, suppressConsole
  );

  const configExists = await fileExists(configLocation.pathToFile, false);
  const shared = await SharedArgumentsImpl.build(
    inquirer,
    pathToStartDirectory,
    suppressConsole,
    configExists ? configLocation.pathToFile : ""
  );

  return shared;
}
