FROM  alpine:3.11 as base

RUN apk add curl

ENV HUGO_VERSION=0.74.3
ENV HUGO_TYPE=_extended
ENV HUGO_ID=hugo${HUGO_TYPE}_${HUGO_VERSION}

RUN curl -fsSLO --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_Linux-64bit.tar.gz \
    && curl -fsSL --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_checksums.txt | grep " ${HUGO_ID}_Linux-64bit.tar.gz\$" | sha256sum -c - \
    && tar -xzf ${HUGO_ID}_Linux-64bit.tar.gz \
    && mkdir -p /usr/local/bin \
    && mv ./hugo /usr/local/bin/hugo

FROM eu.gcr.io/gardener-project/docforge:v0.9.0-dev-9b5eb849a1d78b02de8eae6789d417d6c1c11b27 as docforge
FROM registry-1.docker.io/gardenerci/cc-job-image:1.1113.0

COPY --from=docforge /usr/local/bin/docforge /usr/local/bin/docforge
COPY --from=base /usr/local/bin/hugo /usr/local/bin/hugo

RUN apk add --update bash asciidoctor libc6-compat libstdc++

VOLUME /src
VOLUME /output

EXPOSE 1313
