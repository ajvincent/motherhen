#!/usr/bin/env node

// #region preamble
import getConfiguration, {type Configuration } from "./tools/Configuration.mjs";
import { cloneVanillaHg, createIntegrationHg } from "./tools/mercurial.mjs";
import fileExists from "./tools/fileExists.mjs";

const config = await getConfiguration();

// #endregion preamble

// Vanilla checkout
{
  if (!(await fileExists(config.vanilla.path, true)))
  {
    console.log("Vanilla checkout not found... cloning");
    console.group();
    try {
      await (config.vanilla.vcs === "hg" ?
        cloneVanillaHg(config.vanilla) :
        cloneVanillaGit(config.vanilla)
      );
    }

    finally {
      console.groupEnd();
    }
  }

  // Assertion: we must have the directory now.
  if (!(await fileExists(config.vanilla.path, true)))
    throw new Error("The vanilla checkout must exist now!");
}

// Integration repository
{
  if (!(await fileExists(config.integration.path))) {
    console.log("Integration repository not found...");
    console.group();
    try {
      await (config.vanilla.vcs === "hg" ?
        createIntegrationHg(config) :
        createIntegrationGit(config)
      );
    }
    finally {
      console.groupEnd();
    }
  }
}

console.log(`
Congratulations!  You should now have a working integration repository at ${config.integration.path} .
I created this from ${config.vanilla.path} .
I used the configuration at ${
  process.env["MOTHERHEN_CONFIG"] ?? ".motherhen-config.json"
} .

If this configuration isn't what you wanted, try re-running this command with the MOTHERHEN_CONFIG
environment variable pointing to your configuration.  Please see ./build/tools/Configuration.mts
for the configuration format.

I've updated your repository to the ${config.vanilla.tag} tag, using ${config.vanilla.vcs} .

I've applied a few small patches, but I haven't committed them yet.  I think it's up to you to decide how
to manage this for now.

Your project-specific code lives in the ${config.integration.projectDir} subdirectory, and is set up
to use the .mozconfig file you placed at ${config.integration.mozconfig} .

For now, I recommend running your mach operations directly in the repository.  In the future, this
project will support commands such as "npm run build ${
  process.argv[2] ?? "default"
}" or "npm run start ${
  process.argv[2] ?? "default"
}"
to call upon mach for your project.

Thank you!
`.trim());

async function cloneVanillaGit(
  vanilla: Configuration["vanilla"]
) : Promise<void>
{
  void(vanilla);
  return Promise.reject(new Error("not yet implemented"));
}

async function createIntegrationGit(
  config: Configuration
) : Promise<void>
{
  void(config);
  return Promise.reject(new Error("not yet implemented"));
}
