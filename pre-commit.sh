#!/bin/bash

set -e

# jq is a dependency which will need to be installed
#   https://stedolan.github.io/jq/  osx
#   - copy file to /usr/local/bin
#   - make file executable
#     chmod +x jq

if [ ! -f ./deploy/metadata.json ]; then
    exit
fi

currentVersion=($(jq -r '.version' ./deploy/metadata.json))
lastVersionPart="${currentVersion##*.}"
lastVersionPart=$((lastVersionPart + 1))
newVersion=${currentVersion%.*}.${lastVersionPart}
jq '.version="'${newVersion}'"' ./deploy/metadata.json > tmp.$$.json && mv tmp.$$.json ./deploy/metadata.json