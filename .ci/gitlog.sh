#! /bin/bash
set -e

if [[ $(uname) == 'Darwin' ]]; then
  READLINK_BIN="greadlink"
else
  READLINK_BIN="readlink"
fi

# Description: Retrieve git commits info for files in `content-folder-path` and store it as json files in `output-folder-path` preserving
# the path relative to `content-source-path`.
# The `content-folder-path` directory is expected to be in a git repo clone.
#
# Usage: gitlog.sh content-folder-path(website-generator/hugo/content) file-path(documentation/website/documentation/_index.md)
# All paths are absolute
function gitlog() {
  content=$(${READLINK_BIN} -f "$1")
  file=$(${READLINK_BIN} -f "$2")
  file=${file#$(echo $content)/}
  cd $content
  if [[ -f $file ]]; then
    git log --date=short --pretty=format:'{%n  "sha": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%s",%n  "email": "%aE",%n  "name": "%aN"%n },' --follow $file | perl -pe 'BEGIN{print "["}; END{print "]\n"}' | perl -pe 's/},]/}]/'
  else
    echo "not a file: $file"
    exit 1
  fi
}

gitlog $1 $2
