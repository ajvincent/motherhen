// #region preamble
import fs from "fs/promises";
import fileExists from "../tools/fileExists.js";
import { isConfiguration, } from "../tools/Configuration.js";
import buildBlank from "./blankConfig.js";
import inquirer from "./inquirer-registration.mjs";
/**
 * Get an editable configuration, and report whether we should overwrite it.
 * @param pathToFile - absolute path to where the configuration file could live.
 * @returns exists - true if the file already exists.
 * @returns output - the parsed JSON configuration.
 */
export default async function getEditableJSON(pathToFile) {
    let exists = await fileExists(pathToFile, false);
    let output = null;
    if (exists) {
        // Parse the existing contents, and verify they form a valid configuration file.
        const contentsAsString = await fs.readFile(pathToFile, { encoding: "utf-8" });
        let pass = false;
        {
            const contentsAsJSON = JSON.parse(contentsAsString);
            if (isValidConfigurationFile(contentsAsJSON)) {
                pass = true;
                output = contentsAsJSON;
            }
        }
        if (!pass) {
            // Ah, crap.  The file is no good, but we don't want to just overwrite it without the user's consent.
            const { overwrite } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "overwrite",
                    message: `This file is not a valid Motherhen configuration file.  Do you want to overwrite it?`,
                    default: false,
                }
            ]);
            if (!overwrite) {
                throw new Error("Invalid configuration file, aborting");
            }
            exists = false;
        }
    }
    if (!output) {
        output = { default: buildBlank() };
    }
    return { exists, output };
}
function isValidConfigurationFile(unknownContents) {
    if (Array.isArray(unknownContents))
        return false;
    if (Object(unknownContents) !== unknownContents)
        return false;
    const contents = unknownContents;
    if (!("default" in contents))
        return false;
    return Object.values(contents).every(isConfiguration);
}
//# sourceMappingURL=getEditableJSON.js.map