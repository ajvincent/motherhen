import type {
  PromptFunction,
} from "inquirer";

export interface PartialInquirer {
  readonly prompt: PromptFunction;
}
