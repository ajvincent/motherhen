import fs from "fs/promises";

export default async function fileExists(
  pathToFile: string,
  isDirectory?: boolean,
  filesystem?: typeof fs,
) : Promise<boolean>
{
  let found = false;
  try {
    const stats = await (filesystem ?? fs).stat(pathToFile);
    if (isDirectory === undefined)
      found = true;
    else if (isDirectory)
      found = stats.isDirectory();
    else
      found = stats.isFile();
  }
  catch {
    // do nothing
  }

  return found;
}
