const fs = require('fs')

const latest = process.env.LATESTVERSION
const oldest = process.env.OLDESTVERSION
var versions = []

if (process.env.BUILDSINGLEBRANCH == "true") {
    versions.push({
        version: process.env.BRANCH,
        dirPath: "documentation",
        url: "/documentation"
    })
}
else {
    for (let i = oldest; i <= latest; i++) {
        version = "v1." + i + ".0"
        versions.push({
            version: version,
            dirPath: i == latest ? "documentation" : version,
            url: i == latest ? "/documentation" : "/" + version,
        })
    }
}

console.log("Generating documentation revisions file for versions")
console.log(JSON.stringify(versions))
fs.writeFile('hugo/data/revisions.json', JSON.stringify(versions), function (err) {
    if (err) throw err;
    console.log('File is created successfully.');
});