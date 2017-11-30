include ./.env

build:
	webpack && make lint && web-ext build -s ext

watch:
	webpack --watch

run:
	make watch & web-ext run -s ext --bc --firefox-profile ${WEB_EXT_FIREFOX_PROFILE} & wait

runNightly:
	make watch & web-ext run -f nightly -s ext --bc --firefox-profile ${WEB_EXT_FIREFOX_PROFILE} & wait

sign: build
	web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

lint:
	web-ext lint -s ext

clear:
	rm -rf ./ext/js && rm -rf ./ext/icons/icon.svg