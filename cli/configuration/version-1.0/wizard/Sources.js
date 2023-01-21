// #region preamble
import fs from "fs/promises";
import path from "path";
import fileExists from "#cli/utilities/fileExists.js";
import StringSet from "../json/StringSet.js";
import maybeLog from "./maybeLog.js";
import IntegrationWizard from "./Integration.js";
import DictionaryWizardBase from "./DictionaryBase.js";
// #endregion preamble
/** Update the sources map in a configuration, and request new source directories if the user needs them. */
export default class SourcesWizard extends DictionaryWizardBase {
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
        await sources.run();
    }
    /** The dictionary tasks map. */
    static #tasksMap = new Map([
        ["readAll", `Print all sources to the console`],
        ["update", `Update the source directory list, including possibly adding new source directories`],
        ["add", `Add a new source key and use it`],
        ["clone", `Clone into a new source key and update the source directories of the clone`],
        ["rename", `Rename the key`],
        ["delete", `Delete the key and select another`],
    ]);
    // #endregion static code
    /** Where we write new source directories to. */
    #targetSourcesDir;
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
        const dictionaryArguments = {
            sharedArguments,
            chooseTasks,
            introduction: `
Motherhen allows you to have multiple source directories in your integration
repository.  In your Motherhen repository, these directories will live in the
"sources" directory.  In the integration repository, these directories will be
symbolic links under the hg-ignored "motherhen" directory.

Each source directory is potentially a new Mozilla-based application.  It's up
to you if you want to use them as such, or just refer to them in a DIRS variable
from a "moz.build" file.  You will have to select one source directory as your
application directory later (in the project configuration), so Motherhen knows
what application to build.

In this part, I'll help you manage your source directories.
      `,
            dictionary: sharedArguments.configuration.sources,
            dictionaryName: "sources",
            initialDictionaryKey: sourceKey,
            dictionaryTasksMap: SourcesWizard.#tasksMap,
            parentDictionaryUpdater: (newKey, updateAll) => {
                if (updateAll) {
                    const { configuration } = this.sharedArguments;
                    configuration.integrations.forEach(integration => {
                        if (integration.sourceKey === this.dictionaryKey) {
                            integration.sourceKey = newKey;
                        }
                    });
                }
                else {
                    const integration = IntegrationWizard.getExisting(this.sharedArguments, this.chooseTasks);
                    integration.sourceKey = newKey;
                }
            },
            elementConstructor: (existing) => {
                return new StringSet(existing ?? []);
            }
        };
        super(dictionaryArguments);
        this.#targetSourcesDir = path.join(motherhenWriteDirectory, "sources");
        this.#availableSources = new StringSet;
    }
    /** What source directories do we have to start with? */
    async initializeWizard() {
        if (!await fileExists(this.#targetSourcesDir, true)) {
            this.#requiredSource = this.sharedArguments.fsQueue.addRequirement("sources");
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
            this.#requiredSource = this.sharedArguments.fsQueue.addRequirement("sources");
        }
    }
    /** Set up default sources for the first-time user. */
    async doQuickStart() {
        this.#printAvailableSources();
        await this.#addOneDirectory();
    }
    /** Update the user's choice of source directories for the current source key. */
    async updateDictionary() {
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
            const { chooseSources } = await this.prompt([
                {
                    name: "chooseSources",
                    type: "checkbox",
                    choices,
                }
            ]);
            this.dictionaryElement = new StringSet(chooseSources);
            this.dictionary.set(this.dictionaryKey, this.dictionaryElement);
            if (this.dictionaryElement.has("")) {
                addSource = true;
                this.dictionaryElement.delete("");
            }
        }
        if (addSource) {
            await this.#addOneDirectory();
        }
    }
    /** Print the available source directories. */
    #printAvailableSources() {
        const available = this.#availableSources;
        if (available.size) {
            const sources = Array.from(available.values());
            sources.sort();
            maybeLog(this.sharedArguments, `Here are the current source directories:\n${sources.map(source => "  " + source).join("\n")}`);
        }
    }
    /** Add a brand-new source directory to the sources set. */
    async #addOneDirectory() {
        const available = this.#availableSources;
        const targetDir = this.#targetSourcesDir;
        const { newSourceDir } = await this.prompt([
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
        this.dictionaryElement.add(newSourceDir);
        available.add(newSourceDir);
        await this.sharedArguments.fsQueue.buildSource(this.#targetSourcesDir, newSourceDir, this.#requiredSource);
    }
}
//# sourceMappingURL=Sources.js.map