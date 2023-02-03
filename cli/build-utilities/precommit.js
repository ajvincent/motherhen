import { fork } from "child_process";
import projectRoot from "../utilities/projectRoot.js";
const promises = [
    runESLint(),
    runJest(),
];
await Promise.allSettled(promises);
await Promise.all(promises);
function runESLint() {
    return forkProcess([], "node_modules/eslint/bin/eslint.js", ["--max-warnings=0", "typescript-cli"]);
}
function runJest() {
    // node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --no-cache --all
    return forkProcess(["--experimental-vm-modules", "--no-warnings"], "node_modules/jest/bin/jest.js", ["--no-cache", "--all", "--no-watchman"]);
}
function forkProcess(execArgv, pathToExec, args) {
    const p = new Promise((resolve, reject) => {
        const child = fork(pathToExec, args, {
            cwd: projectRoot,
            execArgv,
            stdio: "inherit",
        });
        child.on("exit", code => {
            if (code) {
                reject(`failed ${pathToExec} with code ${code}`);
            }
            else {
                resolve(`passed ${pathToExec}`);
            }
        });
    });
    return p.then(console.log);
}
//# sourceMappingURL=precommit.js.map