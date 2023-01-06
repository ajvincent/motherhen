import fs from "fs/promises";

import type { Configuration } from "./Configuration.js";

/**
 * Extract a project directory from a .mozconfig file.
 * @param integration - the integration repository configuration.
 * @returns the project directory name.
 */
export default
async function getProjectDirFromMozconfig(
  integration: Configuration["integration"],
) : Promise<string>
{
  const mozconfig = await fs.readFile(
    integration.mozconfig,
    { encoding: "utf-8" }
  );

  const match = /--enable-project=(.*)\b/gm.exec(mozconfig);
  if (!match) {
    console.error(
`I couldn't find an --enable-project line in your mozconfig!  This tells Mozilla where to find your project directory.

See https://firefox-source-docs.mozilla.org/setup/configuring_build_options.html for details.
`
    );
    throw new Error("No project found for mozconfig at " + integration.mozconfig);
  }

  return match[1];
}
