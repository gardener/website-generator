FROM eu.gcr.io/gardener-project/cpet/node-image:1.0.0

ADD https://github.com/gohugoio/hugo/releases/download/v0.45.1/hugo_0.45.1_Linux-ARM64.tar.gz /hugo/

RUN cd /hugo;                                 \
    tar xzf ./hugo_0.45.1_Linux-ARM64.tar.gz
