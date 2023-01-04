import { type Configuration } from "./tools/Configuration.mjs";
import { type CommandSettings } from "../motherhen.mjs";
import { spawnAsync } from "./tools/childProcessAsync.mjs";

export default async function runMach(
  config: Configuration,
  settings: CommandSettings,
  userArgs: string[],
) : Promise<void>
{
  await spawnAsync(
    "python3",
    ["mach", ...userArgs],
    {
      cwd: config.integration.path,
      stdio: "inherit",
      shell: true,
    }
  );
}
