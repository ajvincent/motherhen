# Mozconfigs

## Integration layout

In the integration directory, the directory structure will be:

- builds
  - hatchedegg-opt (object build)
  - hatchedegg-debug (object build)
- mozilla-unified
  - motherhen/(project name)
- mozconfigs/(project name)
  - optimized.mozconfig
  - debug.mozconfig
  - buildSymbols.mozconfig

Motherhen will set the MOZCONFIG environment variable in its interactions with `mach`, pointing to the appropriate project configuration.
