# Gardener Website Generator

This repository contains the build tools, coniguration, web framework for the website and integration with CI/CD. For site source content including documentation, see the [/gardener/documentation](https://github.com/gardener/documentation/) repo. The website home is [/gardener/website/docs](https://github.com/gardener/website/tree/master/docs).

## CI/CD Overview

<img style="width:50%" src="images/overview.svg">

The repositories involved in the CI/CD are:
- [/gardener/documentation](https://github.com/gardener/documentation/) is the **Website Source Content** repository. It contains the source content for the website, used by the builder to produce the static HTML to be served. This is the **primary repository for contributions**.
- [/gardener/website-generator](https://github.com/gardener/website-generator)(this repository) is the **Website Generator** repository. It contains the tools, the scripts and build configuration for the website, including all common framework html, styles, javascript and images, as well as the scripts and build configuration for the build environment container image.
- [/gardener/website](https://github.com/gardener/website/) is the **Website** home repository. It hosts the produced website content and is configured to serve it using GitHub Pages.

The website builds and deployments are orchestrated by Concourse CI/CD [pipeline](https://concourse.ci.gardener.cloud/teams/gardener/pipelines/gardener-website-generator-master) and triggered regularly (every 24h) or upon changes in [/gardener/documentation](https://github.com/gardener/documentation) or [/gardener/website-generator](https://github.com/gardener/website-generator) repos. The build results are then pushed to [/gardener/website/docs](https://github.com/gardener/website/tree/master/docs) and served as [GitHub Pages](https://pages.github.com/) site.

## Build
The build and deployment triggered by Concourse goes through the stages described here. Except the first two stages, the rest are all orchestrated by the [./ci/build](https://github.com/gardener/website-generator/blob/master/.ci/build) script.

### Run the website build container 
- Container Image: `eu.gcr.io/gardener-project/gardener-website-generator`
- Environment: see the [Dockerfile](https://github.com/gardener/website-generator/blob/master/Dockerfile) for details. Noteworthy mentions are:
  - [NodeJS](https://nodejs.org/): used for pre-build operations preparing the site content for Hugo. The NodeJS used in the image is based on the following base image: `eu.gcr.io/gardener-project/cpet/node-image:1.0.0`
  - [Hugo](https://gohugo.io/): the static site builder we use to produce the site.

### Clone and setup repositories clones
1. Clone the three repositories locally:
   - [/gardener/documentation](https://github.com/gardener/documentation/)
   - [/gardener/website-generator](https://github.com/gardener/website-generator)
   - [/gardener/website](https://github.com/gardener/website/)
1. Symlink the `website` folder from the `documentation` clone as `content` in the `hugo` folder in `website-generator` clone   
   [website-generator/hugo](https://github.com/gardener/website-generator/tree/master/hugo)/content &rarr; [documentation/website](https://github.com/gardener/documentation/tree/master/website) 

### Run the site pre-build operations
The stage is performed by a [NodeJS](https://github.com/gardener/website-generator/blob/master/node/index.js) script on the website content from [website-generator/hugo](https://github.com/gardener/website-generator/tree/master/hugo)/content (see the symlink step above) and goes through the following phases:    
1. _Fetch remote pages_ configured in the website with front matter property `remote: URL` from other GitHub repositories.
1. _Fetch the git commits_ for all pages. This is later rendered by page components showing contributors and last page update.
1. Parse all files and check if any link references a remote site, which has been imported and _rewrite those links_ to reference the local (imported) page.

### Build the site
The stage is performed by Hugo and goes through the following general phases:
- _transform_ the website content (Markdown) from [website-generator/hugo](https://github.com/gardener/website-generator/tree/master/hugo)/content (see the symlink step above) into static HTML 
- _process shortcodes_ in the content, if any.
- _apply the appropriate layouts_ for the content type and configuration

The result of the site build is output to the `/docs` folder of the [gardener](https://github.com/gardener/website) repo clone.

### Publish changes
The changes to the website home repo clone from previous phase are _staged_, _commited_ and finally _pushed_ to the [gardener](https://github.com/gardener/website) repo, where they are immediately served by GitHub Pages. 

## Build locally
In most cases when developing site content, you will not need to run the full site build and al you need is a site preview. For the rest of the cases there are several options outlined below.

Feel free to reuse the image utilized by the CI/CD and avoid setting up the tools for the build environment. That has the advantage of keeping you up-to-date with the build setup effortlessly too. Clone the gardener-genrator repo in the contianer and use the [website-generator/scripts/setup](https://github.com/gardener/website-generator/blob/master/scripts/setup) script to setup the otehr clones as required. After you have cloned the repos in the container, you can reuse the [website-generator/.ci/build](https://github.com/gardener/website-generator/blob/master/.ci/build) script for full scale builds. Currently, there is no end-to-end script for the setup stage, so you have to come up with something yourself mount and run it. Contributions are welcome. 

In other rare case or when you cannot use Docker for some reason, see the procedure below how to setup build environment and run local build.

1. Fork (if you plan ot make changes here) and clone this repository locally
    ```sh
    git clone https://github.com/gardener/website-generator.git
    ```
1. Change to the cloned repo and run `make` or `make setup` to have all necessary repos fetched and setup (linked) for you automatically.   
   You can do this also manually:
    ```sh
    git clone https://github.com/gardener/documentation.git
    git clone https://github.com/gardener/website.git

    cd  website-generator
    # make a symbolic link from hugo/content to the website content folder
    #
    ln -s ../../documentation/website/ ./hugo/content
    ```
1. Install [Hugo](https://github.com/gohugoio/hugo/releases) and [NodeJS](https://nodejs.org/en/)/[NPM]((https://www.npmjs.com/get-npm)) on your system.   
   **Note**: NdeJS/NPM are required only if you plan a full-scale build or need to preview how a remote page you just added will look like in the website.   
1. Setup the NodeJS scripts with environment variables:   
    **Note**: This stage is required only if you plan a full-scale build or need to preview how a remote page you just added will look like in the website.   
    ```sh
    # <path-to-the-website-folder> is path to the website folder in the documentation repo clone
    export CONTENT=<path-to-gardener-documentation-website-folder>
    # optionally 
    export LOCAL_BUILD=1
    ``` 
    The `LOCAL_BUILD` variable helps the script skip some pre-build operations that are executable only in Concourse and will fail. Failures are non-critical in any way. They just bloat the console output.
1. Run the build with `.ci/build`   
    **Note**: This stage is required only if you plan a full-scale build.   
    The build will apply some heuristics and infer `documentation` and `gardener` are the names of clonded repos that are peer to `website-generator`. To override their paths, use the coresponding environment variables:   
   - `GARDENER_DOCUMENTATION_PATH` for the documentation repo   
   - `GARDENER_WEBSITE_PATH` for the build output

   Similiarly, to override the infered location of `website-generator` use `GARDENER_GENERATOR_PATH`.
1. Run site preview   
    If you plan to use this local setup for previewing changes while developing site material or layouts, navigate to [website-generator/hugo](https://github.com/gardener/website-generator/tree/master/hugo) and run:
    ```sh
    $ hugo serve
    ```
    You can now explore the site and your changes upon save on `http://localhost:1313`.

### Windows 10 users
The instructions above are applicable when using Windows 10 WSL e.g. with Ubuntu. Here are a few hints how to setup your environment accordingly.

#### Symlinks in Windows
To create the `content` symlink in `website-generator` repo clone's `hugo` folder, start CMD as Administrator and make symlink to folder (`/D`)

```
mklink /D content <absolute-path-to-gardener-documentation-website-folder>
```

#### Scripts line endings
Note that if you are using **GitBash** it is likely to be configured to change line endings with Windows (CRLF) instead of UNIX (LF) style. You will need to change line endings in the bash scripts you plan to use. If you use VS Code look in the lower right corner and you will notice CRLF, which can be changed to LF. Notepad++ also has a Line Ending change option. Consult with your favorite tool options how to deal with this best.

#### Docker
Install **Docker Desktop for Windows** if you plan to make use of the build image to preview changes or run the same full-scale build as the CI/CD.    
A helpful article on setting up WSL to work flawlesly with Desktop Docker for Windows is available [here](https://nickjanetakis.com/blog/setting-up-docker-for-windows-and-wsl-to-work-flawlessly). The list below is a TL;DR; for key points and SAP-speciffic issues.
- **Volumes mounting**
    If you plan to use the image you will need to mount at least source content volume and probably a scripts volume. Docker and volume mounting has some subtleties when it comes to Windows. In short, make sure you have the `C:` drive shared in Docker Desktop and **no firewall rule getting in the way**, and ensure that host mount paths start with `/c` and not `/mnt/c`. If you set `WSL=1` before running the scripts, they will try to remove the leading `/mnt`.
- Enable **using the daemon** from Docker Desktop for Windows in WSL.
  1. Go to Docker Desktop > Settings and check the "Expose daemon on tcp://localhost:2375 without TLS" checkbox enabled.
  1. Setup `.bashrc` in WSL with the following environment variable
        ```
        export DOCKER_HOST=tcp://localhost:2375
        ```

# Troubleshooting

## Concourse Builds
To troubleshoot failed website production [pipeline](https://concourse.ci.gardener.cloud/teams/gardener/pipelines/gardener-website-generator-master) in Concourse, use `fly`:
1. Download fly (look for `cli:` at the bottom right of the screen at https://concourse.ci.gardener.cloud/) 
1. Login to a target with fly: 
   ```sh
   $ fly -t internal-gardener login -c https://concourse.ci.gardener.cloud/ -n gardener
   ```   
   Fly will request that you login at a URL and automatically intercept a successfull login.
1. Intercept the failed container with 
   ```sh
   $ fly -t internal-gardener hijack -u <url-of-your-build>
   ```
   Example <url-of-your-build> is https://concourse.ci.gardener.cloud/teams/gardener/pipelines/gardener-website-generator-master/jobs/master-head-update-job/builds/102 , where 102 is the number of the build job that you wnat to inspect.