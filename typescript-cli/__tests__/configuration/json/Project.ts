import ProjectJSON, {
  type ProjectJSONData
} from "../../../configuration/json/Project";

import {
  forceJSONType
} from "../../../configuration/json/JSON_Operations";

forceJSONType<ProjectJSONData, ProjectJSONData, false>(ProjectJSON);

describe("ProjectJSON", () => {
  let project: ProjectJSON;

  it("works with a constructor", () => {
    project = new ProjectJSON("foo", "debug", "chicken");

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfigKey).toBe("debug");
    expect(project.appDirKey).toBe("chicken");

    const data = project.toJSON();
    expect(data).toEqual({
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: "chicken",
    });
  });

  it ("static .isJSON() returns correct results", () => {
    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: "chicken",
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: "chicken",
      extra: true
    })).toBe(true);

    expect(ProjectJSON.isJSON({
      mozconfigKey: "debug",
      appDirKey: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      appDirKey: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfigKey: "debug",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: true,
      mozconfigKey: "debug",
      appDirKey: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfigKey: true,
      appDirKey: "chicken",
    })).toBe(false);

    expect(ProjectJSON.isJSON({
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: true,
    })).toBe(false);

    // array, disallowed
    expect(ProjectJSON.isJSON([{
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: "chicken",
    }])).toBe(false);
  });

  it("static .fromJSON() creates a project", () => {
    project = ProjectJSON.fromJSON({
      integrationKey: "foo",
      mozconfigKey: "debug",
      appDirKey: "chicken",
    });

    expect(project.integrationKey).toBe("foo");
    expect(project.mozconfigKey).toBe("debug");
    expect(project.appDirKey).toBe("chicken");
  });
});
