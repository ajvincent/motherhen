import path from "path";
import fs from "fs/promises";
import fileExists from "#cli/utilities/fileExists.js";
import projectRoot from "#cli/utilities/projectRoot.js";
export default async function installMozconfig(targetDirectory, config) {
    const mozconfigsDir = path.join(targetDirectory, "mozconfigs", config.isFirefox ? "firefox" : config.applicationDirectory);
    const leafName = (config.isFirefox ? "optimized" : config.mozconfig) + ".mozconfig";
    const targetFile = path.join(mozconfigsDir, leafName);
    if (await fileExists(targetFile, false))
        return;
    let contents = "";
    {
        const baseConfig = path.join(projectRoot, "mozconfigs", "base", leafName);
        contents += await fs.readFile(baseConfig, { encoding: "utf-8" });
    }
    if (config.isFirefox) {
        const ffConfig = path.join(projectRoot, "mozconfigs/firefox", leafName);
        contents += await fs.readFile(ffConfig, { encoding: "utf-8" });
    }
    else {
        const cleanroomPath = path.join(projectRoot, "cleanroom/mozconfigs/hatchedegg");
        contents += await fs.readFile(path.join(cleanroomPath, "branding.mozconfig"), { encoding: "utf-8" });
        contents += await fs.readFile(path.join(cleanroomPath, leafName), { encoding: "utf-8" });
        contents = contents.replace(/hatchedegg/gm, config.applicationDirectory);
        contents = contents.replace(/MOZ_APP_DISPLAYNAME=".*"/, `MOZ_APP_DISPLAYNAME="${config.displayAppName}"`);
    }
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, contents, { encoding: "utf-8" });
}
//# sourceMappingURL=mozconfigs.js.map