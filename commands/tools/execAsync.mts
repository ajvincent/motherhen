import { execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execFile);
export default execAsync;
