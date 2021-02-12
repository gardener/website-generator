FROM  alpine:3.11 as base

RUN apk add curl

ENV HUGO_VERSION=0.80.0
ENV HUGO_TYPE=_extended
ENV HUGO_ID=hugo${HUGO_TYPE}_${HUGO_VERSION}

RUN curl -fsSLO --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_Linux-64bit.tar.gz \
    && curl -fsSL --compressed https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_checksums.txt | grep " ${HUGO_ID}_Linux-64bit.tar.gz\$" | sha256sum -c - \
    && tar -xzf ${HUGO_ID}_Linux-64bit.tar.gz \
    && mkdir -p /usr/local/bin \
    && mv ./hugo /usr/local/bin/hugo

FROM eu.gcr.io/gardener-project/docforge:v0.10.0-dev-11d9b41e1a1e2f3e33a2792d627505c3e80e778b as docforge
FROM registry-1.docker.io/gardenerci/cc-job-image:1.1113.0

COPY --from=docforge /usr/local/bin/docforge /usr/local/bin/docforge
COPY --from=base /usr/local/bin/hugo /usr/local/bin/hugo

RUN apk add --update bash asciidoctor libc6-compat libstdc++

VOLUME /src
VOLUME /output

EXPOSE 1313
