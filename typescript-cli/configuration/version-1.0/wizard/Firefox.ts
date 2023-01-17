// #region preamble
import type {
  SharedArguments,
  ChooseTasksResults
} from "./shared-types.js";

import FirefoxJSON, {
  type FirefoxJSONSerialized
} from "../json/Firefox.js";
import { DictionaryMap } from "../json/Dictionary.js";

import InquirerConfirm from "./Confirm.js";
// #endregion preamble

/** Update the Firefox-specific configuration. */
export default class FirefoxWizard
{
  // #region static code
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
    const wizard = new FirefoxWizard(sharedArguments, chooseTasks);
    await wizard.#run();
  }

  static #assert(
    condition: boolean,
    message: string
  ) : condition is true
  {
    if (!condition) {
      return this.#assertFail(message);
    }
    return true;
  }

  static #assertFail(message: string) : never
  {
    throw new Error("assertion failure, " + message);
  }

  // #endregion static code

  #sharedArguments: Readonly<SharedArguments>;
  #firefoxes: DictionaryMap<FirefoxJSON,     FirefoxJSONSerialized>;
  #chooseTasks: ChooseTasksResults;
  #firefoxData: FirefoxJSON;

  /**
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   */
  private constructor(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults
  )
  {
    FirefoxWizard.#assert(
      chooseTasks.isFirefox,
      "don't call a Firefox wizard with a non-Firefox choice"
    );
    FirefoxWizard.#assert(
      !chooseTasks.quickStart,
      "quick start should never lead to a Firefox wizard"
    );
    FirefoxWizard.#assert(
      !chooseTasks.userConfirmed,
      "user confirmed should be reset to false"
    );

    this.#sharedArguments = sharedArguments;
    this.#firefoxes = sharedArguments.configuration.firefoxes;
    this.#chooseTasks = chooseTasks;

    let serialized: FirefoxJSONSerialized = {
      vanillaTag: "release",
      buildType: "optimized",
      targetDirectory: "integrations/firefox-clean"
    };
    this.#firefoxData = FirefoxJSON.fromJSON(
      sharedArguments.pathResolver,
      serialized
    );

    if (this.#chooseTasks.action === "create")
    {
      // Clone the current project, if it exists.
      if (chooseTasks.currentProjectKey) {
        const parsed = this.#firefoxes.get(chooseTasks.currentProjectKey);
        FirefoxWizard.#assert(
          parsed !== undefined,
          `currentProjectKey should point to a current project: "${chooseTasks.currentProjectKey}"`
        );
        serialized = (parsed as FirefoxJSON).toJSON();
      }

      this.#firefoxData = FirefoxJSON.fromJSON(
        sharedArguments.pathResolver,
        serialized
      );
    }

    // set this.#firefoxData to the current project
    else if (
      (this.#chooseTasks.action === "update") ||
      (this.#chooseTasks.action === "delete")
    )
    {
      if (!this.#chooseTasks.currentProjectKey) {
        FirefoxWizard.#assert(
          false,
          "currentProjectKey must exist for an update or delete command"
        );
        return;
      }

      FirefoxWizard.#assert(
        (this.#chooseTasks.action === "delete") === (this.#chooseTasks.newProjectKey === null),
        "newProjectKey must be defined for create or update actions, but not for delete actions"
      );

      const parsed = sharedArguments.configuration.firefoxes.get(
        this.#chooseTasks.currentProjectKey
      );
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
  async #run() : Promise<void>
  {
    if (
      (this.#chooseTasks.action === "create") ||
      (this.#chooseTasks.action === "update")
    )
    {
      return this.#update();
    }

    if (this.#chooseTasks.action === "delete") {
      return this.#delete();
    }

    FirefoxWizard.#assertFail(`unexpected action: ${this.#chooseTasks.action}`);
  }

  /** Update the target Firefox project. */
  async #update() : Promise<void>
  {
    const {
      vanillaTag,
      buildType,
      targetDirectory
    } = await this.#sharedArguments.inquirer.prompt<FirefoxJSONSerialized>
    ([
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

    const key = this.#chooseTasks.newProjectKey as string;
    this.#sharedArguments.configuration.firefoxes.set(key, this.#firefoxData);

    await this.#sharedArguments.fsQueue.writeConfiguration(
      this.#sharedArguments.configuration,
      ".motherhen-config.json"
    );

    this.#sharedArguments.postSetupMessages.push(
      `Your ${key} project has been ${this.#chooseTasks.action}d.`
    );

    this.#chooseTasks.userConfirmed = true;
  }

  /** Delete the user's project, upon a final confirmation. */
  async #delete() : Promise<void>
  {
    const ok = await InquirerConfirm(
      this.#sharedArguments,
      "Are you sure you want to delete this project?  This is your last chance to bail out."
    );
    if (!ok)
      return;

    const key = this.#chooseTasks.currentProjectKey as string;
    this.#firefoxes.delete(key);

    await this.#sharedArguments.fsQueue.writeConfiguration(
      this.#sharedArguments.configuration,
      ".motherhen-config.json"
    );

    this.#sharedArguments.postSetupMessages.push(
      `Your ${key} project has been deleted.`
    );

    this.#chooseTasks.userConfirmed = true;
  }
}
