
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
const glob = require('glob')
const fs = require('fs')
const fm = require('front-matter')
const path = require("path")
const request = require('sync-request')
const moment = require('moment');
// const { spawnSync } = require("child_process");

if (!process.env.CONTENT) {
    process.env.CONTENT = path.resolve(__dirname, '/../hugo/content');
}
if (!process.env.DATA) {
    process.env.DATA = path.resolve(__dirname, '../hugo/data');
}

// to avoid some TLS Cert problems for our internal github
//
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const repoCommits = "https://api.github.com/repos/gardener/gardener/commits"

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
} else if ('GIT_USER' in process.env && 'GIT_PASSWORD' in process.env) {
    requestOptions.headers['Authorization'] = "Basic " + new Buffer.from(process.env.GIT_USER + ':' + process.env.GIT_PASSWORD).toString('base64');
} else {
    console.info("GitHub API request are setup for annonymous access. Significant rate limit restriction will apply.");
}

function Users() {
    let userMap = {}
    this.get = function (commit) {
        if (userMap[commit.email] === undefined) {
            console.log("fetching <" + commit.email + "> details from GitHub")
            let fetchedCommit = JSON.parse(request("GET", repoCommits + "/" + commit.sha, requestOptions).getBody().toString());
            userMap[commit.email] = Object.assign(fetchedCommit.author, { "email": commit.email });
        }
        return userMap[commit.email]
    }
    this.set = function (identity, userDetails) {
        userMap[identity] = userDetails
    }
    this.cache = function () {
        return userMap;
    }
}


function isGitlogInternalCommit(commit) {
    return commit.message.startsWith("[int]") || commit.message.indexOf("[skip ci]") > -1 || commit.email.startsWith("gardener.ci");
}

function escapeJSONString(json) {
    return json.split("\n").map(function (l) {
        if (l.indexOf(":") < 0)
            return l
        s = l.split(":")
        v = s[1].trim();
        if (v.length > 0 && v.startsWith('"') && (v.endsWith('",'))) {
            s[1] = '"' + v.substring(1, v.lastIndexOf('"')).replace(/"/g, "'") + '",';
        }
        l = s.join(":")
        return l;
    }).join("\n")
}

// Transforms Git log JSON output to Git info model * /
function transformGitLog(log, users) {
    let escF = escapeJSONString(log);
    let commits = JSON.parse(escF);
    if (!commits || !Array.isArray(commits)) {
        throw Error('bad input obect type:' + (typeof commits))
    }
    let gitInfo;
    // Clean up from internal commits
    commits = commits.filter(function (commit) {
        return commit.email !== undefined && !isGitlogInternalCommit(commit);
    });
    if (!commits || commits.length < 1) {
        return
    }
    //sort by date asc (newest last)
    commits = commits.sort((a, b) => moment(a.date).format('YYYYMMDD') - moment(b.date).format('YYYYMMDD'))
    gitInfo = {
        "lastmod": moment(commits[commits.length - 1].date, "YYYY-MM-DD").format("YYYY-MM-DD"),
        "publishdate": moment(commits[0].date, "YYYY-MM-DD").format("YYYY-MM-DD")
    };
    // transform into contributors list enriched with GitHub user details
    contributors = commits.map(commit => {
        return users.get(commit)
    })
    // store the author (the first contributor)
    gitInfo["author"] = contributors[0];
    // clean undefineds, remove author, backtrack and deduplicate by contributor email or name
    // and store in contributors list
    gitInfo["contributors"] = contributors.filter((contributor, index, self) => {
        return contributor != undefined && contributor.email !== gitInfo["author"].email && index === self.findIndex(t => {
            if (t === undefined) {
                return false;
            }
            return t.email === contributor.email || t.name === contributor.name
        })
    });
    return gitInfo;
}

function saveGitInfoLocal(file, users) {
    console.log(`saving git history for local file ${file}`)
    let gitlog, data
    try {
        gitlog = spawnSync(".ci/gitlog.sh", [process.env.CONTENT, file], { shell: "/bin/bash", timeout: 5 * 60000 });
        data = gitlog.stdout.toString();
        if (data && data.length) {
            let gitInfo = transformGitLog(data, users);
            if (gitInfo && Object.values(gitInfo)) {
                let gitInfoFilePath = file.replace(process.env.CONTENT, process.env.DATA) + ".json"
                fs.mkdirSync(path.dirname(gitInfoFilePath), { recursive: true })
                fs.writeFileSync(gitInfoFilePath, JSON.stringify(gitInfo, null, 2), "utf8");
            } else {
                console.log(`no git info for ${file}`);
            }
        } else {
            throw Error('failed to get valid git log output');
        }
    } catch (err) {
        console.error(`updating git info for ${file} failed: ${err}`);
        console.error(`${data}\n`);
    }
}

// ====================================================
// try to fetch the github changes for the file
// ====================================================
// e.g. https://api.github.com/repos/gardener/gardener/commits?path=README.md
//
function saveGitInfoRemote(file, remoteUrl, users) {
    let commitsUrl = repoCommits
    let relUrl = ""
    if (remoteUrl.endsWith(".git")) {
        remoteUrl = remoteUrl.replace(".git", "/README.md")
    }

    let segments = remoteUrl.replace("https://github.com/", "").split("/")
    let user = segments[0]
    let project = segments[1]

    relUrl = remoteUrl
        .replace("/blob/master", "")
        .replace("https://github.com/" + user + "/" + project, "")
    commitsUrl = ["https://api.github.com/repos", user, project, "commits"].join("/")

    commitsUrl = commitsUrl + "?path=" + relUrl;
    console.debug("Fetching commits", commitsUrl);
    try {
        let commits = request("GET", commitsUrl, requestOptions).getBody().toString()
        if (commits.length > 0) {
            let gitInfo = transformGitHubCommits(commits, users);
            if (gitInfo) {
                gitInfoStr = JSON.stringify(gitInfo, undefined, 2);
                let datafilePath = file.replace(process.env.REMOTE, process.env.DATA) + ".json"
                fs.mkdirSync(path.dirname(datafilePath), { recursive: true })
                console.debug("Writing git info: ", datafilePath);
                fs.writeFileSync(datafilePath, gitInfoStr, "utf8")
            } else {
                console.error("Skip commits json update: unexpected json `[]`", commitsUrl);
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
}

function isGitHubInternalCommit(commit) {
    return commit.message.startsWith("[int]") || commit.message.indexOf("[skip ci]") > -1 || commit.committer.email.startsWith("gardener.ci");
}

/* transforms GitHub API commits model to Git info */
function transformGitHubCommits(commits, users) {
    try {
        commits = JSON.parse(commits);
        if (commits.length > 0) {
            let gitInfo = {};
            // Commits are sorted desc by date
            // Check for lastmodified date, skipping internal commits
            var lastCommit = commits.find(commit => {
                return !isGitHubInternalCommit(commit.commit)
            });
            if (lastCommit !== undefined) {
                gitInfo["lastmod"] = moment(lastCommit.commit.committer.date).format("YYYY-MM-DD HH:mm:ss");
            }
            // Find the first commit that is not internal (should be the last element, but let's be sure)
            let firstCommit;
            for (var i = commits.length - 1; i >= 0; i--) {
                if (!isGitHubInternalCommit(commits[i].commit)) {
                    firstCommit = commits[i];
                    break;
                }
            }
            if (firstCommit !== undefined) {
                gitInfo["publishdate"] = moment(firstCommit.commit.committer.date).format("YYYY-MM-DD HH:mm:ss");
                let author = firstCommit.commit.author;
                if (author !== undefined && firstCommit.author !== undefined) {
                    author = Object.assign(author, firstCommit.author);
                } else {
                    author = firstCommit.committer;
                    author = Object.assign(author, firstCommit.author);
                }
                gitInfo["author"] = author;
            }
            if (commits.length > 1) {
                gitInfo["contributors"] = commits.map(commit => {
                    if (!isGitHubInternalCommit(commit.commit)) {
                        let contributor = commit.commit.author;
                        users.set(contributor.email, contributor)
                        if (contributor !== undefined && commit.author !== undefined) {
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
                }).filter((el, index, self) => {
                    // clean undefineds, backtrack and deduplicate by contributor email or name
                    return el != undefined && index === self.findIndex(t => {
                        if (t === undefined) {
                            return false;
                        }
                        return t.email === el.email || t.name === el.name
                    })
                });
            }
            return gitInfo
        } else {
            console.error("Skip commits json update: unexpected json `[]`");
            console.log("proceeding with next file")
            return
        }
    } catch (err) {
        console.error("Invalid JSON content from", err);
        console.log("proceeding with next file")
        return
    }
}

function processContent() {
    glob(process.env.CONTENT + '/**/*.md', function (err, files) {
        console.log("Fetching content and commits history. This will take a minute..")
        let users = new Users;
        files.forEach(file => {
            let content;
            try {
                content = fm(fs.readFileSync(file, 'utf8'))
            } catch (err) {
                console.error("Failed to read front-matter from", file, err);
                console.log("proceeding with next file")
                return
            }

            saveGitInfoLocal(file, users);
        })

        let contributorsFile = process.env.DATA + "/contributors.json"
        let contributors = Object.values(users.cache());
        if (!fs.existsSync(process.env.DATA)) {
            fs.mkdirSync(process.env.DATA)
        }
        if (contributors) {
            fs.writeFileSync(contributorsFile, JSON.stringify(contributors, null, 2), 'utf8')
        }
    });
}


////
function processContent2() {
    // Parse all files and inline remote MarkDown content.
    //
    console.log("Fetching content and commits history. This will take a minute..")
    let users = new Users;
    glob(process.env.REMOTE + '/**/*.md', function (err, files) {
        files.forEach(file => {
            let content;
            try {
                content = fm(fs.readFileSync(file, 'utf8'))
            } catch (err) {
                console.error("Failed to read front-matter from", file, err);
                console.log("proceeding with next file")
                return
            }
            if (content.attributes.remote) {
                console.log("Remote file " + file)
                saveGitInfoRemote(file, content.attributes.remote, users)

            }
        })
    })

    glob(process.env.CONTENT + '/**/*.md', function (err, files) {
        files.forEach(file => {
            let content;
            try {
                content = fm(fs.readFileSync(file, 'utf8'))
            } catch (err) {
                console.error("Failed to read front-matter from", file, err);
                console.log("proceeding with next file")
                return
            }
            if (content.attributes.remote) {


                saveGitInfoRemote(file, content.attributes.remote, users)

            } else {

                // Update git info for local files
                saveGitInfoLocal(file, users);
            }

            let contributorsFile = process.env.DATA + "/contributors.json"
            let contributors = Object.values(users.cache());
            if (contributors) {
                fs.writeFileSync(contributorsFile, JSON.stringify(contributors, null, 2), 'utf8')
            }
        })


        // Parse all MarkdownFiles and check if any link reference to a remote site which we have imported.
        // In this case we REWRITE the link from REMOTE to LOCAL
        //
        glob(process.env.CONTENT + '/**/*.md', function (err, files) {
            var docPath = path.normalize(process.env.CONTENT)
            var importedMarkdownFiles = []
            // collect all remote links in the "front matter" annotations
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
                    importedMarkdownFiles.push({ file: file.replace(docPath, "/"), remote: content.attributes.remote })
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
                    importedMarkdownFiles.forEach(function (entry) {
                        md = md.split(entry.remote).join("{{< ref \"" + entry.file + "\" >}}")
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

            let contributorsFile = process.env.DATA + "/contributors.json"
            let contributors = Object.values(users.cache());
            if (contributors) {
                fs.writeFileSync(contributorsFile, JSON.stringify(contributors, null, 2), 'utf8')
            }
        })


    });
}



processContent2();



