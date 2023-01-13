"use strict";
/**
 * @see {@link https://www.npmjs.com/package/parse-git-patch}
 * The convention for patches seems to be comment lines, then a summary line,
 * then additional text, then a `---` line.  All I really care about for the wizard
 * is getting the summary line.
 *
 * Mercurial patches seem to start with the line `# HG changeset patch`.
 * The first non-comment line is the summary line we need.
 */
//# sourceMappingURL=Patches.js.map