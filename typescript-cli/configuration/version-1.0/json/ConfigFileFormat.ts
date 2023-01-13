// #region preamble

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
import PathResolver from "../../PathResolver";
import StringSet from "./StringSet";

// #endregion preamble

export type ConfigFileFormatSerialized = {
  readonly formatVersion: "1.0.0";

  // Source directory sets as StringSet under ${projectRoot}/sources
  readonly sources:      StringIndexed<string[]>;

  // Patch file globs and commit instructions under ${projectRoot}/patches
  readonly patches:      StringIndexed<string>;

  /* mozconfigs are automatically available in ${projectRoot}/mozconfigs.
     Only one mozconfig applies at a time, so we don't need a path resolver,
     or a glob, or anything like that.
  */
  readonly mozconfigs:   StringIndexed<FileJSONSerialized>;

  /*
  {
    vanillaTag: "central", "beta", /^esr\d+/, "release", etc.
      /^FIREFOX_\d+(_\d+)*_RELEASE$/ if you really insist.
    sourceKeys: Set<keyof this.sources>;
    patchKey: keyof this.patches;
    targetDirectory: PathResolver;
  }
  */
  readonly integrations: StringIndexed<IntegrationJSONSerialized>;

  /*
  {
    integrationKey: keyof this.integrations;
    mozconfig: filename under ${projectRoot}/mozconfigs;
    appDirKey: keyof this.sources;
  }
  */
  readonly projects:     StringIndexed<ProjectJSONData>;

  /*
  These are for building Mozilla Firefox from a clean copy of the "vanilla" repository,
  with none of our custom patches or sources applies.  It's a verification step, to ensure
  your system can compile a known base-line.

  {
    vanillaTag,
    mozconfig,
    targetDirectory,
  }
  */
  //readonly firefoxProjects: undefined;
};

export type ConfigFileFormatParsed = {
  readonly formatVersion: "1.0.0";

  readonly sources:      DictionaryMap<StringSet,       string[]>;
  readonly patches:      DictionaryMap<File,            FileJSONSerialized>;
  readonly mozconfigs:   DictionaryMap<File,            FileJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;
};

class ConfigFileFormat
implements ConfigFileFormatParsed
{
  readonly formatVersion = "1.0.0";

  readonly sources:      DictionaryMap<StringSet,       string[]>;
  readonly patches:      DictionaryMap<File,            FileJSONSerialized>;
  readonly mozconfigs:   DictionaryMap<File,            FileJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;

  private constructor(configuration: ConfigFileFormatParsed)
  {
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

    if (!ClassesDictionary.stringSet.isJSON(value.sources))
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
    const sources = ClassesDictionary.stringSet.fromJSON(
      value.sources
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
      sources: {},
      patches: {},
      mozconfigs: {},
      integrations: {},
      projects: {},
    };
  }
}

const ClassesDictionary = {
  files:       DictionaryResolverBuilder(File),
  integration: DictionaryResolverBuilder(IntegrationJSON),
  projects:    DictionaryBuilder(ProjectJSON),
  stringSet:   DictionaryBuilder(StringSet),
};

export default ConfigFileFormat;
