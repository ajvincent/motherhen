import fs from "fs/promises";
import path from "path";
import { removeMotherhenConfig } from "./updateGitIgnore.mjs";
export default async function writeConfigurationFile(pathToFile, exists, output, key, removeGitIgnore) {
    if (!exists) {
        await fs.mkdir(path.dirname(pathToFile), { recursive: true });
    }
    await fs.writeFile(pathToFile, JSON.stringify(output, null, 2) + "\n", { encoding: "utf-8" });
    if (removeGitIgnore)
        await removeMotherhenConfig();
    console.log(`
Your configuration file at ${pathToFile} has been updated!

You should now be able to create your repository with the command:

./cli/motherhen.mjs create --config ${pathToFile}${key === "default" ? "" : `--project ${key}`}
`.trim() + "\n");
}
//# sourceMappingURL=writeConfiguration.mjs.map