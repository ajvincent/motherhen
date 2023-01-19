import { ChooseTasksResults, SharedArguments } from "#cli/configuration/version-1.0/wizard/shared-types";
import SharedArgumentsImpl from "#cli/configuration/version-1.0/wizard/SharedArguments.js";
import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
import FakeInquirer from "#cli/utilities/FakeInquirer.js";
import { TempDirWithCleanupType } from "#cli/utilities/TempDirWithCleanup.js";

type SharedAndTasks = {
  sharedArguments: SharedArguments;
  chooseTasks: ChooseTasksResults;
}

/**
 * Set up the `sharedArguments` and `chooseTasks` variables for a test run.
 * @param inquirer - the fake inquirer.
 * @param temp - the temporary directory owner.
 * @param useConfigFile - true if we should use a Motherhen configuration file which we assume exists.
 */
export default async function setupSharedAndTasks(
  inquirer: FakeInquirer,
  temp: TempDirWithCleanupType,
  useConfigFile: boolean
) : Promise<SharedAndTasks>
{
  const sharedArguments = await SharedArgumentsImpl.build(
    inquirer,
    temp.tempDir,
    true,
    useConfigFile ? ".motherhen-config.json" : ""
  );

  const chooseTasks: ChooseTasksResults = {
    quickStart: false,
    isFirefox: false,
    currentProjectKey: "(default)",
    newProjectKey: "(default)",
    action: "create",
    userConfirmed: false,
    newConfigurationParts: ConfigFileFormat.fromJSON(
      sharedArguments.pathResolver,
      ConfigFileFormat.blank()
    ),
    copyExistingParts: new Set,
  };

  return { sharedArguments, chooseTasks };
}
