import type {
  SharedArguments
} from "./shared-types.js";

export default function maybeLog(
  sharedArguments: SharedArguments,
  ...args: Parameters<typeof console["log"]>
) : void
{
  if (!sharedArguments.suppressConsole)
    console.log(...args);
}
