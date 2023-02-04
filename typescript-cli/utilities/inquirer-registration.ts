/**
 * @remarks
 * I'm just registering a couple important plugins on the inquirer for shared use.
 */

import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';

import getModuleDefault from "./getModuleDefault.js";

export const InterruptedPrompt = await getModuleDefault<
  {
    fromAll(inquirer: unknown) : void;
    from(prompt: unknown) : inquirer.prompts.PromptConstructor;
    EVENT_INTERRUPTED: unknown;
  }
>
(
  "inquirer-interrupted-prompt"
);

InterruptedPrompt.fromAll(inquirer);
inquirer.registerPrompt(
  'file-tree-selection',
  InterruptedPrompt.from(inquirerFileTreeSelection)
);

export default inquirer;
