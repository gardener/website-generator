#!/bin/bash
set -e

n=2
r=$((LATESTVERSION - n))

# Clear from previous runs
rm -rf hugo/content
rm -rf temp

mkdir hugo/content
npm install
npm prune --production

CLONE="temp"
echo "Cloning from ${FORK}"
git clone "https://github.com/${FORK}/documentation.git" "$CLONE"
if [ "$BUILDSINGLEBRANCH" = "true" ]; then
  echo "Building site from documentation version ${BRANCH}"
  (cd $CLONE && git checkout "origin/$BRANCH" -b ${BRANCH})
  dir="${CLONE}/website/*"
  echo "docforge -f "${CLONE}/doc.yaml" -d hugo/content/ --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true"
  docforge -f "${CLONE}/doc.yaml" -d hugo/content/ --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true
  # with single branch we can directly move the contents of the repo inside
  # hugo/content because we don't use the repo later.
  mv $dir hugo/content
  export CONTENT="$CLONE/website/"
  export DATA="hugo/data/"
  echo "Calling nojeds script with \$DATA=$DATA and CONTENT=$CONTENT"
  node ./node/index.js
else
  echo "Building site from the last ${n} documentation versions"
  while [[ $r -le $LATESTVERSION ]]; do
    echo 'Getting docs from: v1.'"${r}"'.0'
    version="v1.${r}.0"
    (cd $CLONE && git checkout "tags/${version}" -b ${version})
    export CONTENT="$CLONE/website/documentation"
    export DATA="hugo/data/v1.${r}.0"
    if [ "$r" = "$LATESTVERSION" ]; then
      dir="${CLONE}/website/*"
      cp -r $dir hugo/content
      version="documentation"
      export CONTENT="$CLONE/website/"
      export DATA="hugo/data/"
    fi
    echo "docforge -f "${CLONE}/doc.yaml" -d "hugo/content/${version}" --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true"
    docforge -f "${CLONE}/doc.yaml" -d "hugo/content/${version}" --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true
    echo "Calling nojeds script with \$DATA=$DATA and CONTENT=$CONTENT"
    node ./node/index.js
    ((r = r + 1))
  done
fi

node ./node/generateVersioningFile.js

echo 'Cleaning up temp directory used during this site build.'
rm -rf temp
