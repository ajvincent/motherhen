import fs from "fs/promises";
import path from "path";

import type { CommandSettings } from "./CommandSettings-type.js";
import projectRoot from "../../utilities/projectRoot.js";

/**
 * Use this type to define .motherhen-config.json in the root directory.
 */
export type MotherhenConfig = {
  "default": Configuration;
  [key: string]: Configuration;
}

/**
 * The eventual shape of our configuration as a build target.
 */
export type Configuration = Readonly<{
  /** Metadata for the clean repository. */
  "vanilla": Readonly<{
    /**
     * Where the unpatched mozilla-unified repository should live on the local filesystem.
     * If the configuration omits this, this defaults to `${projectRoot}/.cleanroom/mozilla-unified` .
     */
    "path": string;

    /** The tag to apply to the mozilla-unified repository. */
    "tag": string;
  }>;

  /** Metadata for the integration repository, where we combine the Motherhen project with Mozilla code. */
  "integration": Readonly<{
    /** Where the integration repository should live on the local filesystem. */
    "path": string;

    /** The MOZCONFIG file. */
    "mozconfig": string;
  }>;
}>;

type ConfigurationWithoutVanillaPath = Readonly<{
  "integration": Configuration["integration"],

  "vanilla":
    Omit<Configuration["vanilla"], "path"> &
    Partial<Pick<Configuration["vanilla"], "path">>
}>;

/**
 * Get the configuration.
 * @param settings - the command-line settings from motherhen.mts.
 *
 * @returns a configuration with absolute paths.
 */
async function getConfiguration(
  settings: CommandSettings
) : Promise<Configuration>
{
  const { project, relativePathToConfig } = settings;
  const pathToConfig = path.resolve( projectRoot, relativePathToConfig );

  let configJSON : { [key: string] : unknown };
  try {
    configJSON = JSON.parse(await fs.readFile(
      pathToConfig,
      { encoding: "utf-8" }
    )) as { [key: string] : unknown };
  }
  catch (ex) {
    console.error(`I couldn't find a JSON file at ${pathToConfig}!  (Did you forget the --config option?)`);
    throw ex;
  }

  const partialConfig = configJSON[project];
  if (!isConfiguration(partialConfig))
    throw new Error(`no configuration found for project "${project}"`);

  const config: Configuration = {
    vanilla: {
      ...partialConfig.vanilla,
      path: partialConfig.vanilla.path ?? path.resolve(
        projectRoot, ".cleanroom/mozilla-unified"
      )
    },
    integration: {
      ...partialConfig.integration
    }
  };

  normalize<"path">(
    config.vanilla as Required<Configuration["vanilla"]>,
    "path",
    pathToConfig
  );
  normalize<"path">(config.integration, "path", pathToConfig);
  normalize<"mozconfig">(config.integration, "mozconfig", pathToConfig);

  return config;
}

/** Validate a configuration value. */
export function isConfiguration(
  unknownValue: unknown
) : unknownValue is ConfigurationWithoutVanillaPath
{
  if (typeof unknownValue !== "object")
    return false;

  const value = unknownValue as Configuration;
  if (typeof value.vanilla !== "object")
    return false;
  const vanillaPathType = typeof value.vanilla.path;
  if ((vanillaPathType !== "string") && (vanillaPathType !== "undefined"))
    return false;
  if (value.vanilla.path === "")
    return false;
  if (typeof value.vanilla.tag !== "string")
    return false;
  if (value.vanilla.tag === "")
    return false;

  if (typeof value.integration !== "object")
    return false;
  if (typeof value.integration.path !== "string")
    return false;
  if (value.integration.path === "")
    return false;
  if (typeof value.integration.mozconfig !== "string")
    return false;
  if (value.integration.mozconfig === "")
    return false;

  return true;
}

/**
 * Convert a relative path in a configuration to an absolute path.
 *
 * @typeParam Key - the key we're checking for.
 * @param base - the object to modify.
 * @param key - the property name of the object.
 * @param pathToConfig - an absolute path to the configuration.
 * @internal
 */
function normalize<Key extends string>(
  base: { [key in Key]: string },
  key: Key,
  pathToConfig: string
): void
{
  base[key] = path.normalize(path.resolve(
    pathToConfig, "..", base[key]
  ));
}

export default getConfiguration;
