#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import which from "which";
import { execFile } from "child_process";
import { promisify } from "util";
const execAsync = promisify(execFile);
import getConfiguration from "./target/Configuration.mjs";
const config = await getConfiguration();
{
    let found = false;
    try {
        const stats = await fs.stat(config.vanilla.path);
        if (stats.isDirectory())
            found = true;
    }
    catch {
        // do nothing
    }
    if (!found) {
        console.log("Vanilla checkout not found... cloning");
        console.group();
        try {
            await config.vanilla.vcs === "hg" ?
                cloneVanillaHg(config.vanilla) :
                cloneVanillaGit(config.vanilla);
        }
        finally {
            console.groupEnd();
        }
    }
}
/**
 *
 * @param vanilla - metadata about the "vanilla" checkout.
 *
 * @see {@link https://firefox-source-docs.mozilla.org/contributing/vcs/mercurial_bundles.html}
 * @internal
 */
async function cloneVanillaHg(vanilla) {
    const hg = await which("hg");
    const wget = await which("wget");
    {
        const basePath = path.dirname(vanilla.path);
        await fs.mkdir(basePath, { recursive: true });
        const response = await fetch("https://hg.cdn.mozilla.net/bundles.json");
        const data = await response.json();
        const relativePathToBundle = data["mozilla-unified"]["zstd-max"].path;
        const localPathToBundle = path.normalize(path.resolve(basePath, path.basename(relativePathToBundle)));
        const urlToBundle = "https://hg.cdn.mozilla.net/" + relativePathToBundle;
        console.log("Fetching bundle...");
        await execAsync(wget, [
            "-O", localPathToBundle,
            "-q",
            urlToBundle
        ]);
        console.log("Initializing hg repository...");
        await execAsync(hg, [
            "init", path.basename(vanilla.path)
        ], {
            cwd: basePath
        });
        console.log(`Calling hg unbundle. This may take a while. (Started at ${(new Date()).toLocaleTimeString()})`);
        await execAsync(hg, [
            "unbundle", localPathToBundle
        ], {
            cwd: vanilla.path
        });
        console.log("Updating .hg/hgrc");
        await fs.writeFile(path.join(vanilla.path, ".hg/hgrc"), `
[paths]
default = https://hg.mozilla.org/mozilla-unified/
      `.trim(), { encoding: "utf-8" });
        console.log("Calling hg pull");
        await execAsync(hg, ["pull"], {
            cwd: vanilla.path
        });
        console.log(`Updating to ${vanilla.tag}`);
        await execAsync(hg, ["update", "--rev", vanilla.tag], {
            cwd: vanilla.path
        });
        console.log("  Cleanup");
        await fs.rm(localPathToBundle);
    }
}
async function cloneVanillaGit(vanilla) {
    void (vanilla);
    throw new Error("not yet implemented");
}
//# sourceMappingURL=configure.mjs.map