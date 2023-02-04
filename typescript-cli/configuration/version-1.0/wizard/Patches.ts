/**
 * @see {@link https://www.npmjs.com/package/parse-git-patch}
 * The convention for patches seems to be comment lines, then a summary line,
 * then additional text, then a `---` line.  All I really care about for the wizard
 * is getting the summary line.
 *
 * Mercurial patches seem to start with the line `# HG changeset patch`.
 * The first non-comment line is the summary line we need.
 */

// #region preamble

import path from "path";

import FastGlob from "fast-glob";

import type {
  SharedArguments,
  ChooseTasksResults
} from "./shared-types.js";

import IntegrationWizard from "./Integration.js";

import DictionaryWizardBase, {
  type DictionaryTasks,
  type DictionaryWizardArguments
} from "./DictionaryBase.js";
import PatchesJSON, { PatchesJSONSerialized } from "../json/Patches.js";

import projectRoot from "#cli/utilities/projectRoot.js";
import readDirsDeep from "#cli/utilities/readDirsDeep.js";
import maybeLog from "./maybeLog.js";

import InquirerConfirm from "./Confirm.js";

// #endregion preamble

/** Update the patches map in a configuration. */
export default class PatchesWizard
extends DictionaryWizardBase<PatchesJSON, PatchesJSONSerialized>
{
  // #region static code
  /**
   * The true entry point to the wizard.
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   * @param patchKey - the user's initial patch key, from the appropriate integration settings.
   */
  static async run(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
    patchKey: string,
  ) : Promise<void>
  {
    const patches = new PatchesWizard(
      sharedArguments, chooseTasks, patchKey
    );
    await patches.run();
  }

  /** The dictionary tasks map. */
  static #tasksMap: ReadonlyMap<DictionaryTasks, string> = new Map([
    ["readAll", `Print all patch configurations to the console`],
    ["accept", `Accept the patch configuration as-is`],
    ["update", `Update the patch configuration list, including possibly adding new patch configurations`],
    ["add", `Add a new patch key and use it`],
    ["clone", `Clone into a new patch key and update the patch configurations of the clone`],
    ["rename", `Rename the key`],
    ["delete", `Delete the key and select another`],
  ]);

  static readonly #patchesDir = path.join(projectRoot, "patches");

  /**
   * Ask fast-glob to find a set of patch files matching a glob array.
   *
   * @param globs - the glob array.
   */
  static async #scanGlobs(
    this: void,
    globs: string[]
  ) : Promise<[boolean, Set<string>]>
  {
    let matches: string[] = [], success = false;
    try {
      matches = await FastGlob(
        globs,
        {
          cwd: PatchesWizard.#patchesDir
        }
      );
      success = true;
    }
    catch {
      // do nothing
    }

    return [success, new Set(matches)];
  }

  static readonly #commitModesDescriptions: ReadonlyMap<
    PatchesJSON["commitMode"], string
  > = new Map([
    /* "none", "import", "qimport", "atEnd", */
    ["none", "Do not commit any patches to the integration repository.  I will manage this myself."],
    ["import", `Use "hg import" with each patch.`],
    ["qimport", `Use "hg qimport" with each patch.`],
    ["atEnd", `Commit all patches at the end.`],
  ]);

  /** Validate the user's globs. */
  static async #validateGlobs(
    this: void,
    globsString: string
  ) : Promise<true | string>
  {
    let globs: string[] = [], parsed = false;
    try {
      globs = JSON.parse(globsString) as string[];
      parsed = true;
    }
    catch {
      // do nothing
    }

    if (
      !parsed ||
      !Array.isArray(globs) ||
      !globs.every(glob => typeof glob === "string")
    )
    {
      return "The globs must be an array of strings for fast-glob to process.";
    }

    const [success] = await PatchesWizard.#scanGlobs(globs);
    if (!success)
      return "fast-glob failed to process your globs string.  Please try again."
    return true;
  }
  // #endregion static code

  /**
   * @param sharedArguments - Shared arguments between all wizards here.
   * @param chooseTasks - the user's choices from the ChooseTasks wizard.
   * @param patchKey - the user's initial patch key, from the appropriate integration settings.
   */
  private constructor(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
    patchKey: string,
  )
  {

    let introduction = `
Motherhen provides some patches we believe are necessary to build an
application, at least for now.  You may also have some patches you maintain in
the patches directory.
    `.trim() + "\n\n";

    if (chooseTasks.quickStart) {
      introduction += `
I'm applying a globs pattern of ["**/*.patch"] for you.
      `.trim();
    }
    else {
      introduction += `
In this part, you'll write the globs pattern for the patches to apply, and how
Motherhen should commit your patches (if at all).
      `.trim();
    }

    const dictionaryArguments: DictionaryWizardArguments<
      PatchesJSON, PatchesJSONSerialized
    > = {
      sharedArguments,
      chooseTasks,
      introduction,
      dictionary: sharedArguments.configuration.patches,
      dictionaryName: "patches",
      initialDictionaryKey: patchKey,
      dictionaryTasksMap: PatchesWizard.#tasksMap,

      parentDictionaryUpdater: (newKey: string, updateAll: boolean) => {
        if (updateAll) {
          const { integrations } = this.sharedArguments.configuration;
          integrations.forEach(integration => {
            if (integration.patchKey === this.dictionaryKey) {
              integration.patchKey = newKey;
            }
          });
        }
        else {
          const integration = IntegrationWizard.getExisting(
            this.sharedArguments,
            this.chooseTasks
          );

          integration.patchKey = newKey;
        }
      },

      elementConstructor: (existing: PatchesJSON | null) => {
        if (existing) {
          const serialized = existing.toJSON();
          return PatchesJSON.fromJSON(serialized);
        }
        else {
          const newPatchSet = PatchesJSON.fromJSON(PatchesJSON.blank());
          return newPatchSet;
        }
      }
    };

    super(dictionaryArguments);
  }

  /** A flag for when we must create a patch set (for initially blank configurations). */
  #requiredPatches?: symbol;

  protected initializeWizard(): Promise<void>
  {
    if (this.sharedArguments.configuration.patches.size === 0) {
      this.#requiredPatches = this.sharedArguments.fsQueue.addRequirement("patches");
    }
    return Promise.resolve();
  }

  protected doQuickStart(): Promise<void>
  {
    // there's really nothing to ask the user in this phase.
    (this.dictionaryElement as PatchesJSON).globs.add("**/*.patch");
    this.sharedArguments.fsQueue.resolveRequirement(this.#requiredPatches);
    return Promise.resolve();
  }

  protected async updateDictionary(): Promise<void>
  {
    maybeLog(
      this.sharedArguments,
      `Your current glob set is: ${JSON.stringify((this.dictionaryElement as PatchesJSON).globs)}`
    );
    this.chooseTasks.userConfirmed = false;
    do {
      await this.#printPatchSelections();

      const ok = await InquirerConfirm(
        this.sharedArguments,
        "Is this set of patches okay for you?"
      );
      if (ok) {
        break;
      }

      await this.#promptGlobs();
    } while (!this.chooseTasks.userConfirmed);

    await this.#promptCommitMode();
    await this.#promptCommitMessage();

    this.sharedArguments.fsQueue.resolveRequirement(this.#requiredPatches);
  }

  /** Show the user which files match their glob array. */
  async #printPatchSelections() : Promise<void>
  {
    let { files } = await readDirsDeep(PatchesWizard.#patchesDir);
    {
      const stripLength = (
        PatchesWizard.#patchesDir + path.sep
      ).length;
      files = files.map(f => f.substring(stripLength));
    }

    const matchSet = (await PatchesWizard.#scanGlobs(
      (this.dictionaryElement as PatchesJSON).globs.toJSON()
    ))[1];

    const filesOutput = files.map(
      file => matchSet.has(file) ? `\u2713 ${file}` : `  ${file}`
    ).join("\n");

    maybeLog(
      this.sharedArguments,
      `The current glob set would match:\n${filesOutput}`
    );
  }

  /** Ask for a new glob array. */
  async #promptGlobs() : Promise<void> {
    const patches = this.dictionaryElement as PatchesJSON;
    const {
      globsString
    } = await this.prompt<{
      globsString: string
    }>
    ([
      {
        name: "globsString",
        type: "input",
        default: JSON.stringify(patches.globs),
        message: "What globs pattern would you like to use instead?  If you don't want any changes, just hit Enter.",
        validate: PatchesWizard.#validateGlobs,
      }
    ]);

    patches.globs.clear();
    const userGlobs = JSON.parse(globsString) as string[];
    userGlobs.forEach(userGlob => patches.globs.add(userGlob));
  }

  /** Ask the user to pick a commit mode. */
  async #promptCommitMode() : Promise<void>
  {
    type CommitMode = PatchesJSONSerialized["commitMode"];

    const choices = Array.from(
      PatchesWizard.#commitModesDescriptions.entries()
    ).map(([value, name]) => { return { name, value }});

    const patches = this.dictionaryElement as PatchesJSON
    const { commitMode } = await this.prompt<{
      commitMode: CommitMode
    }>
    ([
      {
        name: "commitMode",
        type: "list",
        choices,
        default: patches.commitMode,
        message: "Which commit mode should we use for patches?"
      }
    ]);

    patches.commitMode = commitMode;
  }

  /** Ask the user to pick a commit message in the "atEnd" case. */
  async #promptCommitMessage() : Promise<void> {
    const patches = this.dictionaryElement as PatchesJSON;
    if (patches.commitMode !== "atEnd") {
      patches.commitMessage = null;
      return;
    }

    const defaultMessage = patches.commitMessage ?? "Apply Motherhen patches.";

    const { commitMessage } = await this.prompt<{
      commitMessage: string
    }>
    ([
      {
        name: "commitMessage",
        type: "input",
        default: defaultMessage,
        message: "What commit message should I use?"
      }
    ]);

    patches.commitMessage = commitMessage;
  }
}
