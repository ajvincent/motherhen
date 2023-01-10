import PathResolver from "../PathResolver";
void (PathResolver);
export default class SourcesJSON {
    #baseResolver;
    #resolverMap = new Map;
    constructor(baseResolver, initialDirs) {
        this.#baseResolver = baseResolver.clone();
        this.#baseResolver.setPath(false, "sources");
        initialDirs.forEach(initialDir => this.add(initialDir));
    }
    add(dirName) {
        const resolver = this.#baseResolver.clone();
        resolver.setPath(false, dirName);
        this.#resolverMap.set(dirName, resolver);
    }
    toJSON() {
        return Object.fromEntries(this.#resolverMap.entries());
    }
}
//# sourceMappingURL=Sources.js.map