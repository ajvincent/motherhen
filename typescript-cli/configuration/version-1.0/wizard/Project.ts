// #region preamble
import fs from "fs/promises";
import path from "path";

import projectRoot from "#cli/utilities/projectRoot.js";

import ProjectJSON , {
  type ProjectJSONData
} from "../json/Project.js";

import { assertFail } from "./assert.js";

import DictionaryWizardBase, {
  type DictionaryTasks,
  type DictionaryWizardArguments
} from "./DictionaryBase.js";

import {
  SharedArguments,
  ChooseTasksResults,
} from "./shared-types";

import maybeLog from "./maybeLog.js";

import ConfigurationSummary from "../json/Summary.js";
import InquirerConfirm from "./Confirm.js";
// #endregion preamble

/** Update the projects map in a configuration, after integrations are in place. */
export default class ProjectWizard
extends DictionaryWizardBase<ProjectJSON, ProjectJSONData>
{
  /**
   * The true entry point to the wizard.
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   */
  static async run(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults
  ) : Promise<void>
  {
    if (chooseTasks.action === "delete") {
      assertFail("delete action is explicitly disallowed for its complexity");
    }
    if (!chooseTasks.newProjectKey) {
      assertFail("create and update actions require a new project key");
    }
    const wizard = new ProjectWizard(sharedArguments, chooseTasks);
    await wizard.run();
  }

  /** The dictionary tasks map. */
  static #tasksMap: ReadonlyMap<DictionaryTasks, string> = new Map([
    ["readAll", `Print all projects to the console`],
    ["update", `Update the project configuration`],
  ]);

  /** The available mozconfigs. */
  static readonly #mozconfigChoices = (async () : Promise<string[]> => {
    const mozconfigDir = path.join(projectRoot, "mozconfigs/base");
    const files = await fs.readdir(mozconfigDir, { encoding: "utf-8" });
    files.sort();
    return files.map(file => file.replace(/\.mozconfig$/, ""));
  })();

  /**
   * Helper for getting the existing project for integrations.
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   * @returns a project configuration.
   */
  static getExisting(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
  ) : ProjectJSON
  {
    const config = sharedArguments.configuration;

    const project = config.projects.get(
      chooseTasks.newProjectKey as string
    );
    if (project === undefined)
      assertFail("project must be defined");

    return project;
  }

  /**
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   */
  private constructor(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
  )
  {
    const dictionaryArguments: DictionaryWizardArguments<
      ProjectJSON, ProjectJSONData
    > = {
      sharedArguments,
      chooseTasks,
      introduction: `
We're almost done!  Now it's time to configure the project: the integration
key, the mozconfig file, and the application directory to build from.
      `,
      dictionary: sharedArguments.configuration.projects,
      dictionaryName: "projects",
      initialDictionaryKey: chooseTasks.newProjectKey as string,
      dictionaryTasksMap: ProjectWizard.#tasksMap,

      // no parent dictionary

      elementConstructor: (existing: ProjectJSON | null) => {
        if (existing) {
          return ProjectJSON.fromJSON(existing.toJSON());
        }

        return ProjectJSON.fromJSON({
          integrationKey: "",
          mozconfig: "",
          appDir: "",
        });
      },
    }

    super(dictionaryArguments);
  }

  /** A flag for when we must create a project definition (for initially blank configurations). */
  #requiredProject?: symbol;

  protected async initializeWizard(): Promise<void> {
    if (this.sharedArguments.configuration.projects.size === 0) {
      this.#requiredProject = this.sharedArguments.fsQueue.addRequirement("project");
    }
    await ProjectWizard.#mozconfigChoices;
  }

  protected async doQuickStart(): Promise<void> {
    const project = this.dictionaryElement as ProjectJSON;
    {
      const keys = Array.from(this.sharedArguments.configuration.integrations.keys());
      project.integrationKey = keys[0];
    }

    await this.#pickMozconfig(project);

    {
      const sourceSets = Array.from(this.sharedArguments.configuration.sources.values());
      const firstSourceSet = sourceSets[0];
      const sources = Array.from(firstSourceSet.values());
      project.appDir = sources[0];
    }

    this.sharedArguments.fsQueue.resolveRequirement(this.#requiredProject);
  }

  protected async updateDictionary(): Promise<void>
  {
    this.chooseTasks.userConfirmed = false;
    const project = this.dictionaryElement as ProjectJSON;
    do {
      await this.#pickIntegrationKey(project);
      await this.#pickMozconfig(project);
      await this.#pickAppDir(project);
      this.dictionary.set(this.dictionaryKey, project);
      await this.#printSummaryAndConfirm();
    } while (!this.chooseTasks.userConfirmed);

    this.sharedArguments.fsQueue.resolveRequirement(this.#requiredProject);
  }

  /**
   * Ask the user for the integration key for their project.
   * @param project - the project owning the integration key.
   */
  async #pickIntegrationKey(project: ProjectJSON) : Promise<void>
  {

    const choices = Array.from(
      this.sharedArguments.configuration.integrations.keys()
    );
    if (choices.length === 0)
      assertFail("we should have at least one integration key now");

    if (choices.length === 1) {
      maybeLog(this.sharedArguments, `
I am using the integration key "${choices[0]}" as the only option available.
      `.trim());
      project.integrationKey = choices[0];
      return;
    }

    const { integrationKey } = await this.prompt<{
      integrationKey: string
    }>
    ([
      {
        name: "integrationKey",
        type: "list",
        choices,
        message: "Which integration key would you like to use?",
        default: (choices.includes(project.integrationKey) ?
          project.integrationKey :
          undefined
        )
      }
    ]);

    project.integrationKey = integrationKey;
  }

  /**
   * Ask the user for the mozconfig for their project.
   * @param project - the project owning the integration key.
   */
  async #pickMozconfig(project: ProjectJSON) : Promise<void>
  {
    const choices = await ProjectWizard.#mozconfigChoices;

    const { mozconfig } = await this.prompt<{
      mozconfig: string
    }>
    ([
      {
        name: "mozconfig",
        type: "list",
        choices,
        message: `Which build mode (based on mozconfigs/base/*) would you like to use?`
      }
    ]);

    project.mozconfig = mozconfig;
  }

  /**
   * Ask the user for the application directory, from their source set, for their project.
   * @param project - the project owning the integration key.
   */
  async #pickAppDir(project: ProjectJSON) : Promise<void>
  {
    let choices: string[];
    {
      const config = this.sharedArguments.configuration;
      const integration = config.integrations.get(project.integrationKey);
      if (!integration)
        assertFail("integration key should point to a live integration object");

      const sourceSet = config.sources.get(integration.sourceKey);
      if (!sourceSet)
        assertFail("source key should point to a live sources set");

      if (sourceSet.size === 0)
        assertFail("source set should not be empty");

      choices = Array.from(sourceSet);
    }

    if (choices.length === 1) {
      maybeLog(this.sharedArguments, `
I am using the application directory "${choices[0]}" as the only option available.
      `.trim());
      project.appDir = choices[0];
      return;
    }

    const { appDir } = await this.prompt<{
      appDir: string
    }>
    ([
      {
        name: "appDir",
        type: "list",
        choices,
        message: "Which application directory would you like to use?",
        default: (choices.includes(project.appDir) ?
          project.appDir :
          undefined
        )
      }
    ]);

    project.appDir = appDir;
  }

  /** Last step!  Make sure everything looks good for the overall configuration. */
  async #printSummaryAndConfirm() : Promise<void> {
    const summary = ConfigurationSummary(
      this.sharedArguments.configuration,
      this.chooseTasks.newProjectKey as string,
      false,
      this.sharedArguments.suppressConsole
    );
    if (summary.isFirefox)
      assertFail("we shouldn't get a Firefox summary!");

    maybeLog(
      this.sharedArguments,
      `
Here is your overall project summary:
${JSON.stringify(summary, null, 2)}
      `.trim()
    );

    this.chooseTasks.userConfirmed = await InquirerConfirm(
      this.sharedArguments,
      "Is this project summary correct?"
    );
  }
}
