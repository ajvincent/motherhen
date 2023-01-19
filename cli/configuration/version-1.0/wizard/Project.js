import { assertFail } from "./assert.js";
export default class ProjectWizard {
    static getExisting(sharedArguments, chooseTasks) {
        const config = sharedArguments.configuration;
        const project = config.projects.get(chooseTasks.newProjectKey);
        if (project === undefined)
            assertFail("project must be defined");
        return project;
    }
    constructor() {
        // do nothing yet
    }
}
//# sourceMappingURL=Project.js.map