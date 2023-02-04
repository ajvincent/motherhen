import path from "path";
import which from "which";
import projectRoot from "#cli/utilities/projectRoot.js";
import { spawnAsync } from "./tools/childProcessAsync.js";
const python3 = await which("python3");
export default async function runMach(config, settings, userArgs) {
    const targetDirectory = path.normalize(path.resolve(projectRoot, settings.relativePathToConfig, "..", config.targetDirectory));
    const integrationRepo = path.join(targetDirectory, "mozilla-unified");
    let mozconfigPath;
    if (config.isFirefox) {
        mozconfigPath = path.join(targetDirectory, "mozconfigs/firefox", config.buildType + ".mozconfig");
    }
    else {
        mozconfigPath = path.join(targetDirectory, "mozconfigs", config.applicationDirectory, config.mozconfig + ".mozconfig");
    }
    await spawnAsync(python3, ["mach", ...userArgs], {
        cwd: integrationRepo,
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            "MOZCONFIG": mozconfigPath
        },
    });
}
//# sourceMappingURL=mach.js.map