# Patches apply in ascending order of file name

Motherhen patches start with "0" and three more digits.  This is primarily to ensure patches apply in a given order.  The ordering is to make sure you don't get a patch earlier in the list which depends on a later patch.

We believe these patches fix Mozilla build bustages for _any_ Motherhen-based project, at least for now.  We recommend starting your patches with four digits, where the leading digit is not "0".

Motherhen follows this algorithm when it comes to patch files:

1. Search for patch files matching a set of [globs](https://www.npmjs.com/package/fast-glob).
2. Sort the results using JavaScript's built-in sort() method.
3. Apply patches in the order they end up in.

Therefore, I recommend against putting patch files in subdirectories of this directory.  Just denote the ordering of patches via a four-digit code at the beginning of the file name, and keep all patches in this directory.

## Specific patches

In terms of the ramifications of each patch, here is what they do:

- 0001 & 0003: Disable services/settings, which provides Remote Settings. Ideally, we would figure out a way to satisfy the remote settings module (e.g. A static, blank, remote settings instance that all Motherhen points to by default + instructions on how to set up your own remote settings instance).
- 0002: We would need to push a patch up to mozilla-central that correctly detects the existence of a gecko app in has_build (the current check is is_firefox or is_android or is_thunderbird which is determined by the MOZ_BUILD_APP variable).
