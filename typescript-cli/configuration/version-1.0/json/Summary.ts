// #region preamble
import ConfigFileFormat from "./ConfigFileFormat.js";
import { FirefoxJSONParsed } from "./Firefox.js";

import type { DictionaryMap } from "./Dictionary.js";
import { JSONBase } from "./JSON_Operations.js";

import ProjectJSON, {
  type ProjectJSONData,
} from "./Project.js";

import FirefoxJSON, {
  type FirefoxJSONSerialized,
} from "./Firefox.js";

import StringSet from "./StringSet.js";

import PatchesJSON, {
  type PatchesJSONSerialized
} from "./Patches.js";

import IntegrationJSON, {
  type IntegrationJSONSerialized
} from "./Integration.js";

import { assertFail } from "../wizard/assert.js";

// #endregion preamble

// #region interfaces
interface BaseSummary
{
  /** Is this summary ready for Motherhen to use? */
  isComplete: boolean;

  /** Are we getting a Firefox summary? */
  isFirefox: boolean;

  /** Where are we putting the integration directory and build artifacts? */
  targetDirectory?: string;

  /** What mozilla-unified tag or bookmark are we using as a base? */
  vanillaTag?: string;
}

export interface FirefoxSummary extends BaseSummary
{
  isFirefox: true;

  /** What sort of build are we doing? */
  buildType?: FirefoxJSONParsed["buildType"];
}

export interface MotherhenSummary extends BaseSummary
{
  isFirefox: false;

  /** Which source directory under `${projectRoot}/sources` are we using as the application source directory?  */
  applicationDirectory?: string;

  /** What other source directories are we adding to the Mozilla integration repository? */
  otherSourceDirectories?: string[];

  /** What patches are we applying to the integration repository? */
  patches?: PatchesJSONSerialized;

  /** Where is our mozconfig file? */
  mozconfig?: string;

  /** What is our application's product name? */
  displayAppName?: string;
}
// #endregion interfaces

// #region implementations

/**
 * Summarize a single project from a configuration.  This is useful both for describing to the user,
 * and for actually creating a project.
 *
 * @param config - the configuration instance.
 * @param projectKey - an element of the configuration's projects or firefoxes dictionaries.
 * @param isFirefox - true if we're using the firefoxes dictionary.
 * @param suspendWarnings - true if we want to avoid console warnings for missing fields.
 * @returns the summary object.
 */
export default function ConfigurationSummary(
  config: ConfigFileFormat,
  projectKey: string,
  isFirefox: boolean,
  suspendWarnings = false
) : FirefoxSummary | MotherhenSummary
{
  if (isFirefox) {
    return getFirefoxSummary(config, projectKey, suspendWarnings);
  }
  return getMotherhenSummary(config, projectKey, suspendWarnings);
}

export function assertCompleteSummary(
  config: FirefoxSummary | MotherhenSummary
) : config is Required<FirefoxSummary | MotherhenSummary>
{
  if (!config.isComplete)
    return false;
  if (!config.targetDirectory)
    assertFail("configuration missing a target directory");
  if (!config.vanillaTag)
    assertFail("configuration missing a vanilla tag");

  if (config.isFirefox) {
    const { buildType } = config as FirefoxJSONSerialized;
    if (!FirefoxJSON.buildTypes.has(buildType))
      assertFail("configuration has an invalid build type");

    return true;
  }

  if (!config.applicationDirectory)
    assertFail("configuration missing an application directory");
  if (!config.displayAppName)
    assertFail("configuration missing a display application name");
  if (!config.otherSourceDirectories)
    assertFail("configuration missing other source directories array");
  if (!config.patches)
    assertFail("configuration missing patches setting");
  if (!config.mozconfig)
    assertFail("configuration missing mozconfig setting");

  return true;
}

/**
 * Summarize a single Firefox configuration.
 *
 * @param config - the configuration instance.
 * @param projectKey - an element of the configuration's projects or firefoxes dictionaries.
 * @param suspendWarnings - true if we want to avoid console warnings for missing fields.
 * @returns the summary object.
 */
function getFirefoxSummary(
  config: ConfigFileFormat,
  projectKey: string,
  suspendWarnings: boolean,
) : FirefoxSummary
{
  let rv: FirefoxSummary = {
    isComplete: false,
    isFirefox: true,
  };
  const firefox = getDictionaryKey<
    FirefoxJSON, FirefoxJSONSerialized
  >
  (
    config.firefoxes, projectKey, "firefoxes", projectKey, false
  );

  if (maybeWarn(suspendWarnings, firefox))
    return rv;

  rv = {
    ...rv,
    isComplete: true,
    targetDirectory: firefox.targetDirectory.getPath(true),
    vanillaTag: firefox.vanillaTag,
    buildType: firefox.buildType,
  }

  return rv;
}

/**
 * Summarize a single Motherhen project.
 *
 * @param config - the configuration instance.
 * @param projectKey - an element of the configuration's projects or firefoxes dictionaries.
 * @param suspendWarnings - true if we want to avoid console warnings for missing fields.
 * @returns the summary object.
 */
function getMotherhenSummary(
  config: ConfigFileFormat,
  projectKey: string,
  suspendWarnings: boolean
) : MotherhenSummary
{
  let rv: MotherhenSummary = {
    isComplete: false,
    isFirefox: false,
  };

  let project: ProjectJSON | string;
  let integration: IntegrationJSON | string = "";
  let applicationDirectory = "";
  const completionSet = new Set([
    "project", "integration", "sources", "patches"
  ]);

  // project
  {
    project = getDictionaryKey<
      ProjectJSON, ProjectJSONData
    >
    (
      config.projects, projectKey, "projects", projectKey, false
    );
    if (!maybeWarn(suspendWarnings, project)) {
      completionSet.delete("project");
      applicationDirectory = project.appDir;
      const { mozconfig } = project;
      rv = {
        ...rv,
        mozconfig,
        applicationDirectory,
        displayAppName: project.displayAppName,
      };
    }
  }

  // integration
  if (typeof project !== "string") {
    integration = getDictionaryKey<
      IntegrationJSON, IntegrationJSONSerialized
    >
    (
      config.integrations, project.integrationKey, "integrations", projectKey, true
    );
    if (!maybeWarn(suspendWarnings, integration)) {
      rv = {
        ...rv,
        targetDirectory: integration.targetDirectory.getPath(true),
        vanillaTag: integration.vanillaTag,
      };
      completionSet.delete("integration");
    }
  }

  // sources
  if (typeof integration !== "string") {
    const sources = new Set<string>(getDictionaryKey<
      StringSet, string[]
    >
    (
      config.sources, integration.sourceKey, "sources", projectKey, true
    ));
    if (!sources.has(applicationDirectory)) {
      maybeWarn(
        suspendWarnings,
        `application directory ${applicationDirectory} not found in sources["${integration.sourceKey}"] for project "${projectKey}"`
      );
    }
    else {
      sources.delete(applicationDirectory);
      rv = {
        ...rv,
        otherSourceDirectories: Array.from(sources.values()),
      };
      completionSet.delete("sources");
    }
  }

  // patches
  if (typeof integration !== "string") {
    const patches = getDictionaryKey<
      PatchesJSON, PatchesJSONSerialized
    >
    (
      config.patches, integration.patchKey, "patches", projectKey, true
    );
    if (maybeWarn(suspendWarnings, patches))
      return rv;

    rv = {
      ...rv,
      patches: patches.toJSON(),
    }
    completionSet.delete("patches");
  }

  rv.isComplete = completionSet.size === 0;
  return rv;
}

/**
 * 
 * @param map - a configuration map.
 * @param key - the key to look up.
 * @param errorKey - a string to add to
 * @param projectKey - the project key we're examining.
 * @param isInProject - true if we have a project object already.
 * @returns the configuration value, or a string if we weren't able to match.
 */
function getDictionaryKey<
  MapParsedType extends JSONBase<MapSerializedType>,
  MapSerializedType
>
(
  map: DictionaryMap<MapParsedType, MapSerializedType>,
  key: string,
  errorKey: string,
  projectKey: string,
  isInProject: boolean,
) : MapParsedType | string
{
  const value = map.get(key);
  if (value) {
    return value;
  }

  if (isInProject) {
    return (
      `missing ${errorKey} key "${key}" from project "${projectKey}"`
    )
  }

  return (
    `no matching ${errorKey} key: "${projectKey}"`
  );
}

/**
 * @param suspendWarnings - true if we want to avoid console warnings for missing fields.
 * @param warningOrValue - the warning to write, or the actual object we want.
 * @returns - true if warningOrValue is a string.  Used to detect missing fields this way.
 */
function maybeWarn(
  suspendWarnings: boolean,
  warningOrValue: string | object,
) : warningOrValue is string
{
  const result = typeof warningOrValue === "string";
  if (result && !suspendWarnings)
    console.warn(warningOrValue);
  return result;
}
// #endregion implementations
