// #region preamble

import {
  DictionaryBuilder,
  DictionaryMap,
  DictionaryResolverBuilder,
  type StringIndexed,
} from "./Dictionary.js";

import PathResolver from "../../PathResolver.js";
import StringSet from "./StringSet.js";

import PatchesJSON, {
  type PatchesJSONSerialized
} from "./Patches.js";

import IntegrationJSON, {
  type IntegrationJSONSerialized
} from "./Integration.js";

import ProjectJSON, {
  type ProjectJSONData,
} from "./Project.js";

import FirefoxJSON, {
  type FirefoxJSONSerialized,
} from "./Firefox.js";

import { isJSONObject } from "./JSON_Operations.js";

// #endregion preamble

export type ConfigFileFormatSerialized = {
  readonly formatVersion: "1.0.0";

  // Source directory sets as StringSet under ${projectRoot}/sources
  readonly sources:      StringIndexed<string[]>;

  // Patch file globs and commit instructions under ${projectRoot}/patches
  readonly patches:      StringIndexed<PatchesJSONSerialized>;

  /*
  {
    vanillaTag: "central", "beta", /^esr\d+/, "release", etc.
      /^FIREFOX_\d+(_\d+)*_RELEASE$/ if you really insist.
    sourceKey: keyof this.sources;
    patchKey: keyof this.patches;
    targetDirectory: PathResolver;
  }
  */
  readonly integrations: StringIndexed<IntegrationJSONSerialized>;

  /*
  {
    integrationKey: keyof this.integrations;
    mozconfig: a string, which the create command transforms to `${projectRoot}/mozconfigs/base/${mozconfig}-mozconfig`
    appDirKey: keyof this.sources;
  }
  */
  readonly projects:     StringIndexed<ProjectJSONData>;

  /*
  These are for building Mozilla Firefox from a clean copy of the "vanilla" repository,
  with none of our custom patches or sources applies.  It's a verification step, to ensure
  your system can compile a known base-line.

  {
    vanillaTag: "central", "beta", /^esr\d+/, "release", etc.
      /^FIREFOX_\d+(_\d+)*_RELEASE$/ if you really insist.
    buildType: "optimized" | "debug" | "symbols";
    targetDirectory: PathResolver;
  }
  */
  readonly firefoxes:    StringIndexed<FirefoxJSONSerialized>;
};

export type ConfigFileFormatParsed = {
  readonly formatVersion: "1.0.0";

  readonly sources:      DictionaryMap<StringSet,       string[]>;
  readonly patches:      DictionaryMap<PatchesJSON,     PatchesJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;
  readonly firefoxes:    DictionaryMap<FirefoxJSON,     FirefoxJSONSerialized>;
};

class ConfigFileFormat
implements ConfigFileFormatParsed
{
  readonly formatVersion = "1.0.0";

  readonly sources:      DictionaryMap<StringSet,       string[]>;
  readonly patches:      DictionaryMap<PatchesJSON,     PatchesJSONSerialized>;
  readonly integrations: DictionaryMap<IntegrationJSON, IntegrationJSONSerialized>;
  readonly projects:     DictionaryMap<ProjectJSON,     ProjectJSONData>;
  readonly firefoxes:    DictionaryMap<FirefoxJSON,     FirefoxJSONSerialized>;

  private constructor(configuration: ConfigFileFormatParsed)
  {
    this.sources      = configuration.sources;
    this.patches      = configuration.patches;
    this.integrations = configuration.integrations;
    this.projects     = configuration.projects;
    this.firefoxes    = configuration.firefoxes;
  }

  toJSON() : ConfigFileFormatSerialized
  {
    return {
      formatVersion: this.formatVersion,
      sources: this.sources.toJSON(),
      patches: this.patches.toJSON(),
      integrations: this.integrations.toJSON(),
      projects: this.projects.toJSON(),
      firefoxes: this.firefoxes.toJSON(),
    };
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is ConfigFileFormatSerialized
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as ConfigFileFormatSerialized;
    if (value.formatVersion !== "1.0.0")
      return false;

    if (!ClassesDictionary.stringSet.isJSON(value.sources))
      return false;

    if (!ClassesDictionary.patches.isJSON(value.patches))
      return false;

    if (!ClassesDictionary.integrations.isJSON(value.integrations))
      return false;

    if (!ClassesDictionary.projects.isJSON(value.projects))
      return false;

    if (!ClassesDictionary.firefoxes.isJSON(value.firefoxes))
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
    const patches = ClassesDictionary.patches.fromJSON(
      value.patches
    );
    const integrations = ClassesDictionary.integrations.fromJSON(
      pathResolver, value.integrations
    );
    const projects = ClassesDictionary.projects.fromJSON(
      value.projects
    );
    const firefoxes = ClassesDictionary.firefoxes.fromJSON(
      pathResolver, value.firefoxes
    );

    return new this({
      formatVersion,
      sources,
      patches,
      integrations,
      projects,
      firefoxes,
    });
  }

  /** Provide a blank serialized configuration. */
  static blank() : ConfigFileFormatSerialized
  {
    return {
      formatVersion: "1.0.0",
      sources: {},
      patches: {},
      integrations: {},
      projects: {},
      firefoxes: {},
    };
  }
}

const ClassesDictionary = {
  stringSet:    DictionaryBuilder(StringSet),

  patches:      DictionaryBuilder(PatchesJSON),
  integrations: DictionaryResolverBuilder(IntegrationJSON),
  projects:     DictionaryBuilder(ProjectJSON),
  firefoxes:    DictionaryResolverBuilder(FirefoxJSON),
};

export default ConfigFileFormat;
