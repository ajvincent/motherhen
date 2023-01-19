import ProjectWizard from "./Project.js";
import { assertFail } from "./assert.js";
export default class IntegrationWizard {
    static getExisting(sharedArguments, chooseTasks) {
        const config = sharedArguments.configuration;
        const project = ProjectWizard.getExisting(sharedArguments, chooseTasks);
        const integration = config.integrations.get(project.integrationKey);
        if (integration === undefined)
            assertFail("integration must be defined");
        return integration;
    }
    constructor() {
        // do nothing yet
    }
}
//# sourceMappingURL=Integration.js.map