/**
 * @remarks
 * I'm just registering a couple important plugins on the inquirer for shared use.
 */
import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import getModuleDefault from "../tools/getModuleDefault.mjs";
export const InterruptedPrompt = await getModuleDefault("inquirer-interrupted-prompt");
InterruptedPrompt.fromAll(inquirer);
inquirer.registerPrompt('file-tree-selection', InterruptedPrompt.from(inquirerFileTreeSelection));
export default inquirer;
//# sourceMappingURL=inquirer-registration.mjs.map