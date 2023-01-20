import ProjectJSON, {
  type ProjectJSONData
} from "#cli/configuration/version-1.0/json/Project.js";

import {
  forceJSONType
} from "#cli/configuration/version-1.0/json/JSON_Operations.js";

forceJSONType<ProjectJSONData, ProjectJSONData, false>(ProjectJSON);

describe("ProjectJSON", () => {
  let project: ProjectJSON;

  it("works with a constructor", () => {
    project = new ProjectJSON("foo", "debug", "chicken");

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfig).toBe("debug");
    expect(project.appDir).toBe("chicken");

    const data = project.toJSON();
    expect(data).toEqual({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
    });
  });

  it ("static .isJSON() returns correct results", () => {
    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      extra: true
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      mozconfig: "debug",
      appDir: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      appDir: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: true,
      mozconfig: "debug",
      appDir: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: true,
      appDir: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: true,
    })).toBe(false);

    // array, disallowed
    expect(ProjectJSON.isJSON([{
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
    }])).toBe(false);
  });

  it("static .fromJSON() creates a project", () => {
    project = ProjectJSON.fromJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
    });

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfig).toBe("debug");
    expect(project.appDir).toBe("chicken");
  });
});
