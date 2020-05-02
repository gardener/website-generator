
/**
 * Environment variables used in this script:
 * CONTENT:      Path to the website source content. Defaults to "../hugo/content", 
 *               relative to the current directory (`node`).
 * GIT_USER:     The GitHub user for (Basic) authenticated requests to github.com. Useful 
 *               to avoid hitting GitHub API's rate limit. Always used with GIT_PASSWORD.
 *               Deprecation notice: GitHub deprecated user-based authentication.
 * GIT_PASSWORD: The GitHub user password for authenticated requests to github.com. Always used
 *               with GIT_USER. 
 *               Deprecation notice: GitHub deprecated user-based authentication.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
if (!process.env.CONTENT) { 
    process.env.CONTENT = __dirname+'/../hugo/content';
}
const glob = require( 'glob' )
const fs = require('fs')
const fm = require('front-matter')
const path = require("path")
const request = require('sync-request')
const shuffle = require('shuffle-array')

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
        headers: {
            'User-Agent': "NodeJS"
        }
    }
    // Use (Basic) authenticated requests to GitHub API if user credentials are provided
    if (process.env.GIT_USER !== "" && process.env.GIT_PASSWORD !== "") {
        requestOptions.headers['Authorization'] = "Basic " + new Buffer.from(process.env.GIT_USER + ':' + process.env.GIT_PASSWORD).toString('base64')
    }

    files.forEach(function(file){
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
            let md = "";
            try {
                md = fm(request("GET", url).getBody().toString()).body
                md = rewriteAndCheckUrls(url, md, file)
            } catch(err) {
                console.error("Unable to get remote content for",url, err)
                console.log("proceeding with next file")
                return
            }

            let newDoc = [
                "---",
                content.frontmatter,
                "---",
                md].join("\n")
            fs.writeFileSync(file, newDoc, 'utf8');
        }

        // ====================================================
        // try to fetch the github changes for the file
        // ====================================================
        // e.g. https://api.github.com/repos/gardener/gardener/commits?path=README.md
        //
        let commitsUrl = ""
        let relUrl =""
        if (content.attributes.remote){
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
            relUrl =  relUrl.replace(process.env.CONTENT,"/website")
            commitsUrl = repoCommits
        }

        commitsUrl = commitsUrl + "?path=" + relUrl;
        try {
            // console.debug("Fetching commits", commitsUrl);
            let commitsJson = request("GET", commitsUrl, requestOptions).getBody().toString()
            if (commitsJson.length > 0) {
                commits = JSON.stringify(commitsJson,undefined,2);
                fs.writeFileSync(file + ".json", commits, 'utf8');
            } else {
                console.error("Skip commits json update: unexpected json `[]`", commitsUrl);
                console.log("proceeding with next file")
                return
            }
        }
        catch (err){
            console.error("Failed to update commits json from", commitsUrl, err);
            console.log("proceeding with next file")
            return
        }
    })


    // Parse all MarkdownFiles and check if any link reference to an remote site which we have imported.
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
                fs.writeFileSync(file, newDoc, 'utf8');
            }
        })

    })
});

