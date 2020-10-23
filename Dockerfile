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

FROM eu.gcr.io/gardener-project/docforge@sha256:3d440396f0e7bec664bc2c6302a0f3cdd4ff3545155c877c6a6f7738865dc840 as docforge

FROM eu.gcr.io/gardener-project/cc/job-image:1.816.0

COPY --from=docforge /usr/local/bin/docforge /usr/local/bin/docforge
COPY --from=base /usr/local/bin/hugo /usr/local/bin/hugo

RUN apk add --update bash asciidoctor libc6-compat libstdc++ nodejs npm perl \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/bash -D node

VOLUME /src
VOLUME /output

EXPOSE 1313
