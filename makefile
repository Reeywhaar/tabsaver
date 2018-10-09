include ./.env

webpack:
	./node_modules/.bin/webpack --mode development

webpackProd:
	./node_modules/.bin/webpack --mode production

build:
	./node_modules/.bin/webpack --mode production && make lint && web-ext build -s ext

watch:
	./node_modules/.bin/webpack --mode development --watch

run:
	make watch & web-ext run -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE} & wait

runProd:
	./node_modules/.bin/webpack --mode production && web-ext run -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE}

runNightly:
	make watch & web-ext run -f nightly -s ext --firefox-profile ${WEB_EXT_FIREFOX_PROFILE} & wait

sign: build
	web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

lint:
	web-ext lint -s ext

clear:
	rm -rf ./ext/js && rm -rf ./ext/icons/icon.svg

test_data:
	node make-test-data.js > private/test-data.json