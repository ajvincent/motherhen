import fs from "fs/promises";
import path from "path";
import url from "url";

const basePath = path.normalize(path.join(
  url.fileURLToPath(import.meta.url), "../../.."
));

export type Configuration = {
  "vanilla": {
    "path": string,
    "tag": string,
    "vcs": "git" | "hg",
  },
  "integration": {
    "path": string,
    "mozconfig": string,
    "projectDir": string,
  }
};

export default
async function getConfiguration() : Promise<Configuration>
{
  const target = process.argv[2] ?? "default";
  const pathToConfig = path.join(basePath, process.env["MOTHERHEN_CONFIG"] ?? ".motherhen-config.json");
  const configJSON = JSON.parse(await fs.readFile(
    pathToConfig,
    { encoding: "utf-8" }
  ))

  const config: unknown = configJSON[target];
  if (!isConfiguration(config))
    throw new Error("no configuration found");

  normalize(config.vanilla, "path", pathToConfig);
  normalize(config.integration, "path", pathToConfig);
  normalize(config.integration, "mozconfig", pathToConfig);

  return config;
}

function isConfiguration(
  unknownValue: unknown
) : unknownValue is Configuration
{
  if (typeof unknownValue !== "object")
    return false;

  const value = unknownValue as Configuration;
  if (typeof value.vanilla !== "object")
    return false;
  if (typeof value.vanilla.path !== "string")
    return false;
  if (typeof value.vanilla.tag !== "string")
    return false;
  if ((value.vanilla.vcs !== "git") && (value.vanilla.vcs !== "hg"))
    return false;

  if (typeof value.integration !== "object")
    return false;
  if (typeof value.integration.path !== "string")
    return false;
  if (typeof value.integration.mozconfig !== "string")
    return false;
  if (typeof value.integration.projectDir !== "string")
    return false;

  return true;
}

function normalize(base: object, key: string, pathToConfig: string) : void
{
  let value = Reflect.get(base, key) as string;
  value = path.normalize(path.resolve(
    pathToConfig, "..", value
  ));
  Reflect.set(base, key, value);
}
