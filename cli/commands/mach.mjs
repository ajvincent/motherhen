import which from "which";
import { spawnAsync } from "./tools/childProcessAsync.js";
const python3 = await which("python3");
export default async function runMach(config, settings, userArgs) {
    void (settings);
    await spawnAsync(python3, ["mach", ...userArgs], {
        cwd: config.integration.path,
        stdio: "inherit",
        shell: true,
    });
}
//# sourceMappingURL=mach.mjs.map