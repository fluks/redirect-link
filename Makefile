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

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint doc

run:
	node --harmony_array_includes ~/.npm-global/bin/web-ext \
		-f /home/jukka/Downloads/firefox_dev/firefox \
		-u https://en.wikipedia.org/wiki/Main_Page \
		-p dev-edition-default \
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
	$(foreach file,$(locale_files),json_xs -f json < $(file) 1>/dev/null;)
	eslint --env es6 $(js)

doc:
	jsdoc -c conf.json -d doc $(js)

clean:
	rm manifest.json
