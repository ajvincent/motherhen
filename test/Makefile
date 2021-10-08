#!/usr/bin/env make

# Why use a Makefile as the basis for testing?  Three reasons.
# 1. Mozilla's build system, based on mach, still drives a Makefile-based system.
# 2. Makefiles are good for specifying dependencies between tasks.
# 3. Most of what we have to do involves launching commands.
#
# The downside is we have to launch those commands in specific directories.
# Makefiles aren't particularly fun to do that in.
# If push comes to shove, I can move the commands into bash scripts with:
#
# #!/bin/bash -x
# # Exit if any command fails
# # Note: pipefail is necessary for running build commands through
# # a pipe (i.e. it changes the output of ``false | tee /dev/null ; echo $?``)
# set -e
# set -o pipefail
#

all:: package tests

.PHONY:: all package tests

###############################################################################
#                                 BUILD PHASE                                 #
###############################################################################

cloneMozilla::
	@echo "Cloning Mozilla repository if necessary..."

clean::
	@echo "Cleaning build artifacts..."

# This has to include some mechanism to indicate success.
# Suggestion: Have the hatchedEgg's XUL window create a file in the profile directory at a specific location.
# Then the final part of the test can check for the existence of that file.
addHatchedEgg:: clean cloneMozilla
	@echo "Creating hatchedEgg subdirectory and hg ignores..."

build:: addHatchedEgg
	@echo "Building the Hatched Egg application..."

package:: build
	@echo "Packaging the Hatched Egg application..."

.PHONY:: cloneMozilla addHatchedEgg build package

###############################################################################
#                                  TEST PHASE                                 #
###############################################################################

tests:: test-launch
	@echo "All tests completed!!!"
	@echo
	@echo

test-launch:: build
	@echo "Test: Launch Hatched Egg to require a file's creation in the profile..."

.PHONY:: tests test-launch
