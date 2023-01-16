// #region preamble
import File from "./File.js";
import { DictionaryBuilder, DictionaryResolverBuilder, } from "./Dictionary.js";
import StringSet from "./StringSet.js";
import PatchesJSON from "./Patches.js";
import IntegrationJSON from "./Integration.js";
import ProjectJSON from "./Project.js";
import FirefoxJSON from "./Firefox.js";
import { isJSONObject } from "./JSON_Operations.js";
class ConfigFileFormat {
    formatVersion = "1.0.0";
    sources;
    patches;
    mozconfigs;
    integrations;
    projects;
    firefoxes;
    constructor(configuration) {
        this.sources = configuration.sources;
        this.patches = configuration.patches;
        this.mozconfigs = configuration.mozconfigs;
        this.integrations = configuration.integrations;
        this.projects = configuration.projects;
        this.firefoxes = configuration.firefoxes;
    }
    toJSON() {
        return {
            formatVersion: this.formatVersion,
            sources: this.sources.toJSON(),
            patches: this.patches.toJSON(),
            mozconfigs: this.mozconfigs.toJSON(),
            integrations: this.integrations.toJSON(),
            projects: this.projects.toJSON(),
            firefoxes: this.firefoxes.toJSON(),
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
        if (!ClassesDictionary.patches.isJSON(value.patches))
            return false;
        if (!ClassesDictionary.files.isJSON(value.mozconfigs))
            return false;
        if (!ClassesDictionary.integrations.isJSON(value.integrations))
            return false;
        if (!ClassesDictionary.projects.isJSON(value.projects))
            return false;
        if (!ClassesDictionary.firefoxes.isJSON(value.firefoxes))
            return false;
        return true;
    }
    static fromJSON(pathResolver, value) {
        const formatVersion = "1.0.0";
        const sources = ClassesDictionary.stringSet.fromJSON(value.sources);
        const patches = ClassesDictionary.patches.fromJSON(value.patches);
        const mozconfigs = ClassesDictionary.files.fromJSON(pathResolver, value.mozconfigs);
        const integrations = ClassesDictionary.integrations.fromJSON(pathResolver, value.integrations);
        const projects = ClassesDictionary.projects.fromJSON(value.projects);
        const firefoxes = ClassesDictionary.firefoxes.fromJSON(pathResolver, value.firefoxes);
        return new this({
            formatVersion,
            sources,
            patches,
            mozconfigs,
            integrations,
            projects,
            firefoxes,
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
            firefoxes: {},
        };
    }
}
const ClassesDictionary = {
    stringSet: DictionaryBuilder(StringSet),
    files: DictionaryResolverBuilder(File),
    patches: DictionaryBuilder(PatchesJSON),
    integrations: DictionaryResolverBuilder(IntegrationJSON),
    projects: DictionaryBuilder(ProjectJSON),
    firefoxes: DictionaryResolverBuilder(FirefoxJSON),
};
export default ConfigFileFormat;
//# sourceMappingURL=ConfigFileFormat.js.map