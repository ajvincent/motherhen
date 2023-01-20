// #region preamble
import path from "path";
import IntegrationJSON from "../json/Integration.js";
import ProjectWizard from "./Project.js";
import { assertFail } from "./assert.js";
import DictionaryWizardBase from "./DictionaryBase.js";
import fileExists from "#cli/utilities/fileExists.js";
import maybeLog from "./maybeLog.js";
import pickFileToCreate from "./pickFileToCreate.js";
// #endregion preamble
/** Update the integrations map in a configuration, after sources and patches are in place. */
export default class IntegrationWizard extends DictionaryWizardBase {
    // #region static code
    /**
     * The true entry point to the wizard.
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     * @param patchKey - the user's initial patch key, from the appropriate integration settings.
     */
    static async run(sharedArguments, chooseTasks, integrationKey) {
        const integration = new IntegrationWizard(sharedArguments, chooseTasks, integrationKey);
        await integration.run();
    }
    /** The dictionary tasks map. */
    static #tasksMap = new Map([
        ["readAll", `Print all integrations to the console`],
        ["update", `Update the integration configuration`],
        ["add", `Add a new integration and use it`],
        ["clone", `Clone into a new integration and update the clone`],
        ["rename", `Rename the key`],
        ["delete", `Delete the key and select another`],
    ]);
    /**
     * Helper for getting the existing integration for patches, sources.
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     * @returns an integration configuration.
     */
    static getExisting(sharedArguments, chooseTasks) {
        const config = sharedArguments.configuration;
        const project = ProjectWizard.getExisting(sharedArguments, chooseTasks);
        const integration = config.integrations.get(project.integrationKey);
        if (integration === undefined)
            assertFail("integration must be defined");
        return integration;
    }
    /**
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     * @param integrationKey - the user's initial patch key, from the appropriate integration settings.
     */
    constructor(sharedArguments, chooseTasks, integrationKey) {
        const dictionaryArguments = {
            sharedArguments,
            chooseTasks,
            dictionary: sharedArguments.configuration.integrations,
            dictionaryName: "integrations",
            initialDictionaryKey: integrationKey,
            dictionaryTasksMap: IntegrationWizard.#tasksMap,
            parentDictionaryUpdater: (newKey, updateAll) => {
                if (updateAll) {
                    const { projects } = this.sharedArguments.configuration;
                    projects.forEach(project => {
                        if (project.integrationKey === this.dictionaryKey)
                            project.integrationKey = newKey;
                    });
                }
                else {
                    const project = ProjectWizard.getExisting(this.sharedArguments, this.chooseTasks);
                    project.integrationKey = newKey;
                }
            },
            elementConstructor: (existing) => {
                if (existing) {
                    return new IntegrationJSON(existing.vanillaTag, existing.sourceKey, existing.patchKey, existing.targetDirectory.clone());
                }
                if (!this.#requiredIntegration) {
                    this.#requiredIntegration = this.sharedArguments.fsQueue.addRequirement("integration");
                }
                const resolver = this.sharedArguments.pathResolver.clone();
                resolver.setPath(false, `integrations${path.sep}default`);
                return new IntegrationJSON("release", "(default)", "(default)", resolver);
            },
        };
        super(dictionaryArguments);
    }
    /** A flag for when we must create an integration definition (for initially blank configurations). */
    #requiredIntegration;
    initializeWizard() {
        if (this.sharedArguments.configuration.integrations.size === 0) {
            this.#requiredIntegration = this.sharedArguments.fsQueue.addRequirement("integration");
        }
        return Promise.resolve();
    }
    async doQuickStart() {
        const sourceKey = "(default)";
        const patchKey = "(default)";
        const vanillaTag = await this.#getVanillaTag();
        const targetDirectory = await this.#getIntegrationDirectory(vanillaTag);
        this.dictionary.set(this.dictionaryKey, new IntegrationJSON(vanillaTag, sourceKey, patchKey, targetDirectory));
        this.sharedArguments.fsQueue.resolveRequirement(this.#requiredIntegration);
    }
    async updateDictionary() {
        maybeLog(this.sharedArguments, `Your current integration settings is:\n${JSON.stringify(this.dictionaryElement, null, 2)}`);
        const integration = this.dictionaryElement;
        integration.vanillaTag = await this.#getVanillaTag(integration.vanillaTag);
        integration.sourceKey = await this.#getSourceKey(integration.sourceKey);
        integration.patchKey = await this.#getPatchKey(integration.patchKey);
        const pathResolver = await this.#getIntegrationDirectory(integration.vanillaTag);
        integration.targetDirectory.setPath(false, pathResolver.getPath(false));
        this.sharedArguments.fsQueue.resolveRequirement(this.#requiredIntegration);
    }
    /**
     * Get a bookmark or tag for the upstream mozilla-unified repository.
     *
     * @param currentTag - the current vanilla tag, if we have it.
     * @returns the new tag to use.
     */
    async #getVanillaTag(currentTag) {
        maybeLog(this.sharedArguments, `
I need to base your integration repository on a bookmark or tag from mozilla-unified.
Good choices are "release", "beta", or an /^esr\\d+$/ match.  "central" if you
really want bleeding-edge code and instability.
    `.trim());
        const { vanillaTag } = await this.prompt([
            {
                name: "vanillaTag",
                type: "input",
                message: "What bookmark or tag should I use?",
                default: currentTag
            }
        ]);
        return vanillaTag;
    }
    /**
     * Ask the user to choose a source key, to assign source directories to this integration.
     * @param currentKey - the currently selected key from the configuration.
     * @returns the user's selected key.
     */
    async #getSourceKey(currentKey) {
        const { sources } = this.sharedArguments.configuration;
        if (sources.size === 0) {
            assertFail("sources dictionary is empty?  How can we be in the integration wizard without that?");
        }
        if (!sources.has(currentKey)) {
            currentKey = Array.from(sources.keys())[0];
        }
        if (sources.size === 1) {
            maybeLog(this.sharedArguments, `
I am using the sources key "${currentKey}" as the only option available.
It has these values:
${JSON.stringify(sources.get(currentKey), null, 2)}
      `.trim());
            return currentKey;
        }
        let selectedSourceKey = currentKey;
        do {
            currentKey = selectedSourceKey;
            maybeLog(this.sharedArguments, `
Your current sources key, "${currentKey}", has these values:
${JSON.stringify(sources.get(currentKey), null, 2)}

Please pick another source key if you want to examine it, or the current key,
"${currentKey}", if you wish to select this set of sources.
      `.trim());
            const choices = Array.from(sources.keys());
            choices.sort();
            ({ selectedSourceKey } = await this.prompt([
                {
                    name: "selectedSourceKey",
                    type: "list",
                    default: currentKey,
                    choices,
                    message: "Which source key would you like to examine?"
                }
            ]));
        } while (currentKey !== selectedSourceKey);
        return selectedSourceKey;
    }
    /**
     * Ask the user to choose a patches key, to assign a patch set to this integration.
     * @param currentKey - the currently selected key from the configuration.
     * @returns the user's selected key.
     */
    async #getPatchKey(currentKey) {
        const { patches } = this.sharedArguments.configuration;
        if (patches.size === 0) {
            assertFail("patches dictionary is empty?  How can we be in the integration wizard without that?");
        }
        if (!patches.has(currentKey)) {
            currentKey = Array.from(patches.keys())[0];
        }
        if (patches.size === 1) {
            maybeLog(this.sharedArguments, `
I am using the patches key "${currentKey}" as the only option available.
It has these values:
${JSON.stringify(patches.get(currentKey), null, 2)}
      `.trim());
            return currentKey;
        }
        let selectedPatchKey = currentKey;
        do {
            currentKey = selectedPatchKey;
            maybeLog(this.sharedArguments, `
Your current patches key, "${currentKey}", has these values:
${JSON.stringify(patches.get(currentKey), null, 2)}

Please pick another patch key if you want to examine it, or the current key,
"${currentKey}", if you wish to select this set of patches.
      `.trim());
            const choices = Array.from(patches.keys());
            choices.sort();
            ({ selectedPatchKey } = await this.prompt([
                {
                    name: "selectedPatchKey",
                    type: "list",
                    default: currentKey,
                    choices,
                    message: "Which patch key would you like to examine?"
                }
            ]));
        } while (currentKey !== selectedPatchKey);
        return selectedPatchKey;
    }
    /**
     * Ask the user to pick an integration directory destination.
     *
     * @param vanillaTag - A suggested default directory, appended to "integrations".
     */
    async #getIntegrationDirectory(vanillaTag) {
        const resolver = this.sharedArguments.pathResolver.clone();
        /* We need to get an integration directory from pickFileToCreate(), which
        means starting from an existing directory.  So, an ancestor of resolver.
        */
        const baseDir = resolver.getPath(true);
        let realDir = baseDir;
        while (!await fileExists(realDir, true)) {
            realDir = path.dirname(realDir);
        }
        const pathWithUncreatedDirs = await pickFileToCreate(this.sharedArguments.inquirer, {
            findExistingMessage: "Please pick a real directory which will be the ancestor of the integration directory.",
            findFinalFileMessage: "Please enter a path from the real directory to the integration directory.",
            pathToStartDirectory: realDir,
            defaultPathToFile: `integrations${path.sep}${vanillaTag}`,
        });
        resolver.setPath(true, pathWithUncreatedDirs.pathToFile);
        return resolver;
    }
}
//# sourceMappingURL=Integration.js.map