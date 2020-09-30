#!/bin/bash
set -e

FORK="swilen-iwanow"
r=$OLDESTVERSION

# Clear from previous runs
rm -rf hugo/content
rm -rf temp

echo "Running pre-site-building tasks"
mkdir hugo/content
npm install
npm prune --production
root=$(pwd)

CLONE="temp/"
git clone "https://github.com/${FORK}/documentation.git" "$CLONE"
if [ "$BUILDSINGLEBRANCH" = "true" ]; then
  echo "Building site with version ${BRANCH}"
  (cd $CLONE && git checkout "tags/${BRANCH}" -b ${BRANCH})
  dir="${CLONE}website/*"
  docforge -f "${CLONE}/doc.yaml" -d hugo/content/ --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true
  # with single branch we can directly move the contents of the repo inside
  # hugo/content because we don't use the repo later.
  mv $dir hugo/content
  export CONTENT="$CLONE/website/"
  export DATA="hugo/data/"
  node ./node/index.js
else
  while [[ $r -le $LATESTVERSION ]]; do
    echo 'Getting docs from: v1.'"${r}"'.0'
    version="v1.${r}.0"
    (cd $CLONE && git checkout "tags/${version}" -b ${version})
    export CONTENT="$CLONE/website/documentation"
    export DATA="hugo/data/v1.${r}.0"
    if [ "$r" = "$LATESTVERSION" ]; then
      dir="${CLONE}website/*"
      cp -r $dir hugo/content
      version="documentation"
      export CONTENT="$CLONE/website/"
      export DATA="hugo/data/"
    fi
    docforge -f "${CLONE}/doc.yaml" -d "hugo/content/${version}" --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true
    node ./node/index.js
    ((r = r + 1))
  done
fi

node ./node/generateVersioningFile.js
find . -type f -path './hugo/content/*/_index.md' -exec sed -i "s/menus\:\ sln/menu\:\ sln/g" {} +

echo 'Cleaning up temp directory used during this site build.'
rm -rf temp
