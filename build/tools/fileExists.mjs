import fs from "fs/promises";
export default async function fileExists(pathToFile, isDirectory) {
    let found = false;
    try {
        const stats = await fs.stat(pathToFile);
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
//# sourceMappingURL=fileExists.mjs.map