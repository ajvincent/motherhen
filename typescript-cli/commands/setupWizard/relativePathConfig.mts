import path from "path";

import type {
  WritableConfigurationType
} from "./shared-types.mjs";

/**
 * Convert absolute file paths to relative file paths.
 * @param pathToConfig - The path to the configuration file.
 * @param absConfig -
 * @returns the equivalent configuration with relative file paths.
 */
export default function relativePathConfig(
  pathToConfig: string,
  absConfig: WritableConfigurationType
) : WritableConfigurationType
{
  const pathToProject = path.dirname(pathToConfig);

  const vanilla: WritableConfigurationType["vanilla"] = {
     tag: absConfig.vanilla.tag
  };
  if (absConfig.vanilla.path)
    vanilla.path = path.relative(pathToProject, absConfig.vanilla.path);

  const integration: WritableConfigurationType["integration"] = {
    path: path.relative(pathToProject, absConfig.integration.path),
    mozconfig: path.relative(pathToProject, absConfig.integration.mozconfig),
    projectDir: absConfig.integration.projectDir
  };

  return { vanilla, integration };
}
