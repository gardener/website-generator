#!/bin/bash

# export LATESTVERSION=master
# export OLDESTVERSION=8
# FORK="swilen-iwanow"
r=$OLDESTVERSION

# Clear from previous runs
rm -rf hugo/content
rm -rf temp

echo "Running pre-site-building tasks"
mkdir hugo/content
npm install
npm prune --production

if [ "$BUILDSINGLEBRANCH" = "true" ]; then
  echo "Building site with version master"
  CLONE="temp/master"
  git clone --quiet -b "$BRANCH" "https://github.com/${FORK}/documentation.git" "$CLONE"
  export CONTENT="$CLONE/website/"
  export DATA="hugo/data/"
  node ./node/index.js
  mv $CLONE/website/* hugo/content
else
  while [[ $r -le $LATESTVERSION ]]; do
    CLONE="temp/v1.${r}.0"
    echo 'Getting docs from: v1.'"${r}"'.0'
    git clone --quiet -b "v1.${r}.0" "https://github.com/${FORK}/documentation.git" "$CLONE"
    cloneFolder="${CLONE}/website/documentation"
    toFolder="hugo/content/v1.${r}.0"
    export CONTENT="$CLONE/website/documentation"
    export DATA="hugo/data/v1.${r}.0"
    if [ "$r" = "$LATESTVERSION" ]; then
      export CONTENT="$CLONE/website/"
      export DATA="hugo/data/"
      cloneFolder="${CLONE}/website/*"
      toFolder="hugo/content/"
    fi
    node ./node/index.js
    mv $cloneFolder $toFolder
    ((r = r + 1))
  done
fi

node ./node/generateVersioningFile.js
find . -type f -path './hugo/content/*/_index.md' -exec sed -i "s/menus\:\ sln/menu\:\ sln/g" {} +

echo 'Cleaning up temp directory used during this site build.'
rm -rf temp
