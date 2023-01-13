# Mozconfigs

## Motherhen reserves the "hatchedegg" name for testing

Don't use the mozconfig files starting with `_test-hatchedegg`, please.  The setup wizard will generate appropriate mozconfig files for you.

Avoid using the `_buildModes` mozconfig files directly as well.  Your generated mozconfig files will import them.

`_sanity-firefox` is a set of mozconfig files for making sure your Motherhen repository can compile "clean" Mozilla Firefox code.  The underlying code is a moving target, especially on the "central", "beta" and "release" tags, so making sure we can build a regular Firefox is a good verification step.
