const fs = require('fs')



var versions = []
if (process.env.BUILDSINGLEBRANCH == "true") {
    versions.push({
        version: process.env.BRANCH,
        dirPath: "documentation",
        url: "/documentation"
    })
}
else {
    var file = fs.readFileSync('latestDocVersions').toString()
    var versionsFromFile = file.split("\n")
    var data = versionsFromFile.filter(function (version) {
        return version.length > 0
    });
    var n = 1
    if (process.env.RELEASES_COUNT != undefined && process.env.RELEASES_COUNT > 0) {
        n = process.env.RELEASES_COUNT
    }
    if (data.length < n) {
        n = data.length
    }
    for (let i = 0; i < n; i++) {
        version = data[i]
        versions.push({
            version: version,
            dirPath: i == 0 ? "documentation" : version,
            url: i == 0 ? "/documentation" : "/" + version,
        })
    }
}

console.log("Generating documentation revisions file for versions")
console.log(JSON.stringify(versions))
fs.writeFile('hugo/data/revisions.json', JSON.stringify(versions), function (err) {
    if (err) throw err;
    console.log('File is created successfully.');
});