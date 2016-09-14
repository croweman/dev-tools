#!/bin/bash

set -e

for f in *; do
    if [[ -d $f ]]; then
        if [ -d ${f}/.git ]; then
            ( cd ${f}/ && git init )
        fi
    fi
done