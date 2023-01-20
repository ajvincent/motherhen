# Motherhen Configuration

Motherhen relies on a somewhat convoluted JSON structure for its configuration.  For example:

```json
{
  "formatVersion": "1.0.0",
  "sources": {
    "hatchedEgg": [
      "hatchedegg",
      "crackedegg"
    ]
  },
  "patches": {
    "(all)": {
      "globs": [
        "**/*.patch"
      ],
      "commitMode": "import",
      "commitMessage": null
    }
  },
  "integrations": {
    "hatchedegg-release": {
      "vanillaTag": "release",
      "sourceKey": "hatchedEgg",
      "patchKey": "(all)",
      "targetDirectory": "integrations/hatchedEgg-release"
    }
  },
  "projects": {
    "hatchedegg-release-opt": {
      "integrationKey": "hatchedegg-release",
      "mozconfig": "optimized",
      "appDir": "hatchedegg"
    }
  },
  "firefoxes": {
    "release": {
      "vanillaTag": "release",
      "buildType": "optimized",
      "targetDirectory": "integrations/firefox-verification"
    }
  }
}
```

So how does this work?  A project key defines:

- an integration key, which in turn defines:
  - the "vanilla" base tag or bookmark to use for the repository ("central", "beta", "release", "esr102", etc.)
  - source directories to copy as subdirectories of `mozilla/motherhen/`
  - patches to apply to `mozilla` so the code can compile
  - the target directory where the repository and all build artifacts will go, relative to the Motherhen configuration's location
- a "mozconfig" name, which specifies the Mozilla configuration (minus the application name and directory)
- an application directory among the source directories in `mozilla/motherhen`, which is the project we're trying to build.

There are also "Firefox verification settings", which you may occasionally need (especially if you're working off the "central" bookmark of mozilla-unified, or something even _more_ unstable), because a build bustage might not be your fault.  This is the `firefoxes` section above.

This JSON file typically lives at `.motherhen-config.json` at the root of the Motherhen templace clone you own.  Both `.motherhen-config.json` and `integrations` have git-ignores in place initially, but the configuration wizard will disable these.

You may edit your Motherhen configurations manually if you wish.  I don't recommend this.  If you need to do so, [please file an issue against the Motherhen home project](https://gitcom/ajvincent/motherhen/issues) with your use case, and I can add support for your use case there.

## PathResolver

This is a convenience class for managing file paths which may be absolute or relative.

## FileSystemQueue

Motherhen's setup wizard does _not_ write to your actual file system until you have confirmed your final choices.  The `FileSystemQueue` is a class for scheduling this work for after your confirmation.

## JSON data structures

I use [semantic versioning](https://semver.org) to define the configuration format version.  This is in case I need to make changes to the format later, a "forward-compatibility" defense.

### Format version 1.0.0 for JSON

- [JSON_Operations.ts](version-1.0/json/JSON_Operations.ts) provides some basic types and a couple utility functions.
- [StringSet.ts](version-1.0/json/StringSet.ts) defines JSON support for `Set<string>` as `string[]`.
- [StringMap.ts](version-1.0/json/StringMap.ts) defines JSON support for `Map<string, string>` as `{ [key: string] : string }`.
- [ElementSet.ts](version-1.0/json/ElementSet.ts) is a wrapper for a `Set<T>` where `T` is an object type.  Unused at present.
- [Dictionary.ts](version-1.0/json/Dictionary.ts) is a wrapper for a `Map<string, T>` where `T` is an object type, possibly with passing in `PathResolver` instances to `T`'s `fromJSON()` methods.
- [Patches.ts](version-1.0/json/Patches.ts) defines patch files and how to apply them.
- [Integration.ts](version-1.0/json/Integration.ts) defines the `Integration` data structure.
- [Project.ts](version-1.0/json/Project.ts) defines the `Project` data structure.
- [Firefox.ts](version-1.0/json/Firefox.ts) defines the `Firefox` data structure for verification builds.
- [ConfigFileFormat.ts](version-1.0/json/ConfigFileFormat.ts) is the top-level configuration data structure.  It heavily uses `Dictionary` to define its child elements as dictionaries of options, for easy mix-and-match in `Integration` and `Project` (and for the user's `Project` selection from the command-line).
- [Summary.ts](version-1.0/json/Summary.ts) defines a helper for summarizing the user's selected project from the Motherhen configuration file.

## Wizard (command-line interface) modules

All of these are either controllers for the JSON data model files above, or utility modules to support the controllers.

### Format version 1.0.0 for wizards

- [shared-types.ts](version-1.0/wizard/shared-types.ts) defines internal types the other modules share amongst themselves.
- [SharedArguments.ts](version-1.0/wizard/SharedArguments.ts) implements a shared type for wizards, carrying the base `PathResolver` and `FileSystemQueue`, among other things.
- [pickConfigLocation.ts](version-1.0/wizard/pickConfigLocation.ts) helps the user define where the Motherhen configuration file should live.
- [pickFileToCreate.ts](version-1.0/wizard/pickFileToCreate.ts) is a command-line file picker, where the final file may not exist.
- [maybeLog.ts](version-1.0/wizard/maybeLog.ts) logs to the console, _if_ tests haven't requested a suspension via `SharedArguments`.
- [Confirm.ts](version-1.0/wizard/Confirm.ts) is a simple "Do you really want to do this?" confirmation prompt.
- [CreateEnvironment.ts](version-1.0/wizard/CreateEnvironment.ts) ties `pickConfigLocation` to `SharedArguments`.
- [ChooseTasks.ts](version-1.0/wizard/ChooseTasks.ts) asks the user to decide at a top-level what they want to do.  This guides the selection of what later CLI modules to invoke.
- [Firefox.ts](version-1.0/wizard/Firefox.ts) manages Firefox verification build settings.
- [Driver.ts](version-1.0/wizard/Driver.ts) is the controller, transitioning between CLI modules and feeding them their arguments.
