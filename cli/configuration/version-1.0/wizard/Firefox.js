import FirefoxJSON from "../json/Firefox.js";
import InquirerConfirm from "./Confirm.js";
// #endregion preamble
/** Update the Firefox-specific configuration. */
export default class FirefoxWizard {
    // #region static code
    /**
     * The true entry point to the wizard.
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     */
    static async run(sharedArguments, chooseTasks) {
        const wizard = new FirefoxWizard(sharedArguments, chooseTasks);
        await wizard.#run();
    }
    static #assert(condition, message) {
        if (!condition) {
            return this.#assertFail(message);
        }
        return true;
    }
    static #assertFail(message) {
        throw new Error("assertion failure, " + message);
    }
    // #endregion static code
    #sharedArguments;
    #firefoxes;
    #chooseTasks;
    #firefoxData;
    /**
     * @param sharedArguments - Shared arguments between all wizards here.
     * @param chooseTasks - the user's choices from the ChooseTasks wizard.
     */
    constructor(sharedArguments, chooseTasks) {
        FirefoxWizard.#assert(chooseTasks.isFirefox, "don't call a Firefox wizard with a non-Firefox choice");
        FirefoxWizard.#assert(!chooseTasks.quickStart, "quick start should never lead to a Firefox wizard");
        this.#sharedArguments = sharedArguments;
        this.#firefoxes = sharedArguments.configuration.firefoxes;
        this.#chooseTasks = chooseTasks;
        let serialized = {
            vanillaTag: "release",
            buildType: "optimized",
            targetDirectory: "integrations/firefox-clean"
        };
        this.#firefoxData = FirefoxJSON.fromJSON(sharedArguments.pathResolver, serialized);
        if (this.#chooseTasks.action === "create") {
            // Clone the current project, if it exists.
            if (chooseTasks.currentProjectKey) {
                const parsed = this.#firefoxes.get(chooseTasks.currentProjectKey);
                FirefoxWizard.#assert(parsed !== undefined, `currentProjectKey should point to a current project: "${chooseTasks.currentProjectKey}"`);
                serialized = parsed.toJSON();
            }
            this.#firefoxData = FirefoxJSON.fromJSON(sharedArguments.pathResolver, serialized);
        }
        // set this.#firefoxData to the current project
        else if ((this.#chooseTasks.action === "update") ||
            (this.#chooseTasks.action === "delete")) {
            if (!this.#chooseTasks.currentProjectKey) {
                FirefoxWizard.#assert(false, "currentProjectKey must exist for an update or delete command");
                return;
            }
            FirefoxWizard.#assert((this.#chooseTasks.action === "delete") === (this.#chooseTasks.newProjectKey === null), "newProjectKey must be defined for create or update actions, but not for delete actions");
            const parsed = sharedArguments.configuration.firefoxes.get(this.#chooseTasks.currentProjectKey);
            if (!parsed)
                FirefoxWizard.#assertFail("currentProjectKey doesn't reflect an existing project");
            this.#firefoxData = parsed;
        }
        // we shouldn't get here
        else {
            FirefoxWizard.#assertFail(`unexpected action: ${this.#chooseTasks.action}`);
        }
    }
    /** Delegate the user's action to the right method. */
    async #run() {
        if ((this.#chooseTasks.action === "create") ||
            (this.#chooseTasks.action === "update")) {
            return this.#update();
        }
        if (this.#chooseTasks.action === "delete") {
            return this.#delete();
        }
        FirefoxWizard.#assertFail(`unexpected action: ${this.#chooseTasks.action}`);
    }
    /** Update the target Firefox project. */
    async #update() {
        const { vanillaTag, buildType, targetDirectory } = await this.#sharedArguments.inquirer.prompt([
            {
                name: "vanillaTag",
                type: "input",
                default: this.#firefoxData.vanillaTag,
                message: "Which bookmark or tag should Firefox build from?",
            },
            {
                name: "buildType",
                type: "list",
                choices: ["optimized", "debug", "symbols"],
                default: this.#firefoxData.buildType,
                message: "Which type of build should we configure?",
            },
            {
                name: "targetDirectory",
                type: "input",
                default: this.#firefoxData.targetDirectory.getPath(true),
                message: "Where should we generate the integration directory (repository, object builds, etc.)?"
            }
        ]);
        const ok = await InquirerConfirm(this.#sharedArguments);
        if (!ok)
            return;
        // Apply the user's choices.
        this.#firefoxData.vanillaTag = vanillaTag;
        this.#firefoxData.buildType = buildType;
        this.#firefoxData.targetDirectory.setPath(true, targetDirectory);
        const key = this.#chooseTasks.newProjectKey;
        this.#sharedArguments.configuration.firefoxes.set(key, this.#firefoxData);
        await this.#sharedArguments.fsQueue.writeConfiguration(this.#sharedArguments.configuration, ".motherhen-config.json");
        this.#sharedArguments.postSetupMessages.push(`Your ${key} project has been ${this.#chooseTasks.action}d.`);
    }
    /** Delete the user's project, upon a final confirmation. */
    async #delete() {
        const ok = await InquirerConfirm(this.#sharedArguments, "Are you sure you want to delete this project?  This is your last chance to bail out.");
        if (!ok)
            return;
        const key = this.#chooseTasks.currentProjectKey;
        this.#firefoxes.delete(key);
        await this.#sharedArguments.fsQueue.writeConfiguration(this.#sharedArguments.configuration, ".motherhen-config.json");
        this.#sharedArguments.postSetupMessages.push(`Your ${key} project has been deleted.`);
    }
}
//# sourceMappingURL=Firefox.js.map