js := \
	background/*.js \
	options/*.js \
	common/*.js \
	browser_action/*.js
locale_files := $(shell find _locales -type f)
common_files := \
	$(locale_files) \
	manifest.json \
	background/* \
	options/* \
	browser_action/* \
	common/* \
	data/original_image.txt \
	LICENSE
firefox_files := \
	$(common_files) \
	data/*.svg
chromium_files := \
	$(common_files) \
	data/*.png

# Change this to point to a Firefox binary or remove the line from run target
# to use the default Firefox in your path.
firefox-bin := ~/Downloads/firefox_dev/firefox
# Change this to your profile or remove the line from run target to use a
# temporary profile.
ff-profile := dev-edition-default

version_suffix := $(shell grep -o '[0-9]\.[0-9]\.[0-9]' manifest.json | head -1 | sed 's/\./_/g')

.PHONY: run_firefox run_chromium firefox chromium clean change_to_firefox change_to_chromium lint \
	doc show_doc supported_versions compare_install_and_source install_dependencies test

run_firefox:
	web-ext run \
		--firefox-binary $(firefox-bin) \
		--firefox-profile $(ff-profile) \
		--pref intl.locale.requested=en \
		-u https://en.wikipedia.org/wiki/Main_Page \
		-u about:debugging \
		-u about:addons

run_chromium:
	chromium-browser --temp-profile --load-extension=$(shell pwd)

firefox: change_to_firefox
	zip -r redirect_link-$(version_suffix).xpi $(firefox_files)

chromium: change_to_chromium
	zip redirect_link-$(version_suffix).zip $(chromium_files)

change_to_firefox:
	cp firefox/manifest.json .

change_to_chromium:
	cp chromium/manifest.json .

# web-ext lint finds errors if manifest.json isn't the Firefox version.
lint: change_to_firefox
	# Check JSON syntax.
	$(foreach file,$(locale_files),python3 -m json.tool < $(file) 1>/dev/null || exit;)
	web-ext lint --ignore-files doc/*
	eslint $(js)

install_dependencies:
	npm install --only=dev

supported_versions:
	# Set verbosity on command line: verbosity='-v{1,2}'
	min_ext_ver.pl -b firefox,chrome,andr $(verbosity) $(js)

# usage: make compare_install_and_source install=PATH1 source=PATH2
# where PATH1 is path to the installed addon in
# ~/.mozilla/firefox/PROFILE/extensions/redirectlink@fluks.xpi and PATH2 is
# path to the generated xpi you can create with make firefox.
tmp_install := /tmp/_install
tmp_source := /tmp/_source
compare_install_and_source:
	@mkdir $(tmp_install)
	@unzip -qqd $(tmp_install) $(install)
	@rm -rf $(tmp_install)/META-INF
	@mkdir $(tmp_source)
	@unzip -qqd $(tmp_source) $(source)
	diff -r $(tmp_install) $(tmp_source)
	@rm -rf $(tmp_install) $(tmp_source)

doc:
	jsdoc -c conf.json -d doc $(js)

show_doc:
	$(shell firefox file://$(shell readlink -f doc/index.html))

clean:
	rm manifest.json

test:
	$(firefox-bin) -P $(ff-profile) test/main.html
