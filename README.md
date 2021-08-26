# Gardener Website Generator

This repository contains the build tools, configuration, web framework for the website and integration with CI/CD. For site source content including documentation, see the [/gardener/documentation](https://github.com/gardener/documentation/) repo. The website home is [/gardener/website/docs](https://github.com/gardener/website/tree/master/docs).

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

## Build Locally
In most cases when developing site content, you will not need to run the full site build and al you need is a site preview. For the rest of the cases there are several options outlined below.

Feel free to reuse the image utilized by the CI/CD and avoid setting up the tools for the build environment. That has the advantage of keeping you up-to-date with the build setup effortlessly too. Clone the gardener-genrator repo in the contianer and use the [website-generator/scripts/setup](https://github.com/gardener/website-generator/blob/master/scripts/setup) script to setup the other clones as required. After you have cloned the repos in the container, you can reuse the [website-generator/.ci/build](https://github.com/gardener/website-generator/blob/master/.ci/build) script for full scale builds. Currently, there is no end-to-end script for the setup stage, so you have to come up with something yourself mount and run it. Contributions are welcome. 

In other rare case or when you cannot use Docker for some reason, see the procedure below how to setup build environment and run local build.

**Prerequisites**:
- the latest versions of [GitBash](https://gitforwindows.org/) installed
- the latest versions of [GoLang](https://golang.org/dl/) installed
- the latest version of [NodeJS](https://nodejs.org/en/)/[NPM](https://www.npmjs.com/get-npm) installed
- a [local folder setup with a Hugo and Docforge executable](https://github.com/gardener/website-generator#create-a-local-setup-with-hugo-and-docforge-executables) in it
- a [GitHub token](https://github.com/gardener/website-generator#generate-a-github-token) generated for the [public site](https://github.com/)

**Procedure**:
```sh
# Fork (if you plan ot make changes here) and clone this repository locally
$ git clone https://github.com/gardener/website-generator.git

# Change to the cloned repo 
cd website-generator

# Update needed submodules
git submodule update --init --recursive

# Run make (or make setup) to have all necessary repos cloned, and setup (linked) for you automatically as necessary (if they do not exist).
$ make

# It is highly recommended to supply access token before starting the build to avoid Github API rate limit restrictions.
# For basic authentication (deprecated by GitHub), use the `GIT_USER` and `GIT_PASSWORD` instead.   
$ export GIT_OAUTH_TOKEN=<your-github-personal-access-token>

# Set AUTO_PUBLISH to false to instruct the build not to publish changes to the documentation and website repos. This is in the role of CI/CD builds
# and should not be taken over. 
$ export AUTO_PUBLISH=false

$ make build
```
Normally, all steps except `make build` are executed once during the initial setup. After that, the build step can then be executed numerous times.   
The build results are produced in `website/docs`.

## Build Configuration
The build is parameterized by means of environment variables.

#### Locations
The build will apply some heuristics and infer `documentation` and `gardener` are the names of cloned repos that are peer to `website-generator`. To override their paths, use the coresponding environment variables:   
- `GARDENER_DOCUMENTATION_PATH` sets the path to the documentation repo (default: `/documentation`)  
- `GARDENER_WEBSITE_PATH` sets the path to the build output repo (default: `/website`)
- `GARDENER_GENERATOR_PATH` changes the infered location of `website-generator`defaulting to the directory where the build script is executed.
- `CONTENT` The build scripts will assume the source for building the site is available in `hugo/content` (note the symlink content<==> documentation/website we setup earlier). In case you need to override its location, use the `CONTENT` environment variable.

#### GitHub authentication
It is recommended to supply authentication credentials before starting the build to avoid Github API rate limit restrictions.   
For token-based authentication (recommended), use the `GIT_OAUTH_TOKEN` environment variable. 
For basic authentication (deprecated by GitHub), use the `GIT_USER` and `GIT_PASSWORD`.

#### Build results
- `AUTO_PUBLISH` controls the post-build steps publishing the results. Normally it should not be set, unless for the CI/CD pipeline definition build step. To enable, set to `true`.

## Run Site Previews Locally
Site previews aid the process of developing site material or layouts. Similiar to builds, it is recommended to run site previews with docker, using the scripts supplied in `/documentation` for that. In case you can't benefit from that for some reason, the instructions for setting it up manually are listed here. 

**Prerequisites**:
- Cloned `/documentation` and `/website-generator` repos
- Symlink `/website-generator/hugo/content` <==> `/documentation/website`
- [Hugo](https://github.com/gohugoio/hugo/releases) available on your system

The first two prerequisites are automatically ensured by running `make` (or `make setup`). Or you can do that manually.

> Note that the `/website repo` is not necessary to perform this task.

**Procedure**:
```sh
cd website-generator/hugo

$ hugo serve
```
You can now explore the site and your changes upon save at `http://localhost:1313`.

## Windows 10 Users
The instructions above are applicable when using Windows 10 WSL e.g. with Ubuntu. Here are a few hints how to setup your environment accordingly.

### Symlinks in Windows
One of the problematic integration areas in WSL are symbolic links. Despite that a good progress was made it is still necessary to use Windows tools to create symbolic links on a Windows file system. The build and setup scripts above consider WSL environments and will automatically fallback to Windows `mklink` command instead of `ln` if necessary. A prerequisite to the success of this operation is to enable **Windows Developer Mode** (Settings > Update & Security > For developers > Use developer features).

Should you experience problems on this stage, create the symlink manually. The build script will work with existing `content` symlink and not attempt to create one.
To create the `content` symlink in `website-generator` repo clone's `hugo` folder, start CMD as Administrator and make symlink to folder (`/D`)

```
[website-generator-repo-clone-path]>\hugo>mklink /D content <absolute-path-to-gardener-documentation-website-folder>
```
A successfull operation will signal output similiar to this:
```
symbolic link created for content <<===>> <actual-path-on-your-system>\website
```

### Scripts line endings
Note that if you are using **GitBash** it is likely to be configured to change line endings with Windows (CRLF) instead of UNIX (LF) style. You will need to change line endings in the bash scripts you plan to use. If you use VS Code look in the lower right corner and you will notice CRLF, which can be changed to LF. Notepad++ also has a Line Ending change option. Consult with your favorite tool options how to deal with this best.

### Docker
Install **Docker Desktop for Windows** if you plan to make use of the build image to preview changes or run the same full-scale build as the CI/CD.    
A helpful article on setting up WSL to work flawlesly with Desktop Docker for Windows is available [here](https://nickjanetakis.com/blog/setting-up-docker-for-windows-and-wsl-to-work-flawlessly). The list below is a TL;DR; for some key points.
- **Volumes mounting**
    If you plan to use the image you will need to mount at least source content volume and probably a scripts volume. Docker and volume mounting has some subtleties when it comes to Windows. In short, make sure you have the `C:` drive shared in Docker Desktop and **no firewall rule getting in the way**, and ensure that host mount paths start with `/c` and not `/mnt/c`. If you set `WSL=1` before running the scripts, they will try to remove the leading `/mnt`.
- Enable **using the daemon** from Docker Desktop for Windows in WSL.
  1. Go to Docker Desktop > Settings and check the "Expose daemon on tcp://localhost:2375 without TLS" checkbox enabled.
  1. Setup `.bashrc` in WSL with the following environment variable
        ```
        export DOCKER_HOST=tcp://localhost:2375
        ```
## Linked Tutorials

### Create a local setup with Hugo and Docforge executables

1. Download the latest version of Hugo from [GitHub](https://github.com/gohugoio/hugo/releases).
> **Note:** You need to download the extended version.
2. Download the latest version of Docforge from [GitHub](https://github.com/gardener/docforge/releases).
> **Note:** In case of a problem with the executable, here is how to [build your local version of Docforge](https://github.com/gardener/website-generator#build-a-local-docforge-executable).
2. Navigate to Local Disk C.
3. Create a folder there and name it appropriately. 
4. Extract the downloaded archive files into the folder.
5. _(Optional)_ Delete the LICENSE and README files.

### Build a local Docforge executable

1. [Clone](https://github.com/gardener/website-generator#clone-a-repository) the [Docforge repository](https://github.com/gardener/docforge).
2. Open a new GitBash terminal.
3. In the terminal, navigate to the folder where you cloned Docforge.
4. Enter `export LOCAL_BUILD=1 && ./.ci/build`.
5. In your system, open the folder where you cloned Docforge.
6. Open the "bin" folder and copy the "docforge" file there.
7. Paste the file into the folder containing the Hugo executable and 
8. **Optional:** Rename the file to "docforge.exe".

### Generate a Github token

1. Navigate to Profile -> Settings.
2. Navigate to Developer settings -> Personal access tokens.
3. Select "Generate new token".
4. Enter your password.
5. Enter a name for your token.
6. Select an expiration date.
> **Note:** While possible to create a token that never expires, it is advisable to change your tokens every couple of months.
7. Check the "repo" and "admin:repo_hook" checkboxes.
8. Select "Generate token".
9. Copy and save your token. 
> **Note:** This is the only time you will be able to see your token. It is highly recommended to save your token somewhere on your computer.

# Troubleshooting

## Concourse Builds
To troubleshoot failed website production [pipeline](https://concourse.ci.gardener.cloud/teams/gardener/pipelines/gardener-website-generator-master) in Concourse, use `fly`:
1. Download fly (look for `cli:` at the bottom right of the screen at https://concourse.ci.gardener.cloud/) 
1. Login to a target with fly: 
   ```sh
   $ fly -t gardener login -c https://concourse.ci.gardener.cloud/ -n gardener
   ```   
   Fly will request that you login at a URL and automatically intercept a successfull login.
1. Intercept the failed container with 
   ```sh
   $ fly -t gardener hijack -u <url-of-your-build>
   ```
   Example <url-of-your-build> is https://concourse.ci.gardener.cloud/teams/gardener/pipelines/gardener-website-generator-master/jobs/master-head-update-job/builds/102 , where 102 is the number of the build job that you wnat to inspect.
