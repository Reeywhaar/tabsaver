include ./.env

.PHONY: build
build:
	rm -r ext/dist && make webpackProd && make lint && ./node_modules/.bin/web-ext build -s ext

.PHONY: run
run:
	./node_modules/.bin/web-ext run -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

.PHONY: runNightly
runNightly:
	./node_modules/.bin/web-ext run -f nightly -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

.PHONY: sign
sign: build
	./node_modules/.bin/web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

.PHONY: lint
lint:
	./node_modules/.bin/web-ext lint -s ext

.PHONY: test_data
test_data:
	node make-test-data.js > private/test-data.json