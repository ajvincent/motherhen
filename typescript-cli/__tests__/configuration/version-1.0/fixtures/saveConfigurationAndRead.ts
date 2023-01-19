import fs from "fs/promises";

import ConfigFileFormat, { ConfigFileFormatSerialized } from "#cli/configuration/version-1.0/json/ConfigFileFormat.js";
import { SharedArguments } from "#cli/configuration/version-1.0/wizard/shared-types.js";

export default async function saveConfigurationAndRead(
  sharedArguments: SharedArguments,
) : Promise<ConfigFileFormat>
{
  const resolver = sharedArguments.pathResolver.clone();
  resolver.setPath(false, ".motherhen-config.json");
  const pathToConfig = resolver.getPath(true);

  await sharedArguments.fsQueue.writeConfiguration(
    sharedArguments.configuration,
    ".motherhen-config.json"
  );

  await sharedArguments.fsQueue.commit();

  const contents = await fs.readFile(pathToConfig, { encoding: "utf-8" });
  return ConfigFileFormat.fromJSON(
    sharedArguments.pathResolver,
    JSON.parse(contents) as ConfigFileFormatSerialized
  );
}
