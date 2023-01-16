import maybeLog from "./maybeLog.js";
import SharedArgumentsImpl from "./SharedArguments.js";
import ConfigurationSummary from "../json/Summary.js";
import ConfigFileFormat from "../json/ConfigFileFormat.js";
export default class ChooseTasksWizard {
    /**
     * Ask the user for what tasks they want to do, to which existing and new projects.
     * @param sharedArguments - Shared arguments between all wizards here.
     * @returns the user's choices.
     */
    static async run(sharedArguments) {
        const wizard = new ChooseTasksWizard(sharedArguments);
        await wizard.#run();
        return wizard.#chooseTasks;
    }
    /** Shared arguments between all wizards here. */
    #sharedArguments;
    /** a shortcut to the actual prompt method. */
    #prompt;
    /** The in-progress tasks we're working on. */
    #chooseTasks;
    // #region entry and exit code
    /**
     * The initial state for the wizard.
     * @param sharedArguments - Shared arguments between all wizards here.
     */
    constructor(sharedArguments) {
        this.#sharedArguments = sharedArguments;
        this.#prompt = SharedArgumentsImpl.getPrompt(sharedArguments);
        this.#chooseTasks = {
            quickStart: false,
            currentProjectKey: null,
            newProjectKey: null,
            isFirefox: false,
            action: "bailout",
            userConfirmed: false,
            newConfigurationParts: ConfigFileFormat.fromJSON(this.#sharedArguments.pathResolver, ConfigFileFormat.blank()),
            copyExistingParts: new Set,
        };
    }
    /** Query the user for all task decisions, looping until the user confirms. */
    async #run() {
        await this.#maybeQuickStart();
        while (!this.#chooseTasks.userConfirmed) {
            await this.#maybeChooseFirefox();
            if (this.#chooseTasks.isFirefox) {
                await this.#selectFirefoxTasks();
            }
            else {
                await this.#selectMotherhenTasks();
            }
        }
    }
    /** If there are no Motherhen configurations available, ask if the user wants to set one up quickly. */
    async #maybeQuickStart() {
        if (this.#sharedArguments.configuration.projects.size > 0)
            return;
        maybeLog(this.#sharedArguments, `You have no projects set up right now.`);
        const result = await this.#prompt([
            {
                type: "confirm",
                name: "doQuickStart",
                message: "Would you like Motherhen to set up an initial project for you in the integrations directory with some default settings?",
                default: true,
            }
        ]);
        if (result.doQuickStart) {
            this.#chooseTasks.quickStart = true;
            this.#chooseTasks.newProjectKey = "default";
            this.#chooseTasks.action = "create";
            this.#chooseTasks.userConfirmed = true;
            return;
        }
    }
    /**
     * Ask the user if they want to modify a Firefox sanity-build project instead.
     *
     * @remarks
     *
     * At this time, I only support three types of Firefox build:
     * optimized, debug, and build-symbols.
     *
     * Motherhen is not a substitute for a regular Firefox development environment.
     * Please don't try to use it as such.  Really, these options exist only to
     * let users try to isolate a bustage to their own code versus upstream
     * Mozilla code.
     */
    async #maybeChooseFirefox() {
        const { isFirefox } = await this.#prompt([
            {
                name: "isFirefox",
                type: "confirm",
                default: false,
                message: "Do you want to set up or edit a Firefox verification build?"
            }
        ]);
        this.#chooseTasks.isFirefox = isFirefox;
    }
    // #endregion entry and exit code
    // #region Firefox-related tasks
    /** Select the Firefox project-specific tasks. */
    async #selectFirefoxTasks() {
        await this.#selectCurrentFirefoxProject();
        if (this.#chooseTasks.currentProjectKey) {
            await this.#selectAction();
        }
        await this.#processMaybeAction();
        if (this.#chooseTasks.action === "bailout")
            return;
        await this.#confirmChoices();
    }
    /**
     * Select a current Firefox project to work with.
     * If there are none, default to creating one later.
     */
    async #selectCurrentFirefoxProject() {
        const names = Array.from(this.#sharedArguments.configuration.firefoxes.keys());
        if (names.length === 0) {
            this.#chooseTasks.currentProjectKey = null;
            this.#chooseTasks.action = "create";
            return;
        }
        names.sort();
        const summaries = Object.fromEntries(names.map(key => [key, this.#getSummary(key, true)]));
        maybeLog(this.#sharedArguments, `Here is a summary of your current Firefox projects:\n${JSON.stringify(summaries, null, 2)}`);
        const { currentProject } = await this.#prompt([
            {
                name: "currentProject",
                type: "list",
                message: "Which project would you like to work with?",
                choices: names.concat("(start a new one)"),
            }
        ]);
        this.#chooseTasks.currentProjectKey = (currentProject.startsWith("(") ? null : currentProject);
    }
    // #endregion Firefox tasks
    // #region Motherhen tasks
    /** Select the Motherhen-specific tasks. */
    async #selectMotherhenTasks() {
        await this.#selectCurrentMotherhenProject();
        if (this.#chooseTasks.currentProjectKey) {
            await this.#selectAction();
        }
        await this.#processMaybeAction();
        if (this.#chooseTasks.action === "bailout")
            return;
        await this.#maybeSelectCarryovers();
        await this.#confirmChoices();
    }
    /**
     * Select a current Motherhen project to work with.
     * If there are none, default to creating one later.
     */
    async #selectCurrentMotherhenProject() {
        const names = Array.from(this.#sharedArguments.configuration.projects.keys());
        if (!names.length) {
            this.#chooseTasks.currentProjectKey = null;
            this.#chooseTasks.action = "create";
            return;
        }
        names.sort();
        const { currentProject } = await this.#prompt([
            {
                name: "currentProject",
                type: "list",
                message: "Choose a current project",
                choices: names.concat("(start a new one)"),
            }
        ]);
        this.#chooseTasks.currentProjectKey = (currentProject.startsWith("(") ? null : currentProject);
    }
    /** Select the parts of the Motherhen configuration we are _not_ going to edit or replace. */
    async #maybeSelectCarryovers() {
        const { action } = this.#chooseTasks;
        let message;
        if (action === "create") {
            if (!this.#chooseTasks.currentProjectKey)
                return;
            if (this.#chooseTasks.newProjectKey)
                message = message = `Which settings would you like to copy from the current project to the new project?`;
            else
                message = `Which settings should Motherhen use defaults for?`;
        }
        else if (action !== "update")
            return;
        else {
            message = `Which settings would you like to keep as-is?`;
        }
        this.#printProjectSummary();
        const { copyExisting } = await this.#prompt([
            {
                name: "copyExisting",
                type: "checkbox",
                message,
                choices: [
                    {
                        name: "Sets of source directories",
                        value: "sources",
                    },
                    {
                        name: "Sets of patches",
                        value: "patches",
                    },
                    {
                        name: "Basic mozconfig files (excluding application names)",
                        value: "mozconfigs",
                    },
                    {
                        name: "Integration settings: vanilla repository tag, choices of source sets, patch sets, and a working directory",
                        value: "integrations",
                    },
                    {
                        name: "Projects: choice of integration settings, mozconfig file, and application directory / name",
                        value: "projects",
                    }
                ]
            }
        ]);
        this.#chooseTasks.copyExistingParts = new Set(copyExisting);
    }
    // #endregion Motherhen tasks
    // #region shared code between Firefox and Motherhen tasks
    /**
     * What does the user want us to do?
     * Create, read, update, delete, or "bailout" for "I made a mistake in my earlier choices".
     */
    async #selectAction() {
        const choices = [
            {
                name: `Create a new project as a copy`,
                value: "create",
            },
            {
                name: `Print a summary`,
                value: "read"
            },
            {
                name: `Update the project`,
                value: "update"
            },
            {
                name: `Delete the project`,
                value: "delete",
            },
            {
                name: "Actually, I want to do something with a different project",
                value: "bailout"
            }
        ];
        const { action } = await this.#prompt([
            {
                name: "action",
                type: "list",
                message: `What would you like to do with the "${this.#chooseTasks.currentProjectKey}" project?`,
                choices,
            }
        ]);
        this.#chooseTasks.action = action;
    }
    /** Update the tasks data based on the user's choice of action. */
    async #processMaybeAction() {
        const { action } = this.#chooseTasks;
        if (action === "read") {
            this.#printProjectSummary();
            this.#chooseTasks.action = "bailout";
        }
        if (action === "create")
            return await this.#selectNewProjectKey();
        if (action === "update") {
            this.#chooseTasks.newProjectKey = this.#chooseTasks.currentProjectKey;
        }
    }
    /** Print the current project's summary. */
    #printProjectSummary() {
        if (!this.#chooseTasks.currentProjectKey)
            throw new Error('assertion failure, currentProjectKey is null');
        const summary = this.#getSummary(this.#chooseTasks.currentProjectKey, this.#chooseTasks.isFirefox);
        maybeLog(this.#sharedArguments, `Here is a summary of your current "${this.#chooseTasks.currentProjectKey}" project:\n${JSON.stringify(summary, null, 2)}`);
    }
    /** Ask the user to give us a new project key. */
    async #selectNewProjectKey() {
        let existingNames;
        {
            const config = this.#sharedArguments.configuration;
            let iterable;
            if (this.#chooseTasks.isFirefox)
                iterable = config.firefoxes.keys();
            else
                iterable = config.projects.keys();
            existingNames = new Set(iterable);
        }
        const { newProjectKey } = await this.#prompt([
            {
                name: "newProjectKey",
                type: "input",
                message: "What key name would you like to give the new project?",
                validate: function (newProjectKey) {
                    newProjectKey = newProjectKey.trim();
                    if (newProjectKey === "")
                        return "White-space-only names are not allowed.";
                    if (newProjectKey.startsWith("("))
                        return "Opening parentheses are not allowed.";
                    if (existingNames.has(newProjectKey))
                        return `There is already a project with the key "${newProjectKey}".`;
                    return true;
                }
            }
        ]);
        this.#chooseTasks.newProjectKey = newProjectKey.trim();
    }
    /**
     * Get a summary of an existing project for human consumption.
     *
     * @param projectKey - the project key.
     * @param isFirefox - true if this is a Firefox project.
     */
    #getSummary(projectKey, isFirefox) {
        const summary = ConfigurationSummary(this.#sharedArguments.configuration, projectKey, isFirefox, this.#sharedArguments.suppressConsole);
        delete summary.isComplete;
        delete summary.isFirefox;
        return summary;
    }
    /** Confirm the user's choices with the user before proceeding. */
    async #confirmChoices() {
        const { ok } = await this.#prompt([
            {
                name: "ok",
                type: "confirm",
                default: false,
                message: "Are you okay with your choices so far?"
            }
        ]);
        this.#chooseTasks.userConfirmed = ok;
    }
}
//# sourceMappingURL=ChooseTasks.js.map