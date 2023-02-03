import { fork } from "child_process";
import projectRoot from "../utilities/projectRoot.js";

const promises = [
  runESLint(),
  runJest(),
  /*
  checkTimestamps(),
  */
];

await Promise.allSettled(promises);
await Promise.all(promises);

function runESLint() : Promise<void>
{
  return forkProcess(
    [],
    "node_modules/eslint/bin/eslint.js",
    [ "--max-warnings=0",  "typescript-cli"],
  );
}

function runJest() : Promise<void>
{
  // node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --no-cache --all
  return forkProcess(
    ["--experimental-vm-modules", "--no-warnings"],
    "node_modules/jest/bin/jest.js",
    ["--no-cache", "--all", "--no-watchman"],
  )
}

/*
function checkTimestamps() : Promise<void>
{
  return forkProcess(
    [],
    "cli/build-utilities/checkTimestamps.js",
    [],
  );
}
*/

function forkProcess(
  execArgv: string[],
  pathToExec: string,
  args: string[],
) : Promise<void>
{
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
