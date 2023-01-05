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
pointing to your configuration.  Please see ./typescript-cli/commands/tools/Configuration.mts
for the configuration format.
${didSomething ?
        `
I've updated your repository to the ${config.vanilla.tag} tag, using ${config.vanilla.vcs} .

I've applied a few small patches, but I haven't committed them yet.  I think it's up to you to decide how
to manage this for now.
`
        : ""}
To run mach commands:

npm run mach --config=${settings.relativePathToConfig} --project=${settings.project} (command)

Good luck!!
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