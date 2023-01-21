// #region preamble

import projectRoot from "#cli/utilities/projectRoot.js";
import RealInquirer, { InterruptedPrompt } from "#cli/utilities/inquirer-registration.js";

import Driver, {
  type DriverArguments
} from "#cli/configuration/version-1.0/wizard/Driver.js";

// #endregion preamble

/**
 * This function drives the set-up of a Motherhen configuration file.
 * It does _not_ create the repositories, build or run the Mozilla-based
 * application.  That is create.js's job.  This builds out the
 * configurations which the create module uses, based on user inputs
 * through Inquirer's text prompting and a couple of really nice plugins
 * to Inquirer.
 */
export default async function setupMotherhen() : Promise<void>
{
  console.log(
    `
This wizard will walk you through the process of crafting a Motherhen configuration file.
You may abort the process at any time by pressing the ESC key.
    `.trim() + "\n"
  );

  const driverArgs: DriverArguments = {
    workingDirectory: projectRoot,
    inquirer: RealInquirer,
    suppressConsole: false,
    motherhenWriteDirectory: projectRoot
  };

  try {
    await Driver.run(driverArgs);
  }
  catch (error) {
    if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
      console.log("\n\nYou have canceled this operation.  No changes to your file system have happened.");
      return;
    }

    throw error;
  }
}
