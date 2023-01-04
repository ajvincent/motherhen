import { spawnAsync } from "./tools/childProcessAsync.mjs";
export default async function runMach(config, settings, userArgs) {
    await spawnAsync("python3", ["mach", ...userArgs], {
        cwd: config.integration.path,
        stdio: "inherit",
        shell: true,
    });
}
//# sourceMappingURL=mach.mjs.map