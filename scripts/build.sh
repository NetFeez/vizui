#!/bin/bash

set -eo pipefail
outputFile=output.log

if npx tsc > $outputFile 2>&1; then
    echo -e "\x1b[32mCompilation successful.\x1b[0m"
else
    echo -e "\x1b[31mCompilation failed. Check \x1b[36m$outputFile\x1b[31m for details.\x1b[0m"
    tail $outputFile
fi

rm -f $outputFile