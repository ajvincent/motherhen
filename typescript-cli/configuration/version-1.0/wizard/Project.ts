import type ProjectJSON from "../json/Project.js";
import { assertFail } from "./assert.js";
import { ChooseTasksResults, SharedArguments } from "./shared-types";

export default class ProjectWizard
{
  static getExisting(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
  ) : ProjectJSON
  {
    const config = sharedArguments.configuration;

    const project = config.projects.get(
      chooseTasks.newProjectKey as string
    );
    if (project === undefined)
      assertFail("project must be defined");

    return project;
  }

  private constructor()
  {
    // do nothing yet
  }
}
