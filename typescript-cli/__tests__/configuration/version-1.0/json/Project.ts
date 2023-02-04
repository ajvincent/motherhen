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
    project = new ProjectJSON("foo", "debug", "chicken", "IncubatorEgg");

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfig).toBe("debug");
    expect(project.appDir).toBe("chicken");
    expect(project.displayAppName).toBe("IncubatorEgg");

    const data = project.toJSON();
    expect(data).toEqual({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    });
  });

  it ("static .isJSON() returns correct results", () => {
    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
      extra: true
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: true,
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: true,
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: true,
      displayAppName: "IncubatorEgg",
    })).toBe(false);

    // array, disallowed
    expect(ProjectJSON.isJSON([{
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    }])).toBe(false);
  });

  it("static .fromJSON() creates a project", () => {
    project = ProjectJSON.fromJSON({
      integrationKey: "foo",
      mozconfig: "debug",
      appDir: "chicken",
      displayAppName: "IncubatorEgg",
    });

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfig).toBe("debug");
    expect(project.appDir).toBe("chicken");
    expect(project.displayAppName).toBe("IncubatorEgg");
  });
});
