js := \
	background/*.js \
	options/*.js \
	common/*.js
locale_files := $(shell find _locales -type f)
common_files := \
	$(locale_files) \
	manifest.json \
	background/* \
	options/* \
	common/* \
	data/original_image.txt
firefox_files := \
	$(common_files) \
	data/*.svg
chromium_files := \
	$(common_files) \
	data/*.png

# My node version is old, this adds Array.includes support.
node :=
# Needed if you want to pass options for node.
web-ext := web-ext
firefox-bin := ~/Downloads/firefox_dev/firefox
ff-profile := dev-edition-default

version_suffix := $(shell grep -o '[0-9]\.[0-9]\.[0-9]' manifest.json | head -1 | sed 's/\./_/g')

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint doc

run:
	$(node) $(web-ext) \
		-f $(firefox-bin) \
		--pref intl.locale.requested=fi \
		-u https://en.wikipedia.org/wiki/Main_Page \
		-u about:debugging \
		-u about:addons \
		-p $(ff-profile) \
		run

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
	$(foreach file,$(locale_files),json_xs -f json < $(file) 1>/dev/null;)
	$(node) $(web-ext) lint
	eslint $(js)

doc:
	jsdoc -c conf.json -d doc $(js)

clean:
	rm manifest.json
