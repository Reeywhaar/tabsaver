include ./.env

.PHONY: build
build:
	rm -r ext/dist && make webpackProd && make lint && web-ext build -s ext

.PHONY: run
run:
	web-ext run -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

.PHONY: runNightly
runNightly:
	web-ext run -f nightly -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

.PHONY: sign
sign: build
	web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

.PHONY: lint
lint:
	web-ext lint -s ext

.PHONY: test_data
test_data:
	node make-test-data.js > private/test-data.json