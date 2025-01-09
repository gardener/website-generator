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

# Dev using `docker compose up`

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

If you want to make ad-hock changes to the website add the following volume mount entry. Chaning files in `<path_to_locally_placed_hugo>` will trigger website rebuild:

```yaml
volumes:
- <path_to_locally_placed_hugo>:/hugo 
```