import path from "path";
import url from "url";
import projectRoot from "../../../commands/tools/projectRoot";

it("projectRoot points to the root of this project", () => {
  const actualPath = path.join(
    projectRoot,
    "typescript-cli/__tests__/commands/tools/projectRoot.ts"
  );

  expect(url.pathToFileURL(actualPath).href).toBe(import.meta.url);
});
