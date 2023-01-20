import { assertFail } from "./assert.js";
import InquirerConfirm from "./Confirm.js";
import maybeLog from "./maybeLog.js";
import SharedArgumentsImpl from "./SharedArguments.js";
/**
 * Build a dictionary wizard.
 *
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 */
export default class DictionaryWizardBase {
    // #endregion abstract methods
    // #region protected fields
    /** Shared arguments between all wizards here. */
    sharedArguments;
    /** the user's choices from the ChooseTasks wizard. */
    chooseTasks;
    /** The dictionary under the configuration file. */
    dictionary;
    /** The current dictionary key, for looking up the dictionary element. */
    dictionaryKey;
    /** The actual dictionary element the user may want to update.  This belongs to the subclass. */
    dictionaryElement;
    /** A shortcut for the prompting service. */
    prompt;
    // #endregion protected fields
    // #region constructor, async run and invariants
    /**
     * @param wizardArguments - the configuration of this derived class.
     */
    constructor(wizardArguments) {
        this.sharedArguments = wizardArguments.sharedArguments;
        this.chooseTasks = wizardArguments.chooseTasks;
        this.dictionary = wizardArguments.dictionary;
        this.dictionaryKey = wizardArguments.initialDictionaryKey;
        this.#dictionaryName = wizardArguments.dictionaryName;
        this.#dictionaryTasksMap = wizardArguments.dictionaryTasksMap;
        this.#elementConstructor = wizardArguments.elementConstructor;
        this.prompt = SharedArgumentsImpl.getPrompt(this.sharedArguments);
    }
    /** The true entry point to the wizard. */
    async run() {
        if (this.dictionary.has(this.dictionaryKey))
            this.dictionaryElement = this.dictionary.get(this.dictionaryKey);
        else {
            this.dictionaryElement = this.#elementConstructor(null);
            this.dictionary.set(this.dictionaryKey, this.dictionaryElement);
        }
        await this.initializeWizard();
        await this.checkInvariants();
        if (this.chooseTasks.quickStart) {
            return await this.doQuickStart();
        }
        this.chooseTasks.userConfirmed = false;
        do {
            const taskName = await this.#chooseKeyTask();
            const skipConfirm = await this.#executeKeyTask(taskName);
            await this.checkInvariants();
            if (skipConfirm)
                continue;
            this.chooseTasks.userConfirmed = await InquirerConfirm(this.sharedArguments, `Are you finished with changes to ${this.#dictionaryName} keys?`);
        } while (!this.chooseTasks.userConfirmed);
    }
    /** Make sure we haven't violated any invariants between tasks. */
    checkInvariants() {
        if (this.dictionary.get(this.dictionaryKey) !== this.dictionaryElement) {
            assertFail(`writing to the wrong ${this.#dictionaryName} set!`);
        }
        return Promise.resolve();
    }
    // #endregion constructor and async run
    // #region private fields
    /** The name of the dictionary, for inquirer and logging use. */
    #dictionaryName;
    /** A map of task choices and their English-language descriptions. */
    #dictionaryTasksMap;
    /** A method for updating the parent dictionary. */
    #parentDictionaryUpdater;
    /** When we need to replace an element of the dictionary, use this. */
    #elementConstructor;
    /** Ask the user what they want to do next. */
    async #chooseKeyTask() {
        const choicesMap = new Map(this.#dictionaryTasksMap);
        const { size } = this.dictionary;
        if (size === 0) {
            // We shouldn't get here, unless users hand-update the configuration file...
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
        const { userSelection } = await this.prompt([
            {
                name: "userSelection",
                type: "list",
                choices,
                message: `What would you like to do with the "${this.dictionaryKey}" ${this.#dictionaryName} key?`,
                default: "update"
            }
        ]);
        return userSelection;
    }
    /**
     * Delegate the user's action to the right method.
     * @returns true if the action is a no-op.
     */
    async #executeKeyTask(taskName) {
        switch (taskName) {
            case "readAll":
                this.#readDictionary();
                return true;
            case "clone":
            case "add":
                await this.#cloneOrAddKey(taskName === "clone");
            // fall through
            case "update":
                await this.updateDictionary();
                return false;
            case "rename":
                await this.#renameKey();
                return false;
            case "delete":
                await this.#deleteKey();
                return false;
        }
        return true;
    }
    /** Print to the console the current dictionary maps. */
    #readDictionary() {
        maybeLog(this.sharedArguments, `
Your current ${this.#dictionaryName} key is "${this.dictionaryKey}".
Here is your current ${this.#dictionaryName} map:
${JSON.stringify(this.dictionary, null, 2)}
`.trim() + "\n");
    }
    /**
     * Create a new dictionary key and value.
     * @param asClone - true if we're cloning an existing set.
     *
     * @privateRemarks
     * This will violate the dictionary invariant, but `this.updateDictionary()`
     * will repair the violation.
     */
    async #cloneOrAddKey(asClone) {
        const newKey = await this.#pickNewKey();
        if (this.#parentDictionaryUpdater) {
            this.#parentDictionaryUpdater(newKey, false);
        }
        this.dictionaryKey = newKey;
        let newParsed;
        if (asClone) {
            newParsed = this.#elementConstructor(this.dictionaryElement);
        }
        else {
            newParsed = this.#elementConstructor(null);
        }
        this.dictionary.set(newKey, newParsed);
    }
    /** Rename an existing dictionary key, preserving the dictionary entries. */
    async #renameKey() {
        const newKey = await this.#pickNewKey();
        this.dictionary.set(newKey, this.dictionaryElement);
        if (this.#parentDictionaryUpdater) {
            this.#parentDictionaryUpdater(newKey, true);
        }
        this.dictionary.delete(this.dictionaryKey);
        this.dictionaryKey = newKey;
    }
    /** Delete the current dictionary key, and update integrations to one the user selects. */
    async #deleteKey() {
        const existingKeys = Array.from(this.dictionary.keys());
        {
            const index = existingKeys.indexOf(this.dictionaryKey);
            if (index === -1)
                assertFail(`${this.#dictionaryName} key "${this.dictionaryKey}" not found in existing keys`);
            existingKeys.splice(index, 1);
        }
        let chosenKey;
        if (existingKeys.length === 1) {
            chosenKey = existingKeys[0];
            maybeLog(this.sharedArguments, `I am selecting for you the remaining ${this.#dictionaryName} key "${chosenKey}".`);
        }
        else if (existingKeys.length > 1) {
            existingKeys.sort();
            const result = await this.prompt([
                {
                    name: "chosenKey",
                    type: "list",
                    choices: existingKeys,
                    message: `Which ${this.#dictionaryName} key should I use instead?`
                }
            ]);
            chosenKey = result.chosenKey;
        }
        else {
            assertFail("at most one key remains");
        }
        this.dictionary.delete(this.dictionaryKey);
        if (this.#parentDictionaryUpdater) {
            this.#parentDictionaryUpdater(chosenKey, true);
        }
        this.dictionaryKey = chosenKey;
        this.dictionaryElement = this.dictionary.get(chosenKey);
    }
    /** Ask the user to give us a new key. */
    async #pickNewKey() {
        const existingKeys = Array.from(this.dictionary.keys());
        if (existingKeys.length) {
            existingKeys.sort();
            maybeLog(this.sharedArguments, `Here are your existing ${this.#dictionaryName} keys:\n${existingKeys.map(key => "  " + key).join("\n")}`);
        }
        const { newKey } = await this.prompt([
            {
                name: "newKey",
                type: "input",
                message: `What new ${this.#dictionaryName} key do you want?`,
                validate(newKey) {
                    if (existingKeys.includes(newKey))
                        return "This key name already exists";
                    return true;
                }
            }
        ]);
        return newKey;
    }
}
//# sourceMappingURL=DictionaryBase.js.map