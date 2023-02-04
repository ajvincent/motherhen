import which from "which";
import { execAsync } from "#cli/commands/tools/childProcessAsync.js";
import projectRoot from "#cli/utilities/projectRoot.js";

const git = await which("git");

const child = await execAsync(
  git,
  ["status", "-s"],
  { cwd: projectRoot }
);

if (child.stderr) {
  console.log(child.stderr);
}

if (child.stdout.trim()) {
  console.log("repository is not clean:");
  console.log(child.stdout);
  process.exit(1);
}
