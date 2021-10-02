# "New Mozilla Application" Template

If you want to use Mozilla's build system to create a new application, with compiled code and/or tests, you should start here.  This is a template for the absolute minimum code you need for starting a new application source tree in mozilla-central.

As such, you should expect to do a few string replacements.  Run create-application.py to create and configure your new project.

This project is very much a work in progress.  **DO NOT USE YET!!**

## Temporary

```/bin/bash
pushd ~
mkdir newapp-cleandir
cd newapp-cleandir
hg clone https://hg.mozilla.org/mozilla-central/
git clone git@github.com:ajvincent/mozilla-newapp.git gh-newapp
ln -s -r gh-newapp mozilla-central/newapp # creates a link to reference the newapp
echo -e "\nnewapp" >> mozilla-central/.hgignore
export MOZCONFIG=~/newapp-cleandir/gh-newapp/newapp-sym.mozconfig
cd mozilla-central
./mach configure
```
