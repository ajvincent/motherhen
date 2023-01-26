import path from "path";
import fs from "fs/promises";

import projectRoot from "#cli/utilities/projectRoot.js";
import fileExists from "#cli/utilities/fileExists.js";
import type {
  FirefoxSummary,
  MotherhenSummary,
} from "#cli/configuration/version-1.0/json/Summary.js";
import type {
  CommandSettings
} from "./tools/CommandSettings-type.js";
import { assertFail } from "#cli/configuration/version-1.0/wizard/assert.js";

/**
 * @param config - the configuration to use.
 */
export default
async function whereIsMyProject(
  config: Required<FirefoxSummary | MotherhenSummary>,
  settings: CommandSettings,
) : Promise<void>
{
  const targetDirectory = path.normalize(path.resolve(
    projectRoot, settings.relativePathToConfig, "..", config.targetDirectory
  ));

  let mozconfigPath: string;

  if (config.isFirefox) {
    mozconfigPath = path.join(targetDirectory,
      "firefox",
      config.buildType + ".mozconfig"
    );
  }
  else {
    mozconfigPath = path.join(
      targetDirectory,
      "mozconfigs",
      config.applicationDirectory,
      config.mozconfig + ".mozconfig"
    );
  }

  const integrationRepo = path.join(targetDirectory, "mozilla-unified");
  console.log(`
Your Mozilla integration repository should be at:
${integrationRepo}

Your MOZCONFIG file should be at:
${mozconfigPath}
  `.trim() + "\n");

  if (await fileExists(mozconfigPath, false)) {
    const contents = await fs.readFile(mozconfigPath, { encoding: "utf-8"});
    // mk_add_options MOZ_OBJDIR=@TOPSRCDIR@/../builds/hatchedegg-opt
    const lineRE = /MOZ_OBJDIR=@TOPSRCDIR@\/(.*)\n/;
    const line = lineRE.exec(contents);
    if (!line) {
      assertFail("missing MOZ_OBJDIR line");
    }

    const objectDirectory = path.normalize(path.resolve(
      integrationRepo, line[1]
    ));
    console.log(`
Your object build directory should be at:
${objectDirectory}
    `.trim() + "\n");
  }
  else {
    console.log(`You haven't successfully run the create command yet, so I can't tell you where the build directory is.`);
  }
}
