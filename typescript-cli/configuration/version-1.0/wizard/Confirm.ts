import { SharedArguments } from "./shared-types";

export default async function InquirerConfirm(
  sharedArguments: SharedArguments,
  message = "Are you okay with your choices so far?",
) : Promise<boolean>
{
  const {
    ok
  } = await sharedArguments.inquirer.prompt<{
    ok: boolean
  }>
  ([
    {
      name: "ok",
      type: "confirm",
      default: false,
      message,
    }
  ]);

  return ok;
}
