// #region preamble
import fs from "fs/promises";
import path from "path";
import which from "which";
import ini from "ini";
import wget from "wget-improved";
import FastGlob from "fast-glob";
import { execAsync } from "./childProcessAsync.js";
import fileExists from "./fileExists.js";
import projectRoot from "#cli/utilities/projectRoot.js";
import { PromiseAllParallel, PromiseAllSequence } from "#cli/utilities/PromiseTypes.js";
const hg = await which("hg");
// #endregion preamble
// #region Exported functions
/**
 * Clone the mozilla-unified repository as a "vanilla" repository.
 * @param vanilla - metadata about the "vanilla" checkout.
 *
 * @see {@link https://firefox-source-docs.mozilla.org/contributing/vcs/mercurial_bundles.html}
 */
export async function cloneVanillaHg(pathToVanilla, vanillaTag) {
    const localPathToBundle = await cloneUnified(pathToVanilla);
    try {
        await pullAndUpdate(pathToVanilla, vanillaTag);
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
export async function createIntegrationHg(vanillaRepo, integrationRepo, config, settings) {
    await pullAndUpdate(vanillaRepo, config.vanillaTag);
    console.log("Checking for the non-existence of the project directory in the vanilla repository");
    {
        const mustNotExist = path.join(vanillaRepo, "motherhen");
        if (await fileExists(mustNotExist))
            throw new Error(`Motherhen must not exist in the vanilla repository: ${mustNotExist}`);
    }
    if (!config.isFirefox) {
        const motherhenDir = path.join(integrationRepo, "motherhen");
        await fs.mkdir(motherhenDir, { recursive: true });
        await ignoreMotherhen(integrationRepo);
        await addSymbolicLinks(integrationRepo, config, settings);
    }
    await copyVanilla(vanillaRepo, integrationRepo);
    if (!config.isFirefox) {
        await applyPatches(integrationRepo, config);
    }
}
// #endregion Exported functions.
// #region task functions
/**
 * Clone the mozilla-unified repository.
 * @param vanilla - the "vanilla" repository metadata.
 * @param basePath - parent directory of vanilla.path.
 * @returns the location of the hg bundle file for later cleanup.
 */
async function cloneUnified(pathToVanilla) {
    const basePath = path.dirname(pathToVanilla);
    await fs.mkdir(basePath, { recursive: true });
    const localPathToBundle = path.normalize(path.resolve(basePath, "mozilla-unified-bundle.hg"));
    {
        const response = await fetch("https://hg.cdn.mozilla.net/bundles.json");
        const data = await response.json();
        const relativePathToBundle = data["mozilla-unified"]["zstd-max"].path;
        const urlToBundle = "https://hg.cdn.mozilla.net/" + relativePathToBundle;
        console.log("Fetching bundle...");
        await new Promise((resolve, reject) => {
            const download = wget.download(urlToBundle, localPathToBundle);
            download.once("error", reject);
            download.once("end", resolve);
        });
    }
    console.log("Initializing hg repository...");
    await execAsync(hg, ["init", path.join(basePath, "mozilla-unified")], { cwd: basePath });
    console.log(`Calling hg unbundle. This may take a while. (Started at ${(new Date()).toLocaleTimeString()})`);
    await execAsync(hg, ["unbundle", localPathToBundle], { cwd: pathToVanilla });
    console.log("Updating .hg/hgrc");
    await fs.writeFile(path.join(pathToVanilla, ".hg/hgrc"), `
[paths]
default = https://hg.mozilla.org/mozilla-unified/
    `.trim(), { encoding: "utf-8" });
    return localPathToBundle;
}
/**
 * Update the clean mozilla-unified repository to a particular tag.
 * @param vanilla - the "vanilla" repository metadata.
 */
async function pullAndUpdate(pathToVanilla, vanillaTag) {
    console.log("Updating vanilla repository");
    await execAsync(hg, ["pull"], { cwd: pathToVanilla });
    console.log(`Updating to ${vanillaTag}`);
    await execAsync(hg, ["update", "--rev", vanillaTag], { cwd: pathToVanilla });
}
async function ignoreMotherhen(integrationRepo) {
    console.log(`Adding "motherhen" to the integration repository's .hgignore`);
    await fs.appendFile(path.join(integrationRepo, ".hgignore"), "\n\nmotherhen\n", { encoding: "utf-8" });
}
/**
 * Add symbolic links for the source directory and .mozconfig files.
 * @param integration - the "integration" repository metadata.
 */
async function addSymbolicLinks(integrationRepo, config, settings) {
    console.log(`Adding symbolic links to this Motherhen project`);
    const sourcesDir = path.resolve(projectRoot, settings.relativePathToConfig, "..", "sources");
    const motherhenDir = path.join(integrationRepo, "motherhen");
    const dirNames = [
        config.applicationDirectory,
        ...config.otherSourceDirectories
    ];
    await PromiseAllParallel(dirNames, async (dirName) => {
        await fs.symlink(path.join(sourcesDir, dirName), path.join(motherhenDir, dirName), "dir");
    });
}
/**
 * Copy the vanilla repository to the integration folder and update .hg/hgrc for the latter.

 */
async function copyVanilla(vanillaRepo, integrationRepo) {
    console.log(`Copying from vanilla repository to the integration repository. This may take a while. (Started at ${(new Date()).toLocaleTimeString()})`);
    const topFiles = await fs.readdir(vanillaRepo);
    await Promise.all(topFiles.map(topFile => fs.cp(path.join(vanillaRepo, topFile), path.join(integrationRepo, topFile), { recursive: true })));
    const pathToIni = path.join(integrationRepo, ".hg/hgrc");
    const iniConfig = ini.parse(await fs.readFile(pathToIni, { encoding: "utf-8" }));
    iniConfig.paths.default = vanillaRepo;
    await fs.writeFile(pathToIni, ini.stringify(iniConfig), { encoding: "utf-8" });
}
const patchAsPromise = which("patch");
/**
 * Apply Motherhen patches and ignore the project in the integration repository.
 * @param integration - the "integration" repository metadata.
 *
 * @see {@link https://www.gnu.org/software/diffutils/manual/html_node/Merging-with-patch.html}
 * @see {@link https://www.mercurial-scm.org/doc/hg.1.html#import}
 * @see {@link https://www.mercurial-scm.org/doc/hg.1.html#qimport}
 */
async function applyPatches(integrationRepo, config) {
    const patchRoot = path.join(projectRoot, "patches");
    const patchFiles = await FastGlob(config.patches.globs, {
        cwd: path.join(projectRoot, "patches")
    });
    patchFiles.sort();
    await PromiseAllSequence(patchFiles, async (patchFile) => {
        patchFile = path.resolve(patchRoot, patchFile);
        if ((config.patches.commitMode === "none") ||
            (config.patches.commitMode === "atEnd")) {
            const patchCmd = await patchAsPromise;
            await execAsync(patchCmd, ["-p1", "--forward", "-i", patchFile], { cwd: integrationRepo });
        }
        else {
            await execAsync(hg, [config.patches.commitMode, "-p1", patchFile], { cwd: integrationRepo });
        }
    });
    if (config.patches.commitMode === "atEnd") {
        await execAsync(hg, ["add"], { cwd: integrationRepo });
        await execAsync(hg, ["commit", "-m", config.patches.commitMessage], { cwd: integrationRepo });
    }
}
// #endregion task functions
//# sourceMappingURL=mercurial.js.map