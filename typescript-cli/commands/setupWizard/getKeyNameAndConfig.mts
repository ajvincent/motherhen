import buildBlank from "./blankConfig.mjs";
import inquirer from "./inquirer-registration.mjs";
import type {
  WritableConfigurationJSON,
  WritableConfigurationType,
} from "./shared-types.mjs";

type KeyNameAndConfig = {
  key: string,
  config: WritableConfigurationType
};

/**
 * Select a project target for updating.
 * @param output - the project configuration.
 * @returns key - the user's selected key name
 * @returns config - a configuration matching the user's selection.  May be blank.
 */
export default
async function getKeyNameAndConfig(
  output: WritableConfigurationJSON
) : Promise<KeyNameAndConfig>
{
  const keys = Object.keys(output);
  let key: string;

  // The user may choose from a known set of keys, or they may choose to create a new one.
  {
    const displayKeys = keys.map(key => JSON.stringify(key));
    const keysMap = new Map(keys.map((key, index) => [displayKeys[index], key]));

    const newOption = "(None of these, start a new configuration)";
    displayKeys.push(newOption);

    console.log(`Your current configuration file has this:${JSON.stringify(output, null, 2)}\n\n`);

    const { displayKey } = await inquirer.prompt<{
      displayKey: string
    }>
    ([
      {
        type: "list",
        name: "displayKey",
        message: "Which configuration would you like to edit?",
        choices: displayKeys,
      }
    ]);

    if (displayKey !== newOption)
    {
      key = keysMap.get(displayKey) as string;
      return {key, config: output[key]};
    }
  }

  // Here, we're creating a new configuration, and giving it a key the user provides.
  ({ key } = await inquirer.prompt<{
    key: string
  }>
  ([
    {
      type: "input",
      name: "key",
      message: "Enter the name of the new configuration to create.",
      validate(input: string) : string | true {
        return keys.includes(input) ? "You must choose a new name." : true
      },
    }
  ]));

  return {key, config: buildBlank()};
}
