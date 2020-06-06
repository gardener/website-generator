
/**
 * Environment variables used in this script:
 * CONTENT:         Path to the website source content. Defaults to "../hugo/content", 
 *                  relative to the current directory (`node`).
 * DATA:            Path to the website internal 'data' directory, which is used to store 
 *                  site-building relevant data such as commits history. Defaults to 
 *                  "../hugo/data", relative to the current directory (`node`). 
 * GIT_OAUTH_TOKEN: The GitHub Personal Access Token for OAuth authenticated requests to 
 *                  github.com. GIT_OAUTH_TOKEN takes priority if GIT_USER/PASSWORD are 
 *                  also specified.
 * GIT_USER:        The GitHub user for Basic authenticated requests to github.com. Useful 
 *                  to avoid hitting GitHub API's rate limit. Always used with GIT_PASSWORD.
 *                  Deprecation notice: GitHub deprecated Basic authentication.
 * GIT_PASSWORD:    The GitHub user password for Basic authenticated requests to github.com.
 *                  Always used with GIT_USER. 
 *                  Deprecation notice: GitHub deprecated Basic authentication.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const glob = require( 'glob' )
const fs = require('fs')
const fm = require('front-matter')
const path = require("path")
const request = require('sync-request')
const shuffle = require('shuffle-array')
const moment = require('moment');

if (!process.env.CONTENT) { 
    process.env.CONTENT = path.resolve(__dirname, '/../hugo/content');
}
if (!process.env.DATA) { 
    process.env.DATA = path.resolve(__dirname, '../hugo/data');
}

const rewriteAndCheckUrls = require("./util/rewriteAbsoluteToUrls")

// to avoid some TLS Cert problems for our internal github
//
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const repoCommits = "https://api.github.com/repos/gardener/documentation/commits"


// Parse all files and inline remote MarkDown content.
//
glob( process.env.CONTENT+'/**/*.md', function( err, files ) {
    // We must shuffle the files to process them in a random order...WHY THIS HACK?
    //
    // Github.com has some rate limits/hour. But we want to fetch the github commit statistic
    // for each file. At a dedicated point the github fetch is banned and we didn't get
    // any info about the commits. In this case we cache the statistic for each file and try to update
    // the files in a random order. With this strategy, the statistic get better and better for
    // each build - WHAT A HACK!!!!!!!
    shuffle(files)

    console.log("Fetching remote content and commits history. This will take a minute..")    

    let requestOptions = {
        timeout: 10000,
        headers: {
            'User-Agent': "NodeJS",
            "Accept": "application/json"
        }
    }
    // Use authenticated requests to GitHub API if user token or credentials are provided
    if ('GIT_OAUTH_TOKEN' in process.env) {
        requestOptions.headers['Authorization'] = "token " + process.env.GIT_OAUTH_TOKEN;
    } else if ('GIT_USER' in process.env && 'GIT_PASSWORD' in process.env){
        requestOptions.headers['Authorization'] = "Basic " + new Buffer.from(process.env.GIT_USER + ':' + process.env.GIT_PASSWORD).toString('base64');
    } else {
        console.info("GitHub API request are setup for annonymous access. Significant rate limit restriction will apply.");
    }

    files.forEach(function(file, idx, filesArr){
        let content;
        try {
            content = fm(fs.readFileSync(file, 'utf8'))
        } catch (err) {
            console.error("Failed to read front-matter from", file, err);
            console.log("proceeding with next file")
            return
        }
        if (content.attributes.remote) {
            // transform a normal URL of a file to the RAW version.
            //
            let url = content.attributes.remote

            // we reference a complete repository. In this case we fetch the README.md and inline them
            //
            if(url.endsWith(".git")){
                url = url.replace(".git","/blob/master/README.md")
            }

            // The url points to an external github wiki.
            // works just for external GITHUB
            //
            if(url.indexOf("/wiki/")!==-1) {
                // Check if we got a link to a GitHub wiki page. In this case we must transform them
                // to the RAW version as well
                // e.g. IN: https://github.com/gardener/documentation/wiki/Architecture
                //     OUT: https://raw.githubusercontent.com/wiki/gardener/documentation/Architecture.md
                let segments = url.replace("https://github.com/","").split("/")
                let user = segments[0]
                let project = segments[1]
                let doc = segments.slice(3).join("/")+".md"
                url = "https://raw.githubusercontent.com/wiki/"+user+"/"+project+"/"+doc
            }
            else {
                // Required to fetch the plain MarkDown instead of the rendered version
                // Replace the "normal" github URL with the "RAW" API Link
                //
                url = url
                        .replace("https://github.com/" ,"https://raw.githubusercontent.com/")
                        .replace("/blob/master/", "/master/")
                        .replace("/tree/master/", "/master/")
            }

            // Get the content of the referenced MD file and append it to the
            // Hugo CMS page
            //
            try {
                var remoteContent = fm(request("GET", url).getBody().toString()).body
                remoteContent = rewriteAndCheckUrls(url, remoteContent, file)
            } catch(err) {
                console.error("Unable to get remote content for",url, err)
                console.log("proceeding with next file")
                return
            }

            // Finally, write the file
            let newDoc = [
                "---",
                content.frontmatter,
                "---",
                remoteContent].join("\n")
            console.log("writing remote content to", file)
            fs.writeFileSync(file, newDoc, 'utf8');
        }

        // ====================================================
        // try to fetch the github changes for the file
        // ====================================================
        // e.g. https://api.github.com/repos/gardener/gardener/commits?path=README.md
        //
        let commitsUrl = repoCommits
        let relUrl = ""
        if (content.attributes.remote) {
            let changesUrl = content.attributes.remote;
            if (changesUrl.endsWith(".git")) {
                changesUrl = changesUrl.replace(".git", "/README.md")
            }

            let segments = changesUrl.replace("https://github.com/", "").split("/")
            let user = segments[0]
            let project = segments[1]

            relUrl = changesUrl
                .replace("/blob/master", "")
                .replace("https://github.com/" + user + "/" + project, "")
            commitsUrl = ["https://api.github.com/repos", user, project, "commits"].join("/")

        } else {
            relUrl = file.replace(process.env.CONTENT,"/website")
        }

        commitsUrl = commitsUrl + "?path=" + relUrl;
        console.debug("Fetching commits", commitsUrl);
        try {
            let commits = request("GET", commitsUrl, requestOptions).getBody().toString()
            if (commits.length > 0) {
                try {
                    commits = JSON.parse(commits);
                    if (commits.length > 0) {
                        let gitInfo = {};
                        // Commits are sorted desc by date
                        // Check for lastmodified date, skipping internal commits
                        var lastCommit = commits.find( commit => {
                            return !isInternalCommit(commit.commit)
                        });
                        if (lastCommit !== undefined) {
                            gitInfo["lastmod"] = moment(lastCommit.commit.committer.date).format("YYYY-MM-DD HH:mm:ss");
                        }
                        // Update front-matter if necesary
                        // Find the first committhat is not internal (should be the last element, but let's be sure)
                        let firstCommit;
                        for ( var i = commits.length-1; i >= 0; i-- ) {
                            if (!isInternalCommit(commits[i].commit)) {
                                firstCommit = commits[i];
                                break;
                            }
                        }
                        if (firstCommit !== undefined){
                            gitInfo["publishdate"] = moment(firstCommit.commit.committer.date).format("YYYY-MM-DD HH:mm:ss");
                            let author = firstCommit.commit.author;
                            if (author !== undefined && firstCommit.author !== undefined){
                                author = Object.assign(author, firstCommit.author);
                            } else {
                                author = firstCommit.committer;
                                author = Object.assign(author, firstCommit.author);
                            } 
                            gitInfo["author"] = author;
                        }
                        if (commits.length > 1) {
                            gitInfo["contributors"] = commits.map(commit => {
                                if( !isInternalCommit(commit.commit) ){
                                    let contributor = commit.commit.author;
                                    if (contributor !== undefined && commit.author !== undefined){
                                        contributor = Object.assign(contributor, commit.author);
                                    } else {
                                        contributor = commit.commit.committer;
                                        contributor = Object.assign(contributor, commit.committer);
                                    } 
                                    if (contributor.email !== gitInfo["author"].email) {
                                        return contributor;
                                    }
                                }
                                return
                            }).filter( (el, index, self) => {
                                // clean undefineds, backtrack and deduplicate by contributor email or name
                                return el != undefined && index === self.findIndex( t => {
                                    if ( t === undefined ){
                                        return false;
                                    }
                                    return t.email === el.email || t.name === el.name
                                })
                            });
                        }
                        gitInfoStr = JSON.stringify(gitInfo, undefined, 2);
                        datafilePath = file.replace(process.env.CONTENT, process.env.DATA) + ".json"
                        fs.mkdirSync(path.dirname(datafilePath), { recursive: true })
                        fs.writeFileSync(datafilePath, gitInfoStr)
                        console.debug("Writing git info: ", datafilePath);
                    } else {
                        console.error("Skip commits json update: unexpected json `[]`", commitsUrl);
                        console.log("proceeding with next file")
                        return
                    }
                } catch (err){                          
                    console.error("Invalid JSON content from", commitsUrl, err);
                    console.log("proceeding with next file")
                    return
                }
            } else {
                console.error("Skip commits json update: unexpected json `[]`", commitsUrl);
                console.log("proceeding with next file")
                return
            }
        } catch (err) {
            console.error("Failed to update commits json from", commitsUrl, err);
            console.log("proceeding with next file")
            return
        }
    })

    // Parse all MarkdownFiles and check if any link reference to a remote site which we have imported.
    // In this case we REWRITE the link from REMOTE to LOCAL
    //
    glob(process.env.CONTENT + '/**/*.md', function( err, files ) {
        var docPath = path.normalize(process.env.CONTENT)
        var importedMarkdownFiles = []
        // collect all remote links in the "front matter" annotations
        //
        files.forEach(function (file) {
            let content;
            try{
                content = fm(fs.readFileSync(file, 'utf8'));
            } catch (err) {
                console.error("Failed to read front-matter from", file, err);
                console.log("proceeding with next file")
                return
            }
            if (content.attributes.remote) {
                importedMarkdownFiles.push({file:file.replace(docPath,"/"),remote:content.attributes.remote})
            }
        })

        // check if any MD files referer to a imported page. In this case we rewrite the link to the
        // internal document
        //
        files.forEach(function (file) {
            let content;
            try {
                content = fm(fs.readFileSync(file, 'utf8'));
            } catch (err) {
                console.error("Failed to read front-matter from", file, err);
                console.log("proceeding with next file")
                return
            }
            if (content.attributes.remote) {
                let md = content.body;
                importedMarkdownFiles.forEach(function(entry){
                    md = md.split(entry.remote).join("{{< ref \""+entry.file+"\" >}}")
                })
                let newDoc = [
                    "---",
                    content.frontmatter,
                    "---",
                    md].join("\n")
                console.log("updating content in", file)
                fs.writeFileSync(file, newDoc, 'utf8');
            }
        })

    })
});

function isInternalCommit(commit){
    return commit.message.startsWith("[int]") || commit.message.indexOf("[skip ci]") > -1;
}