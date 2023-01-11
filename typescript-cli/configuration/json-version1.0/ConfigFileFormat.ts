// #region preamble

import {
  VanillaJSONSerialized,
  VanillaJSON,
} from "./Vanilla";

import File, {
  type FileJSONSerialized
} from "./File";

import {
  DictionaryBuilder,
  DictionaryMap,
  DictionaryResolverBuilder,
  type StringIndexed,
} from "./Dictionary";

import IntegrationJSON, {
  type IntegrationJSONSerialized
} from "./Integration";

import ProjectJSON, {
  ProjectJSONData
} from "./Project";
import { isJSONObject } from "./JSON_Operations";
import PathResolver from "../PathResolver";

// #endregion preamble

export type ConfigFileFormatSerialized = {
  readonly formatVersion: "1.0.0";

  readonly vanilla:      StringIndexed<VanillaJSONSerialized>;
  readonly sources:      StringIndexed<FileJSONSerialized>;
  readonly patches:      StringIndexed<string>;
  readonly mozconfigs:   StringIndexed<FileJSONSerialized>;
  readonly integrations: StringIndexed<IntegrationJSONSerialized>;
  readonly projects:     StringIndexed<ProjectJSONData>;
};

export type ConfigFileFormatParsed = {
  readonly formatVersion: "1.0.0";

  readonly vanilla:      DictionaryMap<VanillaJSON,     VanillaJSONSerialized>;
  readonly sources:      DictionaryMap<File,            FileJSONSerialized>;
  readonly patches:      DictionaryMap<File,            FileJSONSerialized>;
  readonly mozconfigs:   DictionaryMap<File,            FileJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;
};

class ConfigFileFormat
implements ConfigFileFormatParsed
{
  readonly formatVersion = "1.0.0";

  readonly vanilla:      DictionaryMap<VanillaJSON,     VanillaJSONSerialized>;
  readonly sources:      DictionaryMap<File,            FileJSONSerialized>;
  readonly patches:      DictionaryMap<File,            FileJSONSerialized>;
  readonly mozconfigs:   DictionaryMap<File,            FileJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;

  constructor(configuration: ConfigFileFormatParsed)
  {
    this.vanilla      = configuration.vanilla;
    this.sources      = configuration.sources;
    this.patches      = configuration.patches;
    this.mozconfigs   = configuration.mozconfigs;
    this.integrations = configuration.integrations;
    this.projects     = configuration.projects;
  }

  toJSON() : ConfigFileFormatSerialized
  {
    return {
      formatVersion: this.formatVersion,
      vanilla: this.vanilla.toJSON(),
      sources: this.sources.toJSON(),
      patches: this.patches.toJSON(),
      mozconfigs: this.mozconfigs.toJSON(),
      integrations: this.integrations.toJSON(),
      projects: this.projects.toJSON(),
    };
  }

  static isJSON(unknownValue: unknown) : unknownValue is ConfigFileFormatSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as ConfigFileFormatSerialized;
    if (value.formatVersion !== "1.0.0")
      return false;

    if (!ClassesDictionary.vanilla.isJSON(value.vanilla))
      return false;

    if (!ClassesDictionary.files.isJSON(value.sources))
      return false;

    if (!ClassesDictionary.files.isJSON(value.patches))
      return false;

    if (!ClassesDictionary.files.isJSON(value.mozconfigs))
      return false;

    if (!ClassesDictionary.integration.isJSON(value.integrations))
      return false;

    if (!ClassesDictionary.projects.isJSON(value.projects))
      return false;

    return true;
  }

  static fromJSON(
    pathResolver: PathResolver,
    value: ConfigFileFormatSerialized
  ) : ConfigFileFormat
  {
    const formatVersion = "1.0.0";
    const vanilla = ClassesDictionary.vanilla.fromJSON(
      pathResolver, value.vanilla
    );
    const sources = ClassesDictionary.files.fromJSON(
      pathResolver, value.sources
    );
    const patches = ClassesDictionary.files.fromJSON(
      pathResolver, value.patches
    );
    const mozconfigs = ClassesDictionary.files.fromJSON(
      pathResolver, value.mozconfigs
    );
    const integrations = ClassesDictionary.integration.fromJSON(
      pathResolver, value.integrations
    );
    const projects = ClassesDictionary.projects.fromJSON(
      value.projects
    );

    return new this({
      formatVersion,
      vanilla,
      sources,
      patches,
      mozconfigs,
      integrations,
      projects,
    });
  }

  /** Provide a blank serialized configuration. */
  static blank() : ConfigFileFormatSerialized
  {
    return {
      formatVersion: "1.0.0",
      vanilla: {},
      sources: {},
      patches: {},
      mozconfigs: {},
      integrations: {},
      projects: {},
    };
  }
}

const ClassesDictionary = {
  vanilla:     DictionaryResolverBuilder(VanillaJSON),
  files:       DictionaryResolverBuilder(File),
  integration: DictionaryResolverBuilder(IntegrationJSON),

  projects:    DictionaryBuilder(ProjectJSON),
};

export default ConfigFileFormat;
