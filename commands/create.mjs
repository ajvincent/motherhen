#!/usr/bin/env node
import { cloneVanillaHg, createIntegrationHg } from "./tools/mercurial.mjs";
import fileExists from "./tools/fileExists.mjs";
import whereIsMyProject from "./where.mjs";
/**
 * @param config - the configuration to use.
 * @param settings - the user's command-line settings.
 */
export default async function createProject(config, settings) {
    let didSomething = false;
    // Vanilla checkout
    if (!(await fileExists(config.vanilla.path, true))) {
        console.log("Vanilla checkout not found... cloning");
        console.group();
        try {
            await (config.vanilla.vcs === "hg" ?
                cloneVanillaHg(config.vanilla) :
                cloneVanillaGit(config.vanilla));
            didSomething = true;
        }
        finally {
            console.groupEnd();
        }
    }
    // Assertion: we must have the directory now.
    if (!(await fileExists(config.vanilla.path, true))) {
        throw new Error("The vanilla checkout must exist now!");
    }
    // Integration repository
    if (!(await fileExists(config.integration.path))) {
        console.log("Integration repository not found...");
        console.group();
        try {
            await (config.vanilla.vcs === "hg" ?
                createIntegrationHg(config) :
                createIntegrationGit(config));
            didSomething = true;
        }
        finally {
            console.groupEnd();
        }
    }
    await whereIsMyProject(config);
    console.log("\n" + `
Congratulations!  You should now have a working integration repository.

If this configuration isn't what you wanted, try re-running this command with the --config option
pointing to your configuration.  Please see ./commands/tools/Configuration.mts
for the configuration format.
${didSomething ?
        `
I've updated your repository to the ${config.vanilla.tag} tag, using ${config.vanilla.vcs} .

I've applied a few small patches, but I haven't committed them yet.  I think it's up to you to decide how
to manage this for now.
`
        : ""}
For now, I recommend running your mach operations directly in the repository.  In the future, this
project will support commands such as "motherhen.mjs build ${settings.project}" or "motherhen.mjs run ${settings.project}"
to call upon mach for your project.

Thank you!
`.trim());
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