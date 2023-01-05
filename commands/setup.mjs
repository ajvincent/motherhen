// #region preamble
import buildBlank from "./setupWizard/blankConfig.mjs";
import fillVanilla from "./setupWizard/fillVanilla.mjs";
import fillIntegration from "./setupWizard/fillIntegration.mjs";
import getEditableJSON from "./setupWizard/getEditableJSON.mjs";
import getKeyNameAndConfig from "./setupWizard/getKeyNameAndConfig.mjs";
import { InterruptedPrompt } from "./setupWizard/inquirer-registration.mjs";
import pickConfigLocation from "./setupWizard/pickConfigLocation.mjs";
import { maybeUpdateGitIgnore, confirmChoice, writeConfigurationFile, } from "./setupWizard/placeholders.mjs";
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
    let writePromise;
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
        uncreatedDirs = await fillIntegration(pathToFile, config.vanilla.path, config.integration, uncreatedDirs);
        void (uncreatedDirs);
        // What changes should we make to .gitignore?
        const updateGitIgnore = await maybeUpdateGitIgnore(pathToFile);
        // Does everything look right?
        const proceed = await confirmChoice(output, key);
        if (!proceed) {
            return;
        }
        // Update the real file system.
        writePromise = writeConfigurationFile(pathToFile, exists, output, updateGitIgnore);
    }
    catch (error) {
        if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
            console.log("\n\nYou have canceled this operation.  No changes to your file system have happened.");
            return;
        }
        throw error;
    }
    await writePromise;
}
function writeIntroduction() {
    console.log(`
This wizard will walk you through the process of crafting a Motherhen configuration file.
You may abort the process at any time by pressing the ESC key.
`.trim() + "\n");
}
//# sourceMappingURL=setup.mjs.map