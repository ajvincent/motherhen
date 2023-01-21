// #region preamble
import path from "path";
import CreateEnvironmentWizard from "./CreateEnvironment.js";
import SharedArgumentsWizard from "./SharedArguments.js";
import ChooseTasksWizard from "./ChooseTasks.js";
import FirefoxWizard from "./Firefox.js";
import SourcesWizard from "./Sources.js";
import PatchesWizard from "./Patches.js";
import IntegrationWizard from "./Integration.js";
import ProjectWizard from "./Project.js";
import { assertFail } from "./assert.js";
import maybeLog from "./maybeLog.js";
import projectRoot from "#cli/utilities/projectRoot.js";
/** This integrates several wizards together into a final command-line interface. */
export default class Driver {
    /** Run the wizards, based on user feedback. */
    static async run(driverArguments) {
        const driver = new Driver(driverArguments);
        await driver.#run();
    }
    #arguments;
    #sharedArguments;
    #chooseTasks;
    constructor(driverArguments) {
        this.#arguments = driverArguments;
    }
    /** Run the wizards at the top level. */
    async #run() {
        this.#sharedArguments = await this.#buildSharedArguments();
        this.#chooseTasks = await this.#invokeChooseTasksWizard();
        this.#chooseTasks.userConfirmed = false;
        if (this.#chooseTasks.isFirefox) {
            await this.#invokeFirefoxWizard();
        }
        else {
            await this.#invokeMotherhenWizards();
        }
        if (!this.#chooseTasks.userConfirmed)
            return;
        await this.#sharedArguments.fsQueue.commit();
        if (!this.#chooseTasks.isFirefox)
            this.#motherhenEpilogue();
    }
    /**
     * If we have a Motherhen configuration file, use it.
     * Otherwise, ask the user to give us the location for one.
     */
    async #buildSharedArguments() {
        let shared;
        if (!this.#arguments.motherhenConfigLeaf) {
            shared = await CreateEnvironmentWizard(this.#arguments.inquirer, this.#arguments.workingDirectory, this.#arguments.suppressConsole);
            this.#arguments.workingDirectory = shared.pathResolver.getPath(true);
        }
        else {
            shared = await SharedArgumentsWizard.build(this.#arguments.inquirer, this.#arguments.workingDirectory, this.#arguments.suppressConsole, this.#arguments.motherhenConfigLeaf);
        }
        return shared;
    }
    /** "What do you want me to do?" */
    async #invokeChooseTasksWizard() {
        if (!this.#sharedArguments)
            assertFail("shared arguments must exist");
        return await ChooseTasksWizard.run(this.#sharedArguments);
    }
    /** Ask Firefox-specific configuration questions. */
    async #invokeFirefoxWizard() {
        await FirefoxWizard.run(this.#sharedArguments, this.#chooseTasks);
    }
    /** Run the Motherhen-specific configuration wizards! */
    async #invokeMotherhenWizards() {
        const shared = this.#sharedArguments;
        const tasks = this.#chooseTasks;
        const config = shared.configuration;
        const initialProject = config.projects.get(tasks.newProjectKey ??
            tasks.currentProjectKey ??
            "default");
        const initialIntegrationKey = (initialProject?.integrationKey ?? "(default)");
        const initialIntegration = config.integrations.get(initialIntegrationKey);
        const initialSourceKey = initialIntegration?.sourceKey ?? "(default)", initialPatchKey = initialIntegration?.patchKey ?? "(default)";
        const writeDir = this.#arguments.motherhenWriteDirectory;
        await SourcesWizard.run(shared, tasks, initialSourceKey, writeDir);
        await PatchesWizard.run(shared, tasks, initialPatchKey);
        await IntegrationWizard.run(shared, tasks, initialIntegrationKey);
        await ProjectWizard.run(shared, tasks);
        if (!tasks.userConfirmed)
            assertFail("how did we get to the end without user confirmation?");
        const destination = path.join(this.#arguments.workingDirectory, this.#arguments.motherhenConfigLeaf ?? ".motherhen-config.json");
        await shared.fsQueue.writeConfiguration(shared.configuration, destination);
    }
    /** Final text for the user. */
    #motherhenEpilogue() {
        const shared = this.#sharedArguments;
        const tasks = this.#chooseTasks;
        maybeLog(shared, `Congratulations!  I've completed updating your Motherhen configuration.\n`);
        if (tasks.action === "delete")
            return;
        const destination = path.join(this.#arguments.motherhenWriteDirectory, this.#arguments.motherhenConfigLeaf ?? ".motherhen-config.json");
        const projectArg = tasks.newProjectKey === "default" ? "" : ` --project=${tasks.newProjectKey}`;
        let configArg = "";
        const defaultDestination = path.join(projectRoot, ".motherhen-config.json");
        if (defaultDestination !== destination) {
            configArg = ` --config=${destination}`;
        }
        maybeLog(shared, `
Your next step should probably be to run:
./cli/motherhen.js create${projectArg}${configArg}
      `.trim());
    }
}
//# sourceMappingURL=Driver.js.map