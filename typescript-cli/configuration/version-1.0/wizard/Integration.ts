import type IntegrationJSON from "../json/Integration.js";
import ProjectWizard from "./Project.js";

import { assertFail } from "./assert.js";
import { ChooseTasksResults, SharedArguments } from "./shared-types.js";

export default class IntegrationWizard
{
  static getExisting(
    sharedArguments: SharedArguments,
    chooseTasks: ChooseTasksResults,
  ) : IntegrationJSON
  {
    const config = sharedArguments.configuration;
    const project = ProjectWizard.getExisting(sharedArguments, chooseTasks);

    const integration = config.integrations.get(project.integrationKey);
    if (integration === undefined)
      assertFail("integration must be defined");

    return integration;
  }

  private constructor()
  {
    // do nothing yet
  }
}
