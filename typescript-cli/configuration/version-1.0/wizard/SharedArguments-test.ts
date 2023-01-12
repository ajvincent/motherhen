import fs from "fs/promises";

import PathResolver from "#cli/configuration/PathResolver";
import FSQueue from "#cli/configuration/FileSystemQueue";
import ConfigFileFormat from "../json/ConfigFileFormat";
import FakeInquirer from "#cli/utilities/FakeInquirer";

import type {
  SharedArguments,
} from "./shared-types";

export default class SharedArgumentsTest implements SharedArguments
{
  readonly pathResolver: PathResolver;
  readonly fsQueue: FSQueue;
  get configuration(): ConfigFileFormat
  {
    return this.#configuration;
  }
  readonly inquirer = new FakeInquirer;

  #configuration: ConfigFileFormat;

  constructor(
    pathToTempDirectory: string
  )
  {
    const useAbsoluteProperty = new PathResolver.UseAbsolute(
      pathToTempDirectory, false
    );
    this.pathResolver = new PathResolver(
      useAbsoluteProperty,
      false,
      ""
    );

    this.fsQueue = new FSQueue(this.pathResolver);

    this.#configuration = ConfigFileFormat.fromJSON(
      this.pathResolver,
      ConfigFileFormat.blank()
    );
  }

  #hasAttemptedLoad = false;
  async loadConfiguration(pathToConfiguration: string) : Promise<void>
  {
    if (this.#hasAttemptedLoad)
      throw new Error("has attempted load");
    this.#hasAttemptedLoad = true;

    const pathResolver = this.pathResolver.clone();
    pathResolver.setPath(false, pathToConfiguration);
    const fullPath = pathResolver.getPath(true);

    const contentsAsString = await fs.readFile(fullPath, { encoding: "utf-8" });
    const serialized = JSON.parse(contentsAsString) as unknown;
    if (!ConfigFileFormat.isJSON(serialized))
      throw new Error("configuration file doesn't match the format");

    this.#configuration = ConfigFileFormat.fromJSON(
      this.pathResolver,
      serialized
    );
  }
}
