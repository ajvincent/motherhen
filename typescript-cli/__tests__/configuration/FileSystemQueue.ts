import fs from "fs/promises";
import path from "path";

import FSQueue from "#cli/configuration/FileSystemQueue";
import PathResolver from "#cli/configuration/PathResolver";
import TempDirWithCleanup, {
  type TempDirWithCleanupType
} from "#cli/utilities/TempDirWithCleanup";

import ConfigFileFormat from "#cli/configuration/version-1.0/json/ConfigFileFormat";

describe("File system queue", () => {
  let queue: FSQueue;
  let pathResolver: PathResolver;
  let tempDir: string, cleanupTempDir : TempDirWithCleanupType["cleanupTempDir"];
  let config: ConfigFileFormat;

  beforeEach(async () => {
    ({ tempDir, cleanupTempDir } = await TempDirWithCleanup());

    const useAbsoluteProperty = new PathResolver.UseAbsolute(tempDir, false);
    pathResolver = new PathResolver(useAbsoluteProperty, false, "");

    queue = new FSQueue(pathResolver);

    config = ConfigFileFormat.fromJSON(
      pathResolver,
      ConfigFileFormat.blank()
    );
  });
  afterEach(async () => await cleanupTempDir());

  xit("can write a minimal configuration file", async () => {
    await (queue.writeConfiguration(
      config, ".motherhen-config.json"
    ));

    expect(queue.pendingOperations()).toEqual([
      `write configuration to ${path.resolve(pathResolver.getPath(true), ".motherhen-config.json")}`,
    ]);

    // checking for mutations after we've requested a write
    const expectedContents = JSON.stringify(config, null, 2) + "\n";

    // confirming we haven't actually written to the file system yet
    await expect(fs.readdir(tempDir)).resolves.toEqual([]);

    expect(queue.hasCommitted()).toBe(false);

    // As I add requirements evolve, this may throw exceptions for missed settings.
    await queue.commit();
    expect(queue.hasCommitted()).toBe(true);

    const contents = await fs.readFile(
      path.join(tempDir, ".motherhen-config.json"),
      { encoding: "utf-8" }
    );

    expect(contents).toBe(expectedContents);
  });

  it("will defend against obvious errors", async () => {
    await expect(
      queue.suspendWarnings<void>(() => queue.commit())
    ).rejects.toThrow("You have required tasks to execute!");

    await queue.writeConfiguration(config, ".motherhen-config.json");

    // this exception happens synchronously
    expect(
      () => queue.writeConfiguration(config, ".motherhen-config.json")
    ).toThrow("You've already requested to write the configuration!");

    await queue.commit();

    await expect(
      queue.commit()
    ).rejects.toThrow("I have already started running tasks!");
  });
});
