# Patches apply in ascending order of file name

Motherhen patches start with "0" and three more digits.  We believe these patches fix Mozilla build bustages for _any_ Motherhen-based project, at least for now.  We recommend starting your patches with four digits, where the leading digit is not "0".  (Alex would very much like to understand the ramifications of these patches better, and how we can build without them.  So, help wanted here!)

This doesn't mean you must make them "1000-...", "1001-...".

Motherhen follows this algorithm when it comes to patch files:

1. Search for patch files matching a set of [globs](https://www.npmjs.com/package/fast-glob).
2. Sort the results using JavaScript's built-in sort() method.
3. Apply patches in the order they end up in.

Therefore, I recommend against putting patch files in subdirectories of this directory.  Just denote the ordering of patches via a four-digit code at the beginning of the file name, and keep all patches in this directory.
