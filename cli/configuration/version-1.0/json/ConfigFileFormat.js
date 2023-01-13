// #region preamble
import File from "./File";
import { DictionaryBuilder, DictionaryResolverBuilder, } from "./Dictionary";
import IntegrationJSON from "./Integration";
import ProjectJSON from "./Project";
import { isJSONObject } from "./JSON_Operations";
import StringSet from "./StringSet";
class ConfigFileFormat {
    formatVersion = "1.0.0";
    sources;
    patches;
    mozconfigs;
    integrations;
    projects;
    constructor(configuration) {
        this.sources = configuration.sources;
        this.patches = configuration.patches;
        this.mozconfigs = configuration.mozconfigs;
        this.integrations = configuration.integrations;
        this.projects = configuration.projects;
    }
    toJSON() {
        return {
            formatVersion: this.formatVersion,
            sources: this.sources.toJSON(),
            patches: this.patches.toJSON(),
            mozconfigs: this.mozconfigs.toJSON(),
            integrations: this.integrations.toJSON(),
            projects: this.projects.toJSON(),
        };
    }
    static isJSON(unknownValue) {
        if (!isJSONObject(unknownValue))
            return false;
        const value = unknownValue;
        if (value.formatVersion !== "1.0.0")
            return false;
        if (!ClassesDictionary.stringSet.isJSON(value.sources))
            return false;
        if (!ClassesDictionary.files.isJSON(value.patches))
            return false;
        if (!ClassesDictionary.files.isJSON(value.mozconfigs))
            return false;
        if (!ClassesDictionary.integration.isJSON(value.integrations))
            return false;
        if (!ClassesDictionary.projects.isJSON(value.projects))
            return false;
        return true;
    }
    static fromJSON(pathResolver, value) {
        const formatVersion = "1.0.0";
        const sources = ClassesDictionary.stringSet.fromJSON(value.sources);
        const patches = ClassesDictionary.files.fromJSON(pathResolver, value.patches);
        const mozconfigs = ClassesDictionary.files.fromJSON(pathResolver, value.mozconfigs);
        const integrations = ClassesDictionary.integration.fromJSON(pathResolver, value.integrations);
        const projects = ClassesDictionary.projects.fromJSON(value.projects);
        return new this({
            formatVersion,
            sources,
            patches,
            mozconfigs,
            integrations,
            projects,
        });
    }
    /** Provide a blank serialized configuration. */
    static blank() {
        return {
            formatVersion: "1.0.0",
            sources: {},
            patches: {},
            mozconfigs: {},
            integrations: {},
            projects: {},
        };
    }
}
const ClassesDictionary = {
    files: DictionaryResolverBuilder(File),
    integration: DictionaryResolverBuilder(IntegrationJSON),
    projects: DictionaryBuilder(ProjectJSON),
    stringSet: DictionaryBuilder(StringSet),
};
export default ConfigFileFormat;
//# sourceMappingURL=ConfigFileFormat.js.map