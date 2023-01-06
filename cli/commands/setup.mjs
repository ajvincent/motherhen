// #region preamble
import buildBlank from "./setupWizard/blankConfig.js";
import confirmSettings from "./setupWizard/confirmSettings.mjs";
import fillVanilla from "./setupWizard/fillVanilla.mjs";
import fillIntegration from "./setupWizard/fillIntegration.mjs";
import getEditableJSON from "./setupWizard/getEditableJSON.mjs";
import getKeyNameAndConfig from "./setupWizard/getKeyNameAndConfig.mjs";
import { InterruptedPrompt } from "./setupWizard/inquirer-registration.mjs";
import { maybeUpdateGitIgnore, } from "./setupWizard/updateGitIgnore.mjs";
import pickConfigLocation from "./setupWizard/pickConfigLocation.mjs";
import writeConfiguration from "./setupWizard/writeConfiguration.mjs";
// #endregion preamble
/**
 * This function drives the set-up of a Motherhen configuration file.
 * It does _not_ create the repositories, build or run the Mozilla-based
 * application.  That is create.mjs's job.  This builds out the
 * configurations which the create module uses, based on user inputs
 * through Inquirer's text prompting and a couple of really nice plugins
 * to Inquirer.
 */
export default async function setupMotherhen() {
    let writePromise = () => {
        throw new Error("assertion failure: we shouldn't reach this");
    };
    try {
        writeIntroduction();
        // Where are we going to write the configuration file?
        const configPathWithUncreated = await pickConfigLocation();
        const { pathToFile } = configPathWithUncreated;
        let { uncreatedDirs } = configPathWithUncreated;
        // If there's an existing configuration, get it.  Otherwise, create it in memory.
        const { exists, output } = await getEditableJSON(pathToFile);
        // Get the actual configuration object, and a property name to assign.
        let key, config;
        if (exists) {
            ({ key, config } = await getKeyNameAndConfig(output));
        }
        else {
            console.log(`Your configuration file does not exist.  I will use "default" as the project key.`);
            key = "default";
            config = buildBlank();
        }
        output[key] = config;
        // Fill out the configuration's fields.
        uncreatedDirs = await fillVanilla(pathToFile, config.vanilla, uncreatedDirs);
        const integrationResults = await fillIntegration(pathToFile, config.vanilla.path, config.integration, uncreatedDirs);
        ({ uncreatedDirs } = integrationResults);
        void (uncreatedDirs);
        const fullPathToMozconfig = config.integration.mozconfig;
        // What changes should we make to .gitignore?
        const updateGitIgnore = !exists && await maybeUpdateGitIgnore(pathToFile);
        // Does everything look right?
        const proceed = await confirmSettings(pathToFile, output, key);
        if (!proceed) {
            throw InterruptedPrompt.EVENT_INTERRUPTED;
        }
        // Update the real file system.
        writePromise = () => writeConfiguration(pathToFile, exists, output, key, updateGitIgnore, integrationResults.replaceHatchedEggName, fullPathToMozconfig);
    }
    catch (error) {
        if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
            console.log("\n\nYou have canceled this operation.  No changes to your file system have happened.");
            return;
        }
        throw error;
    }
    await writePromise();
}
function writeIntroduction() {
    console.log(`
This wizard will walk you through the process of crafting a Motherhen configuration file.
You may abort the process at any time by pressing the ESC key.
`.trim() + "\n");
}
//# sourceMappingURL=setup.mjs.map