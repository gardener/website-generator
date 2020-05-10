# Copyright 2018 The Gardener Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Default make target is build-local
.PHONY: 
	@env LOCAL_BUILD=1 .ci/build
# `make setup` creates full local development setup, pulling /documentation and
# /gardener repos if not available and symlinking /documentation/website to /hugo/content.
# Suitable for site-global development beyond content (e.g. hugo layouts, 
# partials, shortcodes etc)
.PHONY: setup
setup:
	@scripts/setup
# `make build` will make a full site build, pulling remote content and rewriting links as appropriate,
# uppdating git info, etc. It is the same operation performed by Concourse when a build job is triggered.
.PHONY: build
build:
	@.ci/build
# `make image-build` builds a new docker image. Use thee $TAG environment variable to specify the image tag. 
# Example: `$ make image-build TAG=v10`
.PHONY: image-build
image-build:
	@scripts/image-build
# `make image-push` pushes a local image to the project GCR repository. An installed and authenticated gcloud tool 
# is required to perform the operation. The image to push is identified by its tag.
# Example: `$ make image-push TAG=v10`
.PHONY: image-push
image-push:
	@scripts/image-push