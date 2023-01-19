// #region preamble
import fs from "fs/promises";
import path from "path";
import fileExists from "#cli/utilities/fileExists.js";
import StringSet from "../json/StringSet.js";
import SharedArgumentsImpl from "./SharedArguments.js";
import InquirerConfirm from "./Confirm.js";
import maybeLog from "./maybeLog.js";
import IntegrationWizard from "./Integration.js";
import { assertFail } from "./assert.js";
// #endregion preamble
/** Update the sources map in a configuration, and request new source directories if the user needs them. */
export default class SourcesWizard {
    // #region static code
    /**
     * The true entry point to the wizard.
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     * @param sourceKey - the user's initial source key, from the appropriate integration settings.
     * @param motherhenWriteDirectory - where the user's source directories live.
     */
    static async run(sharedArguments, chooseTasks, sourceKey, motherhenWriteDirectory) {
        const sources = new SourcesWizard(sharedArguments, chooseTasks, sourceKey, motherhenWriteDirectory);
        await sources.#run();
    }
    // #endregion static code
    #sharedArguments;
    #prompt;
    #chooseTasks;
    #targetSourcesDir;
    /** the user's currently selected key in the configuration's sources map.  */
    #sourceKey;
    /** the user's current set of source directories. */
    #sourceStringSet;
    /** The list of child directories in the sources directory. */
    #availableSources;
    /** A flag for when we must create a source directory (for initially blank configurations). */
    #requiredSource;
    /**
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     * @param sourceKey - the user's initial source key, from the appropriate integration settings.
     * @param motherhenWriteDirectory - where the user's source directories live.
     */
    constructor(sharedArguments, chooseTasks, sourceKey, motherhenWriteDirectory) {
        this.#sharedArguments = sharedArguments;
        this.#chooseTasks = chooseTasks;
        this.#sourceKey = sourceKey;
        this.#targetSourcesDir = path.join(motherhenWriteDirectory, "sources");
        this.#prompt = SharedArgumentsImpl.getPrompt(sharedArguments);
        let stringSet = this.#sharedArguments.configuration.sources.get(sourceKey);
        if (!stringSet) {
            stringSet = new StringSet;
            this.#sharedArguments.configuration.sources.set(sourceKey, stringSet);
        }
        this.#sourceStringSet = stringSet;
        this.#availableSources = new StringSet;
    }
    /** Inquire of the user what actions they want to perform with regard to source directories. */
    async #run() {
        // initialization
        await this.#initializeAvailable();
        this.#sharedArguments.configuration.sources.forEach(stringSet => {
            stringSet.forEach(dir => {
                if (!this.#availableSources.has(dir))
                    stringSet.delete(dir);
            });
        });
        this.#checkInvariants();
        // start the real work
        if (this.#chooseTasks.quickStart) {
            return await this.#quickStart();
        }
        this.#chooseTasks.userConfirmed = false;
        do {
            const taskName = await this.#chooseSourceKeyTask();
            const skipConfirm = await this.#doSourceKeyTask(taskName);
            this.#checkInvariants();
            if (skipConfirm)
                continue;
            this.#chooseTasks.userConfirmed = await InquirerConfirm(this.#sharedArguments, "Are you finished with changes to source keys?");
        } while (!this.#chooseTasks.userConfirmed);
    }
    /** What source directories do we have to start with? */
    async #initializeAvailable() {
        if (!await fileExists(this.#targetSourcesDir, true)) {
            this.#requiredSource = this.#sharedArguments.fsQueue.addRequirement("sources");
            return;
        }
        let entries = await fs.readdir(this.#targetSourcesDir, {
            encoding: "utf-8",
            withFileTypes: true
        });
        entries = entries.filter(dir => dir.isDirectory());
        const dirs = entries.map(dir => dir.name);
        dirs.sort();
        this.#availableSources = new StringSet(dirs);
        if (dirs.length === 0) {
            // this should never happen, but...
            this.#requiredSource = this.#sharedArguments.fsQueue.addRequirement("sources");
        }
    }
    /** Set up default sources for the first-time user. */
    async #quickStart() {
        this.#printAvailableSources();
        await this.#addOneDirectory();
    }
    /** Ask the user what they want to do next. */
    async #chooseSourceKeyTask() {
        const choicesMap = new Map([
            ["readAll", `Print all sources to the console`],
            ["edit", `Edit the source directory list, including possibly adding new source directories`],
            ["add", `Add a new source key and use it`],
            ["clone", `Clone into a new source key and edit the source directories of the clone`],
            ["rename", `Rename the key`],
            ["delete", `Delete the key and select another`],
        ]);
        const { size } = this.#sharedArguments.configuration.sources;
        if (size === 0) {
            // We shouldn't get here, unless users hand-edit the configuration file...
            choicesMap.delete("clone");
            choicesMap.delete("readAll");
        }
        if (size < 2) {
            choicesMap.delete("delete");
        }
        const choices = Array.from(choicesMap.entries()).map(entry => {
            const [value, name] = entry;
            return { name, value };
        });
        const { userSelection } = await this.#prompt([
            {
                name: "userSelection",
                type: "list",
                choices,
                message: `What would you like to do with the "${this.#sourceKey}" source key?`,
                default: "edit"
            }
        ]);
        return userSelection;
    }
    /**
     * Delegate the user's action to the right method.
     * @returns true if the action is a no-op.
     */
    async #doSourceKeyTask(taskName) {
        switch (taskName) {
            case "readAll":
                this.#readAllSources();
                return true;
            case "clone":
            case "add":
                await this.#cloneOrAddSourceKey(taskName === "clone");
            // fall through
            case "edit":
                await this.#editSourceDirectories();
                return false;
            case "rename":
                await this.#renameSourceKey();
                return false;
            case "delete":
                await this.#deleteSourceKey();
                return false;
        }
        return true;
    }
    /** Print to the console the current source maps. */
    #readAllSources() {
        maybeLog(this.#sharedArguments, `
Your current sources key is "${this.#sourceKey}".
Here is your current sources map:
${JSON.stringify(this.#sharedArguments.configuration.sources, null, 2)}
`.trim() + "\n");
    }
    /**
     * Create a new source key and set.
     * @param asClone - true if we're cloning an existing set.
     *
     * @privateRemarks
     * This will violate the sourceStringSet invariant, but
     * `this.#editSourceDirectories()` will repair the violation.
     */
    async #cloneOrAddSourceKey(asClone) {
        const config = this.#sharedArguments.configuration;
        const integration = IntegrationWizard.getExisting(this.#sharedArguments, this.#chooseTasks);
        const newKey = await this.#pickNewSourceKey();
        integration.sourceKey = newKey;
        this.#sourceKey = newKey;
        this.#sourceStringSet = new StringSet(asClone ? this.#sourceStringSet : []);
        config.sources.set(newKey, this.#sourceStringSet);
    }
    /** Rename an existing source key, preserving the source entries. */
    async #renameSourceKey() {
        const newKey = await this.#pickNewSourceKey();
        const { configuration } = this.#sharedArguments;
        configuration.sources.set(newKey, this.#sourceStringSet);
        configuration.integrations.forEach(integration => {
            if (integration.sourceKey === this.#sourceKey) {
                integration.sourceKey = newKey;
            }
        });
        configuration.sources.delete(this.#sourceKey);
        this.#sourceKey = newKey;
    }
    /** Ask the user to give us a new source key. */
    async #pickNewSourceKey() {
        const existingKeys = Array.from(this.#sharedArguments.configuration.sources.keys());
        if (existingKeys.length) {
            existingKeys.sort();
            maybeLog(this.#sharedArguments, `Here are your existing source keys:\n${existingKeys.map(key => "  " + key).join("\n")}`);
        }
        const { newSourceKey } = await this.#prompt([
            {
                name: "newSourceKey",
                type: "input",
                message: "What new source key do you want?",
                validate(newKey) {
                    if (existingKeys.includes(newKey))
                        return "This key name already exists";
                    return true;
                }
            }
        ]);
        return newSourceKey;
    }
    /** Update the user's choice of source directories for the current source key. */
    async #editSourceDirectories() {
        const available = this.#availableSources;
        let addSource = available.size === 0;
        // addSource currently means we _must_ add a directory.
        // If it's false, we can select from existing directories.
        if (!addSource) {
            const sources = Array.from(available.values());
            sources.sort();
            const choices = sources.map(source => {
                return {
                    name: source,
                    value: source,
                    checked: available.has(source),
                };
            });
            choices.push({
                name: "(add new source directory)",
                value: "",
                checked: false,
            });
            const { chooseSources } = await this.#prompt([
                {
                    name: "chooseSources",
                    type: "checkbox",
                    choices,
                }
            ]);
            this.#sourceStringSet = new StringSet(chooseSources);
            this.#sharedArguments.configuration.sources.set(this.#sourceKey, this.#sourceStringSet);
            if (this.#sourceStringSet.has("")) {
                addSource = true;
                this.#sourceStringSet.delete("");
            }
        }
        if (addSource) {
            await this.#addOneDirectory();
        }
    }
    /** Delete the current source key, and update integrations to one the user selects. */
    async #deleteSourceKey() {
        const config = this.#sharedArguments.configuration;
        const existingKeys = Array.from(config.sources.keys());
        {
            const index = existingKeys.indexOf(this.#sourceKey);
            if (index === -1)
                assertFail(`source key "${this.#sourceKey}" not found in existing keys`);
            existingKeys.splice(index, 1);
        }
        let chosenKey;
        if (existingKeys.length === 1) {
            chosenKey = existingKeys[0];
            maybeLog(this.#sharedArguments, `I am selecting for you the remaining source key "${chosenKey}".`);
        }
        else if (existingKeys.length > 1) {
            existingKeys.sort();
            const result = await this.#prompt([
                {
                    name: "chosenKey",
                    type: "list",
                    choices: existingKeys,
                    message: "Which sources key should I use instead?"
                }
            ]);
            chosenKey = result.chosenKey;
        }
        else {
            assertFail("at most one project key remains");
        }
        config.sources.delete(this.#sourceKey);
        config.integrations.forEach(integration => {
            if (integration.sourceKey === this.#sourceKey)
                integration.sourceKey = chosenKey;
        });
        this.#sourceKey = chosenKey;
        this.#sourceStringSet = config.sources.get(chosenKey);
    }
    /** Print the available source directories. */
    #printAvailableSources() {
        const available = this.#availableSources;
        if (available.size) {
            const sources = Array.from(available.values());
            sources.sort();
            maybeLog(this.#sharedArguments, `Here are the current source directories:\n${sources.map(source => "  " + source).join("\n")}`);
        }
    }
    /** Add a brand -new source directory to the sources set. */
    async #addOneDirectory() {
        const available = this.#availableSources;
        const targetDir = this.#targetSourcesDir;
        const { newSourceDir } = await this.#prompt([
            {
                name: "newSourceDir",
                type: "input",
                message: "What source directory name do you want to add?",
                validate(newSourceDir) {
                    const fullPath = path.normalize(path.resolve(targetDir, newSourceDir));
                    if (path.dirname(fullPath) !== targetDir) {
                        return "You must enter a name that will be an immediate child of the sources directory.";
                    }
                    if (available.has(newSourceDir))
                        return "This directory name already exists";
                    return true;
                }
            }
        ]);
        this.#sourceStringSet.add(newSourceDir);
        available.add(newSourceDir);
        await this.#sharedArguments.fsQueue.buildSource(this.#targetSourcesDir, newSourceDir, this.#requiredSource);
    }
    /** Between source wizard operations, make sure we're consistent. */
    #checkInvariants() {
        const { sources } = this.#sharedArguments.configuration;
        if (sources.get(this.#sourceKey) !== this.#sourceStringSet) {
            assertFail("writing to the wrong sources set!");
        }
    }
}
//# sourceMappingURL=Sources.js.map