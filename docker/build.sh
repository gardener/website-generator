#!/usr/bin/env bash


PROJECT=gardener-website-generator
# must be switched to a Gardener owned repo
REPOSITORY=freegroup

# causes the shell to exit if any subcommand or pipeline returns a non-zero status.
set -e
# set debug mode
set -x


# get latest version from the Docker registry and increment them
#
VERSION=$(curl https://registry.hub.docker.com/v1/repositories/$REPOSITORY/$PROJECT/tags  | sed -e 's/[][]//g' -e 's/"//g' -e 's/ //g' | tr '}' '\n'  | awk -F: '{print $3}' | grep v| tail -n 1)
VERSION=${VERSION:1}
((VERSION++))
VERSION="v$VERSION"
echo $VERSION


########################################################################################################################
# build the new docker image
########################################################################################################################
#
echo '>>> Building new image'
# Due to a bug in Docker we need to analyse the log to find out if build passed (see https://github.com/dotcloud/docker/issues/1875)
docker build --no-cache=true -t $REPOSITORY/$PROJECT:$VERSION -t $REPOSITORY/$PROJECT:latest . | tee /tmp/docker_build_result.log
RESULT=$(cat /tmp/docker_build_result.log | tail -n 1)
if [[ "$RESULT" != *Successfully* ]];
then
  exit -1
fi

########################################################################################################################
# push the docker image to your registry
########################################################################################################################
#
echo '>>> Push new image'
docker push $REPOSITORY/$PROJECT:$VERSION
docker push $REPOSITORY/$PROJECT:latest

