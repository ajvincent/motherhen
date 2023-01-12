/**
 * Get the default export from a command module.
 * @param commandName - the command, also matching `./build/${commandName}.mjs`.
 * @returns the default export.
 */
export default
async function getModuleDefault<T>(importPath: string) : Promise<T>
{
  const module = await import(importPath) as { default: T };
  return module.default;
}
