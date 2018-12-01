#!/bin/sh

# FOR USE IN DOCKER SHELL
# script for syncing copied version (via COPY) with mounted version of files

cat package.json > package.json.host
cat package-lock.json > package-lock.json.host