#!/bin/bash

if npx tsc --pretty true > .compile.log 2>&1; then
    echo -e "\x1b[32mCompilation successful.\x1b[0m"
else
    echo -e "\x1b[31mCompilation failed. Check \x1b[36m.compile.log\x1b[31m for details.\x1b[0m"
    tail .compile.log
fi