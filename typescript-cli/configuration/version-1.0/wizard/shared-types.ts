import PathResolver from "#cli/configuration/PathResolver.js";
import FSQueue from "#cli/configuration/FileSystemQueue.js";
import ConfigFileFormat from "../json/ConfigFileFormat.js";

import type { PartialInquirer } from "#cli/utilities/PartialInquirer.js";

export type { PartialInquirer };

export type SharedArguments = {
  readonly pathResolver: PathResolver;
  readonly fsQueue: FSQueue;
  readonly configuration: ConfigFileFormat;
  readonly inquirer: PartialInquirer;

  readonly postSetupMessages: string[];
  readonly suppressConsole: boolean;
};

export type PathToFileValidation = (s: string) => true | string;

export type PathWithUncreatedDirs = {
  pathToFile: string;
  uncreatedDirs: string[];
};

export type ChooseTasksResults = {
  quickStart: boolean,

  currentProjectKey: string | null,
  newProjectKey: string | null,
  isFirefox: boolean;
  action: "create" | "read" | "update" | "delete" | "bailout",
  userConfirmed: boolean,

  // I'll have each individual wizard handle creating and copying fields.
  newConfigurationParts: ConfigFileFormat;
  copyExistingParts: Set<string>;
};
