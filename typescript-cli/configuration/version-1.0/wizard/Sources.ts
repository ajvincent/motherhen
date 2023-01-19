// #region preamble

import fs from "fs/promises";
import path from "path";

import fileExists from "#cli/utilities/fileExists.js";

import type {
  SharedArguments,
  ChooseTasksResults
} from "./shared-types.js";

import StringSet from "../json/StringSet.js";
import maybeLog from "./maybeLog.js";
import IntegrationWizard from "./Integration.js";

import DictionaryWizardBase, {
  type DictionaryTasks,
  type DictionaryWizardArguments
} from "./DictionaryBase.js";

// #endregion preamble

/** Update the sources map in a configuration, and request new source directories if the user needs them. */
export default class SourcesWizard
extends DictionaryWizardBase<StringSet, string[]>
{
  // #region static code
  /**
   * The true entry point to the wizard.
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   * @param sourceKey - the user's initial source key, from the appropriate integration settings.
   * @param motherhenWriteDirectory - where the user's source directories live.
   */
  static async run(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
    sourceKey: string,
    motherhenWriteDirectory: string,
  ) : Promise<void>
  {
    const sources = new SourcesWizard(
      sharedArguments, chooseTasks, sourceKey, motherhenWriteDirectory
    );
    await sources.run();
  }

  /** The dictionary tasks map. */
  static #tasksMap: ReadonlyMap<DictionaryTasks, string> = new Map([
    ["readAll", `Print all sources to the console`],
    ["update", `Update the source directory list, including possibly adding new source directories`],
    ["add", `Add a new source key and use it`],
    ["clone", `Clone into a new source key and update the source directories of the clone`],
    ["rename", `Rename the key`],
    ["delete", `Delete the key and select another`],
  ]);
  // #endregion static code

  /** Where we write new source directories to. */
  readonly #targetSourcesDir: string;

  /** The list of child directories in the sources directory. */
  #availableSources: StringSet;

  /** A flag for when we must create a source directory (for initially blank configurations). */
  #requiredSource?: symbol;

  /**
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   * @param sourceKey - the user's initial source key, from the appropriate integration settings.
   * @param motherhenWriteDirectory - where the user's source directories live.
   */
  private constructor(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
    sourceKey: string,
    motherhenWriteDirectory: string,
  )
  {
    const dictionaryArguments: DictionaryWizardArguments<StringSet, string[]> = {
      sharedArguments,
      chooseTasks,
      dictionary: sharedArguments.configuration.sources,
      dictionaryName: "sources",
      initialDictionaryKey: sourceKey,
      dictionaryTasksMap: SourcesWizard.#tasksMap,

      parentDictionaryUpdater: (newKey: string, updateAll: boolean) => {
        if (updateAll) {
          const { configuration } = this.sharedArguments;
          configuration.integrations.forEach(integration => {
            if (integration.sourceKey === this.dictionaryKey) {
              integration.sourceKey = newKey;
            }
          });
        }
        else {
          const integration = IntegrationWizard.getExisting(
            this.sharedArguments,
            this.chooseTasks
          );

          integration.sourceKey = newKey;
        }
      },

      elementConstructor: (existing: StringSet | null) => {
        return new StringSet(existing ?? []);
      }
    };

    super(dictionaryArguments);
    this.#targetSourcesDir = path.join(motherhenWriteDirectory, "sources");
    this.#availableSources = new StringSet;
  }

  /** What source directories do we have to start with? */
  async initializeWizard(): Promise<void>
  {
    if (!await fileExists(this.#targetSourcesDir, true)) {
      this.#requiredSource = this.sharedArguments.fsQueue.addRequirement("sources");
      return;
    }

    let entries = await fs.readdir(
      this.#targetSourcesDir,
      {
        encoding: "utf-8",
        withFileTypes: true
      },
    );
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
  async doQuickStart() : Promise<void>
  {
    this.#printAvailableSources();
    await this.#addOneDirectory();
  }

  /** Update the user's choice of source directories for the current source key. */
  async updateDictionary() : Promise<void>
  {
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

      const { chooseSources } = await this.prompt<{
        chooseSources: string[]
      }>
      ([
        {
          name: "chooseSources",
          type: "checkbox",
          choices,
        }
      ]);

      this.dictionaryElement = new StringSet(chooseSources);
      this.dictionary.set(this.dictionaryKey, this.dictionaryElement)

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
  #printAvailableSources() : void
  {
    const available = this.#availableSources;
    if (available.size) {
      const sources = Array.from(available.values());
      sources.sort();
      maybeLog(this.sharedArguments, `Here are the current source directories:\n${
        sources.map(source => "  " + source).join("\n")
      }`);
    }
  }

  /** Add a brand-new source directory to the sources set. */
  async #addOneDirectory() : Promise<void>
  {
    const available = this.#availableSources;
    const targetDir = this.#targetSourcesDir;

    const { newSourceDir } = await this.prompt<{
      newSourceDir: string
    }>
    ([
      {
        name: "newSourceDir",
        type: "input",
        message: "What source directory name do you want to add?",
        validate(newSourceDir: string) : (true | string)
        {
          const fullPath = path.normalize(path.resolve(targetDir, newSourceDir));
          if (path.dirname(fullPath) !== targetDir) {
            return "You must enter a name that will be an immediate child of the sources directory."
          }
          if (available.has(newSourceDir))
            return "This directory name already exists";
          return true;
        }
      }
    ]);

    this.dictionaryElement.add(newSourceDir);
    available.add(newSourceDir);

    await this.sharedArguments.fsQueue.buildSource(
      this.#targetSourcesDir,
      newSourceDir,
      this.#requiredSource
    );
  }
}
