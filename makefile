include ./.env

build:
	webpack && web-ext build -s ext

run:
	webpack --watch & web-ext run -s ext --bc --firefox-profile ${WEB_EXT_FIREFOX_PROFILE} & wait

sign:
	web-ext sign -s ext --api-key ${APIKEY} --api-secret ${APISECRET}

lint:
	web-ext lint -s ext