import { execFile, spawn } from "child_process";
import { promisify } from "util";

export const execAsync = promisify(execFile);
export const spawnAsync = promisify(spawn);
