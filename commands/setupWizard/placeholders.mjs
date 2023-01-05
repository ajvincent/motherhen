import fs from "fs/promises";
import path from "path";
export async function fillVanilla(vanilla, uncreatedDirs) {
    void (vanilla);
    void (uncreatedDirs);
    return Promise.reject("not yet implemented");
}
export async function fillIntegration(integration, uncreatedDirs) {
    void (integration);
    void (uncreatedDirs);
    return Promise.reject("not yet implemented");
}
export async function maybeUpdateGitIgnore(pathToFile) {
    void (pathToFile);
    await Promise.reject("not yet implemented");
    return false;
}
export async function confirmChoice(output, keyName) {
    void (output);
    void (keyName);
    return Promise.reject("not yet implemented");
}
export async function writeConfigurationFile(pathToFile, exists, output, removeGitIgnore) {
    void (removeGitIgnore);
    await Promise.reject("removeGitIgnore not yet implemented");
    if (!exists) {
        await fs.mkdir(path.dirname(pathToFile), { recursive: true });
    }
    await fs.writeFile(pathToFile, JSON.stringify(output, null, 2), { encoding: "utf-8" });
    console.log(`Your configuration file at ${pathToFile} has been updated!`);
}
//# sourceMappingURL=placeholders.mjs.map