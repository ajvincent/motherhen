#!/usr/bin/env node
// #region preamble
import getConfiguration from "./tools/Configuration.mjs";
import { cloneVanillaHg, createIntegrationHg } from "./tools/mercurial.mjs";
import fileExists from "./tools/fileExists.mjs";
const config = await getConfiguration();
// #endregion preamble
// Vanilla checkout
{
    if (!(await fileExists(config.vanilla.path, true))) {
        console.log("Vanilla checkout not found... cloning");
        console.group();
        try {
            await (config.vanilla.vcs === "hg" ?
                cloneVanillaHg(config.vanilla) :
                cloneVanillaGit(config.vanilla));
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
                createIntegrationGit(config));
        }
        finally {
            console.groupEnd();
        }
    }
}
async function cloneVanillaGit(vanilla) {
    void (vanilla);
    return Promise.reject(new Error("not yet implemented"));
}
async function createIntegrationGit(config) {
    void (config);
    return Promise.reject(new Error("not yet implemented"));
}
//# sourceMappingURL=create.mjs.map