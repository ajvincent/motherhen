// #region preamble
import type {
  ChooseTasksResults,
  PartialInquirer,
  SharedArguments
} from "./shared-types.js";

import CreateEnvironmentWizard from "./CreateEnvironment.js";
import SharedArgumentsWizard from "./SharedArguments";
import ChooseTasksWizard from "./ChooseTasks";
import FirefoxWizard from "./Firefox";
// #endregion preamble

export type DriverArguments = {
  /**
   * The working directory for operations: Motherhen configuration file,
   * integration directories.
   */
  workingDirectory: string,

  /**
   * The actual Motherhen configuration location, appended to the working
   * directory.
   */
  motherhenConfigLeaf?: string;

  /** Our user-prompting system. */
  inquirer: PartialInquirer;

  /**
   * Suppress messages to the console.  True for tests, false for real users.
   *
   * @internal
   */
  suppressConsole: boolean;

  /**
   * Where to write source files, mozconfigs, etc.
   *
   * This is primarily for testing purposes: in a real user environment, this
   * will be `projectRoot`.  In tests, this will allow me to not fill the
   * Motherhen project with garbage.
   *
   * So why do we need a separate working directory?  Motherhen might not be
   * the location of the user's Motherhen configuration file.  The working
   * directory holds the configuration and the integrations.  Motherhen holds
   * the sources, patches, mozconfigs, and the vanilla Mozilla repository.
   *
   * @internal
   */
  motherhenWriteDirectory: string;
}

/** This integrates several wizards together into a final command-line interface. */
export default class Driver {
  /** Run the wizards, based on user feedback. */
  static async run(driverArguments: DriverArguments) : Promise<void>
  {
    const driver = new Driver(driverArguments);
    await driver.#run();
  }

  #arguments: DriverArguments;
  #sharedArguments?: SharedArguments;
  #chooseTasks?: ChooseTasksResults;

  private constructor(driverArguments: DriverArguments)
  {
    this.#arguments = driverArguments;
  }

  /** Run the wizards at the top level. */
  async #run() : Promise<void>
  {
    this.#sharedArguments = await this.#buildSharedArguments();
    this.#chooseTasks = await this.#invokeChooseTasksWizard();

    this.#chooseTasks.userConfirmed = false;
    if (this.#chooseTasks.isFirefox) {
      await this.#invokeFirefoxWizard();
    }
    else {
      throw new Error("Motherhen wizards not yet implemented");
    }

    if (this.#chooseTasks.userConfirmed)
      await this.#sharedArguments.fsQueue.commit();
  }

  /**
   * If we have a Motherhen configuration file, use it.
   * Otherwise, ask the user to give us the location for one.
   */
  async #buildSharedArguments() : Promise<SharedArguments>
  {
    let shared: SharedArguments;
    if (!this.#arguments.motherhenConfigLeaf)
    {
      shared = await CreateEnvironmentWizard(
        this.#arguments.inquirer,
        this.#arguments.workingDirectory,
        this.#arguments.suppressConsole
      );
      this.#arguments.workingDirectory = shared.pathResolver.getPath(true);
    }
    else {
      shared = await SharedArgumentsWizard.build(
        this.#arguments.inquirer,
        this.#arguments.workingDirectory,
        this.#arguments.suppressConsole,
        this.#arguments.motherhenConfigLeaf
      );
    }

    return shared;
  }

  /** "What do you want me to do?" */
  async #invokeChooseTasksWizard() : Promise<ChooseTasksResults>
  {
    if (!this.#sharedArguments)
      throw new Error("assertion failure: shared arguments must exist");

    return await ChooseTasksWizard.run(this.#sharedArguments);
  }

  /** Ask Firefox-specific configuration questions. */
  async #invokeFirefoxWizard() : Promise<void>
  {
    if (!this.#sharedArguments)
      throw new Error("assertion failure: shared arguments must exist");

    if (!this.#chooseTasks)
      throw new Error("assertion failure: choose tasks must exist");

    await FirefoxWizard.run(this.#sharedArguments, this.#chooseTasks);
  }
}
