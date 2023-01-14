import PathResolver from "#cli/configuration/PathResolver";
import FSQueue from "#cli/configuration/FileSystemQueue";
import ConfigFileFormat from "../json/ConfigFileFormat";

import type { PartialInquirer } from "#cli/utilities/PartialInquirer";

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
