import path from "path";

import { cloneVanillaHg, createIntegrationHg } from "./tools/mercurial.js";
import fileExists from "./tools/fileExists.js";
import projectRoot from "#cli/utilities/projectRoot.js";

import type { CommandSettings } from "./tools/CommandSettings-type";
import whereIsMyProject from "./where.js";

import type {
  FirefoxSummary,
  MotherhenSummary
} from "../configuration/version-1.0/json/Summary.js";
import installMozconfig from "./tools/mozconfigs.js";

/**
 * @param config - the configuration to use.
 * @param settings - the user's command-line settings.
 */
export default
async function createProject(
  config: Required<FirefoxSummary | MotherhenSummary>,
  settings: CommandSettings,
) : Promise<void>
{
  let didSomething = false;

  // Vanilla checkout
  const vanillaPath = path.resolve(projectRoot, "cleanroom/mozilla-unified");

  if (!(await fileExists(vanillaPath, true))) {
    console.log("Vanilla checkout not found... cloning");
    console.group();
    try {
      await cloneVanillaHg(vanillaPath, config.vanillaTag);
      didSomething = true;
    }

    finally {
      console.groupEnd();
    }
  }

  // Assertion: we must have the directory now.
  if (!(await fileExists(vanillaPath, true))) {
    throw new Error("The vanilla checkout must exist now!");
  }

  const targetDirectory = path.normalize(path.resolve(
    projectRoot, settings.relativePathToConfig, "..", config.targetDirectory
  ));

  const integrationRepo = path.join(targetDirectory, "mozilla-unified");

  // Integration repository
  if (!(await fileExists(integrationRepo, true))) {
    console.log("Integration repository not found...");
    console.group();
    try {
      await createIntegrationHg(vanillaPath, integrationRepo, config, settings);
      didSomething = true;
    }
    finally {
      console.groupEnd();
    }
  }

  await installMozconfig(targetDirectory, config);

  await whereIsMyProject(config, settings);

  console.log("\n" + `
Congratulations!  You should now have a working integration repository.

If this configuration isn't what you wanted, try re-running this command with the --config option
pointing to your configuration.  Please see ./typescript-cli/commands/tools/Configuration.mts
for the configuration format.
${didSomething ?
`
I've updated your repository to the ${config.vanillaTag} tag.

I've applied a few small patches, but I haven't committed them yet.  I think it's up to you to decide how
to manage this for now.
`
: ""}
To run mach commands:

./cli/motherhen.js mach --config=${settings.relativePathToConfig}${
  settings.project !== "default" ? ` --${config.isFirefox ? "firefox" : "project"}=${settings.project}` : ""
} (command)

Good luck!!
`.trim()
  );
}
