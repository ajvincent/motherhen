// #region preamble
import fs from "fs/promises";
import path from "path";
import url from "url";

import which from "which";
import ini from "ini";

import { type Configuration } from "./Configuration.mjs";
import execAsync from "./execAsync.mjs";
import fileExists from "./fileExists.mjs";

const projectRoot = path.resolve(url.fileURLToPath(import.meta.url), "../../..");
const hg = await which("hg");
// #endregion preamble

// #region Exported functions

/**
 * Clone the mozilla-unified repository as a "vanilla" repository.
 * @param vanilla - metadata about the "vanilla" checkout.
 *
 * @see {@link https://firefox-source-docs.mozilla.org/contributing/vcs/mercurial_bundles.html}
 */
export async function cloneVanillaHg(
  vanilla: Configuration["vanilla"]
) : Promise<void>
{
  const basePath = path.dirname(vanilla.path);
  await fs.mkdir(basePath, { recursive: true });

  const localPathToBundle = await cloneUnified(vanilla, basePath);

  try {
    await pullAndUpdate(vanilla);
  }
  finally {
    console.log("Cleanup");
    await fs.rm(localPathToBundle);
  }
}

/**
 * Create the integration repository.
 * @param config - the project configuration.
 */
export async function createIntegrationHg(
  config: Configuration
) : Promise<void>
{
  await pullAndUpdate(config.vanilla);

  await fs.mkdir(config.integration.path, { recursive: true });
  console.log("Checking for the non-existence of the project directory in the vanilla repository");
  {
    const mustNotExist = path.join(
      config.vanilla.path,
      config.integration.projectDir
    );

    if (await fileExists(mustNotExist))
      throw new Error(`Directory must not exist: ${mustNotExist}`);
  }

  await addSymbolicLinks(config.integration);
  await copyVanilla(config.vanilla, config.integration);
  await applyProject(config.integration);
}

// #endregion Exported functions.

// #region task functions

/**
 * Clone the mozilla-unified repository.
 * @param vanilla - the "vanilla" repository metadata.
 * @param basePath - parent directory of vanilla.path.
 * @returns the location of the hg bundle file for later cleanup.
 */
async function cloneUnified(
  vanilla: Configuration["vanilla"],
  basePath: string,
) : Promise<string>
{
  type BundleData = {
    "mozilla-unified" : {
      "zstd-max" : {
        "path" : string
      }
    }
  };

  const response = await fetch(
    "https://hg.cdn.mozilla.net/bundles.json"
  );
  const data = await response.json() as BundleData;

  const relativePathToBundle = data["mozilla-unified"]["zstd-max"].path;
  const localPathToBundle = path.normalize(path.resolve(
    basePath, path.basename(relativePathToBundle)
  ));

  {
    const wget = await which("wget");
    const urlToBundle = "https://hg.cdn.mozilla.net/" + relativePathToBundle;

    console.log("Fetching bundle...");
    await execAsync(
      wget,
      [ "-O", localPathToBundle, "-q", urlToBundle ]
    );
  }

  console.log("Initializing hg repository...")
  await execAsync(
    hg,
    [ "init", path.basename(vanilla.path) ],
    { cwd: basePath }
  );

  console.log(`Calling hg unbundle. This may take a while. (Started at ${
    (new Date()).toLocaleTimeString()
  })`);
  await execAsync(
    hg,
    [ "unbundle", localPathToBundle ],
    { cwd: vanilla.path }
  );

  console.log("Updating .hg/hgrc");
  await fs.writeFile(
    path.join(vanilla.path, ".hg/hgrc"),
    `
[paths]
default = https://hg.mozilla.org/mozilla-unified/
    `.trim(),
    { encoding: "utf-8" }
  );

  return localPathToBundle;
}

/**
 * Update the clean mozilla-unified repository to a particular tag.
 * @param vanilla - the "vanilla" repository metadata.
 */
async function pullAndUpdate(
  vanilla: Configuration["vanilla"]
) : Promise<void>
{
  console.log("Updating vanilla repository");
  await execAsync(
    hg,
    ["pull"],
    { cwd: vanilla.path }
  );

  console.log(`Updating to ${vanilla.tag}`);
  await execAsync(
    hg,
    ["update", "--rev", vanilla.tag],
    { cwd: vanilla.path }
  );
}

/**
 * Add symbolic links for the source directory and .mozconfig files.
 * @param integration - the "integration" repository metadata.
 */
async function addSymbolicLinks(
  integration: Configuration["integration"]
) : Promise<void>
{
  console.log(`Adding symbolic links to this Motherhen project`);
  const projectDir = path.join(integration.path, integration.projectDir);
  const sourceDir = path.resolve(projectRoot, "source");
  const pathToSource = path.relative(integration.path, sourceDir);

  await fs.symlink(pathToSource, projectDir, "dir");

  const mozconfigTarget = path.join(integration.path, ".mozconfig");
  const mozconfigSource = path.relative(
    path.dirname(mozconfigTarget), integration.mozconfig
  );

  await fs.symlink(mozconfigSource, mozconfigTarget, "file");
}

/**
 * Copy the vanilla repository to the integration folder and update .hg/hgrc for the latter.
 * @param vanilla - the "vanilla" repository metadata.
 * @param integration - the "integration" repository metadata.
 */
async function copyVanilla(
  vanilla: Configuration["vanilla"],
  integration: Configuration["integration"],
) : Promise<void>
{
  console.log(`Copying from vanilla repository to the integration repository. This may take a while. (Started at ${
    (new Date()).toLocaleTimeString()
  })`);

  const topFiles = await fs.readdir(vanilla.path);
  await Promise.all(topFiles.map(
    topFile => fs.cp(
      path.join(vanilla.path, topFile),
      path.join(integration.path, topFile),
      { recursive: true }
    )
  ));

  const pathToIni = path.join(integration.path, ".hg/hgrc");
  const iniConfig = ini.parse(await fs.readFile(
    pathToIni, {encoding: "utf-8"}
  ));

  (iniConfig.paths as { default : string }).default = vanilla.path;
  await fs.writeFile(
    pathToIni,
    ini.stringify(iniConfig),
    { encoding: "utf-8" }
  );
}

/**
 * Apply Motherhen patches and ignore the project in the integration repository.
 * @param integration - the "integration" repository metadata.
 */
async function applyProject(
  integration: Configuration["integration"]
) : Promise<void>
{
  const patch = await which("patch");

  console.log("Adding this Motherhen project to the integration repository's .hgignore");
  await fs.appendFile(
    path.join(integration.path, ".hgignore"),
    "\n\n" + `
# Motherhen project
${integration.projectDir}
    `.trim() + "\n",
    { encoding: "utf-8" }
  );

  console.log("Applying custom patches");
  const patchDir = path.join(projectRoot, "patches");
  const patchFiles = await fs.readdir(patchDir);
  patchFiles.sort();
  for (const patchFile of patchFiles) {
    await execAsync(
      patch,
      [ "-p1", "--forward", "-i", path.join(patchDir, patchFile)],
      { cwd: integration.path }
    );
  }
}
// #endregion task functions
