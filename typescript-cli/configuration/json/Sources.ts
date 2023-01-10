import PathResolver from "../PathResolver";
void(PathResolver);

type SourcesJSONOutput = {
  [key: string] : PathResolver
};

export default class SourcesJSON {
  readonly #baseResolver: PathResolver;
  readonly #resolverMap = new Map<string, PathResolver>;

  constructor(
    baseResolver: PathResolver,
    initialDirs: ReadonlySet<string>
  )
  {
    this.#baseResolver = baseResolver.clone();
    this.#baseResolver.setPath(false, "sources");

    initialDirs.forEach(initialDir => this.add(initialDir));
  }

  add(dirName: string) : void {
    const resolver = this.#baseResolver.clone();
    resolver.setPath(false, dirName);
    this.#resolverMap.set(dirName, resolver);
  }

  toJSON() : SourcesJSONOutput {
    return Object.fromEntries(this.#resolverMap.entries());
  }
}
