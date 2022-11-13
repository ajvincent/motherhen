# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

package:
	@$(MAKE) -C newapp/installer

package-compare:
	@$(MAKE) -C newapp/installer package-compare

stage-package:
	@$(MAKE) -C newapp/installer stage-package

install::
	@$(MAKE) -C newapp/installer install

source-package::
	@$(MAKE) -C newapp/installer source-package

upload::
	@$(MAKE) -C newapp/installer upload

source-upload::
	@$(MAKE) -C newapp/installer source-upload

hg-bundle::
	@$(MAKE) -C newapp/installer hg-bundle

wget-en-US:
	$(MAKE) -C newapp/locales wget-en-US

merge-% post-merge-% installers-% langpack-% chrome-%:
	$(MAKE) -C newapp/locales $@

ifdef ENABLE_TESTS
include $(commtopsrcdir)/mail/testsuite-targets.mk
endif
