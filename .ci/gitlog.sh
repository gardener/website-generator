#! /bin/bash
set -e

# Description: Retrieve git commits info for files in `content-folder-path` and store it as json files in `output-folder-path` preserving 
# the path relative to `content-source-path`.
# The `content-folder-path` directory is expected to be in a git repo clone.
#
# Usage: gitlog.sh content-folder-path(website-generator/hugo/content) content-source-path(documentation/website) output-folder-path(website-generator/hugo/data)
# All paths are absolute
function gitlog {
for _f in "$1"/*
do
  f=$(readlink -f "$_f")
  source=$(readlink -f "$2")
  data=$(readlink -f "$3")
  if [[ -d $f ]]
  then
    cd $f
    gitlog $f $source $data
    cd ..
  else
    fileext=${f##*.}
    if [[ "$fileext" != "md" && "$fileext" != "html" ]]
    then 
        continue    
    fi
    ESCAPED_KEYWORD=$(printf '%s\n' "$source" | sed -e 's/[]\/$*.^[]/\\&/g');
    ESCAPED_REPLACE=$(printf '%s\n' "$data" | sed -e 's/[\/&]/\\&/g');
    filePath=$(echo $f | sed "s/$ESCAPED_KEYWORD/$ESCAPED_REPLACE/g")
    mkdir -p $(dirname "$filePath")
    echo "saving commits into $filePath.json"
    git log --pretty=format:'{%n  "commit": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%s"%n, },' --follow $f | perl -pe 'BEGIN{print "["}; END{print "]\n"}' | perl -pe 's/},]/}]/' > $filePath.json
  fi
done
}

gitlog $1 $2 $3