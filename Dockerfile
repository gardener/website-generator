FROM europe-docker.pkg.dev/gardener-project/releases/3rd/alpine:3.20.1 as base

RUN apk add curl

ENV HUGO_VERSION=0.137.1
ENV HUGO_TYPE=_extended
ENV HUGO_ID=hugo${HUGO_TYPE}_${HUGO_VERSION}

RUN curl -fsSLO --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_linux-arm64.tar.gz \
    && curl -fsSL --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_checksums.txt | grep " ${HUGO_ID}_linux-arm64.tar.gz\$" | sha256sum -c - \
    && tar -xzf ${HUGO_ID}_linux-arm64.tar.gz \
    && mkdir -p /usr/local/bin \
    && mv ./hugo /usr/local/bin/hugo

FROM europe-docker.pkg.dev/gardener-project/releases/docforge:v0.46.0 as docforge
FROM europe-docker.pkg.dev/gardener-project/releases/cicd/job-image:latest

ARG DOCSY_VERSION=v0.11.0

COPY --from=docforge /docforge /usr/local/bin/docforge
COPY --from=base /usr/local/bin/hugo /usr/local/bin/hugo

RUN apk add --update bash asciidoctor libc6-compat libstdc++ gcompat nodejs npm git

EXPOSE 1313

COPY hugo/package.json hugo/package.json

RUN mkdir -p hugo/themes && cd hugo/themes && git clone https://github.com/google/docsy.git && cd docsy && git checkout "${DOCSY_VERSION}" && cd ../.. && npm install && cd themes/docsy && npm install

WORKDIR /hugo

CMD rm -rf content && docforge && if [ -n "$BUILD_DESTINATION" ]; then hugo --minify --destination "$BUILD_DESTINATION"; else hugo serve $HUGO_FLAGS; fi