export function assert(
  condition: boolean,
  message: string
) : condition is true
{
  if (!condition) {
    return assertFail(message);
  }
  return true;
}

export function assertFail(message: string) : never
{
  throw new Error("assertion failure, " + message);
}
