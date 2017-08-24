js := \
	background/*.js \
	options/*.js
locale_files := $(shell find _locales -type f)
common_files := \
	$(locale_files) \
	manifest.json \
	background/* \
	options/* \
	data/*
firefox_files := \
	$(common_files)
chromium_files := \
	$(common_files)

# My node version is old, this adds Array.includes support.
node := node --harmony_array_includes
# Needed if you want to pass options for node.
web-ext := ~/.npm-global/bin/web-ext
firefox-bin := ~/Downloads/firefox_dev/firefox
ff-profile := dev-edition-default

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint doc

run:
	$(node) $(web-ext) \
		-f $(firefox-bin) \
		-u https://en.wikipedia.org/wiki/Main_Page \
		-u about:debugging \
		-u about:addons \
		-p $(ff-profile) \
		run

firefox: change_to_firefox
	zip -r open_link_to.xpi $(firefox_files)

chromium: change_to_chromium
	zip open_link_to.zip $(chromium_files)

change_to_firefox:
	cp firefox/manifest.json .

change_to_chromium:
	cp chromium/manifest.json .

lint:
	# Check JSON syntax.
	$(foreach file,$(locale_files),json_xs -f json < $(file) 1>/dev/null;)
	eslint --env es6 $(js)
	$(node) $(web-ext) lint

doc:
	jsdoc -c conf.json -d doc $(js)

clean:
	rm manifest.json
