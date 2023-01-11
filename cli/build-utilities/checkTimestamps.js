import path from "path";
import fs from "fs/promises";
import projectRoot from "../utilities/projectRoot.js";
import { PromiseAllParallel } from "./PromiseTypes.js";
import readDirsDeep from "./readDirsDeep.js";
{
    const tsPath = path.join(projectRoot, "typescript-cli");
    let { files: tsFiles } = await readDirsDeep(tsPath);
    tsFiles = tsFiles.filter(tsFile => tsFile.endsWith(".ts"));
    const comparisons = tsFiles.map(tsFile => {
        return [tsFile.replace("typescript-cli", "cli").replace(/ts$/, "js"), tsFile];
    });
    const results = await PromiseAllParallel(comparisons, compareTimestamps);
    if (!results.every(Boolean))
        throw new Error("cli is out of date, run `npm run tsc`");
}
async function compareTimestamps([jsFile, tsFile]) {
    try {
        const [jsStat, tsStat] = await PromiseAllParallel([jsFile, tsFile], fs.stat);
        const rv = jsStat.mtimeMs > tsStat.mtimeMs;
        if (!rv)
            console.log("time difference on " + tsFile);
        return rv;
    }
    catch {
        console.error("exception thrown on " + tsFile);
        return false;
    }
}
//# sourceMappingURL=checkTimestamps.js.map