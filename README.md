# Motherhen: a "new Mozilla Application" template project

If you want to use [Mozilla](https://www.mozilla.org)'s [source code](https://searchfox.org) to create a new application, with compiled code and/or tests, you should start here.  This is a template for the absolute minimum code you need for starting a new application source tree from the mozilla-unified repository.

## Concepts

- Motherhen is a potential replacement for Mozilla Firefox's least-known feature, the `-app` command-line argument.  This little feature allows you to replace the user interface ("chrome" before Google Chrome existed) with your own.  Motherhen goes quite a bit further, giving you most of what you need to start a new application from scratch, using Mozilla's build infrastructure, toolkit and API's.
- Motherhen uses _two_ local copies of Mozilla code.  
    1. A "vanilla", or "clean room", repository of the [mozilla-unified](https://hg.mozilla.org/mozilla-unified/) repository.  This one you should not touch:  the idea is it doesn't have any of your (or Motherhen's) changes in it, so we can always rely on it as canonical Mozilla code.  I create this using your operating system's `hg` command and Mozilla's [Mercurial bundles](https://firefox-source-docs.mozilla.org/contributing/vcs/mercurial_bundles.html).  By default, it lives in `.cleanroom/mozilla-unified`, where `.cleanroom` is a git-ignored directory.
    2. An "integration" repository, which is a clone of the "vanilla" repository.  This is where your build happens:
        - The "source" directory of this project Motherhen adds as a symbolic link in the "integration" repository, so your code edits happen here.
        - Motherhen applies patches (as few as necessary) to the "integration" repository so that your project can at least compile and run.
        - From here on, _you_ own the "integration" repository and your copy of the Motherhen template!

## Caveat emptor, or "Not everything works!"

I've tested this _manually_ in early January, 2023 against mozilla-central, and here's what I see:

| | Linux | MacOS | Windows |
|-|-------|-------|---------|
| Creating a repository | Working | Working | __Not tested__ |
| `mach configure` | Working | Working | __Not tested__ |
| `mach build` | Working | Working | __Not tested__ |
| `mach run` | Working | Working | __Not tested__ |
| `mach package` | Working | _Broken_ | __Not tested__ |

### Why not Windows?

I don't have a Windows development computer anymore.  (January 2023)  Help most definitely appreciated in this space!

## Set-up, build and run

1. In GitHub, create a new repository by using this repository as a template.
2. Clone your repository locally.
3. `npm run install -P`.
4. Create a .mozconfig file.  See [test/newapp-sym.mozconfig] for an example.  For now, leave the project name and app basename as "hatchedegg".
5. `npm run setup` will launch a command-line wizard to guide you through crafting a Motherhen configuration file.  This wizard will eventually ask you for a new project name, and apply it if you give it one.
6. The wizard will give you a command at the end to run, like `./cli/motherhen.mjs create --config=./test/.motherhen-config.json`.  Run this command to set up your integration repository, where Mozilla code and your code will be joined together.
7. `./cli/motherhen.mjs mach configure --config=./test/.motherhen-config.json` to configure your integration repository.
8. `./cli/motherhen.mjs mach build --config=./test/.motherhen-config.json` to compile your project.
9. `./cli/motherhen.mjs mach run --config=./test/.motherhen-config.json` to launch your code.
10. `./cli/motherhen.mjs mach package --config=./test/.motherhen-config.json` (Linux only for now) to create a package for others to use.

## Other useful commands and options

- `./cli/motherhen.mjs mach` is your gateway to the `mach` program.
- `./cli/motherhen.mjs where` tells you where your integration and "vanilla" repositories are.
- `--project=(project name)` lets you choose a project other than your default.
  - Think testing your project against mozilla-beta, instead of mozilla-release.  This means you can check your project against multiple versions of Mozilla's source code, including "ESR" builds.
- `./cli/motherhen.mjs help` or `npm run help` will get you basic help information.

## Motherhen's own testing and development

Don't do this, unless you're working on fixing bugs in Motherhen itself.  [package.json](package.json) has lots of testing steps.

```bash
npm install --save-dev
npm run test:create
npm run test:where
npm run test:configure
npm run test:build
npm run test:run
npm run test:package
```

## Extremely useful documentation

Though if you're here, you've probably already bookmarked these years ago!

- [firefox-source-docs](https://firefox-source-docs.mozilla.org/)
- [Developer.mozilla.org](https://developer.mozilla.org/en-US/)
- [Treeherder](https://treeherder.mozilla.org/) for the latest Mozilla build statuses

## Credits (or, "really good open-source utilities")

Many thanks to the creators and contributors of these great npm projects:

- From Microsoft:
  - [TypeScript](https://typescriptlang.org): all the command-line work
  - [tsdoc](https://tsdoc.app)
  - [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [DefinitelyTyped type definition maintainers](https://github.com/DefinitelyTyped/DefinitelyTyped): You know who you are.  I wish I did.
- [eslint](https://eslint.org) for making me a better programmer
- [typescript-eslint](https://typescript-eslint.io/), particularly their [linting with type information](https://typescript-eslint.io/linting/typed-linting/) which helped me find and fix a baffling ternary-await bug
- [wget-improved](https://github.com/bearjaws/node-wget) for fetching Mercurial bundles from Mozilla
- [which](https://github.com/npm/node-which) for helping me find the `hg` executable
- [ini](https://github.com/npm/ini) for monkey-patching the integration repository's `.hg/hgrc` file to point back to the vanilla repository
- [commander](https://github.com/tj/commander.js) for a very intuitive and up-to-date command-line interface generator
- [inquirer](https://github.com/SBoudrias/Inquirer.js) for easy-to-configure, up-to-date wizard generation (I use it in `npm run setup`)
  - [inquirer-interrupted-prompt](https://github.com/lnquy065/inquirer-interrupted-prompt) for bailing out of the wizard with the Escape key
  - [inquirer-file-tree-selection-prompt](https://github.com/anc95/inquirer-file-tree-selection) for an intuitive file-picker from the command line
- [replace-in-file](https://github.com/adamreisnz/replace-in-file) for quickly replacing the "hatchedegg" identifier

Special thanks to [nodejs.org](https://nodejs.org) for a fantastic JavaScript command-line application.

Of course, the largest thanks go out to [Mozilla](https://mozilla.org).  Twenty years, and a career I've built so far on your code.  I still have the red-star t-shirt from the Mozilla 1.0 release party in 2002, even if it doesn't fit anymore.

[s/love/code/](https://www.youtube.com/watch?v=nUCoYcxNMBE)
