#!/usr/bin/env bash

cmd.exe /C "mklink" /D "${1//\//\\}" "${2//\//\\}"

# Alias: mklink=" . mklink.sh"
# USAGE: mklink <mylink> <target>