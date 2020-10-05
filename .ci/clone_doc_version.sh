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
dir="${CLONE}/website/*"
cp -r $dir hugo/content

# In case of head update we just have to copy blogs and adopters from the master
if [[ -z $BUILD || $BUILD == "head-update" ]]; then
  exit 0
fi

if [[ "$BUILDSINGLEBRANCH" = "true" ]]; then
  # Switch to the desired branch.
  if [[ $BRANCH != "master" ]]; then
    echo "Building site from documentation version ${BRANCH}"
    (cd $CLONE && git checkout "origin/$BRANCH" -b ${BRANCH})
  fi

  dir="${CLONE}/website/*"
  echo "docforge -f "${CLONE}/doc.yaml" -d hugo/content/ --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true"
  docforge -f "${CLONE}/doc.yaml" -d hugo/content/ --hugo --github-oauth-token $GIT_OAUTH_TOKEN --markdownfmt=true
  export CONTENT="$CLONE/website/"
  export DATA="hugo/data/"
  echo "Calling nojeds script with \$DATA=$DATA and CONTENT=$CONTENT"
  node ./node/index.js
else
  echo "Building site from the last ${n} documentation versions"
  while [[ $r -le $LATESTVERSION ]]; do
    echo 'Getting docs from: v1.'"${r}"'.0'
    # Switch to desired release version
    version="v1.${r}.0"
    (cd $CLONE && git checkout "tags/${version}" -b ${version})

    export CONTENT="$CLONE/website/documentation"
    export DATA="hugo/data/v1.${r}.0"

    # In case the latest documentation version set as root.
    if [ "$r" = "$LATESTVERSION" ]; then
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
