#!/bin/bash

#
CLONE="temp"
CLONED_WEBSITE_DIR="${CLONE}/website/*"
CLONED_DOCUMENTATION_PATH="${CLONE}/website/documentation"
HUGO_CONTENT=hugo/content
HUGO_DOCUMENTATION=$HUGO_CONTENT/documentation
#

n=2
r=$((LATESTVERSION - n))

# Clear from previous runs
rm -rf $HUGO_CONTENT
rm -rf $CLONE

npm install
npm prune --production

echo "Cloning from ${FORK}"
git clone "https://github.com/${FORK}/documentation.git" $CLONE

if [[ $BRANCH != "master" ]]; then
  echo "Building site from documentation version ${BRANCH}"
  (cd $CLONE && git checkout origin/${BRANCH} -b ${BRANCH})
fi

# Copy website contents like blogs adopters etc. from desired branch
mkdir $HUGO_CONTENT
cp -r $CLONED_WEBSITE_DIR $HUGO_CONTENT

# Remove documentation, if it is not release we should not replace it
if [[ -d $HUGO_DOCUMENTATION ]]; then
  rm -rf $HUGO_DOCUMENTATION
fi

if [[ $BUILD == "release" ]]; then
  if [[ "$BUILDSINGLEBRANCH" = "true" ]]; then
    # Copy desired doc into hugo/content/documentation
    cp -r $CLONED_DOCUMENTATION_PATH $HUGO_DOCUMENTATION

    # Run docforge to download external files
    docforge -f ${CLONE}/documentation.yaml -d $HUGO_CONTENT --resources-download-path __resources --hugo --github-oauth-token $GIT_OAUTH_TOKEN

    export REMOTE=$HUGO_CONTENT
    export CONTENT=CLONE/website
    export DATA=hugo/data
    echo "Calling nodejs script with \$DATA=$DATA and CONTENT=$CONTENT"
    node ./node/index.js
  else
    echo "Building site from the last ${n} documentation versions"
    while [[ $r -le $LATESTVERSION ]]; do
      echo 'Getting docs from: v1.'"${r}"'.0'
      # Switch to desired release version
      version="v1.${r}.0"
      (cd $CLONE && git checkout "tags/${version}" -b ${version})

      # export CONTENT="$CLONE/website/documentation"
      # export DATA="hugo/data/v1.${r}.0"

      # In case the latest documentation version set as root.
      if [ "$r" = "$LATESTVERSION" ]; then
        version="documentation"
        # export CONTENT="$CLONE/website/"
        # export DATA="hugo/data/"
      fi

      # Copy desired doc into hugo/content/documentation
      cp -r $CLONED_DOCUMENTATION_PATH $HUGO_DOCUMENTATION/$version
      docforge -f ${CLONE}/documentation.yaml -d $HUGO_CONTENT/$version --hugo --github-oauth-token $GIT_OAUTH_TOKEN

      # echo "Calling nojeds script with \$DATA=$DATA and CONTENT=$CONTENT"
      # node ./node/index.js
      ((r = r + 1))
    done
    node ./node/generateVersioningFile.js
  fi
fi

# echo 'Cleaning up temp directory used during this site build.'
# rm -rf temp
