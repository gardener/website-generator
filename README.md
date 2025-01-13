# Hugo website dev and maintenance

## Defining Hugo's directory structure

[Hugo's directory structure](https://gohugo.io/getting-started/directory-structure/) is defined via the docforge manifest ([example](https://github.com/gardener/documentation/blob/master/.docforge/hugo.yaml)).

## Defining docforge configuration

The image builds the website bundle with the help of a docforge config file. It needs to be mounted to the container and it's path provided via `DOCFORGE_CONFIG` environment variable. It contains information like the docforge manifest URL, github auth tokens, content file formats and any docforge customisations ([example](#local-web-server-using-docker-compose-up)).

## Dependency updates

Change `europe-docker.pkg.dev/gardener-project/releases/docforge:<DOCFORGE_VERSION>`, `HUGO_VERSION` and `DOCSY_VERSION` to the desired version and rebuild the image.

# Local web server using `docker compose up`

1. Initially build a local image `docker build -t testing-website-image .` or `docker build --build-arg ARCH=_linux-arm64 -t testing-website-image .` for arm

2. Provide `docforge_config.yaml`
``` yaml
manifest: https://github.com/gardener/documentation/blob/master/.docforge/website.yaml
destination: content
hugo: true
github-oauth-token-map:
  "github.com": <token>
skip-link-validation: true
```

3. Run `docker compose up`

## Local dev using `docker compose up`

If you want to run the web server reflecting local changes done to some cloned repositories you need to go trough the following steps:

1. Adapt `compose.yaml` by adding a volume mount entry for each repository
   ```yaml
    volumes:
    - <path_to_cloned_repo_1>:/resourceMappings/<repo_1>
    - <path_to_cloned_repo_2>:/resourceMappings/<repo_2>
    - ...
   ```
2. Adapt `docforge_config.yaml`
   ```yaml
   resourceMappings:
     <repo_1_url>: /resourceMappings/<repo_1>
     <repo_2_url>: /resourceMappings/<repo_2>
     ...
   ```
