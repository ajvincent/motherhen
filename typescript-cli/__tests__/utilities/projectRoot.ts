import path from "path";
import url from "url";
import projectRoot from "../../utilities/projectRoot";

it("projectRoot points to the root of this project", () => {
  const actualPath = path.join(
    projectRoot,
    "typescript-cli/__tests__/utilities/projectRoot.ts"
  );

  expect(url.pathToFileURL(actualPath).href).toBe(import.meta.url);
});
