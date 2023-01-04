#!/usr/bin/env node
/**
 *
 * @param pathToConfig - the path to the configuration file.
 * @param target - the name of the projectwithin the configuration file.
 */
export default async function whereIsMyProject(config) {
    console.log(`
Your Mozilla integration repository should be at:
${config.integration.path}

The upstream "cleanroom" repository should be at:
${config.vanilla.path}
`.trim());
    return Promise.resolve();
}
//# sourceMappingURL=where.mjs.map